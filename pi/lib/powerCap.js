
// CodeRunner: cd ..; DEBUG=flagship:powerCap mocha
const 
	debug = require('debug')('flagship:powerCap'),

	AMPS_BLUE = 0.02,
	AMPS_RED  = 0.02,
	AMPS_GREEN = 0.02;

/**
 *	@method powerCap
 *	Test if a frame's power consumption is below a given threshold. If it is,
 * 	it'll change the frame to something below the power threshold by limiting
 * 	the brightest pixels. It's assumed each pixel consumes 20 amps per pixel
 * 	when at maximum brightness. Changes frame in-place, but also returns the
 *	modified frame.
 *	@param {number} threshold the maximum amps available.
 * 	@param {Object} frame - the frame to test.
 * 	@return {Object} returns the frame with a few modifications: (a) adds a 
 * 		`power` object with the properties: 
 *			`requested` amps requested by frame,
 * 			`actual` amps needed after the frame has been modified to fit threshold, 
 *				if necessary, and
 *			`exceedBy` only provided if the threshold is exceeded.
 */
function powerCap(threshold, frame) {
	
	var amps = 0,
		perPixelPower = new Array(frame.colors.length),
		powerObj = {},
		
		calculatePixel = (p) => {
				let multiplier = (p >>> 24 & 0x1F) / ( 31.0 * 255.0 ),
					ppi = 0; // for perPixelPower[i]
				ppi += AMPS_RED * (p >>> 16 & 0xFF );
				ppi += AMPS_GREEN * (p >>> 8 & 0xFF );
				ppi += AMPS_BLUE * (p & 0xFF );
				return ppi * multiplier;				
			};
	
	for (let i in frame.colors) {
		let ppi = calculatePixel(frame.colors[i]);
		perPixelPower[i] = ppi;
		amps += ppi;
		//debug("ppi:", ppi, "amps:", amps);
	}
	
	powerObj.requested = amps;
	powerObj.threshold = threshold;
	
	if (amps < threshold) {
		powerObj.actual = amps;		
	} else {
		powerObj.exceedBy = amps - threshold;
		
		// we have to cut off the top consuming pixels
		let sortedPixels = perPixelPower.slice().sort(),
			cutoff = 0,
			runningTotalPower = 0;
			
		// in order of dimmest to brightest pixels, add up the power consumption if all pixels
		// were cut off at that pixel's brightness, until the threshold is reached.
		for ( let i = 0; i < sortedPixels.length; i++ ) {
			if (i > 0 && sortedPixels[i] === sortedPixels[i-1]) {
				// we can skip this calculation
				continue;
			} 
			thisPixelPower = (sortedPixels[i] - (i > 0 ? sortedPixels[i-1] : 0)) * (sortedPixels.length - i);
			//debug("thisPixelPower:", thisPixelPower, "runningTotalPower", runningTotalPower);
			if (runningTotalPower + thisPixelPower > threshold) {
				cutoff = (i > 0 ? sortedPixels[i-1] : 0) + (threshold - runningTotalPower) / ( sortedPixels.length - i);
				break;
			} else {
				runningTotalPower += thisPixelPower;
			}
		}

		//debug("cutoff:", cutoff);

		// now that the cutoff has been found, dim the necessary pixels
		for ( let i in perPixelPower) {
			let alpha = (frame.colors[i] >>> 24 & 0x1F);
			if (perPixelPower[i] > cutoff) {
				let	perAlphaUnitPower = perPixelPower[i] / alpha,
					correctedAlpha = alpha - Math.ceil((perPixelPower[i] - cutoff) / perAlphaUnitPower);
				//debug("cutoff:", cutoff, "perPixelPower[i]", perPixelPower[i], "perAlphaUnitPower:", perAlphaUnitPower, "correctedAlpha:", correctedAlpha)
				frame.colors[i] |= 0x1F << 24;
				frame.colors[i] &= (0xE0 | correctedAlpha) << 24 | 0xFFFFFF;
			} else {
				//debug("cutoff:", cutoff, "perPixelPower[i]", perPixelPower[i]);
			}
		}
		
		// get the corrected total power now
		totalPower = 0.0
		for (let i in frame.colors) {
			let ppi = calculatePixel(frame.colors[i]);
			perPixelPower[i] = ppi;
			totalPower += ppi;
			//debug("ppi:", ppi, "totalPower:", totalPower);
		}
		powerObj.actual = totalPower;	
	}
	
	debug(powerObj);
	
	frame.power = powerObj;
	return frame;		
}

module.exports = powerCap;
