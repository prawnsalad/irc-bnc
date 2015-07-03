module.exports = Memory;

/*
 * Message interface:
 *     get(key_name)
 *     set(key_name, value)
 *     getSeries(series_name, timestamp, {to|num_next|num_prev})
 *     putSeries(series_name, timestamp, data)
 */
function Memory() {
	this._data = Object.create(null);
	this._series = Object.create(null);
}

Memory.prototype.load = function() {
	var file = '';
	try {
		file = require('fs').readFileSync('memory.json');
	} catch(err) {}

	if (file && (file = JSON.parse(file))) {
		this._data = file.data;
		this._series = file.series;
	}
};

Memory.prototype.save = function() {
	var out = JSON.stringify({data: this._data, series: this._series});
	console.log('Saving to disk');
	console.log(out);
	require('fs').writeFileSync('memory.json', out);
};

Memory.prototype.get = function(name) {
	var self = this;
console.log('[Storage] Getting', name);
	return Promise.resolve(self._data[name]);
	/*
	return new Promise(function(resolve, reject) {
		console.log('[Storage] resolving');
		setTimeout(function() {
			console.log('[Storage] resolving x2');
			resolve(self._data[name]);
		}, 1000);
	});
*/
}

Memory.prototype.set = function(name, val) {
	var self = this;

	return new Promise(function(resolve, reject) {
		self._data[name] = val;
		resolve(true);
	});
}


Memory.prototype.getSeries = function(name, ts, opts) {
	var self = this;

	return new Promise(function(resolve, reject) {
		var series = self._series[name];

		if (!series) {
			return reject('no series');
		}

		var result = [];
		var i = 0;
		var in_position = false;

		if (opts && opts.num_next) {
			for (i=0; i<series.length-1 && result.length<opts.num_prev; i++) {
				if (series[i].ts > ts) in_position = true;
				if (in_position) result.push(series[i]);
			}
		} else if (opts && opts.num_prev) {
			for (i=series.length-1; i>=0 && result.length<opts.num_prev; i--) {
				if (series[i].ts < ts) in_position = true;
				if (in_position) result.push(series[i]);
			}
		}

		result.reverse();
		resolve(result);
	});
};

Memory.prototype.putSeries = function(name, ts, data) {
	var self = this;

	return new Promise(function(resolve, reject) {
		self._series[name] = self._series[name] || [];
		self._series[name].push(data);
		data.ts = ts;
		resolve();
	});
};


