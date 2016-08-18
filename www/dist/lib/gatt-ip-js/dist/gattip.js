require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var C = require("./lib/constants.js").C;
var helper = require('./lib/message-helper');
var ee = require("./lib/event-emitter");
var Descriptor = require("./descriptor").Descriptor;

// TODO: Errors if not connected
function Characteristic(service, uuid, props) {
    ee.instantiateEmitter(this);
    var self = this;
    var peripheral = service.peripheral();
    var gattip = peripheral.gattip();
    var descriptors = {};
    var properties = {};

    helper.requireUUID('Characteristic', 'uuid', uuid);
    this.uuid = uuid;
    if (!props) {
        props = {};
    }
    properties = props;
    this.type = 'c';

    //this.value = undefined;
    this.isNotifying = false;

    this.gattip = function () {
        return gattip;
    };
    this.peripheral = function () {
        return peripheral;
    };
    this.service = function () {
        return service;
    };
    this.getAllDescriptors = function () {
        return descriptors;
    };
    this.findDescriptor = function (uuid) {
        return descriptors[uuid];
    };
    this.addDescriptorWithUUID = function (descriptorUUID) {
        var descriptor = new Descriptor(self, descriptorUUID);
        return descriptors[descriptorUUID] = descriptor;
    };
    this.addDescriptor = function (descriptor) {
        return descriptors[descriptor.uuid] = descriptor;
    };
    // TODO: Explain properties
    this.hasProperty = function (type) {
        return (properties[type] && properties[type].enabled);
    };
    this.setProperty = function (type, value) {
        return (properties[type] = value);
    };
    this.allProperties = function () {
        return properties;
    };


    // REQUESTS =================================================

    this.readValue = function (callback) {
        var params = helper.populateParams(self);
        gattip.request(C.kGetCharacteristicValue, params, callback, function (params) {
            helper.requireFields('Value', params, [C.kValue], []);
            self.value = params[C.kValue];
            gattip.fulfill(callback, self, self.value);
        });
    };

    this.writeValue = function (callback, value) {
        helper.requireHexValue('writeValue', 'value', value);
        var params = helper.populateParams(self);
        params[C.kValue] = value;
        gattip.request(C.kWriteCharacteristicValue, params, callback, function (params) {
            self.value = value;
            gattip.fulfill(callback, self);
        });
    };

    this.enableNotifications = function (callback, isNotifying) {
        helper.requireBooleanValue('enableNotifications', 'isNotifying', isNotifying);
        var params = helper.populateParams(self);
        params[C.kIsNotifying] = isNotifying;
        gattip.request(C.kSetValueNotification, params, callback, function (params) {
            self.isNotifying = isNotifying;
            gattip.fulfill(callback, self, isNotifying);
        });
    };


    // INDICATIONS ==============================================

    this.handleValueNotification = function (params) {
        self.value = params[C.kValue];
        self.emit('valueChange', self, self.value);
    };


    // SERVER RESPONSES/INDICATIONS  ============================

    this.respondToReadRequest = function (cookie, value) {
        helper.requireHexValue('respondToReadRequest', 'value', value);
        var params = helper.populateParams(self);
        params[C.kValue] = value;
        cookie.result = C.kGetCharacteristicValue;
        gattip.respond(cookie, params);
    };

    this.respondToWriteRequest = function (cookie) {
        var params = helper.populateParams(self);
        cookie.result = C.kWriteCharacteristicValue;
        gattip.respond(cookie, params);
    };

    this.respondToChangeNotification = function (cookie, isNotifying) {
        var params = helper.populateParams(self);
        helper.requireBooleanValue('respondToChangeNotification', 'value', isNotifying);
        params[C.kIsNotifying] = isNotifying;
        this.isNotifying = isNotifying;
        cookie.result = C.kSetValueNotification;
        gattip.respond(cookie, params);
    };

    this.indicateValueChange = function (value) {
        helper.requireHexValue('writeValue', 'value', value);
        var params = helper.populateParams(self);
        params[C.kValue] = value;
        gattip.sendIndications(C.kSetValueNotification, params);
    };

}
ee.makeEmitter(Characteristic);

