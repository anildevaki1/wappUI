 
var myApp = angular.module('myApp')

.service('commonService', function () {

    this.server = "https://apis.dsserp.in/wapp/";


    var info;

    this.getInfo=function() {
        return info;
    }

    this.setInfo=function(value) {
        info = value;
    }

})


 