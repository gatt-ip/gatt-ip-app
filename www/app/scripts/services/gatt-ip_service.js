var url = "ws://localhost:6001"; //default
// var url = "ws://192.168.1.27:54326";
var GATTIP = require('gatt-ip').GATTIP;
var isGattipApp = false;

//called from native side
function connectWithPort(port) {
    isGattipApp = true;
    url = "ws://localhost:" + port;
    return url;
}

function initialiseGattip() {

    var g;
    var ws;

    function BLEEXPLORER() {
        this.peripheral = {};

        g = new GATTIP();

        ws = new WebSocket(url);

        ws.onopen = function() {
            g.open({
                stream: ws
            });
        };

        g.once('state', function(state) {
            window.bleexplorer.showAlert("Please turn on Bluetooth to scan peripherals.");
        });

        g.once('ready', function(gateway) {
            window.bleexplorer._currentgateway = gateway;
            // console.log('ready');
            window.bleexplorer.scanStarts();
            window.bleexplorer._currentgateway.scan(function() {
                // console.log('Started scan');
                window.bleexplorer._currentgateway.on('scan', window.bleexplorer.onScan);
            });
        });

        g.on('error', function(err) {
            console.log(err);
            if (window.bleexplorer.isShowingLoadingIndic && !window.bleexplorer.filterScan) {
                window.bleexplorer.hideDialog();
            }

            if (err.message.indexOf('Device could not be connected') > 0 || err.message.indexOf('Timed out while waiting for discovery to complete') > 0) {
                window.bleexplorer.showAlert('Device could not be connected! Try again');
            } else if (err.message.indexOf('Device is disconnected while discovering services') > 0) {
                window.bleexplorer.showAlert('Device is disconnected while discovering services..');
            } else if (err.message.indexOf('Failed to get services') > 0) {
                window.bleexplorer.showAlert('Failed to get services. Try again');
            } else if (err.message.indexOf('Unexpectedly disconnected') > 0) {
                window.bleexplorer.showAlert('Device is disconnected! Try again');
                window.bleexplorer.currentPeripheral = null;
                window.bleexplorer.mainState();
                window.bleexplorer.scanStarts();
                window.bleexplorer._currentgateway.scan(function() {
                    // console.log('Started scan');
                    window.bleexplorer._currentgateway.on('scan', window.bleexplorer.onScan);
                });
            } else if (err.message.indexOf('Invalid Length') > 0 || err.message.indexOf('length is invalid') > 0) {
                window.bleexplorer.showAlert('Invalid Length. Please check the entered value');
            } else if (err.message.indexOf('Timed out') > 0) {
                window.bleexplorer.showAlert('Timed out while processing the Request');
            } else if (err.message.indexOf('Unable to find the requested device') > 0) {
                window.bleexplorer.showAlert('Sorry, unable to find the requested device. Issue a scan first');
            }
        });
    }
    window.bleexplorer = new BLEEXPLORER();
}