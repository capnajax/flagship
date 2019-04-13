"use strict"

// CodeRunner use 'DEBUG=flagship node . --name porch --pattern chase-xmas-0'

const
	debug = require('debug')('flagship'),
	isPi = require('detect-rpi'),
	config = require('./config'),
	patterns = require('./patterns'),
	process = require('process'),
	webservice = require('./webservice'),
	_ = require('lodash');

var strip = null,
	patternName = null,
	device = isPi() ? require('./devices/dotstar') : require('./devices/coloredText'),
	timingPulse;

function sequencePattern(name) {
	var patternSpec = patterns[name];
	console.log("calculating pattern");
	// calculate the pattern
	if (patternSpec) {
		return require(patternSpec.module)(strip, patternSpec.options);	
	} else {
		return null;
	}
}

function startPattern(pattern) {
	// start the sequence
	debug("starting sequence, pattern ==", pattern);
	debug("pattern is", pattern ? "NOT null" : "null");
	debug("pattern.frames is", pattern.frames ? "NOT null" : "null");
	debug("pattern.frames.length is", pattern.frames.length);

	if (!pattern) {
		return;
	}

	endPattern(() => {

		var frameNum = 0;
			
		device.init(strip)
		.then(() => {
			timingPulse = setInterval(() => {

				var frame = pattern.frames[frameNum++ % pattern.frames.length];
				//debug('sending frame:' + JSON.stringify(frame));
				device.sendFrame(frame);
				
			}, strip.framePeriod);
		});

	});

}	

function endPattern(cb) {
	if(timingPulse) {
		clearInterval(timingPulse);
		timingPulse = null;
	}
	device.end(cb);
}

Promise.resolve()
.then(() => {
	
	// process arguments
	
	var errors = [],
		err = message => {
				debug("ERROR:" + message);
				errors.push(message),
				validParams = false;
			},
		exit = () => {
				errors.forEach(err => {
					console.error(err);
				})
				process.exit(1);
			},

		patternName = null,
		i = 2,
		validParams = true;
	
	debug("process.argv ==", process.argv);

	while ( i < process.argv.length ) {		
		
		debug("i ==", i);
		
		switch ( process.argv[i] ) {
		
		case '--name': 
			if ( process.argv.length >= i+2 ) {
				let name = process.argv[++i];
				for (let i in config.strips) {
					if (config.strips[i].name === name) {
						strip = config.strips[i];
					}
					debug("--name", name);
					break;
				}
				if (!strip) {
					err("config strip name \"" + name + "\" not found.");
				}
			} else {
				err("--name requires a name parameter");
			}
			break;
			
		case '--pattern':
			if (process.argv.length >= i+2) {
				let name = process.argv[++i];
				if (_.has(patterns, name)) {
					patternName = name;
					debug("--pattern", name, "i", i);
				} else {
					err("pattern named \"" + name + "\" not found.");
				}
			} else {
				err("--pattern requires a pattern parameter");
			}
			break;
		
		default:
			err("Unknown parameter: " + JSON.stringify(process.argv[i]));
		}
		
		i++;
	}

	if (!strip) {
		err("name parameter required");
	}

	validParams || exit();
	debug("validParams ==", validParams);
	
	return Promise.resolve(patternName);
	
})
.then(patternName => {
	return patternName ? sequencePattern(patternName) : null;
})
.then(pattern => {
	pattern && console.log("no pattern") || console.log("starting pattern");
	pattern && startPattern(pattern) || device.end();
});

//
//	Set up process events
//

process.on('SIGINT', () => {
	
	device.end(() => {
		process.exit(0);
	});
	
});

webservice.on('newpattern', (pattern, cb) => {
	console.log("PATTERN", pattern);
	sequencePattern(pattern)
	.then(startPattern);
});
webservice.on('endpattern', () => {
	console.log("OFF");
	endPattern();
});