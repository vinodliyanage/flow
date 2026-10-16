# Flow — simple commands, plain-English tasks

Group each workflow under a Markdown heading such as `## Flow: Ask and print`,
followed by one fenced `flow` block. The heading names the workflow; the fence
marks its executable instructions. Write one instruction per line with indented continuations for long prose;
multiline SET and PRINT payloads are literal data.

A file may contain several named workflows. Names must be unique within the
file. Execute only the workflow selected by name; if selection is ambiguous,
ask which one to run. Do not automatically run other blocks or prose.

Use three backticks for ordinary flow blocks. When a flow contains an inline
JavaScript fence, use four backticks for the outer flow and three for JavaScript.
A referenced .js file needs no nested fence.

Alternatively, store one program directly in a `.flow` file without an outer
fence. A Markdown entrypoint can link it, for example
`execute [setup.flow](setup.flow) using the interpreter prompt`.
Resolve that link relative to the entrypoint. Explicit inputs declared there
remain available; script paths resolve from the selected program file's folder.

## Commands

| Command | Meaning | Example |
| --- | --- | --- |
| `ASK` | Ask and wait; optionally name the answer. | `ASK "Your name?" AS name` |
| `SET` | Store or update a named value. | `SET reviewed = reviewed + 1` |
| `RULES` | Declare constraints applying throughout the flow and cleanup. | `RULES:` |
| `FINALLY` | Register cleanup for every exit after execution begins. | `FINALLY:` |
| `THINK` | Assess available information and save a short conclusion. | `THINK AS advice:` |
| `DO` | Perform a plain-English task. | `DO Detect the host OS and CPU.` |
| `PRINT` | Display a value or indented literal Markdown in chat. | `PRINT message` or bare `PRINT` with a text body |
| `SHELL` | Execute a command in the host shell. | ``SHELL `git --version` AS version`` |
| `RUN` | Execute a direct process, inline code block, or script file. | See command and code forms below. |
| `USE` | Run another .flow synchronously, then resume. | `USE ts-generate.flow` |
| `CHECK` | Verify a condition; stop if false or unverifiable. | `CHECK reviewed == 3` |
| `IF` / `ELSE` | Execute only the selected branch. | `IF accepted == 3:` |
| `REPEAT` | Repeat a block a bounded number of times. | `REPEAT 3 TIMES:` |
| `ASYNC` | Start a named background task and continue the main flow. | `ASYNC github_setup:` |
| `WAIT` | Wait until a named task finishes successfully. | `WAIT github_setup` |
| `STOP` | End the entire run early with a reason. | `STOP "Cancelled by the user."` |

## Indentation

Block headers IF, ELSE, REPEAT, ASYNC, THINK, RULES, and FINALLY end with a colon.
Their nonempty bodies start on the next meaningful line, indented four spaces.
Dedenting to an existing ancestor level closes blocks. Tabs, mixed indentation,
unexpected increases, empty bodies, and obsolete named closing commands are
syntax errors. Blank lines and # comments do not change scope outside literal text.
A bare PRINT introduces a literal text body without a colon; see Chat output.

Long DO, natural-language CHECK, and PRINT with arguments may continue on immediately
following lines indented four spaces beyond the instruction. Join continuation
lines with one space; they remain one instruction, not a nested command block.
Use no blank separators within an instruction. Do not split expressions, quoted
values, block headers, shell commands, or code. Wrap RULES/THINK paragraphs at
body indentation. Prefer lines around 100 characters and one blank line between
instructions, keeping each header next to its first body instruction.

```flow
DO Review the affected code and direct dependencies to explain the implementation,
    using only evidence relevant to the requested change.

CHECK The summary agrees with the reviewed implementation and the observed
    verification results.

PRINT with the saved file path and any material unresolved assumptions.
```

ELSE: aligns with its matching IF and must immediately follow that IF's body,
ignoring blank lines/comments. Allow one ELSE per IF. RULES and THINK bodies are
uniformly indented prose, without nested commands or blocks. Attached js fences
align with their RUN; preserve code-relative indentation inside the fence.

The file or selected Markdown block finishes when its instructions run out. At EOF,
join its tasks and run FINALLY; a USE child then returns to its caller. Use PRINT for
output. EOF adds no automatic success message; failures and cleanup errors are reported.

