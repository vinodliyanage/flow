# Flow Syntax for Cursor

Highlights Flow instructions inside fenced `flow` blocks in Markdown (`.md`)
and in standalone `.flow` files. Markdown keeps its normal language mode.
Each Flow command has its own color. Other tokens use your editor theme,
including quoted strings, `{variables}`, comments, values, and block colons. Inline JavaScript fences keep JavaScript
highlighting. This extension highlights syntax; it does not execute Flow.

## Install

In Cursor, run **Extensions: Install from VSIX...** from the Command Palette
and select `flow-syntax-0.1.11.vsix`. Reload the window if an already-open file
has not updated.

Flow uses uppercase `TRUE`, `FALSE`, and `NULL` value keywords. JSON and
JavaScript keep their own lowercase literals; quoted strings are unchanged.

Raw triple-quoted SET strings support readable multiline response text. Their
contents stay literal and do not receive Flow command highlighting.

`PRINT expression` displays a value in chat; it is distinct from terminal
commands. PRINT has its own command color. Bare PRINT also accepts an indented
literal Markdown body without a colon; dedenting restores Flow highlighting.

## Example

````markdown
## Flow: Read a ticket

```flow
SHELL `{acli} jira workitem view {ticket_id} --json` AS response
SET ticket = JSON(stdout of response)
CHECK key of ticket == ticket_id
END with ticket.
```
````

## Command and value colors

Colors apply to Flow commands in both Markdown and `.flow` files. Override
individual `keyword.control.flow.*` scopes through the editor's
`editor.tokenColorCustomizations` setting if desired.

| Command | Color |
| --- | --- |
| `ASK` | `#56B6C2` |
| `SET` | `#E5C07B` |
| `RULES` | `#C8A2C8` |
| `FINALLY` | `#DBBFA8` |
| `THINK` | `#C099FF` |
| `DO` | `#61AFEF` |
| `PRINT` | `#F0D060` |
| `SHELL` | `#D19A66` |
| `RUN` | `#C678DD` |
| `CHECK` | `#98C379` |
| `IF` | `#E06C75` |
| `ELSE` | `#E9967A` |
| `REPEAT` | `#FF79C6` |
| `ASYNC` | `#7E9CD8` |
| `WAIT` | `#73DACA` |
| `STOP` | `#FF5370` |
| `END` | `#89DDFF` |
| `TRUE` | `#A8E6A1` |
| `FALSE` | `#FF8F9C` |
| `NULL` | `#FFD580` |

## Build

```sh
npm install
npm run package
```

The VSIX is created in this directory. Node.js and npm are needed only to
package the extension; the installed extension has no runtime dependencies.

Uses the standard [TextMate grammar and Markdown injection support](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide#injection-grammars).
