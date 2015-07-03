var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var stream = require('stream');
var util = require('util');
var User = require('./user');

module.exports = Client;

util.inherits(Client, stream.Writable);
function Client(interface) {
	stream.Writable.call(this, {objectMode: true});
	// ^ covers events. EventEmitter.init(this);

	this.interface = interface;
	this.user = null;

	this.interface.setClient(this);
}
Client.prototype._write = function(chunk, enc, next) {
	this.interface.write(chunk);
	next();
};
Client.prototype.setUser = function(user) {
	this.user = user;
}
Client.prototype.authUser = function(identity, password) {
	var self = this;
	return User.fromAuth(identity, password).then(function(user) {
		if (user) {
			self.setUser(user);
			self.emit('authed', user);
		}

		return user;
	});
};
