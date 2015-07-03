app.controller('devicelistController',['$scope','gattip',function($scope,gattip){
                                       
                                       $scope.gattip = gattip;
                                       $scope.showData = function(peripheral) {
                                       $scope.showformat = 0;
                                       showdata(peripheral);
                                       $scope.manufacturerData = peripheral.manufacturerData;
                                       $scope.rawAdvertisingData = peripheral.rawAdvertisingData;
                                       $scope.peripheral1 = peripheral;
                                       };
                                       
                                       $scope.changeDataFormat = function(position) {
                                       var util = Util();
                                       showdata($scope.peripheral1);
                                       switch(position.showformat) {
                                       case "1":
                                       $scope.manufacturerData = util.hex2a($scope.peripheral1.manufacturerData);
                                       $scope.rawAdvertisingData =  util.hex2a($scope.peripheral1.rawAdvertisingData);
                                       break;
                                       case "2":
                                       $scope.manufacturerData = util.hex2dec($scope.peripheral1.manufacturerData);
                                       $scope.rawAdvertisingData = util.hex2dec($scope.peripheral1.rawAdvertisingData);
                                       break;
                                       default:
                                       $scope.manufacturerData = $scope.peripheral1.manufacturerData;
                                       $scope.rawAdvertisingData = $scope.peripheral1.rawAdvertisingData;
                                       break;
                                       }
                                       };
                                       
                                       function showdata(peripheral) {
                                       $scope.name = peripheral.name;
                                       $scope.uuid = peripheral.uuid;
                                       $scope.discoverable = peripheral.discoverable;
                                       $scope.txpowerLevel = peripheral.txpowerLevel;
                                       $scope.serviceUUIDs = peripheral.serviceUUIDs;
                                       $scope.rssi = peripheral.rssi;
                                       }
                                       
                                       $scope.connectPeripheral = function(peripheral) {
                                       gattip.stopScan();
                                       setTimeout(function () { peripheral.connect(); }, 500);
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
                                                                                                console.log(startY);
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
                                                                                                var scanServiceUUIDs = ['AD3A'];
                                                                                                gattip.scan(true);
                                                                                                currentElement.addEventListener('transitionEnd', removeTransition);
                                                                                                refresh = false;
                                                                                                }
                                                                                                });
                                                                
                                                                currentElement.addEventListener('touchmove', function(e) {
                                                                                                if( top === 0){
                                                                                                if(e.changedTouches[0].screenY - startY > 15){
                                                                                                e.preventDefault();
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
