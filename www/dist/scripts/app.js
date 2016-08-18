var app;
(function() {
    app = angular.module('bleExplorerApp', ['ngMaterial', "ui.router"])
        .config(function($stateProvider, $urlRouterProvider, $mdThemingProvider) {

            $stateProvider
                .state('devicelist', {
                    url: "/devicelist",
                    templateUrl: "views/devicelist.html",
                    controller: "devicelistCtrl"
                })
                .state('servicelist', {
                    url: "/servicelist",
                    templateUrl: "views/servicelist.html",
                    controller: "servicelistCtrl"
                })
                .state('characteristiclist', {
                    url: "/characteristiclist",
                    templateUrl: "views/characteristiclist.html",
                    controller: "characteristiclistCtrl"
                })
                .state('descriptorlist', {
                    url: "/descriptorlist",
                    templateUrl: "views/descriptorlist.html",
                    controller: "descriptorlistCtrl"
                });

            $urlRouterProvider.otherwise('/devicelist');

            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('pink');
            $mdThemingProvider.theme('success-toast');
            $mdThemingProvider.theme('error-toast');
        });

})();


app.run(['$document', '$window', function($document, $window) {
    var document = $document[0]; //unwrap the document from the jquery wrapper // RMB HACK FOR IPAD NOT FOCUSING INPUTS INSIDE IFRAME 
    document.addEventListener('click', function(event) {
        var hasFocus = document.hasFocus();
        if (!hasFocus) $window.focus();
    });
}])

