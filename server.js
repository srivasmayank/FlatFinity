const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Data structures for rooms, players, and tables
let rooms = {};
let players = {};
let tables = []; // Global table data (consider making it room-specific if needed)

/**
 * Helper to remove a socket from any custom room.
 */
function leaveAllGameRooms(socket) {
  const joinedRooms = [...socket.rooms];
  for (const room of joinedRooms) {
    if (room !== socket.id) {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    }
  }
}

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // --- Create Room ---
  socket.on("createRoom", ({ roomId, username, password }) => {
    console.log(`Socket ${socket.id} requests to create room '${roomId}' with password '${password}'`);
    leaveAllGameRooms(socket);

    if (rooms[roomId]) {
      socket.emit("roomError", { message: "Room already exists" });
      console.log(`Creation failed: Room '${roomId}' already exists.`);
      return;
    }
    rooms[roomId] = { password, players: {} };
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room '${roomId}'.`);
    players[socket.id] = {
      roomId,
      username,
      x: Math.random() * 800,
      y: Math.random() * 600,
      direction: "down"
    };
    rooms[roomId].players[socket.id] = players[socket.id];
    socket.emit("roomCreated", { roomId });
    console.log(`Room '${roomId}' created by socket ${socket.id}.`);
  });

  // --- Join Room ---
  socket.on("joinRoom", ({ roomId, username, password }) => {
    console.log(`Socket ${socket.id} requests to join room '${roomId}' with password '${password}'`);
    if (!rooms[roomId]) {
      socket.emit("roomError", { message: "Room not found" });
      console.log(`Join failed: Room '${roomId}' not found.`);
      return;
    }
    if (rooms[roomId].password !== password) {
      socket.emit("roomError", { message: "Incorrect password" });
      console.log(`Join failed: Incorrect password for room '${roomId}'.`);
      return;
    }
    leaveAllGameRooms(socket);
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room '${roomId}'.`);
    players[socket.id] = {
      roomId,
      username,
      x: Math.random() * 800,
      y: Math.random() * 600,
      direction: "down"
    };
    rooms[roomId].players[socket.id] = players[socket.id];
    socket.emit("roomJoined", { roomId, players: rooms[roomId].players });
    console.log(`Socket ${socket.id} successfully joined room '${roomId}'.`);
  });

  // --- Player Ready ---
  socket.on("playerReady", (playerData) => {
    if (players[socket.id]) {
      players[socket.id].x = playerData.x;
      players[socket.id].y = playerData.y;
      players[socket.id].direction = playerData.direction;
      players[socket.id].isMoving = playerData.isMoving;
    }
    const roomId = players[socket.id]?.roomId;
    if (!roomId || !rooms[roomId]) return;
    const playersInRoom = {};
    for (const id in rooms[roomId].players) {
      if (id !== socket.id) {
        playersInRoom[id] = rooms[roomId].players[id];
      }
    }
    socket.emit("currentPlayers", playersInRoom);
    socket.to(roomId).emit("newPlayer", { id: socket.id, ...players[socket.id] });
    console.log(`Socket ${socket.id} is ready in room '${roomId}'.`);
  });

  // --- Movement ---
  socket.on("move", (position) => {
    if (players[socket.id]) {
      players[socket.id].x = position.x;
      players[socket.id].y = position.y;
      players[socket.id].direction = position.direction;
      players[socket.id].isMoving = position.isMoving;
      const roomId = players[socket.id].roomId;
      socket.to(roomId).emit("playerMoved", {
        id: socket.id,
        x: position.x,
        y: position.y,
        direction: position.direction,
        isMoving: position.isMoving
      });
      console.log(`Socket ${socket.id} moved in room '${roomId}' to (${position.x}, ${position.y}) facing ${position.direction}, moving: ${position.isMoving}.`);
    }
  });

  // --- Table Placement ---
  socket.on("placeTable", (tableInfo) => {
    tables.push(tableInfo);
    const roomId = players[socket.id].roomId;
    io.in(roomId).emit("tablePlaced", tableInfo);
    console.log(`Table placed in room '${roomId}' at (${tableInfo.x}, ${tableInfo.y}) by socket ${socket.id}.`);
  });

  // --- Disconnect ---
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    if (players[socket.id]) {
      const roomId = players[socket.id].roomId;
      if (rooms[roomId]) {
        delete rooms[roomId].players[socket.id];
        if (Object.keys(rooms[roomId].players).length === 0) {
          console.log(`Room '${roomId}' is now empty and will be deleted.`);
          delete rooms[roomId];
        }
        socket.to(roomId).emit("removePlayer", socket.id);
      }
      delete players[socket.id];
    }
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
