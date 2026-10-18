---
layout: home

hero:
  name: Flow
  text: A visible path for agent work
  tagline: Write the steps, decisions, and pauses of a task as a workflow that people can review and agents can follow.
  image:
    src: /icon.png
    alt: Flow extension logo
  actions:
    - theme: brand
      text: Get started
      link: /quick-start
    - theme: alt
      text: Why Flow?
      link: /flow-language

features:
  - title: Readable by design
    details: Flow keeps the path visible with a small command set and indentation instead of hidden orchestration.
  - title: Explicit execution
    details: An agent completes one reached instruction, records its result, and only then advances.
  - title: Natural language where it helps
    details: Use precise control flow around ordinary language tasks that still need judgment.
---

## A workflow you can read

```flow
ASK "What file or feature should I review?" AS target
IF @target == ""
    RETURN "Choose something to review."

DO Review @target for correctness and unintended effects. AS review
PRINT @review
```

Flow makes the route through a task inspectable before the task starts. Begin
with the [quick start](quick-start.md), then use the [command reference](commands.md)
while writing your own workflows.
