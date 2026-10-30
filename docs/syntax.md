---
description: Learn Flow indentation, bindings, strings, plain-English conditions, and exact or composed print output.
---

# Syntax and values

A Flow program combines command keywords, ordinary task text, and values.
This guide explains how to read and write those parts in Flow 0.7.0. For the
formal forms and known specification gaps, see the [language specification](specification.md).

## Instructions and indentation

```flow
ask "What is your name?" as @name
if @name is an empty string
    print "A name is required."
    return
print @name
```

A lowercase built-in keyword starts an instruction; another registered label
calls a defined flow. Custom command names remain uppercase. Four spaces put
`return` inside the `if` body. `print` is back at the outer level, so it runs after the branch
unless the program has already returned. Blocks have no trailing colon or
closing keyword. Every block needs a body.

Save one program in a `.flow` file, or place it in a fenced `flow` block in
Markdown. When Markdown contains several blocks, the execution request must
identify the selected program. Blank lines separate instructions visually;
they do not execute. Use spaces for structural indentation.

## Bindings hold values

`as @name` saves an instruction's result. In that suffix, `@name` is a
destination and does not need an existing value. Elsewhere, `@name` reads it.
Use `set` when you already have a value or want an exact calculation:

```flow
set count = 2
set count = @count + 1
set approved = true
set result = null
set names = ["Ana", "Vinod"]
set order = {"total": 25, "currency": "USD"}
print @order.total
```

Names start with a lowercase letter and contain lowercase letters, digits,
or underscores. Creating `count` again replaces its old value after the new
instruction succeeds. Reading an unknown name or missing field is an error.

An `ask` reply is always text. If a user types `3`, the binding contains the
string `"3"`, not the number `3`. Convert it through an explicit task or process
before numeric use; the language has no built-in conversion function.

Define reusable operations with `command NAME` or `flow name` and an
indented body. Call them with optional input and an optional `as` result suffix.
Both receive isolated local `@input`; see [reusing programs](reuse.md#named-flows).

## Strings and literal text

Quote fixed strings with double quotes. Ordinary strings use JSON escapes:
`"first\nsecond"` contains a newline. `"@name"` is the literal text `@name`.
It does not read the binding.

Use triple quotes for raw multiline text:

```flow
set message = """First line.
Second line with "quotes", @name, and # literal text.
"""
print @message
```

Everything between the delimiters is preserved, including whitespace and line
breaks. No interpolation, escape processing, or comment parsing occurs there.

`context` stores a literal indented body. `run` passes one to a process as stdin.
They remove one structural indentation level and preserve the remaining text.
Their binding may end the header or follow the body on an aligned line.
Use one position; indented `as @name` text stays part of the literal body.
An aligned binding belongs to the same instruction and stores its result
only after success. Other result bindings stay inline:

```flow
context as @guidelines
    Write a short greeting.
    The text @name here is literal, not a reference.
do Write a greeting for Ana following @guidelines as @greeting
print @greeting
```

## Exact output and composed responses

`print` supports both fixed output and an instruction to compose a response:

```flow
set name = "Ana"
print "Hello:" @name
print Say hello to @name.
```

The first line of output is exactly `Hello: Ana`. The second `print` asks the
agent to generate a greeting, so its wording can vary. Exact parts can be
literals or standalone references. They are rendered in order, separated by
one space, in a single message. Strings keep their contents; other values
render as JSON.

A single exact expression still works: `print @count + 1` displays the
calculation. Quoted references stay literal: `print "@name"` displays `@name`.
The [print reference](commands.md#print) defines how the written input selects
exact output or prose. Malformed exact input is an error, not a prose request.

## Long task text

Continue `do` or prose `print` one level deeper on immediately following lines:

```flow
do Explain the ask command in one sentence.
    Use simple language and return a string as @explanation
print @explanation
```

The second line extends the task. It is not a nested instruction. Continuation
lines join with spaces; the optional `as` suffix belongs at the end of the
complete task. An ordinary phrase such as `as a customer would` stays prompt
text. Only a trailing `as @name` is a binding, outside strings and literal
bodies. Destinations cannot be fields such as `@result.summary`.
Use a literal body or raw string when line breaks must survive.

## Conditions in plain English

`if` and `while` accept ordinary English conditions. Prefer a clear sentence
when it expresses the decision naturally:

```flow
set count = 2
if @count is greater than 0 and less than 5
    print "Within range."
```

English also works for precise text checks: `if @answer is exactly "yes"`.
State the intended meaning clearly. Saying `is an empty string` tests zero
characters; saying `contains only whitespace` describes a different condition.

A condition can describe a judgment over available evidence, such as
`if @review identifies blocking issues`. Its result must be determinable;
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
print "Ready."
```

Multiline comments must close and do not nest. Inline comments are unsupported.
Comment markers inside strings or literal bodies remain data.

Look up individual instructions in the [command reference](commands.md).
