---
description: Reuse guidance and workflows with USE, share bindings with child programs, and define isolated commands and functions.
---

# Reusing programs

`USE` lets a program read Markdown or run a child program. Reached `COMMAND`
and `FUNCTION` declarations register reusable bodies without executing them.
The file is loaded when execution reaches `USE`. Relative paths are
resolved from the file containing that instruction.

## Read background guidance

Create `guidelines.md`:

```md
# Writing

## Greetings

Use one short, friendly sentence.
```

In a `.flow` file beside it:

```flow
USE guidelines.md#greetings AS guidelines
DO Write a greeting for Ana following @guidelines. AS greeting
PRINT @greeting
```

Markdown is imported as text, including any Flow code blocks it contains.
Those code blocks do not run. The `AS` binding is required for Markdown imports.

A section identifier lowercases the heading text and replaces runs of spaces
with hyphens, retaining other characters. This is Flow's documented rule, not
a promise that a website's heading slugs match it. The section starts after the
selected heading and ends before the next heading of equal or higher level.
Headings inside code fences do not count. Missing or ambiguous sections fail.

## Run a child program

Create `greeting.flow`:

```flow
DO Write a short greeting for @name. AS greeting
```

Create `main.flow` beside it:

```flow
ASK "What is your name?" AS name
USE greeting.flow
PRINT @greeting
```

The caller and child share bindings. The child reads `@name` and creates
`greeting`; the caller can then read it. The caller waits until the child
returns or reaches file end. `RETURN` in the child exits the child, then resumes
the caller. A child failure stops ordinary execution across the run.

The child is read and validated only when reached. An unselected branch does
not load its child. Missing files and recursive imports are errors. `USE` does
not change the host working directory or grant additional permissions.

## Custom commands

Use a custom command for a repeated operation that should receive one value
and keep its own bindings. Create `trim.flow`:

```flow
COMMAND TRIM
    DO Remove surrounding whitespace from @input and return the resulting string.
```

In a caller beside it:

```flow
USE trim.flow
ASK "What is your name?" AS name
TRIM @name AS trimmed_name
PRINT @trimmed_name
```

`USE` runs the file, reaching its declaration and registering `TRIM` without
executing the body. Command names start with an uppercase letter and contain
uppercase letters, digits, or underscores. A file can contain several definitions
alongside ordinary instructions. Legacy `AS COMMAND` footers are errors.

Calling `TRIM` supplies one value as local `@input`. Its bindings are isolated
from the caller. With `AS trimmed_name`, the final direct instruction must
produce a result. The example uses a final `DO`, whose output is explicit.
`RETURN` displays a message and exits; it is not a return-value statement.

Unknown calls, duplicate definitions, built-in name collisions, empty or nested
definitions, and recursive calls fail. Ordinary children share callable
registrations with their callers. Definitions registered through a child during
a command invocation remain local to that invocation. Relative paths inside
a reusable body use its defining file.

## Functions

Functions use lowercase labels and follow the same input, local-state, and
result rules as commands. Define and call them in the same file, or import
definitions through `USE`:

```flow
FUNCTION add_one
    SET result = @input + 1

COMMAND ADD_TWO
    add_one @input AS first
    add_one @first AS second
    SET result = @second

ADD_TWO 3 AS total
PRINT @total
```

This program displays `5`. The command calls a function twice, each time with
isolated local bindings. Commands and functions may call each other.
Omitted input becomes local `NULL`. Calls are standalone instructions, so
write `add_one 3 AS next`, rather than placing a call inside `SET`.

A successful final direct `SET` or `DO` supplies a result. A final `IF`, `PRINT`,
or explicit `RETURN` does not. Binding a call with no final result is an error;
earlier results are not reused. `AS` stores a result only after success.

Function labels start with a lowercase letter and contain lowercase letters,
digits, or underscores. Bare labels call functions; `@name` reads a binding.
`ASYNC name` still starts a task body immediately, and `AWAIT name` joins it.
Task bodies can call reusable functions, subject to the task restrictions.

## Choose shared or isolated state

| Form | Use it when | Binding behavior |
| --- | --- | --- |
| Markdown `USE` | A task needs saved guidance. | Stores text in one binding. |
| Ordinary child | Several steps form part of the same workflow. | Shares caller bindings. |
| Command or function | A reusable operation needs its own locals. | Receives local `@input`; optionally returns its final direct result. |
| `ASYNC` task | Independent work can run in the background. | Receives a snapshot; exposes results after `AWAIT`. |

Keep a workflow in one file until reuse makes its path easier to understand.
See [execution and failures](execution.md) for background-task behavior.
