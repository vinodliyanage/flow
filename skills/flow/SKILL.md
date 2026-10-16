---
name: flow
description: Author, review, or execute .flow files and Markdown flow blocks, including workflows referenced by other skills. Also set up Flow syntax highlighting in Cursor. Discovery never authorizes execution.
metadata:
  author: "Vinod Liyanage"
  version: "0.1.13"
---

# Flow

Before authoring, reviewing, validating, or executing Flow, read the complete
[interpreter](references/interpreter.md). Reuse it only while its complete current
contents remain in context; reload after context loss/compaction if incomplete.
If unreadable, stop. Never execute from a summary, remembered syntax, or examples.
Apply this gate in every chat and agent handling Flow; include the skill path
and loading requirement when delegating. Delegation does not authorize execution.

| Request | Read |
| --- | --- |
| Author or convert | [Conversion](references/conversion.md) after interpreter |
| Execute or review | Interpreter above |
| Cursor highlighting/icons | [Extension setup](references/extension-setup.md) only |

Load only the selected program and USE children when reached. Authoring, review,
and discovery cause no workflow effects; editor setup changes only requested
configuration. Do not create helpers, generators, test scripts, or extra artifacts
unless requested.
