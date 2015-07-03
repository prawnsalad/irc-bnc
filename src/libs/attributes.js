exports.init = function(obj, data) {
	obj.data = data || Object.create(null);
	obj.get = get;
	obj.set = set;
};


function get(key) {
	if (!this.data) return;
	return this.data[key];
};

function set(key, val, silent) {
	if (typeof key === 'object') {
		for(var prop in key) {
			if (key.hasOwnProperty(prop)) {
				this.set(prop, key[prop], val);
			}
		}
	}

	var old_val = this.get(key);

	this.data = this.data || Object.create(null);
	this.data[key] = val;

	if (!silent && typeof this.emit === 'function') {
		this.emit('change', key, val, old_val);
		this.emit('change:' + key, val, old_val);
	}
};