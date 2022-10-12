const express = require('express');

const ws = require('ws');

const app = express();

// Set up a headless websocket server that prints any
// events that come in.
const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
  socket.on('message', function(message, flags){
    console.log("message", message);
  socket.send(message);
  });
  
});

const server = app.listen(4000);
server.on('upgrade', (request, socket, head) => {
    console.log("request, socket, head, socket", request.url)
    if (request.url === '/foo') {
      wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
      });
    }
});