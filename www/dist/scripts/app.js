var app = angular.module('GATT-IP', ['ngRoute']).config(function($routeProvider){

   $routeProvider.
   		when('/devicelist',{
		templateUrl:'views/devicelist.html',
		controller: 'devicelistController'
   });

   $routeProvider.
        when('/servicelist',{
        templateUrl:'views/servicelist.html',
        controller: 'servicelistController'
   });
                                                           
   $routeProvider.
        when('/characteristiclist',{
        templateUrl:'views/characteristiclist.html',
        controller: 'characteristiclistController'
   });
                                                           
   $routeProvider.
        when('/descriptorlist',{
        templateUrl:'views/descriptorlist.html',
        controller: 'descriptorlistController'
   });
                                                           
   $routeProvider.otherwise({redirectTo: '/devicelist'});
});

app.controller('AlertController', ['$scope', 'gattip', function($scope, gattip) {
    $scope.hide_alert = function() {
        var util = Util();

        util.hide_alert();
    };
}]);
app.controller('characteristiclistController', ['$scope', 'gattip', function($scope, gattip) {

    $scope.gattip = gattip;

    $scope.discoverDescriptors = function(characteristic) {
        characteristic.discoverDescriptors();
    };

    $scope.back = function() {
        history.go(-1);
    };

    $scope.gotologview = function() {
        window.location = 'gatt-ip://logview';
    };
}]);
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
app.controller('devicelistController', ['$scope', 'gattip', function($scope, gattip) {
	$scope.gattip = gattip;
	setTimeout(function() {
		$scope.flag = true;
	}, 30 * 1000);
	$scope.flag = false;
	var dataformat = "0";
	$scope.showformat = "0";
	$scope.showData = function(peripheral) {
		$scope.peripheralId = peripheral.uuid;
		$scope.selectedPeripheral = peripheral;
		updateADVData(dataformat);
	};

	$scope.$watch('gattip.peripherals', function(newPeripherals, oldPheripherals) {
		for (var newPeripheral in newPeripherals) {
			if (newPeripherals[newPeripheral].uuid == $scope.peripheralId) {
				$scope.showData(newPeripherals[newPeripheral]);
			}
		}
	}, true);

	$scope.changeDataFormat = function(position) {
		dataformat = position.showformat;
		updateADVData(dataformat);
	};

	function updateADVData(format) {
		var util = Util();
		switch (format) {
			case "1":
				$scope.manufacturerData = util.hex2a($scope.selectedPeripheral.manufacturerData);
				$scope.rawAdvertisingData = util.hex2a($scope.selectedPeripheral.rawAdvertisingData);
				break;
			case "2":
				$scope.manufacturerData = util.hex2dec($scope.selectedPeripheral.manufacturerData);
				$scope.rawAdvertisingData = util.hex2dec($scope.selectedPeripheral.rawAdvertisingData);
				break;
			default:
				$scope.manufacturerData = $scope.selectedPeripheral.manufacturerData;
				$scope.rawAdvertisingData = $scope.selectedPeripheral.rawAdvertisingData;
				break;
		}
	}

	$scope.connectPeripheral = function(peripheral) {
		gattip.stopScan();
		setTimeout(function() {
			peripheral.connect();
		}, 500);
	};

	$scope.gotoremoteview = function() {
		window.location = 'gatt-ip://remoteview';
	};

	$scope.gotologview = function() {
		window.location = 'gatt-ip://logview';
	};

	//////////////////////////////
	// pull to refresh functionality start here
	$(document).ready(function() {

		var contents = $('.PullToRefresh');
		var refresh = false;
		var track = false;
		var doc = document.documentElement;
		var startY;
		var top;
		var left;
		var page;

		$.each(contents, function(index, currentElement) {
			currentElement.addEventListener('touchstart', function(e) {
				$('.pull').hide();
				contentStartY = $('.iscroll-scroller').position().top;
				startY = e.touches[0].screenY;
				console.log(startY);
				left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
				top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
			});

			currentElement.addEventListener('touchend', function(e) {
				$('.pull').html('Pull Down').hide();
				if (refresh) {
					$scope.flag = false;
					setTimeout(function() {
						$scope.flag = true;
					}, 30 * 1000);

					currentElement.style['-webkit-transition-duration'] = '.5s';
					$scope.$apply(function() {
						gattip.peripherals = {};
					});
					gattip.scan(true);
					currentElement.addEventListener('transitionEnd', removeTransition);
					refresh = false;
				}
			});

			currentElement.addEventListener('touchmove', function(e) {
				if (top === 0) {
					if (e.changedTouches[0].screenY - startY > 15) {
						e.preventDefault();
						$('.pull').html('Pull Down').show();
					}
					if (top === 0 && (e.changedTouches[0].screenY - startY > 80) && contentStartY >= 0) {
						$('.pull').html('Release to Refresh').show();
						refresh = true;
					} else {
						refresh = false;
						return false;
					}
				}
			});

			var removeTransition = function() {
				content.style['-webkit-transition-duration'] = 0;
			};
		});
		document.addEventListener('touchend', function() {
			$('.pull').html('Pull down').hide();
		}, false);
	});
	// PULL TO REFRESH ENDS HERE

}]);
app.controller('servicelistController', ['$scope', 'gattip', function($scope, gattip) {

    $scope.gattip = gattip;

    $scope.discoverCharacteristics = function(service) {
        service.discoverCharacteristics();
    };

    $scope.back = function() {
        //if(gattip.currentPeripheral) gattip.currentPeripheral.disconnect();
        if (gattip) gattip.configure(true);
        history.go(-1);
    };

    $scope.gotologview = function() {
        window.location = 'gatt-ip://logview';
    };

}]);
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
function Util() {
    this.updatesignalimage = function(peripheral) {
        if (Math.abs(peripheral.rssi) < 10) {
            peripheral.image = "images/signal_5@2x.png";
        } else if (Math.abs(peripheral.rssi) < 30) {
            peripheral.image = "images/signal_4@2x.png";
        } else if (Math.abs(peripheral.rssi) < 50) {
            peripheral.image = "images/signal_3@2x.png";
        } else if (Math.abs(peripheral.rssi) < 70) {
            peripheral.image = "images/signal_2@2x.png";
        } else {
            peripheral.image = "images/signal_1@2x.png";
        }
        
        return peripheral;
    };
    
    this.hex2a = function(hexx) {
        var str = '';
        if (hexx) {
            var hex = hexx.toString();
            for (var i = 0; i < hex.length; i += 2)
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    };
    
    this.hex2dec = function(hexx) {
        var str = '';
        if (hexx) {
            str = parseInt(hexx, 16);
        }
        return str;
    };
    
    this.hex2b = function(hexx) {
        var num = hex2i(hexx);
        return num.toString(2);
    };
    
    this.a2hex = function(asci) {
        var str = '';
        for (a = 0; a < asci.length; a++) {
            str = str + asci.charCodeAt(a).toString(16);
        }
        return str;
    };
    
    this.a2dec = function(asci) {
        var str = '';
        for (a = 0; a < asci.length; a++) {
            str = str + asci.charCodeAt(a);
        }
        return str;
    };
    
    this.dec2hex = function(d) {
        var hex = Number(d).toString(16);
        while (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    };
    
    this.dec2a = function(d) {
        return hex2a(dec2hex(d));
    };
    
    this.show_alert = function(message) {
        $('#customalert').addClass('alert-show');
        $('.alert-box').show();
        
        // display the message
        $('#alertmessage').html(message);
    };
    
    this.hide_alert = function() {
        $('#customalert').removeClass('alert-show');
        $('.alert-box').hide();
    };
    
    return this;
}

app.filter('orderObjectBy', function() {
    return function(items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        if (reverse) {
            return filtered;
        }

        filtered.sort(function(a, b) {
            return (Math.abs(a[field]) > Math.abs(b[field]) ? 1 : -1);
        });

        return filtered;
    };
});