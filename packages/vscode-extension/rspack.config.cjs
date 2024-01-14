/** @type {import('@rspack/cli').Configuration} */
module.exports = {
  mode: 'development',
  entry: {
    scene: './src/views/SceneView/main.ts',
    console: './src/views/ConsoleView/main.tsx',
    inspector: './src/views/InspectorView/main.tsx',
    'xr-emulator': './src/views/XREmulatorView/main.tsx',
  },
  output: {
    path: 'res/js',
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
        ],
        resolve: {
          preferRelative: true,
        },
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        },
      },
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          sourceMap: true,
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      }
    ]
  },
  experiments: {
    css: false,
  },
};
