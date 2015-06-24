import React from 'react';
import Router, {Route, NotFoundRoute} from 'react-router';

import Home from './components/App/pages/Home/Home.jsx';
import App from './components/App.jsx';
import NotFound from './components/App/common/NotFound.jsx';

/**
 * The React Routes for both the server and the client.
 */

let Routes = (
	<Route name="app" path="/" handler={App}>
		<Route path="/" handler={Home} />

		<NotFoundRoute handler={NotFound}/>
	</Route>
);

export default Routes;
