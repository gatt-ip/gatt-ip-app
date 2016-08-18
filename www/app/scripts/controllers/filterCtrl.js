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
