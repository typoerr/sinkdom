const path = require('path')
const webpack = require('webpack')
const NotifierPlugin = require('webpack-notifier')

module.exports = env => {
    const file = env && env.file && env.file.split('.')[0] || 'svg'
    return {
        context: path.resolve(__dirname, '../src'),
        entry: `../example/${file}.ts`,
        output: {
            path: path.resolve(__dirname, './'),
            filename: 'index.bundle.js',
        },
        module: {
            rules: [
                {
                    test: /\.(tsx?)$/,
                    exclude: /node_modules/,
                    loader: 'awesome-typescript-loader',
                    options: {
                        useCache: true,
                        configFileName: path.resolve(__dirname, '../example/tsconfig.json'),
                    },
                },
            ],
        },
        plugins: [
            new NotifierPlugin({ title: 'webpack' }),
        ],
        resolve: {
            extensions: ['.js', '.json', '.ts'],
        },
        devtool: 'inline-source-map',
        devServer: {
            contentBase: 'example',
        },
    }
}