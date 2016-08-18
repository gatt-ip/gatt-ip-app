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