app.controller('characteristiclistCtrl', function($scope, $state) {
    // console.log('characteristiclistCtrl');
    if(isGattipApp) $scope.isGattipApp = true;
    $scope.bleexplorer = bleexplorer;

    if($scope.bleexplorer.isNotifying){
        $scope.bleexplorer.currentCharacteristic.enableNotifications(function(charac, value) {
            $scope.bleexplorer.isNotifying = value;
            // console.log('Disable the notification ', value);
        }, false);
    }

    $scope.discoverDescriptors = function(characteristic) {
        $scope.bleexplorer.currentCharacteristic = characteristic;
        $state.go('descriptorlist');
    };

    $scope.back = function() {
        history.go(-1);
    };

    $scope.gotologview = function() {
        window.location = 'gatt-ip://logview';
    };
});
app.controller('descriptorlistCtrl', function($scope, $state) {
    // console.log('descriptorlistCtrl');
    if(isGattipApp) $scope.isGattipApp = true;
    $scope.bleexplorer = bleexplorer;

    $scope.readformat = "Hex";
    $scope.writeformat = 'Hex';

    var util = new Util();
    $scope.bleexplorer.isNotifying = false;
    var charValue = '';

    if ($scope.bleexplorer.currentCharacteristic.properties.Read && $scope.bleexplorer.currentCharacteristic.properties.Read.enabled) {
        $scope.bleexplorer.currentCharacteristic.readValue(function(char, value) {
            // console.log("Got value ", value);
            charValue = value;
            $scope.changeFormat();
        });
    }

    $scope.changeFormat = function() {
        switch ($scope.readformat) {
            case 'ASCII':
                $scope.currentValue = util.hex2a(charValue);
                break;
            case 'Int':
                $scope.currentValue = util.hex2dec(charValue);
                break;
            case 'Binary':
                $scope.currentValue = util.hex2b(charValue);
                break;
            default:
                $scope.currentValue = charValue;
                break;
        }
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };

    $scope.writeValue = function() {
        var writeTemp = '';
        if ($scope.inputs !== '' && $scope.inputs !== null && $scope.inputs !== undefined) {
            switch ($scope.writeformat) {
                case 'ASCII':
                    writeTemp = util.a2hex($scope.inputs);
                    $scope.bleexplorer.currentCharacteristic.writeValue(function(char) {
                        // console.log('write success');
                        $scope.bleexplorer.onSuccess('Successfully wrote the value ');
                    }, writeTemp);
                    break;
                case 'Int':
                    writeTemp = util.dec2hex($scope.inputs);
                    $scope.bleexplorer.currentCharacteristic.writeValue(function(char) {
                        // console.log('write success');
                        $scope.bleexplorer.onSuccess('Successfully wrote the value ');
                    }, writeTemp);
                    break;
                case 'Binary':
                    writeTemp = $scope.inputs; //TODO
                    break;
                default:
                    writeTemp = $scope.inputs;
                    if (util.isValidHex(writeTemp)) {
                        $scope.bleexplorer.currentCharacteristic.writeValue(function(char) {
                            // console.log('write success');
                            $scope.bleexplorer.onSuccess('Successfully wrote the value ');
                        }, writeTemp);
                    } else {
                        $scope.bleexplorer.showAlert('Entered Hex is Invalid.');
                    }
                    break;
            }
        } else {
            $scope.bleexplorer.showAlert('Enter the value to write.');
        }
    };

    $scope.readAgain = function() {
        if ($scope.bleexplorer.currentCharacteristic.properties.Read && $scope.bleexplorer.currentCharacteristic.properties.Read.enabled) {
            $scope.bleexplorer.currentCharacteristic.readValue(function(char, value) {
                // console.log("Got value ", value);
                charValue = value;
                $scope.changeFormat();
            });
        }
    };

    $scope.notify = function() {
        var value = '';
        $scope.bleexplorer.currentCharacteristic.on('valueChange', function(charac) {
            charValue = charac.value;
            $scope.changeFormat();
        }, value);
        $scope.bleexplorer.currentCharacteristic.enableNotifications(function(charac, value) {
            $scope.bleexplorer.isNotifying = value;
            // console.log('Enabled the notification ', value);
            $scope.$apply();
        }, true);
    };

    $scope.stopNotify = function() {
        $scope.bleexplorer.currentCharacteristic.enableNotifications(function(charac, value) {
            $scope.bleexplorer.isNotifying = value;
            // console.log('Disable the notification ', value);
            $scope.$apply();
        }, false);
    };

    $scope.back = function() {
        history.go(-1);
    };

    $scope.gotologview = function() {
        window.location = 'gatt-ip://logview';
    };

});
function DeviceInfoController($scope, $mdDialog, peripheral) {
    // console.log('DeviceInfoController');
    $scope.peripheral = peripheral;
    var util = new Util();
    
    function showdata(peripheral) {
        $scope.name = $scope.peripheral.name;
        $scope.uuid = $scope.peripheral.uuid;
        if ($scope.peripheral.advdata && $scope.peripheral.advdata !== undefined) {
            $scope.discoverable = $scope.peripheral.advdata.discoverable;
        } else {
            $scope.discoverable = $scope.peripheral.discoverable;
        }
        if ($scope.peripheral.advdata && $scope.peripheral.advdata.txPowerLevel !== undefined) {
            $scope.txpowerLevel = $scope.peripheral.advdata.txPowerLevel;
        } else {
            $scope.txpowerLevel = $scope.peripheral.txPowerLevel;
        }
        if ($scope.peripheral.advdata && peripheral.advdata.serviceUUIDs.length > 0) {
            $scope.serviceUUIDs = $scope.peripheral.advdata.serviceUUIDs;
        } else {
            $scope.serviceUUIDs = $scope.peripheral.getAllAdvertisedServiceUUIDs();
        }
        if ($scope.peripheral.advdata && !util.isEmpty($scope.peripheral.advdata.manufacturerData)) {
            $scope.manufacturerData = $scope.peripheral.advdata.manufacturerData;
        } else {
            $scope.manufacturerData = $scope.peripheral.getAllMfrData();
        }
        if(Object.keys($scope.manufacturerData).length === 0){
            $scope.manufacturerData = undefined;
        }
        $scope.rssi = $scope.peripheral.rssi;
    }
    
    $scope.showformat = 'Hex';
    showdata($scope.peripheral);
    $scope.peripheral1 = $scope.peripheral;

    $scope.changeDataFormat = function(position) {

        showdata($scope.peripheral1);
        switch (position.showformat) {
            case '01':
                if ($scope.peripheral1.manufacturerData) {
                    $scope.manufacturerData = util.hex2a($scope.peripheral1.manufacturerData);
                }
                if ($scope.peripheral1.rawAdvertisingData) {
                    $scope.rawAdvertisingData = util.hex2a($scope.peripheral1.rawAdvertisingData);
                }
                break;
            case '02':
                if ($scope.peripheral1.manufacturerData) {
                    $scope.manufacturerData = util.hex2dec($scope.peripheral1.manufacturerData);
                }
                if ($scope.peripheral1.rawAdvertisingData) {
                    $scope.rawAdvertisingData = util.hex2dec($scope.peripheral1.rawAdvertisingData);
                }
                break;
            default:
                $scope.manufacturerData = $scope.peripheral1.manufacturerData;
                $scope.rawAdvertisingData = $scope.peripheral1.rawAdvertisingData;
                break;
        }
    };

    $scope.okClick = function() {
        $mdDialog.cancel();
    };
}

