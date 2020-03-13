const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin  = require('html-webpack-plugin')
const WebpackAutoInject = require('webpack-auto-inject-version')
const Dotenv = require('dotenv-webpack')

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
    }),
    new Dotenv({
      path: './.env',
      safe: true,
      systemvars: true,
      silent: true,
      defaults: false
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './index.html',
      inject: false
    }),
    new HtmlWebpackPlugin({
      filename: 'demo_data.html',
      template: './demo_data.html',
      inject: false
    }),
    new WebpackAutoInject({
      components: {
        AutoIncreaseVersion: false,
        InjectAsComment: false
      }
    })
  ],
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        'style-loader', // creates style nodes from JS strings
        'css-loader', // translates CSS into CommonJS
        'sass-loader' // compiles Sass to CSS, using Node Sass by default
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
    minimize: true,
    sideEffects: false
  },
  devServer: {
    port: 8084,
    before(app) {
      app.post('*', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.redirect(req.originalUrl)
      })
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}
