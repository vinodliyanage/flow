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

test('all current commands have their own scope; legacy syntax has no builtin scope', () => {
  const cases = {
    ASK: 'ASK "Name?" AS name', SET: 'SET count = 0', DO: 'DO Review @name. AS result',
    PRINT: 'PRINT @result', CONTEXT: 'CONTEXT', USE: 'USE common.flow', IF: 'IF TRUE',
    ELSE: 'ELSE', REPEAT: 'REPEAT 0 TIMES', WHILE: 'WHILE FALSE', CONTINUE: 'CONTINUE',
    BREAK: 'BREAK', RETURN: 'RETURN "Done"', RUN: 'RUN python3 - @name',
    ASYNC: 'ASYNC frontend', AWAIT: 'AWAIT frontend', COMMAND: 'COMMAND GREET',
    FLOW: 'FLOW greet'
  };
  for (const [command, source] of Object.entries(cases)) {
    assert.ok(hasScope(tokenize(flow, source)[0], 'keyword.control.flow.' + command.toLowerCase()), command);
  }
  for (const command of ['WAIT', 'CHECK', 'STOP', 'SHELL', 'THINK', 'RULES', 'FINALLY', 'FUNCTION']) {
    const tokens = tokenize(flow, command + ' value')[0];
    assert.ok(!tokens.some(token => token.scopes.some(scope => scope.startsWith('keyword.control.flow.'))), command);
  }
});

test('references, bindings, custom commands, JSON strings and Boolean operators tokenize', () => {
  assert.ok(hasScope(tokenize(flow, 'SET count = 1')[0], 'variable.other.flow'));
  assert.ok(hasScope(tokenize(flow, 'PRINT @order.total')[0], 'variable.other.reference.flow'));
  const string = tokenize(flow, 'PRINT ' + JSON.stringify('@name "text"'))[0];
  assert.ok(hasScope(string, 'string.quoted.double.flow'));
  assert.ok(hasScope(string, 'constant.character.escape.flow'));
  assert.ok(!hasScope(string, 'variable.other.reference.flow'));
  const operator = tokenize(flow, 'IF NOT @approved OR (@total >= 1 AND TRUE)')[0];
  assert.ok(hasScope(operator, 'keyword.operator.flow'));
  assert.ok(hasScope(operator, 'constant.language.flow.true'));
  const legacy = 'AS COMMAND TRIM';
  assert.ok(!scopes(tokenize(flow, legacy)[0], legacy.lastIndexOf('TRIM'))
    .includes('entity.name.function.flow'));
  assert.ok(hasScope(tokenize(flow, 'TRIM @name AS name')[0], 'entity.name.function.flow'));
  assert.ok(!hasScope(tokenize(flow, 'SET x = trim("x")')[0], 'support.function.flow'));
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
  assert.equal(colorFor('keyword.control.flow.flow'), '#B392F0');
  assert.equal(colorFor('string.quoted.double.flow'), '#98C379');
  assert.equal(colorFor('string.quoted.triple.flow'), '#98C379');
  assert.equal(colorFor('meta.literal.block.flow'), undefined);
});

