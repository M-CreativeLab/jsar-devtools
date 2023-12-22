const { exec } = require('node:child_process');
const fs = require('node:fs');

let nccFlags = '--source-map --no-source-map-register';
if (process.argv.includes('--package')) {
  nccFlags = '--minify';
}

function clearDist() {
  try {
    fs.rmSync('./dist', { recursive: true, force: true });
  } catch (err) {
    // Handle error if the 'dist' directory doesn't exist
  }
}

async function shell(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function buildExtension() {
  console.log('Building extension...');
  await shell(
    `npx ncc build src/extension.ts ${nccFlags} --target es2015 --out dist`
  );
  // Install wasm files
  await shell('node ./tools/install-wasm-deps.js');
}

async function buildLanguageServer() {
  console.log('Building language server...');
  await shell(
    `npx ncc build src/processes/XsmlLanguageServerMain.ts ${nccFlags} --target es2015 --out dist/xsml-language-server`
  );
}

async function buildWebviews() {
  console.log('Building webviews...');
  await shell(`npx rspack build`);
}

const now = performance.now();
clearDist();
Promise.all([
  buildExtension(),
  buildLanguageServer(),
  buildWebviews()
]).then(() => {
  console.log(`Compilation completed (takes ${performance.now() - now}).`);
});
