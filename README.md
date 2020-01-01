# Flagship

This is an IoT project meant to put lights on my house. Using a white strip of Dotstar lights, I would get a set of lights that are nearly invisible when off, but when on I could create spectacular patterns. For Christmas, I could have a set of christmas colour patterns, for the Fourth of July, I could make a one-dimensional video of a flag waving, etc, and these would all be controlled by a web service so I could change the pattern without going outside.

## Hardware

This was designed to use a Raspberry Pi Zero W to control it, with a strip of DotStar LEDs hooked up to the Pi's GPIO pins. 

It's very important that the power for the Dotstar strip is NOT supplied by the Pi. It can't supply enough.

## Software

### pi

This is an express app that runs on the Raspberry PI itself.

### converter

This program converts videos to one-dimensional videos for the LED strip.