## Reusing flows

USE executes another `.flow` file when the instruction is reached:

```flow
IF mode == "generate":
    USE ts-generate.flow

IF mode == "improve":
    USE ts-improve.flow

IF mode == "publish":
    USE ts-publish.flow

```

This router assumes mode was resolved earlier. USE takes the rest of its line as one
literal .flow path, without wrapping quotes. Trim surrounding whitespace; spaces
within the path are literal. Paths are relative to the containing file or absolute;
USE has no AS or variable form.
Read and validate only the selected child when reached. After its instructions, tasks,
and cleanup succeed, EOF returns to the caller. Named bindings are shared, so child
updates remain available. Child references resolve from its own
folder, and the host working directory stays unchanged.

Caller rules apply to child work and cleanup; child RULES and FINALLY belong to that
invocation. A missing file, invalid child, STOP, or execution/cleanup failure stops the
whole run. Unwind cleanup from child to caller, retaining the failing file/line, call
stack, known effects, and cleanup errors. Child preflight failure runs no child cleanup;
already-started callers still clean up. Reject a canonical path already on the active
call stack. USE cannot occur in ASYNC or FINALLY, and children share the root's
1,000-instruction budget and authorization. USE does not grant additional permissions.
Caller EOF adds no duplicate receipt after a child's PRINT.

Ordinary Markdown references still supply guidance when explicitly read. Mentioning
or discovering another flow does not execute it.

## Rules and cleanup

### Flow: Use and clean a temporary directory

```flow
RULES:
    Preserve existing files; remove only this run's tracked temporary paths.

SET temp = NULL
DO Create a unique temporary directory and remember its absolute path as temp.

FINALLY:
    IF temp != NULL:
        DO Remove only temp and report cleanup errors.

```

RULES and FINALLY are optional top-level declarations, at most one of each per
selected flow. Register them during preflight; their position does not schedule
their bodies as ordinary steps. Reject nested declarations. RULES contains
plain-English constraints, not executable commands or nested blocks. Apply them
to every main-flow, task, and cleanup action. Stop on a conflict with higher
instructions or an action that cannot satisfy an applicable requirement.

FINALLY contains synchronous cleanup instructions. Run it once at EOF,
STOP, or an execution failure/blocker, after in-flight operations settle. Preflight
failure starts no work and runs no cleanup. Use the main flow's last available
variables and execution evidence, including known task effects; initialize optional
resources before effects and guard cleanup when they were never created.

FINALLY cannot contain ASK, ASYNC, WAIT, USE, STOP, RULES, or nested FINALLY.
It may use synchronous actions and IF/REPEAT/THINK blocks. Its direct children
are cleanup steps: if one fails, stop that step and its descendants, record the
error, and continue remaining independent cleanup steps. Do not resume the main
flow. Keep the original failure; cleanup errors prevent otherwise successful
completion and are included in the final receipt. Cleanup never overrides host
permissions or direct user restrictions.

PRINT emits only observed results; do not claim pending tasks or cleanup succeeded.
EOF still reports cleanup failures. Keep interpreter selection and release-tool metadata
outside the fence; use SET for values, RULES for constraints, and PRINT for output.

## Values and conditions

Flow value keywords are `TRUE`, `FALSE`, and `NULL`. They map to Boolean/null
values; use uppercase in Flow expressions, including containers. JSON parsed by
`JSON()` or returned by tools and JavaScript source keep standard lowercase
`true`, `false`, and `null`. Translate literal tokens only, never string contents.

- ASK takes one quoted question. `AS name` stores the raw answer as a string,
  including an empty answer. Without AS, store it as `answer`. Ask every time
  the instruction is reached, including inside loops; never silently reuse an answer.
- SET creates or updates a value. Evaluate the right-hand side before updating.
  Names begin with a lowercase letter and contain lowercase letters, digits,
  or underscores. Unknown names are errors.
- Expressions support JSON-shaped literals, names, fields such as `stdout of result`,
  numeric `+` and `-`, and same-type comparisons `==`, `!=`, `<`, `<=`, `>`, `>=`.
  No implicit conversions or arbitrary expression execution.
