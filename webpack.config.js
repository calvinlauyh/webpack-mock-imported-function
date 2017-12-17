'use strict';
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: ["import_function", "import_default_module", "import_whole_module"].reduce((accu, module) => {
    accu[module] = path.resolve(__dirname, `./test/${module}.js`);
    return accu;
  }, {}),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
    ],
    extensions: ['.js']
  }
};
