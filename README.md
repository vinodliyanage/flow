# Flow

Write agent workflows as ordered commands and plain-English tasks in `.flow` files
or named Markdown `flow` blocks. The Flow skill supports writing, reviewing,
executing selected programs, and setting up syntax highlighting in Cursor.

## Install

Install the skill for Codex and Cursor:

```sh
npx skills add vinodliyanage/flow --skill flow --global --agent codex cursor
```

For a private repository, authenticate with GitHub before installing.

## Use

Ask your agent to use `$flow` to convert instructions, review a program, execute
a selected `.flow` file, or install the bundled Cursor syntax extension.
Finding or reviewing a program does not authorize executing it.
Programs finish at EOF; use PRINT for output.

```flow
ASK "What would you like to display?" AS message

PRINT message

```

Compose workflows with `USE relative/path.flow`. It runs the selected child and
returns at its EOF; named bindings are shared and child failures stop the run.
See [reusing flows](docs/flow/flow-language.md#reusing-flows).

Flow is interpreted by the agent using its available tools. It is not an enforced
software runtime and does not guarantee deterministic execution.

## Consistent loading

Skill discovery alone does not load the interpreter. Add this conditional rule
in each agent host's automatically loaded global instructions (for Codex,
`~/.codex/AGENTS.md`):

```text
For .flow files or Markdown flow programs, including workflows referenced by
other skills, load the Flow skill and its complete current interpreter before
Flow work. Stop if unavailable; never execute from memory, examples, or a summary.
Reuse only complete current instructions; reload when context is incomplete.
Pass this requirement and the skill path to agents delegated Flow work.
Discovery, authoring, and review never authorize execution.
```

Use the installed skill path in that host. Keep installed copies synchronized
with the maintained source; start a fresh session after changing global
instructions. The rule loads Flow only for relevant work. Each delegated agent
must have the skill available; parent loading alone is insufficient.

This improves discovery and states the required behavior. It cannot enforce
compliance or make natural-language tasks deterministic. Evaluate actual tool
traces for ASK/WAIT barriers, failed CHECK, child return, cleanup, and context
recovery before claiming behavioral improvement.

## Repository

- [Flow skill](skills/flow/SKILL.md): entrypoint and mode-specific guidance.
- [Interpreter](skills/flow/references/interpreter.md): execution semantics.
- [Language guide](docs/flow/flow-language.md): commands and examples.
- [Design notes](docs/flow/interpreter-design.md): rationale and evaluation criteria.
- [Cursor extension](extensions/flow-syntax/README.md): syntax source and packaging.

The skill includes the packaged extension in `skills/flow/assets/`. When rebuilding
the extension, refresh that asset and its version references together.
