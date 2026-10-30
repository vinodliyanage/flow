# Bake Flow into another skill

Use this guide when asked to bake, embed, or bundle the Flow interpreter into a
skill written using Flow. The receiving skill uses its bundled interpreter;
users do not need to install the Flow skill separately. Baking packages files
and never authorizes executing the workflow.

## Bundle the interpreter and license

1. Read the receiving skill's `SKILL.md` and locate its Flow workflow.
2. Create `lib/flow/` in the receiving skill. Copy the complete current
   [interpreter](interpreter.md) into it as `interpreter.md`. Preserve its body
   verbatim; do not summarize, trim, or customize the language contract.
3. Prepend YAML frontmatter using this shape. Flow has one version; take it
   from the loaded Flow `SKILL.md` and confirm the copied interpreter agrees.

   ```yaml
   ---
   name: flow-interpreter
   description: Bundled Flow interpreter contract.
   author: "Vinod Liyanage"
   source: "https://github.com/vinodliyanage/flow"
   version: "0.7.0"
   license: "LICENSE.txt"
   ---
   ```

4. Copy [the interpreter license](../LICENSE.txt) verbatim beside it
   as `lib/flow/LICENSE.txt`. Keep the receiving skill's own license.
   If the source license is unavailable, stop and report it; never invent or
   substitute license terms.

## Update the receiving SKILL.md

Add or replace only its Flow-loading instruction with:

```markdown
Read the complete [bundled Flow interpreter](lib/flow/interpreter.md)
before Flow work. Stop if unavailable or incomplete; reload after context loss.
Follow it for this skill's Flow workflow.
```

Replace any requirement to install or load the external Flow skill with this
local reference. Preserve the skill's frontmatter, workflow, tools, and other
instructions. Keep workflow imports relative and package their existing local
dependencies too; baking the interpreter does not supply external tools or
services used by the workflow.

## Verify the bundle

- Check that removing only the added frontmatter leaves an exact copy of the
  source interpreter, and that the copied license is unchanged.
- Resolve the interpreter, license, and workflow references inside the receiving
  skill; none may require the author's installed Flow path.
- Confirm the receiving `SKILL.md` diff contains only the Flow-loading change.
  Validate without executing the workflow.

The bundled interpreter stays at the copied version. When asked to update it,
repeat the copy and verification steps with the current interpreter and license,
and refresh its frontmatter.
