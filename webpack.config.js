const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin  = require('html-webpack-plugin')
const WebpackAutoInject = require('webpack-auto-inject-version')
const Dotenv = require('dotenv-webpack')
const bodyParser = require('body-parser')

module.exports = {
  entry: './app.js',
  output: {
    filename: 'mkz.js'
  },
  plugins: [
    new UglifyJsPlugin({
      extractComments: {
        condition: /^\**!|@preserve|@license|@cc_on|Copyright|License|LICENSE/i,
        filename(file) {
          return `${file}.LICENSE`;
        },
        banner(licenseFile) {
          return `License information can be found in https://raw.githubusercontent.com/markeaze/markeaze-js-tracker/master/dist/${licenseFile}`;
        }
      },
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
      app.use(bodyParser.json())
      app.use(bodyParser.urlencoded({
        extended: true
      }))
      app.post('*', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*')

        const data = req.body && req.body.data && JSON.parse(req.body.data)
        if (data.type === 'page_view') res.redirect(req.originalUrl)
        else res.json({ status: 'OK' })
      })
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
}
