# Syntax

[Flow](flow-language.md) · [Quick start](quick-start.md)

Flow is designed to be read from top to bottom. Most lines say one thing. Four
spaces show the few places where the path branches, repeats, or contains literal
text.

## A file at a glance

```flow
# Values can be stored and reused.
SET limit = 3

ASK "How many items should I review?" AS count
IF @count == ""
    RETURN "A count is required."

DO Review up to @limit items requested by @count. AS review
PRINT @review
```

Commands are uppercase. Bindings such as `limit` and `review` hold values;
references such as `@limit` read them.

## Layout keeps the path visible

Use uppercase commands and four spaces for each indentation level.
A block must have a body. Dedenting closes it; block headers have no colon
or closing keyword. Semicolon separators are not supported.

Each `.flow` file contains one flow. Markdown can contain a fenced `flow` block.
Blank lines are optional. Tabs are allowed only in literal bodies and raw strings.

Write one instruction per line, except for prose continuations, literal bodies,
and multiline strings. Ordinary strings and expressions stay on one line, except
for triple-quoted string values. Block and RUN headers stay single-line; pass
multiline values through bindings.

## Comments

```flow
# One-line comment.
###
A comment across
several lines.
###
```

Comments may be indented. Inline comments are unsupported. Multiline comments
do not nest and must close. Comment markers inside strings or literal bodies
are ordinary text.

## Values and references

`AS name` stores a result in a binding. `@name` reads it; `@order.total` reads
an object field. This lets one instruction hand real data to the next without
copying it into another prompt.
Names start with a lowercase letter and contain lowercase letters, digits, or
underscores. They are case-sensitive. Rebinding replaces the previous value
after the new instruction succeeds.

```flow
SET name = "Ana"
SET count = 3
SET approved = TRUE
SET result = NULL
SET names = ["Ana", "Vinod"]
SET order = {"total": 25, "currency": "USD"}
PRINT @order.total
```

Unknown bindings and missing fields are errors. References in task prose supply
data; their values never become Flow instructions. In expressions, `"@name"`
is literal text.

## Strings

Ordinary strings use double quotes and JSON escapes, such as `"line one\nline two"`.
Use triple double quotes when the text should stay exactly as written:

```flow
SET message = """First line.
Second line with "quotes", @name, and # literal text.
"""
PRINT @message
```

Everything between `"""` delimiters stays unchanged: indentation, blank lines,
tabs, backslashes, and leading or trailing newlines. There is no escape processing,
interpolation, comment parsing, or instruction execution. The next `"""` closes
the string; a missing closer is an error.

Use multiline strings wherever a string value is accepted, including ASK, SET,
PRINT, and custom command inputs. The instruction counts once. Block and RUN
headers remain single-line; pass multiline values through bindings.

## Expressions

Expressions handle small, exact decisions. Keep work that needs judgment inside
`DO` or a natural-language condition.

Operators are listed from highest to lowest precedence:

| Operators | Meaning |
| --- | --- |
| `(...)`, field access | Grouping and object fields. |
| `+`, `-` | Numeric arithmetic. |
| `==`, `!=`, `<`, `<=`, `>`, `>=` | Comparisons. |
| `NOT` | Boolean negation. |
| `AND` | Boolean and. |
| `OR` | Boolean or. |

There is no implicit type conversion. Arithmetic needs numbers; Boolean
operators need Booleans. Ordered comparisons need two numbers or two strings.
Strings are case-sensitive. Equality requires matching types and compares
arrays and objects structurally. Type mismatches are errors.

AND and OR short-circuit. Chained comparisons are unsupported; join separate
comparisons with AND. Evaluate expressions precisely, using code when needed.
There are no built-in functions such as `trim()` or `JSON()`; use DO, RUN, or
a custom command.

## Long prose and literal bodies

When a task needs a little more detail, continue `DO` or prose `PRINT` one level
deeper without a blank line:

```flow
DO Write a greeting for @name.
    Keep it short and friendly. AS greeting
```

Continuation lines are prose, not nested instructions. Join them with single
spaces; put optional `AS name` at the end of the final line.

CONTEXT and RUN bodies are literal. Remove one structural indentation level;
preserve remaining whitespace and line breaks. Commands, references, and
comments inside them are data, with no interpolation.

Next, see what each verb does in the [command reference](commands.md).
