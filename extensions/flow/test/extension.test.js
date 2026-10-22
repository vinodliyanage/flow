const assert = require('node:assert/strict');
const { before, test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { Registry } = require('vscode-textmate');
const oniguruma = require('vscode-oniguruma');
const { findUseReferences } = require('../extension');

const root = path.join(__dirname, '..');
const read = filename => JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'));
let registry;
let flow;
let markdown;

before(async () => {
  const wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const hostMarkdown = process.env.FLOW_MARKDOWN_GRAMMAR
    ? JSON.parse(fs.readFileSync(process.env.FLOW_MARKDOWN_GRAMMAR, 'utf8'))
    : { scopeName: 'text.html.markdown', patterns: [
      { name: 'markup.inline.raw.string.markdown', begin: '`', end: '`' },
      { name: 'markup.fenced_code.block.markdown', begin: '^(`{3,}|~{3,}).*$', end: '^\\1[ \\t]*$' }
    ] };
  const grammars = {
    'source.flow': read('syntaxes/flow.tmLanguage.json'),
    'markdown.flow': read('syntaxes/flow-markdown.tmLanguage.json'),
    'text.html.markdown': hostMarkdown
  };
  registry = new Registry({
    onigLib: Promise.resolve({
      createOnigScanner: patterns => new oniguruma.OnigScanner(patterns),
      createOnigString: text => new oniguruma.OnigString(text)
    }),
    loadGrammar: async scope => grammars[scope] || null,
    getInjections: scope => scope === 'text.html.markdown' ? ['markdown.flow'] : []
  });
  flow = await registry.loadGrammar('source.flow');
  markdown = await registry.loadGrammar('text.html.markdown');
});

function tokenize(grammar, source) {
  let state = null;
  return source.split('\n').map(line => {
    const result = grammar.tokenizeLine(line, state);
    state = result.ruleStack;
    return result.tokens;
  });
}

function scopes(tokens, column) {
  return tokens.find(token => token.startIndex <= column && token.endIndex > column)?.scopes || [];
}

function hasScope(tokens, scope) {
  return tokens.some(token => token.scopes.includes(scope));
}

test('built-in command scopes require lowercase keywords', () => {
  const cases = {
    ask: 'ask "Name?" as @name', set: 'set count = 0', do: 'do Review @name. as @result',
    print: 'print @result', context: 'context as @background', use: 'use common.flow', if: 'if true',
    else: 'else', repeat: 'repeat 0 times', while: 'while false', continue: 'continue',
    break: 'break', return: 'return "Done"', run: 'run python3 - @name',
    async: 'async frontend', await: 'await frontend', command: 'command GREET',
    flow: 'flow greet'
  };
  for (const [command, source] of Object.entries(cases)) {
    assert.ok(hasScope(tokenize(flow, source)[0], 'keyword.control.flow.' + command.toLowerCase()), command);
    const uppercase = command.toUpperCase() + source.slice(command.length);
    assert.ok(!hasScope(tokenize(flow, uppercase)[0], 'keyword.control.flow.' + command), uppercase);
  }
  for (const command of ['WAIT', 'CHECK', 'STOP', 'SHELL', 'THINK', 'RULES', 'FINALLY', 'FUNCTION']) {
    const tokens = tokenize(flow, command + ' value')[0];
    assert.ok(!tokens.some(token => token.scopes.some(scope => scope.startsWith('keyword.control.flow.'))), command);
  }
});

test('only a trailing as @name marks a destination; ordinary English and quoted text remain data', () => {
  const source = [
    'do Review this as a senior developer as @review',
    'do Describe this as summary',
    'do Include the phrase "as @review" in the explanation.',
    'ask "What do you work as?" as @role',
    'do Review @review as @review',
    'do Review the implementation.',
    '    Explain it as simply as possible as @explanation'
  ];
  for (const [grammar, text, offset] of [
    [flow, source.join('\n'), 0],
    [markdown, ['```flow', ...source, '```'].join('\n'), 1]
  ]) {
    const tokens = tokenize(grammar, text).slice(offset);
    for (const line of [0, 3, 4, 6]) {
      const column = source[line].lastIndexOf('@');
      assert.ok(scopes(tokens[line], column).includes('variable.other.flow'), source[line]);
      assert.ok(!scopes(tokens[line], column).includes('variable.other.reference.flow'), source[line]);
    }
    assert.ok(!hasScope(tokens[1], 'keyword.other.flow'));
    assert.ok(!hasScope(tokens[2], 'keyword.other.flow'));
    assert.ok(scopes(tokens[2], source[2].indexOf('@')).includes('string.quoted.double.flow'));
    assert.ok(scopes(tokens[4], source[4].indexOf('@')).includes('variable.other.reference.flow'));
  }
});

test('malformed bindings and field destinations receive no binding scope or Markdown navigation', () => {
  for (const source of [
    'do Review this as result',
    'do Review this as @result.summary', 'do Review this as @Result',
    'do Review this as @result extra', 'ask "Name?" as name'
  ]) {
    assert.ok(!hasScope(tokenize(flow, source)[0], 'keyword.other.flow'), source);
  }
  for (const source of [
    'Use guide.md as @guide', 'use guide.md as guide',
    'use guide.md as @guide.section'
  ]) {
    assert.deepEqual(findUseReferences(source), [], source);
    assert.ok(!hasScope(tokenize(flow, source)[0], 'markup.underline.link.flow'), source);
  }
});

test('run and context headers bind destinations without parsing their literal bodies', () => {
  const source = [
    'if true',
    '    context as @guide',
    '        use hidden.md as @data',
    '        as @literal',
    '    run tool "as @literal" @input as @output',
    '        use hidden.flow',
    '    use notes.md#next-steps as @notes',
    'print @notes'
  ];
  for (const [grammar, text, offset, inMarkdown] of [
    [flow, source.join('\n'), 0, false],
    [markdown, ['```flow', ...source, '```'].join('\n'), 1, true]
  ]) {
    const tokens = tokenize(grammar, text).slice(offset);
    for (const line of [1, 4, 6]) {
      assert.ok(scopes(tokens[line], source[line].lastIndexOf('@')).includes('variable.other.flow'));
    }
    assert.ok(scopes(tokens[4], source[4].indexOf('@literal')).includes('string.quoted.double.flow'));
    assert.ok(scopes(tokens[4], source[4].indexOf('@input')).includes('variable.other.reference.flow'));
    for (const line of [2, 3, 5]) {
      assert.ok(hasScope(tokens[line], 'meta.literal.block.flow'));
      assert.ok(!hasScope(tokens[line], 'variable.other.flow'));
    }
    const links = findUseReferences(text, inMarkdown);
    assert.equal(links.length, 1);
    assert.equal(links[0].line, 6 + offset);
    assert.equal(links[0].filename, 'notes.md');
    assert.equal(links[0].fragment, 'next-steps');
    assert.equal(text.split('\n')[links[0].line].slice(links[0].start, links[0].end), 'notes.md#next-steps');
  }
});

test('aligned run/context bindings highlight outside literal bodies and restore use navigation', () => {
  const source = [
    'if true',
    '    context',
    '        use hidden.md as @data',
    '        as @literal',
    '        ###',
    '        """',
    '    as @guide',
    '    run sh',
    '        use hidden.flow',
    '        as @shell_data',
    '        ###',
    '    as @host_result',
    '    run uname -s',
    '    as @system',
    '    use notes.md#next-steps as @notes',
    'print @system'
  ];
  for (const [grammar, text, offset, inMarkdown] of [
    [flow, source.join('\n'), 0, false],
    [markdown, ['```flow', ...source, '```'].join('\n'), 1, true]
  ]) {
    const tokens = tokenize(grammar, text).slice(offset);
    assert.ok(hasScope(tokens[1], 'keyword.control.flow.context'));
    for (const line of [2, 3, 4, 5, 8, 9, 10]) {
      assert.ok(hasScope(tokens[line], 'meta.literal.block.flow'), source[line]);
      assert.ok(!tokens[line].some(token => token.scopes.some(scope =>
        /^(keyword|variable|comment|markup\.underline|string)/.test(scope))), source[line]);
    }
    for (const line of [6, 11, 13]) {
      assert.ok(hasScope(tokens[line], 'keyword.other.flow'), source[line]);
      assert.ok(hasScope(tokens[line], 'variable.other.flow'), source[line]);
      assert.ok(!hasScope(tokens[line], 'entity.name.function.flow'), source[line]);
      assert.ok(!hasScope(tokens[line], 'variable.other.reference.flow'), source[line]);
    }
    assert.ok(hasScope(tokens[15], 'keyword.control.flow.print'));
    const links = findUseReferences(text, inMarkdown);
    assert.deepEqual(links.map(({ filename, fragment, line }) => ({ filename, fragment, line })), [
      { filename: 'notes.md', fragment: 'next-steps', line: 14 + offset }
    ]);
  }
});

test('both context layouts keep binding-like literal text unparsed at different nesting levels', () => {
  for (const indent of ['', '    ', '        ']) {
    for (const placement of ['header', 'after-body']) {
      const source = [
        indent + 'context' + (placement === 'header' ? ' as @guide' : ''),
        indent + '    use hidden.flow',
        indent + '    as @literal',
        ...(placement === 'after-body' ? ['', indent + 'as @guide'] : []),
        indent + 'use visible.flow'
      ];
      for (const [grammar, text, offset, inMarkdown] of [
        [flow, source.join('\n'), 0, false],
        [markdown, ['```flow', ...source, '```'].join('\n'), 1, true]
      ]) {
        const tokens = tokenize(grammar, text).slice(offset);
        const bindingLine = placement === 'header' ? 0 : 4;
        assert.ok(hasScope(tokens[bindingLine], 'variable.other.flow'));
        assert.ok(hasScope(tokens[1], 'meta.literal.block.flow'));
        assert.ok(hasScope(tokens[2], 'meta.literal.block.flow'));
        assert.ok(!hasScope(tokens[2], 'variable.other.flow'));
        assert.deepEqual(findUseReferences(text, inMarkdown).map(ref => ref.filename), ['visible.flow']);
      }
    }
  }
});

test('references, bindings, custom commands, JSON strings and Boolean operators tokenize', () => {
  assert.ok(hasScope(tokenize(flow, 'set count = 1')[0], 'variable.other.flow'));
  assert.ok(hasScope(tokenize(flow, 'print @order.total')[0], 'variable.other.reference.flow'));
  const string = tokenize(flow, 'print ' + JSON.stringify('@name "text"'))[0];
  assert.ok(hasScope(string, 'string.quoted.double.flow'));
  assert.ok(hasScope(string, 'constant.character.escape.flow'));
  assert.ok(!hasScope(string, 'variable.other.reference.flow'));
  const operator = tokenize(flow, 'if not @approved or (@total >= 1 and true)')[0];
  assert.ok(hasScope(operator, 'keyword.operator.flow'));
  assert.ok(hasScope(operator, 'constant.language.flow.true'));
  assert.ok(hasScope(tokenize(flow, 'TRIM @name as @name')[0], 'entity.name.function.flow'));
  assert.ok(!hasScope(tokenize(flow, 'set x = trim("x")')[0], 'support.function.flow'));
});

test('labels, references, commands, and quoted strings have explicit default colors', () => {
  const rules = read('package.json').contributes.configurationDefaults
    ['editor.tokenColorCustomizations'].textMateRules;
  const colorFor = scope => rules.find(rule => rule.scope === scope ||
    (Array.isArray(rule.scope) && rule.scope.includes(scope)))?.settings.foreground;
  assert.equal(colorFor('variable.other.flow'), '#9CDCFE');
  assert.equal(colorFor('variable.other.reference.flow'), '#9CDCFE');
  assert.equal(colorFor('entity.name.function.flow'), '#DCDCAA');
  assert.equal(colorFor('keyword.control.flow.command'), '#B392F0');
  assert.equal(colorFor('keyword.control.flow.flow'), '#34D399');
  assert.equal(colorFor('string.quoted.double.flow'), '#98C379');
  assert.equal(colorFor('string.quoted.triple.flow'), '#98C379');
  assert.equal(colorFor('meta.literal.block.flow'), undefined);
});

test('exact print parts and prose print highlight in Flow files and Markdown fences', () => {
  for (const source of ['print "Hello:" @name', 'print Say hello to @name.']) {
    for (const [grammar, text, line] of [
      [flow, source, 0],
      [markdown, ['```flow', source, '```'].join('\n'), 1]
    ]) {
      const tokens = tokenize(grammar, text)[line];
      assert.ok(hasScope(tokens, 'keyword.control.flow.print'));
      assert.ok(scopes(tokens, source.indexOf('@name')).includes('variable.other.reference.flow'));
      if (source.includes('"Hello:"')) {
        assert.ok(scopes(tokens, source.indexOf('Hello:')).includes('string.quoted.double.flow'));
      }
    }
  }
  const source = 'print "Literal @name:" @name';
  const tokens = tokenize(flow, source)[0];
  assert.ok(!scopes(tokens, source.indexOf('@name')).includes('variable.other.reference.flow'));
  assert.ok(scopes(tokens, source.lastIndexOf('@name')).includes('variable.other.reference.flow'));
  assert.deepEqual(findUseReferences('print "use hidden.flow" @name\nuse visible.flow')
    .map(reference => reference.filename), ['visible.flow']);
});

test('context and run bodies stay literal, then normal highlighting resumes', () => {
  const source = [
    'context as @context', '    use hidden.flow', '    ###', '    @name', '',
    'run python3 - @name as @result', '    use hidden.flow', '    as @fake', '    ###',
    '    print @name', '', 'print @result.stdout'
  ].join('\n');
  const tokens = tokenize(flow, source);
  for (const line of [1, 2, 3, 6, 7, 8, 9]) {
    assert.ok(hasScope(tokens[line], 'meta.literal.block.flow'), `literal line ${line}`);
    assert.ok(!tokens[line].some(token => token.scopes.some(scope => /^(keyword|variable|markup\.underline)/.test(scope))));
  }
  assert.ok(hasScope(tokens[0], 'variable.other.flow'));
  assert.ok(hasScope(tokens[5], 'variable.other.reference.flow'));
  assert.ok(hasScope(tokens[5], 'variable.other.flow'));
  assert.ok(hasScope(tokens[11], 'keyword.control.flow.print'));
  assert.deepEqual(findUseReferences(source), []);
});

test('multiline comments and prose continuations do not create use links', () => {
  const source = [
    '###', 'use comment.flow', 'await task', '###',
    'do Explain the following words.', '    use continuation.flow', '',
    'use visible.flow', 'do Keep # as prose.'
  ].join('\n');
  const tokens = tokenize(flow, source);
  assert.ok(hasScope(tokens[1], 'comment.block.flow'));
  assert.ok(!hasScope(tokens[5], 'markup.underline.link.flow'));
  assert.ok(!hasScope(tokens[8], 'comment.line.number-sign.flow'));
  assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
});

test('use links include Markdown sections and spaces, with exact source ranges', () => {
  const source = '    use common/prepare greeting.flow\nuse rules/project guide.md#bug-fixes as @guide\nuse notes.md as @notes';
  const references = findUseReferences(source);
  assert.deepEqual(references.map(({ filename, fragment }) => ({ filename, fragment })), [
    { filename: 'common/prepare greeting.flow', fragment: undefined },
    { filename: 'rules/project guide.md', fragment: 'bug-fixes' },
    { filename: 'notes.md', fragment: undefined }
  ]);
  const lines = source.split('\n');
  for (const reference of references) {
    assert.equal(lines[reference.line].slice(reference.start, reference.end),
      reference.filename + (reference.fragment ? '#' + reference.fragment : ''));
  }
});

test('Markdown Flow fences highlight and link; prose, inline code and other fences do not', () => {
  const source = [
    'use outside.flow', '`await inline`', '```python', 'use python.flow', '```',
    '````flow', 'context as @guide', '    use literal.flow', '', 'await frontend',
    'use real.flow', '`````', 'await outside',
    '  ~~~flow', '  use other.md#section as @guide', '  ~~~~'
  ].join('\n');
  const tokens = tokenize(markdown, source);
  assert.ok(hasScope(tokens[9], 'keyword.control.flow.await'));
  assert.ok(hasScope(tokens[7], 'meta.literal.block.flow'));
  assert.ok(hasScope(tokens[10], 'markup.underline.link.flow'));
  assert.ok(!hasScope(tokens[12], 'keyword.control.flow.await'));
  assert.ok(!hasScope(tokens[3], 'markup.underline.link.flow'));
  assert.deepEqual(findUseReferences(source, true).map(reference => reference.filename), ['real.flow', 'other.md']);
});

test('colon-free block headers indent, else and result bindings dedent, repeat remains pink', () => {
  const config = read('language-configuration.json');
  const increase = new RegExp(config.indentationRules.increaseIndentPattern);
  const decrease = new RegExp(config.indentationRules.decreaseIndentPattern);
  for (const header of ['if true', 'else', 'repeat 0 times', 'while @count < 3', 'async task', 'context', 'context as @background', 'run python3', 'command GREET', 'flow greet']) {
    assert.ok(increase.test(header), header);
  }
  assert.ok(!increase.test('if true:'));
  assert.ok(decrease.test('else'));
  assert.ok(decrease.test('as @result'));
  assert.ok(!decrease.test('as result'));
  assert.ok(!decrease.test('as @result.field'));
  const rules = read('package.json').contributes.configurationDefaults['editor.tokenColorCustomizations'].textMateRules;
  assert.equal(rules.find(rule => rule.scope === 'keyword.control.flow.repeat').settings.foreground, '#FF79C6');
});


test('four-space editing defaults apply only to Flow', () => {
  const defaults = read('package.json').contributes.configurationDefaults;
  assert.deepEqual(defaults['[flow]'], {
    'editor.tabSize': 4,
    'editor.insertSpaces': true,
    'editor.detectIndentation': false
  });
  assert.equal(defaults['[markdown]'], undefined);
  for (const key of ['editor.tabSize', 'editor.insertSpaces', 'editor.detectIndentation']) {
    assert.equal(defaults[key], undefined);
  }
});

test('Enter explicitly indents block headers at any nesting level', () => {
  const config = read('language-configuration.json');
  assert.deepEqual(config.onEnterRules, [{
    beforeText: config.indentationRules.increaseIndentPattern,
    action: { indent: 'indent' }
  }]);
  const header = new RegExp(config.onEnterRules[0].beforeText);
  for (const indent of ['', '    ', '        ']) {
    for (const command of ['if true', 'else', 'repeat 3 times', 'while false', 'async task', 'context', 'context as @background', 'run sh', 'command GREET', 'flow greet']) {
      assert.ok(header.test(indent + command), indent + command);
    }
  }
  for (const line of ['ask "Name?" as @name', 'do Review @name. as @result',
    'print "if true"', 'as @result', '# if true', 'if true:',
    'command', 'command greet', 'command GREET:', 'command GREET <input:string>',
    'flow', 'flow GREET', 'flow greet:', 'flow greet <input:string>',
    'FUNCTION greet']) {
    assert.ok(!header.test(line), line);
  }
});

test('nine editable command snippets are registered only for Flow', () => {
  const contributions = read('package.json').contributes.snippets;
  assert.deepEqual(contributions, [{ language: 'flow', path: './snippets/flow.json' }]);
  const snippets = read(contributions[0].path);
  assert.equal(Object.keys(snippets).length, 9);
  for (const [name, snippet] of Object.entries(snippets)) {
    const body = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body;
    assert.ok(snippet.description, name);
    assert.ok(body.startsWith(snippet.prefix + ' ') || body.startsWith(snippet.prefix + '\n'), name);
    assert.ok(body.endsWith('$0'), name);
    const stops = [...body.matchAll(/\$\{(\d+):[^}]+\}/g)].map(match => Number(match[1]));
    assert.deepEqual(stops, stops.map((_, index) => index + 1), name);
    const expanded = body.replace(/\$\{\d+:([^}]+)\}|\$0/g, (_, value) => value || '');
    assert.ok(hasScope(tokenize(flow, expanded)[0],
      'keyword.control.flow.' + snippet.prefix.toLowerCase()), name);
    assert.ok(!expanded.includes('\t'), name);
    for (const line of expanded.split('\n')) {
      assert.equal(line.match(/^ */)[0].length % 4, 0, name);
    }
  }
});

