---
description: Turn an existing prompt into Flow while preserving its steps, decisions, inputs, outputs, and approval boundaries.
---

# Convert a prompt to Flow

Start with a procedure you can already describe. Flow makes its inputs, actions,
decisions, and outputs explicit. Conversion preserves those requirements; it
does not add work or start executing the result.

## Identify the instructions

Here is a traditional prompt:

> Ask which environment is being considered. If the answer is exactly
> “production”, ask for approval and wait. If approval is exactly “yes”, display
> “Production deployment approved.” Otherwise display “Production deployment
> was not approved.” and stop. For any other environment, display “This
> environment does not require production approval.” Finish by displaying
> “Deployment check completed.”

There are two inputs, two decisions, several possible messages, and one early
exit. The prompt checks approval; it does not request an actual deployment.

## Write the equivalent program

```flow
ask "Which environment is being considered?" as @environment

if @environment is exactly "production"
    ask "Approve the production deployment? Type yes or no." as @approval
    if @approval is exactly "yes"
        print "Production deployment approved."
    else
        return "Production deployment was not approved."
else
    print "This environment does not require production approval."

print "Deployment check completed."
```

The nested `if` belongs to the production branch. A rejected production approval
exits before the final message. Other environments skip the approval question.
This preserves the original prompt, including its treatment of every answer
other than exactly `production`.

## Choose the command that matches the work

| Requested behavior | Flow form |
| --- | --- |
| Ask for information known only during the run | `ask` |
| Store or calculate an exact value | `set` |
| Keep background text for a later task | `context` |
| Perform work requiring an agent or tools | `do` |
| Display existing information | `print` |
| Choose a path | `if` / `else` |
| Repeat a known number of times | `repeat` |
| Repeat while a condition remains true | `while` |
| Reuse a program or read Markdown | `use` |
| Launch a specified executable | `run` |
| Start independent concurrent work and join it | `async` / `await` |
| Exit this invocation | `return` |

Use an `as` binding only when later work needs the value. If a task returns an
object, name the required fields and their types in the `do` instruction.
Prefer plain-English conditions when they express the decision clearly.
English can express exact checks too: `is exactly "production"` preserves the
accepted value. Use symbolic expressions when they make a calculation or
condition clearer, and base judgments on information already available.

## Choose a readable binding layout

Use inline `as @name` for short instructions and direct commands such as
`run uname -s as @system`. For `run` and `context` with longer literal bodies,
prefer an aligned binding after the body:

```flow
run sh
    printf '%s\n' "$HOME"
    uname -s
    uname -m
as @host_result
```

Choose a header binding for a short context body or when naming it upfront
makes the background clearer. Consider header length, body length, and the
surrounding style; follow an explicit user preference. Use one binding per
instruction. For a following binding, only blank lines may separate it from
the body. Binding-like text inside the indented body remains literal.
Other binding-capable instructions keep their bindings inline. Layout changes
must preserve literal content and do not authorize executing these examples.

## Check the conversion

Read the prompt and program together. Every action should appear once, in the
requested order. Each reference must have a value on every path that reaches
it. Questions must pause before dependent work. Output messages and early exits
must match the prompt.

Do not silently add setup, research, retries, validation tools, cleanup, files,
publication, or permissions. When a requirement is ambiguous or unsupported,
identify it before presenting a program as equivalent. A future runtime input
belongs in `ask`; obtain it during authoring only when the answer would change
the program's structure.

Save one `.flow` file unless reuse materially improves the procedure. Reading
or converting a prompt does not authorize execution. See
[your first program](quick-start.md) when you are ready to run one deliberately.
