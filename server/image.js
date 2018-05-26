const fs = require('fs');
const jpeg = require('jpeg-js');
const size = 400;
const frameData = Buffer.alloc(size * size * 4);

function createImage(t, s, dx, dy, callback) {
	let x = 0;
	let y = 0;
	for (let i = 0, c = frameData.length; i < c; i+=4) {
		x = (i / 4) % size + 1;
		if ((i / 4) % size === 0) { y++; }
		const p = shader({ x: x / size, y: y / size }, norm(t), norm(s), norm(dx), norm(dy));
		frameData[i] = p;
		frameData[i + 1] = p;
		frameData[i + 2] = p;
		frameData[i + 3] = 0xff;
	}

	const jpegImageData = jpeg.encode({ data: frameData, width: size, height: size }, 50);
	fs.writeFile('./pp.jpg', jpegImageData.data, err => {
		if (err) console.log(err);
		console.log('File saved !');
		callback();
	});
}

function step(a, b) {
	return a < b ? 0 : 1;
}

function shader(uv, t, s, dx, dy) {
	const color = step(t, Math.tan(Math.min(
		s / (uv.x - dx), s / (uv.y - dy)
	)));
	return color * 255;
}

function norm(x) {
	// Contraindre en 0 et 1
	return Math.sin(x) * .5 + .5;
}

module.exports = createImage;