function LoadingIndicatorController($scope, loadingText) {
    // console.log('LoadingIndicController');
    $scope.bleexplorer = bleexplorer;
    $scope.bleexplorer.isShowingLoadingIndic = true;
    $scope.loading_text = loadingText;
}

function NoDeviceFoundController($scope, $mdDialog, $timeout) {
    // console.log('NoDeviceFoundController');
    $scope.loading_text = "No devices found with given filters. Do you want to display all near by devices ?";
    $scope.bleexplorer = bleexplorer;

    $scope.okClick = function() {
        $mdDialog.hide();
        $scope.bleexplorer._currentgateway.stopScan(function() {
            $scope.bleexplorer.filtername = '';
            $scope.bleexplorer.filteruuid = '';
            $scope.bleexplorer.showLoadingIndicator('', 'Scanning for Peripherals....');
            $scope.bleexplorer.stopScanEvent($scope.bleexplorer.filtername, $scope.bleexplorer.filteruuid);
            $scope.bleexplorer._currentgateway.scan(function() {
                // console.log('Re-Started scan');
                $scope.bleexplorer._currentgateway.on('scan', $scope.bleexplorer.onScan);
                $timeout(function() {
                    if (($scope.bleexplorer.scanned_perips_length === undefined || $scope.bleexplorer.scanned_perips_length < 1 ) && $scope.bleexplorer.filterFound === false) {
                        $scope.bleexplorer.showNoDeviceFoundDialog();
                        $scope.bleexplorer.filterFound = false
                    }
                }, 7000);
            });
        });
    };
}

function alertDialogController($scope, $mdDialog, alertText) {
    // console.log('alertDialogController');
    $scope.alert_text = alertText;

    $scope.okClick = function() {
        $mdDialog.hide();
    };
}

