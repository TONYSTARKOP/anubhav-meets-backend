const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {}; // Stores room details: { roomId: [{ id, username }] }

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Joining a room
  socket.on("join-room", (roomId, username) => {
    socket.join(roomId);

    // Add user to the room
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, username });

    console.log(`User ${username} joined room ${roomId}`);
    console.log("Current rooms:", rooms);

    // Notify all users in the room about the updated participants
    io.to(roomId).emit(
      "participants-update",
      rooms[roomId].map((user) => user.username)
    );

    // Handle video stream
    socket.on("send-video-stream", (stream) => {
      socket.broadcast.to(roomId).emit("receive-video-stream", {
        userId: socket.id,
        stream,
      });
    });

    // Handle chat messages
    socket.on("send-message", (message) => {
      io.to(roomId).emit("receive-message", message);
    });

    // Screen sharing
    socket.on("share-screen", (screenStream) => {
      socket.broadcast.to(roomId).emit("screen-share-receive", {
        userId: socket.id,
        screenStream,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove user from the room
      rooms[roomId] = rooms[roomId].filter((user) => user.id !== socket.id);

      // Notify the remaining users
      io.to(roomId).emit(
        "participants-update",
        rooms[roomId].map((user) => user.username)
      );
    });
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
