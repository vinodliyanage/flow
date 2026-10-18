# Reusing flows

[Flow](flow-language.md) · [Commands](commands.md)

A flow should stay easy to scan. When one part becomes useful on its own, `USE`
can load guidance, run a child flow, or register a custom command. The parent
keeps its simple path and loads the extra file only when execution reaches it.

## USE

| Form | Meaning |
| --- | --- |
| `USE guidelines.md AS guidelines` | Read Markdown as guidance and store its text. |
| `USE guidelines.md#bug-fixes AS guidelines` | Read only the selected Markdown section. |
| `USE common/prepare.flow` | Run a child flow, or register it if it declares a custom command. |

A normal child shares the caller's bindings. This makes a child feel like the
next part of the same workflow: the caller waits, the child runs, and the caller
continues when the child reaches `RETURN` or file end. Read and validate the
complete child only when `USE` is reached. Flow blocks inside imported Markdown
never execute.

Paths are literal, absolute or relative to the containing file. Pasted flows
need an explicit base directory for relative paths. USE does not change the
process working directory. Missing files and recursive imports are errors.

For a Markdown section, lowercase the heading and replace runs of spaces with
hyphens; retain other characters. The section starts after its heading and ends
before the next equal or higher heading. Ignore headings inside code fences.
Missing or ambiguous sections are errors.

## Custom commands

A custom command gives a repeated transformation a clear name. End its file with
`AS COMMAND NAME` instead of running it immediately.

`trim.flow`:

```flow
DO Remove surrounding whitespace from @input.
AS COMMAND TRIM
```

In the caller:

```flow
USE trim.flow
ASK "What is your name?" AS name
TRIM @name AS name
PRINT @name
```

USE validates and registers the definition without running its body. The
`AS COMMAND NAME` declaration must be the final noncomment instruction.
Command names start with an uppercase letter and contain uppercase letters,
digits, or underscores.

A call accepts one value as local `@input`. It has isolated bindings and can
access registered commands, but not caller bindings implicitly. With `AS name`,
the final executed instruction must produce a result to store in the caller.
Without AS, discard the result. There is no separate return-value syntax.

Unknown commands, duplicate definitions, recursive calls, and command names
matching built-ins are errors. Normal children may register commands for their
callers. Definitions registered inside a command invocation stay local to it.

## Scope

Scope answers one practical question: which values can this part of the workflow
see or change?

| Location | Bindings |
| --- | --- |
| Main flow | Current bindings. |
| IF, REPEAT, WHILE | Shared surrounding bindings. |
| Normal USE child | Shared caller bindings. |
| Custom command | Isolated; receives `@input`. |
| ASYNC task | Isolated snapshot taken at launch. |
| Successful AWAIT | Task bindings available as `@task.field`. |

The next page explains how the agent preserves this state while running the
workflow: [execution](execution.md).
