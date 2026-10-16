# Convert instructions to Flow

Author the requested program; do not execute it. Read the
[interpreter](interpreter.md) for current semantics before validating syntax.
Preserve behavior before optimizing tokens; flag ambiguity instead of guessing.

1. Identify inputs, outputs, ordered actions, conditions, gates, permissions,
   exceptions, and failure/cleanup paths. Preserve source and repository conventions.
2. Prefer a sibling .flow linked from the Markdown entrypoint. For large
   multi-action workflows, link mode-specific programs and load only the selected
   program; keep closely shared writing modes together. Preserve bare defaults
   and clarification behavior. When shared behavior changes, update every affected
   mode and retained full workflow. Keep templates/data outside Flow when useful;
   reference exact files/sections. Preserve release markers and configured paths.
3. Use existing commands; do not invent syntax for a conversion:

| Intent | Command |
| --- | --- |
| Fresh user input | ASK |
| Bind/evaluate a value | SET |
| Perform a stated task | DO |
| Display chat text/Markdown | PRINT |
| Run a concrete shell command | SHELL |
| Direct argv, existing JS file, or attached JS | RUN |
| Require evidence before proceeding | CHECK |
| Branch or bounded repetition | IF / ELSE / REPEAT |
| Explicit background work and join | ASYNC / WAIT |
| Declared exit cleanup | FINALLY |
| Assess existing information | THINK |
| Stop or finish | STOP / END |

4. Put actions in DO, requirements in CHECK where they gate work, decisions in
   IF, and cleanup in FINALLY. Attach task-specific limits to the action they
   constrain. Do not add RULES policy blocks; older programs remain supported.
   Use concise, explicit prose and avoid restrictions already enforced by the
   interpreter. Preserve all steps, bindings, conditions, exceptions, and gates.
   Never abbreviate literal commands, expressions, questions, or printed text
   merely to save tokens. Add no setup, tests, publishing, retries, helper files,
   generators, or test scripts unless requested. Preserve existing referenced scripts.
5. Use uppercase commands/TRUE/FALSE/NULL and JSON(); JSON/JS retain lowercase
   literals. Use sentence fields such as stdout of result. Indent blocks four
   spaces, retain required colons, and end with one top-level END; no FUNC or
   named closers. Plain .flow files need no outer fence; Markdown flow fences work.
6. Separate instructions with one blank line, keeping headers beside their first
   body instruction and comments beside their instruction. Aim for 100 columns;
   wrap DO, natural-language CHECK, and END prose four spaces deeper. Keep
   expressions, quoted values, block headers, shell commands, and code intact.
   Preserve PRINT/raw SET/code payloads exactly, including trailing blank lines.
7. SHELL uses standalone unquoted {name} string placeholders, each quoted by the
   interpreter as one literal host argument. Never interpolate into source or
   treat arrays as argv. SHELL/RUN stop on nonzero exit; preserve intentional
   nonzero probes as explicit DO actions that record results as data. Use ASYNC
   only for independent work with real host scheduling; guard cleanup resources.
8. Review syntax, links, binding origins, selected-path order, ASK/WAIT barriers,
   gates, permissions, failures, and cleanup against the source. Use existing
   tools for checks; do not create validation scripts unless requested. Measure
   loaded entrypoint/program tokens when useful, including shared references
   when claiming total savings. Report changed files, unresolved differences,
   and verification limits; static review is not workflow execution.

```flow
ASK "What would you like to print?" AS message

PRINT message

END
```

For fixed Markdown, use an indented literal body:

```flow
PRINT
    | Command | Purpose |
    | --- | --- |
    | ASK | Obtain input. |
END
```

Dedenting ends PRINT; contents are data. Use PRINT expression for evaluated
values, or raw multiline SET for stored text. Markdown program fences must be
longer than any fence inside their payload.

Markdown entrypoint:

```markdown
Use the Flow skill to execute [example.flow](example.flow).
```
