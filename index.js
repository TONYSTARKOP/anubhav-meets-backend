const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let usersInRoom = {};

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("create-room", (roomId) => {
    socket.join(roomId);
    usersInRoom[roomId] = (usersInRoom[roomId] || 0) + 1;
    console.log(`${socket.id} created room: ${roomId}`);
  });

  socket.on("join-room", (roomId, username) => {
    socket.join(roomId);
    io.to(roomId).emit("user-joined", username);
    console.log(`${username} joined room: ${roomId}`);
  });

  socket.on("chat-message", (message) => {
    io.emit("chat-message", message);  // Broadcast message
  });

  socket.on("share-screen", (screenStream) => {
    socket.broadcast.emit("screen-shared", screenStream);
    console.log("Screen shared");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
