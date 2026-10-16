# Set up the Flow extension in Cursor

Use only for requested editor installation or highlighting/icon work. Installing
highlighting does not authorize running a Flow program.

The bundled [Flow Syntax 0.1.11 VSIX](../assets/flow-syntax-0.1.11.vsix) is a
platform-neutral declarative extension. It highlights Markdown `flow` fences
and `.flow` files, with distinct colors for the 17 commands and TRUE/FALSE/NULL values.
It does not execute programs and needs no Node.js runtime. Markdown retains Markdown mode.

## Install

1. Resolve the bundled VSIX to its absolute path. Use the user's requested
   Cursor installation/profile. Respect host permissions; do not change PATH.
2. If Cursor CLI is available, run `cursor --install-extension ABSOLUTE_VSIX`.
   Replace ABSOLUTE_VSIX with one literal argument; use the actual resolved CLI
   path. Use `--force` only for an authorized replacement. Do not downgrade an
   installed newer version without an explicit request.
3. Otherwise use Cursor's **Extensions: Install from VSIX...** and choose the
   bundled asset. Do not fetch an unrelated extension or fabricate success.
4. Verify `inux.flow-syntax@0.1.11` through CLI extension listing or installed
   manifest. Installation metadata may differ from the source manifest.
   Recommend **Developer: Reload Window** if open files have not refreshed.

## Highlighting and icons

Confirm the file language mode and a `flow` fence in Markdown. For color issues,
inspect only relevant `editor.tokenColorCustomizations` rules: existing user
rules can override the extension's defaults. Preserve unrelated theme settings;
report whether you verified registration/tokenization or actual rendered colors.

If file icons are requested and Material Icon Theme is installed, associate
`*.flow` with its existing `flow` icon using
`material-icon-theme.files.associations`. Merge this entry while preserving
existing settings/comments. Confirm the icon asset and generated mapping;
do not silently switch the user's icon theme.

The repository extension source is `extensions/flow-syntax`. When rebuilding
it, refresh the bundled VSIX and this version reference together. The installed
skill uses its own bundled asset and requires no repository checkout.

Sources: [Cursor extension installation](https://cursor.com/docs/configuration/extensions)
and [Material Icon Theme associations](https://github.com/material-extensions/vscode-material-icon-theme#file-icons).