test('branch and literal snippets preserve Flow structure', () => {
  const snippets = read('snippets/flow.json');
  assert.deepEqual(snippets['if / else branches'].body, [
    'if ${1:@answer is exactly "yes"}',
    '    ${2:print "Approved."}',
    'else',
    '    ${3:return "Not approved."}',
    '$0'
  ]);
  assert.deepEqual(snippets['context background text'].body, [
    'context as @${1:guidelines}', '    ${2:Background guidance.}', '$0'
  ]);
  assert.equal(snippets['print a value'].body, 'print ${1:@result}$0');
  assert.equal(snippets['print an instruction'].body, 'print ${1:Summarize @result.}$0');
  assert.deepEqual(snippets['command definition'].body, [
    'command ${1:NAME}',
    '    do ${2:Describe the task for @input and return its result.}', '$0'
  ]);
  assert.deepEqual(snippets['flow definition'].body, [
    'flow ${1:name}',
    '    do ${2:Describe the task for @input and return its result.}', '$0'
  ]);
});

test('named flow calls highlight as instructions while task labels and data keep their scopes', () => {
  const source = [
    'flow add_one', '    set result = @input + 1',
    'command INCREMENT', '    add_one @input as @result', '    set output = @result',
    'add_one 4 as @next', 'async preview', '    add_one 9 as @result',
    'await preview', 'print @preview.result',
    '# flow comment', '# add_one 1',
    'do Explain the following text.', '    flow prose', '    add_one @input',
    'print Describe this text.', '    add_one @input',
    'print "flow literal; add_one"', 'set text = """',
    'flow string_data', 'add_one 1', '"""',
    'context as @context', '    flow context_data', '    add_one 1', '',
    'run sh as @process', '    flow shell_data', '    add_one 1', '',
    'add_one 2 as @result'
  ];
  for (const [grammar, text, offset] of [
    [flow, source.join('\n'), 0],
    [markdown, ['```flow', ...source, '```'].join('\n'), 1]
  ]) {
    const tokens = tokenize(grammar, text).slice(offset);
    assert.ok(hasScope(tokens[0], 'keyword.control.flow.flow'));
    assert.ok(scopes(tokens[0], 'flow '.length).includes('entity.name.function.flow'));
    for (const line of [3, 5, 7, 30]) {
      assert.ok(scopes(tokens[line], source[line].indexOf('add_one'))
        .includes('entity.name.function.flow'), `flow call line ${line}`);
    }
    for (const line of [6, 8]) {
      assert.ok(scopes(tokens[line], source[line].indexOf('preview'))
        .includes('variable.other.flow'), `task label line ${line}`);
    }
    assert.ok(hasScope(tokens[9], 'variable.other.reference.flow'));
    for (const line of [10, 11, 13, 14, 16, 17, 19, 20, 23, 24, 27, 28]) {
      assert.ok(!hasScope(tokens[line], 'keyword.control.flow.flow'), `data line ${line}`);
      assert.ok(!hasScope(tokens[line], 'entity.name.function.flow'), `data line ${line}`);
    }
  }
  for (const source of ['flow GREET', 'flow mixedCase', 'flow greet <input:string>', 'FUNCTION greet']) {
    assert.ok(!hasScope(tokenize(flow, source)[0], 'keyword.control.flow.flow'), source);
  }
  for (const source of ['addOne 1', 'add_one(1)', 'set value = add_one(1)', 'print @add_one']) {
    assert.ok(!hasScope(tokenize(flow, source)[0], 'entity.name.function.flow'), source);
  }
});

