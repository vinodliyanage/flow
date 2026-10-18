# Flow

Flow is a small language for giving agents a path they can follow.

An ordinary prompt can describe a goal, several steps, a few exceptions, and a
question for the user. The agent still has to decide how those pieces fit
together. Flow makes that structure visible: do this, wait here, take one branch,
then continue.

Here is a complete code-review flow:

```flow
ASK "What file or feature should I review?" AS target
IF @target == ""
    RETURN "Choose something to review."

DO Review @target in the current project for correctness
    and unintended effects. Return an object with a summary string
    and an issues array. AS review

IF @review.issues == []
    PRINT "No issues found."
ELSE
    PRINT Write a short Markdown report from @review.
```

You can read the path without knowing Flow. The agent asks what to review and
waits. An empty answer ends the flow. Otherwise, the agent performs one defined
task, stores the result, and prints the branch that matches what it found.

That visible path is why Flow matters. It keeps natural language where judgment
is useful while making execution order, decisions, and waiting explicit. A
person can review the workflow before an agent acts, and another agent can follow
the same route without reconstructing it from paragraphs.

## What Flow controls

A compatible agent reads the whole flow, validates its structure, and then runs
one reached instruction at a time. It observes and stores each result before
moving forward. Only commands such as `IF`, `REPEAT`, `USE`, and `ASYNC` change
that order.

Flow does not remove judgment from natural-language tasks. It makes clear where
that judgment belongs and what happens after it. The editor extension adds
highlighting and file navigation; opening a file never executes it.

## Learn Flow

| Page | Start here when you want to… |
| --- | --- |
| [Quick start](quick-start.md) | Install the extension and run your first useful flow. |
| [Syntax](syntax.md) | Understand indentation, values, references, and strings. |
| [Commands](commands.md) | Look up asking, tasks, output, decisions, loops, and return. |
| [Reusing flows](reuse.md) | Split a workflow and create reusable commands. |
| [Execution](execution.md) | Understand processes, parallel tasks, failures, and state. |

If this is your first time here, continue with the [quick start](quick-start.md).
