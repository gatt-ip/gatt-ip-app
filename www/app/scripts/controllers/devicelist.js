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