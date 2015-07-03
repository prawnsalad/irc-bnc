var readline = require('readline');
var net = require('net');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var ircMessage = require('../../libs/message');





module.exports = function() {
	EventEmitter.init(this);

	var self = this;
	var server = net.createServer(function (socket) {
		self.emit('transport', new Transport(socket));
	});

	server.listen(3333, '127.0.0.1');
}



function Transport(socket) {
	var self = this;

	EventEmitter.init(this);

	this.socket = socket;
	this.connected = true;

	this.rl = readline.createInterface(socket, socket);
	this.rl.on('line', function(line) {
		var msg = ircMessage.parse(line);
		self.emit('message', msg);
	});

	this.socket.on('close', function() {
		self.connected = false;
		self.emit('disconnect');
	});
}

Transport.prototype.write = function() {
	var args = Array.prototype.slice.call(arguments);
	this.connected && this.socket.write(args.join(' ') + '\n');
};