test('command blocks highlight in files and Markdown without treating data as declarations', () => {
  const source = [
    'command GREET',
    '    if @input is exactly "Ana"',
    '        do Return a greeting. as @greeting',
    '    else',
    '        do Return another greeting. as @greeting',
    '    do Return @greeting unchanged.',
    '', 'command OTHER', '    do Return @input unchanged.',
    '', 'GREET "Ana" as @greeting',
    '# command COMMENT', 'do Explain these words.', '    command PROSE',
    'print "command STRING"',
    'context as @context', '    command LITERAL', '',
    'run sh as @process', '    command SHELL_DATA', ''
  ];
  for (const [grammar, text, offset] of [
    [flow, source.join('\n'), 0],
    [markdown, ['```flow', ...source, '```'].join('\n'), 1]
  ]) {
    const tokens = tokenize(grammar, text).slice(offset);
    for (const line of [0, 7]) {
      assert.ok(hasScope(tokens[line], 'keyword.control.flow.command'));
      assert.ok(scopes(tokens[line], 'command '.length).includes('entity.name.function.flow'));
    }
    assert.ok(hasScope(tokens[1], 'keyword.control.flow.if'));
    assert.ok(hasScope(tokens[3], 'keyword.control.flow.else'));
    assert.ok(hasScope(tokens[10], 'entity.name.function.flow'));
    for (const line of [11, 13, 14, 16, 19]) {
      assert.ok(!hasScope(tokens[line], 'keyword.control.flow.command'), `data line ${line}`);
    }
  }
});

