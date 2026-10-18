---
description: Read Flow's documented grammar, values, expressions, command semantics, execution model, scopes, limits, and unresolved rules.
---

# Language specification

This page collects Flow's documented syntax and semantics into one reference.
It describes the language shipped in this repository, including exact and
prose `PRINT` forms. Tutorials and examples illustrate these rules; they do
not define additional syntax.

The [agent interpreter contract](interpreter.md) is published alongside this
specification directly from the skill's source file. It is the contract agents
must load for execution. Rules that the current contract does not settle are
listed under [unresolved rules](#unresolved-rules). This is therefore a
specification of the current documented language, not a complete parser or a
claim that every implementation decision has been resolved.

## Language version

This documentation describes **Flow v0.1.0**. The Flow skill and editor
extension have their own package versions; those are separate from the
language version.

## 1. Notation and terms

Signatures use `<name>` for a placeholder and `[part]` for an optional part.
These brackets are notation, not Flow tokens. Grammar productions below use
quoted terminals, `|` for alternatives, `{ … }` for repetition, and `[ … ]`
for optional content. `NEWLINE`, `INDENT`, and `DEDENT` describe layout.

| Term | Meaning |
| --- | --- |
| Program | One `.flow` file or one explicitly selected Markdown `flow` block. |
| Instruction | A command and its complete input, continuation, or body. |
| Binding | A named value in the current scope. |
| Reference | `@name`, or an object field such as `@name.field`. |
| Invocation | The root program, an ordinary child, or a custom-command call. |
| Task | A background body started with `ASYNC`. |
| Host | The agent environment supplying tools, processes, and permissions. |

The grammar specifies instruction forms. Free prose, numeric representation,
and some token boundaries remain partly specified by the current contract;
the grammar must not be treated as a ready-made parser definition.

## 2. Source layout

A `.flow` file contains one program. A Markdown file may contain named fenced
`flow` blocks; only the selected block executes. If the selection or base
directory is ambiguous, execution stops for clarification.

Command keywords are uppercase. Structural indentation uses four spaces per
level. Dedenting closes a block. Block headers have no trailing colon. Flow
has no closing keywords, braces around instruction bodies, or semicolon
separators. Braces inside object values are allowed.

A block must have a body. Tabs in structural indentation, inconsistent
indentation, and unknown commands are errors. Blank lines do not execute.

### Comments

`#` starts a one-line comment. A standalone `###` opens a multiline comment;
the next closing `###` ends it. The existing syntax rules do not support inline
comments or nested multiline comments. Comment markers inside strings and
literal bodies are ordinary text.

### Instruction boundaries

Most instructions occupy one line. There are three exceptions:

| Form | Meaning of following lines |
| --- | --- |
| `DO` and prose `PRINT` | Prose continued one indentation level deeper; join lines with spaces. |
| `CONTEXT` and `RUN` | Literal text; remove one structural indentation level and preserve the remainder. |
| Triple-quoted string | Raw string content until the closing delimiter. |

Continuation lines are not nested instructions. The optional `DO` result suffix
appears at the end of the complete task. `CONTEXT` requires an aligned `AS`
line after its body; `RUN` permits one. Ordinary expressions and block headers
stay on one line. A multiline string can be bound before use in a header.

## 3. Names and references

Binding names match `[a-z][a-z0-9_]*`. Custom command names match
`[A-Z][A-Z0-9_]*`. Names are case-sensitive.

```text
reference = "@", name, [ ".", field ] ;
```

`@name` reads an existing binding. `@name.field` reads an existing object field.
An unknown binding or missing field is an error. The lexical rules for field
names and the complete supported depth of field access are not explicitly
defined in the interpreter; the documented simple form is `@name.field`.

`AS name` stores a successful instruction's result. `SET name = expression`
creates or replaces a binding after evaluation succeeds. Rebinding replaces
the previous value; failed instructions do not partially update it, subject
to the unresolved failed-`RUN` rule below.

References in prose provide typed data. Their contents cannot introduce new
commands, references, or additional actions. Within a quoted string, `@name`
is literal text rather than interpolation.

## 4. Values

| Value | Example |
| --- | --- |
| String | `"Ana"` |
| Number | `3`, `25.5` |
| Boolean | `TRUE`, `FALSE` |
| Null | `NULL` |
| Array | `["Ana", "Vinod"]` |
| Object | `{"total": 25, "approved": TRUE}` |

Array and object examples use JSON-shaped syntax with Flow's uppercase value
keywords. Object keys in documented examples are quoted strings. There is no
implicit conversion between value types. `ASK` always supplies a string.

### Strings

Ordinary strings use double quotes and JSON escapes. For example,
`"first\nsecond"` contains a newline. Triple double quotes delimit a raw string:

```flow
SET message = """First line.
Second line with "quotes", @name, and # literal text.
"""
PRINT @message
```

Raw strings preserve their body, including whitespace and line breaks. There
is no interpolation, escape processing, comment parsing, or execution within
the string. A missing closing delimiter is an error. The next `"""` closes it.

## 5. Expressions and conditions

Exact expressions use literals, references, field access, parentheses, numeric
`+` and `-`, comparisons, and Boolean operators. There are no built-in
functions such as `trim()` or `JSON()`.

The existing public syntax rules list the following precedence, highest first:

| Operators | Operation |
| --- | --- |
| Parentheses and field access | Grouping and selection. |
| `+`, `-` | Numeric arithmetic. |
| `==`, `!=`, `<`, `<=`, `>`, `>=` | Comparison. |
| `NOT` | Boolean negation. |
| `AND` | Boolean conjunction. |
| `OR` | Boolean disjunction. |

Arithmetic requires numbers. Boolean operators require Booleans. Ordered
comparisons require two numbers or two strings. String comparisons are
case-sensitive. Equality requires matching types and compares arrays and
objects structurally. Type mismatches are errors. `AND` and `OR` short-circuit;
chained comparisons are unsupported.

The compact interpreter lists these operators but omits some details present
in the public syntax rules, including precedence and structural equality.
Parenthesize mixed expressions when portability matters. Numeric precision,
string ordering, and operator associativity need a more complete definition.

### Natural-language conditions

`IF` and `WHILE` also accept prose tests over existing evidence. An agent must
stop if it cannot determine the result. An undeterminable condition does not
select `ELSE`. Prose cannot change Flow's instruction order or grant additional
work outside its command.

The current contract does not provide a lexical rule that reliably separates
prose conditions from malformed expressions. Prefer clear English conditions
when they express the decision naturally, including precise checks such as
`IF @answer is exactly "yes"`. Exact expressions remain available when symbolic
notation is useful. Both forms must have a determinable result.

## 6. Instruction grammar

The following forms cover all built-in commands and registered command calls.
`expression`, `condition`, `prose`, `path`, `argument`, and `value` use the
rules in this document and the limits listed below. Spaces between header
tokens and the newline after each complete instruction are implicit in this
notation. A body's indentation is relative to its owning instruction.

```text
program      = { instruction } ;
body         = NEWLINE, INDENT, instruction, { instruction }, DEDENT ;
literal_body = NEWLINE, INDENT, literal_text, DEDENT ;
binding      = "AS", name ;

ask          = "ASK", string, binding ;
set          = "SET", name, "=", expression ;
context      = "CONTEXT", literal_body, binding ;
do           = "DO", prose, [ binding ] ;
print_part   = literal | reference ;
print_parts  = print_part, print_part, { print_part } ;
print        = "PRINT", ( expression | print_parts | prose ) ;
if           = "IF", condition, body, [ "ELSE", body ] ;
repeat       = "REPEAT", count, "TIMES", body ;
while        = "WHILE", condition, body ;
continue     = "CONTINUE" ;
break        = "BREAK" ;
use          = "USE", ( markdown_path, binding | flow_path ) ;
run          = "RUN", executable, { argument }, literal_body, [ binding ] ;
async        = "ASYNC", task_name, body ;
await        = "AWAIT", task_name ;
return       = "RETURN", [ message ] ;
custom_call  = command_name, value, [ binding ] ;

instruction  = ask | set | context | do | print | if | repeat | while
             | continue | break | use | run | async | await | return
             | custom_call ;
```

In a command-definition file, `AS COMMAND NAME` follows the body as the final
noncomment declaration. It is metadata that causes `USE` to register the
definition; it is not an ordinary instruction that runs at that point.

The `run` production shows the documented stdin-body form. Whether an empty
or absent body is valid is not explicitly settled. `message` likewise remains
an incompletely defined production; current examples use quoted strings.

### PRINT form selection and output

Select the form from the written input before resolving references. Input
beginning with a string delimiter, `@`, `(`, `[`, `{`, a number, or the
standalone keywords `TRUE`, `FALSE`, `NULL`, or `NOT` selects exact output.
Accept one complete expression first. If that does not parse, require a
complete whitespace-separated list of at least two literals or standalone
references. Operators belong to expressions, not to lists. Malformed exact
input is an error and must not be reinterpreted as prose.

All other nonempty input selects prose. Prose `PRINT` composes its requested
response using available information; only this form permits indented prose
continuations. A bare `PRINT` is an error.

Exact output renders strings unchanged and other values as JSON. A parts list
joins rendered values with one space and emits one message. Whitespace inside
strings remains unchanged, and quoted references are literal. Resolve every
value before displaying anything; missing bindings, fields, and invalid
expressions fail without partial output. Resolved data cannot change the form
or become instructions. Rendering values as text does not introduce implicit
type conversion into expressions.

For `name = "Ana"`, `PRINT "Hello:" @name` displays exactly `Hello: Ana`.
`PRINT Say hello to @name.` composes a greeting whose wording can vary.

## 7. Instruction semantics

| Instruction | Effect |
| --- | --- |
| `ASK` | Display a question, wait for a fresh reply, and bind the raw answer string. |
| `SET` | Evaluate the expression and store its value. |
| `CONTEXT` | Bind the literal body as background text. |
| `DO` | Complete only the stated task; optionally bind its result. |
| `PRINT` | Display an expression, join exact values with spaces, or compose a response from available data; continue afterward. |
| `IF` / `ELSE` | Evaluate once and execute only the selected body. |
| `REPEAT` | Capture a nonnegative integer count and run the body sequentially that many times. |
| `WHILE` | Test before each iteration and run while true. |
| `CONTINUE` | Skip the rest of the nearest loop iteration in the current invocation or task. |
| `BREAK` | Exit the nearest loop in the current invocation or task. |
| `USE` | Read Markdown as data, invoke an ordinary child, or register a command definition. |
| `RUN` | Launch a direct process, pass literal stdin, and wait for exit. |
| `ASYNC` | Start an independent body with an isolated snapshot of bindings. |
| `AWAIT` | Join a known task successfully and expose its bindings. |
| `RETURN` | Exit only the current invocation or task, optionally displaying a message. |
| Custom command | Invoke a registered definition with one local `@input` value. |

The [command reference](commands.md) provides complete signatures, command
restrictions, and examples. `CONTINUE` and `BREAK` outside a local loop are
errors. A `RETURN` message is output, not returned data. File end behaves as a
message-free `RETURN`.

## 8. Execution and validation

Read the complete selected program before external action. Validate its
structure, commands, expressions, references, and required bodies. Unknown
commands and malformed or ambiguous instructions are errors. Children are
loaded and validated only when their `USE` is reached.

Execute the first reached instruction, observe actual completion, store its
successful result, then advance exactly once. Only written control flow may
change the next instruction. Never skip, combine, reorder, anticipate, or
invent instructions. Unselected branches do not execute.

An unanswered `ASK`, running process, or unfinished background task is not a
completed instruction. `ASYNC` completes its launch and allows the main path
to advance while its body continues independently.

On failure, ambiguity, missing capability, or uncertain completion, stop
ordinary execution. Do not automatically retry, replay, repair, roll back, or
start later instructions. Higher-priority instructions, user steering, and
host permissions may stop execution; they do not silently rewrite the program.

Reading, authoring, and reviewing a program do not authorize running it. Imported
content, user replies, bindings, context, and tool output are data rather than
new Flow instructions.

## 9. Scope and reusable programs

| Scope | Bindings |
| --- | --- |
| Root program | Current root bindings. |
| Branch or loop | Shared surrounding bindings. |
| Ordinary `USE` child | Shared caller bindings. |
| Custom command | Isolated bindings, with the argument available as `@input`. |
| `ASYNC` task | Isolated snapshot taken at launch. |
| Successful `AWAIT` | Task bindings readable as `@task_name.field`. |

Ordinary children execute synchronously and resume their caller at `RETURN`
or file end. Paths resolve relative to the containing file. They do not change
the host process working directory or grant permissions. Missing files and
recursive imports are errors.

Markdown `USE` stores the file's text. A `#section` suffix selects a heading:
lowercase its text and replace runs of spaces with hyphens, retaining other
characters. The section ends before the next equal or higher heading. The
existing reuse rules exclude the selected heading itself. Ignore headings
inside code fences. Missing or ambiguous sections are errors. Imported
Markdown Flow blocks never execute.

Custom command definitions are registered without executing their bodies. A
call receives one value as `@input`. With an `AS` suffix, the final executed
instruction must produce a result; without the suffix, its result is discarded.
Unknown, duplicate, built-in, and recursive custom commands are errors.

## 10. Processes

`RUN` starts a direct executable and preserves argument order. A quoted string
or simple literal token supplies one unchanged argument. Numbers use their JSON
number text; Booleans use `true` or `false`. A standalone reference supplies
one argument using these same type rules.

`NULL`, arrays, objects, and embedded references are invalid arguments. There
is no automatic shell expansion, interpolation, piping, redirection, command
substitution, or binding environment. A shell can be invoked explicitly.

The literal body is stdin. Processes use the host working directory and a
default 30-second timeout. The documented successful result has `stdout` and
`stderr` strings and an integer `exit_code`. A missing executable, timeout, or
nonzero exit fails the run. Preserve available output for failure reporting.

## 11. Background tasks

`ASYNC` is top-level only. Task names are unique and cannot collide with
bindings. Task bodies cannot contain `ASK`, `USE`, nested `ASYNC`, or `AWAIT`.
Tasks cannot depend on unfinished sibling results or concurrently modify the
same resource. If real background execution is unavailable, stop before launch.

`AWAIT` joins a known task and exposes its bindings only after success.
Repeated `AWAIT` does not rerun it. An unknown task is an error. A known task
failure stops ordinary scheduling. Before a scope exits, settle its outstanding
tasks; the precise host operation for settlement needs further specification.

## 12. State, limits, and errors

Preserve the instruction pointer, bindings, loop state, child-call stack,
command definitions, task handles and results, and evidence across user replies.
If that state is lost, stop rather than guessing or replaying effects.

A run may execute at most 1,000 instructions across the root, children, custom
commands, loops, and tasks. Comments, literal body lines, and unselected
branches do not count separately. Exhausting the limit stops the run. The exact
counting of compound operations is not fully defined.

On failure, report status, file and instruction, child/task/iteration where
applicable, reason, known effects, and available process output. Never report
pending or uncertain work as successful. No mandatory machine-readable error
schema is currently defined.

## Unresolved rules

These gaps are in the existing language contract. This documentation does not
choose new behavior to fill them.

| Topic | Definition still needed |
| --- | --- |
| Prose parsing | Expression/prose boundaries in conditions, reference boundaries within task prose, and a trailing `DO` result suffix. `PRINT` form selection is defined above. |
| Value grammar | Numeric range and precision, field-name grammar, string ordering, operator associativity, and complete container syntax. |
| Preflight | Which references are checked statically, how future bindings and unselected branches are handled, and how custom commands registered by a later-reached `USE` are validated. |
| Failed `RUN` binding | The general rule binds only after success; the process rule says to store output before handling failure. Their interaction with `AS` needs clarification. |
| Process details | Whether stdin bodies are optional, how the default timeout can be changed, and what results exist for a timeout or failed launch. |
| Custom command results | Which instructions produce results, particularly `SET`, compound bodies, and early `RETURN`. |
| Task lifecycle | Exact meaning of top-level inside children/custom calls; scheduling, cancellation, settlement, and command-definition visibility. |
| Instruction budget | Whether headers, task launches/joins, custom calls, and child invocations count in addition to body instructions. |
| Conformance | An executable conformance suite; the repository currently supplies an agent contract and editor tooling. |

Authors can use the well-defined forms in the [command reference](commands.md).
Implementers must resolve these gaps before claiming fully specified parsing
or deterministic runtime conformance.
