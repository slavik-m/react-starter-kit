/*
 * React.js Starter Kit
 * Copyright (c) 2014 Konstantin Tarkus (@koistya), KriaSoft LLC.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

'use strict';

// Include Gulp and other build automation tools and utilities
// See: https://github.com/gulpjs/gulp/blob/master/docs/API.md
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var concat = require('gulp-concat');
var del = require('del');
var path = require('path');
var runSequence = require('run-sequence');
var webpack = require('webpack');
var argv = require('minimist')(process.argv.slice(2));

// Settings
var RELEASE = !!argv.release;
var AUTOPREFIXER_BROWSERS = [
	'ie >= 10',
	'ie_mob >= 10',
	'ff >= 30',
	'chrome >= 34',
	'safari >= 7',
	'opera >= 23',
	'ios >= 7',
	'android >= 4.4',
	'bb >= 10'
];

var src = {};
var watch = false;
var browserSync;

// The default task
gulp.task('default', ['sync']);

// Clean output directory
gulp.task('clean', del.bind(
	null, ['.tmp', 'build/*', '!build/.git'], {dot: true}
));

// 3rd party libraries
gulp.task('vendor', function () {
	return gulp.src('node_modules/bootstrap/dist/fonts/**')
		.pipe(gulp.dest('build/fonts'));
});

// Static files
gulp.task('assets', function () {
	src.assets = [
		'src/assets/**',
		'src/templates*/**/*.*'
	];
	return gulp.src(src.assets)
		.pipe($.changed('build'))
		.pipe(gulp.dest('build'))
		.pipe($.size({title: 'assets'}));
});

// CSS style sheets
gulp.task('styles', function () {
	src.styles = 'src/styles/**/*.{css,less}';
	return gulp.src('src/styles/bootstrap.less')
		.pipe($.plumber())
		.pipe($.less({
			sourceMap: !RELEASE,
			sourceMapBasepath: __dirname
		}))
		.on('error', console.error.bind(console))
		.pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
		.pipe($.csscomb())
		.pipe($.if(RELEASE, $.minifyCss()))
		.pipe(gulp.dest('build/css'))
		.pipe($.size({title: 'styles'}));
});

gulp.task('react:concat', ['bundle'], function () {
	return gulp.src(['src/global/requires/*.js', 'build/public/js/bundle.js'])
		.pipe(concat('bundle.js'))
		.pipe(gulp.dest('public/js/bundle/'));
});

// Bundle
gulp.task('bundle', function (cb) {
	var started = false;
	var config = require('./webpack.config.js');
	var bundler = webpack(config);

	function bundle(err, stats) {
		if (err) {
			throw new $.util.PluginError('webpack', err);
		}

		if (argv.verbose) {
			$.util.log('[webpack]', stats.toString({colors: true}));
		}

		if (!started) {
			started = true;
			return cb();
		}
	}

	if (watch) {
		bundler.watch(200, bundle);
	} else {
		bundler.run(bundle);
	}
});

// Build the app from source code
gulp.task('build', ['clean'], function (cb) {
	runSequence(['vendor', 'assets', 'styles', 'bundle', 'react:concat'], cb);
});

// Build and start watching for modifications
gulp.task('build:watch', function (cb) {
	watch = true;
	runSequence('build', function () {
		gulp.watch(src.assets, ['assets']);
		gulp.watch(src.styles, ['styles']);
		cb();
	});
});

// Launch a Node.js/Express server
gulp.task('serve', ['build:watch'], function (cb) {
	src.server = [
		'build/server.js',
		'build/templates/**/*'
	];

	var started = false;
	var cp = require('child_process');
	var assign = require('react/lib/Object.assign');

	var server = (function startup() {
		var child = cp.fork('build/server.js', {
			env: assign({NODE_ENV: 'development'}, process.env)
		});
		child.once('message', function (message) {
			if (message.match(/^online$/)) {
				if (browserSync) {
					browserSync.reload();
				}
				if (!started) {
					started = true;
					gulp.watch(src.server, function () {
						$.util.log('Restarting development server.');
						server.kill('SIGTERM');
						server = startup();
					});
					cb();
				}
			}
		});
		return child;
	})();

	process.on('exit', function () {
		server.kill('SIGTERM');
	});
});

// Launch BrowserSync development server
gulp.task('sync', ['serve'], function (cb) {
	browserSync = require('browser-sync');

	browserSync({
		logPrefix: 'RSK',
		notify: false,
		https: false,
		proxy: 'localhost:5000'
	}, cb);

	process.on('exit', function () {
		browserSync.exit();
	});

	gulp.watch(['build/**/*.*'].concat(
		src.server.map(function (file) {
			return '!' + file;
		})
	), function (file) {
		browserSync.reload(path.relative(__dirname, file.path));
	});
});

// Deploy via Git
gulp.task('deploy', function (cb) {
	var push = require('git-push');
	var remote = argv.production ?
		'https://github.com/{user}/{repo}.git' :
		'https://github.com/{user}/{repo}-test.git';
	push('./build', remote, cb);
});