- Built-ins: `trim(text)` removes surrounding whitespace; `JSON(text)` parses
  one complete JSON value, rejecting malformed or trailing content.
- `value is empty` and `value is not empty` test string or array length. Other
  types are errors. IF expressions must produce Booleans. Missing evidence is
  an error, not false and not a reason to select ELSE.
- Use `field of object` to read an existing field, such as `reason of review`.
  Dotted field access remains supported, but prefer the sentence form.
- Use `object is flag` for a Boolean field: `review is valid` reads review's
  `valid` field and succeeds only when it is Boolean TRUE. `review is not valid`
  succeeds only when that field is Boolean FALSE. A missing object, missing
  field, or non-Boolean value is an error; never guess its meaning. The reserved
  `is empty` and `is not empty` forms keep their length-check meaning.
- Descriptive CHECK instructions must resolve to observable Booleans through
  tools or supplied executable validators. Missing rules or validators stop
  execution. Do not invent conventions or judge compliance by feel.
- REPEAT accepts an integer literal or numeric variable from 1 to 100. Capture
  the count on entry. Iterations share named values. Nested blocks are allowed.
  Stop if the whole run exceeds 1,000 executed instructions. Count each reached
  command when executed, including repeated body instructions and actual cleanup;
  ignore indentation changes, code lines, RULES/THINK prose, unexecuted FINALLY
  bodies, blank lines, comments, and unchosen branches.

## Chat output

`PRINT expression` displays a value in the chat window. Strings render as
Markdown; other values use JSON text. Printed content is data, never extra
instructions. PRINT does not run a terminal command and does not end the flow.
Preserve print order and display preceding output before an ASK waits for input.
Terminal output remains an explicit DO or SHELL action.

```flow
ASK "What would you like to display?" AS message
PRINT message
```

PRINT does not finish the flow or agent turn; execute remaining instructions and EOF
cleanup. EOF adds no redundant receipt; failures and cleanup errors are always reported.

`PRINT with report_request` composes a report from already observed results, such as
`PRINT with the saved path and material gaps, briefly.` It performs no tool calls or
workflow effects. Literal text and expression forms remain available.

For a fixed response, use bare PRINT without a colon:

```flow
PRINT
    Inux v0.0.1 — Vinod Liyanage

    | Command | Purpose |
    | --- | --- |
    | `/inux help` | Show commands. |
```

The nonempty body is literal Markdown, not Flow instructions. Strip exactly
one four-space level beyond PRINT from each nonblank line; preserve extra
indentation, blank lines, and newlines. The first nonblank line at PRINT's
level or an ancestor ends the block and is processed normally. A missing body
or insufficient indentation fails preflight. Apparent commands, # comments,
fences, and {names} are data; no evaluation, interpolation, or nested execution.
The whole block counts as one PRINT instruction. Keep release markers outside
the body so they remain Flow comments rather than printed text. In Markdown,
use an outer Flow fence longer than any fence in the payload.

## Multiline text

Use a raw triple-quoted SET string for a help response, table, or template that
belongs in the program:

```flow
SET response = """
| Command | Purpose |
| --- | --- |
| ASK | Obtain input. |
"""
PRINT response
```

The opening delimiter ends the SET line; the closing delimiter is alone on a
line aligned with SET. Preserve all payload text and its trailing newline.
Do not expand variables, escapes, comments, or commands inside. This is one SET
instruction, even across multiple lines. Unclosed literals fail preflight. Keep
a payload containing the closing delimiter line in a separate file or use an
escaped JSON-shaped string. An enclosing Markdown fence must be longer than
any fence in the payload.

## Background tasks

### Flow: Check tools asynchronously

```flow
ASYNC node_check:
    SHELL `node --version` AS version

ASYNC git_check:
    SHELL `git --version` AS version

DO Print "Checking tools..." in the terminal.
WAIT node_check
WAIT git_check
PRINT with both task results.
```

ASYNC launches its indented body as one task. Dedenting closes the task
definition without waiting. The main flow advances once the task is scheduled,
while instructions inside each task remain sequential. WAIT marks a dependency:
do not execute the following main-flow instruction until that task succeeds.
Other tasks can keep running while the main flow waits.

