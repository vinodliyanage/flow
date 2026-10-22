# Flow

Syntax highlighting, indentation, command snippets, and `use` file navigation
for Flow in Cursor and VS Code. The language specification is
`docs/specification.md` at the repository root (Flow 0.4.0).
Supports `.flow` files and Markdown `flow` fences. It does not execute, validate,
or format programs.

Commands: `ask set do print context use if else repeat while continue break return run async await command flow`.
Flow 0.4.0 uses lowercase keywords and `as @name` bindings; references
use `@name.field`. For `run` and `context`, place the binding on the header
or after the body aligned with the command. Other result bindings stay inline. Define uppercase commands
with `command NAME` and named flows with `flow name`, using a lowercase label.
Both have indented bodies. Calls use `NAME value as @result` or `name value as @result`.
Blocks use four spaces without colons. `context`/`run` bodies and
`###` comments remain literal; text resembling `use` inside them creates no file links.
Raw triple-quoted strings (`"""..."""`) preserve multiline text without interpolation,
escapes, comment parsing, or file links.
Declared labels, `@references`, and callable names have distinct default
colors. `flow` uses bold emerald (`#34D399`) to mark reusable subflow definitions.
Only quoted strings use the same `#98C379` green as the documentation;
literal `context` and `run` bodies keep the editor's normal text color. All defaults
remain overridable by the active theme.

## Install

Run **Extensions: Install from VSIX...** and choose
`skills/flow/assets/flow-0.4.0.vsix` from the repository root, or:

```sh
cursor --install-extension /absolute/path/to/flow/skills/flow/assets/flow-0.4.0.vsix
```

Reload the window if open files have not refreshed. `.flow` uses **Flow** language
mode; Markdown keeps Markdown mode. Command-click (macOS) or Ctrl-click opens `use`
references relative to the containing file, including Markdown guidance files.
Colors follow the extension defaults and any user theme overrides.

## Writing a Flow file

In **Flow** language mode, indentation defaults to four spaces. Block
rules indent after headers such as `if`, `else`, `repeat`, `command`, and
`flow`. Explicit user or workspace settings can override these defaults;
no settings files are changed.

Type `ask`, `do`, `print`, `if`, `context`, `command`, or `flow` and use
**Trigger Suggest**, or open **Insert Snippet** in the Command Palette.
Select a template, then press Tab to
move through its editable fields. `print` offers value and prose forms; `if`
offers one branch or `if`/`else`. Templates are starting points, not automatically
executed programs.

Snippets and four-space defaults apply to `.flow` files, not Markdown. Markdown
Flow fences retain their existing highlighting and `use` navigation. There is no
formatter, validation, or binding-aware autocomplete in this version.

## Develop

```sh
npm install
npm test
npm run package
```

Node.js/npm are needed for development and packaging. The installed extension
has no runtime dependencies. VSIX output is created in `dist/`. After a
successful build, the packaging workflow replaces older VSIX files in
`skills/flow/assets/` with the newly built version.
