var app;
(function() {
    app = angular.module('bleExplorerApp', ['ngMaterial', "ui.router"])
        .config(function($stateProvider, $urlRouterProvider, $mdThemingProvider) {

            $stateProvider
                .state('devicelist', {
                    url: "/devicelist",
                    templateUrl: "views/devicelist.html",
                    controller: "devicelistCtrl"
                })
                .state('servicelist', {
                    url: "/servicelist",
                    templateUrl: "views/servicelist.html",
                    controller: "servicelistCtrl"
                })
                .state('characteristiclist', {
                    url: "/characteristiclist",
                    templateUrl: "views/characteristiclist.html",
                    controller: "characteristiclistCtrl"
                })
                .state('descriptorlist', {
                    url: "/descriptorlist",
                    templateUrl: "views/descriptorlist.html",
                    controller: "descriptorlistCtrl"
                });

            $urlRouterProvider.otherwise('/devicelist');

            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('pink');
            $mdThemingProvider.theme('success-toast');
            $mdThemingProvider.theme('error-toast');
        });

})();


app.run(['$document', '$window', function($document, $window) {
    var document = $document[0]; //unwrap the document from the jquery wrapper // RMB HACK FOR IPAD NOT FOCUSING INPUTS INSIDE IFRAME 
    document.addEventListener('click', function(event) {
        var hasFocus = document.hasFocus();
        if (!hasFocus) $window.focus();
    });
}])
