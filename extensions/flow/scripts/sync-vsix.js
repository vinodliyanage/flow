const fs = require('node:fs');
const path = require('node:path');

const extensionRoot = path.resolve(__dirname, '..');
const manifest = require(path.join(extensionRoot, 'package.json'));
const filename = `${manifest.name}-${manifest.version}.vsix`;
const builtVsix = path.join(extensionRoot, 'dist', filename);
const assetsDirectory = path.resolve(extensionRoot, '../../skills/flow/assets');

if (!fs.existsSync(builtVsix)) {
  throw new Error(`Built VSIX not found: ${builtVsix}`);
}

fs.mkdirSync(assetsDirectory, { recursive: true });
for (const asset of fs.readdirSync(assetsDirectory)) {
  if (asset.endsWith('.vsix')) {
    fs.unlinkSync(path.join(assetsDirectory, asset));
  }
}

fs.copyFileSync(builtVsix, path.join(assetsDirectory, filename));
console.log(`Bundled ${filename} as the only VSIX in skills/flow/assets/.`);
