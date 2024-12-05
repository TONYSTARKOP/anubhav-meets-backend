const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const activeRooms = {};

app.use(express.static(path.join(__dirname, "../client/dist")));

io.on("connection", (socket) => {
    let currentRoom = null;

    socket.on("create-room", () => {
        const roomId = uuidv4();
        activeRooms[roomId] = { host: socket.id, participants: [] };
        socket.emit("room-created", roomId);
    });

    socket.on("join-room", ({ roomId, name }) => {
        if (activeRooms[roomId]) {
            currentRoom = roomId;
            activeRooms[roomId].participants.push({ id: socket.id, name });
            socket.join(roomId);
            io.to(roomId).emit("user-joined", { id: socket.id, name });
        } else {
            socket.emit("room-not-found");
        }
    });

    socket.on("signal", (data) => {
        io.to(data.to).emit("signal", data);
    });

    socket.on("chat-message", (message) => {
        io.to(currentRoom).emit("chat-message", message);
    });

    socket.on("disconnect", () => {
        if (currentRoom && activeRooms[currentRoom]) {
            activeRooms[currentRoom].participants = activeRooms[currentRoom].participants.filter(p => p.id !== socket.id);
            io.to(currentRoom).emit("user-left", socket.id);

            if (activeRooms[currentRoom].participants.length === 0) {
                delete activeRooms[currentRoom];
            }
        }
    });
});

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
