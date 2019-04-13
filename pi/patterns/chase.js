
const
	debug = require('debug')('flagship:chase'),
	normalizeColor = require('../lib/normalizeColor'),
	_ = require('lodash');

/**
 * 	@method chase
 *	@param {Object} _strip - properties of the LED strip.
 * 	@param {Number} _strip.numLeds - the number of LEDs in the strip.
 * 	@param {Number} _strip.framePeriod - an ideal frame period for the LED strip.
 * 	@param {Object} _options - options for this chase pattern.
 * 	@param {Array} _options.colors - list of colours to chase in the pattern. 
 *			Colours have four properties: red, green, and blue range from
 *			0 to 255, alpha ranges from 0 to 31. Default colours are zero, alpha
 *			defaults to 31. Values can be expressed as [red, green, blue],
 *			[alpha, red, green, blue], or an object with the components listed.
 * 	@param {Number} [_options.framePeriod=50], how long each frame is in 
 * 			milliseconds. The inverse of frame rate.
 *	@param {String} [_options.direction=1] - 1 or -1.
 * 	@param {Array} _options.phases - sequence of phases for the chase
 * 	@param {Number} _options.phases[n].length - how long this phase lasts
 * 	@param {Number, Object} [_options.phases[n].randomness=0.0] - how much to
 *			randomize the sequence. Number between 0.0 and 1.0. If this is 
 *			expressed as an object, it defines a linear progression
 *			from `start` to `end` during the length of the phase
 * 	@param {Boolean} [_options.phase[n].reverse=false] set to true to reverse
 *			the direction of the chase.
 *	@return {Object}
 */
module.exports = function chase(_strip, _options) {

	var result = {
			numLeds: _strip.numLeds,
			frames: [] // array of frames sorted by start time. Each frame has
					   // an end time and an array of colour numbers
		},
		direction = (() => {
				var direction;
				if (_.has(_options, 'direction')) {
					switch(_options.direction) {
					case 'ltr':
						direction = 1;
						break;
					case 'rtl':
						direction = -1;
						break;
					default:
						throw "Direction " + JSON.stringify(_options.direction + " invalid.");
					}
				} else {
					direction = 1
				}
				return direction;
				debug("direction ==", direction);
			})(),
		colors = (() => {
				var result = [];
				debug("_options:");
				debug(_options);
				debug("_options.colors:");
				debug(_options.colors);
				for (let i in _options.colors) {
					debug("_options.colors[i] ==", _options.colors[i]);
					result.push(normalizeColor(_options.colors[i]));
				}
				debug("colors ==", result);
				return result;
			})(),
		phases = (() => {
				// phases is an array of objects, each with the following
				//		properties:
				// 	end - the end time of the phase
				// 	direction (1 or -1) - the direction to move the chase flow
				// 	randomize (false or an object with start and end) - how
				//		much to randomize each pixel.
				// 		The randomness follows a linear progression
				//		between the start and end value over the duration of
				//		the phase.
				//	algorithm how to randomize the pixels. Supported algorithms are:
				//		curve - moves pixels along a bell curve, the randomization
				//			value is a the standard deviation.
				// 		glitch (default) - randomly selects a colour from the pattern for
				//			randomized pixels. The randomization value is the probability
				//			a pixel will be randomized.

				var testRandomize = (_v) => {
							if (!_.isNumber(_v) || _v < 0.0 || _v > 1.0) {
								throw "Invalid value for randommess: " + JSON.stringify(_v);
							}
							return _v;
						},
					result = [],
					length = 0;
				debug("_options.chase.phases ==", _options.chase.phases);
				for (let i in _options.chase.phases) {
					let opi = _options.chase.phases[i];
						p = {};
					if (!_.has(opi, 'length') || !_.isNumber(opi.length) || opi.length < 0) {
						throw "Invalid length on phase " + JSON.stringify(opi);
					}
					if (opi.length == 0) {
						continue;
					}
					length += opi.length;
					p.end = length;
					if (opi.reverse) {
						if (_.isBoolean(opi.reverse)) {
							p.direction = direction * (opi.reverse ? -1 : 1);
						} else {
							throw "Reverse value must be boolean for phase " + JSON.stringify(opi);
						}
					} else {
						p.direction = direction;
					}
					if (_.has(opi, 'randomness')) {
						if (_.isObject(opi.randomness)) {
							if (_.has(opi.randomness, "start") && _.has(opi.randomness, "end")) {
								p.randomize = {
										start: testRandomize(opi.randomness.start), 
										end:   testRandomize(opi.randomness.end  )
									};
							} else {
								throw "Invalid object for randommess: " + JSON.stringify(opi.randomness);
							}
						} else {
							p.randomize = { start: testRandomize(opi.randomness), end: testRandomize(opi.randomness)}
						}
					} else {
						p.randomize = false;
					}
					result.push(p);
				}

				debug('phases ==', result);
				return result;
			})(),
		lastFrame = (() => { // the previous ideal frame
				debug("Calculating first lastFrame");
				var startOffset = direction * (phases[0].direction || 1),
					result = {
						end: 0,
//						colors: = new Array(_strip.numLeds),
						offset: startOffset
					};
//				for (let i = 0; i < _strip.numLeds; i++) {
//					result.colors[i] = colors[(i + startOffset) % colors.length];
//				}
				return result;
			})(),
		idealFrame, // the current minus any randomization
		currentFrame; // the current frame after randomization

	for (let i in phases) {

		debug("calculating phase", i);

		let movement = (phases[i].direction || 1);
		
		while (lastFrame.end < phases[i].end) {
			
			debug("calculating frame");
			debug("phases["+i+"].end:", phases[i].end, "lastFrame.end:", lastFrame.end);
			
			idealFrame = {
					end: lastFrame.end + _strip.framePeriod,
					colors: new Array(_strip.numLeds),
					offset: lastFrame.offset + movement
				};
			for ( let j = 0; j < _strip.numLeds; j++ ) {
				idealFrame.colors[j] = colors[(j + idealFrame.offset) % colors.length]
			}
			lastFrame = idealFrame;
			currentFrame = {
				end: idealFrame.end,
				colors: _.clone(idealFrame.colors)
			}

			// now apply randomizations to current frame
			if (phases[i].randomize) {
				
				debug("randomizing");
				
				let startTime = i > 0 ? 1.0 * phases[i-1].end : 0.0,
					endTime = 1.0 * phases[i].end,
					phaseProgress = (lastFrame.end - startTime) / (endTime - startTime),
					// for convenience
					r = phases[i].randomize,
					// how much to randomize by
					randomization = r.start + (phaseProgress * (r.end - r.start));
				
				switch (r.algorithm || 'glitch') {
				case 'glitch':
					for (let j in currentFrame.colors) {
						if (Math.random() < randomization) {
							currentFrame.colors[j] = colors[
									Math.floor(Math.random() * colors.length)
								];
						}
					}
					break;
				case 'curve':
					// TODO how to do gaussian distribution?
					break;
				default:
					// TODO internal error -- bad configuraiton
					break;
				}
			}
			
			result.frames.push(currentFrame);
		}

	}
	
	debug("Pattern returned:", result);
	debug("Pattern frames returned:", result.frames.length);
	return Promise.resolve(result);

}

