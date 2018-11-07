const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
module.exports = {
  entry: './app.js',
  output: {
    filename: 'mkz.js'
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        output: {
          comments: false
        }
      }
    })
  ]
};