test('use navigation inside callable bodies retains literal boundaries and source locations', () => {
  for (const [declaration, call] of [
    ['command PREPARE', 'PREPARE "Ana" as @result'],
    ['flow prepare', 'prepare "Ana" as @result']
  ]) {
    const source = [
      declaration, '    context as @context', '        use hidden.flow', '',
      '    run sh as @process', '        use hidden.flow', '',
      '    use helpers/prepare.flow', '    do Return @input unchanged.',
      'use library.flow', call
    ].join('\n');
    for (const [text, markdown, offset] of [
      [source, false, 0], ['```flow\n' + source + '\n```', true, 1]
    ]) {
      const references = findUseReferences(text, markdown);
      assert.deepEqual(references.map(({ filename, line }) => ({ filename, line })), [
        { filename: 'helpers/prepare.flow', line: 7 + offset },
        { filename: 'library.flow', line: 9 + offset }
      ]);
      for (const reference of references) {
        assert.equal(text.split('\n')[reference.line].slice(reference.start, reference.end), reference.filename);
      }
    }
  }
});

test('nested literal bodies use the header indentation and resume in the parent block', () => {
  const source = [
    'if true', '    context as @context', '        as @fake', '        use hidden.flow', '',
    '    run sh as @result', '        use hidden.flow', '        ###', '',
    '    use visible.flow', 'await task'
  ].join('\n');
  const tokens = tokenize(flow, source);
  assert.ok(hasScope(tokens[3], 'meta.literal.block.flow'));
  assert.ok(hasScope(tokens[1], 'variable.other.flow'));
  assert.ok(hasScope(tokens[6], 'meta.literal.block.flow'));
  assert.ok(hasScope(tokens[5], 'variable.other.flow'));
  assert.ok(hasScope(tokens[9], 'markup.underline.link.flow'));
  assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
});

