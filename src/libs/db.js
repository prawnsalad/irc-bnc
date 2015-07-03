module.exports = Db;

function Db(storage) {
	this.storage = storage;
};

Db.prototype.userConnections = function(user) {
	return new Promise((function(resolve) {
		this.storage.get('u.' + user.get('name') + '.connections').then(function(connections) {
			resolve(connections);
		});
	}).bind(this));
};


Db.prototype.getUser = function(name) {
	var self = this;
	var user;

	return this.storage.get('u.'+name+'.data')
		.then(function(raw_user) {
			if (!raw_user) {
				throw new Error('User not found');
			}
			// TODO: This dependancy of User shouldn't really be here
			var User = require('../user');
			user = new User(raw_user);
			return user;
		})
		.then(self.userConnections)
		.then(function(connections) {
			(connections || []).map(function(con_obj) {
				user.addConnection(con_obj.data);
			});

			return user;
		});
};


Db.prototype.saveUser = function(user) {
	var user_key = 'u.' + user.get('name');

	this.storage.set(user_key + '.data', user.data);

	var connections = user.connections.map(function(con) {
		return {id: con.id, data: con.get('connect_info') };
	});
	this.storage.set(user_key + '.connections', connections);

	var p = this.storage.get('users')
	.then(function() { console.log('inside first then'); })
	.then(function(raw_users) {
		console.log('from resolved');
		var users = raw_users || Object.create(null);
console.log('raw users', users);
		if (!users[user.get('name')]) {
			users[user.get('name')] = user.get('id');
			this.storage.set('users', users);
		}

		this.storage.save();
	}).catch(function(err) {
		console.log('ERRRORORR');
		//console.error(err.stack);
	});
};




var epoch = (new Date(2015, 0, 1)).getTime();
var previous_id = 0;
Db.genId = Db.prototype.genId = function() {
	var id = Date.now() - epoch;

	if (id <= previous_id) {
		id = ++previous_id;
	} else {
		this.previous_id = id;
	}

	return id;
};