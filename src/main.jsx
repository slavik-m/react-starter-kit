import React from 'react';
import Router from 'react-router';

import routes from './routes.jsx';

/**
 * Run React Router.
 */

Router.run(routes, Router.HistoryLocation, function (Handler) {
	React.render(<Handler/>, document.getElementById('app'));
});
