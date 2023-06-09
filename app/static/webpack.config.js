
const resolve = require('path').resolve;
const HtmlWebpackPlugin = require('html-webpack-plugin')
const config = {
    entry: {
        app: __dirname + '/pages/app.jsx',
    },
    // Where files should be sent once they are bundled
    output: {
        path:resolve('./dist'),
        filename: '[name].bundle.js',
        publicPath: resolve('./dist')
    },

    devtool: 'eval-source-map',
    // Rules of how webpack will take our files, complie & bundle them for the browser
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /nodeModules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env', '@babel/react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
}

module.exports = config;
