---
description: Reuse guidance and workflows with use, share bindings with child programs, and define isolated commands and flows.
---

# Reusing programs

`use` lets a program read Markdown or run a child program. Reached `command`
and `flow` declarations register reusable bodies without executing them.
The file is loaded when execution reaches `use`. Relative paths are
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
use guidelines.md#greetings as @guidelines
do Write a greeting for Ana following @guidelines as @greeting
print @greeting
```

Markdown is imported as text, including any Flow code blocks it contains.
Those code blocks do not run. The `as` binding is required for Markdown imports.

A section identifier lowercases the heading text and replaces runs of spaces
with hyphens, retaining other characters. This is Flow's documented rule, not
a promise that a website's heading slugs match it. The section starts after the
selected heading and ends before the next heading of equal or higher level.
Headings inside code fences do not count. Missing or ambiguous sections fail.

## Run a child program

Create `greeting.flow`:

```flow
do Write a short greeting for @name as @greeting
```

Create `main.flow` beside it:

```flow
ask "What is your name?" as @name
use greeting.flow
print @greeting
```

The caller and child share bindings. The child reads `@name` and creates
`greeting`; the caller can then read it. The caller waits until the child
returns or reaches file end. `return` in the child exits the child, then resumes
the caller. A child failure stops ordinary execution across the run.

The child is read and validated only when reached. An unselected branch does
not load its child. Missing files and recursive imports are errors. `use` does
not change the host working directory or grant additional permissions.

## Custom commands

Use a custom command for a repeated operation that should receive one value
and keep its own bindings. Create `trim.flow`:

```flow
command TRIM
    do Remove surrounding whitespace from @input and return the resulting string.
```

In a caller beside it:

```flow
use trim.flow
ask "What is your name?" as @name
TRIM @name as @trimmed_name
print @trimmed_name
```

`use` runs the file, reaching its declaration and registering `TRIM` without
executing the body. Command names start with an uppercase letter and contain
uppercase letters, digits, or underscores. A file can contain several definitions
alongside ordinary instructions.

Calling `TRIM` supplies one value as local `@input`. Its bindings are isolated
from the caller. With `as @trimmed_name`, the final direct instruction must
produce a result. The example uses a final `do`, whose output is explicit.
`return` displays a message and exits; it is not a return-value statement.

Unknown calls, duplicate definitions, built-in name collisions, empty or nested
definitions, and recursive calls fail. Ordinary children share callable
registrations with their callers. Definitions registered through a child during
a command invocation remain local to that invocation. Relative paths inside
a reusable body use its defining file.

## Named flows

Named flows use lowercase labels and follow the same input, local-state, and
result rules as commands. Define and call them in the same file, or import
definitions through `use`:

```flow
flow add_one
    set result = @input + 1

command ADD_TWO
    add_one @input as @first
    add_one @first as @second
    set result = @second

ADD_TWO 3 as @total
print @total
```

This program displays `5`. The command calls a flow twice, each time with
isolated local bindings. Commands and flows may call each other.
Omitted input becomes local `null`. Calls are standalone instructions, so
write `add_one 3 as @next`, rather than placing a call inside `set`.

A successful final direct `set` or `do` supplies a result. A final `if`, `print`,
or explicit `return` does not. Binding a call with no final result is an error;
earlier results are not reused. `as` stores a result only after success.

Flow labels start with a lowercase letter and contain lowercase letters,
digits, or underscores. Bare labels call flows; `@name` reads a binding.
`async name` still starts a task body immediately, and `await name` joins it.
Task bodies can call reusable flows, subject to the task restrictions.

## Choose shared or isolated state

| Form | Use it when | Binding behavior |
| --- | --- | --- |
| Markdown `use` | A task needs saved guidance. | Stores text in one binding. |
| Ordinary child | Several steps form part of the same workflow. | Shares caller bindings. |
| Command or flow | A reusable operation needs its own locals. | Receives local `@input`; optionally returns its final direct result. |
| `async` task | Independent work can run in the background. | Receives a snapshot; exposes results after `await`. |

Keep a workflow in one file until reuse makes its path easier to understand.
See [execution and failures](execution.md) for background-task behavior.
