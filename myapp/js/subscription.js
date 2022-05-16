
var myApp = angular.module('myApp')

.controller("subscriptionCtrl", function ($scope, $stateParams, $filter, $http,$q,commonService) {
    $scope.subscription={};
    $scope.id =commonService.getInfo();
 
    $http({
        url: commonService.server+"subscription/get", 
        method: "GET",
        params: {id:$scope.id.clientId}
     }).then(function(res)
    {
        
        res.data.data.status= $scope.checkperaid(res.data.data); 

        $scope.subscription=res.data.data;
    })



    
        //check client login period
        $scope.checkperaid = function (s) {

            var date = $filter('date')(new Date(), 'yyyy-MM-dd');

            if (s.eff_date <= date && s.exp_date >= date) {

                return "Active";

            } else {

                return "Subscription Expired";
            }
        }
                

})