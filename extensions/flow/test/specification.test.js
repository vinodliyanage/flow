const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const specification = fs.readFileSync(path.join(__dirname,
  '../../../skills/flow/references/interpreter.md'), 'utf8');

// Check the notation in the contract, not Flow execution or agent behavior.
function parseExpression(source) {
  const tokens = [];
  const references = new Set();
  const literals = new Set();
  const pattern = /"(?:[^"\\]|\\.)*"|[A-Za-z_][A-Za-z0-9_]*|[()|?*+]/y;
  let position = 0;
  while (position < source.length) {
    if (/\s/.test(source[position])) { position++; continue; }
    pattern.lastIndex = position;
    const match = pattern.exec(source);
    assert.ok(match, `unsupported EBNF notation at ${source.slice(position)}`);
    tokens.push(match[0]);
    position = pattern.lastIndex;
  }
  let index = 0;
  function sequence() {
    const start = index;
    while (index < tokens.length && !['|', ')'].includes(tokens[index])) {
      const token = tokens[index++];
      if (token === '(') {
        choice();
        assert.equal(tokens[index++], ')', 'unclosed group');
      } else if (token.startsWith('"')) {
        literals.add(JSON.parse(token));
      } else {
        assert.match(token, /^[A-Za-z_][A-Za-z0-9_]*$/, 'expected symbol');
        references.add(token);
      }
      if (['?', '*', '+'].includes(tokens[index])) index++;
    }
    assert.ok(index > start, 'empty sequence or alternative');
  }
  function choice() {
    sequence();
    while (tokens[index] === '|') { index++; sequence(); }
  }
  choice();
  assert.equal(index, tokens.length, 'unexpected closing group');
  return { references, literals };
}

test('instruction grammar uses valid W3C-style EBNF and defines every referenced category', () => {
  const blocks = [...specification.matchAll(/```ebnf\n([\s\S]*?)\n```/g)];
  assert.equal(blocks.length, 1);
  const categories = new Set([...specification.matchAll(/^\| `([A-Z_]+)` \|/gm)]
    .map(match => match[1]));
  const productions = new Map();
  for (const line of blocks[0][1].split('\n')) {
    const match = line.match(/^([a-z_]+) +::= (.+)$/);
    assert.ok(match, `malformed production: ${line}`);
    assert.ok(!productions.has(match[1]), `duplicate production: ${match[1]}`);
    productions.set(match[1], parseExpression(match[2]));
  }
  const usedCategories = new Set();
  const literals = new Set();
  for (const [name, expression] of productions) {
    for (const reference of expression.references) {
      assert.ok(productions.has(reference) || categories.has(reference),
        `${name}: undefined symbol ${reference}`);
      if (categories.has(reference)) usedCategories.add(reference);
    }
    for (const literal of expression.literals) literals.add(literal);
  }
  assert.deepEqual([...usedCategories].sort(), [...categories].sort());
  assert.deepEqual([...literals].sort(), [
    '=', '@', 'as', 'ask', 'async', 'await', 'break', 'command', 'context', 'continue',
    'do', 'else', 'flow', 'if', 'print', 'repeat', 'return', 'run', 'set', 'times', 'use', 'while'
  ].sort());
});

test('notation checker rejects empty alternatives, malformed groups and unsupported operators', () => {
  for (const expression of ['', 'name |', '(name', 'name)', 'name??', 'name;']) {
    assert.throws(() => parseExpression(expression), undefined, expression);
  }
  assert.deepEqual([...parseExpression('"as" "@" NAME').references], ['NAME']);
  assert.deepEqual([...parseExpression('(name | "value")?').literals], ['value']);
});

test('command declarations use names and indented instruction bodies', () => {
  const grammar = specification.match(/```ebnf\n([\s\S]*?)\n```/)[1];
  assert.match(grammar, /^command +::= "command" COMMAND_NAME BLOCK$/m);
  const example = fs.readFileSync(path.join(__dirname,
    '../../../examples/command-blocks.flow'), 'utf8');
  assert.match(example, /^command GREET$/m);
  assert.ok(!/<[a-z_]+:[a-z_]+>/.test(example));
  for (const line of example.split('\n').filter(line => /^ *(if|while)\b/.test(line))) {
    assert.ok(!/==|!=/.test(line), line);
  }
});

test('the public instruction grammar matches the agent interpreter contract', () => {
  const published = fs.readFileSync(path.join(__dirname,
    '../../../docs/specification.md'), 'utf8');
  const grammar = source => source.match(/```ebnf\n([\s\S]*?)\n```/)[1];
  assert.equal(grammar(published), grammar(specification));
});

test('Flow 0.7.0 permits one header or aligned following binding for literal bodies', () => {
  const grammar = specification.match(/```ebnf\n([\s\S]*?)\n```/)[1];
  assert.match(grammar, /^binding +::= "as" "@" NAME$/m);
  assert.match(grammar, /^context +::= "context" \(binding LITERAL \| LITERAL binding\)$/m);
  assert.match(grammar, /^run +::= "run" ARGV \(binding LITERAL\? \| LITERAL\? binding\?\)$/m);
  assert.ok(!/"[A-Z]+"/.test(grammar), 'uppercase keyword terminals must not survive');
  assert.match(specification, /Keywords are lowercase and case-sensitive/);
  assert.match(specification, /never use both positions/);
  assert.match(specification, /Parse the complete instruction, body, and\s+binding before acting/);
  assert.match(specification, /Bindings end the complete input inline, including do continuations\. Only\s+run\/context also permit one aligned binding/);
  const skill = fs.readFileSync(path.join(__dirname, '../../../skills/flow/SKILL.md'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  assert.match(specification, /contract for Flow 0\.7\.0/);
  assert.match(skill, /version: "0\.7\.0"/);
  assert.equal(manifest.version, '0.4.0');
});

test('Flow 0.7.0 return accepts an optional expression without displaying it', () => {
  const grammar = specification.match(/```ebnf\n([\s\S]*?)\n```/)[1];
  assert.match(grammar, /^return +::= "return" EXPRESSION\?$/m);
  assert.match(specification, /Result: the expression value when present, otherwise none\. Do not display it\./);
  assert.match(specification, /explicit returned value, otherwise the final direct instruction's result/);
  assert.doesNotMatch(specification, /explicit return messages/);
});

test('Flow 0.7.0 supports file imports and dynamic imports', () => {
  assert.match(specification, /leading top-level `use` instructions form the file import header/i);
  assert.match(specification, /captured by every command and flow\s+declared in that file/);
  assert.match(specification, /Each invocation starts with an isolated copy/);
  assert.match(specification, /Any `use` outside that leading file header is dynamic/);
  assert.match(specification, /An unselected branch therefore does not load its dynamic import/);
});
