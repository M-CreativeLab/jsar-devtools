/** @type {import('@rspack/cli').Configuration} */
module.exports = {
  mode: 'development',
  entry: {
    scene: './src/views/SceneView/main.ts',
    inspector: './src/views/InspectorView/main.tsx',
  },
  output: {
    path: 'res/js',
    filename: '[name].js',
    libraryTarget: 'commonjs2',
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
  }
};
