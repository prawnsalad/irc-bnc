require('es6-promise').polyfill();



var Storage = require('./storage/memory');
var User = require('./user.js');
var Client = require('./client.js');


var InterfaceIrcServer = require('./client_interfaces/irc/');
//var InterfaceIrcCloud = require('./client_interfaces/irccloud/');






global.storage = new Storage();
global.storage.load();
global.db = new (require('./libs/db.js'))(global.storage);


var irc_interface = new InterfaceIrcServer()
irc_interface.start(function(transport) {
	console.log('> New IRC client');
	var client = new Client(transport);
});




require('../bnc_modules/webadmin/').start();

/*

var u = new User();
u.set('name', 'prawn');
u.set('password', '1234');
var c = u.addConnection({nick: 'kiwibncuser', server: 'irc.freenode.net', port: 6667, channels:['#kiwiirc-dev']});
global.db.saveUser(u);

console.log(u);
*/




User.fromAuth('prawn', '1234')
.then(function(user) {
	console.log('User found', user);
	user.connections.forEach(function(connection) {
		//connection.connect();
	});
	//var c = user.addConnection({nick: 'kiwibncuser', server: 'irc.freenode.net', port: 6667, channels:['#kiwiirc-dev']});
	//global.db.saveUser(user);
})
.catch(function(err) {
	console.error(err);
});
//var c = u.addConnection();
//c.connect({nick: 'kiwibncuser', server: 'irc.freenode.net', port: 6667, channels:['#kiwiirc-dev']});

/*
//var transport = new TransportTcp();
InterfaceIrcServer.Transport.on('client', function(new_transport) {
	console.log('> New TCP client');
	var client = new Client(new_transport, 'irc');
});
*/

/*
TransportConsole.on('client', function(new_transport) {
	console.log('> New console client');
	var client = new Client(new_transport, 'irccloud');
	client.interface.onRpc('login', {email: '', passord: ''});
	client.interface.onRpc('add-server', {});
});
*/

/*
var user = new User(1);

var client = new Client(new Transport());

var con = user.addConnection();
var chan = con.getAddBuffer();

client.subscribeToBuffer(con.id, chan.id);

chan.write({type: 'message', ts: Date.now(), nick: 'prawn', data: 'my message 1'});
chan.write({type: 'message', ts: Date.now(), nick: 'prawn', data: 'my message 2'});
chan.write({type: 'message', ts: Date.now(), nick: 'prawn', data: 'my message 3'});
chan.write({type: 'message', ts: Date.now(), nick: 'prawn', data: 'my message 4'});

setTimeout(function() {
	chan.getEvents(Date.now(), 50).then(function(events) {
		console.log('Events:', events)
	}).catch(function(err) {
		console.error(err);
	});
}, 500);
*/
