const path = require('node:path');

function scanTripleQuotes(line, open = false) {
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    if (open) {
      if (line.startsWith('"""', index)) {
        open = false;
        index += 2;
      }
    } else if (quoted) {
      if (line[index] === '\\') index++;
      else if (line[index] === '"') quoted = false;
    } else if (line.startsWith('"""', index)) {
      open = true;
      index += 2;
    } else if (line[index] === '"') quoted = true;
  }
  return open;
}

function findUseReferences(text, markdown = false) {
  const references = [];
  let fence = null;
  let literal = null;
  let continuation = null;
  let comment = false;
  let triple = false;

  for (const [lineNumber, original] of text.split(/\r?\n/).entries()) {
    let line = original;
    let offset = 0;
    if (markdown) {
      const marker = original.match(/^( *)(`{3,}|~{3,})(.*)$/);
      if (!fence) {
        if (marker) fence = { character: marker[2][0], length: marker[2].length,
          indent: marker[1].length, flow: /^flow$/i.test(marker[3].trim()) };
        literal = null;
        continuation = null;
        comment = false;
        triple = false;
        continue;
      }
      if (marker && marker[2][0] === fence.character &&
          marker[2].length >= fence.length && !marker[3].trim() &&
          marker[1].length <= fence.indent + 3) {
        fence = null;
        continue;
      }
      if (!fence.flow) continue;
      offset = Math.min(fence.indent, original.match(/^ */)[0].length);
      line = original.slice(offset);
    }

    const indent = line.match(/^ */)[0].length;
    if (literal) {
      if (literal.command === 'CONTEXT') {
        if (indent === literal.indent && /^ *AS +[a-z][a-z0-9_]* *$/.test(line)) {
          literal = null;
        }
        continue;
      }
      if (!line.trim() || indent >= literal.indent + 4) continue;
      literal = null;
    }
    if (triple) {
      triple = scanTripleQuotes(line, true);
      continue;
    }
    if (continuation !== null) {
      if (line.trim() && indent === continuation + 4) {
        triple = scanTripleQuotes(line);
        continue;
      }
      continuation = null;
    }
    if (/^ *### *$/.test(line)) {
      comment = !comment;
      continue;
    }
    if (comment || /^ *#/.test(line)) continue;
    const block = line.match(/^ *(CONTEXT|RUN)\b/);
    if (block) {
      literal = { command: block[1], indent };
      continue;
    }
    if (/^ *(?:DO|PRINT) +\S/.test(line)) {
      continuation = indent;
      triple = scanTripleQuotes(line);
      continue;
    }

    const flow = line.match(/^( *USE +)(.+\.flow) *$/);
    const guidance = line.match(/^( *USE +)(.+?\.md)(#[^\r\n]+?)? +AS +[a-z][a-z0-9_]* *$/);
    const use = flow || guidance;
    if (!use) {
      triple = scanTripleQuotes(line);
      continue;
    }
    const filename = use[2];
    const fragment = guidance && !flow && use[3] ? use[3].slice(1) : undefined;
    references.push({ line: lineNumber, start: offset + use[1].length,
      end: offset + use[1].length + filename.length + (fragment ? fragment.length + 1 : 0),
      filename, ...(fragment ? { fragment } : {}) });
  }
  return references;
}

function activate(context) {
  const vscode = require('vscode');
  context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(
    [{ language: 'flow' }, { language: 'markdown' }],
    {
      provideDocumentLinks(document) {
        if (document.isUntitled) return [];
        return findUseReferences(document.getText(), document.languageId === 'markdown')
          .map(reference => {
            const targetPath = path.resolve(path.dirname(document.uri.fsPath), reference.filename);
            const target = document.uri.with({ path: vscode.Uri.file(targetPath).path,
              fragment: reference.fragment || '' });
            const range = new vscode.Range(reference.line, reference.start,
              reference.line, reference.end);
            const link = new vscode.DocumentLink(range, target);
            link.tooltip = 'Open ' + reference.filename + (reference.fragment ? '#' + reference.fragment : '');
            return link;
          });
      }
    }
  ));
}

module.exports = { activate, findUseReferences };
