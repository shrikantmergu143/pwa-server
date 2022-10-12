const express = require('express');
const sio = require('socket.io');
const ws = require('ws');
const http = require('http');
const https = require('https');
const compression = require('compression');
const path = require('path');

const app = express(),
port = process.env.PORT || 3000,
server = process.env.NODE_ENV === 'production' ?
    http.createServer(app).listen(port) :
    https.createServer(app).listen(port),
io = sio(server);
app.use(compression());
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => res.sendFile(__dirname + '/index.html'));
// app.use(favicon('./dist/favicon.ico'));
// Set up a headless websocket server that prints any
// events that come in.
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
  socket.on('message', function(message, flags){

    console.log("message", message);
  socket.send(message);
  });
  
});

const Server = app.listen(4000, function(){
  console.log("fort runing on 4000")
});
Server.on('upgrade', (request, socket, head) => {
    console.log("request, socket, head, socket", request.url)
    if (request.url === '/foo') {
      wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
      });
    }
});
io.sockets.on('connection', socket => {
  let room = '';
  // sending to all clients in the room (channel) except sender
  socket.on('message', message => socket.broadcast.to(room).emit('message', message));
  socket.on('find', () => {
    const url = socket.request.headers.referer.split('/');
    room = url[url.length - 1];
    const sr = io.sockets.adapter.rooms[room];
    if (sr === undefined) {
      // no room with such name is found so create it
      socket.join(room);
      socket.emit('create');
    } else if (sr.length === 1) {
      socket.emit('join');
    } else { // max two clients
      socket.emit('full', room);
    }
  });
  socket.on('auth', data => {
    data.sid = socket.id;
    // sending to all clients in the room (channel) except sender
    socket.broadcast.to(room).emit('approve', data);
  });
  socket.on('accept', id => {
    io.sockets.connected[id].join(room);
    // sending to all clients in 'game' room(channel), include sender
    io.in(room).emit('bridge');
  });
  socket.on('reject', () => socket.emit('full'));
  socket.on('leave', () => {
    // sending to all clients in the room (channel) except sender
    socket.broadcast.to(room).emit('hangup');
    socket.leave(room);});
});