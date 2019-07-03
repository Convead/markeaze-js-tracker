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
  ],
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        "style-loader", // creates style nodes from JS strings
        "css-loader", // translates CSS into CommonJS
        "sass-loader" // compiles Sass to CSS, using Node Sass by default
      ]
    },
    {
      test: /\.txt$/,
      use: 'raw-loader'
    },
    {
      test: /\.coffee$/,
      use: [
        {
          loader: 'coffee-loader',
          options: {
            literate: false,
            transpile: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    {
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }]
  },
  optimization: {
    minimize: false,
    sideEffects: false
  },
  devServer: {
    setup(app) {
      app.post('*', (req, res) => {
        // res.redirect(req.originalUrl)
        res.redirect('event.json')
      })
    }
  }
}
