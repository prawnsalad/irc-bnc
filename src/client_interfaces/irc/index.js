var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var Transport = require('./transport');
var bncEvents = require('./bncevents');
var clientEvents = require('./clientevents');



module.exports = function() {
	var trans;

	this.start = function(fn) {
		trans = new Transport();

		trans.on('transport', function(transport) {
			fn(new Irc(transport));
		});
	};

	// TODO: This should actually stop the interface
	this.stop = function() {};
};







function Irc(transport) {
	EventEmitter.init(this);

	this.transport = transport;
	this.client = null;
	this.user = null;

	this.irc_con = null;

	this.id = (Math.random() * 1000)|0;
	this.nick = 'bncuser';

	this.listenTo(this.transport, 'disconnected', (function() {
		this.stopListening();
	}).bind(this));
}


Irc.prototype.setClient = function(client) {
	this.client = client;

	this.listenTo(this.client, 'authed', (function(user) {
		this.user = user;
		this.bindBncEvents();
	}).bind(this));

	this.listenTo(this.transport, 'message', (function(message) {
		var eventFn = clientEvents[message.command.toUpperCase()];
		var send_to_server = true;

		console.log('[FROMCLIENT', this.id,']', message.command, message.params);

		if (typeof eventFn === 'function' && eventFn.call(this, message) === false) {
			send_to_server = false;
		}

		if (send_to_server) {
			this.irc_con && this.irc_con.write(message.raw);
		}
	}).bind(this));
};


Irc.prototype.setIrcConnection = function(connection) {
	this.irc_con = connection;
};


Irc.prototype.syncClient = function() {
	var self = this;
	var connection = this.irc_con;

	if (!connection) return;

	self.write(':'+connection.data.server_addr+' 001 ' + connection.data.nick + ' :Welcome to your BNC network');
	self.write(':'+connection.userMask()+' NICK ' + connection.data.nick);

	if (connection.data.isupport) {
		connection.data.isupport.forEach(function(supported) {
			self.write(':'+connection.data.server_addr+' 005 ' + connection.data.nick + ' ' + supported);
		});
	}

	if (connection.data.motd) {
		self.write(':'+connection.data.server_addr+' 375 ' + connection.data.nick + ' :- Message of the day');
		connection.data.motd.forEach(function(line) {
			self.write(':'+connection.data.server_addr+' 372 ' + connection.data.nick + ' :' + line);
		});
	}

	if (connection.buffers.length > 0) {
		connection.buffers.forEach(function(buffer) {
			// Server window will always be id 0
			if (buffer.id === 0) return;

			connection.write('NAMES ' + buffer.name);

			self.write(':'+connection.userMask()+' JOIN ' + buffer.name);
			buffer.getEvents(Date.now(), 50).then(function(events) {
				events.forEach(function(event) {
					self.write(event.raw);
				});
			});
		});
	}
}


Irc.prototype.say = function(say_what) {
	this.write(':*bnc PRIVMSG ' + this.nick + ': ' + say_what);
};


Irc.prototype.write = function() {
	console.log('[TOCLIENT', this.id,']', this.transport.connected, arguments);
	this.transport.write.apply(this.transport, arguments);
};


Irc.prototype.bindBncEvents = function() {
	_.each(bncEvents, function(fn, event_name) {
		this.listenTo(this.client.user.irc_bus, event_name, fn.bind(this));
	}, this);
};

/*
export.subscribeToBuffer = function(cid, bid) {
	var self = this;
	var buffer;

	var connection = self.user.getConnection(cid);
	if (!connection) {
		self.transport.write({success: false, message: 'invalid_cid'});
		return;
	}

	var buffer = connection.getBuffer(bid);
	if (!buffer) {
		self.transport.write({success: false, message: 'invalid_bid'});
		return;
	}

	if (buffer) buffer.pipe(this);
};

*/