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
  
  preload() {
    this.load.image("background", "assets/images/background.png"); // Load background image
  }
  
  create() {
    // Set background and title
    this.add.image(0, 0, "background")
      .setOrigin(0, 0)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

    this.add.text(this.cameras.main.centerX, 40, "Multiplayer Phaser Game", {
      fontSize: "40px",
      fill: "#ffffff",
      fontFamily: "Arial",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Combined tabbed form HTML
    const tabbedHTML = `
      <div class="tab-container" style="width: 400px; margin: 0; font-family: Arial;">
        <!-- Tab Buttons -->
        <div class="tab-buttons" style="display: flex; justify-content: space-around;">
          <button id="tab-create" class="rounded-tl-2xl w-full" style="padding: 10px 20px; border: none; background: #2d6476; color: white; cursor: pointer;">Create</button>
          <button id="tab-join" class="rounded-tr-2xl w-full" style="padding: 10px 20px; border: none; background: #6f0ccf; color: white; cursor: pointer;">Join</button>
        </div>
        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Create Tab -->
          <div id="create-tab" class="tab" style="display: block; background: #d4e7ef; padding: 20px;  border: 1px solid #a7ddf5;">
            <!-- Cartoon Animation Container -->
            <div class="cartoon" style="margin: 0 auto 20px; width: 200px; height: 200px;">
              <img src="https://i.ibb.co/98gpLCQ/l1.png" alt="" id="createAnimation1" style="width:100%; height:100%;">
              <img src="https://i.ibb.co/Vq5j4Vg/l2.png" alt="" id="createAnimation2" style="width:100%; height:100%; display:none;">
              <img src="https://i.ibb.co/Y0jsj90/l3.png" alt="" id="createAnimation3" style="width:100%; height:100%; display:none;">
            </div>
            <h2 style="text-align:center; color: #fff; margin-bottom: 20px;">Create Room</h2>
            <input id="createRoomName" type="text" placeholder="Room Name" 
              style="width: calc(100% - 20px); padding: 10px; margin-bottom: 10px; border: none; outline: none; background: #f4f4f4; display: block; margin-left: auto; margin-right: auto;"/>
            <input id="createUsername" type="text" placeholder="Username" 
              style="width: calc(100% - 20px); padding: 10px; margin-bottom: 10px; border: none; outline: none; background: #f4f4f4; display: block; margin-left: auto; margin-right: auto;"/>
            <input id="createPassword" type="password" placeholder="Password" 
              style="width: calc(100% - 20px); padding: 10px; margin-bottom: 10px; border: none; outline: none; background: #f4f4f4; display: block; margin-left: auto; margin-right: auto;"/>
            <button id="createRoomButton" 
              style="width: 100%; padding: 10px; background: #2d6476; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Create
            </button>
          </div>
          <!-- Join Tab -->
          <div id="join-tab" class="tab" style="display: none; background: #f3e8ff; padding: 20px; border: 1px solid #d1b3ff;">
            <!-- Cartoon Animation Container -->
            <div class="cartoon" style="margin: 0 auto 20px; width: 200px; height: 200px;">
              <img src="https://i.ibb.co/98gpLCQ/l1.png" alt="" id="joinAnimation1" style="width:100%; height:100%;">
              <img src="https://i.ibb.co/Vq5j4Vg/l2.png" alt="" id="joinAnimation2" style="width:100%; height:100%; display:none;">
              <img src="https://i.ibb.co/Y0jsj90/l3.png" alt="" id="joinAnimation3" style="width:100%; height:100%; display:none;">
            </div>
            <h2 style="text-align:center; color: #6f0ccf; margin-bottom: 20px;">Join Room</h2>
            <input id="joinRoomName" type="text" placeholder="Room Name" 
              style="width: calc(100% - 20px); padding: 10px; margin-bottom: 10px; border: none; outline: none; background: #fff; display: block; margin-left: auto; margin-right: auto;"/>
            <input id="joinUsername" type="text" placeholder="Username" 
              style="width: calc(100% - 20px); padding: 10px; margin-bottom: 10px; border: none; outline: none; background: #fff; display: block; margin-left: auto; margin-right: auto;"/>
            <input id="joinPassword" type="password" placeholder="Password" 
              style="width: calc(100% - 20px); padding: 10px; margin-bottom: 10px; border: none; outline: none; background: #fff; display: block; margin-left: auto; margin-right: auto;"/>
            <button id="joinRoomButton" 
              style="width: 100%; padding: 10px; background: #6f0ccf; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Join
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Create a DOM element with the combined HTML form
    const tabbedElement = this.add.dom(this.cameras.main.centerX, 400).createFromHTML(tabbedHTML);
    
    // --- Tab Switching Functionality ---
    const tabCreateButton = document.getElementById("tab-create");
    const tabJoinButton = document.getElementById("tab-join");
    const createTab = document.getElementById("create-tab");
    const joinTab = document.getElementById("join-tab");
    
    tabCreateButton.addEventListener("click", () => {
      createTab.style.display = "block";
      joinTab.style.display = "none";
      // Update button colors to indicate active tab
      tabCreateButton.style.background = "#2d6476";
      tabJoinButton.style.background = "#6f0ccf";
    });
    
    tabJoinButton.addEventListener("click", () => {
      createTab.style.display = "none";
      joinTab.style.display = "block";
      // Update button colors to indicate active tab
      tabCreateButton.style.background = "#6f0ccf";
      tabJoinButton.style.background = "#2d6476";
    });
    
    // --- Animation Event Listeners for Create Tab ---
    const createRoomName = document.getElementById("createRoomName");
    const createUsername = document.getElementById("createUsername");
    const createPassword = document.getElementById("createPassword");
    const createAnimation1 = document.getElementById("createAnimation1");
    const createAnimation2 = document.getElementById("createAnimation2");
    const createAnimation3 = document.getElementById("createAnimation3");
    
    const createShowDefault = () => {
      createAnimation1.style.display = "block";
      createAnimation2.style.display = "none";
      createAnimation3.style.display = "none";
    };
    
    createRoomName.addEventListener('focus', () => {
      createAnimation1.style.display = "none";
      createAnimation3.style.display = "block";
    });
    createUsername.addEventListener('focus', () => {
      createAnimation1.style.display = "none";
      createAnimation3.style.display = "block";
    });
    createPassword.addEventListener('focus', () => {
      createAnimation1.style.display = "none";
      createAnimation2.style.display = "block";
    });
    
    createRoomName.addEventListener('blur', createShowDefault);
    createUsername.addEventListener('blur', createShowDefault);
    createPassword.addEventListener('blur', createShowDefault);
    
    // --- Animation Event Listeners for Join Tab ---
    const joinRoomName = document.getElementById("joinRoomName");
    const joinUsername = document.getElementById("joinUsername");
    const joinPassword = document.getElementById("joinPassword");
    const joinAnimation1 = document.getElementById("joinAnimation1");
    const joinAnimation2 = document.getElementById("joinAnimation2");
    const joinAnimation3 = document.getElementById("joinAnimation3");
    
    const joinShowDefault = () => {
      joinAnimation1.style.display = "block";
      joinAnimation2.style.display = "none";
      joinAnimation3.style.display = "none";
    };
    
    joinRoomName.addEventListener('focus', () => {
      joinAnimation1.style.display = "none";
      joinAnimation3.style.display = "block";
    });
    joinUsername.addEventListener('focus', () => {
      joinAnimation1.style.display = "none";
      joinAnimation3.style.display = "block";
    });
    joinPassword.addEventListener('focus', () => {
      joinAnimation1.style.display = "none";
      joinAnimation2.style.display = "block";
    });
    
    joinRoomName.addEventListener('blur', joinShowDefault);
    joinUsername.addEventListener('blur', joinShowDefault);
    joinPassword.addEventListener('blur', joinShowDefault);
    
    // --- Form Submission Event Listeners ---
    const createRoomButton = document.getElementById("createRoomButton");
    createRoomButton.addEventListener("click", () => {
      if (!socket.connected) socket.connect();
      createRoomButton.disabled = true;
      const roomName = document.getElementById("createRoomName").value;
      const username = document.getElementById("createUsername").value;
      const password = document.getElementById("createPassword").value;
      if (roomName && username && password) {
        socket.emit("createRoom", { roomId: roomName, username, password });
        this.scene.start("bootGame", { roomId: roomName });
      }
    });
    
    const joinRoomButton = document.getElementById("joinRoomButton");
    joinRoomButton.addEventListener("click", () => {
      if (!socket.connected) socket.connect();
      joinRoomButton.disabled = true;
      const roomName = document.getElementById("joinRoomName").value;
      const username = document.getElementById("joinUsername").value;
      const password = document.getElementById("joinPassword").value;
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
    this.add.image(0, 0, "background")
      .setOrigin(0, 0)
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

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