test('exact PRINT parts and prose PRINT highlight in Flow files and Markdown fences', () => {
  for (const source of ['PRINT "Hello:" @name', 'PRINT Say hello to @name.']) {
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
  const source = 'PRINT "Literal @name:" @name';
  const tokens = tokenize(flow, source)[0];
  assert.ok(!scopes(tokens, source.indexOf('@name')).includes('variable.other.reference.flow'));
  assert.ok(scopes(tokens, source.lastIndexOf('@name')).includes('variable.other.reference.flow'));
  assert.deepEqual(findUseReferences('PRINT "USE hidden.flow" @name\nUSE visible.flow')
    .map(reference => reference.filename), ['visible.flow']);
});

test('CONTEXT and RUN bodies stay literal, then normal highlighting resumes', () => {
  const source = [
    'CONTEXT', '    USE hidden.flow', '    ###', '    @name', 'AS context',
    'RUN python3 - @name', '    USE hidden.flow', '    AS fake', '    ###',
    '    PRINT @name', 'AS result', 'PRINT @result.stdout'
  ].join('\n');
  const tokens = tokenize(flow, source);
  for (const line of [1, 2, 3, 6, 7, 8, 9]) {
    assert.ok(hasScope(tokens[line], 'meta.literal.block.flow'), `literal line ${line}`);
    assert.ok(!tokens[line].some(token => token.scopes.some(scope => /^(keyword|variable|markup\.underline)/.test(scope))));
  }
  assert.ok(hasScope(tokens[4], 'variable.other.flow'));
  assert.ok(hasScope(tokens[5], 'variable.other.reference.flow'));
  assert.ok(hasScope(tokens[10], 'variable.other.flow'));
  assert.ok(hasScope(tokens[11], 'keyword.control.flow.print'));
  assert.deepEqual(findUseReferences(source), []);
});

test('multiline comments and prose continuations do not create USE links', () => {
  const source = [
    '###', 'USE comment.flow', 'AWAIT task', '###',
    'DO Explain the following words.', '    USE continuation.flow', '',
    'USE visible.flow', 'DO Keep # as prose.'
  ].join('\n');
  const tokens = tokenize(flow, source);
  assert.ok(hasScope(tokens[1], 'comment.block.flow'));
  assert.ok(!hasScope(tokens[5], 'markup.underline.link.flow'));
  assert.ok(!hasScope(tokens[8], 'comment.line.number-sign.flow'));
  assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
});

test('USE links include Markdown sections and spaces, with exact source ranges', () => {
  const source = '    USE common/prepare greeting.flow\nUSE rules/project guide.md#bug-fixes AS guide\nUSE notes.md AS notes';
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
    'USE outside.flow', '`AWAIT inline`', '```python', 'USE python.flow', '```',
    '````flow', 'CONTEXT', '    USE literal.flow', 'AS guide', 'AWAIT frontend',
    'USE real.flow', '`````', 'AWAIT outside',
    '  ~~~flow', '  USE other.md#section AS guide', '  ~~~~'
  ].join('\n');
  const tokens = tokenize(markdown, source);
  assert.ok(hasScope(tokens[9], 'keyword.control.flow.await'));
  assert.ok(hasScope(tokens[7], 'meta.literal.block.flow'));
  assert.ok(hasScope(tokens[10], 'markup.underline.link.flow'));
  assert.ok(!hasScope(tokens[12], 'keyword.control.flow.await'));
  assert.ok(!hasScope(tokens[3], 'markup.underline.link.flow'));
  assert.deepEqual(findUseReferences(source, true).map(reference => reference.filename), ['real.flow', 'other.md']);
});