app.controller('devicelistCtrl', function($scope, $state, $stateParams, $mdDialog, $mdToast, $mdBottomSheet) {
    // console.log('devicelistCtrl');

    if (isGattipApp) $scope.isGattipApp = true;

    initialiseGattip();

    $scope.bleexplorer = bleexplorer;
    var util = new Util();
    $scope.scanOption = 'Stop Scan';
    $scope.showOption = 'Stop Scan';

    $scope.userFilters = "No Filters";
    $scope.isScanning = false;
    $scope.bleexplorer.scanned_perips = [];
    $scope.bleexplorer.filterScan = false;
    $scope.bleexplorer.filtername = '';
    $scope.bleexplorer.filteruuid = '';

    function startScan() {
        $scope.bleexplorer.currentPeripheral = null;
        $scope.perip_connect = false;
        $scope.isScanning = false;
        $scope.bleexplorer.scanned_perips = [];

        $scope.bleexplorer._currentgateway.stopScan(function() {
            $scope.bleexplorer.showLoadingIndicator('', 'Scanning for Peripherals....');
            $scope.bleexplorer._currentgateway.scan(function() {
                // console.log('Started scan');
                $scope.bleexplorer._currentgateway.on('scan', $scope.bleexplorer.onScan);
            });
        });
    }

    function disConnectFunc() {
        $scope.bleexplorer.onError('Peripheral disconnected.');
        startScan();
    }

    if ($scope.bleexplorer.currentPeripheral) {
        $scope.bleexplorer.currentPeripheral.disconnect(function(peripheral) {
            // console.log('Peripheral ', peripheral.uuid, ' disconnected');
            disConnectFunc();
        });
    }

    $scope.bleexplorer.onSuccess = function(message) {
        $mdToast.show(
            $mdToast.simple()
            .textContent(message)
            .position('top')
            .theme("success-toast")
            .hideDelay(2500)
        );
    };

    $scope.bleexplorer.onError = function(message) {
        $mdToast.show(
            $mdToast.simple()
            .textContent(message)
            .position('top')
            .theme('error-toast')
            .hideDelay(2500)
        );
    };

    $scope.bleexplorer.scanStarts = function(message) {
        $scope.bleexplorer.showLoadingIndicator('', 'Scanning for Peripherals....');
    };

    $scope.bleexplorer.mainState = function() {
        $state.go('devicelist');
    };

    $scope.bleexplorer.stopScanEvent = function(filtername, filteruuid) {
        $scope.perip_connect = false;
        $scope.isScanning = false;
        $scope.bleexplorer.scanned_perips = [];
        $scope.scanOption = 'Scan';
        $scope.showOption = 'Scan';

        if (filtername !== '' && typeof filtername !== 'undefined') {
            $scope.userFilters = filtername;
            if (filteruuid !== '' && typeof filteruuid !== 'undefined') {
                $scope.userFilters = $scope.userFilters + ' ' + filteruuid;
            }
        } else if (filteruuid !== '' && typeof filteruuid !== 'undefined') {
            $scope.userFilters = filteruuid;
        } else {
            $scope.userFilters = "No Filters";
        }
    };

    $scope.openMenu = function($mdOpenMenu, ev) {
        if ($scope.showOption === 'Stop Scan') {
            $scope.scanStopScan();
        } else {
            $mdOpenMenu(ev);
        }
    };

    $scope.scanStopScan = function() {
        $scope.bleexplorer.filterScan = false;
        if ($scope.isScanning) {
            $scope.bleexplorer._currentgateway.stopScan(function() {
                $scope.isScanning = false;
                $scope.scanOption = 'Scan';
                $scope.showOption = 'Options';
                $scope.$apply();
            });
        } else {
            $scope.bleexplorer.currentPeripheral = null;
            $scope.perip_connect = false;
            $scope.isScanning = false;
            $scope.bleexplorer.scanned_perips = [];
            $scope.bleexplorer.filtername = '';
            $scope.bleexplorer.filteruuid = '';
            $scope.bleexplorer.stopScanEvent();

            $scope.bleexplorer.showLoadingIndicator('', 'Scanning for Peripherals....');
            $scope.bleexplorer._currentgateway.scan(function() {
                // console.log('Started scan');
                $scope.scanOption = 'Stop Scan';
                $scope.showOption = 'Stop Scan';
                $scope.$apply();
                $scope.bleexplorer._currentgateway.on('scan', $scope.bleexplorer.onScan);
            });
        }
    };

    $scope.sortByName = function() {
        $scope.showOption = 'Sort by Name';
        $scope.bleexplorer.scanned_perips.sort(function(a, b) {
            return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
        });
    };

    $scope.sortByRSSI = function() {
        $scope.showOption = 'Sort by Near';
        $scope.bleexplorer.scanned_perips.sort(function(a, b) {
            return (Math.abs(a.rssi) > Math.abs(b.rssi) ? 1 : -1);
        });
    };

    $scope.bleexplorer.onScan = function(peripheral) {
        $scope.scanOption = 'Stop Scan';
        $scope.showOption = 'Stop Scan';

        if (!$scope.isScanning) {
            $scope.isScanning = true;

            $scope.devices_align = true;
            setTimeout(function() {
                $scope.devices_align = false;
            }, 3 * 1000);
        }

        util.updatesignalimage(peripheral);
        if (peripheral.advdata && peripheral.advdata.txPowerLevel !== undefined) {
            peripheral.txpowerLevel = peripheral.advdata.txPowerLevel;
        } else {
            peripheral.txpowerLevel = peripheral.txPowerLevel;
        }
        if (peripheral.advdata && peripheral.advdata.serviceUUIDs.length > 0) {
            peripheral.serviceUUIDs = peripheral.advdata.serviceUUIDs;
        } else {
            peripheral.serviceUUIDs = peripheral.getAllAdvertisedServiceUUIDs();
        }

        //Getting the user entered filters
        var filtername = $scope.bleexplorer.filtername;
        var filteruuid = $scope.bleexplorer.filteruuid;

        var serv_arr = [];
        if (filteruuid !== '' && typeof filteruuid !== 'undefined') {
            serv_arr = filteruuid.trim().split(/\s*,\s*/);
            for (var i = 0; i < serv_arr.length; i++) {
                serv_arr[i] = serv_arr[i].toUpperCase();
            }
        }

        var foundServices = false;
        var count = 0;
        // Checking user enter's both the filters or not
        if ((serv_arr.length > 0) && (filtername !== '' && typeof filtername !== 'undefined')) {
            if (serv_arr.length > 0) {
                for (var k = 0; k < serv_arr.length; k++) {
                    if (typeof peripheral.serviceUUIDs !== 'undefined' && peripheral.serviceUUIDs.length > 0) {
                        if (peripheral.serviceUUIDs.indexOf(serv_arr[k]) > -1) {
                            count++;
                        }
                    }
                }
                if (count > 0) {
                    foundServices = true;
                }
                if (foundServices && ((peripheral.name.toUpperCase() === filtername.toUpperCase()) || (peripheral.name.toUpperCase().indexOf(filtername.toUpperCase()) > -1))) {
                    $scope.bleexplorer.scanned_perips = util.pushUniqueObj($scope.bleexplorer.scanned_perips, peripheral);
                    $scope.bleexplorer.filter_scanned_perips = util.pushUniqueObj($scope.bleexplorer.filter_scanned_perips, peripheral);
                    $scope.bleexplorer.filterFound = true;
                    if ($scope.bleexplorer.isShowingLoadingIndic) $scope.bleexplorer.hideDialog();
                }
            }
        }
        // Checking whether user entered any filter or not
        else if ((serv_arr.length > 0) || (filtername !== '' && typeof filtername !== 'undefined')) {
            // filtering based on service UUID's
            if (serv_arr.length > 0) {
                for (var j = 0; j < serv_arr.length; j++) {
                    if (typeof peripheral.serviceUUIDs !== 'undefined' && peripheral.serviceUUIDs.length > 0) {
                        if (peripheral.serviceUUIDs.indexOf(serv_arr[j]) > -1) {
                            count++;
                        }
                    }
                }
                if (count > 0) {
                    foundServices = true;
                }
                if (foundServices) {
                    $scope.bleexplorer.scanned_perips = util.pushUniqueObj($scope.bleexplorer.scanned_perips, peripheral);
                    $scope.bleexplorer.filter_scanned_perips = util.pushUniqueObj($scope.bleexplorer.filter_scanned_perips, peripheral);
                    $scope.bleexplorer.filterFound = true;
                    if ($scope.bleexplorer.isShowingLoadingIndic) $scope.bleexplorer.hideDialog();
                }
            }
            // filtering based on Name
            if ((filtername !== '' && typeof filtername !== 'undefined')) {
                if ((peripheral.name.toUpperCase() === filtername.toUpperCase()) || (peripheral.name.toUpperCase().indexOf(filtername.toUpperCase()) > -1)) {
                    $scope.bleexplorer.scanned_perips = util.pushUniqueObj($scope.bleexplorer.scanned_perips, peripheral);
                    $scope.bleexplorer.filter_scanned_perips = util.pushUniqueObj($scope.bleexplorer.filter_scanned_perips, peripheral);
                    $scope.bleexplorer.filterFound = true;
                    if ($scope.bleexplorer.isShowingLoadingIndic) $scope.bleexplorer.hideDialog();
                }
            }
        } else {
            $scope.bleexplorer.filterScan = false;
            $scope.bleexplorer.scanned_perips = util.pushUniqueObj($scope.bleexplorer.scanned_perips, peripheral);
            if ($scope.bleexplorer.isShowingLoadingIndic) $scope.bleexplorer.hideDialog();
        }

        if ($scope.devices_align) {
            $scope.bleexplorer.scanned_perips.sort(function(a, b) {
                return (Math.abs(a.rssi) > Math.abs(b.rssi) ? 1 : -1);
            });
        }
        $scope.perip_connect = false;
        $scope.bleexplorer.scanned_perips_length = $scope.bleexplorer.scanned_perips.length;
        if (typeof $scope.bleexplorer.filter_scanned_perips !== 'undefined') {
            $scope.bleexplorer.filter_scanned_perips_length = $scope.bleexplorer.filter_scanned_perips.length;
        }

        $scope.$apply();
    };

    $scope.showAdvInfoDialog = function(ev, peripheral) {
        $mdDialog.show({
            controller: DeviceInfoController,
            templateUrl: 'views/device_info.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            locals: {
                peripheral: peripheral
            }
        });
    };

    $scope.bleexplorer.showLoadingIndicator = function(ev, text) {
        $mdDialog.show({
            controller: LoadingIndicatorController,
            templateUrl: 'views/loading.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            locals: {
                loadingText: text
            }
        });
    };

    $scope.bleexplorer.showAlert = function(text, ev) {
        $mdDialog.show({
            controller: alertDialogController,
            templateUrl: 'views/alert.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            locals: {
                alertText: text
            }
        });
    };

    $scope.bleexplorer.hideDialog = function() {
        $scope.bleexplorer.isShowingLoadingIndic = false;
        $mdDialog.cancel();
    };

    $scope.showfilterOptions = function() {
        $scope.alert = '';
        $mdBottomSheet.show({
            templateUrl: 'views/filter.html',
            controller: 'filterCtrl'
        });
    };

    $scope.connectPeripheral = function(peripheral) {
        peripheral.once('connected', function(peripheral) {
            // console.log('Peripheral ', peripheral.uuid, ' connected');
        });

        peripheral.once('disconnected', function(peripheral) {
            // console.log('Peripheral ', peripheral.uuid, ' disconnected');
            if ($scope.bleexplorer.currentPeripheral) {
                disConnectFunc();
                $state.go('devicelist');
            }
        });

        var discoverable = false;
        if (peripheral.advdata && peripheral.advdata !== undefined) {
            discoverable = peripheral.advdata.discoverable;
        } else if (peripheral.discoverable && peripheral.discoverable !== undefined){
            discoverable = peripheral.discoverable;
        } else{
            discoverable = true;
        }

        if(discoverable !== false){
            $scope.bleexplorer._currentgateway.stopScan(function() {
                $scope.isScanning = false;
                $scope.scanOption = 'Scan';
                $scope.showOption = 'Options';

                $scope.bleexplorer.showLoadingIndicator('', 'Connecting to Peripheral....');

                peripheral.connect(function() {
                    $scope.bleexplorer.currentPeripheral = peripheral;
                    $scope.perip_connect = true;
                    // console.log('Found', Object.keys(peripheral.getAllServices()).length, 'services');
                    $scope.bleexplorer.currentPeripheral.services = peripheral.getAllServices();
                    $state.go('servicelist');
                    if ($scope.bleexplorer.isShowingLoadingIndic) {
                        $scope.bleexplorer.hideDialog();
                    }
                });
            });
        }else{
            $scope.bleexplorer.showAlert('Selected device is not connectable');
        }
    };

    $scope.gotoremoteview = function() {
        // console.log('remote view click');
        window.location = 'gatt-ip://remoteview';
    };

    $scope.gotologview = function() {
        // console.log('log view click');
        window.location = 'gatt-ip://logview';
    };

    $scope.bleexplorer.stopScanEvent();

});
app.controller('filterCtrl', function($scope, $mdBottomSheet, $timeout, $mdDialog) {
    $scope.bleexplorer = bleexplorer;
    $scope.filter_name = $scope.bleexplorer.filtername;
    $scope.filter_serv_uuid = $scope.bleexplorer.filteruuid;
    $scope.bleexplorer.filterFound = false;

    var util = new Util();

    $scope.clearFilterName = function() {
        $scope.filter_name = '';
    };

    $scope.clearFilterUUID = function() {
        $scope.filter_serv_uuid = '';
    };

    $scope.showNoDeviceFoundDialog = function(ev, peripheral) {
        $mdDialog.show({
            controller: NoDeviceFoundController,
            templateUrl: 'views/no_device_found.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false
        });
    };

    $scope.scanPeripsWithFilters = function() {
        $scope.bleexplorer.filtername = $scope.filter_name;
        $scope.bleexplorer.filteruuid = $scope.filter_serv_uuid;
        $scope.bleexplorer.filterScan = true;
        $scope.bleexplorer.filter_scanned_perips = [];
        $scope.bleexplorer.stopScanEvent($scope.bleexplorer.filtername, $scope.bleexplorer.filteruuid);
        $scope.bleexplorer.showLoadingIndicator('', 'Filtering scanned Peripherals....');

        // console.log('Filtering scanned Peripherals');
        $timeout(function() {
            if (($scope.bleexplorer.filter_scanned_perips_length === undefined || $scope.bleexplorer.filter_scanned_perips_length < 1 ) && $scope.bleexplorer.filterFound === false) {
                $scope.bleexplorer.showNoDeviceFoundDialog();
                $scope.bleexplorer.filterFound = false;
                $scope.bleexplorer.filterScan = false;
            }
        }, 7000);

        $mdBottomSheet.hide();
    };
});

