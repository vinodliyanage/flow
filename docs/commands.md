---
description: Look up every Flow command with syntax, behavior, results, restrictions, and readable examples.
---

# Command reference

Every built-in command is listed here. Each entry gives its form, behavior,
result, restrictions, and an example. The [language specification](specification.md)
defines the shared syntax, values, scopes, and execution rules.

In signatures, angle brackets name placeholders and square brackets mark
optional parts. Do not type those brackets. `body` means indented instructions;
`literal body` means text that Flow does not execute. Flow 0.7.0 keywords are
lowercase and case-sensitive. A trailing `as @name` writes a simple destination;
elsewhere `@name` reads an existing value.

| Command | Purpose |
| --- | --- |
| [ask](#ask) | Ask for a fresh user answer and wait. |
| [set](#set) | Create or replace a binding. |
| [context](#context) | Store literal background text. |
| [do](#do) | Complete an agent task. |
| [print](#print) | Display a value or compose a report. |
| [if / else](#if-and-else) | Select a branch. |
| [repeat](#repeat) | Repeat a body a fixed number of times. |
| [while](#while) | Repeat while a condition is true. |
| [continue](#continue) | Advance to the next loop iteration. |
| [break](#break) | Leave a loop. |
| [use](#use) | Read Markdown or run a child with shared state. |
| [command](#command) | Define an uppercase reusable command. |
| [flow](#flow) | Define a reusable flow with a lowercase label. |
| [run](#run) | Launch a direct process. |
| [async](#async) | Start an independent background task. |
| [await](#await) | Join a task and expose its bindings. |
| [return](#return) | Exit the current invocation, optionally returning a value. |
| [Custom command call](#custom-command-call) | Invoke a registered command or flow with optional input. |

## ask

```text
ask <string> as @<name>
```

Display only the question verbatim and wait silently for a fresh user reply.
Store the raw answer as a string in `name`, including an empty answer. A later instruction on the same
path cannot start while the question is unanswered. Reaching `ask` again asks
again; previous answers are not reused.

```flow
ask "What is your name?" as @name
print @name
```

**Result:** the answer string. `as @name` is required. `ask` is prohibited inside
an `async` body. It does not convert a numeric-looking answer into a number.

## set

```text
set <name> = <expression>
```

Evaluate the expression, then create or replace `name`. Evaluation cannot
perform an external action. If evaluation fails, leave the old binding intact.

```flow
set count = 2
set count = @count + 1
print @count
```

**Binding:** `count` holds `3`. `set` uses the name before `=`, rather than an
`as` suffix. Its instruction result is the stored value, so a final direct
`set` can supply a command or flow's result. Unknown references and invalid
operand types are errors.

## context

```text
context as @<name>
    <literal body>

context
    <literal body>
as @<name>
```

Store the body as background text. Remove one structural indentation level and
preserve the remaining whitespace and line breaks. Exactly one `as @name`
is required: on the header or on the next nonblank line after the body,
aligned with `context`. No comment or instruction may intervene. A binding
in both positions is an error. References, comments, and binding-like text
inside the indented body remain literal. Both forms store the same body text.

```flow
context
    Write one short sentence.
    Use only the information supplied in the task.
as @guidelines

do Describe the Flow language following @guidelines as @description
print @description
```

**Result:** the body string. Storing context does not execute it; a later task
references it explicitly.

## do

```text
do <task> [as @<name>]
```

Complete the stated task, using tools when the task requires them. Resolve
references as data. An immediately following prose continuation is indented one
level; join continuation lines with spaces. Put the optional `as @name` at the
end of the complete task. Ordinary English `as` phrases stay task text; only
the trailing `as @name` outside strings is a result binding.

```flow
do Describe how ask pauses execution.
    Return an object with a summary string and an examples array as @description
print @description.summary
```

**Result:** the task's completed output; optionally stored with `as`. State the
required result shape when later instructions use fields. The output is produced
by the agent, so the language does not give it a fixed schema automatically.

The task authorizes only its stated work. Unrelated setup, repair, retries,
cleanup, publication, and additional artifacts are not added automatically.
Failure or uncertain completion stops ordinary execution.

## print

```text
print <expression>
print <part> <part> ...
print <report request>
```

Use exact output when you already know the text and values to display. Use a
prose instruction when the agent should compose the response from available
information.

```flow
set name = "Ana"
print "Hello:" @name
print Say hello to @name.
```

The first `print` displays exactly `Hello: Ana`. The second asks the agent to
generate a greeting, so its wording can vary.

An exact `print` accepts one complete expression, or two or more literals and
standalone references separated by whitespace. Render strings unchanged and
other values as JSON. Join multiple rendered parts with one space and display
one message. Preserve whitespace inside strings; `"@name"` stays literal.

```flow
set count = 2
print @count + 1
print "Count:" @count
print "Literal:" "@count"
```

These display `3`, `Count: 2`, and `Literal: @count`. Operators belong to a
single expression, not to the parts list. Bind a calculation first when it
needs to be combined with a label.

Input beginning with a string delimiter, `@`, `(`, `[`, `{`, a number, or the
standalone keywords `true`, `false`, `null`, or `not` selects exact output.
Try one complete expression, then a complete list of literals/references.
Malformed exact input is an error, not prose. Other nonempty input selects
the prose form; only that form accepts indented prose continuations.

**Result:** one displayed message; no binding. Resolve all values before any
output. A missing reference or invalid expression fails without partial output.
A bare `print` is an error. `print` cannot perform new research or other external
work, and it does not exit the program.

Emit each `print` as a separate user-visible intermediate message before any
later instruction or tool call. Use the commentary channel where available,
then continue without waiting for a reply. Buffering output until the final
answer does not complete the instruction.

## if and else

```text
if <condition>
    <body>
[else
    <body>]
```

Evaluate the condition once. Execute the `if` body when true; otherwise execute
the optional `else` body. `else` aligns with its `if` and immediately follows
the body, allowing intervening blank lines or comments. Nest another `if`
inside `else` for another alternative.

```flow
ask "Proceed? Type yes or no." as @answer
if @answer is exactly "yes"
    print "Proceeding."
else
    print "Cancelled."
    return
```

**Result:** no branch result is specified; body instructions may update shared
bindings. Prefer plain-English conditions when they describe the decision clearly.
For a precise text check, say `is exactly "yes"` or `is not exactly "yes"`.
An empty string has zero characters; whitespace alone is not empty. Exact
Boolean expressions are also supported. Missing evidence is an error, not a
false condition.

## repeat

```text
repeat <count> times
    <body>
```

Capture a nonnegative integer count once on entry. Run the body sequentially
that many times, sharing bindings with the surrounding scope. Zero skips it.
Use an integer literal or a binding containing an integer.

```flow
set repetitions = 3
repeat @repetitions times
    print "Hello."
```

**Result:** no loop result is specified. A negative or noninteger count is an
error. Updating `repetitions` in the body does not change the captured count.
Reached body instructions count toward the run's shared instruction limit.

## while

```text
while <condition>
    <body>
```

Evaluate the condition before each iteration. Run the body while true, with
shared bindings. A false first condition skips the body.

```flow
set count = 0
while @count is less than 3
    print @count
    set count = @count + 1
```

**Result:** no loop result is specified. Conditions have the same rules as
`if`. An undeterminable condition or exhausted instruction limit stops the run.

## continue

```text
continue
```

Skip the rest of the nearest current loop iteration. `while` evaluates its
condition again; `repeat` proceeds to its next iteration.

```flow
set count = 0
while @count is less than 3
    set count = @count + 1
    if @count is exactly 2
        continue
    print @count
```

This displays `1` and `3`. **Result:** none. The command is an error outside a
loop in the current invocation or task; it cannot control a caller's loop.

## break

```text
break
```

Exit the nearest current loop and continue after it.

```flow
repeat 3 times
    print "Once."
    break
print "After the loop."
```

**Result:** none. The command is an error outside a loop in the current
invocation or task; it cannot control a caller's loop.

## use

```text
use <path.md> as @<name>
use <path.md#section> as @<name>
use <path.flow>
```

The target determines the operation:

| Target | Behavior | Data visible afterward |
| --- | --- | --- |
| Markdown file or heading section | Read text as data. | Text stored in the required `as` binding. |
| `.flow` file | Read, validate, and run the child synchronously. Reached declarations register reusable bodies. | Caller and child share bindings and callable registrations. |

Leading top-level `use` instructions form the file import header. Flow loads
that header once in source order. Its bindings and callable registrations are
available to every command and flow declared in the file; each invocation gets
an isolated copy of the imported bindings. Put the header before the first
non-`use` declaration or instruction.

Elsewhere, `use` is dynamic. Flow loads it only when execution reaches that
instruction in the current scope, so an unselected branch does not import it.

Paths are literal and resolve from the containing program's directory. `use`
does not change the process working directory. Read a child only when the
instruction is reached. Missing files, ambiguous Markdown sections, and recursive
imports are errors. `use` is prohibited in an `async` body.

For example, given a `guidelines.md` file beside the program:

```flow
use guidelines.md as @guidelines
do Write a short greeting following @guidelines as @greeting
print @greeting
```

See [reusing programs](reuse.md) for complete child and custom-command examples
and the Markdown section-selection rules.

## command

```text
command <COMMAND_NAME>
    <body>
```

Register an uppercase command when the declaration is reached. Its nonempty body
does not execute until called. Definitions belong at file or selected-block top
level and may appear alongside ordinary instructions.

```flow
command ADD_TWO
    return @input + 2

ADD_TWO 3 as @total
print @total
```

**Result:** registration produces none. A call receives isolated local `@input`
and may expose an explicit returned value or its final direct instruction's
result. Duplicate or built-in names, nested definitions, and direct or indirect
recursion fail.

## flow

```text
flow <name>
    <body>
```

Define a reusable flow with a lowercase label matching `[a-z][a-z0-9_]*`.
It follows the same registration, scope, input, and result rules as a command.
Call its label as a standalone instruction; flow calls are not expressions.

```flow
flow add_one
    return @input + 1

add_one 4 as @next
print @next
```

**Result:** registration produces none; this call returns `5`. Commands and
flows may call each other. Bare lowercase labels call flows, `@name`
reads data, and `await name` joins tasks. `async name` retains its task-body
syntax and launches immediately; it does not require `flow`.

## run

```text
run <executable> [<arguments>] [as @<name>]
[    <literal stdin body>]

run <executable> [<arguments>]
[    <literal stdin body>]
as @<name>
```

Launch a direct process. An optional literal body becomes standard input; the
optional `as @name` ends the header or follows the body on the next nonblank
line aligned with `run`. Without stdin, that line may follow the header.
No comment or instruction may intervene. Choose one position; duplicate
bindings are an error. The binding belongs to the run instruction and is
excluded from argv and stdin. Store it only after the process succeeds.
Keep the instruction active until the process exits.

```flow
set name = "Ana Maria"
run python3 - @name
    import sys
    print(f"Hello, {sys.argv[1]}!")
as @result
print @result.stdout
```

This example requires `python3` on the host. **Result:** an object with string
`stdout`, string `stderr`, and integer `exit_code` for a completed process.

| Argument | Process argument |
| --- | --- |
| Quoted string or simple literal token | One unchanged argument. |
| Number | Its JSON number text. |
| Boolean | `true` or `false`. |
| Standalone reference | Its value, subject to these same type rules. |

`null`, arrays, objects, and references embedded in other tokens are invalid
arguments. There is no shell expansion, interpolation, piping, redirection,
command substitution, or automatic environment containing Flow bindings.
Invoke a shell explicitly when needed:

```flow
run sh as @status
    git status --short
```

That example requires `sh`, Git, and a Git working directory. Processes use the
host working directory and a default 30-second timeout. A nonzero exit, timeout,
or missing executable fails the run. Available output is retained for reporting;
a failed instruction leaves its requested `as` binding unchanged.

## async

```text
async <task_name>
    <body>
```

Start the body as an independent background task and immediately advance the
main path. The task runs its instructions sequentially, using an isolated
snapshot of bindings and callable registrations taken at launch.

```flow
async first
    do Write a short greeting in English as @greeting
async second
    do Write a short greeting in Spanish as @greeting
await first
await second
print @first.greeting
print @second.greeting
```

**Result:** a named task that can be joined with `await`. Task names are unique
and cannot collide with bindings. `async` is at invocation top level, outside
branches, loops, and tasks. Its body cannot perform `ask`, `use`, `async`, or
`await`, including indirectly through flow or command calls.

Tasks must not depend on unfinished sibling results or concurrently change
the same resource. If the host cannot run real background work, stop before
launch. Sequential work must not be presented as concurrent execution.

## await

```text
await <task_name>
```

Wait for a known task to finish successfully, then expose its bindings as
`@task_name.field`. Repeating `await` does not rerun the task.

```flow
async calculation
    set total = 20 + 5
await calculation
print @calculation.total
```

**Result:** the task's bindings become accessible; an explicit return value is
available as `@calculation.result`. `await` takes no `as` suffix. An unknown task
is an error. A known task failure stops ordinary scheduling. `await` is prohibited
inside an `async` body.

## return

```text
return [<expression>]
```

Evaluate the optional expression once, exit the current invocation normally,
and supply its value without displaying it. Reaching file end has the same
effect as a bare `return` unless a callable's final direct instruction supplies
a result.

```flow
print "Before return."
return {"status": "finished"}
```

**Result:** the object is returned without being displayed. In the root program,
it becomes the program result available to the host; in an ordinary child, it
resumes the caller and discards the value; in a command or flow, it supplies the
call result; in a task, it becomes the task's `result` field after `await`.
Outstanding tasks settle before a scope exits. Use `print` before `return` when
the user must see a message.

## Custom command call

```text
<COMMAND_NAME> [<expression>] [as @<name>]
<flow_name> [<expression>] [as @<name>]
```

Reach a definition directly or through `use`, then pass an optional expression
as local `@input`. Evaluate it once in the caller; omitted input is `null`.
The invocation has isolated copies of its defining file imports, local `@input`,
and inherited callable registrations.
With `as @name`, an explicit `return` value or the final direct instruction's
result is stored in the caller. Without `as`, discard the result.

In `trim.flow`:

```flow
command TRIM
    do Remove surrounding whitespace from @input as @trimmed
    return @trimmed
```

In the caller beside `trim.flow`:

```flow
use trim.flow
TRIM "  Ana  " as @name
print @name
```

**Result:** the explicit returned value, or otherwise the final direct
instruction's result, is optionally stored in the caller. A bare `return`, final
`if`, or final `print` provides no result; a bound call ending this way fails
instead of reusing an earlier value.
Unknown names, duplicate definitions, built-in name collisions, and recursive
calls are errors. See [custom-command scope](reuse.md#custom-commands) before
building larger definitions.
