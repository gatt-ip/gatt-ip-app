var url = "ws://localhost:6001"; //default

//called from native side
function connectWithPort(port) {
    url = "ws://localhost:" + port;
    return url;
}

app.factory('gattip', ['$q', '$rootScope', '$location',
    function($q, $rootScope, $location) {
        var util = Util();
        var isFirstTime = true;
        var g = new GATTIP();
        g.init(url);

        g.oninit = function(params, error) {
            g.configure(true);
        };
        g.onconfigure = function (params, error) {
            g.centralState();
        };
        g.onstate = function(error) {
            if (g.state === GATTIP.kPoweredOn) {
                g.scan(true);
            } else if (g.state === GATTIP.kPoweredOff) {
                setTimeout(function() {
                    g.centralState();
                }, 3000);
                       
                if(isFirstTime) {
                    $rootScope.$apply(function() {
                        $location.path('/devicelist');
                        util.show_alert("Please turn on Bluetooth to scan peripherals.");
                    });
                    isFirstTime = false;
                }
            } else if (g.state === GATTIP.kUnsupported) {
                util.show_alert("Bluetooth Low Energy is not supported with this device.");
            } else {
                //TODO:other error cases
            }
        };

        g.onscan = function(peripheral, error) {
            if (error) {
                util.show_alert(error.code + ': ' + error.message);
                return;
            }
            util.updatesignalimage(peripheral);
            $rootScope.$apply();
        };

        g.onconnect = function(peripheral, error) {
            if (error) {
                util.show_alert(error.code + ': ' + error.message);
                return;
            }
            g.currentPeripheral = peripheral;
            peripheral.discoverServices();
        };


        g.ondisconnect = function(peripheral, error) {
            g.currentPeripheral = null;

            if (error && error.message) util.show_alert(error.code + ': ' + error.message);

            $rootScope.$apply(function() {
                $location.path('/devicelist');
            });
        };

        g.ondiscoverServices = function(peripheral, error) {
            if (error) {
                util.show_alert(error.code + ': ' + error.message);
                return;
            }
            $rootScope.$apply(function() {
                $location.path('/servicelist');
            });
        };

        g.ondiscoverCharacteristics = function(peripheral, service, error) {
            if (error) {
                util.show_alert(error.code + ': ' + error.message);
                return;
            }
            g.currentService = service;
            $rootScope.$apply(function() {
                $location.path('/characteristiclist');
            });
        };

        g.ondiscoverDescriptors = function(peripheral, service, characteristic, error) {
            if (error) {
                util.show_alert(error.code + ': ' + error.message);
                return;
            }
            g.currentCharacteristic = characteristic;

            if (characteristic.properties[1].enabled)
                characteristic.read();

            $rootScope.$apply(function() {
                $location.path('/descriptorlist');
            });
        };

        g.onupdateValue = function(peripheral, service, characteristic, error) {
            if (error) {
                util.show_alert(error.code + ': ' + error.message);
                return;
            }
            $rootScope.$apply();
        };

        g.onwriteValue = function(peripheral, service, characteristic, error) {
            if (error) {
                util.show_alert(error.code + ': ' + error.message);
                return;
            }
            $rootScope.$apply();
        };
        return g;

    }
]);