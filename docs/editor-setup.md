---
description: Install Flow highlighting, indentation, and USE navigation in Cursor or VS Code using the bundled editor extension.
---

# Editor setup

The optional Flow extension provides syntax highlighting, indentation, and
navigation to literal `USE` targets in Cursor and VS Code. It supports `.flow`
files and fenced `flow` blocks in Markdown. It does not execute, validate, or
format programs.

## Install the bundled extension

First [install the Flow skill](quick-start.md#_1-install-flow). The skill includes
the extension package in its `assets` directory. Ask your agent to install it
for the editor you use:

```text
Use the Flow skill to set up syntax highlighting and USE navigation in Cursor.
```

Replace Cursor with VS Code if appropriate. The skill's setup guide locates
the bundled VSIX, checks the editor, installs it, and verifies registration.

For manual installation, locate `assets/flow-0.2.7.vsix` inside the installed
Flow skill. In your editor, open the Command Palette, run
**Extensions: Install from VSIX...**, and select that file. Reload the window
if already-open files have not refreshed.

With the appropriate editor CLI available, you can also pass the installed
package's absolute path:

```sh
cursor --install-extension /absolute/path/to/installed/flow/assets/flow-0.2.7.vsix
```

```sh
code --install-extension /absolute/path/to/installed/flow/assets/flow-0.2.7.vsix
```

These are installation instructions, not commands executed by this guide.
The extension identifier is `vinodliyanage.flow`; this bundle's version is
`0.2.7`. Its version describes the editor package, not a language version.

## Check authoring support

Open a `.flow` file and check that its language mode is **Flow**. Open a
Markdown file and keep its language mode as **Markdown**; `flow` fences are
highlighted within it.

Command-click on macOS, or Ctrl-click on Windows/Linux, follows a literal
`USE` target relative to the containing file. Navigation opens the target;
it does not execute it. Colors may differ when your theme overrides token styles.

## Run a program

Execution comes from an agent that has loaded the Flow interpreter, rather than
the extension. Follow [your first program](quick-start.md) to make that contract
available and request a run.
