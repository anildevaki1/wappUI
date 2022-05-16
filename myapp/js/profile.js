
var myApp = angular.module('myApp')

    .controller("profileCtrl", function ($scope, $stateParams, $filter, $http,$q,commonService) {
       socket=io();
  
      $scope.id = commonService.getInfo();
        $scope.entity = {};
        $scope.profiles = [];
        $scope.profile={};
        $scope.mode = 0;
  
        $scope.init = function () {
            ignoreLoadingBar: true;

            $http({
                url: commonService.server + 'login/get', 
                method: "GET",
                params: { id: $scope.id.clientId }
             }).then(function(profiles){
 
                if (profiles.data.status_cd == 1) {
                    
                        $http({
                            url: commonService.server + 'subscription/get', 
                            method: "GET",
                            params:  { id: $scope.id.clientId }
                         }).then(function(res){

                        ignoreLoadingBar: false;

                        if (res.data.status_cd == 1) {
        
                            profiles.data.data.period = $scope.checkperaid(res.data.data);
        
                            $scope.profiles.push(profiles.data.data);

                           
                        } else {
        
                            ignoreLoadingBar: false;
        
                            Swal.fire({
                                icon: 'error',
                                text: "Something Went Wrong...."
                            })
                        }
                    }, function (error) {
        
                        ignoreLoadingBar: false;
        
        
                        Swal.fire({
                            icon: 'error',
                            text: error
                        })
                    })

                    
                } else {
                    Swal.fire({
                        icon: 'error',
                        text: "Something Went Wrong...."
                    })
                }
            }, function (error) {
                ignoreLoadingBar: false;
                Swal.fire({
                    icon: 'error',
                    text: error
                })
            })

            //get subscription
           
        }

        $scope.init();
 
        //check client login period
        $scope.checkperaid =function (s){

            var date = $filter('date')(new Date(), 'yyyy-MM-dd');

            if (s.eff_date <= date && s.exp_date >= date) {
 
                return "Active";
                
            } else {
               
                return "Subscription Expired";
            }
        }
 
    })

