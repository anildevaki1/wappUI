
var myApp = angular.module('myApp')



    .controller("userCtrl", function ($scope, $http, $state,commonService) {
        $(document).ready(function () {
            var socket = io();

            var server = commonService.server;
            $scope.entity = {};
            $scope.mode = 0; 

            $scope.login = function () {

                ignoreLoadingBar: true

                var params = {
                    username: $scope.entity.username,
                    psw: $scope.entity.psw
                }

                $http({
                    method: "GET",
                    url: server + 'client/GrantCredentials',
                    data: params,
                    rejectDuplicateRequest: true,
                    params: params,
                }).then(function (res) {

                    if (res.data.status_cd == 1) {
                        var params = { clientId: res.data.data.clientId };

                        commonService.setInfo(params);
                        
                        $scope.entity = {};

                        //Create Session
                        socket.emit('create-session', {
                            id: res.data.data.clientId,
                            info: ''
                        });

                        ignoreLoadingBar: false;
                        $state.go('app.main.home', { "data": params });
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
            }




            $scope.Regustration = function (s) {
                $scope.mode = s;
            }


            $scope.submitForm = () => {


                $http.post({
                    type: "post",
                    url: server + "login/Register",
                    data: $scope.entity,
                    success: function (response) {

                        if (response.status_cd == 1) {
                            Swal.fire({
                                icon: 'Success',
                                text: 'Registration Successfullu'
                            })
                            $("#loginform").css("display", "block");
                            $("#registerform").css("display", "none");
                        } else {
                            Swal.fire({
                                icon: 'error',
                                text: "Something Went Wrong..."
                            })
                        }
                    }, error: function (error) {
                        Swal.fire({
                            icon: 'error',
                            text: error
                        })

                    }
                })
            }
        });

    })

