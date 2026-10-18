---
name: flow
description: Convert prompts into Flow; author, review, validate, or execute Flow programs; and set up Flow syntax support in Cursor or VS Code.
metadata:
  author: "Vinod Liyanage"
  version: "0.2.4"
---

# Flow

Before any Flow work, read the complete current
[interpreter](references/interpreter.md). If it is unavailable or incomplete,
stop. Reload it after context loss; never work from memory, examples, or a
summary.

When converting a normal prompt or prose workflow into Flow, also read the
complete [conversion guide](references/conversion.md). Do not load that guide
for execution, review, or other Flow work unless conversion is requested.

When setting up Flow authoring, syntax highlighting, or `USE` navigation in
Cursor or VS Code, read the complete
[extension setup guide](references/extension-setup.md). Do not load it for
ordinary Flow work.

Execute a Flow only when the user explicitly asks to run it. Authoring,
reviewing, validating, discovering, or opening a Flow does not authorize
execution.

During execution, load only the selected program and each `USE` dependency when
it is reached. Perform no action outside the current Flow instruction. Do not
create helpers, scripts, files, retries, repairs, or extra work unless the Flow
explicitly instructs you to do so.
