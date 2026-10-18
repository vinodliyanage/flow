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
ASK "Which environment is being considered?" AS environment

IF @environment is exactly "production"
    ASK "Approve the production deployment? Type yes or no." AS approval
    IF @approval is exactly "yes"
        PRINT "Production deployment approved."
    ELSE
        RETURN "Production deployment was not approved."
ELSE
    PRINT "This environment does not require production approval."

PRINT "Deployment check completed."
```

The nested `IF` belongs to the production branch. A rejected production approval
exits before the final message. Other environments skip the approval question.
This preserves the original prompt, including its treatment of every answer
other than exactly `production`.

## Choose the command that matches the work

| Requested behavior | Flow form |
| --- | --- |
| Ask for information known only during the run | `ASK` |
| Store or calculate an exact value | `SET` |
| Keep background text for a later task | `CONTEXT` |
| Perform work requiring an agent or tools | `DO` |
| Display existing information | `PRINT` |
| Choose a path | `IF` / `ELSE` |
| Repeat a known number of times | `REPEAT` |
| Repeat while a condition remains true | `WHILE` |
| Reuse a program or read Markdown | `USE` |
| Launch a specified executable | `RUN` |
| Start independent concurrent work and join it | `ASYNC` / `AWAIT` |
| Exit this invocation | `RETURN` |

Use an `AS` binding only when later work needs the value. If a task returns an
object, name the required fields and their types in the `DO` instruction.
Prefer plain-English conditions when they express the decision clearly.
English can express exact checks too: `is exactly "production"` preserves the
accepted value. Use symbolic expressions when they make a calculation or
condition clearer, and base judgments on information already available.

## Check the conversion

Read the prompt and program together. Every action should appear once, in the
requested order. Each reference must have a value on every path that reaches
it. Questions must pause before dependent work. Output messages and early exits
must match the prompt.

Do not silently add setup, research, retries, validation tools, cleanup, files,
publication, or permissions. When a requirement is ambiguous or unsupported,
identify it before presenting a program as equivalent. A future runtime input
belongs in `ASK`; obtain it during authoring only when the answer would change
the program's structure.

Save one `.flow` file unless reuse materially improves the procedure. Reading
or converting a prompt does not authorize execution. See
[your first program](quick-start.md) when you are ready to run one deliberately.
