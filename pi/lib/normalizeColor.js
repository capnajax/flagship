const
	_ = require('lodash');

/**
 *	Normalize colors to an int
 * 	@param {Array|Object} Colours have four properties: red, green, and blue range from
 *			0 to 255, alpha ranges from 0 to 31. Default colours are zero, alpha
 *			defaults to 31. Values can be expressed as [red, green, blue],
 *			[alpha, red, green, blue], or an object with the components listed.
 */
function normalizeColor(_color) {

	var result = 0xE0000000;
	if(_.isArray(_color)) {
		for (let i in _color) {
			if (!_.isNumber(_color[i]) || _color[i] < 0 || _color[i] > 255) {
				throw "invalid color " + JSON.stringify(_color) + ": must be numbers 0-255";
			}
		}
		switch(_color.length) {
		case 3:
			result = _color[0] << 16 | _color[1] << 8 | _color[2];
			break;
		case 4:
			if (_color[0] > 31) {
				throw "invalid color " + JSON.stringify(_color) + ": alpha be numbers 0-31";
			}
			result = (0xE0 | _color[0]) << 24 | _color[1] << 16 | _color[2] << 8 | _color[3];
			break;
		default:
			throw "invalid color " + JSON.stringify(_color);
		}
		return result;
	} else if (_.isObject(_color)) {
		let channel = (_name, _range, _default) => {
				var result = _default;
				if (_.has(_color, _name)) {
					result = _color[_name];
					if(!_.isNumber(result) || result < 0 || result > _range) {
						throw "invalid color for", _name, JSON.stringify(_color) + ": " +
							_name + "must be numbers 0-" + _range;
					}
				}
				return result;
			},
			channels = [
				channel('alpha', 0x1F, 0x1F),
				channel('blue', 0xFF, 0),
				channel('green', 0xFF, 0),
				channel('red', 0xFF, 0)
			];
		return normalizeColor(channels);
	}
}

module.exports = normalizeColor;