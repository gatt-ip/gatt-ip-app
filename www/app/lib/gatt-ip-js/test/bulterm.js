var Promise = require('promise');

function bullterm() {
    var GATTIP = require('gatt-ip').GATTIP;
    var g = new GATTIP();
    //g.traceEnabled = true;

    function logError(error) {
        console.error("Error:", error.message);
        if (error.stack) {
            console.error("Error Stack:", error.stack);
        }
    }

    g.open({
        //trace:true,
        url: 'wss://dev-proxy.blueapp.io',
        //token = Nix PC
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdpZCI6NDQ4MjA2NDcwLCJnYXRld2F5SWQiOjIwMDExODA3OSwiaXNHYXRld2F5IjpmYWxzZSwiZmlsdGVyU2NhbiI6ZmFsc2UsImlhdCI6MTQ2Nzc1NzkzNiwiZXhwIjoxNDY3NzY1MTM2fQ.8DzdqCThQBtxFsrp7lAEM0Pm3Xytfl0zPi2hq9PeR9g",
        scanFilters: {uuids:['C1:BC:E2:5E:D9:F0']}
    });

    function failToWriteACharacteristicWithPromise(peripheral) {
        var SUUID = '0ABB1530-685E-11E5-9D70-FEFF819CDC9F';
        var CUUID = '0ABB1534-685E-11E5-9D70-FEFF819CDC9F';

        var svc = peripheral.findService(SUUID);
        if (svc) {
            var char  = svc.findCharacteristic(CUUID);
            new Promise(function(fulfill, reject) {
                char.writeValue({fulfill:fulfill, reject:reject}, "01");
            }).then(function (str) {
                console.error("Wrote 01 to non-writable characteristic (Should not happen)");
            }).catch(function (error) {
                console.log("Caught expected error:", error.message);
            });
        } else {
            console.error("Service not found");
        }
    }

    function readSomeCharacteristic(peripheral) {
        var SUUID = '0ABB1530-685E-11E5-9D70-FEFF819CDC9F';
        var CUUID = '0ABB1534-685E-11E5-9D70-FEFF819CDC9F';

        var svc = peripheral.findService(SUUID);
        if (svc) {
            var char  = svc.findCharacteristic(CUUID);
            if (char) {
                char.readValue(function (char, value) {
                    console.log("Got value ", value);
                    setTimeout(function () {
                        char.peripheral().disconnect(function () {
                            console.log("Disconnected from peripheral");
                        });
                    }, 2000);
                })
            }
        } else {
            console.error("Service not found");
        }
    }

    g.once('ready', function (gateway) {
        function onScan(peripheral) {
            console.log('Found peripheral', peripheral.name);
            if (peripheral.name == "BulTerm") {
                gateway.removeListener('scan', onScan);
                gateway.stopScan(function () {
                    peripheral.connect(function () {
                        console.log('Found', Object.keys(peripheral.getAllServices()).length, 'services');
                        readSomeCharacteristic(peripheral);
                        failToWriteACharacteristicWithPromise(peripheral);
                    });
                });
            }
            peripheral.once('disconnected', function(peripheral) {
                console.error('Peripheral', peripheral.uuid, 'disconnected');
            })
        }
        console.log('ready');
        gateway.scan(function () {
            console.log('Started scan');
            gateway.on('scan', onScan);
        });
    });

    g.on('error', function (err) {
        logError(err);
    });
}

if (typeof window == 'undefined') {
    // node only
    bullterm();
}