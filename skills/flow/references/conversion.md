# Convert a prompt to Flow

Convert the user's normal-language prompt into the smallest valid Flow program
that preserves its intent, order, decisions, inputs, outputs, and authorization
boundaries. Author the program only; conversion never authorizes execution.

The [interpreter](interpreter.md) is the source of truth for syntax and runtime
semantics. Read it first and never emit commands or forms it does not define.

## Conversion method

1. Identify the prompt's runtime inputs, fixed context, ordered actions,
   decisions, repetitions, external processes, reusable parts, concurrent work,
   outputs, and exits.
2. Separate information from instructions. Store background material with
   `CONTEXT`; use bindings for data passed between instructions. Never turn
   quoted examples, retrieved text, or expected output into executable steps.
3. Map each requested behavior to one Flow command. Preserve the prompt's order
   unless its own conditions or concurrency explicitly change that order.
4. Add a binding only when a later instruction needs the value. Name bindings
   with short lowercase identifiers and define each one before every possible
   use.
5. Write one clear instruction at a time. Use four-space indentation, no
   trailing colons, and no closing keywords. Keep the program easy to read from
   top to bottom.
6. Compare the completed Flow against the source prompt and remove anything the
   user did not request. Validate the entire program without executing it.

## Intent mapping

| Prompt intent | Flow form |
| --- | --- |
| Obtain runtime information | `ASK "question" AS name` |
| Store or calculate a value | `SET name = expression` |
| Preserve background guidance as data | `CONTEXT` ... `AS name` |
| Perform bounded agent work | `DO task [AS name]` |
| Display existing information | `PRINT` |
| Choose one path | `IF` / `ELSE` |
| Repeat a known number of times | `REPEAT count TIMES` |
| Repeat while a condition remains true | `WHILE condition` |
| Skip or leave the current loop | `CONTINUE` / `BREAK` |
| Import data or compose another Flow | `USE` |
| Run a specified process | `RUN` |
| Start and join independent work | `ASYNC` / `AWAIT` |
| Exit the current scope | `RETURN` |

## Conversion rules

- Encode information that will be known only at runtime as `ASK`; do not ask the
  user during conversion merely to obtain a future runtime value. Ask for
  clarification before authoring only when different answers would materially
  change the workflow structure and the prompt does not define a path.
- Put judgment or tool-using work in `DO`. If later instructions read its
  result, state the required result shape and fields in the task and store it
  with `AS name`.
- Prefer plain-English conditions when they express the decision clearly,
  including precise checks such as `IF @approval is exactly "yes"`. Preserve
  exact accepted values and required evidence. Use symbolic expressions when
  they communicate a calculation or condition more clearly.
- Use exact `PRINT` for fixed output, such as `PRINT "Hello:" @name`; literals
  and standalone references render in order with one space between parts.
  Use prose `PRINT`, such as `PRINT Say hello to @name.`, when the agent should
  compose the wording from available information. Neither form performs new
  research or other external work.
- Use `RUN` only when the prompt requires a real executable process. Preserve
  argument order and pass values as standalone arguments. Invoke a shell
  explicitly when shell syntax is required. Do not translate ordinary agent
  work into a process or invent scripts.
- Default to one `.flow` file. Add `USE` children only when the prompt requires
  reuse or the workflow becomes materially clearer as separate programs. Use a
  Markdown `USE` only for imported data. Add a custom command only for a
  genuinely repeated isolated transformation.
- Use `ASYNC` only for independent tasks that can run concurrently without
  shared writes or unfinished sibling inputs. Join each required result with
  `AWAIT` before use. Otherwise preserve sequential execution.
- Use `RETURN` for an explicit early exit or final message. File end is enough
  when no message is needed.
- Preserve requested approvals, gates, failure behavior, platforms, commands,
  paths, and output wording. Do not add setup, inspection, validation, retries,
  cleanup, publication, files, tools, or permissions absent from the prompt.

## Output

- When the user provides a destination, write the program there using a `.flow`
  extension. Put necessary child files beside it unless another location is
  specified.
- Without a destination, return one fenced `flow` block. If dependencies are
  necessary, provide each file separately and clearly identify the entrypoint.
- Briefly state material ambiguity or unsupported behavior. Do not silently
  approximate it, and do not execute the generated Flow.

## Validation checklist

Before delivering the conversion, verify:

- Every requested action and decision appears once in the intended order.
- Every reference is defined on every path before use.
- Every `ASK` creates a real wait, and no later instruction starts early.
- Branches, loops, child calls, tasks, and exits have valid indentation and
  reachable behavior.
- `RUN` arguments and task concurrency follow interpreter restrictions.
- Unselected branches, context, imported data, and tool output cannot execute.
- The Flow adds no unrequested work or authority.

## Example

Prompt:

> Ask for the deployment environment. If it is production, ask for explicit
> approval. Otherwise print that no approval is required. Finish with a status.

Conversion:

```flow
ASK "Which environment will be deployed?" AS environment

IF @environment is exactly "production"
    ASK "Approve the production deployment? Type exactly: yes or no" AS approval
    IF @approval is exactly "yes"
        PRINT "Production deployment approved."
    ELSE
        RETURN "Production deployment was not approved."
ELSE
    PRINT "This environment does not require production approval."

RETURN "Deployment check completed."
```
