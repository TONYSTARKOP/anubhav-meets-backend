const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let rooms = {}; // Stores room data

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle joining a room
  socket.on("join-room", ({ roomId, username }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    rooms[roomId].push({ id: socket.id, username });
    socket.join(roomId);

    console.log(`User ${username} joined room ${roomId}`);

    // Notify all participants in the room
    io.to(roomId).emit(
      "participants-update",
      rooms[roomId].map((user) => user.username)
    );
  });

  // Handle sending messages
  socket.on("send-message", ({ roomId, message, username }) => {
    io.to(roomId).emit("receive-message", { username, message });
  });

  // Handle screen sharing
  socket.on("share-screen", ({ roomId, streamId }) => {
    io.to(roomId).emit("screen-shared", { streamId });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (let roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((user) => user.id !== socket.id);
      io.to(roomId).emit(
        "participants-update",
        rooms[roomId].map((user) => user.username)
      );
    }
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
