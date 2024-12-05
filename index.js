const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static("public"));

// Handle incoming socket connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle room creation
  socket.on("create-room", (roomId) => {
    socket.join(roomId);
    console.log(`Room ${roomId} created`);
    socket.emit("room-created", roomId);  // Send confirmation to the host
  });

  // Handle joining a room
  socket.on("join-room", (roomId, username) => {
    socket.join(roomId);
    console.log(`${username} joined room ${roomId}`);
    socket.to(roomId).emit("user-joined", username);  // Notify other users
  });

  // Handle leaving the room
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
server.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
