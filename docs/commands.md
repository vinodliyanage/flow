# Commands

[Flow](flow-language.md) · [Quick start](quick-start.md) · [Syntax](syntax.md)

Commands are the verbs in a flow. Most workflows need only five of them: ask for
missing input, store data, do work, show a result, and choose a path.

In the syntax below, square brackets mark optional parts; do not type the
brackets. `CHECK`, `STOP`, and `SHELL` are not built-ins. `AWAIT` replaces the
older `WAIT` command.

## The five commands to start with

| Command | Meaning |
| --- | --- |
| `ASK "question" AS name` | Ask and wait for a fresh reply. Store raw text, including an empty reply. |
| `SET name = expression` | Evaluate and store a value without external actions. |
| `DO task [AS name]` | Perform only the stated task, using tools as needed. Optionally store its result. |
| `PRINT expression` | Display strings as text and other values as JSON in chat, then continue. |
| `PRINT report request` | Compose and display a report from existing information, without new external actions. |

`ASK` is a real pause. It never infers or reuses an answer, and no later
instruction on that path runs until the user replies.

`DO` is where agent work happens. Its wording defines the boundary: no unrelated
setup, repair, retry, or publication is added automatically. When later steps
need particular result fields, name those fields and their types in the task.

## CONTEXT

`CONTEXT` gives a task background without turning that background into new
instructions. Store it once, then reference it explicitly:

```flow
CONTEXT
    Keep the greeting short and friendly.
AS guidelines
DO Write a greeting for @name following @guidelines. AS greeting
```

An aligned `AS name` closes the block and is required. The body follows the
[literal-text rules](syntax.md#long-prose-and-literal-bodies).

## IF and ELSE

Use a branch when the next step depends on information already available:

```flow
ASK "Proceed? Enter yes or no." AS answer
IF @answer == "yes"
    DO Perform the task.
ELSE
    RETURN "Cancelled."
```

IF evaluates once and runs only the selected body. ELSE is optional; it aligns
with IF and follows its body, ignoring comments and blank lines. For more
alternatives, nest another IF inside ELSE.

A condition can be an exact Boolean expression or a natural-language condition:

```flow
IF @name is an empty string
    RETURN "A name is required."
```

Judge prose conditions from available evidence. An empty string has zero
characters; whitespace alone is not empty. A malformed expression is an error,
not prose. Stop when a condition cannot be determined; never guess.

## Loops

Use `REPEAT` when the number of iterations is known at entry:

```flow
REPEAT 3 TIMES
    PRINT "Hello"
```

REPEAT captures a nonnegative integer literal or binding reference once on entry.
Iterations run sequentially with shared bindings. Zero skips the body.

```flow
SET count = 0
WHILE @count < 3
    PRINT @count
    SET count = @count + 1
```

Use `WHILE` when the decision must be checked again before each iteration.

WHILE uses the same condition rules as IF and tests before every iteration.

| Command | Meaning |
| --- | --- |
| `CONTINUE` | Skip the rest of the nearest loop's current iteration. WHILE retests; REPEAT advances its count. |
| `BREAK` | Exit the nearest loop and continue after it. |

Both are valid only inside a loop in the current flow or task.

## RETURN

```flow
RETURN "Finished."
```

RETURN exits the current invocation normally. Its optional message is displayed;
it is not returned data. A child flow resumes its caller, the root flow finishes,
and a task or custom command exits locally. File end acts like message-free RETURN.
Outstanding tasks settle before exit.

When a workflow grows, continue with [USE and custom commands](reuse.md). For
real processes and parallel work, see [execution](execution.md).
