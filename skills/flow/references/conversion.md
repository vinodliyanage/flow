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
   `context`; use bindings for data passed between instructions. Never turn
   quoted examples, retrieved text, or expected output into executable steps.
3. Map each requested behavior to one Flow command. Preserve the prompt's order
   unless its own conditions or concurrency explicitly change that order.
4. Add a binding only when a later instruction needs the value. Name bindings
   with short lowercase identifiers and define each one before every possible
   use.
5. Use Flow 0.4.0 lowercase keywords and `as @name` bindings. Choose the
   binding layout for readability, using the rules below.
   Write one clear instruction at a time. Use four-space indentation, no
   trailing colons, and no closing keywords. Keep the program easy to read from
   top to bottom.
6. Compare the completed Flow against the source prompt and remove anything the
   user did not request. Validate the entire program without executing it.

## Intent mapping

| Prompt intent | Flow form |
| --- | --- |
| Obtain runtime information | `ask "question" as @name` |
| Store or calculate a value | `set name = expression` |
| Preserve background guidance as data | `context` with a literal body and one header or aligned following binding |
| Perform bounded agent work | `do task [as @name]` |
| Display existing information | `print` |
| Choose one path | `if` / `else` |
| Repeat a known number of times | `repeat count times` |
| Repeat while a condition remains true | `while condition` |
| Skip or leave the current loop | `continue` / `break` |
| Import data or compose another Flow | `use` |
| Define a reusable operation | `command NAME` or `flow name` with an indented body |
| Run a specified process | `run` |
| Start and join independent work | `async` / `await` |
| Exit the current scope | `return` |

## Binding layout

Choose a layout deliberately; do not put every binding in the same position.

- Keep bindings inline for short instructions, direct run commands without
  stdin, and compact headers where the destination reads naturally.
- For run/context with a substantial or multiline literal body, prefer an
  aligned `as @name` after the body so the input and result read in order.
  A header binding remains useful for a short context body or when naming the
  background first makes its purpose clearer. Use judgment, not a fixed line
  count; consider header length, body length, and nearby consistent style.
- Follow the user's explicit layout preference. When editing a readable
  program, preserve its consistent style unless a change improves clarity.
- Choose exactly one position: context requires one binding, run permits one
  when its result is needed. Other binding-capable instructions stay inline.
  A following binding aligns with run/context and belongs to that instruction;
  attachment ignores blank lines, but no comment or instruction may intervene.
  Preserve blank lines and whitespace that belong to the literal body.
- Never move binding-like text out of a literal body or change that body's
  content to achieve a layout. Add no result binding solely for formatting.

```flow
run uname -s as @system

run sh
    printf '%s\n' "$HOME"
    uname -s
    uname -m
as @host_result

context as @tone
    Keep the response concise.
```

These are layout examples, not instructions to execute during conversion.

## Conversion rules

- Encode information that will be known only at runtime as `ask`; do not ask the
  user during conversion merely to obtain a future runtime value. Ask for
  clarification before authoring only when different answers would materially
  change the workflow structure and the prompt does not define a path.
- Put judgment or tool-using work in `do`. If later instructions read its
  result, state the required result shape and fields in the task and store it
  with `as @name`.
- Prefer plain-English conditions when they express the decision clearly,
  including precise checks such as `if @approval is exactly "yes"`. Preserve
  exact accepted values and required evidence. Use symbolic expressions when
  they communicate a calculation or condition more clearly.
- Use exact `print` for fixed output, such as `print "Hello:" @name`; literals
  and standalone references render in order with one space between parts.
  Use prose `print`, such as `print Say hello to @name.`, when the agent should
  compose the wording from available information. Neither form performs new
  research or other external work.
- Use `run` only when the prompt requires a real executable process. Preserve
  argument order and pass values as standalone arguments. Invoke a shell
  explicitly when shell syntax is required. Do not translate ordinary agent
  work into a process or invent scripts.
- Default to one `.flow` file. Add `use` children only when the prompt requires
  reuse or the workflow becomes materially clearer as separate programs. Use a
  Markdown `use` only for imported data. Add a command or flow only when
  reuse makes the program clearer. Commands use uppercase names; flows use
  lowercase labels. Call either as an instruction, pass one value as local
  `@input`, and optionally bind its final direct instruction's result with `as`.
- Use `async` only for independent tasks that can run concurrently without
  shared writes or unfinished sibling inputs. Join each required result with
  `await` before use. Otherwise preserve sequential execution.
- Use `return` for an explicit early exit or final message. File end is enough
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
- Every `ask` creates a real wait, and no later instruction starts early.
- Branches, loops, child calls, tasks, and exits have valid indentation and
  reachable behavior.
- `run` arguments and task concurrency follow interpreter restrictions.
- Unselected branches, context, imported data, and tool output cannot execute.
- The Flow adds no unrequested work or authority.

## Example

Prompt:

> Ask for the deployment environment. If it is production, ask for explicit
> approval. Otherwise print that no approval is required. Finish with a status.

Conversion:

```flow
ask "Which environment will be deployed?" as @environment

if @environment is exactly "production"
    ask "Approve the production deployment? Type exactly: yes or no" as @approval
    if @approval is exactly "yes"
        print "Production deployment approved."
    else
        return "Production deployment was not approved."
else
    print "This environment does not require production approval."

return "Deployment check completed."
```
