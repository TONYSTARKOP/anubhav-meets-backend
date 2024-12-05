const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", (roomId, username) => {
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, username });

    io.to(roomId).emit(
      "participants-update",
      rooms[roomId].map((user) => user.username)
    );

    socket.on("send-message", ({ roomId, username, message }) => {
      io.to(roomId).emit("receive-message", `${username}: ${message}`);
    });

    socket.on("share-screen", ({ roomId, screenStream }) => {
      socket.broadcast.to(roomId).emit("receive-video-stream", {
        userId: socket.id,
        streamId: screenStream,
      });
    });

    socket.on("disconnect", () => {
      rooms[roomId] = rooms[roomId].filter((user) => user.id !== socket.id);
      io.to(roomId).emit(
        "participants-update",
        rooms[roomId].map((user) => user.username)
      );
    });
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
