# Quick start

This guide turns a vague request—“review my change”—into a workflow whose path
both you and the agent can see.

## 1. Install the editor extension

In Cursor or VS Code, run **Extensions: Install from VSIX...** from the Command
Palette. Choose:

```text
extensions/flow/dist/flow-0.2.7.vsix
```

You can also install it from a terminal:

```sh
cursor --install-extension /absolute/path/to/extensions/flow/dist/flow-0.2.7.vsix
```

Reload the editor if an open file does not update. The extension highlights
`.flow` files and makes `USE` paths clickable. It does not run workflows.

## 2. Create a flow

Create `review.flow` in your project:

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

The file reads like the work itself:

1. `ASK` collects the missing input and waits.
2. `IF` protects the workflow from an empty answer.
3. `DO` performs one clearly bounded task and stores its result as `@review`.
4. The second `IF` decides which output the user sees.

Indentation shows the instructions that belong to each branch. Dedenting returns
to the main path. There are no braces, closing keywords, or trailing colons.

## 3. Run it deliberately

Give a Flow-compatible agent the file path and explicitly ask it to execute the
flow. The agent should read and validate the complete file before taking action,
then stop at `ASK` until you answer.

Reading, editing, or linking to a flow does not authorize execution. This keeps
the moment a workflow starts visible to the user.

## 4. Grow only when the work grows

Most flows begin with the small set above: `ASK`, `DO`, `IF`, `PRINT`, and
`RETURN`. Add `USE` when part of the work deserves its own file, `RUN` when a
real process is required, and `ASYNC` with `AWAIT` only when independent work can
truly run in parallel.

Continue with [syntax](syntax.md), or keep the [command reference](commands.md)
nearby while writing.
