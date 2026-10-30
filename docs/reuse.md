---
description: Reuse guidance and workflows with use, share bindings with child programs, and define isolated commands and flows.
---

# Reusing programs

`use` lets a program read Markdown or run a child program. A leading run of
top-level `use` instructions is the file import header. Flow loads that header
once in source order, and commands and flows declared in the file inherit its
bindings and callable registrations. Put it before every other declaration or
instruction.

A `use` anywhere else is dynamic. Flow loads it only when execution reaches it
in the current scope. Relative paths resolve from the file containing the
instruction.

## Share guidance across flows

```flow
use guidelines.md as @guidelines

flow greet
    do Write a short greeting following @guidelines as @greeting
    return @greeting
```

The Markdown file is read once when this Flow file loads. Every call to `greet`
starts with an isolated copy of `@guidelines`. Replacing that local copy does not
change the file import or another invocation.

Use a runtime import when the path depends on the selected path:

```flow
flow load_rules
    if @input is exactly "oqg"
        use oqg.md as @rules
    else
        use qci.md as @rules

    return @rules
```

Only the selected Markdown file is loaded.

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
    do Remove surrounding whitespace from @input as @trimmed
    return @trimmed
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

Calling `TRIM` supplies one value as local `@input`. It receives isolated copies
of its defining file imports, and its other bindings remain isolated from the
caller. With `as @trimmed_name`, an explicit `return` value or the final direct
instruction's result is stored in the caller. `return` does not display its
value; use `print` for user-visible output.

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
    return @input + 1

command ADD_TWO
    add_one @input as @first
    add_one @first as @second
    return @second

ADD_TWO 3 as @total
print @total
```

This program displays `5`. The command calls a flow twice, each time with
isolated copies of its file imports and isolated local bindings. Commands and
flows may call each other.
Omitted input becomes local `null`. Calls are standalone instructions, so
write `add_one 3 as @next`, rather than placing a call inside `set`.

An explicit `return` value supplies the result; otherwise a successful final
direct `set` or `do` can supply it. A bare `return`, final `if`, or final `print`
does not. Binding a call with no result is an error; earlier results are not
reused. `as` stores a result only after success.

Flow labels start with a lowercase letter and contain lowercase letters,
digits, or underscores. Bare labels call flows; `@name` reads a binding.
`async name` still starts a task body immediately, and `await name` joins it.
Task bodies can call reusable flows, subject to the task restrictions.

## Choose shared or isolated state

| Form | Use it when | Binding behavior |
| --- | --- | --- |
| Markdown `use` | A task needs saved guidance. | Stores text in one binding. |
| Ordinary child | Several steps form part of the same workflow. | Shares caller bindings. |
| Command or flow | A reusable operation needs its own locals. | Receives local `@input`; optionally returns an explicit value or final direct result. |
| `async` task | Independent work can run in the background. | Receives a snapshot; exposes bindings and an explicit returned `result` after `await`. |

Keep a workflow in one file until reuse makes its path easier to understand.
See [execution and failures](execution.md) for background-task behavior.
