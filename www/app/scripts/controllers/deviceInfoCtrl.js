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
