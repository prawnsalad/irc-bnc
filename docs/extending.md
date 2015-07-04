### Extending
Several parts of irc-bnc have been kept modular so that external functionality may be completely switched and configred to better suit different integrations. This in theory should allow for a combination client protocols to connect to irc-bnc (Eg. IRC clients, websockets, HTTP, XMPP) and any backend storage available (Eg. flat files, sqlite, mysql, postgres, mongodb, elasticsearch, in-memory).




#### Client Interfaces
These are the interfaces that allow an incoming client to talk to irc-bnc. Each interface is entirely independant from other interfaces to allow for different protocols and applications to connect. More than one interface may be running at time. The default is the IRC interface which allows IRC clients to connect to irc-bnc.

`client_interfaces/<interface_name>/index.js` must export the following:
* `.start: function(callbackFn)`
    Will be called to start the interface accepting clients. A callback function will be passed as the first argument which is to be called when a new client is available. The new client interface should be passed as the first argument to `callbackFn()`.

* `.stop:  function()`
    Will be called to stop the interface from accepting new clients. The interface should cleanup and assume it is being unloaded.


The client interface object that is passed to `callbackFn()` must export the following:
* `.setClient: function(clientInstance)`
    Called once a complete Client object instance has been created and ready to use. The interface may at this point safely hook into the `clientInstance` API as needed.


Client interfaces will listen for events on its `client.user.irc_bus` EventEmitter instance to interact with the application. Eg. receiving/sending messages objects, IRC connection events, user login events.




#### Storage
Data such as users, IRC connection information and series of messages are stored as key-value pairs in a storage library. Only one storage library may be used at one time. While any part of the application may use the loaded storage library directly at `global.storage`, the most common database related functions such as authentication and retrieving connection information is handled by the `Db` library.

`storage/<storage_name>.js` must export the following:
* `.load: function()`
    Initialise the storage library as needed. Eg. connecting to a database or loading a flat file into memory.

* `.save: function()`
    If a storage library is not saving on the fly, it must persist all unsaved data at this point.

* `.get: function(nameString)`
    Return a Promise instance that will resolve the value for the key named `nameString`.

* `.set: function(nameString, valueString)`
    Return a Promise insatnce that will resolve true/false depending on if `valueString` was successfully saved to the key `nameString`.

* `.getSeries: function(nameString, tsNumber, optsObject)`
    Return a Promise instance that will resolve an array of Message objects.
    `nameString` will be the key to retreive the series from.
    `tsNumber` will be the millisecond timestamp to get the messages from/to
    `optsObject` will be an object that contains one of the following .properties:
        `.num_prev` The number of messages to get directly before `tsNumber`
        `.num_next` The number of messages to get directly after `tsNumber`

* `.putSeries: function(nameString, tsNumber, dataObject)`
    Return a Promise instance that will be resolved once `dataObject` as been stored.
    `nameString` will be the key to store the series to.
    `tsNumber` will be the millisecond timestamp this message relates to.
    `dataObject` will be the object to store