const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors()); // Allow cross-origin requests (adjust as needed)
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {};
let tables = [];

// Listen for client connections
io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  // Wait for the client to signal readiness (and send its starting position)
  socket.on("playerReady", (playerData) => {
    // Use the client-provided position or set a random one if none provided.
    players[socket.id] = playerData || { x: Math.random() * 800, y: Math.random() * 600 };

    // Send the full list of current players to the new client.
    socket.emit("currentPlayers", players);

    // Notify all other clients about this new player.
    socket.broadcast.emit("newPlayer", { id: socket.id, ...players[socket.id] });
  });

  // When a player moves, update the server state and notify everyone else.
  socket.on("move", (position) => {
    if (players[socket.id]) {
      players[socket.id] = position;
      socket.broadcast.emit("playerMoved", { id: socket.id, ...position });
    }
  });

  // When a table is placed, store its data and notify everyone.
  socket.on("placeTable", (tableInfo) => {
    tables.push(tableInfo);
    io.emit("tablePlaced", tableInfo);
  });

  // On disconnect, remove the player and notify the others.
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    delete players[socket.id];
    io.emit("removePlayer", socket.id);
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
