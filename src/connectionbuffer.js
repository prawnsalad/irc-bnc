var stream = require('stream');
var util = require('util');
var ircMessage = require('./libs/message');

module.exports = ConnectionBuffer;

util.inherits(ConnectionBuffer, stream.Duplex);
function ConnectionBuffer(connection, id) {
	stream.Duplex.call(this, {objectMode: true});

	this.connection = connection;
	this.id = id || connection.nextBufferId();
	this.name = null;
	this.storage_prefix = 'c.' + connection.id + '.b.' + this.id;
	this.storage_events_key = this.storage_prefix + '.events';
}

ConnectionBuffer.prototype._write = function(obj, enc, next) {
	global.storage.putSeries(this.storage_events_key, Date.now(), obj);
	if (this._reading) {
		this.push(obj);
		//this._reading = false;
	}

	if (obj.raw) {
		// This event will typically be picked up by a client interface
		this.connection.user.irc_bus.emit('connection.message', this.connection, obj, enc);
	}

	next();
};
ConnectionBuffer.prototype._read = function() {
	this._reading = true;
};

ConnectionBuffer.prototype.setName = function(new_name) {
	this.name = new_name;
};

ConnectionBuffer.prototype.getEvents = function(ts, num_messages) {
	return global.storage.getSeries(this.storage_events_key, ts, {num_prev: 50});
};

ConnectionBuffer.prototype.createStream = function() {
	var self = this;
	var buffer_stream = new stream.Duplex();
	buffer_stream._write = function(line, enc, next) {
		self.addLine(line);
	};
	self.pipe(buffer_stream);

	return buffer_stream;
};

ConnectionBuffer.prototype.addLine = function(data, from) {
	var maessage = ircMessage.parse('PRIVMSG ' + this.name + ' :' + data);
	message.prefix = from || this.connection.get('server_addr');
	message.raw = message.buildLine();

	this.write(message);
};