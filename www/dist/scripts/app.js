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

app.controller('characteristiclistController',['$scope','gattip',function($scope,gattip){
	
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
app.controller('descriptorlistController',['$scope','gattip',function($scope,gattip){

    $scope.gattip = gattip;
                  
    var util = Util();
                 
    $scope.readformat = 0;
    $scope.writeformat = 0;

    $scope.$watch('gattip.currentCharacteristic.value', updateCurrentValue);
                                           
    $scope.changeFormat = updateCurrentValue;

    function updateCurrentValue() {
        switch($scope.readformat) {
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
                                           
    $scope.writeValue = function() {
        var writeTemp = '';
        switch($scope.writeformat) {
            case "1":
                writeTemp = util.a2hex($scope.inputs);
                break;
            case "2":
                writeTemp = util.dec2hex($scope.inputs);
                break;
            case "3":
                writeTemp = $scope.inputs;//TODO
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

    $scope.back = function(){
        history.go(-1);
    };

    $scope.gotologview = function(){
        window.location = 'gatt-ip://logview';
    };
}]);
app.controller('devicelistController',['$scope','gattip',function($scope,gattip){

    $scope.gattip = gattip;
                                       
    $scope.connectPeripheral = function(peripheral) {
        peripheral.connect();
    };
                                       
    $scope.gotoremoteview = function() {
        window.location = 'gatt-ip://remoteview';
    };

    $scope.gotologview = function() {
        window.location = 'gatt-ip://logview';
    };
                                       
    //////////////////////////////
    // pull to refresh functionality start here
    $(document).ready(function(){
                                                         
        var contents      = $('.PullToRefresh');
        var refresh       = false;
        var track         = false;
        var doc           = document.documentElement;
        var startY;
        var top;
        var left;
        var page;
                                                         
        $.each(contents, function( index, currentElement ) {
            currentElement.addEventListener('touchstart', function(e) {
                $('.pull').hide();
                contentStartY = $('.iscroll-scroller').position().top;
                startY = e.touches[0].screenY;
                left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
                top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
            });
                                                                
            currentElement.addEventListener('touchend', function(e) {
                $('.pull').html('Pull Down').hide();
                if(refresh) {
                    currentElement.style['-webkit-transition-duration'] = '.5s';
                    $scope.$apply(function () {
                        gattip.peripherals = {};
                    });
                                                                                                
                    gattip.scan(true);
                    currentElement.addEventListener('transitionEnd', removeTransition);
                    refresh = false;
                }
            });
            
            currentElement.addEventListener('touchmove', function(e) {
                e.preventDefault();
                if( contentStartY >= 0){
                    if(e.changedTouches[0].screenY - startY > 15){
                        $('.pull').html('Pull Down').show();
                    }
                    if(top === 0 && (e.changedTouches[0].screenY - startY > 80) && contentStartY >= 0 ){
                        $('.pull').html('Release to Refresh').show();
                        refresh = true;
                    }else{
                        refresh = false;
                        return false;
                    }
                }
            });
            
            var removeTransition = function() {
                content.style['-webkit-transition-duration'] = 0;
            };
        });
        document.addEventListener('touchend',function(){ $('.pull').html('Pull down').hide(); },false);
    });
    // PULL TO REFRESH ENDS HERE

}]);
app.controller('servicelistController',['$scope','gattip',function($scope,gattip){

    $scope.gattip = gattip;
                                        
 	$scope.discoverCharacteristics = function(service) {
        service.discoverCharacteristics();
    };
     
    $scope.back = function() {
        if(gattip.currentPeripheral) gattip.currentPeripheral.disconnect();
        history.go(-1);
    };
                                        
    $scope.gotologview = function() {
        window.location = 'gatt-ip://logview';
    };

}]);
var url = "ws://localhost:6001";//default
//called from native side
function connectWithPort(port) {
    url = "ws://localhost:"+port;
    return url;
}

app.factory('gattip',
            ['$q', '$rootScope', '$location',
             function ($q, $rootScope, $location) {
                //alert("Stop for debugger....");
             
                var util = Util();
             
                var g = new GATTIP();

                g.init(url);

                g.oninit = function(params, error){
                    g.configure(true);
                };

                g.onstate = function(error){
                    if(g.state === GATTIP.kPoweredOn) {
                        g.scan(true);
                    } else if(g.state === GATTIP.kPoweredOff) {
                        $rootScope.$apply(function () {
                            $location.path('/devicelist');
                            //TODO:update ui to show it is off
                        });
                    } else if(g.state === GATTIP.kUnsupported) {
                        alert("Bluetooth Low Energy is not supported with this device.");
                        //TODO:update ui to show it is not supported
                    } else {
                        //TODO:other error cases
                    }
                };

                g.onscan = function(peripheral, error) {
                    util.updatesignalimage(peripheral);
                    $rootScope.$apply();
                };

                g.onconnect = function(peripheral, error) {
                    g.currentPeripheral = peripheral;
                    peripheral.discoverServices();
                };
             
                g.ondisconnect = function(peripheral, error) {
                    g.currentPeripheral = null;
             
                    if(error && error.message) alert(error.message);
             
                    $rootScope.$apply(function () {
                        $location.path('/devicelist');
                    });
                };
             
                g.ondiscoverServices = function(peripheral, error) {
                    $rootScope.$apply(function () {
                        $location.path('/servicelist');
                    });
                };
             
                g.ondiscoverCharacteristics = function(peripheral, service, error) {
                    g.currentService = service;
                    $rootScope.$apply(function () {
                       $location.path('/characteristiclist');
                    });
                };

                g.ondiscoverDescriptors = function(peripheral, service, characteristic, error) {
                    g.currentCharacteristic = characteristic;
                    characteristic.read();
                    $rootScope.$apply(function () {
                        $location.path('/descriptorlist');
                    });
                };
             
                g.onupdateValue = function(peripheral, service, characteristic, error) {
                    $rootScope.$apply();
                };
             
                g.onwriteValue = function(peripheral, service, characteristic, error) {
                    $rootScope.$apply();
                };
             return g;
}]);

function Util()
{
    this.updatesignalimage = function(peripheral)
    {
        if(Math.abs(peripheral.rssi) <10 ) {
            peripheral.image = "images/signal_5.png";
        }
        else if(Math.abs(peripheral.rssi) <30 ) {
            peripheral.image = "images/signal_4.png";
        }
        else if(Math.abs(peripheral.rssi) <50 ) {
            peripheral.image = "images/signal_3.png";
        }
        else if(Math.abs(peripheral.rssi) <70 ) {
            peripheral.image = "images/signal_2.png";
        }
        else {
            peripheral.image = "images/signal_1.png";
        }

        return peripheral;
    };
    
    this.hex2a = function(hexx) {
        var hex = hexx.toString();
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    };
    
    this.hex2dec = function(hexx) {
        return parseInt(hexx, 16);
    };
    
    this.hex2b = function(hexx) {
        var num = hex2i(hexx);
        return num.toString(2);
    };

    this.a2hex = function(asci){
        var str = '';
        for (a = 0; a < asci.length; a++) {
            str = str + asci.charCodeAt(a).toString(16);
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
    
    return this;
}
