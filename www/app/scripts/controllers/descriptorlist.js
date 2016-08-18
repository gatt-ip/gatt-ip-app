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