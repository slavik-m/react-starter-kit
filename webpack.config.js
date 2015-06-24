// jscs:disable disallowQuotedKeysInObjects

'use strict';

var _ = require('lodash');
var webpack = require('webpack');
var argv = require('minimist')(process.argv.slice(2));

var DEBUG = !argv.release;

var GLOBALS = {
	'process.env.NODE_ENV': DEBUG ? '"development"' : '"production"',
	'__DEV__': DEBUG
};

//
// Common configuration chunk to be used for both
// client-side (app.js) and server-side (server.js) bundles
// -----------------------------------------------------------------------------

var config = {
	output: {
		path: './build/',
		publicPath: './public',
		sourcePrefix: '  '
	},

	cache: DEBUG,
	debug: DEBUG,
	devtool: DEBUG ? '#inline-source-map' : false,

	stats: {
		colors: true,
		reasons: DEBUG
	},

	plugins: [
		new webpack.optimize.OccurenceOrderPlugin()
	],

	resolve: {
		extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
	},

	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				loader: 'babel-loader?optional[]=runtime&stage=0'
			}
		]
	}
};

//
// Configuration for the client-side bundle (app.js)
// -----------------------------------------------------------------------------

var appConfig = _.merge({}, config, {
	entry: './src/main.jsx',
	output: {
		filename: './public/js/bundle.js'
	},
	plugins: config.plugins.concat([
			new webpack.DefinePlugin(_.merge(GLOBALS, {'__SERVER__': false}))
		].concat(DEBUG ? [] : [
				new webpack.optimize.DedupePlugin(),
				new webpack.optimize.UglifyJsPlugin(),
				new webpack.optimize.AggressiveMergingPlugin()
			])
	)
});

//
// Configuration for the server-side bundle (server.js)
// -----------------------------------------------------------------------------

var serverConfig = _.merge({}, config, {
	entry: './src/server.jsx',
	output: {
		filename: 'server.js',
		libraryTarget: 'commonjs2'
	},
	target: 'node',
	externals: /^[a-z][a-z\.\-0-9]*$/,
	node: {
		console: false,
		global: false,
		process: false,
		Buffer: false,
		__filename: false,
		__dirname: false
	},
	plugins: config.plugins.concat(
		new webpack.DefinePlugin(_.merge(GLOBALS, {'__SERVER__': true})),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.UglifyJsPlugin(),
		new webpack.optimize.AggressiveMergingPlugin()
	),
	module: {
		loaders: config.module.loaders
	}
});

module.exports = [appConfig, serverConfig];
