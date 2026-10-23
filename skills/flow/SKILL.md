---
name: flow
description: Author, review, validate, or execute Flow; convert prompts; set up Flow in Cursor or VS Code.
metadata:
  author: "Vinod Liyanage"
  version: "0.5.0"
---

# Flow

Read the complete current [interpreter](references/interpreter.md) before Flow
work. Stop if unavailable/incomplete; reload after context loss. Never substitute
memory, examples, or summaries.

For prompt conversion, also read [conversion](references/conversion.md).
For editor setup, also read [extension setup](references/extension-setup.md).
Load these guides only for their corresponding tasks.

Author Flow 0.4.0 with lowercase keywords and as @name bindings.
For run/context, use a header binding or an aligned binding after the body;
other result bindings stay inline. Conversion chooses the clearest layout.
Author plain command/flow blocks and English conditions. Execute only on
explicit request; authoring/review/validation never authorize a run. Add no
unrequested work.
