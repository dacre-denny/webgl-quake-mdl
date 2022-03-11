const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    mode:'development',
    devtool: 'inline-source-map',
	entry: './src/index.ts',
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'dist')
	},
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader'
            }, 
            {
                test: /\.[fv]s$/i,
                loader: 'raw-loader',
            },
        ]
    },
    devServer: {
        contentBase: path.resolve('data'),
        
    },
    resolve: {
        extensions: [ '.ts', '.tsx', '.js', '.vs' ],
        fallback : {
            buffer: require.resolve('buffer'),
        }
    },
    plugins: [new HtmlWebpackPlugin({
        title : 'webgl-quake-mdl',
        template: 'index.html'
    })]
};