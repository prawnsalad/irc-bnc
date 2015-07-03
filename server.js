var EventEmitter = require('events').EventEmitter;
var util = require('util');
EventEmitter.init = function(obj) {
	if (!obj.addListener) {
		//util.inherits(obj.constructor, EventEmitter);
		obj.constructor.prototype.__proto__ = EventEmitter.prototype;
	}
	EventEmitter.call(obj);
};
EventEmitter.prototype.listenTo = function(other, event, fn) {
	this._listen_to_events = this._listen_to_events || [];
	other.on(event, fn);
	this._listen_to_events.push([other, event, fn]);
};
EventEmitter.prototype.stopListening = function(other, event) {
	if (!this._listen_to_events) return;
	var ev;
	for(var i=0; i<this._listen_to_events; i++){
		ev = this._listen_to_events[i];
		if (other && other === ev[0]) {
			ev[0].removeListener(ev[1], [2]);
			this._listen_to_events[i] = null;
		} else if (other && other === ev[0] && event == ev[1]) {
			ev[0].removeListener(ev[1], [2]);
			this._listen_to_events[i] = null;
		} else if(!other) {
			ev[0].removeListener(ev[1], [2]);
			this._listen_to_events[i] = null;
		}
	}

	delete this._listen_to_events;
};

require('./src/');