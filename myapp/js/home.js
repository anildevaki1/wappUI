
var myApp = angular.module('myApp')

.controller("homeCtrl", function ($scope, $stateParams, $filter, $http,$q,commonService) {
   socket=io();

   $scope.userInfo={};
  
   $scope.id =commonService.getInfo();

   $("#sender").html($scope.id.clientId);
 
     //get ClientInfo
     $scope.getclientInfo = function () {
        
    
        var defered = $q.defer();
        $http({
            method: "POST",
            url: "/client-info",
            data: { sender: $scope.id.clientId  }
        }).then(function (res) {

            $scope.userInfo=res.data.response;
             
            $("#status").html(res.data.response.waStatus || "DISCONNECTED");
    
            
    
                defered.resolve(res);
    
        }, function (error) {
            
          
            $("#status").html("DISCONNECTED");
            
        })
        return defered.promise;
    }
    
    $scope.getclientInfo();
    
    socket.on('ready', function (data) {
        $("#status").html(data.status);
        $("#QrModal").modal("hide");
        $("#qr").attr("src","");
        $scope.getclientInfo();
    
    });

})