app.controller('descriptorlistController', ['$scope', 'gattip', function($scope, gattip) {

    $scope.gattip = gattip;

    var util = Util();

    $scope.readformat = 0;
    $scope.writeformat = 0;
    $scope.writeIndex = $scope.writeformat;

    $scope.$watch('gattip.currentCharacteristic.value', updateCurrentValue);

    $scope.changeFormat = updateCurrentValue;

    function updateCurrentValue() {
        switch ($scope.readformat) {
            case "1":
                $scope.currentValue = util.hex2a(gattip.currentCharacteristic.value);
                break;
            case "2":
                $scope.currentValue = util.hex2dec(gattip.currentCharacteristic.value);
                break;
            case "3":
                $scope.currentValue = util.hex2b(gattip.currentCharacteristic.value);
                break;
            default:
                $scope.currentValue = gattip.currentCharacteristic.value;
                break;
        }
    }

    $scope.changeDataFormat = function() {
        var dataFormat = parseInt($scope.writeformat);
        if ($scope.writeIndex != dataFormat) {
            switch ($scope.writeformat) {
                case "0":
                    if ($scope.writeIndex == 1) {
                        $scope.inputs = util.a2hex($scope.inputs);
                    } else {
                        $scope.inputs = util.dec2hex($scope.inputs);
                    }
                    break;
                case "1":
                    if ($scope.writeIndex === 0) {
                        $scope.inputs = util.hex2a($scope.inputs);
                    } else {
                        $scope.inputs = util.dec2a($scope.inputs);
                    }
                    break;
                case "2":
                    if ($scope.writeIndex === 0) {
                        $scope.inputs = util.hex2dec($scope.inputs);
                    } else {
                        $scope.inputs = util.a2dec($scope.inputs);
                    }
                    break;
            }
        }
        $scope.writeIndex = parseInt($scope.writeformat);
    };

    $scope.writeValue = function() {
        if (!$scope.inputs) {
            util.show_alert('Please enter value to write.');
            return;
        }
        var writeTemp = '';
        switch ($scope.writeformat) {
            case "1":
                writeTemp = util.a2hex($scope.inputs);
                break;
            case "2":
                writeTemp = util.dec2hex($scope.inputs);
                break;
            case "3":
                writeTemp = $scope.inputs; //TODO
                break;
            default:
                writeTemp = $scope.inputs;
                break;
        }

        gattip.currentCharacteristic.write(writeTemp);
    };

    $scope.readAgain = function() {
        gattip.currentCharacteristic.read();
    };

    $scope.notify = function() {
        gattip.currentCharacteristic.notify(true);
    };

    $scope.stopNotify = function() {
        gattip.currentCharacteristic.notify(false);
    };

    $scope.back = function() {
        history.go(-1);
    };

    $scope.gotologview = function() {
        window.location = 'gatt-ip://logview';
    };
}]);