test('literal code fences inside run do not close the enclosing Markdown flow fence', () => {
  const source = ['```flow', 'run sh as @result', '    ```', '    use hidden.flow', '', 'use real.flow', '```', '# Heading'].join('\n');
  const tokens = tokenize(markdown, source);
  assert.ok(hasScope(tokens[3], 'meta.literal.block.flow'));
  assert.ok(hasScope(tokens[5], 'markup.underline.link.flow'));
  assert.ok(!hasScope(tokens[7], 'comment.line.number-sign.flow'));
  assert.deepEqual(findUseReferences(source, true).map(reference => reference.filename), ['real.flow']);
});

test('triple-quoted set and print strings keep commands, comments and references literal', () => {
  for (const header of ['set text = """', 'print """', 'ask """', 'TRIM """']) {
    const source = [header, 'use hidden.flow', '###', '@name \\n "quotes"', '"""', 'use visible.flow'].join('\n');
    const tokens = tokenize(flow, source);
    for (const line of [1, 2, 3]) {
      assert.ok(hasScope(tokens[line], 'string.quoted.triple.flow'), `${header}: ${line}`);
      assert.ok(!tokens[line].some(token => token.scopes.some(scope => /^(keyword|variable|comment|markup\.underline|constant\.character\.escape)/.test(scope))));
    }
    assert.ok(hasScope(tokens[5], 'markup.underline.link.flow'));
    assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
  }
});

