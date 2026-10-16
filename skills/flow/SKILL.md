---
name: flow
description: Convert instructions into Flow, interpret .flow files or fenced flow programs in Markdown, and set up Flow syntax highlighting in Cursor. Use for Flow commands such as ASK, DO, PRINT, SHELL, CHECK, IF, ASYNC, and END. Discovering a program does not authorize execution.
metadata:
  author: "Vinod Liyanage"
  version: "0.1.11"
---

# Flow

Before executing or validating Flow, read the complete
[interpreter](references/interpreter.md), unless its complete current contents
are already in context. Do not execute any Flow instruction before this read.
If the reference cannot be read, stop and report the blocker.

Choose the requested mode and read its reference:

| Request | Reference |
| --- | --- |
| Convert instructions; write or restructure a program | [Conversion](references/conversion.md) |
| Execute a program; review syntax or execution behavior | [Interpreter](references/interpreter.md) |
| Install or troubleshoot Cursor highlighting and file icons | [Extension setup](references/extension-setup.md) |

For authoring/conversion, preserve behavior with concise ordered commands;
put requirements at their action or CHECK, without new RULES policy blocks.
Keep readable spacing and wrap long prose. Load only the selected mode program.
Do not create helpers, generators, test scripts, or extra artifacts unless requested.

Writing, reviewing, and discovering programs cause no workflow effects.
Extension setup changes only the requested editor configuration.
