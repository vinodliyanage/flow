# Flow

Flow makes the steps, decisions, and pauses of agent work explicit.

Traditional prompt:

> I want you to prepare a release handoff for the current project. First, ask
> me “Which release should I prepare?” and wait for my answer. Remember that
> answer and use it as the release throughout the rest of the task. Do not
> start reviewing anything before I reply.
>
> Review that release in the current project for bugs and breaking changes.
> Keep the findings and identify whether any issues are blockers. If the review
> identifies blocking issues, show me the review, display “Resolve blockers
> before continuing.”, and stop. In that case, do not draft release notes or
> prepare the handoff.
>
> If there are no blockers, draft release notes using the release and the review.
> Show me the draft, then ask “Approve these notes? Type yes to approve.” Wait
> for a new answer before continuing. My original request to prepare a release
> does not count as approval of the notes. Only the exact answer “yes” is
> approval. For any other answer, display “Release notes were not approved.”
> and stop without preparing the handoff.
>
> After approval, create the release handoff using the release, the review,
> and the approved notes. Include the release summary, notes, review findings,
> and next steps. Show me the finished handoff. Follow this order, and finish
> each step before starting the next one.

Equivalent Flow:

```flow
ask "Which release should I prepare?" as @release

do Review @release in the current project for bugs and breaking changes.
    Return the findings and identify any blocking issues as @review

if @review identifies blocking issues
    print @review
    print "Resolve blockers before continuing."
    return

do Draft release notes using @release and @review as @notes
print @notes

ask "Approve these notes? Type yes to approve." as @approval
if @approval is not exactly "yes"
    print "Release notes were not approved."
    return

do Create a release handoff using @release, @review, and @notes.
    Include a summary, notes, review findings,
    and next steps as @handoff
print @handoff
```

Start with the [introduction](docs/flow-language.md) and
[your first program](docs/quick-start.md). Look up all commands in the
[command reference](docs/commands.md), or read the
[language specification](docs/specification.md) and its known gaps.

Agents interpret programs using the Flow skill in `skills/flow/` and its
complete interpreter contract. This repository does not provide a standalone
runtime; natural-language task results still depend on agent judgment.

Flow **0.7.0** uses lowercase keywords and `as @name` result bindings.
For `run` and `context`, bind on the header or after the body on an aligned
line; other result bindings stay inline.
Leading top-level `use` instructions are file imports available to every command
and flow in that file. A `use` inside executable logic remains dynamic.
Custom command names are uppercase; named flows use lowercase labels:

```flow
flow add_one
    return @input + 1

command ADD_TWO
    add_one @input as @first
    add_one @first as @second
    return @second

ADD_TWO 3 as @total
print @total
```

Both forms receive isolated local `@input` and can return an explicit value
with `as`. `async name` retains its existing task-body
syntax. See [reusing programs](docs/reuse.md) and the
[interactive quiz](examples/functions-quiz.flow).

Conditions can be ordinary English, such as `if @review identifies blocking
issues`. Prefer clear sentences when they express the decision naturally;
exact expressions are available when needed. See the
[real-world examples](docs/examples.md) for reviews, bug fixes, meeting
follow-ups, and customer replies.

The [Flow extension](extensions/flow/README.md) provides highlighting,
indentation, and `use` file links in Cursor and VS Code.

## Install

```sh
npx skills add vinodliyanage/flow --skill flow --global
```

Choose your coding agent when prompted, or add `--agent codex cursor` to target
those agents. Then ask your agent to use the Flow skill to execute a `.flow`
file in your workspace. See [your first program](docs/quick-start.md).

## Documentation website

The documentation is published at
[flow.vinodliyanage.me](https://flow.vinodliyanage.me) and built with VitePress
from the Markdown files in `docs/`.

```sh
npm install
npm run docs:dev
```

Run `npm run docs:build` to create the production site. The GitHub Pages
workflow publishes that build from `main`.
