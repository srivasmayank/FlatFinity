import React, { useEffect } from "react";
import Phaser from "phaser";
import { io } from "socket.io-client";

// Create a global socket connection
const socket = io("http://localhost:3000");

class WaitingRoom extends Phaser.Scene {
  constructor() {
    super("waitingRoom");
  }

  create() {
    // Background
    this.add
      .rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x1e1e1e)
      .setOrigin(0, 0);

    // Title
    this.add
      .text(this.cameras.main.centerX, 40, "Multiplayer Phaser Game", {
        fontSize: "40px",
        fill: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    // --- Create Room Panel ---
    const createRoomHTML = `
      <div style="
          background: rgba(68,68,68,0.9);
          border-radius: 10px;
          padding: 20px;
          width: 320px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        ">
        <h2 style="
            margin: 0 0 15px;
            color: #fff;
            font-family: Arial, sans-serif;
          ">Create Room</h2>
        <input id="createRoomName" type="text" placeholder="Room Name" style="
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
          ">
        <input id="createUsername" type="text" placeholder="Username" style="
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
          ">
        <input id="createPassword" type="password" placeholder="Password" style="
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
          ">
        <button id="createRoomButton" style="
            padding: 10px 20px;
            background: #2d2d2d;
            color: #fff;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            cursor: pointer;
          ">Create</button>
      </div>
    `;
    const createRoomElement = this.add
      .dom(this.cameras.main.centerX, 150)
      .createFromHTML(createRoomHTML);

    // --- Join Room Panel ---
    const joinRoomHTML = `
      <div style="
          background: rgba(68,68,68,0.9);
          border-radius: 10px;
          padding: 20px;
          width: 320px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        ">
        <h2 style="
            margin: 0 0 15px;
            color: #fff;
            font-family: Arial, sans-serif;
          ">Join Room</h2>
        <input id="joinRoomName" type="text" placeholder="Room Name" style="
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
          ">
        <input id="joinUsername" type="text" placeholder="Username" style="
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
          ">
        <input id="joinPassword" type="password" placeholder="Password" style="
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
          ">
        <button id="joinRoomButton" style="
            padding: 10px 20px;
            background: #2d2d2d;
            color: #fff;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            cursor: pointer;
          ">Join</button>
      </div>
    `;
    const joinRoomElement = this.add
      .dom(this.cameras.main.centerX, 400)
      .createFromHTML(joinRoomHTML);

    // --- Event Listeners for Buttons ---
    // Create Room Button
    const createRoomButton = createRoomElement.getChildByID("createRoomButton");
    createRoomButton.addEventListener("click", () => {
      createRoomButton.disabled = true;
      const roomName = createRoomElement.getChildByID("createRoomName").value;
      const username = createRoomElement.getChildByID("createUsername").value;
      const password = createRoomElement.getChildByID("createPassword").value;
      if (roomName && username && password) {
        socket.emit("createRoom", { roomId: roomName, username, password });
      }
    });

    // Join Room Button
    const joinRoomButton = joinRoomElement.getChildByID("joinRoomButton");
    joinRoomButton.addEventListener("click", () => {
      joinRoomButton.disabled = true;
      const roomName = joinRoomElement.getChildByID("joinRoomName").value;
      const username = joinRoomElement.getChildByID("joinUsername").value;
      const password = joinRoomElement.getChildByID("joinPassword").value;
      if (roomName && username && password) {
        socket.emit("joinRoom", { roomId: roomName, username, password });
      }
    });

    // --- Scene Transition Handlers ---
    const onRoomCreated = ({ roomId }) => {
      if (this.scene && this.scene.manager) {
        this.scene.start("bootGame");
      }
    };
    socket.on("roomCreated", onRoomCreated);
    this.events.once("shutdown", () => {
      socket.off("roomCreated", onRoomCreated);
    });

    const onRoomJoined = () => {
      if (this.scene && this.scene.manager) {
        this.scene.start("bootGame");
      }
    };
    socket.on("roomJoined", onRoomJoined);
    this.events.once("shutdown", () => {
      socket.off("roomJoined", onRoomJoined);
    });

    const onRoomError = ({ message }) => {
      alert(message);
    };
    socket.on("roomError", onRoomError);
    this.events.once("shutdown", () => {
      socket.off("roomError", onRoomError);
    });
  }
}

class Scene1 extends Phaser.Scene {
  constructor() {
    super("bootGame");
  }

