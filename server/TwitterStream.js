const Twitter = require('twitter');
const { Readable } = require('stream');

class TwitterStream extends Readable {
	constructor(cfg) {
		super({ objectMode: true });

		this.client = new Twitter(cfg);
		this.stream;
		this.query = [];
	}

	_read() {}

	connect() {
		this.stream = this.client.stream('statuses/filter', { track: this.query.join() });
		this.stream.on('error', err => {
			console.log('stream error: ', err);
		})
		this.stream.on('data', tweet => this.push(tweet))
	}
	addQueryParam(queryParam, callback) {
		if (this.query.indexOf(queryParam) === -1) {
			this.query.push(queryParam);
			callback(this.query);
			if (this.stream) {
				this.stream.destroy();
			}
			this.connect();
		}
	}
	stop() {
		this.query = []
		this.stream.destroy();
	}
}

module.exports = TwitterStream;
