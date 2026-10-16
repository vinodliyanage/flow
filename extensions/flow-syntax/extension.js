const path = require('node:path');

function findUseReferences(text, markdown = false) {
  const references = [];
  let fence = null;
  let codeFence = null;
  let rawIndent = null;
  let printIndent = null;

  for (const [lineNumber, line] of text.split(/\r?\n/).entries()) {
    const marker = line.match(/^[ \t]*(`{3,}|~{3,})(.*)$/);
    if (markdown) {
      if (!fence) {
        if (marker) {
          fence = { character: marker[1][0], length: marker[1].length,
            flow: /^flow$/i.test(marker[2].trim()) };
        }
        continue;
      }
      if (marker && marker[1][0] === fence.character &&
          marker[1].length >= fence.length && !marker[2].trim()) {
        fence = null;
        codeFence = null;
        rawIndent = null;
        printIndent = null;
        continue;
      }
      if (!fence.flow) continue;
    }

    if (rawIndent !== null) {
      if (line === ' '.repeat(rawIndent) + '"""') rawIndent = null;
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (printIndent !== null) {
      if (!line.trim() || indent > printIndent) continue;
      printIndent = null;
    }
    if (codeFence) {
      if (marker && marker[1] === codeFence && !marker[2].trim()) codeFence = null;
      continue;
    }
    if (marker && /^(js|javascript)$/i.test(marker[2].trim())) {
      codeFence = marker[1];
      continue;
    }
    if (/^[ ]*SET[ \t]+[a-z][a-z0-9_]*[ \t]*=[ \t]*"""[ \t]*$/.test(line)) {
      rawIndent = indent;
      continue;
    }
    if (/^[ ]*PRINT[ \t]*$/.test(line)) {
      printIndent = indent;
      continue;
    }
    const use = line.match(/^([ \t]*USE[ \t]+)(.+?\.flow)[ \t]*$/);
    if (use) references.push({ line: lineNumber, start: use[1].length,
      end: use[1].length + use[2].length, filename: use[2] });
  }
  return references;
}

function activate(context) {
  const vscode = require('vscode');
  context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(
    [{ language: 'inux-flow' }, { language: 'markdown' }],
    {
      provideDocumentLinks(document) {
        if (document.isUntitled) return [];
        return findUseReferences(document.getText(), document.languageId === 'markdown')
          .map(reference => {
            const targetPath = path.resolve(path.dirname(document.uri.fsPath), reference.filename);
            const target = document.uri.with({ path: vscode.Uri.file(targetPath).path });
            const range = new vscode.Range(reference.line, reference.start,
              reference.line, reference.end);
            const link = new vscode.DocumentLink(range, target);
            link.tooltip = 'Open ' + reference.filename;
            return link;
          });
      }
    }
  ));
}

module.exports = { activate, findUseReferences };
