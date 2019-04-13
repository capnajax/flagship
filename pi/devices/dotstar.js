"use strict"

const
	SPI = require('pi-spi'),
	powerCap = require('../lib/powerCap');

var spi,
	buf,
	strip;

function init (newStrip) {
	strip = newStrip;
	spi = SPI.initialize("/dev/spidev0.0");
	buf = Buffer.alloc((strip.numLeds+2)*4);
	return Promise.resolve();
}

function sendFrame(frame) { return new Promise((resolve, reject) => {
	
	var adjustedFrame = powerCap(strip.powerSupplyAmps, frame);
	
	// first int is all zeros
	buf.writeUInt32BE(0, 0);
	
	if (frame.colors.length != strip.numLeds) {
		reject("frame length incorrect");
		return;
	}
	
	// frame pixels
	for ( let i = 0; i < strip.numLeds; i++ ) {
		buf.writeInt32BE(frame.colors[i], (i+1)*4);
	}
	
	// last int is all ones
	buf.writeInt32BE(-1, (strip.numLeds+1)*4);

	spi.transfer(buf, buf.length, err => {
		err ? reject(err) : resolve();
	});
})}

function end(cb) {
	
	if (buf) {
		
		buf.writeUInt32BE(0, 0);
		for ( let i = 0; i < strip.numLeds; i++ ) {
			buf.writeUInt32BE(0xE0000000, (i+1)*4);
		}
		buf.writeInt32BE(-1, (strip.numLeds+1)*4);
		spi.transfer(buf, buf.length, () => {
			cb && cb();
		});
		
	} else {
		cb && cb();
	}
}

module.exports = {	
	end: end,
	init: init,
	sendFrame: sendFrame
}
