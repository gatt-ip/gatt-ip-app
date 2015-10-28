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