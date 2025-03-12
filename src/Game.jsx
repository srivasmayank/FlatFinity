// Game.js
import React, { useEffect,useState } from "react";
import Phaser from "phaser";
import { io } from "socket.io-client";
import freeice from "freeice";

// Initialize socket with auto-reconnect disabled.
const socket = io("http://localhost:3000", { reconnection: false });
class WaitingRoom extends Phaser.Scene {
  constructor() {
    super("waitingRoom");
  }

  create() {
    // Manually connect if not connected.
   

    // Background and title
    this.add
      .rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x1e1e1e)
      .setOrigin(0, 0);
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
      <div class="bg-gray-800 bg-opacity-90 rounded-lg p-5 w-80 text-center shadow-lg">
        <h2 class="text-white text-xl font-sans mb-4">Create Room</h2>
        <input id="createRoomName" type="text" placeholder="Room Name" 
          class="w-full p-2 mb-2 rounded-md text-lg border-none outline-none bg-gray-700 text-white placeholder-gray-400" />
        <input id="createUsername" type="text" placeholder="Username" 
          class="w-full p-2 mb-2 rounded-md text-lg border-none outline-none bg-gray-700 text-white placeholder-gray-400" />
        <input id="createPassword" type="password" placeholder="Password" 
          class="w-full p-2 mb-4 rounded-md text-lg border-none outline-none bg-gray-700 text-white placeholder-gray-400" />
        <button id="createRoomButton" 
          class="px-4 py-2 bg-gray-700 text-white rounded-md text-lg cursor-pointer hover:bg-gray-600 transition">
          Create
        </button>
      </div>
    `;
    const createRoomElement = this.add
      .dom(this.cameras.main.centerX, 150)
      .createFromHTML(createRoomHTML);

    // --- Join Room Panel ---
    const joinRoomHTML = `
      <div class="bg-gray-800 bg-opacity-90 rounded-lg p-5 w-80 text-center shadow-lg">
        <h2 class="text-white text-xl font-sans mb-4">Join Room</h2>
        <input id="joinRoomName" type="text" placeholder="Room Name" 
          class="w-full p-2 mb-2 rounded-md text-lg border-none outline-none bg-gray-700 text-white placeholder-gray-400" />
        <input id="joinUsername" type="text" placeholder="Username" 
          class="w-full p-2 mb-2 rounded-md text-lg border-none outline-none bg-gray-700 text-white placeholder-gray-400" />
        <input id="joinPassword" type="password" placeholder="Password" 
          class="w-full p-2 mb-4 rounded-md text-lg border-none outline-none bg-gray-700 text-white placeholder-gray-400" />
        <button id="joinRoomButton" 
          class="px-4 py-2 bg-gray-700 text-white rounded-md text-lg cursor-pointer hover:bg-gray-600 transition">
          Join
        </button>
      </div>
    `;
    const joinRoomElement = this.add
      .dom(this.cameras.main.centerX, 400)
      .createFromHTML(joinRoomHTML);

    // --- Event Listeners ---
    const createRoomButton = createRoomElement.getChildByID("createRoomButton");
    createRoomButton.addEventListener("click", () => {
      // Ensure socket is connected before emitting.
      if (!socket.connected) socket.connect();
      createRoomButton.disabled = true;
      const roomName = createRoomElement.getChildByID("createRoomName").value;
      const username = createRoomElement.getChildByID("createUsername").value;
      const password = createRoomElement.getChildByID("createPassword").value;
      if (roomName && username && password) {
        socket.emit("createRoom", { roomId: roomName, username, password });
        this.scene.start("bootGame", { roomId: roomName });
      }
    });

    const joinRoomButton = joinRoomElement.getChildByID("joinRoomButton");
    joinRoomButton.addEventListener("click", () => {
      // Ensure socket is connected before emitting.
      if (!socket.connected) socket.connect();
      joinRoomButton.disabled = true;
      const roomName = joinRoomElement.getChildByID("joinRoomName").value;
      const username = joinRoomElement.getChildByID("joinUsername").value;
      const password = joinRoomElement.getChildByID("joinPassword").value;
      if (roomName && username && password) {
        socket.emit("joinRoom", { roomId: roomName, username, password });
        this.scene.start("bootGame", { roomId: roomName });
      }
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
    this.load.spritesheet("player", "/assets/spritesheets/player.png", { frameWidth: 32, frameHeight: 35.5 });
    this.load.image("table", "/assets/spritesheets/table2.png");
  }

  create() {
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
    this.scene.start("playGame");
  }
}

class Scene2 extends Phaser.Scene {
  constructor() {
    super("playGame");
  }

  // Receive roomId from WaitingRoom.
  init(data) {
    this.roomId = data.roomId || "";
  }

  async create() {
    this.remotePlayers = {};    // remote sprites keyed by socket id
    this.voiceChatPeers = {};   // RTCPeerConnections keyed by remote id
    this.voiceChatUI = {};      // DOM elements for voice control keyed by remote id

    // Background
    this.background = this.add.tileSprite(
      0,
      0,
      this.sys.game.config.width,
      this.sys.game.config.height,
      "background"
    ).setOrigin(0, 0);

    // Local player sprite
    this.player = this.physics.add.sprite(
      this.sys.game.config.width / 2,
      this.sys.game.config.height - 64,
      "player"
    );
    this.player.setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.direction = "down";
    this.mySocketId = socket.id;
    socket.on("connect", () => {
      this.mySocketId = socket.id;
    });

    // Request local audio
    try {
      this.localAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
    } catch (err) {
      console.error("Error accessing local audio:", err);
    }

    // --- Leave Room Button ---
    this.leaveButton = this.add
      .dom(this.cameras.main.width - 100, 50, "button", 
        "padding:10px; font-size:16px; background-color:#2d2d2d; color:white; border:none; border-radius:5px; cursor:pointer;", 
        "Leave Room"
      )
      .setScrollFactor(0);
    this.leaveButton.addListener("click");
    this.leaveButton.on("click", () => { this.leaveRoom(this.mySocketId); });

    // --- Voice Chat Signaling ---
    socket.on("voiceOffer", async (data) => {
      const remoteId = data.caller;
      let peer = this.voiceChatPeers[remoteId];
      if (!peer) {
        peer = this.createVoicePeer(remoteId);
        this.voiceChatPeers[remoteId] = peer;
      }
      try {
        await peer.setRemoteDescription(data.sdp);
      } catch (e) {
        console.error("Error in setRemoteDescription (offer):", e);
      }
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("voiceAnswer", { target: remoteId, sdp: answer });
    });

    socket.on("voiceAnswer", async (data) => {
      const remoteId = data.caller;
      const peer = this.voiceChatPeers[remoteId];
      if (peer && peer.signalingState === "have-local-offer") {
        try {
          await peer.setRemoteDescription(data.sdp);
        } catch (e) {
          console.error("Error in setRemoteDescription (answer):", e);
        }
      }
    });

    socket.on("voiceCandidate", async (data) => {
      const remoteId = data.from;
      const peer = this.voiceChatPeers[remoteId];
      if (peer && data.candidate) {
        try {
          await peer.addIceCandidate(data.candidate);
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    // --- Multiplayer Listeners ---
    socket.on("currentPlayers", (playersObj) => {
      if (!this.roomId && playersObj[this.mySocketId]) {
        this.roomId = playersObj[this.mySocketId].roomId;
      }
      Object.keys(playersObj).forEach((id) => {
        if (id === this.mySocketId) return;
        if (!this.remotePlayers[id]) {
          const sprite = this.add.sprite(playersObj[id].x, playersObj[id].y, "player");
          sprite.username = playersObj[id].username;
          this.remotePlayers[id] = sprite;
          // Initiate voice negotiation.
          let peer = this.createVoicePeer(id);
          this.voiceChatPeers[id] = peer;
          peer.createOffer().then((offer) => {
            peer.setLocalDescription(offer);
            socket.emit("voiceOffer", { target: id, sdp: offer });
          });
        }
      });
    });

    socket.on("newPlayer", (playerInfo) => {
      if (playerInfo.id === this.mySocketId) return;
      if (!this.remotePlayers[playerInfo.id]) {
        const sprite = this.add.sprite(playerInfo.x, playerInfo.y, "player");
        sprite.username = playerInfo.username;
        this.remotePlayers[playerInfo.id] = sprite;
        if (!this.voiceChatPeers[playerInfo.id]) {
          let peer = this.createVoicePeer(playerInfo.id);
          this.voiceChatPeers[playerInfo.id] = peer;
        }
      }
    });

    socket.on("playerMoved", (playerInfo) => {
      const remoteSprite = this.remotePlayers[playerInfo.id];
      if (remoteSprite) {
        remoteSprite.setPosition(playerInfo.x, playerInfo.y);
        if (playerInfo.isMoving) {
          if (playerInfo.direction === "left") {
            remoteSprite.anims.play("walk_left", true);
          } else if (playerInfo.direction === "right") {
            remoteSprite.anims.play("walk_right", true);
          } else if (playerInfo.direction === "up") {
            remoteSprite.anims.play("walk_up", true);
          } else if (playerInfo.direction === "down") {
            remoteSprite.anims.play("walk_down", true);
          }
        } else {
          remoteSprite.anims.stop();
          if (playerInfo.direction === "left") {
            remoteSprite.setFrame(8);
          } else if (playerInfo.direction === "right") {
            remoteSprite.setFrame(4);
          } else if (playerInfo.direction === "up") {
            remoteSprite.setFrame(12);
          } else {
            remoteSprite.setFrame(0);
          }
        }
      }
    });

    this.mySocketId = socket.id;
    socket.on("socketId", (data) => {
      console.log("Received Socket ID:", data.socketId);
      setMySocketId(data.socketId);
    });
    
    socket.on("removePlayer", (id) => {
      if (this.remotePlayers[id]) {
        this.remotePlayers[id].destroy();
        delete this.remotePlayers[id];
        console.log("removing the spritesheet",id)
      }
      if (this.voiceChatUI[id]) {
        this.voiceChatUI[id].destroy();
        delete this.voiceChatUI[id];
      }
      if (this.voiceChatPeers[id]) {
        this.voiceChatPeers[id].close();
        delete this.voiceChatPeers[id];
      }
    });

    socket.emit("playerReady", {
      x: this.player.x,
      y: this.player.y,
      direction: this.direction,
      isMoving: false
    });
  }

  createVoicePeer(remoteId) {
    const peer = new RTCPeerConnection({ iceServers: freeice() });
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => {
        peer.addTrack(track, this.localAudioStream);
      });
    }
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("voiceCandidate", { target: remoteId, candidate: event.candidate });
      }
    };
    peer.ontrack = async (event) => {
      if (!peer.audioElement) {
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.style.display = "none";
        audio.srcObject = event.streams[0];
        try {
          await audio.play();
        } catch (e) {
          console.error("Error playing remote audio:", e);
        }
        document.body.appendChild(audio);
        peer.audioElement = audio;
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(event.streams[0]);
        source.connect(analyser);
        peer.analyser = analyser;
        peer.audioContext = audioContext;
      }
    };
    peer.manualMute = false;
    return peer;
  }

  update() {
    this.movePlayerManager();

    // --- Voice Chat UI Update ---
    Object.keys(this.remotePlayers).forEach((remoteId) => {
      const remoteSprite = this.remotePlayers[remoteId];
      const peer = this.voiceChatPeers[remoteId];
      const dx = this.player.x - remoteSprite.x;
      const dy = this.player.y - remoteSprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const threshold = 200; // Adjust threshold as needed

      if (distance < threshold) {
        if (peer && peer.audioElement && !peer.manualMute) {
          peer.audioElement.muted = false;
        }
        if (!this.voiceChatUI[remoteId]) {
          const uiElement = this.add.dom(remoteSprite.x, remoteSprite.y - 50, "div", 
            "width:20px; height:20px; border:2px solid white; background:transparent; cursor:pointer;",
            ""
          ).setInteractive();
          uiElement.addListener("click");
          uiElement.on("click", () => {
            if (peer && peer.audioElement) {
              peer.manualMute = !peer.manualMute;
              peer.audioElement.muted = peer.manualMute;
            }
          });
          this.voiceChatUI[remoteId] = uiElement;
        } else {
          this.voiceChatUI[remoteId].setVisible(true);
          this.voiceChatUI[remoteId].setPosition(remoteSprite.x, remoteSprite.y - 50);
        }
        let isSpeaking = false;
        if (peer && peer.analyser && !peer.manualMute) {
          const dataArray = new Uint8Array(peer.analyser.frequencyBinCount);
          peer.analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const avg = sum / dataArray.length;
          isSpeaking = avg > 20;
        }
        const uiNode = this.voiceChatUI[remoteId].node;
        uiNode.style.borderColor = (peer && !peer.manualMute && isSpeaking) ? "green" : "white";
      } else {
        if (peer && peer.audioElement) {
          peer.audioElement.muted = true;
        }
        if (this.voiceChatUI[remoteId]) {
          this.voiceChatUI[remoteId].setVisible(false);
        }
      }
    });
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
    const isMoving =
      this.cursors.left.isDown ||
      this.cursors.right.isDown ||
      this.cursors.up.isDown ||
      this.cursors.down.isDown;
    socket.emit("move", {
      x: this.player.x,
      y: this.player.y,
      direction: this.direction,
      isMoving
    });
  }

  leaveRoom(id) {
    const roomId = this.roomId;
    console.log("kkk",id)
    // Emit leaveRoom with an acknowledgment callback.
    
      
      
    socket.emit("leaveRoom", roomId);

    // Stop local audio tracks.
    if (this.localAudioStream && typeof this.localAudioStream.getTracks === "function") {
      this.localAudioStream.getTracks().forEach((track) => {
        if (track && typeof track.stop === "function") {
          track.stop();
        }
      });
      this.localAudioStream = null;
    }

    // Close all voice peer connections.
    Object.keys(this.voiceChatPeers).forEach((id) => {
      if (this.voiceChatPeers[id]) {
        this.voiceChatPeers[id].close();
        delete this.voiceChatPeers[id];
      }
    });

    // Transition back to the waiting room.
    this.scene.start("waitingRoom");
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