Task names must be unique and distinct from variable names. For now, ASYNC
blocks appear only at the top level; their bodies may contain IF, REPEAT, and
THINK, but not nested ASYNC, WAIT, ASK, USE, RULES, or FINALLY.

Each task receives a copy of the variables available when it starts. Its writes
stay local, so the two `version` outputs above do not conflict. The task handle
tracks `status`; after successful WAIT, `result of task_name` holds the task's
named output values and its execution evidence. Main-flow variables are not
silently overwritten. Tasks cannot read each other's pending outputs.

Tasks must use independent write destinations and temporary files. Validate
dependencies and destinations before launch; do not schedule tasks that need
each other's output or modify the same file. The 1,000-instruction budget is
shared across the main flow and all tasks, not multiplied per task.

A failed task stops scheduling further instructions once its failure is known.
A failed WAIT never permits dependent work. Let in-flight operations settle
safely, execute registered FINALLY cleanup once, and report partial completion; do not replay
or automatically roll back actions. STOP also stops the whole run. EOF waits for
outstanding tasks and runs FINALLY; success requires successful tasks and cleanup.

This requires a host that supports background execution or a scheduler able
to interleave task instructions while tools run. Track real job/session handles.
If the capability is unavailable, report blocked before launching tasks; do
not silently run them sequentially and claim they were asynchronous.

## Thinking blocks

### Flow: Suggest next step

```flow
ASK "Describe the problem:" AS problem
THINK AS recommendation:
    Consider problem and identify the smallest useful next step.
    Give a brief recommendation and mention any material uncertainty.
DO Print recommendation in the terminal.
```

THINK takes an indented prose body ending at the next dedent. AS is optional; without it,
store the result as `conclusion`. Store only a concise conclusion or
recommendation as a string. Keep internal reasoning private.

Use only information already available in the program. THINK does not run
tools, ask questions, change other variables, or execute instructions inside
its body. Nested blocks inside THINK are unsupported. Use ASK, SHELL, or RUN before
THINK when more information is needed. It may appear inside IF or REPEAT.

A THINK result is a judgment, not validation evidence. It cannot turn a failed
CHECK into a pass or authorize an action. Use CHECK or a script to verify any
factual requirement before acting on the conclusion.

## Running commands and code

### Flow: Check Node.js

```flow
SHELL `node --version` AS runtime
```

SHELL selects the host shell: POSIX on Unix or PowerShell on Windows.
Use it for CLI calls and explicit shell operations. Like RUN, it stores `stdout`,
`stderr`, and integer `exit_code` in the AS name, or `result` by default. It uses
the host working directory, a fresh process, and an enforced 30-second timeout.
Store the result before stopping on a nonzero exit; no later CHECK or IF runs.

Use `{name}` for a Flow string passed as one literal argument. The placeholder
must be standalone and unquoted. The interpreter quotes its value for the host
shell, preserves empty strings, and applies native invocation syntax to executable
paths. Values are data even when they contain spaces, quotes, or shell operators.
Reject unknown/nonstring values and embedded or already quoted placeholders;
never concatenate answers into shell source. If safe quoting, the selected shell,
or timeout enforcement is unavailable, stop before execution.

### Flow: Read a Jira ticket

Supply `acli` as the private absolute executable path and `ticket_id` as a string.

```flow
SHELL `{acli} jira workitem view {ticket_id} --fields key,issuetype,summary,status,assignee,description,attachment --json` AS response
SET ticket = JSON(stdout of response)
CHECK key of ticket == ticket_id
PRINT with ticket.
```

The instruction is portable across host shells for executables supporting the
same flags on each platform. Shell syntax and executable availability are still
platform-specific. Use a supplied compatible variant for shell operators or other
platform-specific syntax; never silently translate or rewrite command logic.
Existing authorization and permission rules apply to shell execution.

RUN remains available for direct process execution without a shell and for code.
RUN stores an object with `stdout`, `stderr`, and integer `exit_code`.
AS is optional; without it the result is named `result`. Processes use the
host-supplied working directory and a 30-second timeout. If the host cannot
enforce the timeout, stop before running.

