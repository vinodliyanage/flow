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

```flow
ASK "What would you like to display?" AS message

PRINT message

END
```

Flow is interpreted by the agent using its available tools. It is not an enforced
software runtime and does not guarantee deterministic execution.

## Repository

- [Flow skill](skills/flow/SKILL.md): entrypoint and mode-specific guidance.
- [Interpreter](skills/flow/references/interpreter.md): execution semantics.
- [Language guide](docs/flow/flow-language.md): commands and examples.
- [Design notes](docs/flow/interpreter-design.md): rationale and evaluation criteria.
- [Cursor extension](extensions/flow-syntax/README.md): syntax source and packaging.

The skill includes the packaged extension in `skills/flow/assets/`. When rebuilding
the extension, refresh that asset and its version references together.
