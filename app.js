var express = require('express');
var app = require("express")();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

//设置静态文件路径
app.use(express.static(__dirname + '/client'));
app.get('/',function(req,res){
	res.sendfile('index.html');
});

var connectedSockets = {};
var allUsers = [{nickname:""}];
io.on('connection',function(socket){
	//有新用户进入聊天室
	socket.on('addUser',function(data){
       console.log("用户进入聊天室。。。");
       if(connectedSockets[data.nickname]){
        //昵称已被占用
        socket.emit('userAddingResult',{result:false});
	    }else{
	        socket.emit('userAddingResult',{result:true});
	        socket.nickname=data.nickname;
	        //保存每个socket实例,发私信需要用
	        connectedSockets[socket.nickname]=socket;
	        allUsers.push(data);
	        //广播欢迎新用户,除新用户外都可看到
	        socket.broadcast.emit('userAdded',data);
	        //将所有在线用户发给新用户
	        socket.emit('allUser',allUsers);
	    }
	})

	socket.on('addMessage',function(data){
		if(data.to){
        //发给特定用户
            console.log('发送指定用户消息内容：'+data.text);
        connectedSockets[data.to].emit('messageAdded',data);
	    }else{
	        //群发-广播消息,除原发送者外都可看到
	        console.log('群发消息内容：'+data.text);
	        socket.broadcast.emit('messageAdded',data);
	    }
	})

	socket.on('disconnect',function(){
		console.log('有用户推出聊天室。。。');
		//广播有用户退出
        socket.broadcast.emit('userRemoved', {  
            nickname: socket.nickname
        });
        for(var i=0;i<allUsers.length;i++){
            if(allUsers[i].nickname==socket.nickname){
                allUsers.splice(i,1);
            }
        }
        //删除对应的socket实例
        delete connectedSockets[socket.nickname]; 
	})
})

http.listen(3000,function(){
	console.log('app is running at port 3000');
})