test('inline triples and escaped quotes in ordinary strings do not hide later links', () => {
  const source = ['set text = """inline @name # data"""', 'set quoted = ' + JSON.stringify('"""'), 'use visible.flow'].join('\n');
  const tokens = tokenize(flow, source);
  assert.ok(hasScope(tokens[0], 'string.quoted.triple.flow'));
  assert.ok(hasScope(tokens[1], 'string.quoted.double.flow'));
  assert.ok(!hasScope(tokens[1], 'string.quoted.triple.flow'));
  assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
});

test('triples work in Markdown fences and prose continuations, including dedented payload', () => {
  const source = ['````flow', 'do Use this text:', '    """', 'use hidden.flow', '```', '###', '""" as @text', 'use visible.flow', '````'].join('\n');
  const tokens = tokenize(markdown, source);
  for (const line of [3, 4, 5]) assert.ok(hasScope(tokens[line], 'string.quoted.triple.flow'));
  assert.ok(hasScope(tokens[6], 'variable.other.flow'));
  assert.ok(hasScope(tokens[7], 'markup.underline.link.flow'));
  assert.deepEqual(findUseReferences(source, true).map(reference => reference.filename), ['visible.flow']);
});

test('triple markers in comments and literal bodies do not open Flow strings', () => {
  const source = ['# """', '###', '"""', '###', 'context as @context', '    """', '', 'run sh as @result', '    """', '', 'use visible.flow'].join('\n');
  assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
  const tokens = tokenize(flow, source);
  assert.ok(!tokens.some(line => hasScope(line, 'string.quoted.triple.flow')));
});

test('unclosed triples remain literal and produce no use navigation', () => {
  const source = 'set text = """\nuse hidden.flow\n###\nawait task';
  assert.deepEqual(findUseReferences(source), []);
  const tokens = tokenize(flow, source);
  for (const line of [1, 2, 3]) assert.ok(hasScope(tokens[line], 'string.quoted.triple.flow'));
});