app.controller('servicelistCtrl', function($scope, $state, $timeout) {
    // console.log('servicelistCtrl');
    if(isGattipApp) $scope.isGattipApp = true;
    $scope.bleexplorer = bleexplorer;
    var util = new Util();

    $scope.discoverCharacteristics = function(service) {
        $scope.bleexplorer.currentService = service;
        $scope.bleexplorer.currentService.characteristics = service.getAllCharacteristics();

        for (var char in $scope.bleexplorer.currentService.characteristics) {
            $scope.bleexplorer.currentService.characteristics[char].properties = $scope.bleexplorer.currentService.characteristics[char].allProperties();
        }

        // Code to get the characteristic name from the descriptor
        var characs = [];
        for (var cUUID in $scope.bleexplorer.currentService.characteristics) {
            characs.push($scope.bleexplorer.currentService.characteristics[cUUID]);
            $scope.bleexplorer.currentService.characteristics[cUUID].descriptors = $scope.bleexplorer.currentService.characteristics[cUUID].getAllDescriptors();
        }

        function setCharName(desc, value) {
            $scope.bleexplorer.currentService.characteristics[desc.characteristic().uuid].characteristicName = util.hex2a(value);
            $scope.$apply();
            $timeout();// HACK : To update the UI
        }

        if (characs.length > 0) {
            (function myLoop(i) {
                setTimeout(function() {
                    var descriptors = characs[i].getAllDescriptors();
                    for (var dUUID in descriptors) {
                        if (dUUID.indexOf('2901') > -1) {
                            // console.log("i value ", i, "  ", characs[i].uuid);
                            // if (descriptors[dUUID].properties && descriptors[dUUID].properties.Read && descriptors[dUUID].properties.Read.enabled) {
                            descriptors[dUUID].readValue(function(desc, value) {
                                // console.log("Got value ", value);
                                setCharName(desc, value);
                            });
                            // }
                            break;
                        }
                    }
                    if (i--) {
                        myLoop(i);
                    }
                }, 200);
            })(characs.length - 1);
        }

        $state.go('characteristiclist');
    };

    $scope.back = function() {
        history.go(-1);
    };

    $scope.gotologview = function() {
        window.location = 'gatt-ip://logview';
    };
});
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
function Util() {

    this.updatesignalimage = function(peripheral) {
        if (!(peripheral && peripheral.rssi)) {
            return peripheral;
        }
        if (Math.abs(peripheral.rssi) < 45) {
            peripheral.image = 'images/signal_5@2x.png';
        } else if (Math.abs(peripheral.rssi) < 55) {
            peripheral.image = 'images/signal_4@2x.png';
        } else if (Math.abs(peripheral.rssi) < 65) {
            peripheral.image = 'images/signal_3@2x.png';
        } else if (Math.abs(peripheral.rssi) < 75) {
            peripheral.image = 'images/signal_2@2x.png';
        } else {
            peripheral.image = 'images/signal_1@2x.png';
        }

        return peripheral;
    };

    this.pushUniqueObj = function(array, item) {
        var found = false,
            idx = -1;
        if (typeof array !== 'undefined') {
            for (idx = 0; idx < array.length; idx++) {
                if (array[idx].uuid === item.uuid) {
                    found = true;
                    break;
                }
            }
        } else {
            array = [];
        }
        if (found) {
            array.splice(idx, 1, item);
            return array;
        } else {
            array.push(item);
            return array;
        }
    };

    this.isEmpty = function(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }
        return JSON.stringify(obj) === JSON.stringify({});
    };

    this.isValidHex = function(sNum){
        var isHex = false;
        for (var i = 0; i < sNum.length; i++) {
            if((typeof sNum[i] === 'string') && ! isNaN( parseInt(sNum[i], 16) )){
                isHex = true;
            }else{
                isHex = false;
                return isHex;
            }
        }
      return isHex;
    };

    this.hex2a = function(hexx) {
        if(hexx){
            var hex = hexx.toString();
            var str = '';
            for (var i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            return str;
        }
    };

    this.hex2dec = function(hexx) {
        return parseInt(hexx, 16);
    };

    this.hex2b = function(hexx) {
        var num = hex2i(hexx);
        return num.toString(2);
    };

    this.a2hex = function(asci) {
        var str = '';
        for (var a = 0; a < asci.length; a++) {
            str = str + asci.charCodeAt(a).toString(16);
        }
        return str;
    };

    this.dec2hex = function(d) {
        var hex = Number(d).toString(16);
        while (hex.length < 2) {
            hex = '0' + hex;
        }

        return hex;
    };

    return this;
}