Backticks delimit command text. Parse quoted arguments and pass them to the
process API with `shell=false`. Do not expand variables, pipes, redirects, or
shell substitutions. Use an inline code block or script file for dynamic arguments or logic.
Never concatenate user values into executable source.

An attached JavaScript block uses this form. This fragment expects `name` to
be supplied as an initial variable:

### Flow: Greet user

````flow
RUN JavaScript using Node.js AS greeting
```js
const vars = JSON.parse(process.env.FLOW_VARS);
console.log("Hello, " + vars.name);
```
````

The code fence belongs to the preceding RUN; together they form one instruction.
Strip only the shared Markdown indentation, preserving relative code indentation.
Run the source unchanged in a fresh Node.js process. Pass a JSON snapshot of
current variables in the `FLOW_VARS` environment variable. Do not substitute
values into source. Capture the result after completion; JavaScript cannot
update program variables directly.

Alternatively, reference a JavaScript file:

### Flow: Validate commit subject

```flow
RUN "check-commit-subject.js" using Node.js AS validation
```

Resolve a relative file path against the folder containing the selected
program file (`.md` or `.flow`), not the process working directory. Absolute paths are also
allowed. If the program was pasted without a source path, require an explicit
program folder before resolving relative paths. Do not guess the folder.

Execute the existing file unchanged with Node.js using its resolved absolute
path. Keep the host-supplied working directory, 30-second timeout,
FLOW_VARS input, and stdout/stderr/exit_code result contract. A file RUN
has no attached code block. Missing or unreadable files stop the run; do not
create, download, rewrite, or substitute a missing script automatically.

Any nonzero process exit stops the run immediately, before a later CHECK or IF.
Arithmetic, comparisons, and JSON parsing must be evaluated in code. DO allows
judgment within its stated task; it cannot change program control flow.

## Flow: Ask and print

```flow
ASK "What would you like to print?" AS message
DO Print message in the terminal.
```

## Flow: Publish draft PR

Supply the repository folder as the working folder, GitHub repository, base
branch, final PR title/body, and executable convention checkers. The current
GitHub base commit must be available locally; the head must already be pushed.

```flow
SHELL `git symbolic-ref --quiet --short HEAD` AS branch_result
SET branch = trim(branch_result.stdout)
SHELL `git rev-parse --verify HEAD` AS head_result
SET head = trim(head_result.stdout)
CHECK Every commit message in base..head passes the supplied commit-message checker, using the current GitHub base commit.
CHECK branch passes the supplied branch-name checker.
CHECK The working tree is clean, including staged changes and untracked files.
CHECK No open PR already exists for this head and base.
CHECK The local branch and HEAD are unchanged, the GitHub head matches head, and the GitHub base is unchanged since validation.
DO Publish a draft PR using gh with the supplied repository, base, title, and body and branch as the head branch.
CHECK The published PR is open, is a draft, targets the supplied base, and contains head as its HEAD commit.
PRINT with the PR link.
```

For publication, use explicit `gh pr create --repo`, `--base`, `--head`,
`--draft`, `--title`, and `--body` arguments. Pass values as literal arguments.
Do not push, fork, edit, commit, stash, fetch, or repair as implicit preparation.
Races between validation and publication remain possible. These checks do not
establish code correctness or replace lasting repository controls.

## Editor highlighting

The [Flow Syntax extension for Cursor](../../extensions/flow-syntax/README.md)
highlights fenced `flow` blocks in Markdown and standalone `.flow` files.

## Interpreter prompt

Use the [Flow skill](../../skills/flow/SKILL.md) for `.flow` files and named
Markdown `flow` blocks. Its [interpreter](../../skills/flow/references/interpreter.md)
defines execution semantics. Inux requires this skill to execute its programs.
See the [design and research notes](interpreter-design.md) for the execution
contract and proposed behavioral evaluations.

## More advanced example and limits

[Review three commit subjects](advanced-commit-review.md) exercises several commands,
including a JavaScript file, mutable counters, and a THINK block for advice. Its policy is explicit and
illustrative; it does not change or validate a real Git repository.

Plain-English DO tasks still require interpretation. A strict prompt cannot
guarantee deterministic execution. Hard guarantees require a code runner that
controls actions and evaluates checks. This document defines the language and
prompt; it does not implement such a runner.
