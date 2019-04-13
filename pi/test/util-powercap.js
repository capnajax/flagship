"use strict"

const 
	powerCap = require('../lib/powerCap'),
	//debug = require('debug')('flagship:test:powerCap'),
	expect = require('chai').expect,
	_ = require('lodash');

describe("Power Cap", function() {
	
	var testFramePower = function testFramePower(frame) {
		expect(frame).to.have.property('power');
		expect(frame.power).to.be.an('object');
		if (_.has(frame.power, 'exceedBy')) {
			expect(frame.power.requested).to.be.above(frame.power.actual);
			expect(frame.power.requested).to.be.above(frame.power.threshold);		
			expect(frame.power.requested - frame.power.exceedBy).to.be.least(frame.power.actual);
			// test we got close	
			expect(frame.power.threshold * 0.9).to.be.below(frame.power.actual);	
		} else {
			expect(frame.power.requested).to.be.equal(frame.power.actual);		
			expect(frame.power.requested).to.be.most(frame.power.threshold);		
		}
	};
	
	it("should permit acceptable loads with alpha 1F", function() {
		
		var frame = {
				end: 30,
				colors: [0xFF808080, 0xFF808080, 0xFF808080, 0xFF808080]
			}
		powerCap(0.150, frame);
		testFramePower(frame);
		expect(frame.power).to.not.have.property('exceedBy');
	});
	
	it("should permit acceptable loads with alpha 10", function() {
		
		var frame = {
				end: 30,
				colors: [0xF0FFFFFF, 0xF0FFFFFF, 0xF0FFFFFF, 0xF0FFFFFF]
			}
		powerCap(0.150, frame);
		testFramePower(frame);
		expect(frame.power).to.not.have.property('exceedBy');
	});
	
	it("should adjust unacceptable loads with alpha 1F", function() {
		var frame = {
				end: 30,
				colors: [0xFF202020, 0xFF606060, 0xFFA0A0A0, 0xFFE0E0E0]
			}
		powerCap(0.100, frame);
		testFramePower(frame);
		expect(frame.power).to.have.property('exceedBy');
	});
	
	it("should adjust unacceptable loads with alpha 1F, uniform pixels", function() {
		var frame = {
				end: 30,
				colors: [0xFF808080, 0xFF808080, 0xFF808080, 0xFF808080]
			}
		powerCap(0.100, frame);
		testFramePower(frame);
		expect(frame.power).to.have.property('exceedBy');
	});
	
	it("should adjust unacceptable loads with alpha 10, uniform pixels", function() {
		var frame = {
				end: 30,
				colors: [0xF0808080, 0xF0808080, 0xF0808080, 0xF0808080]
			}
		powerCap(0.050, frame);
		testFramePower(frame);
		expect(frame.power).to.have.property('exceedBy');
	});
	
	it("should handle loads with alpha 1F, 100 test with 100 random pixels", function() {
		var frame = {
				end: 30,
				colors: []
			}
		for (let i = 0; i < 100; i++) {
			for (let j = 0; j < 100; j++) {
				frame.colors[j] = 0xFF << 24 | Math.floor(Math.random() * 0x1000000);
			}
			powerCap(3, frame);
			testFramePower(frame);
		}
	});
	
	it("should handle loads with random alpha, 100 test with 100 random pixels", function() {
		var frame = {
				end: 30,
				colors: []
			}
		for (let i = 0; i < 100; i++) {
			for (let j = 0; j < 100; j++) {
				let alpha = Math.floor(Math.random() * 0x20) | 0xE0;
				frame.colors[j] = alpha << 24 | Math.floor(Math.random() * 0x1000000);
			}
			powerCap(1.5, frame);
			testFramePower(frame);
		}
	});
	
});