//@ts-check

'use strict';

const webpack = require('webpack');
const path = require('path');

function defaultPostFn(config) {
  return config;
}

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

function baseConfig(name, entry, options = {}, postfn = defaultPostFn) {
  return postfn({
    target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    entry: {
      [name]: entry,
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      libraryTarget: 'commonjs2'
    },
    externals: {
      vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
      // modules added here also need to be added in the .vscodeignore file
    },
    resolve: {
      // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
      extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false
          },
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader'
            }
          ]
        }
      ]
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
      level: 'log', // enables logging required for problem matchers
    },
    ...options,
  });
}

module.exports = [
  baseConfig('scene', './src/views/SceneView/main.ts', {
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'res/js'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  }, (config) => {
    config.resolve.fallback = {
      fs: false,
      os: false,
      buffer: require.resolve('buffer/'),
      assert: require.resolve('assert-browserify'),
      path: require.resolve('path-browserify'),
      vm: false,
      perf_hooks: false,
      util: false,
    };
    return config;
  }),
  baseConfig('inspector', './src/views/InspectorView.tsx', {
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'res/js'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  }),
];
