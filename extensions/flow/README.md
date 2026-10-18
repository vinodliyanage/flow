# Flow

Syntax highlighting, indentation, command snippets, and USE file navigation
for Flow in Cursor and VS Code. The language specification is
`docs/specification.md` at the repository root.
Supports `.flow` files and Markdown `flow` fences. It does not execute, validate,
or format programs.

Commands: `ASK SET DO PRINT CONTEXT USE IF ELSE REPEAT WHILE CONTINUE BREAK RETURN RUN ASYNC AWAIT`.
Bindings use `AS name`; references use `@name.field`; custom commands use
`AS COMMAND NAME`. Blocks use four spaces without colons. CONTEXT/RUN bodies and
`###` comments remain literal; USE-like text inside them creates no file links.
Raw triple-quoted strings (`"""..."""`) preserve multiline text without interpolation,
escapes, comment parsing, or file links.
Declared labels, `@references`, and custom command names have distinct default
colors. Only quoted strings use the same `#98C379` green as the documentation;
literal CONTEXT and RUN bodies keep the editor's normal text color. All defaults
remain overridable by the active theme.

## Install

Run **Extensions: Install from VSIX...** and choose
`skills/flow/assets/flow-0.2.8.vsix` from the repository root, or:

```sh
cursor --install-extension /absolute/path/to/flow/skills/flow/assets/flow-0.2.8.vsix
```

Reload the window if open files have not refreshed. `.flow` uses **Flow** language
mode; Markdown keeps Markdown mode. Command-click (macOS) or Ctrl-click opens USE
references relative to the containing file, including Markdown guidance files.
Colors follow the extension defaults and any user theme overrides.

## Writing a Flow file

In **Flow** language mode, indentation defaults to four spaces. Block
rules indent after headers such as `IF`, `ELSE`, and `REPEAT`. Explicit user or
workspace settings can override these defaults; no settings files are changed.

Type `ASK`, `DO`, `PRINT`, `IF`, or `CONTEXT` and use **Trigger Suggest**, or open
**Insert Snippet** in the Command Palette. Select a template, then press Tab to
move through its editable fields. `PRINT` offers value and prose forms; `IF`
offers one branch or `IF`/`ELSE`. Templates are starting points, not automatically
executed programs.

Snippets and four-space defaults apply to `.flow` files, not Markdown. Markdown
Flow fences retain their existing highlighting and USE navigation. There is no
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
