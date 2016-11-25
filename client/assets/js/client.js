var app=angular.module("chatRoom",[]);

app.factory('socket', function($rootScope) {
    var socket = io(); //默认连接部署网站的服务器
    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {   
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});

app.factory('userService', function($rootScope) {
    return {
        get: function(users,nickname) {
            if(users instanceof Array){
                for(var i=0;i<users.length;i++){
                    if(users[i].nickname===nickname){
                        return users[i];
                    }
                }
            }else{
                return null;
            }
        }
    };
});
 // 新声明一个指令用于调用页面
    app.directive('message', ['$timeout',function($timeout) {
        return {
            restrict: 'E',
            templateUrl: 'message.html',
            scope:{
                info:"=",
                self:"=",
                scrolltothis:"&"
            },
            link:function(scope, elem, attrs){
                scope.time=new Date();
                $timeout(scope.scrolltothis);
            }
        };
    }]).directive('user', ['$timeout',function($timeout) {
            return {
            restrict: 'E',
            templateUrl: 'user.html',
            scope:{
                info:"=",
                iscurrentreceiver:"=",
                setreceiver:"&"
            }
        };
    }]);
app.controller("chatCtrl",['$scope','socket','userService',function($scope,socket,userService){
    var messageWrapper= $('.message-wrapper');
    $scope.hasLogined=false;
    $scope.receiver="";//默认是群聊
    $scope.publicMessages=[];//群聊消息
    $scope.privateMessages={};//私信消息
    $scope.messages=$scope.publicMessages;//默认显示群聊
    $scope.users=[];

    //登录进入聊天室
    $scope.login=function(){   
        // coding there ...
        socket.emit("addUser",{nickname:$scope.nickname});
    }
    $scope.scrollToBottom=function(){
       // coding there ...
       messageWrapper.scrollTop(messageWrapper[0].scrollHeight);
    }

    $scope.postMessage=function(){
         // coding there ...
        var msg={text:$scope.words, type:"normal", from:$scope.nickname, to:$scope.receiver};
        var rec=$scope.receiver;
        if(rec){
           if(!$scope.privateMessages[rec]){
               $scope.privateMessages[rec]=[];
           }
            $scope.privateMessages[rec].push(msg);
        }else{
            $scope.publicMessages.push(msg);
        }
        $scope.words="";
        if(rec!==$scope.nickname) {
            socket.emit("addMessage", msg);
        }
    }
    $scope.setReceiver=function(receiver){
        // coding there ...
        $scope.receiver=receiver;
        if(receiver){
            if(!$scope.privateMessages[receiver]){
                $scope.privateMessages[receiver]=[];
            }
            $scope.messages=$scope.privateMessages[receiver];
        }else{
            console.log("收到别人的信息内容："+$scope.publicMessages);
            $scope.messages=$scope.publicMessages;
        }
        var user=userService.get($scope.users,receiver);
        if(user){
            user.hasNewMessage=false;
        }
    }

    // 收到登录结果
    socket.on('userAddingResult',function(data){
        // coding there ...
        if(data.result){
            $scope.userExisted=false;
            $scope.hasLogined=true;
        }else{//昵称被占用
            $scope.userExisted=true;
        }
    });

    // 接收到欢迎新用户消息
    socket.on('userAdded', function(data) {
        // coding there ...
        if(!$scope.hasLogined) return;
        $scope.publicMessages.push({text:data.nickname,type:"welcome"});
        $scope.users.push(data);
    });

    // 接收到在线用户消息
    socket.on('allUser', function(data) {
        // coding there ...
        if(!$scope.hasLogined) return;
         $scope.users=data;
    });

    // 接收到用户退出消息
    socket.on('userRemoved', function(data) {
        // coding there ...
        if(!$scope.hasLogined) return;
        $scope.publicMessages.push({text:data.nickname,type:"bye"});
        for(var i=0;i<$scope.users.length;i++){
            if($scope.users[i].nickname==data.nickname){
                $scope.users.splice(i,1);
                return;
            }
        }
    });

    // 接收到新消息
    socket.on('messageAdded', function(data) {
        // coding there ...
        if(!$scope.hasLogined) return;
        if(data.to){ //私信
            if(!$scope.privateMessages[data.from]){
                $scope.privateMessages[data.from]=[];
            }
            $scope.privateMessages[data.from].push(data);
        }else{//群发
            $scope.publicMessages.push(data);
        }
        var fromUser=userService.get($scope.users,data.from);
        var toUser=userService.get($scope.users,data.to);
        if($scope.receiver!==data.to) {//与来信方不是正在聊天当中才提示新消息
            if (fromUser && toUser.nickname) {
                fromUser.hasNewMessage = true;//私信
            } else {
                toUser.hasNewMessage = true;//群发
            }
        }
    });

   
}]);