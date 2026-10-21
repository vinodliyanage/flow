---
description: Learn Flow indentation, bindings, strings, plain-English conditions, and exact or composed PRINT output.
---

# Syntax and values

A Flow program combines command keywords, ordinary task text, and values.
This guide explains how to read and write those parts. For the formal forms
and known specification gaps, see the [language specification](specification.md).

## Instructions and indentation

```flow
ASK "What is your name?" AS name
IF @name is an empty string
    RETURN "A name is required."
PRINT @name
```

An uppercase command usually starts an instruction; a lowercase label calls a
defined flow. Four spaces put `RETURN` inside
the `IF` body. `PRINT` is back at the outer level, so it runs after the branch
unless the program has already returned. Blocks have no trailing colon or
closing keyword. Every block needs a body.

Save one program in a `.flow` file, or place it in a fenced `flow` block in
Markdown. When Markdown contains several blocks, the execution request must
identify the selected program. Blank lines separate instructions visually;
they do not execute. Use spaces for structural indentation.

## Bindings hold values

`AS name` saves an instruction's result. `@name` reads it. Use `SET` when you
already have a value or want an exact calculation:

```flow
SET count = 2
SET count = @count + 1
SET approved = TRUE
SET result = NULL
SET names = ["Ana", "Vinod"]
SET order = {"total": 25, "currency": "USD"}
PRINT @order.total
```

Names start with a lowercase letter and contain lowercase letters, digits,
or underscores. Creating `count` again replaces its old value after the new
instruction succeeds. Reading an unknown name or missing field is an error.

An `ASK` reply is always text. If a user types `3`, the binding contains the
string `"3"`, not the number `3`. Convert it through an explicit task or process
before numeric use; the language has no built-in conversion function.

Define reusable operations with `COMMAND NAME` or `FLOW name` and an
indented body. Call them with optional input and an optional `AS` result suffix.
Both receive isolated local `@input`; see [reusing programs](reuse.md#named-flows).

## Strings and literal text

Quote fixed strings with double quotes. Ordinary strings use JSON escapes:
`"first\nsecond"` contains a newline. `"@name"` is the literal text `@name`.
It does not read the binding.

Use triple quotes for raw multiline text:

```flow
SET message = """First line.
Second line with "quotes", @name, and # literal text.
"""
PRINT @message
```

Everything between the delimiters is preserved, including whitespace and line
breaks. No interpolation, escape processing, or comment parsing occurs there.

`CONTEXT` stores a literal indented body. `RUN` passes one to a process as stdin.
They remove one structural indentation level and preserve the remaining text:

```flow
CONTEXT
    Write a short greeting.
    The text @name here is literal, not a reference.
AS guidelines
DO Write a greeting for Ana following @guidelines. AS greeting
PRINT @greeting
```

## Exact output and composed responses

`PRINT` supports both fixed output and an instruction to compose a response:

```flow
SET name = "Ana"
PRINT "Hello:" @name
PRINT Say hello to @name.
```

The first line of output is exactly `Hello: Ana`. The second `PRINT` asks the
agent to generate a greeting, so its wording can vary. Exact parts can be
literals or standalone references. They are rendered in order, separated by
one space, in a single message. Strings keep their contents; other values
render as JSON.

A single exact expression still works: `PRINT @count + 1` displays the
calculation. Quoted references stay literal: `PRINT "@name"` displays `@name`.
The [PRINT reference](commands.md#print) defines how the written input selects
exact output or prose. Malformed exact input is an error, not a prose request.

## Long task text

Continue `DO` or prose `PRINT` one level deeper on immediately following lines:

```flow
DO Explain the ASK command in one sentence.
    Use simple language and return a string. AS explanation
PRINT @explanation
```

The second line extends the task. It is not a nested instruction. Continuation
lines join with spaces; the optional `AS` suffix belongs at the end of the
complete task. Use a literal body or raw string when line breaks must survive.

## Conditions in plain English

`IF` and `WHILE` accept ordinary English conditions. Prefer a clear sentence
when it expresses the decision naturally:

```flow
SET count = 2
IF @count is greater than 0 and less than 5
    PRINT "Within range."
```

English also works for precise text checks: `IF @answer is exactly "yes"`.
State the intended meaning clearly. Saying `is an empty string` tests zero
characters; saying `contains only whitespace` describes a different condition.

A condition can describe a judgment over available evidence, such as
`IF @review identifies blocking issues`. Its result must be determinable;
missing evidence stops execution. The condition does not authorize additional
unstated work.

Exact arithmetic and Boolean expressions remain available. They are useful
when symbolic notation communicates a calculation or condition more precisely.
There is no implicit type conversion. See the
[expression reference](specification.md#_5-expressions-and-conditions) for the
complete operator list and evaluation rules.

## Comments

```flow
# A one-line comment.
###
A multiline comment.
Nothing inside it executes.
###
PRINT "Ready."
```

Multiline comments must close and do not nest. Inline comments are unsupported.
Comment markers inside strings or literal bodies remain data.

Look up individual instructions in the [command reference](commands.md).