  preload() {
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

    // Move to the main game scene
    this.scene.start("playGame");
  }
}

class Scene2 extends Phaser.Scene {
  constructor() {
    super("playGame");
  }

  create() {
    // Containers for remote players and tables
    this.remotePlayers = {};
    this.tables = this.physics.add.group({ immovable: true });

    // Background
    this.background = this.add.tileSprite(
      0,
      0,
      this.sys.game.config.width,
      this.sys.game.config.height,
      "background"
    );
    this.background.setOrigin(0, 0);

    // Local player sprite
    this.player = this.physics.add.sprite(
      this.sys.game.config.width / 2,
      this.sys.game.config.height - 64,
      "player"
    );
    this.player.setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.direction = "down"; // default starting direction

    // Save our socket id
    this.mySocketId = socket.id;
    socket.on("connect", () => {
      this.mySocketId = socket.id;
    });

    // --- Room-Specific Socket Listeners ---
    socket.on("currentPlayers", (players) => {
      Object.keys(players).forEach((id) => {
        if (id === this.mySocketId) return;
        if (!this.remotePlayers[id]) {
          // Create remote player sprite with a default frame (facing down)
          this.remotePlayers[id] = this.add.sprite(
            players[id].x,
            players[id].y,
            "player"
          );
        }
      });
    });

    socket.on("newPlayer", (playerInfo) => {
      if (playerInfo.id === this.mySocketId) return;
      if (this.remotePlayers[playerInfo.id]) return; // Prevent duplicates
      this.remotePlayers[playerInfo.id] = this.add.sprite(
        playerInfo.x,
        playerInfo.y,
        "player"
      );
    });

    socket.on("playerMoved", (playerInfo) => {
      if (this.remotePlayers[playerInfo.id]) {
        this.remotePlayers[playerInfo.id].setPosition(playerInfo.x, playerInfo.y);
        if (playerInfo.isMoving) {
          // Play the appropriate walking animation
          switch (playerInfo.direction) {
            case "left":
              this.remotePlayers[playerInfo.id].anims.play("walk_left", true);
              break;
            case "right":
              this.remotePlayers[playerInfo.id].anims.play("walk_right", true);
              break;
            case "up":
              this.remotePlayers[playerInfo.id].anims.play("walk_up", true);
              break;
            case "down":
              this.remotePlayers[playerInfo.id].anims.play("walk_down", true);
              break;
            default:
              this.remotePlayers[playerInfo.id].anims.stop();
              break;
          }
        } else {
          // Stop the animation and set an idle frame
          this.remotePlayers[playerInfo.id].anims.stop();
          let idleFrame;
          switch (playerInfo.direction) {
            case "left":
              idleFrame = 8; // first frame for left
              break;
            case "right":
              idleFrame = 4; // first frame for right
              break;
            case "up":
              idleFrame = 12; // first frame for up
              break;
            case "down":
            default:
              idleFrame = 0; // first frame for down
              break;
          }
          this.remotePlayers[playerInfo.id].setFrame(idleFrame);
        }
      }
    });

    socket.on("removePlayer", (id) => {
      if (this.remotePlayers[id]) {
        this.remotePlayers[id].destroy();
        delete this.remotePlayers[id];
      }
    });

    socket.on("tablePlaced", (tableInfo) => {
      let table = this.tables.create(tableInfo.x, tableInfo.y, "table");
      table.setImmovable(true);
    });

    // Notify the server this player is ready (not moving initially)
    socket.emit("playerReady", { x: this.player.x, y: this.player.y, direction: this.direction, isMoving: false });

    // Allow placing a table on pointer/tap
    this.input.on("pointerdown", () => this.placeTable(this.player.x, this.player.y));
  }

  update() {
    this.movePlayerManager();
  }

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

    // Determine if the player is moving
    const isMoving = this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown;

    // Send updated position, direction, and movement state to the server
    socket.emit("move", { x: this.player.x, y: this.player.y, direction: this.direction, isMoving });
  }

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
      antialias: false,
      backgroundColor: 0xf08080,
      physics: { default: "arcade", arcade: { debug: false } },
      dom: { createContainer: true },
      scene: [WaitingRoom, Scene1, Scene2]
    };

    const game = new Phaser.Game(config);
    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="game-container" />;
};

export default Game;
