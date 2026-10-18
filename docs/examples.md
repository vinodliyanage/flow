---
description: Use Flow for release handoffs, pull-request reviews, approved bug fixes, meeting follow-ups, and policy-grounded customer replies.
---

# Real-world examples

Flow is useful when work has a repeatable path: gather information, do the
work, check the result, and pause before a decision or change. These examples
use ordinary English conditions so you can read the procedure directly.

| Workflow | What it delivers | What Flow makes explicit |
| --- | --- | --- |
| [Release handoff](#release-handoff) | Reviewed notes and a release handoff. | Blockers and approval before the handoff. |
| [Pull-request review](#pull-request-review) | Findings or a reviewer summary. | The path changes when blockers are found. |
| [Investigate and fix a bug](#investigate-and-fix-a-bug) | A supported proposal, approved fix, and check results. | Evidence before a proposal; approval before edits. |
| [Meeting follow-up](#meeting-follow-up) | Decisions and action items ready to share. | Missing owners and deadlines trigger a question. |
| [Customer reply](#customer-reply) | A reply grounded in supplied policy. | Unsupported decisions go back to a human. |

Each listing is included from its `.flow` file. The explanations describe its
intended paths; they are not records of executed runs. To run one, load the
interpreter as described in [your first program](quick-start.md) and explicitly
ask an agent to execute the selected file.

## Release handoff

A release review should happen before notes are drafted, and the notes should
be approved before a handoff is prepared. The host needs access to the release's
changes in the current project.

Traditional prompt:

<!--@include: ./_partials/release-prompt.md-->

Equivalent program:

<<< ../examples/release-handoff.flow{flow}

Blocking findings end the run before drafting. Otherwise, the agent shows the
notes and waits for a fresh answer. Only exactly `yes` reaches the handoff.
The program prepares artifacts; it does not publish or deploy the release.

## Pull-request review

Use this before asking a teammate to approve a change. Supply a pull request
the agent can access, or a local diff in its workspace. The agent reads the
change and relevant code, then takes a different path if it finds blockers.

<<< ../examples/pull-request-review.flow{flow}

Blocking findings produce actionable feedback. Otherwise, the agent prepares
a summary of behavior, risks, and verification gaps. It does not modify code,
post a review, or imply that tests have run.

## Investigate and fix a bug

Use this when a reported bug needs evidence before anyone changes the code.
The host needs access to the current project and its existing checks.

<<< ../examples/bug-fix.flow{flow}

An unsupported diagnosis stops with the missing evidence. A supported diagnosis
leads to a proposal, which the agent displays before asking for approval.
Only exactly `yes` permits the fix. Existing relevant checks run afterward;
a failed check stops ordinary execution and does not undo earlier edits.

## Meeting follow-up

Use this after a meeting to turn rough notes into a useful follow-up. Paste the
notes directly; no calendar or messaging integration is required.

<<< ../examples/meeting-follow-up.flow{flow}

The agent asks for clarification only when an action lacks an owner or deadline.
You can leave those items unresolved. The final follow-up keeps that uncertainty
visible and is displayed for review rather than sent to attendees.

## Customer reply

Use this to prepare a support response without inventing policy. Paste the
customer's message and the policy or product information the answer may use.

<<< ../examples/customer-reply.flow{flow}

A decision outside the supplied policy returns to a human. Otherwise, the
agent drafts a reply grounded in that information. It does not send the reply,
issue refunds, or make changes to a customer account.

## Write your own workflow

Use `IF @approval is not exactly "yes"` for a precise approval check, or
`IF @review identifies blocking issues` for a judgment over available evidence.
English conditions are part of Flow, not comments around the program. Symbolic
expressions remain supported in the [language reference](specification.md).

Start with [prompt conversion](prompt-to-flow.md) to turn a procedure into Flow.
