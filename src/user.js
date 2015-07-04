var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Connection = require('./connection.js');
var Attributes = require('./libs/attributes.js');

module.exports = User;


function User(data) {
	Attributes.init(this, data);
	EventEmitter.init(this);

	if (this.data.id) {
		this.id = this.data.id;
	} else {
		this.data.id = this.id = global.db.genId();
	}

	this.connections = [];
	this.clients = [];

	// TODO: Is irc-bus the right name here? Many non-irc specific events
	//       are being emitted through here
	this.irc_bus = new EventEmitter();
}


// Cache user objects so that clients can share the same reference to a
// user object when logging in.
var userObjCache = (function() {
	var cache = Object.create(null);

	var ret = function(user_obj) {
		if (!cache[user_obj.id]) {
			cache[user_obj.id] = user_obj;
		}

		return cache[user_obj.id];
	};

	ret.getById = function(user_id) {
		return cache[user_id];
	};

	return ret;
})();


User.fromId = function(user_id) {
	return new Promise(function(resolve, reject) {
		// TODO: Get user from the db similar to User.fromAuth();
		resolve(userObjCache.getById(user_id));
	});
};

User.fromAuth = function(email, password) {
	return new Promise(function(resolve, reject) {
		global.db.getUser(email).then(function(user) {
			if (user && user.get('password') === password) {
				resolve(userObjCache(user));
			} else {
				reject('invalid_password');
			}
		}).catch(function(err) {
			reject(err);
		});
	});
};

User.prototype.getConnection = function(id) {
	return _.find(this.connections, function(con) {
		return con.data.id === id;
	});
};

User.prototype.addConnection = function(data) {
	var con = new Connection(this, {connect_info: data});
	this.connections.push(con);
	return con;
};


// Client stuff
User.prototype.addClient = function(client) {
	var self = this;
	self.clients.push(client);
	client.on('disconnected', function() {
		self.clients = _.without(self.clients, client);
	});

	this.irc_bus.emit('user.newclient', client);
};

// TODO: is this needed? Client interfaces now subscribe to
//       connection.message events for messages
User.prototype.broadcast = function() {
	var applied_args = arguments;
	_.each(this.clients, function(client) {
		client.write.apply(client, applied_args);
	});
};
