---
description: See how a traditional prompt becomes a readable Flow program with plain-English tasks, decisions, and approval pauses.
---

# Introduction

Flow is a language for writing the steps an agent should follow. You describe
the work in ordinary language and use commands to make its order, decisions,
and pauses explicit.

## From a prompt to a Flow program

Preparing a release involves a review, a blocker check, release notes, and
approval before a handoff. A traditional prompt has to explain that sequence
and each place where the agent should wait or stop:

<!--@include: ./_partials/release-prompt.md-->

The equivalent Flow program is:

<<< ../examples/release-handoff.flow{flow}

Both describe the same task. Flow gives each part a visible instruction:

| In the prompt | In Flow |
| --- | --- |
| Ask which release to prepare and wait | `ASK … AS release` |
| Review the release and keep the findings | `DO … AS review` |
| Stop the workflow when the review finds blockers | `IF` followed by `RETURN` |
| Draft notes and show them before approval | `DO … AS notes`, then `PRINT` |
| Wait for a fresh approval answer | A second `ASK` |
| Continue only for the exact answer “yes” | `IF @approval is not exactly "yes"` followed by `RETURN` |
| Prepare and display the handoff | The final `DO` and `PRINT` |

`release`, `review`, and `notes` are **bindings**: names that hold values. The
`@` prefix reads a value. Four spaces group the instructions inside a branch.
Task continuations use the same indentation to keep longer descriptions readable.

Conditions can be ordinary English. `IF @review identifies blocking issues`
expresses a judgment over the review; `IF @approval is not exactly "yes"`
expresses a precise text check. Prefer a clear sentence when it communicates
the decision naturally. Mathematical expressions are also supported when useful.

## How an agent follows it

The agent reads and validates the selected program, then starts at the first
instruction. At the first `ASK`, it waits for the release. The review begins
only after you reply.

Blocking findings select the first branch and end the run before notes are
drafted. Otherwise, the agent drafts and displays the notes, then pauses for
approval. Any answer other than exactly `yes` ends the run before the handoff.
An approved path reaches the final task. Each reached instruction completes
before the next begins.

Flow specifies the route through the work. Reviewing bugs and interpreting
blocking findings still require judgment, so results may vary between agents or runs.
Flow does not guarantee identical generated output or enforce execution through
a standalone runtime in this repository.

## Programs, interpreters, and editor support

A **program** is a `.flow` file or a selected Markdown `flow` block. The
**interpreter** is the contract an agent reads to understand and execute it.
The Flow skill loads that contract and supplies instructions for authoring and
execution.

The optional editor extension adds syntax highlighting, indentation, and links
to `USE` targets. It does not execute or validate programs. Highlighted text
alone does not establish that a program is valid.

## Read next

Start with [your first program](quick-start.md) to load the interpreter and
observe a real pause for input. Use the [command reference](commands.md) to
look up every command, or the [language specification](specification.md) for
the complete documented rules and their current limits.
