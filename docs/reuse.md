---
description: Reuse guidance and workflows with USE, share bindings with child programs, and define isolated custom commands.
---

# Reusing programs

`USE` lets a program read Markdown, run a child program, or register a custom
command. The file is loaded when execution reaches `USE`. Relative paths are
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
DO Remove surrounding whitespace from @input and return the resulting string.
AS COMMAND TRIM
```

In a caller beside it:

```flow
USE trim.flow
ASK "What is your name?" AS name
TRIM @name AS trimmed_name
PRINT @trimmed_name
```

The final noncomment `AS COMMAND TRIM` declaration makes `USE` register the
command rather than execute the file immediately. Command names start with an
uppercase letter and contain uppercase letters, digits, or underscores.

Calling `TRIM` supplies one value as local `@input`. Its bindings are isolated
from the caller. With `AS trimmed_name`, the final executed instruction must
produce a result. The example uses a final `DO`, whose output is explicit.
`RETURN` displays a message and exits; it is not a return-value statement.

Unknown commands, duplicate definitions, built-in name collisions, and recursive
calls fail. Ordinary children may register commands for callers. The existing
reuse rules keep definitions registered inside a command invocation local to
that invocation. See the [specification](specification.md#unresolved-rules) for
remaining questions about task and command-definition scope.

## Choose shared or isolated state

| Form | Use it when | Binding behavior |
| --- | --- | --- |
| Markdown `USE` | A task needs saved guidance. | Stores text in one binding. |
| Ordinary child | Several steps form part of the same workflow. | Shares caller bindings. |
| Custom command | One value goes through a reusable operation. | Receives local `@input`; optionally returns the last result. |
| `ASYNC` task | Independent work can run in the background. | Receives a snapshot; exposes results after `AWAIT`. |

Keep a workflow in one file until reuse makes its path easier to understand.
See [execution and failures](execution.md) for background-task behavior.
