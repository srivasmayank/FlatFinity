import React, { useEffect } from "react";
import Phaser from "phaser";
import { io } from "socket.io-client";

// Connect to the Socket.io server
const socket = io("http://localhost:3000");

class Scene1 extends Phaser.Scene {
  constructor() {
    super("bootGame");
  }

  preload() {
    // Preload assets
    this.load.image("background", "/assets/images/background.png");
    this.load.spritesheet("player", "/assets/spritesheets/player.png", {
      frameWidth: 32,
      frameHeight: 35.5
    });
    this.load.image("table", "/assets/spritesheets/table2.png");
  }

  create() {
    // Create animations for the player
    this.anims.create({
      key: "walk_down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "walk_right",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "walk_left",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "walk_up",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1
    });

    // After preloading and setting up animations, start the main game scene.
    this.scene.start("playGame");
  }
}

class Scene2 extends Phaser.Scene {
  constructor() {
    super("playGame");
  }

  create() {
    // A container to store all players’ sprites.
    this.players = {};
    // Create a physics group for tables.
    this.tables = this.physics.add.group({ immovable: true });

    // Add a background image.
    this.background = this.add.tileSprite(
      0,
      0,
      this.sys.game.config.width,
      this.sys.game.config.height,
      "background"
    );
    this.background.setOrigin(0, 0);

    // Create the local player sprite.
    this.player = this.physics.add.sprite(
      this.sys.game.config.width / 2,
      this.sys.game.config.height - 64,
      "player"
    );
    this.player.setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.direction = "down";

    // -------------------------------
    // Set up all socket event listeners
    // -------------------------------

    // Listen for the list of current players (including self and others).
    socket.on("currentPlayers", (players) => {
      Object.keys(players).forEach((id) => {
        if (!this.players[id]) {
          this.players[id] = this.add.sprite(players[id].x, players[id].y, "player");
        }
      });
    });

    // When a new player joins, add their sprite.
    socket.on("newPlayer", (playerInfo) => {
      this.players[playerInfo.id] = this.add.sprite(playerInfo.x, playerInfo.y, "player");
    });

    // Update a player’s position when they move.
    socket.on("playerMoved", (playerInfo) => {
      if (this.players[playerInfo.id]) {
        this.players[playerInfo.id].setPosition(playerInfo.x, playerInfo.y);
      }
    });

    // Remove a player when they disconnect.
    socket.on("removePlayer", (id) => {
      if (this.players[id]) {
        this.players[id].destroy();
        delete this.players[id];
      }
    });

    // When a table is placed by any player.
    socket.on("tablePlaced", (tableInfo) => {
      let table = this.tables.create(tableInfo.x, tableInfo.y, "table");
      table.setImmovable(true);
    });

    // -------------------------------
    // Signal to the server that this player is ready,
    // sending the starting position.
    // -------------------------------
    socket.emit("playerReady", { x: this.player.x, y: this.player.y });

    // Allow the local player to place a table by clicking/tapping.
    this.input.on("pointerdown", () => this.placeTable(this.player.x, this.player.y));
  }

  update() {
    this.movePlayerManager();
  }

  // Handles player movement and sends updated positions to the server.
  movePlayerManager() {
    const speed = 100;
    this.player.body.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
      this.player.anims.play("walk_left", true);
      this.direction = "left";
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
      this.player.anims.play("walk_right", true);
      this.direction = "right";
    } else if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-speed);
      this.player.anims.play("walk_up", true);
      this.direction = "up";
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(speed);
      this.player.anims.play("walk_down", true);
      this.direction = "down";
    } else {
      this.player.anims.stop();
    }

    // Normalize the velocity so diagonal movement isn't faster.
    this.player.body.velocity.normalize().scale(speed);

    // Emit the new position to the server.
    socket.emit("move", { x: this.player.x, y: this.player.y });
  }

  // Places a table relative to the player’s current facing direction.
  placeTable(x, y) {
    switch (this.direction) {
      case "left":
        x -= 48;
        break;
      case "right":
        x += 48;
        break;
      case "up":
        y -= 40;
        break;
      case "down":
        y += 40;
        break;
      default:
        break;
    }

    // Create the table locally and emit the event.
    let table = this.tables.create(x, y, "table");
    table.setImmovable(true);
    socket.emit("placeTable", { x, y });
  }
}

const Game = () => {
  useEffect(() => {
    const config = {
        type: Phaser.AUTO,
        parent: "game-container",
        width: window.innerWidth,
        height: window.innerHeight,
        antialias: false, // Disable antialiasing if enabled
        backgroundColor: 0xF08080,
        physics: { default: "arcade", arcade: { debug: false } },
        scene: [Scene1, Scene2]
    };
    

    const game = new Phaser.Game(config);

    // Clean up the game instance on component unmount.
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="game-container" />;
};

export default Game;
