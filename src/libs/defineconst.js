module.exports = function defineConst(constr, name, val) {
	if (typeof name === 'object') {
		for (var prop in name) {
			if (name.hasOwnProperty(prop)) {
				defineConst(constr, prop, name[prop]);
			}
		}

		return;
	}

	constr[name] = constr.prototype[name] = val;
};
