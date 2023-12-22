#!/bin/bash

webpack_flags=""
ncc_flags="--source-map --no-source-map-register"

if [[ $* == *--package* ]]; then
  webpack_flags="--mode production --devtool hidden-source-map"
  ncc_flags="--minify"
fi

clear_dist() {
  rm -rf ./dist
}

build_extension() {
  echo "Building extension..."
  npx ncc build src/extension.ts $ncc_flags \
    --target es2015 \
    --out dist
  # install wasm files
  node ./tools/install-wasm-deps.js
}

build_language_server() {
  echo "Building language server..."
  npx ncc build src/processes/XsmlLanguageServerMain.ts $ncc_flags \
    --target es2015 \
    --out dist/xsml-language-server
}

build_webviews() {
  echo "Building webviews..."
  npx webpack $webpack_flags
}

clear_dist
build_extension
build_language_server
build_webviews
