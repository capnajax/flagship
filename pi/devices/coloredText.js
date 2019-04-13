"use strict"

const
	debug = require("debug")("flagship:coloredText"),
	powerCap = require('../lib/powerCap');
	
var config;

function intToColorString(realPixel, rawPixel) {
	var c = function(rgb) {
				var alpha = rgb >>> 24 & 0x1F,
					cAr = [ rgb & 0xFF,
						    rgb >>> 8 & 0xFF,
						    rgb >>> 16 & 0xFF ]
				for ( let i in cAr ) {
					cAr[i] = cAr[i] * alpha / 31;
				}
				return cAr.join(';');
			},
		result;
	rawPixel || (rawPixel = realPixel);	
	result = realPixel === rawPixel ? ' ' : "\x1b[38;2;"+c(rawPixel)+"m\u00b7";
	result = "\x1b[48;2;"+c(realPixel)+"m"+result+"\x1b[0m";
	return result;
}

function init(newConfig) {
	config = newConfig;
	return Promise.resolve();
}

function sendFrame(frame) {
	var adjustedFrame = powerCap(config.powerSupplyAmps, frame),
		result = '';

	if (frame.colors.length != config.numLeds) {
		// not REALLY an issue for this device, but we want to detect it here anyway.
		debug("frame.length ==", frame.length);
		debug("config.numLeds ==", config.numLeds);
		return Promise.reject("frame length incorrect");
	}

	for (let i in frame.colors) {
		result += intToColorString(adjustedFrame.colors[i], frame.colors[i]);
	}
	
	process.stdout.write('\r'+result);
	return Promise.resolve();
}

function end(cb) {cb && cb();}

module.exports = {
	end: end,
	init: init,
	sendFrame: sendFrame,
	intToColorString: intToColorString
}

