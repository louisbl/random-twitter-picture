const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');
const fs = require('fs');
const { Transform, Writable } = require('stream');
const io = require('socket.io');
const TwitterStream = require('./TwitterStream');
const Twitter = require('twitter');
const config = require('../config');
const port = config.port;
const imageCreate = require('./image.js');

app.use(express.static(path.join(__dirname, '/../client')));

app.use((err, req, res, next) => {
	if (err) {
		res.status(err.status).send({
			code: err.status
		});
	} else {
		next();
	}
});

const twStream = new TwitterStream(config.configTwitter);
const twitterClient = new Twitter(config.configTwitter);
let tweets = [];

const stringify = new Transform({
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    this.push(JSON.stringify(chunk.text.toString()));
    callback();
  }
});

const datasImage = new Writable({
	objectMode: true,

	write(tweet, _, callback)  {
		tweets.push(tweet.toString('utf-8'));
		callback();
	}
});

twStream.pipe(stringify).pipe(datasImage);

const socketIo = io(http);

socketIo.on('connection', client => {
	client.on('track-word', word => {
		twStream.addQueryParam(word, (keywords) => {
			socketIo.emit('keywords', keywords.join(' - '));
		});
	});
	
	client.on('end', _ => {
		twStream.stop();

		let d = 0;
		const s = tweets.length
		let dx = 0;
		let dy = 0;
		tweets.forEach(tweet => {
			const tweetEmojis = tweet.match(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g);
			if (tweetEmojis) {
				d += tweetEmojis.length;
			}
			const tweetSplitted = tweet.split('');
			dx += tweetSplitted.filter(l => l === '#').length;
			dy += tweetSplitted.filter(l => l === '@').length
		});
		tweets = [];

		imageCreate(d, s, dx, dy, () => {
			fs.readFile('./pp.jpg', (err, data) => {
				if (err) console.log(err);
				const data64 = data.toString('base64');
				twitterClient.post('account/update_profile_image', { image: data64 }, (err, media, res) => {
					if (err) console.log('error: ', err);
				})
			});
		});
	});
});

http.listen(port, () => console.log(`listening on port ${port}`));
