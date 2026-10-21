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
    '=', 'AS', 'ASK', 'ASYNC', 'AWAIT', 'BREAK', 'COMMAND', 'CONTEXT', 'CONTINUE',
    'DO', 'ELSE', 'FLOW', 'IF', 'PRINT', 'REPEAT', 'RETURN', 'RUN', 'SET', 'TIMES', 'USE', 'WHILE'
  ].sort());
});

test('notation checker rejects empty alternatives, malformed groups and unsupported operators', () => {
  for (const expression of ['', 'name |', '(name', 'name)', 'name??', 'name;']) {
    assert.throws(() => parseExpression(expression), undefined, expression);
  }
  assert.deepEqual([...parseExpression('"AS" NAME').references], ['NAME']);
  assert.deepEqual([...parseExpression('(name | "value")?').literals], ['value']);
});

test('COMMAND declarations stay plain and replace the footer form', () => {
  const grammar = specification.match(/```ebnf\n([\s\S]*?)\n```/)[1];
  assert.match(grammar, /^command +::= "COMMAND" COMMAND_NAME BLOCK$/m);
  assert.ok(!grammar.includes('"AS" "COMMAND"'));
  assert.match(specification, /AS COMMAND footers are replaced/);
  const example = fs.readFileSync(path.join(__dirname,
    '../../../examples/command-blocks.flow'), 'utf8');
  assert.match(example, /^COMMAND GREET$/m);
  assert.ok(!/^ *AS COMMAND\b/m.test(example));
  assert.ok(!/<[a-z_]+:[a-z_]+>/.test(example));
  for (const line of example.split('\n').filter(line => /^ *(IF|WHILE)\b/.test(line))) {
    assert.ok(!/==|!=/.test(line), line);
  }
});

test('the public instruction grammar matches the agent interpreter contract', () => {
  const published = fs.readFileSync(path.join(__dirname,
    '../../../docs/specification.md'), 'utf8');
  const grammar = source => source.match(/```ebnf\n([\s\S]*?)\n```/)[1];
  assert.equal(grammar(published), grammar(specification));
});
