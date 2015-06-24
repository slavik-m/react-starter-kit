import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import express from 'express';
import serveStatic from 'serve-static';

import React from 'react';
import Router from 'react-router';

import routes from './routes.jsx';

import compress from 'compression';

let server = express();

server.set('port', (process.env.PORT || 5000));
server.use(compress());
server.use(serveStatic(__dirname + '/public'));

/**
 * Server-side rendering
 */
let allowedPathes = [
	/\/js/,
	/img/,
	/\/css/,
	/favicon.ico/
];

// The top-level React component + HTML template for it
var templateFile = path.join(__dirname, 'templates/index.html');
var template = _.template(fs.readFileSync(templateFile, 'utf8'));

server.get('*', (req, res, next) => {
	Router.run(routes, req.path, function (Handler) {
		for (let i = 0; i < allowedPathes.length; i++) {
			if (allowedPathes[i].test(req.path)) {
				next();
			}
		}
		let markup = React.renderToString(React.createElement(Handler));
		let html = template({title: 'React Starter 4 Vetalik', body: markup});
		res.send(html);
	});
});

server.listen(server.get('port'), () => {
	if (process.send) {
		process.send('online');
	} else {
		console.log('The server is running at http://localhost:' +
		server.get('port'));
	}
});
