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