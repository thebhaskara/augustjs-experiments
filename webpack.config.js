const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    entry: "./example/index.ts",

    devtool: "source-map",

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.html$/i,
                loader: "html-loader",
            },
            {
                test: /\.s[ac]ss$/i,
                use: ["raw-loader", "sass-loader"],
            },
        ],
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },

    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist2"),
        clean: true,
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: "Example app",
            template: "./example/index.html",
        }),
    ],

    optimization: {
        splitChunks: {
            // chunks: "all",
        },
    },
}
