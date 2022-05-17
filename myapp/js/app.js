
var myApp = angular.module('myApp', ['ui.router', 'angular-loading-bar','swaggerUi'])

    .config(function ($stateProvider, $urlRouterProvider, cfpLoadingBarProvider) {

        // cfpLoadingBarProvider.includeSpinner = false;
        cfpLoadingBarProvider.spinnerTemplate = '<div><span class="visually-hidden">Loading...</span></div>';


        $urlRouterProvider.when("", "/info/sub/dashboard");

        $stateProvider

            .state("info", {
                url: "/info",
                abstract: true,
                templateUrl: "components/navbar.html",
                controller: "navbar"
            })

            .state("info.sub", {
                url: "/sub",
                template: '<ui-view></ui-view>',
            })


            .state("info.sub.dashboard", {
                url: "/dashboard",
                templateUrl: "views/info/dashbord.html",
              //  controller: "navbar"
            })



            .state("info.sub.login", {
                url: "/login",
                templateUrl: "views/login.html",
                controller: 'userCtrl'
            })
  
            .state("info.sub.pricing", {
                url: "/pricing",
                templateUrl: "views/pricing.html",
                controller: "pricingCtrl",
                // params:{"data":null}
            })


            .state("app", {
                url: "/app",
                abstract: true,
                templateUrl: "components/subnavbar.html",
                controller: "subnavbar"
            })


            .state("app.main", {
                url: "/main",
                template: '<ui-view></ui-view>',


            })
            .state("app.main.home", {
                url: "/home",
                templateUrl: "views/home.html",
                controller: "homeCtrl",
                params: { "data": null }
            })

            
            .state("app.main.documentation", {
                url: "/documentation",
                templateUrl: "views/documentation.html",
                controller: "documentationCtrl"
            })

            .state("app.main.profile", {
                url: "/profile",
                templateUrl: "views/profile.html",
                controller: "profileCtrl",
                params: { "data": null }
            })


            .state("app.main.subscription", {
                url: "/subscription",
                templateUrl: "views/subscription.html",
                controller: "subscriptionCtrl",
                params: { "data": null }
            })


            .state("app.main.pricing", {
                url: "/pricing",
                templateUrl: "views/pricing.html",
                controller: "pricingCtrl",
                // params:{"data":null}
            })

    })
