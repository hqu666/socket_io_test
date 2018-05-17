
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3080;

app.use(express.static(__dirname + '/public'));

function onConnection(socket){
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
  socket.on('allclear', (data) => socket.broadcast.emit('allclear', data));				//’Ç‹L
}

io.on('connection', onConnection);


//http.listen(port, () => console.log('EC2>>> ec2-52-197-173-40.ap-northeast-1.compute.amazonaws.com:' + port));
http.listen(port, () => console.log('web>>> http://127.0.0.1:' + port));