test('colon-free block headers indent, ELSE/AS dedent, REPEAT remains pink', () => {
  const config = read('language-configuration.json');
  const increase = new RegExp(config.indentationRules.increaseIndentPattern);
  const decrease = new RegExp(config.indentationRules.decreaseIndentPattern);
  for (const header of ['IF TRUE', 'ELSE', 'REPEAT 0 TIMES', 'WHILE @count < 3', 'ASYNC task', 'CONTEXT', 'RUN python3', 'COMMAND GREET', 'FLOW greet']) {
    assert.ok(increase.test(header), header);
  }
  assert.ok(!increase.test('IF TRUE:'));
  assert.ok(decrease.test('ELSE'));
  assert.ok(decrease.test('AS result'));
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
    for (const command of ['IF TRUE', 'ELSE', 'REPEAT 3 TIMES', 'WHILE FALSE', 'ASYNC task', 'CONTEXT', 'RUN sh', 'COMMAND GREET', 'FLOW greet']) {
      assert.ok(header.test(indent + command), indent + command);
    }
  }
  for (const line of ['ASK "Name?" AS name', 'DO Review @name. AS result',
    'PRINT "IF TRUE"', 'AS result', '# IF TRUE', 'IF TRUE:',
    'COMMAND', 'COMMAND greet', 'COMMAND GREET:', 'COMMAND GREET <input:string>',
    'FLOW', 'FLOW GREET', 'FLOW greet:', 'FLOW greet <input:string>',
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
  assert.deepEqual(snippets['IF / ELSE branches'].body, [
    'IF ${1:@answer is exactly "yes"}',
    '    ${2:PRINT "Approved."}',
    'ELSE',
    '    ${3:RETURN "Not approved."}',
    '$0'
  ]);
  assert.deepEqual(snippets['CONTEXT background text'].body, [
    'CONTEXT', '    ${1:Background guidance.}', 'AS ${2:guidelines}', '$0'
  ]);
  assert.equal(snippets['PRINT a value'].body, 'PRINT ${1:@result}$0');
  assert.equal(snippets['PRINT an instruction'].body, 'PRINT ${1:Summarize @result.}$0');
  assert.deepEqual(snippets['COMMAND definition'].body, [
    'COMMAND ${1:NAME}',
    '    DO ${2:Describe the task for @input and return its result.}', '$0'
  ]);
  assert.deepEqual(snippets['FLOW definition'].body, [
    'FLOW ${1:name}',
    '    DO ${2:Describe the task for @input and return its result.}', '$0'
  ]);
});

test('named flow calls highlight as instructions while task labels and data keep their scopes', () => {
  const source = [
    'FLOW add_one', '    SET result = @input + 1',
    'COMMAND INCREMENT', '    add_one @input AS result', '    SET output = @result',
    'add_one 4 AS next', 'ASYNC preview', '    add_one 9 AS result',
    'AWAIT preview', 'PRINT @preview.result',
    '# FLOW comment', '# add_one 1',
    'DO Explain the following text.', '    FLOW prose', '    add_one @input',
    'PRINT Describe this text.', '    add_one @input',
    'PRINT "FLOW literal; add_one"', 'SET text = """',
    'FLOW string_data', 'add_one 1', '"""',
    'CONTEXT', '    FLOW context_data', '    add_one 1', 'AS context',
    'RUN sh', '    FLOW shell_data', '    add_one 1', 'AS process',
    'add_one 2 AS result'
  ];
  for (const [grammar, text, offset] of [
    [flow, source.join('\n'), 0],
    [markdown, ['```flow', ...source, '```'].join('\n'), 1]
  ]) {
    const tokens = tokenize(grammar, text).slice(offset);
    assert.ok(hasScope(tokens[0], 'keyword.control.flow.flow'));
    assert.ok(scopes(tokens[0], 'FLOW '.length).includes('entity.name.function.flow'));
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
  for (const source of ['FLOW GREET', 'FLOW mixedCase', 'FLOW greet <input:string>', 'FUNCTION greet']) {
    assert.ok(!hasScope(tokenize(flow, source)[0], 'keyword.control.flow.flow'), source);
  }
  for (const source of ['addOne 1', 'add_one(1)', 'SET value = add_one(1)', 'PRINT @add_one']) {
    assert.ok(!hasScope(tokenize(flow, source)[0], 'entity.name.function.flow'), source);
  }
});

test('COMMAND blocks highlight in files and Markdown without treating data as declarations', () => {
  const source = [
    'COMMAND GREET',
    '    IF @input is exactly "Ana"',
    '        DO Return a greeting. AS greeting',
    '    ELSE',
    '        DO Return another greeting. AS greeting',
    '    DO Return @greeting unchanged.',
    '', 'COMMAND OTHER', '    DO Return @input unchanged.',
    '', 'GREET "Ana" AS greeting',
    '# COMMAND COMMENT', 'DO Explain these words.', '    COMMAND PROSE',
    'PRINT "COMMAND STRING"',
    'CONTEXT', '    COMMAND LITERAL', 'AS context',
    'RUN sh', '    COMMAND SHELL_DATA', 'AS process'
  ];
  for (const [grammar, text, offset] of [
    [flow, source.join('\n'), 0],
    [markdown, ['```flow', ...source, '```'].join('\n'), 1]
  ]) {
    const tokens = tokenize(grammar, text).slice(offset);
    for (const line of [0, 7]) {
      assert.ok(hasScope(tokens[line], 'keyword.control.flow.command'));
      assert.ok(scopes(tokens[line], 'COMMAND '.length).includes('entity.name.function.flow'));
    }
    assert.ok(hasScope(tokens[1], 'keyword.control.flow.if'));
    assert.ok(hasScope(tokens[3], 'keyword.control.flow.else'));
    assert.ok(hasScope(tokens[10], 'entity.name.function.flow'));
    for (const line of [11, 13, 14, 16, 19]) {
      assert.ok(!hasScope(tokens[line], 'keyword.control.flow.command'), `data line ${line}`);
    }
  }
});

test('USE navigation inside callable bodies retains literal boundaries and source locations', () => {
  for (const [declaration, call] of [
    ['COMMAND PREPARE', 'PREPARE "Ana" AS result'],
    ['FLOW prepare', 'prepare "Ana" AS result']
  ]) {
    const source = [
      declaration, '    CONTEXT', '        USE hidden.flow', '    AS context',
      '    RUN sh', '        USE hidden.flow', '    AS process',
      '    USE helpers/prepare.flow', '    DO Return @input unchanged.',
      'USE library.flow', call
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
    'IF TRUE', '    CONTEXT', '        AS fake', '        USE hidden.flow', '    AS context',
    '    RUN sh', '        USE hidden.flow', '        ###', '    AS result',
    '    USE visible.flow', 'AWAIT task'
  ].join('\n');
  const tokens = tokenize(flow, source);
  assert.ok(hasScope(tokens[3], 'meta.literal.block.flow'));
  assert.ok(hasScope(tokens[4], 'variable.other.flow'));
  assert.ok(hasScope(tokens[6], 'meta.literal.block.flow'));
  assert.ok(hasScope(tokens[8], 'variable.other.flow'));
  assert.ok(hasScope(tokens[9], 'markup.underline.link.flow'));
  assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
});

test('literal code fences inside RUN do not close the enclosing Markdown flow fence', () => {
  const source = ['```flow', 'RUN sh', '    ```', '    USE hidden.flow', 'AS result', 'USE real.flow', '```', '# Heading'].join('\n');
  const tokens = tokenize(markdown, source);
  assert.ok(hasScope(tokens[3], 'meta.literal.block.flow'));
  assert.ok(hasScope(tokens[5], 'markup.underline.link.flow'));
  assert.ok(!hasScope(tokens[7], 'comment.line.number-sign.flow'));
  assert.deepEqual(findUseReferences(source, true).map(reference => reference.filename), ['real.flow']);
});

test('triple-quoted SET and PRINT strings keep commands, comments and references literal', () => {
  for (const header of ['SET text = """', 'PRINT """', 'ASK """', 'TRIM """']) {
    const source = [header, 'USE hidden.flow', '###', '@name \\n "quotes"', '"""', 'USE visible.flow'].join('\n');
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
  const source = ['SET text = """inline @name # data"""', 'SET quoted = ' + JSON.stringify('"""'), 'USE visible.flow'].join('\n');
  const tokens = tokenize(flow, source);
  assert.ok(hasScope(tokens[0], 'string.quoted.triple.flow'));
  assert.ok(hasScope(tokens[1], 'string.quoted.double.flow'));
  assert.ok(!hasScope(tokens[1], 'string.quoted.triple.flow'));
  assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
});

test('triples work in Markdown fences and prose continuations, including dedented payload', () => {
  const source = ['````flow', 'DO Use this text:', '    """', 'USE hidden.flow', '```', '###', '""" AS text', 'USE visible.flow', '````'].join('\n');
  const tokens = tokenize(markdown, source);
  for (const line of [3, 4, 5]) assert.ok(hasScope(tokens[line], 'string.quoted.triple.flow'));
  assert.ok(hasScope(tokens[6], 'variable.other.flow'));
  assert.ok(hasScope(tokens[7], 'markup.underline.link.flow'));
  assert.deepEqual(findUseReferences(source, true).map(reference => reference.filename), ['visible.flow']);
});

test('triple markers in comments and literal bodies do not open Flow strings', () => {
  const source = ['# """', '###', '"""', '###', 'CONTEXT', '    """', 'AS context', 'RUN sh', '    """', 'AS result', 'USE visible.flow'].join('\n');
  assert.deepEqual(findUseReferences(source).map(reference => reference.filename), ['visible.flow']);
  const tokens = tokenize(flow, source);
  assert.ok(!tokens.some(line => hasScope(line, 'string.quoted.triple.flow')));
});

test('unclosed triples remain literal and produce no USE navigation', () => {
  const source = 'SET text = """\nUSE hidden.flow\n###\nAWAIT task';
  assert.deepEqual(findUseReferences(source), []);
  const tokens = tokenize(flow, source);
  for (const line of [1, 2, 3]) assert.ok(hasScope(tokens[line], 'string.quoted.triple.flow'));
});
