# Workflow structure

Flow files describe execution. Keep domain guidance and operational boundaries
in imported Markdown so the workflow remains readable from top to bottom.

## Responsibilities

| Location | Contains |
| --- | --- |
| `flows/` | Imports, calls, questions, commands, branches, loops, pauses, outputs, and returns. |
| `knowledge/` | Domain facts, mappings, naming rules, conventions, and decision criteria. |
| `guardrails/` | Authorization boundaries, prohibited actions, preservation rules, and stopping conditions. |

Use this structure for reusable or nontrivial workflow packages:

```text
workflow-root/
├── flows/
│   ├── router.flow
│   └── implement.flow
├── knowledge/
│   ├── router.knowledge.md
│   └── implement.knowledge.md
└── guardrails/
    ├── router.guardrail.md
    └── implement.guardrail.md
```

A short standalone program can remain one `.flow` file when it has no separate
domain guidance or operational boundaries. Do not create empty knowledge or
guardrail files merely to satisfy the directory shape.

## Authoring rules

- Name each Flow file and callable by responsibility. For example,
  `router.flow` declares `flow router`; do not name the callable after its
  containing skill or project.
- Put a substantial workflow's domain guidance in matching
  `<name>.knowledge.md` and its operational boundaries in matching
  `<name>.guardrail.md`. Omit a support file only when that category has no
  content. Use a clearly named shared file when several workflows genuinely
  use the same guidance.
- Import shared guidance in the leading file header. Keep an import inside
  executable logic only when it must load on the selected path.
- Keep execution order in Flow: exact questions and commands, calls, result
  bindings and shapes, branches, loops, user-visible output, pauses, and exits.
- Keep detailed facts and decision rules in knowledge files. Keep prohibitions,
  scope limits, authorization rules, and stop conditions in guardrail files.
- In a `do`, state the operation, relevant inputs, imported guidance, and result
  shape. Do not repeat the imported guidance in the Flow file.
- Keep each rule in one authoritative place. Do not duplicate the same policy
  across Flow, knowledge, and guardrail files.

```flow
use ../knowledge/implement.knowledge.md as @knowledge
use ../guardrails/implement.guardrail.md as @guardrails

flow implement
    do Build the implementation from @input using @knowledge and @guardrails.
        Return files and summary. as @result

    return @result
```

## Refactoring existing workflows

Before shortening a Flow file, classify every instruction:

1. Keep execution and result-shape information in the Flow file.
2. Move useful domain information to the matching knowledge file.
3. Move useful boundaries and prohibitions to the matching guardrail file.
4. Remove the original text only after its destination preserves the same
   behavior. Never delete or weaken a unique rule merely to shorten the Flow.
5. Resolve every import and reread the Flow by itself to confirm that its order,
   decisions, pauses, and outcomes remain understandable.

During review, flag misplaced or duplicated guidance, missing dependencies,
empty support files, responsibility-mismatched callable names, and useful rules
that were removed instead of moved.
