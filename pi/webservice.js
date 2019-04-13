const
	config = require('./config'),
	express = require('express'),
	patterns = require('./patterns'),
	_ = require('lodash');

var app = express();

app.get('/pattern/:name', (req, res) => {

	if (_.has(patterns, req.params.name)) {
		app.emit('newpattern', req.params.name);
		res.sendStatus(202);	
	} else {
		res.sendStatus(404);
	}
	
});

app.get('/off', (req, res) => {
	
	app.emit('endpattern');
	res.sendStatus(202);
	
});

app.listen(config.service.port, props => {
	console.log("listening", props);
});

module.exports = app;
