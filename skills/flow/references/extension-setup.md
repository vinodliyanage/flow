# Set up Flow authoring

Use this guide only when the user asks to install or configure Flow editor
support. Installing the extension does not authorize executing a Flow program.

The bundled [Flow 0.2.6 VSIX](../assets/flow-0.2.6.vsix) supports
Cursor and VS Code. It provides syntax highlighting and indentation for `.flow`
files and Markdown `flow` fences, plus navigation for literal `USE` paths. It
does not execute, validate, or format Flow programs and has no runtime
dependencies.

## Install

1. Confirm whether the target is Cursor or VS Code and whether the user wants a
   particular editor profile. Resolve the bundled VSIX to an absolute path.
2. Check the installed version when the editor CLI is available:

   ```sh
   cursor --list-extensions --show-versions
   code --list-extensions --show-versions
   ```

   The extension identifier is `vinodliyanage.flow`. If version `0.2.6` is
   already active, do not reinstall it. Never replace a newer version unless
   the user explicitly requests a downgrade.
3. Install the VSIX using the CLI for the requested editor, passing its absolute
   path as one argument:

   ```sh
   cursor --install-extension /absolute/path/flow-0.2.6.vsix
   code --install-extension /absolute/path/flow-0.2.6.vsix
   ```

   When a named profile is required and the editor supports it, include that
   profile explicitly. Do not change the user's `PATH`, profile, settings, or
   other extensions unless requested.
4. If the editor CLI is unavailable, open the Command Palette, run
   **Extensions: Install from VSIX...**, and select the bundled file. Do not
   download or substitute another extension.
5. Verify `vinodliyanage.flow@0.2.6` in the requested editor/profile. Reload the
   editor window when open files do not refresh.

## Verify authoring support

Open a `.flow` file and confirm its language mode is **Flow**. Verify that known
commands are highlighted and that Command-click on macOS or Ctrl-click on
Windows/Linux opens a literal `USE` target relative to the containing file.
Markdown must remain in Markdown mode while fenced `flow` blocks are highlighted.
Navigation opens referenced files; it never executes them.

If highlighting differs from the defaults, inspect only relevant theme token
overrides. Preserve unrelated editor settings and report whether verification
covered extension registration, tokenization, navigation, or actual rendered
colors.

## Maintain the bundle

The extension source is `extensions/flow` in the Flow repository. Only
when the user asks to develop or rebuild the extension, run its existing
workflow:

```sh
npm install
npm test
npm run package
```

Node.js and npm are development requirements only. A successful package build
removes older VSIX files from `skills/flow/assets/` and copies the newly built
version there. Update the filename and version references in this guide and the
extension documentation when changing the extension version.

The packaging command writes generated VSIX files to `extensions/flow/dist/`;
that directory is ignored by Git and excluded from the packaged extension.

Sources: [Cursor extensions](https://cursor.com/docs/configuration/extensions),
[VS Code VSIX installation](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_install-from-a-vsix),
and [VS Code extension CLI](https://code.visualstudio.com/docs/configure/command-line#_working-with-extensions).
