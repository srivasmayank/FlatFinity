// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Data structures for rooms, players, and tables.
let rooms = {};
let players = {};
let tables = [];

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
  socket.emit("socketId", { socketId: socket.id });

  socket.on("createRoom", ({ roomId, username, password }) => {
    console.log(
      `Socket ${socket.id} requests to create room '${roomId}' with password '${password}'`
    );
    leaveAllGameRooms(socket);
    if (rooms[roomId]) {
      socket.emit("roomError", { message: "Room already exists" });
      return;
    }
    rooms[roomId] = { password, players: {} };
    socket.join(roomId);
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

  socket.on("joinRoom", ({ roomId, username, password }) => {
    console.log(
      `Socket ${socket.id} requests to join room '${roomId}' with password '${password}'`
    );
    if (!rooms[roomId]) {
      socket.emit("roomError", { message: "Room not found" });
      return;
    }
    if (rooms[roomId].password !== password) {
      socket.emit("roomError", { message: "Incorrect password" });
      return;
    }
    leaveAllGameRooms(socket);
    socket.join(roomId);
    players[socket.id] = {
      roomId,
      username,
      x: Math.random() * 800,
      y: Math.random() * 600,
      direction: "down"
    };
    rooms[roomId].players[socket.id] = players[socket.id];
    socket.emit("roomJoined", { roomId, players: rooms[roomId].players });
  });

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
  });

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
    }
  });

  socket.on("placeTable", (tableInfo) => {
    tables.push(tableInfo);
    const roomId = players[socket.id].roomId;
    io.in(roomId).emit("tablePlaced", tableInfo);
  });

  // Voice signaling events.
  socket.on("voiceOffer", (data) => {
    const { target, sdp } = data;
    socket.to(target).emit("voiceOffer", { caller: socket.id, sdp });
  });
  
  socket.on("voiceAnswer", (data) => {
    const { target, sdp } = data;
    socket.to(target).emit("voiceAnswer", { caller: socket.id, sdp });
  });
  
  socket.on("voiceCandidate", (data) => {
    const { target, candidate } = data;
    socket.to(target).emit("voiceCandidate", { from: socket.id, candidate });
  });

  // Acknowledgment method for leaving a room.
  socket.on("leaveRoom", () => {
    console.log("check server leave")
    if (players[socket.id]) {
      const roomId = players[socket.id].roomId;
      if (rooms[roomId]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit("removePlayer", socket.id);
        console.log("remove player after leave")
        if (Object.keys(rooms[roomId].players).length === 0) {
          delete rooms[roomId];
        }
      }
      delete players[socket.id];
    }
    // Invoke the acknowledgment callback.
  
  });

  socket.on("disconnect", () => {
    if (players[socket.id]) {
      const roomId = players[socket.id].roomId;
      if (rooms[roomId]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit("removePlayer", socket.id);
        console.log("remove player after disonnect")
        if (Object.keys(rooms[roomId].players).length === 0) {
          delete rooms[roomId];
        }
      }
      delete players[socket.id];
    }
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
