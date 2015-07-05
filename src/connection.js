var _ = require('lodash');
var net = require('net');
var readline = require('readline');
var ircMessage = require('./libs/message');
var EventEmitter = require('events').EventEmitter;
var ConnectionBuffer = require('./connectionbuffer');
var ConnectionEvents = require('./connectionevents');
var Attributes = require('./libs/attributes.js');
var defineConst = require('./libs/defineconst.js');


module.exports = Connection;


defineConst(Connection, {
	STATE_DISCONNECTED: 0,
	STATE_CONNECTING: 1,
	STATE_CONNECTED: 2
});


function Connection(user, data) {
	Attributes.init(this, data);
	EventEmitter.init(this);

	this.user = user;

	if (this.data.id) {
		this.id = this.data.id;
	} else {
		this.data.id = this.id = global.db.genId();
	}
	this.buffers = [];

	this.state = this.STATE_DISCONNECTED;
	this.socket = null;
	this.rl = null;

	this.network_info = {support: [], motd: '', welcome: ''};

	this.setDefaults();

	// Make sure we have a server buffer for this connection
	this.console = this.getAddBufferByName('*');

	/*
	this.on('change', (function(key, val) {
		global.storage.put('c.' + this.id + '.keys', this.data);
	}).bind(this));
	*/
}

/*
Connection.prototype.get = function(key) {
	return this.data[key];
};

Connection.prototype.set = function(key, val) {
	this.data[key] = val;
	global.storage.put('c.' + this.id + '.keys', this.data);
};
*/

Connection.prototype.setDefaults = function() {
	if (!this.data.nick) this.set('nick', 'bnc_user');
	if (!this.data.username) this.set('username', 'bnc_user');
	if (!this.data.gecos) this.set('gecos', 'bnc_user');
	if (!this.data.hostname) this.set('hostname', 'localhost');
	if (!this.data.server_addr) this.set('server_addr', 'bnc.com');
};

Connection.prototype.userMask = function() {
	return this.get('nick') + '!' + this.get('username') + '@' + this.get('hostname');
};

// Connections
Connection.prototype.disconnect = function(quit_message) {
	this.state === this.STATE_CONNECTED && this.socket.end('QUIT :' + quit_message);
};

Connection.prototype.connect = function(connect_info) {
	if (connect_info) {
		this.set('connect_info', connect_info);
	} else {
		connect_info = this.get('connect_info');
	}

	this.set('nick', connect_info.nick || 'bnc_user');
	this.set('username', connect_info.nick || 'bnc_user');
	this.set('gecos', connect_info.gecos || 'BNC User');
	this.set('hostname', connect_info.nick || 'localhost');

	if (this.socket) {
		this.socket.end();
		this.stopListening(this.socket);
		this.socket = null;

		this.stopListening(this.rl);
		this.rl = null;

	}

	this.state = this.STATE_CONNECTING;
	this.user.irc_bus.emit('connection.connecting', this);

	this.socket = net.createConnection({
		host: connect_info.server,
		port: connect_info.port
	});
	this.listenTo(this.socket, 'connect', this.onSocketConnect.bind(this));
	this.listenTo(this.socket, 'close', this.onSocketClose.bind(this));
};


Connection.prototype.onSocketClose = function() {
	this.state = this.STATE_DISCONNECTED;
};

Connection.prototype.onSocketConnect = function() {
	this.rl = readline.createInterface({
		input: this.socket,
		output: this.socket,
		terminal: false
	});

	this.rl.setPrompt('');
	this.listenTo(this.rl, 'line', this.onLine.bind(this));

	var nick = this.get('nick');
	this.write('NICK ' + nick);
	this.write('USER ' + this.get('username') + ' 0 * :' + this.get('gecos'));

	this.state = this.STATE_CONNECTED;
};


Connection.prototype.onLine = function(line) {
	console.log('[RAW S>C '+this.id+']', line);
	var msg = ircMessage.parse(line);

	// Malformed line?
	if (!msg) {
		return;
	}

	var continue_processing = true;

	// A ConnectionEvent returning false means it should not be emitted to the
	// event bus as it has already been handled internally.
	if (typeof ConnectionEvents[msg.command] === 'function') {
		continue_processing = ConnectionEvents[msg.command](this, msg);
	}

	if (continue_processing !== false){
		// This event will typically be picked up by a client interface
		this.user.irc_bus.emit('connection.message', this, msg);
	}
};


Connection.prototype.write = function(data) {
	if (this.socket){
		var line = data.splice ? data.join(' ') : data;
		console.log('[RAW C>S '+this.id+']', line);
		this.socket.write(line + '\n');
	}
};

// Buffers
Connection.prototype.nextBufferId = (function() {
	var next_buffer_id = 0;
	return function() {
		return next_buffer_id++;
	};
})();

Connection.prototype.getAddBuffer = function(bid) {
	return this.getBuffer(bid) || this.addBuffer(bid);
};
Connection.prototype.getAddBufferByName = function(name) {
	var buf = this.getBufferByName(name);
	if (!buf) {
		buf = this.addBuffer();
		buf.setName(name);
	}
	return buf;
};


Connection.prototype.getBuffer = function(bid) {
	return _.find(this.buffers, function(buf) {
		return buf.id === bid;
	});
};
Connection.prototype.getBufferByName = function(name) {
	return _.find(this.buffers, function(buf) {
		return buf.name.toLowerCase() === name.toLowerCase();
	});
};

Connection.prototype.addBuffer = function(bid) {
	var buffer = this.getBuffer(bid);

	if (!buffer) {
		buffer = new ConnectionBuffer(this, bid);
		buffer.setName(buffer.id);
		this.buffers.push(buffer);
	}

	return buffer;
};