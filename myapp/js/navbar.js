var myApp = angular.module('myApp')


    .controller('navbar', function ($scope, $http, $filter, $state, commonService) {

        $scope.home=()=>{
            $state.go("info.sub.dashboard");
        }

        $scope.pricing=()=>
        {
            $state.go("info.sub.pricing");
        }

        $scope.login=()=>{
            $state.go("info.sub.login");
        }
    })


    .controller('subnavbar', function ($scope, $http, $filter, $state, commonService) {
        socket = io();

        var login = {};
        $scope.profiles = [];

        var login = commonService.getInfo();

        socket.on('remove-session', function (id) {
            //  $scope.getclientInfo(id);
            $("#status").html("DISCONNECTED");
            $("#wapMessage").html("");
        });



        $scope.init = () => {
            ignoreLoadingBar: true;

            $http({
                url: commonService.server + 'subscription/get',
                method: "GET",
                params: { id: login.clientId }
            }).then(function (res) {
                ignoreLoadingBar: false;

                if (res.data.status_cd == 1) {

                    $scope.period = $scope.checkperaid(res.data.data);

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

        }

        $scope.init();


        //check client login period
        $scope.checkperaid = (s) => {

            var date = $filter('date')(new Date(), 'yyyy-MM-dd');

            if (s.eff_date <= date && s.exp_date >= date) {

                return "Active";

            } else {

                return "Subscription Expired";
            }
        }


        $scope.qr_show = () => {
            ignoreLoadingBar = true;
            socket.on('qr', function (data) {
                $("#wapMessage").html("");
                $("#qr").attr("src", data.src);
                $("#qr").show();

            });

            var imagsrc = $("#qr").attr("src");
            //if data qr not available
            if (!imagsrc) {
                var message = "If you want to scan the Whatsapp QR, Please logout from Whatsapp Linked devices"
                $("#wapMessage").html(message);

                //if image is available
            } else {
                $("#wapMessage").html("");
            }

            $("#QrModal").modal("show");
            ignoreLoadingBar = false;

        }



        $scope.profile = () => {
            $state.go('app.main.profile');
        }


        $scope.home = () => {
            $state.go('app.main.home');
        }



        $scope.subscription = () => {
            $state.go('app.main.subscription');
        }

        $scope.pricing = () => {
            $state.go('app.main.pricing');
        }
    })