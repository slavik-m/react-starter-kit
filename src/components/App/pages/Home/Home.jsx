import React, { Component, PropTypes } from 'react';
import Header from './../../common/Header.jsx';
import {Link} from 'react-router';

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<h1>Hello</h1>
		);
	}
}

Home.propTypes = {
	flux: PropTypes.object
};

export default Home;