module.exports.Characteristic = Characteristic;

},{"./descriptor":2,"./lib/constants.js":6,"./lib/event-emitter":7,"./lib/message-helper":11}],2:[function(require,module,exports){
var C = require("./lib/constants.js").C;
var helper = require('./lib/message-helper');

// TODO: Errors if not connected
function Descriptor(characteristic, uuid) {
    var self = this;
    var service = characteristic.service();
    var peripheral = service.peripheral();
    var gattip = peripheral.gattip();

    helper.requireUUID('Descriptor', 'uuid', uuid);
    this.uuid = uuid;
    this.type = 'd';

    //this.value = undefined;
    this.characteristic = function () {
        return characteristic;
    };
    this.service = function () {
        return service;
    };
    this.peripheral = function () {
        return peripheral;
    };
    this.gattip = function () {
        return gattip;
    };

    // REQUESTS =================================================

    this.readValue = function (callback) {
        var params = helper.populateParams(self);
        gattip.request(C.kGetDescriptorValue, params, callback, function (params) {
            helper.requireFields('readValue', params, [C.kValue], []);
            self.value = params[C.kValue];
            gattip.fulfill(callback, self, self.value);
        });
    };

    //TODO: Nake sure it's not longer than 20 bytes
    this.writeValue = function (callback, value) {
        var params = helper.populateParams(self);
        helper.requireHexValue('writeValue', 'value', value);
        gattip.request(C.kWriteDescriptorValue, params, callback, function (params) {
            self.value = value;
            gattip.fulfill(callback, self);
        });
    };


    // SERVER RESPONSES/INDICATIONS  ============================

    this.respondToReadRequest = function (cookie, value) {
        var params = helper.populateParams(self);
        helper.requireHexValue('respondToReadRequest', 'value', value);
        params[C.kValue] = value;
        gattip.respond(cookie, params);
    };

    this.respondToWriteRequest = function (cookie) {
        var params = helper.populateParams(self);
        gattip.respond(cookie, params);
    };
}


module.exports.Descriptor = Descriptor;


},{"./lib/constants.js":6,"./lib/message-helper":11}],3:[function(require,module,exports){
//TODO: Review which ones application errorrs, which ones are internal (gateway protocol not understood oro something went wrong) and which ones are errors from Gateway/Bluetooth

module.exports.ApplicationError = function (message) {
    this.message = "Application Error:" + message;
    Error.captureStackTrace(this, module.exports.ApplicationError);

};

module.exports.InternalError = function (message) {
    this.message = "Application Error:" + message;
    Error.captureStackTrace(this, module.exports.InternalError);
};

module.exports.GatewayError = function (params) {
    if (typeof params == 'object') {
        this.message = "Gateway Error:";
        if (params.message) {
            this.message += " " + params.message;
        }
        if (params.code) {
            this.message += " Code:" + params.code;
        }
        if (0 == this.message.length) {
            this.message = "Unknown Gateway Error"
        }
    } else {
        this.message = params;
    }
    Error.captureStackTrace(this, module.exports.GatewayError);
};

},{}],4:[function(require,module,exports){
var C = require('./lib/constants').C;
var helper = require('./lib/message-helper');
var Peripheral = require('./peripheral').Peripheral;
var InternalError = require('./errors').InternalError;
var ApplicationError = require('./errors').ApplicationError;
var ee = require("./lib/event-emitter");

function Gateway(gattip, scanFilters) {
    ee.instantiateEmitter(this);
    var self = this;
    var peripherals = {};
    var state;

    this.isScanning = false;

    this.isPoweredOn = function () {
        return self.state == C.kPoweredOn;
    };

    // REQUESTS =================================================
    this._authenticate = function (callback, token, version) {
        var params = {};
        params[C.kDeviceAccessToken] = token;
        params[C.kGetVersionInfo] = version;
        gattip.request(C.kOpen, params, callback, function (params) {
            if (params.isAuthenticated === true) {
                gattip.fulfill(callback, self);
            } else {
                console.warn('HACK ALERT: Proxy is supposed to respond with normal error');
                throw new GatewayError({error:'Auth error'});
            }
        });
    };

    this.scan = function (callback, scanOptions) {
        var params = {};
        if (scanOptions) {
            if ('boolean' == typeof scanOptions.scanDuplicates) {
                params[C.kScanOptionAllowDuplicatesKey] = scanOptions.scanDuplicates;
            }
            if ('object' == typeof scanOptions.services) {
                params[C.kServiceUUIDs] = scanOptions.services;
            }
        }

        gattip.request(C.kScanForPeripherals, params, callback, function (params) {
            self.isScanning = true;
            gattip.fulfill(callback, self);
        });
    };

    // TODO: Unregister all on scan event handlers
    this.stopScan = function (callback) {
        gattip.request(C.kStopScanning, {}, callback, function (params) {
            self.isScanning = false;
            gattip.fulfill(callback, self);
        });
    };

    this.centralState = function (callback) {
        var params = {};

        gattip.request(C.kCentralState, {}, callback, function (params) {
            self.state = params[C.kState];
            gattip.fulfill(callback, self);
        });
    };

    this.configure = function (callback, pwrAlert, centralID) {
        var params = {};
        if (typeof pwrAlert != 'undefined') {
            params[C.kShowPowerAlert] = pwrAlert;
        }
        if (typeof centralID != 'undefined') {
            params[C.kIdentifierKey] = centralID;
        }

        gattip.request(C.kConfigure, {}, callback, function (params) {
            gattip.fulfill(callback, self);
        });
    };

    //

    this.handleScanIndication = function(params) {
        var peripheralUUID = params[C.kPeripheralUUID];
        if (!peripheralUUID) {
            throw new InternalError('Peripheral UUID is not availabvle');
        }
        if (scanFilters && scanFilters.uuids) {
            for (var i in scanFilters.uuids) {
                var uuid = scanFilters.uuids[i];
                if (uuid && uuid.length) {
                    if (uuid != peripheralUUID) {
                        return;
                    }
                }
            }
        }

        var peripheral = self.getPeripheral(peripheralUUID);
        if (!peripheral) {
            peripheral = self.addPeripheral(new Peripheral(
                gattip,
                peripheralUUID,
                params[C.kPeripheralName],
                params[C.kRSSIkey],
                params[C.kCBAdvertisementDataTxPowerLevel],
                params[C.kCBAdvertisementDataServiceUUIDsKey],
                params[C.kCBAdvertisementDataManufacturerDataKey],
                params[C.kCBAdvertisementDataServiceDataKey],
                params[C.kAdvertisementDataKey],
                params[C.kScanRecord])
            );
        } else {
            peripheral._updateFromScanData(
                params[C.kPeripheralName],
                params[C.kRSSIkey],
                params[C.kCBAdvertisementDataTxPowerLevel],
                params[C.kCBAdvertisementDataServiceUUIDsKey],
                params[C.kCBAdvertisementDataManufacturerDataKey],
                params[C.kCBAdvertisementDataServiceDataKey],
                params[C.kAdvertisementDataKey],
                params[C.kScanRecord]
            );
        }
        self.emit('scan', peripheral);

    };

    // PERIPHERAL MANAGEMENT ETC. ======================================

    this.addPeripheralWithValues = function (uuid, name, RSSI, txPwr, serviceUUIDs, mfrData, scvData) {
        if (!uuid) {
            throw new InternalError('Attempting to add an empty peripheral');
        }
        var peripheral = self.addPeripheral(new Peripheral(gattip, uuid, name, RSSI, txPwr, serviceUUIDs, mfrData, scvData));
        peripherals[uuid] = peripheral;
        return peripheral;
    };

    this.addPeripheral = function (peripheral) {
        if (!peripheral || !peripheral.uuid) {
            throw new InternalError('Attempting to add an empty peripheral');
        }
        peripherals[peripheral.uuid] = peripheral;
        return peripheral;
    };

    this.removePeripheral = function (peripheral) {
        if (!peripheral || !peripheral.uuid) {
            throw new InternalError('Attempting to remove an empty peripheral');
        }
        delete peripherals[peripheral.uuid];
    };

    this.getPeripheral = function (peripheralUUID) {
        return peripherals[peripheralUUID];
    };

    this.getPeripheralOrDie = function (peripheralUUID) {
        var peripheral = peripherals[peripheralUUID];
        if (!peripheral) {
            throw new InternalError('Unable to find peripheral with UUID ' + peripheralUUID);
        }
        return peripheral;
    };

    this.getObjects = function(type, peripheralUUID, serviceUUID, characteristicUUID, descriptorUUID) {
        var resultObj = {};
        resultObj.peripheral = peripherals[peripheralUUID];
        if (resultObj.peripheral) {
            if (type === 'p') {
                return resultObj;
            }
            resultObj.service = resultObj.peripheral.findService(serviceUUID);
            if (resultObj.service) {
                if (type === 's') {
                    return resultObj;
                }
                resultObj.characteristic = resultObj.service.findCharacteristic(characteristicUUID);
                if (resultObj.characteristic) {
                    if (type === 'c') {
                        return resultObj;
                    }
                    resultObj.descriptor = resultObj.characteristic.findDescriptor(descriptorUUID);
                    if (resultObj.descriptor) {
                        if (type === 'd') {
                            return resultObj;
                        } else {
                            throw new InternalError('_getObjects: Argument "type" is required');
                        }
                    } else {
                        throw new ApplicationError('Descriptor "'+ descriptorUUID + '" not found in the service table');
                    }
                } else {
                    throw new ApplicationError('Characteristic "'+ characteristicUUID + '" not found in the service table');
                }
            } else {
                throw new ApplicationError('Service "'+ serviceUUID + '" not found in the service table');
            }
        } else {
            throw new ApplicationError('Peripheral with id '+ peripheralUUID + ' not found');
        }
    };


    this.getObjectsFromMessage = function(type, params) {
        if (!params) {
            throw new InternalError("Message parameters are missing");
        }
        try {
            return self.getObjects(type, params[C.kPeripheralUUID], params[C.kServiceUUID], params[C.kCharacteristicUUID], params[C.kDescriptorUUID] );
        } catch (error) {
            throw new InternalError(error.message, error.detail);
        }
    };

}
ee.makeEmitter(Gateway);
module.exports.Gateway = Gateway;

},{"./errors":3,"./lib/constants":6,"./lib/event-emitter":7,"./lib/message-helper":11,"./peripheral":15}],5:[function(require,module,exports){
var ee = require("./lib/event-emitter");
var InternalError = require("./errors").InternalError;
var ApplicationError = require("./errors").ApplicationError;
var GatewayError = require("./errors").GatewayError;
var MessageHandler = require("./lib/message-handler").MessageHandler;
var MessageProcessor = require('./lib/message-processor').MessageProcessor;
var Gateway = require("./gateway").Gateway;
var helper = require('./lib/message-helper');
var ServerMessageHandler = require("./lib/server-message-handler").ServerMessageHandler;

var NODE_CLIENT_SOCKET_CONFIG = {
    keepalive:true,
    dropConnectionOnKeepaliveTimeout:true,
    keepaliveInterval:10000, // ping every 10 seconds
    keepaliveGracePeriod:10000 // time out if pong is not received after 10 seconds
};

function GATTIP() {
    ee.instantiateEmitter(this);


    this.traceEnabled = false;
    var self = this;
    var stream;
    var processor;
    var mh;
    var smh;
    var gateway;
    this.getGateway = function() {
        return gateway;
    };

    this.traceMessage = function(message, prefix) {
        if (self.traceEnabled) {
            if ('object' == typeof message) {
                message = JSON.stringify(message);
            }
            console.log(prefix? prefix : "", message);
        }
    };

    function sendError(err) {
        self.emit('error', err);
    }

    this.getServerMessageHandler = function() {
        if(!smh) {
            sendError(new GatewayError("Server Message Handler is not Ready"));
        }
        return smh;
    };

    /** callback handling helpers */
    this.fulfill = function (cb, arg1, arg2, arg3, arg4, arg5) {
        if (typeof cb == 'object' && typeof cb.fulfill == 'function') {
            cb.fulfill(arg1, arg2, arg3, arg4, arg5);
        } else if (typeof cb == 'function') {
            cb(arg1, arg2, arg3, arg4, arg5);
        } // else no callback needed.
    };
    this.reject = function (cb, error) {
        if (typeof cb == 'object' && typeof cb.reject == 'function') {
            cb.reject(error);
        } else {
            sendError(error);
        }
    };

    function guardedProcessMessage(doParse, message, handlerFunc) {
        try {
            if (doParse) {
                message = JSON.parse(message);
            }
            handlerFunc(message);
        } catch (error) {
            sendError(error);
        }
    }

    /**
     * Opens a connection to the gateway, given the configuration parameters
     * @param config
     *  url: WebSocket URL to open. This or stream is required to issue an open()
     *  stream: Stream object implementing send() and close(), onMessage()
     */
    this.open = function (config) {
        var gw = new Gateway(this, config.scanFilters);
        processor = new MessageProcessor(this);
        mh = new MessageHandler(this, gw);
        smh = new ServerMessageHandler(this, gw);

        function waitReady(config) {
            if (config.isServer) {
                processor.on('request', function (message) {
                    self.traceMessage(message, '<req:');
                    guardedProcessMessage(false, message, smh.processMessage)
                });
                processor.on('indication', function (message) {
                    sendError(new ApplicationError("Received an indication on a server stream:" + JSON.stringify(message)));
                });
                gateway = gw;
                self.emit('ready', gw);
            } else {
                gw.configure(function () {
                    gw.centralState(function () {
                        if (!gw.isPoweredOn()) {
                            console.log('Bluetooth not power on :(');
                            self.emit('state', 'Bluetooth not power on');
                            var statePoll = setInterval(function() {
                                gw.centralState(function () {
                                    if (gw.isPoweredOn()) {
                                        clearInterval(statePoll);
                                        emitGateway();
                                    }
                                });
                            },500);
                        }else if(gw.isPoweredOn()){
                            emitGateway();
                        }
                    });
                });
            }
        }

        function emitGateway(){
            processor.on('indication', function (message) {
                self.traceMessage(message, '<ind:');
                guardedProcessMessage(false, message, mh.handleIndication)
            });
            processor.on('request', function (message) {
                sendError(new InternalError("Received a request on a client stream:" +  JSON.stringify(message)));
            });
            gateway = gw;
            self.emit('ready', gw);
        }

        function doOpen(config) {
            if (config.token) {
                gw._authenticate(function () {
                    waitReady(config);
                }, config.token,
                config.version);
            } else {
                waitReady(config);
            }
        }

        if (config.trace === true) {
            self.traceEnabled = true;
        }
        if (config.url) {
            var WebSocket;
            if (typeof window == 'object') {
                WebSocket = window.WebSocket;
            } else {
                WebSocket = require('websocket').w3cwebsocket;
            }
            stream = new WebSocket(config.url, undefined, undefined, undefined, undefined, NODE_CLIENT_SOCKET_CONFIG);
            stream.onopen = function () {
                doOpen(config);
            };
            stream.onclose = function (error) {
                self.emit('onclose', error);
            };
            stream.onerror = function (error) {
                self.emit('onerror', error);
            };

        } else if (config.stream) {
            stream = config.stream;
            doOpen(config);
        } else {
            throw new ApplicationError("URL or stream implementing a socket interface is required");
        }

        stream.onmessage = function (streamMessage) {
            guardedProcessMessage(true, streamMessage.data, processor.onMessageReceived);
        };

        processor.on('response', function (message, ctxt) {
            self.traceMessage(message, '<rsp:');
            try {
                if (message.error) {
                    self.reject(ctxt.cb, new GatewayError(message.error));
                } else {
                    if (ctxt.handler) {
                        // handler is responsible to fulfill
                        ctxt.handler(message.params);
                    } else {
                        self.fulfill(ctxt.cb);
                    }
                }
            } catch (error) {
                self.reject(ctxt.cb, error);
            }
        });

        processor.on('error', function (error) {
            self.emit('error', error);
        });
    };

    this.close = function () {
        if (stream) {
            stream.close();
        }
    };


    // INTERNAL ONLY

    this.request = function (method, params, userCb, handler) {
        var ctxt = mh.createUserContext(method, params, userCb, handler);
        var msg = ctxt.originalMessage;
        processor.register(msg, ctxt);
        self.traceMessage(msg, '>req:');
        stream.send(JSON.stringify(msg));
    };

    this.respond = function (cookie, params) {
        var msg = mh.wrapResponse(cookie, params);
        self.traceMessage(msg, '>rsp:');
        stream.send(JSON.stringify(msg));
    };

    this.sendIndications = function (result, params){
        var mesg = {
            params: params,
            jsonrpc: "2.0"
        };
        mesg.result = result;
        mesg.params = params;
        self.traceMessage(mesg, '>rsp:');
        stream.send(JSON.stringify(mesg));
    };

    this.sendError = function (mesg){
        mesg.jsonrpc = "2.0";
        self.traceMessage(mesg, '>rsp:');
        stream.send(JSON.stringify(mesg));
    };
}


ee.makeEmitter(GATTIP);
module.exports.GATTIP = GATTIP;

},{"./errors":3,"./gateway":4,"./lib/event-emitter":7,"./lib/message-handler":10,"./lib/message-helper":11,"./lib/message-processor":12,"./lib/server-message-handler":13,"websocket":17}],6:[function(require,module,exports){
var C = {
    // TODO: When we are done, clean up all unsupported constancts

    // make default timeout a tad longer than whatever the longest gateway timeout may be
    // client should pass adequate timeouts
    DEFAULT_MESSAGE_TIMEOUT_MS: 61000,
    MAX_PENDING_MESSAGES: 200, // maximum number of pending requests (in message-processor)
    NUM_CONNECT_ATTEMPTS: 3,

    /* BEGIN new constants with gattip 2.0 */
    kMessageId                  : "id",
    kSessionId                  : "session_id",
    kAuthenticate               : 'aut',
    kOpen                       : 'opn',
    kDeviceAccessToken          : 'dat',
    kGetVersionInfo             : 'vif',
    
    /* END new constants with gattip 2.0 */
    kError: "error",
    kCode: "code",
    kMessageField: "message",
    kMethod:'method',
    kResult: "result",
    kIdField: "id",
    kConfigure: "aa",
    kScanForPeripherals: "ab",
    kStopScanning: "ac",
    kConnect: "ad",
    kDisconnect: "ae",
    kCentralState: "af",
    kGetConnectedPeripherals: "ag",
    kGetPerhipheralsWithServices: "ah",
    kGetPerhipheralsWithIdentifiers: "ai",
    kGetServices: "ak",
    kGetIncludedServices: "al",
    kGetCharacteristics: "am",
    kGetDescriptors: "an",
    kGetCharacteristicValue: "ao",
    kGetDescriptorValue: "ap",
    kWriteCharacteristicValue: "aq",
    kWriteDescriptorValue: "ar",
    kSetValueNotification: "as",
    kGetPeripheralState: "at",
    kGetRSSI: "au",
    kInvalidatedServices: "av",
    kPeripheralNameUpdate: "aw",
    kMessage: "zz",
    kCentralUUID: "ba",
    kPeripheralUUID: "bb",
    kPeripheralName: "bc",
    kPeripheralUUIDs: "bd",
    kServiceUUID: "be",
    kServiceUUIDs: "bf",
    kPeripherals: "bg",
    kIncludedServiceUUIDs: "bh",
    kCharacteristicUUID: "bi",
    kCharacteristicUUIDs: "bj",
    kDescriptorUUID: "bk",
    kServices: "bl",
    kCharacteristics: "bm",
    kDescriptors: "bn",
    kProperties: "bo",
    kValue: "bp",
    kState: "bq",
    kStateInfo: "br",
    kStateField: "bs",
    kWriteType: "bt",
    kRSSIkey: "bu",
    kIsPrimaryKey: "bv",
    kIsBroadcasted: "bw",
    kIsNotifying: "bx",
    kShowPowerAlert: "by",
    kIdentifierKey: "bz",
    kScanOptionAllowDuplicatesKey: "b0",
    kScanOptionSolicitedServiceUUIDs: "b1",
    kAdvertisementDataKey: "b2",
    kCBAdvertisementDataManufacturerDataKey: "mfr",
    kCBAdvertisementDataServiceUUIDsKey: "suu",
    kCBAdvertisementDataServiceDataKey: "sdt",
    kCBAdvertisementDataOverflowServiceUUIDsKey: "b6",
    kCBAdvertisementDataSolicitedServiceUUIDsKey: "b7",
    kCBAdvertisementDataIsConnectable: "b8",
    kCBAdvertisementDataTxPowerLevel: "txp",
    kPeripheralBtAddress: "c1",
    kRawAdvertisementData: "c2",
    kScanRecord: "c3",
    kCBCentralManagerRestoredStatePeripheralsKey: "da",
    kCBCentralManagerRestoredStateScanServicesKey: "db",
    kWriteWithResponse: "cc",
    kWriteWithoutResponse: "cd",
    kNotifyOnConnection: "ce",
    kNotifyOnDisconnection: "cf",
    kNotifyOnNotification: "cg",
    kDisconnected: "ch",
    kConnecting: "ci",
    kConnected: "cj",
    kUnknown: "ck",
    kResetting: "cl",
    kUnsupported: "cm",
    kUnauthorized: "cn",
    kPoweredOff: "co",
    kPoweredOn: "cp",
    kErrorPeripheralNotFound: "-32001",
    kErrorServiceNotFound: "-32002",
    kErrorCharacteristicNotFound: "-32003",
    kErrorDescriptorNotFound: "-32004",
    kErrorPeripheralStateIsNotValid: "-32005",
    kErrorNoServiceSpecified: "-32006",
    kErrorNoPeripheralIdentiferSpecified: "-32007",
    kErrorStateRestorationNotValid: "-32008",
    kInvalidRequest: "-32600",
    kMethodNotFound: "-32601",
    kInvalidParams: "-32602",
    kError32603: "-32603",
    kParseError: "-32700",
    kGAP_ADTYPE_FLAGS: "01",
    kGAP_ADTYPE_INCOMPLETE_16BIT_SERVICEUUID: "02",
    kGAP_ADTYPE_COMPLETE_16BIT_SERVICEUUID: "03",
    kGAP_ADTYPE_INCOMPLETE_32BIT_SERVICEUUID: "04",
    kGAP_ADTYPE_COMPLETE_32BIT_SERVICEUUID: "05",
    kGAP_ADTYPE_INCOMPLETE_128BIT_SERVICEUUID: "06",
    kGAP_ADTYPE_COMPLETE_128BIT_SERVICEUUID: "07",
    kGAP_ADTYPE_POWER_LEVEL: "0A",
    kGAP_ADTYPE_MANUFACTURER_SPECIFIC: "FF",
    kGAP_ADTYPE_16BIT_SERVICE_DATA: "16",
    id: 1,
    authenticate: 'authenticate',
    AllProperties: ["Broadcast", "Read", "WriteWithoutResponse", "Write", "Notify", "Indicate", "AuthenticatedSignedWrites", "ExtendedProperties", "NotifyEncryptionRequired", "IndicateEncryptionRequired"]
};

module.exports.C = C;

},{}],7:[function(require,module,exports){
/**

 Example code:

 function MyEmitter() {
    module.exports.instantiateEmitter(this);

}
 module.exports.makeEmitter(MyEmitter);

 const myEmitter = new MyEmitter();
 myEmitter.on('event', function (arg) {
    console.log('an event occurred!', arg);
});
 myEmitter.emit('event', 'foo');
 */


var EventEmitter = require('events');
var util = require('util'); // this is node util
module.exports.makeEmitter = function (contructor) {
    util.inherits(contructor, EventEmitter);
};
module.exports.instantiateEmitter = function (object) {
    EventEmitter.call(object);
};


},{"events":18,"util":22}],8:[function(require,module,exports){
var C = require('./constants.js').C;
var Peripheral = require("../peripheral.js").Peripheral;
var ee = require('./event-emitter');
function GattIpServer() {
    ee.instantiateEmitter(this);
    var self = this;

    var server;
    this.peripherals = {};

    this.init = function (url, callback) {
        if (callback) this.oninit = callback;

        if (typeof window !== 'object') {
            WebSocket = require('websocket').w3cwebsocket;
        }
        self.socket = new WebSocket(url);

        self.socket.onopen = function () {
            self.initWithServer(self.socket);
            if (self.oninit) {
                self.oninit();
            }
        }
    };

    this.initWithServer = function (_server) {
        server = _server;

        if (!server.send) {
            throw new Error('server must implement the send method');
        }
        server.onmessage = self.processMessage;

        if (!server.onclose) {
            server.onclose = function () {
                console.log('socket is closed')
            };
        }
        if (!server.onerror) {
            server.onerror = function (error) {
                console.log('socket is onerror, onerror' + error);
            };
        }
        if (!server.error) {
            server.onerror = function (error) {
                console.log('socket is error, error' + error);
            };
        }
    };

    this.processMessage = function (mesg) {
        try {
            var message = JSON.parse(mesg.data);
        } catch (err) {
            console.warn("Got unknown message from client", mesg.data, 'error was', err);
        }

        if ((typeof message === 'undefined') || (!message)) {
            console.warn("Got unknown message from client", mesg.data);
            return;
        }

        if (message.error) {
            console.warn('Error in the Request', mesg.error);
            return;
        }

        // MESSAGE IS VALID
        var obj;
        if (message.result && ( (message.result == C.kMessage) || (message.result == C.kAuthenticate) ) ){
            var authenticated = false;
            if (!message.error && typeof message.params == 'object' && message.params[C.kAuthenticate] === true) {
                authenticated = true;
            }
            self.emit('authenticated', authenticated);
            return;
        }
        if (message.method && message.method == C.kAuthenticate) {
            // this is so that clients can talk to us directly, bypassing the proxy. If someone has access to the port, they should authenticate?
            console.log("Client requested to authenticate with us. Allowing the client");
            var params = {};
            params[C.kAuthenticate] = true;
            var response = {};
            response.result = C.kAuthenticate;
            response.params = params;
            response[C.kIdField] = message[C.kIdField];
            response = JSON.stringify(response);
            self.send(response);
            return;
        }

        // TODO work out some more invalid message cases....

        var cookie = {id: message.id, session_id: message.session_id, method: message.method};
        var p = message.params;

        function getObjects(type) {
            var peripheralUUID = p[C.kPeripheralUUID];
            var resultObj = {};

            resultObj.peripheral = self.peripherals[peripheralUUID];
            if (resultObj.peripheral && resultObj.peripheral.uuid) {
                if (type === 'p') {
                    return resultObj;
                }
                var serviceUUID = p[C.kServiceUUID];
                resultObj.service = resultObj.peripheral.findService(serviceUUID);
                if (resultObj.service && resultObj.service.uuid) {
                    if (type === 's') {
                        return resultObj;
                    }
                    var characteristicUUID = p[C.kCharacteristicUUID];
                    resultObj.characteristic = resultObj.service.findCharacteristic(characteristicUUID);
                    if (resultObj.characteristic && resultObj.characteristic.uuid) {
                        if (type === 'c') {
                            return resultObj;
                        }
                        var descriptorUUID = p[C.kDescriptorUUID];
                        resultObj.descriptor = resultObj.characteristic.findDescriptor(descriptorUUID);
                        if (resultObj.descriptor && resultObj.descriptor.uuid) {
                            return resultObj;
                        } else {
                            self.sendErrorResponse(message.method, C.kErrorDescriptorNotFound, 'Descriptor not found in the service database');
                            throw new Error('Descriptor not found');
                        }
                    } else {
                        self.sendErrorResponse(message.method, C.kErrorCharacteristicNotFound, 'Characteristic not found in the service database');
                        throw new Error('Characteristic not found');
                    }
                } else {
                    self.sendErrorResponse(message.method, C.kErrorServiceNotFound, 'Service not found in the service database');
                    throw new Error('Service not found');
                }
            } else {
                self.sendErrorResponse(message.method, C.kErrorPeripheralNotFound, 'Peripheral not found in the service database');
                throw new Error('Peripheral not found');
            }
        }

        switch (message.method) {
            case C.kConfigure:
                self.emit('configure', cookie, p[C.kShowPowerAlert], p[C.kIdentifierKey]);
                break;
            case C.kScanForPeripherals:
                self.emit('scan', cookie, p[C.kScanOptionAllowDuplicatesKey], p[C.kServiceUUIDs]);
                break;
            case C.kStopScanning:
                self.emit('stopScan', cookie);
                break;
            case C.kCentralState:
                self.emit('getCentralState', cookie);
                break;
            case C.kConnect:
                try {
                    obj = getObjects('p');
                    self.emit('connect', cookie, obj.peripheral.uuid);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kDisconnect:
                try {
                    obj = getObjects('p');
                    self.emit('disconnect', cookie, obj.peripheral.uuid);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetCharacteristicValue:
                try {
                    obj = getObjects('c', cookie);
                    self.emit('readCharacteristic', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kWriteCharacteristicValue:
                try {
                    obj = getObjects('c', cookie);
                    self.emit('writeCharacteristic', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid, message.params[C.kValue]);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kSetValueNotification:
                try {
                    obj = getObjects('c', cookie);
                    obj.characteristic.isNotifying = message.params[C.kValue];
                    self.emit('enableNotifications', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid, message.params[C.kIsNotifying]);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetDescriptorValue:
                try {
                    obj = getObjects('d', cookie);
                    self.emit('readDescriptor', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid, obj.descriptor.uuid);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kWriteDescriptorValue:
                try {
                    obj = getObjects('d', cookie);
                    self.emit('writeDescriptor', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid, obj.descriptor.uuid, message.params[C.kValue]);
                } catch (ex) {
                    console.error(ex);
                }
                break;

            default:
                console.log('invalid request' + message.method);
                self.sendErrorResponse(cookie, message.method, C.kInvalidRequest, 'Request not handled by server');
                return;
        }
    };

    this.sendErrorResponse = function (cookie, method, errorId, errMessage) {
        var error = {};
        params = {};
        error[C.kCode] = errorId;
        error[C.kMessageField] = errMessage;
        params[C.kError] = error;
        self.write(method, undefined, cookie, error);
    };

    this.authenticate = function(token, verInfo) {
        params = {};
        params[C.kDeviceAccessToken] = token;
        params[C.kGetVersionInfo] = verInfo;

        var message = {};
        message.method = C.kAuthenticate;
        message.params = params;
        message.id = C.id.toString();
        C.id += 1;

        this.send(JSON.stringify(message));
    };

    this.configureResponse = function (cookie, error) {
        if (!error) {
            self.write(C.kConfigure, undefined, cookie);
        } else {
            self.sendErrorResponse(cookie, C.kConfigure, undefined);
        }
    };

    this.centralStateResponse = function (cookie, state, error) {
        if (!error) {
            params = {};
            params[C.kState] = state;
            self.write(C.kCentralState, params, cookie);
        } else {
            self.sendErrorResponse(cookie, C.kCentralState, undefined);
        }
    };
    
    // g-server
    function iGotRequest(params) {
        self.emit('readCharacteristic', function(value) {
            transmitToWire(value);
        })
    }

    // linux gw
    function globalHandler() {
        gattipserver.on('readCharacteristic', function (callback) {
            callback(internalReadValue());
        })
    }

    function arrayAsHex(array, pretty) {
        var ret = (pretty ? '0x' : '');
        for (var i in array) {
            var value = (array[i] & 0xFF).toString(16);
            if (value.length == 1) {
                value = '0' + value;
            }
            ret += value;
        }
        return ret;
    }

    function dec2hex(d) {
        var hex = Number(d).toString(16);
        while (hex.length < 2) {
            hex = '0' + hex;
        }
        return hex;
    }

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }

        return JSON.stringify(obj) === JSON.stringify({});
    }

    this.scanResponse = function(cookie, uuid, name, rssi, txPwr, serviceUUIDs, mfrData, svcData) {
        params = {};
        var manufactData;
        var serviceData;

        if (!isEmpty(mfrData)) {
            manufactData = {};
            for (var mk in mfrData) {
                var mkey = mk.toUpperCase();
                manufactData[mkey] = arrayAsHex(mfrData[mk]).toUpperCase();
            }
        }
        if (!isEmpty(svcData)) {
            serviceData = {};
            for (var sk in svcData) {
                var skey = sk.toUpperCase();
                serviceData[skey] = arrayAsHex(svcData[sk]).toUpperCase();
            }
        }

        params[C.kPeripheralName] = name;
        params[C.kPeripheralUUID] = uuid;
        params[C.kRSSIkey] = rssi;
        params[C.kCBAdvertisementDataTxPowerLevel] = txPwr;
        params[C.kCBAdvertisementDataServiceUUIDsKey] = ((serviceUUIDs && serviceUUIDs.length > 0) ? serviceUUIDs : undefined);
        params[C.kCBAdvertisementDataManufacturerDataKey] = manufactData;
        params[C.kCBAdvertisementDataServiceDataKey] = serviceData;

        self.write(C.kScanForPeripherals, params, cookie);
    };

    this.stopScanResponse = function (cookie, error) {
        if (!error) {
            self.write(C.kStopScanning, undefined, cookie);
        } else {
            this.sendErrorResponse(cookie, C.kStopScanning, error);
        }
    };

    this.connectResponse = function (cookie, peripheral, error) {
        var peripheral_db = {};
        peripheral_db[C.kPeripheralUUID] = peripheral.uuid;
        peripheral_db[C.kPeripheralName] = peripheral.name;

        var service_db = {};
        service_db = getServiceJsonFromPeripheralObject(peripheral);
        peripheral_db[C.kServices] = service_db;

        if (!error) {
            self.write(C.kConnect, peripheral_db, cookie);
        } else {
            self.sendErrorResponse(cookie, C.kConnect, error);
        }
    };

    this.disconnectResponse = function (cookie, peripheral, error) {
        if (!error) {
            params = {};
            params[C.kPeripheralUUID] = peripheral.uuid;
            params[C.kPeripheralName] = peripheral.name;

            self.write(C.kDisconnect, params);
        } else {
            self.sendErrorResponse(cookie, C.kDisconnect, error);
        }
    };

    this.write = function (result, params, cookie, error) {
        var mesg = {};
        mesg.jsonrpc = "2.0";
        mesg.result = result;
        mesg.params = params;
        mesg.error = error;
        if (cookie) {
            mesg.id = cookie.id;
            mesg.session_id = cookie.session_id;
        }

        self.send(JSON.stringify(mesg));
    };

    this.send = function (mesg) {
        if (!server) {
            self.onerror("not connected");
            return;
        }
        if (server.readyState !== 1) {
            console.log('Socket is CLOSED');
            return;
        }
        server.send(mesg);
    };

    this.close = function (callback) {
        if (server) {
            server.close();
        }
    };

    function getServiceJsonFromPeripheralObject(myPeripheral) {
        var service_db = {};

        if (myPeripheral && myPeripheral.getAllServices()) {
            for (var uuid in myPeripheral.getAllServices()) {
                var temp_service = {};
                temp_service[C.kServiceUUID] = uuid;
                temp_service[C.kIsPrimaryKey] = myPeripheral.findService(uuid).isPrimary;
                temp_service[C.kCharacteristics] = getCharacteristicJsonFromServiceObject(myPeripheral.findService(uuid));

                service_db[uuid] = temp_service;
            }
        }

        return service_db;
    }

    function getCharacteristicJsonFromServiceObject(myService) {
        var characteristic_db = {};

        if (myService && myService.getAllCharacteristics()) {
            for (var uuid in myService.getAllCharacteristics()) {
                var temp_characteristic = {};
                temp_characteristic[C.kCharacteristicUUID] = uuid;
                temp_characteristic[C.kValue] = myService.findCharacteristic(uuid).value;
                temp_characteristic[C.kProperties] = myService.findCharacteristic(uuid).allProperties();
                temp_characteristic[C.kIsNotifying] = myService.findCharacteristic(uuid).isNotifying;
                temp_characteristic[C.kDescriptors] = getDescriptorJsonFromCharacteristicObject(myService.findCharacteristic(uuid));

                characteristic_db[uuid] = temp_characteristic;
            }
        }

        return characteristic_db;
    }

    function getDescriptorJsonFromCharacteristicObject(myCharacteristic) {
        var descriptor_db = {};

        if (myCharacteristic && myCharacteristic.getAllDescriptors()) {
            for (var uuid in myCharacteristic.getAllDescriptors()) {
                var temp_descriptor = {};
                temp_descriptor[C.kDescriptorUUID] = uuid;
                temp_descriptor[C.kValue] = myCharacteristic.findDescriptor(uuid).value;
                temp_descriptor[C.kProperties] = myCharacteristic.findDescriptor(uuid).properties;
                temp_descriptor[C.kIsNotifying] = myCharacteristic.findDescriptor(uuid).isNotifying;

                descriptor_db[uuid] = temp_descriptor;
            }
        }

        return descriptor_db;
    }

    this.addPeripheral = function (uuid, name, rssi, addata, scanData) {
        var peripheral = new Peripheral(this, uuid, name, rssi, addata, scanData);
        self.peripherals[peripheral.uuid] = peripheral;

        return peripheral;
    };

    /* The following define the flags that are valid with the SecurityProperties */
    this.GATM_SECURITY_PROPERTIES_NO_SECURITY = 0x00000000;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_ENCRYPTION_WRITE = 0x00000001;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_ENCRYPTION_WRITE = 0x00000002;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_ENCRYPTION_READ = 0x00000004;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_ENCRYPTION_READ = 0x00000008;
    this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_SIGNED_WRITES = 0x00000010;
    this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_SIGNED_WRITES = 0x00000020;

    /* The following define the flags that are valid with the CharacteristicProperties */
    this.GATM_CHARACTERISTIC_PROPERTIES_BROADCAST = 0x00000001;
    this.GATM_CHARACTERISTIC_PROPERTIES_READ = 0x00000002;
    this.GATM_CHARACTERISTIC_PROPERTIES_WRITE_WO_RESP = 0x00000004;
    this.GATM_CHARACTERISTIC_PROPERTIES_WRITE = 0x00000008;
    this.GATM_CHARACTERISTIC_PROPERTIES_NOTIFY = 0x00000010;
    this.GATM_CHARACTERISTIC_PROPERTIES_INDICATE = 0x00000020;
    this.GATM_CHARACTERISTIC_PROPERTIES_AUTHENTICATED_SIGNED_WRITES = 0x00000040;
    this.GATM_CHARACTERISTIC_PROPERTIES_EXT_PROPERTIES = 0x00000080;

    /* The following define the flags that are valid with the DescriptorProperties */
    this.GATM_DESCRIPTOR_PROPERTIES_READ = 0x00000001;
    this.GATM_DESCRIPTOR_PROPERTIES_WRITE = 0x00000002;

}


ee.makeEmitter(GattIpServer);

module.exports.GattIpServer = GattIpServer;

},{"../peripheral.js":15,"./constants.js":6,"./event-emitter":7,"websocket":17}],9:[function(require,module,exports){
var C = require('./constants').C;
function getDiscoverable(advdata, advArray) {
    var discoverableDataLength = parseInt(advArray[0], 16);
    if (parseInt(advArray[2], 16) >= 1) {
        advdata.discoverable = "true";
    } else
        advdata.discoverable = "false";
    advArray.splice(0, discoverableDataLength + 1);
}

function getTXLevel(advdata, advArray) {
    var txlevelDataLength = parseInt(advArray[0], 16);
    advdata.txPowerLevel = parseInt(advArray[2]);
    advArray.splice(0, txlevelDataLength + 1);
}

function getManufacturerData(advdata, advArray) {
    var manufacturerDataLength = parseInt(advArray[0], 16);
    if (manufacturerDataLength > 2) {
        var mfrKey = advArray[3] + advArray[2];
        var mfrData = '';
        for (var k = 4; k <= manufacturerDataLength; k++) {
            mfrData += advArray[k];
        }
        advdata.manufacturerData[mfrKey] = mfrData;
    }
    advArray.splice(0, manufacturerDataLength + 1);
}

function getServiceUUIDs(advdata, advArray) {
    var service16bitDataLength = parseInt(advArray[0], 16);
    var reverse16bitUUID = '';
    for (var i = service16bitDataLength; i >= 2; i--) {
        reverse16bitUUID += advArray[i];
    }
    advdata.serviceUUIDs = reverse16bitUUID;
    advArray.splice(0, service16bitDataLength + 1);
}

function get128bitServiceUUIDs(advdata, advArray) {
    var service128bitDataLength = parseInt(advArray[0], 16);
    var reverse128bitUUID = '';
    for (var i = service128bitDataLength; i >= 2; i--) {
        reverse128bitUUID += advArray[i];
        if (i == 14 || i == 12 || i == 10 || i == 8) {
            reverse128bitUUID += "-";
        }
    }
    advdata.serviceUUIDs = reverse128bitUUID;
    advArray.splice(0, service128bitDataLength + 1);
}

function getServiceData(advdata, advArray) {
    var serviceDataLength = parseInt(advArray[0], 16);
    var eddystoneServiceUUID = '';
    for (var i = 3; i >= 2; i--) {
        eddystoneServiceUUID += advArray[i];
    }
    if (eddystoneServiceUUID == 'FEAA') {
        if (parseInt(advArray[4], 16) === 0) {
            getUID(advdata);
        } else if (parseInt(advArray[4], 16) == 16) {
            getURL(advdata);
        } else if (parseInt(advArray[4], 16) == 32) {
            getTLM(advdata);
        }
    }
    advArray.splice(0, serviceDataLength + 1);
}

function getUID(advdata, advArray) {
    advdata.frameType = 'UID';
    advdata.nameSpace = '';
    advdata.instanceID = '';
    advdata.txPowerLevel = parseInt(advArray[5], 16);
    for (var i = 6; i < 16; i++) {
        advdata.nameSpace += advArray[i];
    }
    for (var j = 16; j < 22; j++) {
        advdata.instanceID += advArray[j];
    }
    advdata.reserved = advArray[22];
    advdata.reserved += advArray[23];
}

function getURL(advdata, advArray) {
    advdata.frameType = 'URL';
    advdata.txPowerLevel = parseInt(advArray[5]);
    for (var protocol in C.AllProtocols) {
        if (advArray[6] == protocol)
            advdata.url = C.AllProtocols[protocol];
    }
    for (var i = 7; i < advArrayLength; i++) {
        advdata.url += String.fromCharCode(parseInt(advArray[i], 16));
    }
    for (var domain in C.AllDomains) {
        if (advArray[advArrayLength] == domain)
            advdata.url += C.AllDomains[domain];
    }
}

function getTLM(advdata, advArray) {
    advdata.frameType = 'TLM';
    advdata.advPacketCount = '';
    advdata.timeInterval = '';
    advdata.batteryVoltage = '';
    advdata.eddyVersion = parseInt(advArray[5], 16);
    for (var i = 6; i < 8; i++) {
        advdata.batteryVoltage += advArray[i];
    }
    advdata.batteryVoltage = parseInt(advdata.batteryVoltage, 16);
    advdata.temperature = Math.ceil(parseInt(advArray[8], 16));
    advdata.temperature += '.';
    var temp = Math.ceil(((1 / 256) * parseInt(advArray[9], 16)));
    if (temp.length > 2)
        advdata.temperature += temp.toString().substring(0, 2);
    else
        advdata.temperature += temp;
    for (var j = 10; j < 14; j++) {
        advdata.advPacketCount += advArray[j];
    }
    advdata.advPacketCount = parseInt(advdata.advPacketCount, 16);
    for (var k = 14; k < 18; k++) {
        advdata.timeInterval += advArray[k];
    }
    advdata.timeInterval = Math.ceil(parseInt(advdata.timeInterval, 16) * 0.1);
    advdata.timePeriod = '';
    if (advdata.timeInterval >= 60) {
        var days = Math.floor(advdata.timeInterval / 86400);
        if (days > 0) {
            advdata.timePeriod += days < 10 ? days + 'day ' : days + 'days ';
            advdata.timeInterval -= days * 24 * 60 * 60;
        }
        var hours = Math.floor(advdata.timeInterval / 3600);
        if (hours > 0) {
            advdata.timePeriod += hours < 10 ? '0' + hours + ':' : hours + ':';
            advdata.timeInterval -= hours * 60 * 60;
        } else
            advdata.timePeriod += '00:';
        var min = Math.floor(advdata.timeInterval / 60);
        if (min > 0) {
            advdata.timePeriod += min < 10 ? '0' + min + ':' : min + ':';
            advdata.timeInterval -= min * 60;
            advdata.timePeriod += advdata.timeInterval < 10 ? '0' + advdata.timeInterval : advdata.timeInterval;
            advdata.timePeriod += ' secs';
            advdata.timeInterval = 0;
        } else {
            advdata.timePeriod += '00:' + advdata.timeInterval;
            advdata.timeInterval = 0;
        }
    } else if (advdata.timeInterval > 0 && advdata.timeInterval < 60) {
        advdata.timePeriod += advdata.timeInterval < 10 ? '00:00:0' + advdata.timeInterval : '00:00:' + advdata.timeInterval;
        advdata.timePeriod += ' secs';
    }
}

module.exports.parseAdvArray = function (peripheral, rawAdvertisingData) {
    if (!peripheral.advdata) {
        peripheral.advdata = {};
    }
    var advdata = peripheral.advdata;
    if(!advdata.manufacturerData){
        advdata.manufacturerData = {};
    }
    if(!advdata.serviceUUIDs){
        advdata.serviceUUIDs = [];
    }
    if (!rawAdvertisingData) {
        return [];
    }
    var advArray = [];
    if (rawAdvertisingData.length % 2 === 0) {
        for (var i = 0; i < rawAdvertisingData.length; i = i + 2) {
            advArray[i / 2] = rawAdvertisingData.charAt(i) + rawAdvertisingData.charAt(i + 1);
        }
    } else {
        for (var j = 0; j < rawAdvertisingData.length; j++) {
            advArray[j] = rawAdvertisingData.charAt(2 * j) + rawAdvertisingData.charAt(2 * j + 1);
        }
    }

    do {
        var type = advArray[1];
        if (type == C.kGAP_ADTYPE_FLAGS) {
            getDiscoverable(advdata, advArray);
        } else if (type == C.kGAP_ADTYPE_POWER_LEVEL) {
            getTXLevel(advdata, advArray);
        } else if (type == C.kGAP_ADTYPE_INCOMPLETE_16BIT_SERVICEUUID || type == C.kGAP_ADTYPE_COMPLETE_16BIT_SERVICEUUID) {
            getServiceUUIDs(advdata, advArray);
        } else if (type == C.kGAP_ADTYPE_INCOMPLETE_32BIT_SERVICEUUID || type == C.kGAP_ADTYPE_COMPLETE_32BIT_SERVICEUUID) {
            getServiceUUIDs(advdata, advArray);
        } else if (type == C.kGAP_ADTYPE_INCOMPLETE_128BIT_SERVICEUUID || type == C.kGAP_ADTYPE_COMPLETE_128BIT_SERVICEUUID) {
            get128bitServiceUUIDs(advdata, advArray);
        } else if (type == C.kGAP_ADTYPE_MANUFACTURER_SPECIFIC) {
            getManufacturerData(advdata, advArray);
        } else if (type == C.kGAP_ADTYPE_16BIT_SERVICE_DATA) {
            getServiceData(advdata, advArray);
        } else if (type == "00") {
            advArray.splice(0, 1);
        } else {
            var advArrayLength = parseInt(advArray[0], 16);
            advArray.splice(0, advArrayLength + 1);
        }
        if (advArray.length === 0) {
            break;
        }
    } while (true);
};
},{"./constants":6}],10:[function(require,module,exports){
var C = require('./constants').C;
var helper = require('./message-helper');
var InternalError = require('./../errors').InternalError;
var ApplicationError = require('./../errors').ApplicationError;

module.exports.MessageHandler = function (gattip, gateway) {
    var self = this;

    this.createUserContext = function (method, params, userCallback, handler) {
        var mesg = {
            method: method,
            params: params,
            jsonrpc: "2.0"
        };
        return {originalMessage: mesg, cb:userCallback, handler:handler};
    };
    this.wrapResponse = function (cookie, params) {
        var mesg = {
            params: params,
            jsonrpc: "2.0"
        };
        helper.requireAndPopulateFieldsFromCookie('wrapResponse', cookie, mesg);
        console.log('Wrote', JSON.stringify(params));
        return mesg;
    };

    this.handleIndication = function (response) {
        if (response.error) {
            throw new ApplicationError(JSON.stringify(response));
        }

        var params = response.params;
        switch (response.result) {
            case C.kScanForPeripherals:
                var peripheral = gateway.handleScanIndication(params);
                break;
            case C.kDisconnect:
                (function () {
                    helper.requireFields('Disconnect indication', params, [C.kPeripheralUUID]);
                    var peripheral = gateway.getPeripheral(params[C.kPeripheralUUID]);
                    if (peripheral) {
                        peripheral.handleDisconnectIndication(peripheral);
                    } else {
                        console.warn("Received disconnect indication for an unknown peripheral with UUID", params[C.kPeripheralUUID]);
                    }
                })();
                break;
            case C.kSetValueNotification:
                (function () {
                    helper.requireFields('Disconnect indication', params, [C.kPeripheralUUID]);
                    var peripheral = gateway.getPeripheral(params[C.kPeripheralUUID]);
                    if (peripheral) {
                        helper.requireFields('Value notification', params, [C.kPeripheralUUID, C.kServiceUUID, C.kCharacteristicUUID, C.kValue]);
                        var objs = gateway.getObjectsFromMessage('c', response.params);
                        objs.characteristic.handleValueNotification(params);
                    } else {
                        console.warn("Received value notification for an unknown peripheral with UUID", params[C.kPeripheralUUID]);
                    }
                })();
                break;
            default:
                (function () {
                    throw new InternalError('Unknown indication received from the gateway:', JSON.stringify(response));
                })();
                break;
        }
    };
};
},{"./../errors":3,"./constants":6,"./message-helper":11}],11:[function(require,module,exports){
var C = require('./constants').C;
var constantNames = {};
var InternalError = require('./../errors').InternalError;
var ApplicationError = require('./../errors').ApplicationError;

for (var name in C) {
    var code = C[name];
    if (name.indexOf('k') == 0) {
        name = name.substring(1, name.length);
        constantNames[code] = name;
    }
}

function recursiveToString(obj) {
    var ret = '';
    if (typeof obj == 'object') {
        if (Array.isArray(obj)) {
            var val = '';
            for (var i in obj) {
                if (0 != i) {
                    ret += ' ,';
                }
                ret += obj[i];
            }
        }
        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                var value = obj[name];
                var constantName = constantNames[name];
                if (!constantName) {
                    constantName = name;
                }
                if ('object' == typeof value) {
                    if (Array.isArray(value)) {
                        ret += ' ' + constantName + ':[' + recursiveToString(value) + ']';
                    } else {
                        ret += ' ' + constantName + ':{' + recursiveToString(value) + '}';
                    }
                } else {
                    ret += ' ' + constantName + '=' + value;
                }
            }
        }
    }
    return ret;
}

module.exports.toString = function (message) {
    return recursiveToString(message.params).trim();
};

/**
 * Just a meaningful name because the requireFields function can handle
 */
module.exports.requireAndAssignParameters = function (callDescription, object, fields, values) {
    module.exports.requireFields(callDescription + " call parameters ", object, fields, values);
};


module.exports.requireBooleanValue = function (description, parameterName, value) {
    if (typeof value != 'boolean') {
        throw new ApplicationError(description + ' missing parameter ' + parameterName);
    }
};
module.exports.requireHexValue = function (description, parameterName, value) {
    if (typeof value != 'string') {
        throw new ApplicationError(description + ' missing parameter ' + parameterName);
    }
    if (value.length < 2 || value.length % 2 != 0 || !(/^[0-9a-fA-F]+$/.test(value))) {
        throw new ApplicationError(description + ' value ' + parameterName + ' is not a valid hex string');
    }
};
module.exports.requireUUID = function (description, parameterName, value) {
    if (typeof value != 'string') {
        throw new ApplicationError(description + ' missing parameter ' + parameterName);
    }
    if (value.length < 4 ||!(/^[0-9A-F-]+$/.test(value))) {
        throw new ApplicationError(description + ' value ' + parameterName + ' is not a valid UUID');
    }
};
module.exports.requireHexValues = function (description, parameterNames, hexValues) {
    var missingFields = [];
    if (!Array.isArray(parameterNames) || !Array.isArray(hexValues)) {
        throw new InternalError("Illegal use of requireHexValues");
    }
    for (var i in parameterNames) {
        var pName = parameterNames[i];
        var value = hexValues[i];

        if (typeof value != 'string' || value.length < 2 || value.length % 2 != 0 || !/^#[0-9A-F]$/i.test(value)) {
            missingFields.push(pName);
        }
    }

    if (missingFields) {
        throw new ApplicationError(description + ' missing parameters ' + missingFields);
    }
};

module.exports.requireFields = function (description, object, fields, defaultsOrValues) {
    var missingFields = [];
    if (!defaultsOrValues) {
        defaultsOrValues = {};
    }
    if (!object) {
        throw new InternalError(description + 'Object is undefined');
    }
    for (var i in fields) {
        var field = fields[i];
        if (typeof object[field] == undefined) {
            if (typeof defaultsOrValues[i] == undefined) {
                missingFields.push(fields);
            } else {
                object[field] = defaultsOrValues[i];
            }
        }
    }
    if (missingFields.length) {
        throw new InternalError(description + ' missing ' + missingFields);
    }
};

module.exports.requireAndPopulateFieldsFromCookie = function (callDescription, cookie, message) {
    if (!cookie) {
        throw new ApplicationError('Error: "' + callDescription + ' is missing the cookie');
    }
    if (!cookie.original.id) {
        throw new ApplicationError('Error: "' + callDescription + ' is missing the cookie ID');
    }
    if (!cookie.original.session_id) {
        throw new ApplicationError('Error: "' + callDescription + ' is missing the cookie session ID');
    }
    if (!cookie.original.method) {
        throw new ApplicationError('Error: "' + callDescription + ' is missing the cookie request');
    }

    message[C.kMessageId] = cookie.original.id;
    message[C.kSessionId] = cookie.original.session_id;
    message.result = cookie.result;
};

module.exports.populateParams = function (serviceTableObject, params) {
    if (!params) {
        params = {};
    }
    if (!serviceTableObject) {
        throw new InternalError('populateParams: service object is undefined');
    }

    var p;
    var s;
    var c;
    var d;
    var remainingParts = 23132;
    switch (serviceTableObject.type) {
        case 'd':
            remainingParts = 4;
            d = serviceTableObject;
            break;
        case 'c':
            remainingParts = 3;
            c = serviceTableObject;
            break;
        case 's':
            remainingParts = 2;
            s = serviceTableObject;
            break;
        case 'p':
            remainingParts = 1;
            p = serviceTableObject;
            break;
        default:
            throw new InternalError('type must be one of: "s", "c" or "d"');
            break;
    }

    function storeField(field, obj) {
        remainingParts--;
        var uuid = obj.uuid;
        if (!uuid) {
            throw new InternalError('UUID for object of type "' + obj.type + '" is missing');
        }
        params[field] = uuid;
    }

    if (d) {
        storeField(C.kDescriptorUUID, d);
        c = d.characteristic();
    }
    if (c) {
        storeField(C.kCharacteristicUUID, c);
        s = c.service();
    }
    if (s) {
        storeField(C.kServiceUUID, s);
        p = c.peripheral();
    }
    if (p) {
        storeField(C.kPeripheralUUID, p);
    }
    if (remainingParts != 0) {
        throw new InternalError('Expected ' + remainingParts + ' more parts when constructing params of ' + serviceTableObject.type);
    }
    return params;
};


},{"./../errors":3,"./constants":6}],12:[function(require,module,exports){
var ee = require('./event-emitter');
var C = require('./constants').C;
var ApplicationError = require('./../errors').ApplicationError;

var id = 1;

var hackAlert1Sent = false;
var hackAlert2Sent = false;

function MessageContext(processor, msg, userContext, timeoutMs) {
    this.msg = msg;
    this.userContext = userContext;
    if ('undefined' == typeof msg.id) {
        msg.id = Number(id++).toString();
    }
    this.id = msg.id;
    if (!timeoutMs) {
        timeoutMs = C.DEFAULT_MESSAGE_TIMEOUT_MS;
    }
    var self = this;
    this.timeout = setTimeout(function () {
            delete self.timeout;
            console.warn("Timeout occurred for message", JSON.stringify(msg));
            processor.emit('error', new ApplicationError("Timed out : "+ JSON.stringify(msg)), self.userContext.cb);
        },
        timeoutMs
    );

}

function MessageProcessor() {
    ee.instantiateEmitter(this);
    var self = this;
    var pendingMessages = {};


    /**
     *     Registers a message with ID and callback into the message queue so that we can correspond it when we get the callback and and then invoke the callback
     * @param msg Message to send
     * @param userContext an arbitrary context that will be stored and returned when the response is received
     * @param timeoutMs Optional timeout for the message response to be received
     * @returns {*}
     */
    this.register = function (msg, userContext, timeoutMs) {
        if (Object.keys(pendingMessages).length > C.MAX_PENDING_MESSAGES) {
            throw new ApplicationError("Message queue is full", msg);
        }
        var entry = new MessageContext(self, msg, userContext, timeoutMs);
        pendingMessages[entry.id] = entry;
        return entry.msg;
    };

    this.hasMessage = function (msgId) {
        var entry = pendingMessages['' + msgId];
        return !!entry;
    };

    this.onMessageReceived = function (msg) {
        var entry;
        if (msg.params && msg.params.id) {
            console.warn("HACK ALERT: ID is in params!?!");
            msg.id = msg.params.id;
        }
        if (msg.id) {
            entry = pendingMessages['' + msg.id];
        }
        if (!entry) {
            if (!msg.id) {
                if (msg.result == C.kMessage) {
                    if (!hackAlert1Sent) {
                        hackAlert1Sent = true;
                        console.warn("HACK ALERT: Hacking the authenticate message");
                    }
                    msg.id = '1';
                    entry = pendingMessages['1'];
                } else {
                    self.emit('indication', msg);
                    return;
                }
            } else {
                if (msg.result == C.kScanForPeripherals && msg.params && msg.params.bb) {
                    if (!hackAlert2Sent) {
                        hackAlert2Sent = true;
                        console.warn("HACK ALERT: Scan response has an ID");
                    }
                    self.emit('indication', msg);
                    return;
                }
                self.emit('request', msg);
                return;
            }
        }
        if (entry.timeout) {
            clearTimeout(entry.timeout);
        }
        delete pendingMessages[msg.id];
        self.emit('response', msg, entry.userContext, entry.msg);
    };
}

ee.makeEmitter(MessageProcessor);
module.exports.MessageProcessor = MessageProcessor;

},{"./../errors":3,"./constants":6,"./event-emitter":7}],13:[function(require,module,exports){
var C = require('./constants.js').C;
var ee = require('./event-emitter');

function ServerMessageHandler(gattip, gateway) {
    ee.instantiateEmitter(this);
    var self = this;

    this.processMessage = function (message) {
        var obj;

        if ((typeof message === 'undefined') || (!message)) {
            console.warn("Got unknown message from client", mesg.data);
            return;
        }

        if (message.error) {
            console.warn('Error in the Request', mesg.error);
            return;
        }

        // MESSAGE IS VALID

        if (message.result && ( (message.result == C.kMessage) || (message.result == C.kAuthenticate) ) ){
            var authenticated = false;
            if (!message.error && typeof message.params == 'object' && message.params[C.kAuthenticate] === true) {
                authenticated = true;
            }
            self.emit('authenticated', authenticated);
            return;
        }

        if (message.method && message.method == C.kAuthenticate) {
            // this is so that clients can talk to us directly, bypassing the proxy. If someone has access to the port, they should authenticate?
            console.log("Client requested to authenticate with us. Allowing the client");
            var params = {};
            params[C.kAuthenticate] = true;
            var response = {};
            response.result = C.kAuthenticate;
            response.params = params;
            response[C.kIdField] = message[C.kIdField];
            response = JSON.stringify(response);
            self.send(response);
            return;
        }

        // TODO work out some more invalid message cases....

        var cookie = {original:message};
        var p = message.params;

        function getObjects(type) {
            var peripheralUUID = p[C.kPeripheralUUID];
            var resultObj = {};

            resultObj.peripheral = gateway.getPeripheral(peripheralUUID);
            if (resultObj.peripheral && resultObj.peripheral.uuid) {
                if (type === 'p') {
                    return resultObj;
                }
                var serviceUUID = p[C.kServiceUUID];
                resultObj.service = resultObj.peripheral.findService(serviceUUID);
                if (resultObj.service && resultObj.service.uuid) {
                    if (type === 's') {
                        return resultObj;
                    }
                    var characteristicUUID = p[C.kCharacteristicUUID];
                    resultObj.characteristic = resultObj.service.findCharacteristic(characteristicUUID);
                    if (resultObj.characteristic && resultObj.characteristic.uuid) {
                        if (type === 'c') {
                            return resultObj;
                        }
                        var descriptorUUID = p[C.kDescriptorUUID];
                        resultObj.descriptor = resultObj.characteristic.findDescriptor(descriptorUUID);
                        if (resultObj.descriptor && resultObj.descriptor.uuid) {
                            return resultObj;
                        } else {
                            self.sendErrorResponse(message.method, C.kErrorDescriptorNotFound, 'Descriptor not found in the service database');
                            throw new Error('Descriptor not found');
                        }
                    } else {
                        self.sendErrorResponse(message.method, C.kErrorCharacteristicNotFound, 'Characteristic not found in the service database');
                        throw new Error('Characteristic not found');
                    }
                } else {
                    self.sendErrorResponse(message.method, C.kErrorServiceNotFound, 'Service not found in the service database');
                    throw new Error('Service not found');
                }
            } else {
                self.sendErrorResponse(message.method, C.kErrorPeripheralNotFound, 'Peripheral not found in the service database');
                throw new Error('Peripheral not found');
            }
        }

        switch (message.method) {
            case C.kConfigure:
                self.emit('configure', cookie, p[C.kShowPowerAlert], p[C.kIdentifierKey]);
                break;
            case C.kScanForPeripherals:
                self.emit('scan', cookie, p[C.kScanOptionAllowDuplicatesKey], p[C.kServiceUUIDs]);
                break;
            case C.kStopScanning:
                self.emit('stopScan', cookie);
                break;
            case C.kCentralState:
                self.emit('getCentralState', cookie);
                break;
            case C.kConnect:
                try {
                    obj = getObjects('p');
                    self.emit('connect', cookie, obj.peripheral.uuid);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kDisconnect:
                try {
                    obj = getObjects('p');
                    self.emit('disconnect', cookie, obj.peripheral.uuid);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetCharacteristicValue:
                try {
                    obj = getObjects('c', cookie);
                    self.emit('readCharacteristic', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kWriteCharacteristicValue:
                try {
                    obj = getObjects('c', cookie);
                    self.emit('writeCharacteristic', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid, message.params[C.kValue]);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kSetValueNotification:
                try {
                    obj = getObjects('c', cookie);
                    self.emit('enableNotifications', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid, message.params[C.kIsNotifying]);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kGetDescriptorValue:
                try {
                    obj = getObjects('d', cookie);
                    self.emit('readDescriptor', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid, obj.descriptor.uuid);
                } catch (ex) {
                    console.error(ex);
                }
                break;
            case C.kWriteDescriptorValue:
                try {
                    obj = getObjects('d', cookie);
                    self.emit('writeDescriptor', cookie, obj.peripheral.uuid, obj.service.uuid, obj.characteristic.uuid, obj.descriptor.uuid, message.params[C.kValue]);
                } catch (ex) {
                    console.error(ex);
                }
                break;

            default:
                console.log('invalid request' + message.method);
                self.sendErrorResponse(cookie, message.method, C.kInvalidRequest, 'Request not handled by server');
                return;
        }
    };

    self.sendErrorResponse = function (cookie, method, errorId, errMessage) {
        var mesg = {}, error = {};
        error[C.kCode] = errorId;
        error[C.kMessageField] = errMessage;
        mesg[C.kError] = error;
        mesg.result = method;
        if(cookie && cookie.original) {
            mesg[C.kMessageId] = cookie.original.id;
            mesg[C.kSessionId] = cookie.original.session_id;
        }
        gattip.sendError(mesg);
    };

    self.configureResponse = function (cookie) {
        cookie.result = C.kConfigure;
        gattip.respond(cookie, {});
    };

    self.centralStateResponse = function (cookie, state, error) {
        var params = {};
        params[C.kState] = state;
        cookie.result = C.kCentralState;
        gattip.respond(cookie, params);
    };

    self.stopScanResponse = function (cookie) {
        cookie.result = C.kStopScanning;
        gattip.respond(cookie, {});
    };

    self.disconnectResponse = function (cookie, peripheral) {
        var params = {};
        params[C.kPeripheralUUID] = peripheral.uuid;
        params[C.kPeripheralName] = peripheral.name;

        if (cookie != null) {
            gattip.respond(cookie, params);
        } else {
            gattip.sendIndications(C.kDisconnect, params);
        }
    };

    function arrayAsHex(array, pretty) {
        var ret = (pretty ? '0x' : '');
        for (var i in array) {
            var value = (array[i] & 0xFF).toString(16);
            if (value.length == 1) {
                value = '0' + value;
            }
            ret += value;
        }
        return ret;
    }

    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }

        return JSON.stringify(obj) === JSON.stringify({});
    }

    self.scanResponse = function(cookie, uuid, name, rssi, txPwr, serviceUUIDs, mfrData, svcData) {
        if(cookie){
            cookie.result = C.kScanForPeripherals;
            gattip.respond(cookie, {});
            return;
        }

        var params = {};
        var manufactData;
        var serviceData;

        if (!isEmpty(mfrData)) {
            manufactData = {};
            for (var mk in mfrData) {
                var mkey = mk.toUpperCase();
                manufactData[mkey] = arrayAsHex(mfrData[mk]).toUpperCase();
            }
        }
        if (!isEmpty(svcData)) {
            serviceData = {};
            for (var sk in svcData) {
                var skey = sk.toUpperCase();
                serviceData[skey] = arrayAsHex(svcData[sk]).toUpperCase();
            }
        }

        params[C.kPeripheralName] = name;
        params[C.kPeripheralUUID] = uuid;
        params[C.kRSSIkey] = rssi;
        params[C.kCBAdvertisementDataTxPowerLevel] = txPwr;
        params[C.kCBAdvertisementDataServiceUUIDsKey] = ((serviceUUIDs && serviceUUIDs.length > 0) ? serviceUUIDs : undefined);
        params[C.kCBAdvertisementDataManufacturerDataKey] = manufactData;
        params[C.kCBAdvertisementDataServiceDataKey] = serviceData;

        gattip.sendIndications(C.kScanForPeripherals, params);
    };

    self.addPeripheral = function (uuid, name, rssi, addata, scanData) {
        var peripheral = new Peripheral(this, uuid, name, rssi, addata, scanData);
        self.peripherals[peripheral.uuid] = peripheral;

        return peripheral;
    };



    function buildMessageFromPidCidSic(cookie, message) {
        var params = message.params;
        var pid = cookie.original.params[C.kPeripheralUUID];
        var sid = cookie.original.params[C.kServiceUUID];
        //...
        if (pid) {
            params[C.kPeripheralUUID] = pid;
        }
        if (sid) {
            params[C.kServiceUUID] = sid;
        }
        //
    }

    this.respondToConnect = function(cookie) {
        var params = {};
        buildMessageFromPidCidSic(cookie, params);
        gattip.respond(cookie, params);
    };

    function sampleLinuxGateway(gattip) {
         var smh = gattip.getServerMessageHandler();

         smh.on('enableNotifications', function(cookie, pid, sid, cid, isNotifying) {
             if (iCanNotify() && enableNotify()) {
                 smh.respondToNotify(cookie, isNotifying);
             } else {
                 smh.error(cookie, "Whatever error");
             }
         });
         smh.on('connect', function(cookie, pid) {
             if (iCanNotify) {
                 tryToConnect(pid.uuid);
                 smh.respondToConnect(cookie);
             } else {
                 smh.error(cookie, "Whatever error");
             }
         });
         function onScanFromBluez() {
             smh.scanIndication(device.uuid);
         }
     }

}

/* The following define the flags that are valid with the SecurityProperties */
this.GATM_SECURITY_PROPERTIES_NO_SECURITY = 0x00000000;
this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_ENCRYPTION_WRITE = 0x00000001;
this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_ENCRYPTION_WRITE = 0x00000002;
this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_ENCRYPTION_READ = 0x00000004;
this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_ENCRYPTION_READ = 0x00000008;
this.GATM_SECURITY_PROPERTIES_UNAUTHENTICATED_SIGNED_WRITES = 0x00000010;
this.GATM_SECURITY_PROPERTIES_AUTHENTICATED_SIGNED_WRITES = 0x00000020;

/* The following define the flags that are valid with the CharacteristicProperties */
this.GATM_CHARACTERISTIC_PROPERTIES_BROADCAST = 0x00000001;
this.GATM_CHARACTERISTIC_PROPERTIES_READ = 0x00000002;
this.GATM_CHARACTERISTIC_PROPERTIES_WRITE_WO_RESP = 0x00000004;
this.GATM_CHARACTERISTIC_PROPERTIES_WRITE = 0x00000008;
this.GATM_CHARACTERISTIC_PROPERTIES_NOTIFY = 0x00000010;
this.GATM_CHARACTERISTIC_PROPERTIES_INDICATE = 0x00000020;
this.GATM_CHARACTERISTIC_PROPERTIES_AUTHENTICATED_SIGNED_WRITES = 0x00000040;
this.GATM_CHARACTERISTIC_PROPERTIES_EXT_PROPERTIES = 0x00000080;

/* The following define the flags that are valid with the DescriptorProperties */
this.GATM_DESCRIPTOR_PROPERTIES_READ = 0x00000001;
this.GATM_DESCRIPTOR_PROPERTIES_WRITE = 0x00000002;

ee.makeEmitter(ServerMessageHandler);
module.exports.ServerMessageHandler = ServerMessageHandler;

},{"./constants.js":6,"./event-emitter":7}],14:[function(require,module,exports){
var C = require('./constants').C;
var Service = require('./../service').Service;
var Characteristic = require('./../characteristic').Characteristic;
var Descriptor = require('./../descriptor').Descriptor;

function parseDescriptorFromScanResponse(characteristic, params) {
    var duuid = params[C.kDescriptorUUID];

    var descriptor = characteristic.findDescriptor(duuid);
    if (!descriptor) {
        descriptor = new Descriptor(characteristic, duuid);
        characteristic.addDescriptor(descriptor);
    }

    descriptor.value = params[C.kValue];
}
function parseCharacteristicFromScanResponse(service, params) {
    var cuuid = params[C.kCharacteristicUUID];

    var characteristic = service.findCharacteristic(cuuid);
    if (!characteristic) {
        characteristic = new Characteristic(service, cuuid);
        service.addCharacteristic(characteristic);
    }

    characteristic.value = params[C.kValue];

    var cprops = params[C.kProperties];

    if (typeof cprops === 'object') {
        for (var flag in cprops) {
            characteristic.setProperty(
                flag,
                {
                    enabled: cprops[flag].enabled,
                    name: cprops[flag].name
                }
            );
        }
    } else {
        for (var apindex in C.AllProperties) {
            characteristic.setProperty(
                [C.AllProperties[apindex]],
                {
                    enabled: (cprops >> apindex) & 1,
                    name: C.AllProperties[apindex]
                }
            );
        }
    }
    characteristic.isNotifying = false;

    var descriptors = params[C.kDescriptors];
    if (descriptors) {
        for (var didx in descriptors) {
            var dparams = descriptors[didx];
            parseDescriptorFromScanResponse(characteristic, dparams);
        }
    }


}
function parseServiceFromScanResponse(peripheral, params) {
    var suuid = params[C.kServiceUUID];
    var service = peripheral.findService(suuid);
    if (!service) {
        service = new Service(peripheral, suuid);
        peripheral.addService(service);
    }

    var characteristics = params[C.kCharacteristics];
    if (characteristics) {
        for (var cidx in characteristics) {
            var cparams = characteristics[cidx];
            parseCharacteristicFromScanResponse(service, cparams);
        }
    }
}

module.exports.parseServiceRecord = function(peripheral, params) {
    var services = params[C.kServices];
    if (services) {
        for (var sidx in services) {
            var sparams = services[sidx];
            parseServiceFromScanResponse(peripheral, sparams)
        }
    }
};

//Parse the peripheral object & get the service DB.
function getDescriptorJsonFromCharacteristicObject(myCharacteristic) {
    var descriptor_db = {};

    if (myCharacteristic && myCharacteristic.getAllDescriptors()) {
        for (var uuid in myCharacteristic.getAllDescriptors()) {
            var temp_descriptor = {};
            temp_descriptor[C.kDescriptorUUID] = uuid;
            temp_descriptor[C.kValue] = myCharacteristic.findDescriptor(uuid).value;
            temp_descriptor[C.kProperties] = myCharacteristic.findDescriptor(uuid).properties;
            temp_descriptor[C.kIsNotifying] = myCharacteristic.findDescriptor(uuid).isNotifying;

            descriptor_db[uuid] = temp_descriptor;
        }
    }

    return descriptor_db;
}
function getCharacteristicJsonFromServiceObject(myService) {
    var characteristic_db = {};

    if (myService && myService.getAllCharacteristics()) {
        for (var uuid in myService.getAllCharacteristics()) {
            var temp_characteristic = {};
            temp_characteristic[C.kCharacteristicUUID] = uuid;
            temp_characteristic[C.kValue] = myService.findCharacteristic(uuid).value;
            temp_characteristic[C.kProperties] = myService.findCharacteristic(uuid).allProperties();
            temp_characteristic[C.kIsNotifying] = myService.findCharacteristic(uuid).isNotifying;
            temp_characteristic[C.kDescriptors] = getDescriptorJsonFromCharacteristicObject(myService.findCharacteristic(uuid));

            characteristic_db[uuid] = temp_characteristic;
        }
    }

    return characteristic_db;
}

module.exports.getServiceJsonFromPeripheralObject = function(myPeripheral) {
    var service_db = {};

    if (myPeripheral && myPeripheral.getAllServices()) {
        for (var uuid in myPeripheral.getAllServices()) {
            var temp_service = {};
            temp_service[C.kServiceUUID] = uuid;
            temp_service[C.kIsPrimaryKey] = myPeripheral.findService(uuid).isPrimary;
            temp_service[C.kCharacteristics] = getCharacteristicJsonFromServiceObject(myPeripheral.findService(uuid));

            service_db[uuid] = temp_service;
        }
    }

    return service_db;
};


},{"./../characteristic":1,"./../descriptor":2,"./../service":16,"./constants":6}],15:[function(require,module,exports){
var C = require('./lib/constants.js').C;
var helper = require('./lib/message-helper');
var advDataParser = require('./lib/message-advdata-parser');
var ee = require("./lib/event-emitter");
var serviceTable = require("./lib/service-table");
var Service = require("./service").Service;

function pushUnique(array, item) {
    if (array.indexOf(item) == -1) {
        array.push(item);
        return true;
    }
    return false;
}


// TODO: Errors if not connected
function Peripheral(gattip, uuid, name, rssi, addata, scanData) {
    ee.instantiateEmitter(this);
    var self = this;
    this.type = 'p';
    this.uuid = uuid;
    this.isConnected = false;
    var services = {};
    var manufacturerData = {};
    var serviceData = {};
    var serviceUUIDs = [];
    // constructor continues below
    this._updateFromScanData = function (name, rssi, txPwr, service_UUIDs, mfrData, svcData, addata, scanData) {
        this.name = name;
        this.rssi = rssi;
        this.txPowerLevel = txPwr;
        var advertisementData = addata;
        var scanData = scanData;

        if (mfrData) {
            for (var mfrId in mfrData) {
                manufacturerData[mfrId] = mfrData[mfrId];
            }
        }
        if (serviceData) {
            for (var serUUID in svcData) {
                serviceData[serUUID] = svcData[serUUID];
            }
        }
        if (service_UUIDs) {
            for (var sidx = 0; sidx < service_UUIDs.length; sidx++) {
                pushUnique(serviceUUIDs, service_UUIDs[sidx]);
            }
        }
        if (addata) {
            advDataParser.parseAdvArray(self, addata.c2);
        }

    };
    this.findService = function (uuid) {
        return services[uuid];
    };
    this.getMfrData = function (mfrId) {
        // id as hex string
        return manufacturerData[mfrId];
    };
    this.getSvcData = function (svcId) {
        // id as hex string
        return serviceData[svcId];
    };
    this.hasAdvertisedServiceUUID = function (serviceUUID) {
        return (serviceUUIDs.indexOf(serviceUUID) >= 0);
    };
    this.getAllServices = function () {
        return services;
    };
    this.getAllMfrData = function () {
        return manufacturerData;
    };
    this.getAllSvcData = function () {
        return serviceData;
    };
    this.getAllAdvertisedServiceUUIDs = function () {
        return serviceUUIDs;
    };
    this.addServiceWithUUID = function (serviceUUID) {
        var service = new Service(self, serviceUUID);
        return services[serviceUUID] = service;
    };
    this.addService = function (service) {
        return services[service.uuid] = service;
    };
    this.gattip = function () {
        return gattip;
    };


    // SERVER RESPONSES/INDICATIONS  ============================

    this.connectOnce = function (callback) {
        // TODO: Error if already connected
        var params = helper.populateParams(self);
        gattip.request(C.kConnect, params, callback, function (params) {
            serviceTable.parseServiceRecord(self, params);
            self.isConnected = true;
            gattip.fulfill(callback, self);
        });
    };


    /**
     * Attempts to connect to the peripheral
     * @param callback
     * @param config Optional object with numConnectAttempts. This value defaults to 3,
     * but may change to 1 in the future
     */
    this.connect = function (callback, config) {
        // TODO: Error if already connected

        var fullfillCb = (typeof callback == 'object' ? callback.fulfill : callback);

        var tries = 0;

        if (config && typeof config.numConnectAttempts == 'number') {
            tries = config.numConnectAttempts;
        }
        function tryConnect(error) {
            if (tries != 0) {
                console.log("Failed to connect. Error was", error, "Attempting", C.NUM_CONNECT_ATTEMPTS - tries, "more times");
            }
            tries++;
            if (tries <= C.NUM_CONNECT_ATTEMPTS) {
                self.connectOnce({fulfill: fullfillCb, reject: tryConnect});
            } else {
                gattip.reject(callback, error)
            }
        }

        tryConnect();
    };

    this.disconnect = function (callback) {
        // TODO: Error if not connected
        var params = helper.populateParams(self);
        gattip.request(C.kDisconnect, params, callback, function (params) {
            self.isConnected = false;
            gattip.fulfill(callback, self);
        });
    };

    this.respondToConnectRequest = function (cookie) {
        var peripheral_db = {};
        peripheral_db[C.kPeripheralUUID] = this.uuid;
        peripheral_db[C.kPeripheralName] = this.name;

        var service_db;
        service_db = serviceTable.getServiceJsonFromPeripheralObject(this);
        peripheral_db[C.kServices] = service_db;

        cookie.result = C.kConnect;
        gattip.respond(cookie, peripheral_db);
    };

    this.handleDisconnectIndication = function () {
        self.isConnected = false;
        self.emit('disconnected', self);
    };

    this._updateFromScanData(name, rssi, addata, scanData);
}

ee.makeEmitter(Peripheral);

module.exports.Peripheral = Peripheral;

},{"./lib/constants.js":6,"./lib/event-emitter":7,"./lib/message-advdata-parser":9,"./lib/message-helper":11,"./lib/service-table":14,"./service":16}],16:[function(require,module,exports){
var helper = require('./lib/message-helper');
var Characteristic = require('./characteristic').Characteristic;

function Service(peripheral, uuid) {
    var self = this;
    var gattip = peripheral.gattip();
    var characteristics = {};

    helper.requireUUID('Service', 'uuid', uuid);
    this.uuid = uuid;
    this.type = 's';

    this.isPrimary = true; //TODO: read from remote
    // TODO: this.includedServices = {};

    this.peripheral = function () {
        return peripheral;
    };
    this.gattip = function () {
        return gattip;
    };
    this.getAllCharacteristics = function () {
        return characteristics;
    };
    this.findCharacteristic = function (uuid) {
        return characteristics[uuid];
    };
    this.addCharacteristicWithUUID = function (characteristicUUID, properties) {
        var characteristic = new Characteristic(self, characteristicUUID, properties);
        return characteristics[characteristicUUID] = characteristic;
    };

    this.addCharacteristic = function (characteristic) {
        characteristics[characteristic.uuid] = characteristic;
    };
}

exports.Service = Service;


},{"./characteristic":1,"./lib/message-helper":11}],17:[function(require,module,exports){

},{}],18:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],19:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],20:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],21:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],22:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":21,"_process":20,"inherits":19}],"gatt-ip":[function(require,module,exports){
module.exports.GATTIP = require('./gattip').GATTIP;
module.exports.GattIpServer = require('./lib/gattip-server').GattIpServer;

},{"./gattip":5,"./lib/gattip-server":8}]},{},[]);
