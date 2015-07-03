app.controller('AlertController',['$scope','gattip',function($scope,gattip){
                                  $scope.hide_alert = function() {
                                  var util = Util();
                                  
                                  util.hide_alert();
                                  };
                                  }]);
