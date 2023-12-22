const fs = require('fs');
const path = require('path');

function installPackageWasm(name, wamsFilenames) {
  const packagePath = path.dirname(require.resolve(name));
  for (const wasmFilename of wamsFilenames) {
    fs.copyFileSync(path.join(packagePath, wasmFilename), path.join(__dirname, '../dist/', wasmFilename));
  }
}

installPackageWasm('draco3dgltf', [
  'draco_decoder_gltf.wasm',
  'draco_encoder.wasm',
]);
