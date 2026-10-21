---
name: flow
description: Author, review, validate, or execute Flow; convert prompts; set up Flow in Cursor or VS Code.
metadata:
  author: "Vinod Liyanage"
  version: "0.3.0"
---

# Flow

Execute Flow literally. After preflight, maintain a current file and instruction
pointer. Complete each reached instruction before advancing. Preloading, batching,
skipping, and reordering are execution errors.

PRINT completes only after its output is emitted as a separate user-visible
intermediate assistant message, using the commentary channel where available.
Emit it before executing any subsequent instruction or tool call. Then continue
without waiting for a reply. Buffering, combining, or replaying PRINT output in
the final answer is an execution error.

Read the complete current [interpreter](references/interpreter.md) before Flow
work. Stop if unavailable/incomplete; reload after context loss. Never substitute
memory, examples, or summaries.

For prompt conversion, also read [conversion](references/conversion.md).
For editor setup, also read [extension setup](references/extension-setup.md).
Load these guides only for their corresponding tasks.

Author plain command/function blocks and English conditions. Execute only on
explicit request; authoring/review/validation never authorize a run. Add no
unrequested work.
