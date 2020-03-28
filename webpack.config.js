const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    // mode: 'production',
    mode: 'development',
    watch: true,
    entry: './src/index.js',
    output: {
        filename: 'August.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'August',
        libraryTarget: 'umd',
    },
    module: {
        rules: [{
            test: /\.js/,
            exclude: /(node_modules|bower_components)/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: ["@babel/preset-env"],
                    plugins: [
                        ["@babel/plugin-proposal-class-properties"]
                    ],
                }
            }]
        }]
    },
    plugins: [
        // new CleanWebpackPlugin(['dist/*']) for < v2 versions of CleanWebpackPlugin
        new CleanWebpackPlugin(),
    ],
};
