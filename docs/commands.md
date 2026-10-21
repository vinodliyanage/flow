---
description: Look up every Flow command with syntax, behavior, results, restrictions, and readable examples.
---

# Command reference

Every built-in command is listed here. Each entry gives its form, behavior,
result, restrictions, and an example. The [language specification](specification.md)
defines the shared syntax, values, scopes, and execution rules.

In signatures, angle brackets name placeholders and square brackets mark
optional parts. Do not type those brackets. `body` means indented instructions;
`literal body` means text that Flow does not execute.

| Command | Purpose |
| --- | --- |
| [ASK](#ask) | Ask for a fresh user answer and wait. |
| [SET](#set) | Create or replace a binding. |
| [CONTEXT](#context) | Store literal background text. |
| [DO](#do) | Complete an agent task. |
| [PRINT](#print) | Display a value or compose a report. |
| [IF / ELSE](#if-and-else) | Select a branch. |
| [REPEAT](#repeat) | Repeat a body a fixed number of times. |
| [WHILE](#while) | Repeat while a condition is true. |
| [CONTINUE](#continue) | Advance to the next loop iteration. |
| [BREAK](#break) | Leave a loop. |
| [USE](#use) | Read Markdown or run a child with shared state. |
| [COMMAND](#command) | Define an uppercase reusable command. |
| [FLOW](#flow) | Define a reusable flow with a lowercase label. |
| [RUN](#run) | Launch a direct process. |
| [ASYNC](#async) | Start an independent background task. |
| [AWAIT](#await) | Join a task and expose its bindings. |
| [RETURN](#return) | Exit the current invocation. |
| [Custom command call](#custom-command-call) | Invoke a registered command or flow with optional input. |

## ASK

```text
ASK <string> AS <name>
```

Display only the question verbatim and wait silently for a fresh user reply.
Store the raw answer as a string in `name`, including an empty answer. A later instruction on the same
path cannot start while the question is unanswered. Reaching `ASK` again asks
again; previous answers are not reused.

```flow
ASK "What is your name?" AS name
PRINT @name
```

**Result:** the answer string. `AS name` is required. `ASK` is prohibited inside
an `ASYNC` body. It does not convert a numeric-looking answer into a number.

## SET

```text
SET <name> = <expression>
```

Evaluate the expression, then create or replace `name`. Evaluation cannot
perform an external action. If evaluation fails, leave the old binding intact.

```flow
SET count = 2
SET count = @count + 1
PRINT @count
```

**Binding:** `count` holds `3`. `SET` uses the name before `=`, rather than an
`AS` suffix. Its instruction result is the stored value, so a final direct
`SET` can supply a command or flow's result. Unknown references and invalid
operand types are errors.

## CONTEXT

```text
CONTEXT
    <literal body>
AS <name>
```

Store the body as background text. Remove one structural indentation level and
preserve the remaining whitespace and line breaks. The aligned `AS name` is
required. References, comments, and commands inside the body remain literal.

```flow
CONTEXT
    Write one short sentence.
    Use only the information supplied in the task.
AS guidelines

DO Describe the Flow language following @guidelines. AS description
PRINT @description
```

**Result:** the body string. Storing context does not execute it; a later task
references it explicitly.

## DO

```text
DO <task> [AS <name>]
```

Complete the stated task, using tools when the task requires them. Resolve
references as data. An immediately following prose continuation is indented one
level; join continuation lines with spaces. Put the optional `AS name` at the
end of the complete task.

```flow
DO Describe how ASK pauses execution.
    Return an object with a summary string and an examples array. AS description
PRINT @description.summary
```

**Result:** the task's completed output; optionally stored with `AS`. State the
required result shape when later instructions use fields. The output is produced
by the agent, so the language does not give it a fixed schema automatically.

The task authorizes only its stated work. Unrelated setup, repair, retries,
cleanup, publication, and additional artifacts are not added automatically.
Failure or uncertain completion stops ordinary execution.

## PRINT

```text
PRINT <expression>
PRINT <part> <part> ...
PRINT <report request>
```

Use exact output when you already know the text and values to display. Use a
prose instruction when the agent should compose the response from available
information.

```flow
SET name = "Ana"
PRINT "Hello:" @name
PRINT Say hello to @name.
```

The first `PRINT` displays exactly `Hello: Ana`. The second asks the agent to
generate a greeting, so its wording can vary.

An exact `PRINT` accepts one complete expression, or two or more literals and
standalone references separated by whitespace. Render strings unchanged and
other values as JSON. Join multiple rendered parts with one space and display
one message. Preserve whitespace inside strings; `"@name"` stays literal.

```flow
SET count = 2
PRINT @count + 1
PRINT "Count:" @count
PRINT "Literal:" "@count"
```

These display `3`, `Count: 2`, and `Literal: @count`. Operators belong to a
single expression, not to the parts list. Bind a calculation first when it
needs to be combined with a label.

Input beginning with a string delimiter, `@`, `(`, `[`, `{`, a number, or the
standalone keywords `TRUE`, `FALSE`, `NULL`, or `NOT` selects exact output.
Try one complete expression, then a complete list of literals/references.
Malformed exact input is an error, not prose. Other nonempty input selects
the prose form; only that form accepts indented prose continuations.

**Result:** one displayed message; no binding. Resolve all values before any
output. A missing reference or invalid expression fails without partial output.
A bare `PRINT` is an error. `PRINT` cannot perform new research or other external
work, and it does not exit the program.

## IF and ELSE

```text
IF <condition>
    <body>
[ELSE
    <body>]
```

Evaluate the condition once. Execute the `IF` body when true; otherwise execute
the optional `ELSE` body. `ELSE` aligns with its `IF` and immediately follows
the body, allowing intervening blank lines or comments. Nest another `IF`
inside `ELSE` for another alternative.

```flow
ASK "Proceed? Type yes or no." AS answer
IF @answer is exactly "yes"
    PRINT "Proceeding."
ELSE
    RETURN "Cancelled."
```

**Result:** no branch result is specified; body instructions may update shared
bindings. Prefer plain-English conditions when they describe the decision clearly.
For a precise text check, say `is exactly "yes"` or `is not exactly "yes"`.
An empty string has zero characters; whitespace alone is not empty. Exact
Boolean expressions are also supported. Missing evidence is an error, not a
false condition.

## REPEAT

```text
REPEAT <count> TIMES
    <body>
```

Capture a nonnegative integer count once on entry. Run the body sequentially
that many times, sharing bindings with the surrounding scope. Zero skips it.
Use an integer literal or a binding containing an integer.

```flow
SET repetitions = 3
REPEAT @repetitions TIMES
    PRINT "Hello."
```

**Result:** no loop result is specified. A negative or noninteger count is an
error. Updating `repetitions` in the body does not change the captured count.
Reached body instructions count toward the run's shared instruction limit.

## WHILE

```text
WHILE <condition>
    <body>
```

Evaluate the condition before each iteration. Run the body while true, with
shared bindings. A false first condition skips the body.

```flow
SET count = 0
WHILE @count is less than 3
    PRINT @count
    SET count = @count + 1
```

**Result:** no loop result is specified. Conditions have the same rules as
`IF`. An undeterminable condition or exhausted instruction limit stops the run.

## CONTINUE

```text
CONTINUE
```

Skip the rest of the nearest current loop iteration. `WHILE` evaluates its
condition again; `REPEAT` proceeds to its next iteration.

```flow
SET count = 0
WHILE @count is less than 3
    SET count = @count + 1
    IF @count is exactly 2
        CONTINUE
    PRINT @count
```

This displays `1` and `3`. **Result:** none. The command is an error outside a
loop in the current invocation or task; it cannot control a caller's loop.

## BREAK

```text
BREAK
```

Exit the nearest current loop and continue after it.

```flow
REPEAT 3 TIMES
    PRINT "Once."
    BREAK
PRINT "After the loop."
```

**Result:** none. The command is an error outside a loop in the current
invocation or task; it cannot control a caller's loop.

## USE

```text
USE <path.md> AS <name>
USE <path.md#section> AS <name>
USE <path.flow>
```

The target determines the operation:

| Target | Behavior | Data visible afterward |
| --- | --- | --- |
| Markdown file or heading section | Read text as data. | Text stored in the required `AS` binding. |
| `.flow` file | Read, validate, and run the child synchronously. Reached declarations register reusable bodies. | Caller and child share bindings and callable registrations. |

Paths are literal and resolve from the containing program's directory. `USE`
does not change the process working directory. Read a child only when the
instruction is reached. Missing files, ambiguous Markdown sections, and recursive
imports are errors. `USE` is prohibited in an `ASYNC` body.

For example, given a `guidelines.md` file beside the program:

```flow
USE guidelines.md AS guidelines
DO Write a short greeting following @guidelines. AS greeting
PRINT @greeting
```

See [reusing programs](reuse.md) for complete child and custom-command examples
and the Markdown section-selection rules.

## COMMAND

```text
COMMAND <COMMAND_NAME>
    <body>
```

Register an uppercase command when the declaration is reached. Its nonempty body
does not execute until called. Definitions belong at file or selected-block top
level and may appear alongside ordinary instructions.

```flow
COMMAND ADD_TWO
    SET result = @input + 2

ADD_TWO 3 AS total
PRINT @total
```

**Result:** registration produces none. A call receives isolated local `@input`
and may expose its final direct instruction's result. Duplicate or built-in
names, nested definitions, and direct or indirect recursion fail. Legacy
`AS COMMAND NAME` footers are errors.

## FLOW

```text
FLOW <name>
    <body>
```

Define a reusable flow with a lowercase label matching `[a-z][a-z0-9_]*`.
It follows the same registration, scope, input, and result rules as a command.
Call its label as a standalone instruction; flow calls are not expressions.

```flow
FLOW add_one
    SET result = @input + 1

add_one 4 AS next
PRINT @next
```

**Result:** registration produces none; this call returns `5`. Commands and
flows may call each other. Bare lowercase labels call flows, `@name`
reads data, and `AWAIT name` joins tasks. `ASYNC name` retains its task-body
syntax and launches immediately; it does not require `FLOW`.

## RUN

```text
RUN <executable> [<arguments>]
[    <literal stdin body>]
[AS <name>]
```

Launch a direct process. An optional literal body becomes standard input; the
optional `AS` line follows and aligns with `RUN`, even without stdin. Keep the
instruction active until the process exits.

```flow
SET name = "Ana Maria"
RUN python3 - @name
    import sys
    print(f"Hello, {sys.argv[1]}!")
AS result
PRINT @result.stdout
```

This example requires `python3` on the host. **Result:** an object with string
`stdout`, string `stderr`, and integer `exit_code` for a completed process.

| Argument | Process argument |
| --- | --- |
| Quoted string or simple literal token | One unchanged argument. |
| Number | Its JSON number text. |
| Boolean | `true` or `false`. |
| Standalone reference | Its value, subject to these same type rules. |

`NULL`, arrays, objects, and references embedded in other tokens are invalid
arguments. There is no shell expansion, interpolation, piping, redirection,
command substitution, or automatic environment containing Flow bindings.
Invoke a shell explicitly when needed:

```flow
RUN sh
    git status --short
AS status
```

That example requires `sh`, Git, and a Git working directory. Processes use the
host working directory and a default 30-second timeout. A nonzero exit, timeout,
or missing executable fails the run. Available output is retained for reporting;
a failed instruction leaves its requested `AS` binding unchanged.

## ASYNC

```text
ASYNC <task_name>
    <body>
```

Start the body as an independent background task and immediately advance the
main path. The task runs its instructions sequentially, using an isolated
snapshot of bindings and callable registrations taken at launch.

```flow
ASYNC first
    DO Write a short greeting in English. AS greeting
ASYNC second
    DO Write a short greeting in Spanish. AS greeting
AWAIT first
AWAIT second
PRINT @first.greeting
PRINT @second.greeting
```

**Result:** a named task that can be joined with `AWAIT`. Task names are unique
and cannot collide with bindings. `ASYNC` is at invocation top level, outside
branches, loops, and tasks. Its body cannot perform `ASK`, `USE`, `ASYNC`, or
`AWAIT`, including indirectly through flow or command calls.

Tasks must not depend on unfinished sibling results or concurrently change
the same resource. If the host cannot run real background work, stop before
launch. Sequential work must not be presented as concurrent execution.

## AWAIT

```text
AWAIT <task_name>
```

Wait for a known task to finish successfully, then expose its bindings as
`@task_name.field`. Repeating `AWAIT` does not rerun the task.

```flow
ASYNC calculation
    SET total = 20 + 5
AWAIT calculation
PRINT @calculation.total
```

**Result:** the task's bindings become accessible; `AWAIT` takes no `AS` suffix.
An unknown task is an error. A known task failure stops ordinary scheduling.
`AWAIT` is prohibited inside an `ASYNC` body.

## RETURN

```text
RETURN [<message>]
```

Exit the current invocation normally, optionally displaying a message. Reaching
file end has the same effect as a message-free `RETURN`.

```flow
PRINT "Before return."
RETURN "Finished."
```

**Result:** no returned data. In the root program, `RETURN` ends the run; in an
ordinary child, it resumes the caller; in a task, command, or flow, it exits
only that scope. Outstanding tasks settle before a scope exits.

Use a string message, or omit it. A message displayed by `RETURN` is not a
command or flow's return value. A message-free `RETURN` and normal file end
are silent.

## Custom command call

```text
<COMMAND_NAME> [<expression>] [AS <name>]
<flow_name> [<expression>] [AS <name>]
```

Reach a definition directly or through `USE`, then pass an optional expression
as local `@input`. Evaluate it once in the caller; omitted input is `NULL`.
The invocation has isolated bindings and inherited callable registrations.
With `AS name`, its final direct instruction must produce a result to store in
the caller. Without `AS`, discard the result.

In `trim.flow`:

```flow
COMMAND TRIM
    DO Remove surrounding whitespace from @input and return the resulting string.
```

In the caller beside `trim.flow`:

```flow
USE trim.flow
TRIM "  Ana  " AS name
PRINT @name
```

**Result:** the final direct instruction's result, optionally stored in the caller.
A final `IF`, `PRINT`, or explicit `RETURN` provides no result; a bound call
ending this way fails instead of reusing an earlier value.
Unknown names, duplicate definitions, built-in name collisions, and recursive
calls are errors. See [custom-command scope](reuse.md#custom-commands) before
building larger definitions.
