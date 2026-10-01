const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const levelEl = document.getElementById("level");
const zoneNameEl = document.getElementById("zone-name");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySubtitle = document.getElementById("overlay-subtitle");
const startBtn = document.getElementById("startBtn");

// Configurações Globais e Velocidade
const INITIAL_SPEED = 6.5;
let gameSpeed = INITIAL_SPEED;
let score = 0;
let level = 1;
let gameRunning = false;
let gameOver = false;

let bgOffset1 = 0;
let bgOffset2 = 0;
let globalAnimTime = 0;

let particles = [];
let obstacles = [];
let obstacleTimer = 0;

// Nomes das Fases
const ZONES = {
  1: "FLORESTA ENCANTADA",
  2: "DESERTO DAS RUÍNAS",
  3: "CIDADE CYBERPUNK",
  4: "CAVERNA DE LAVA",
  5: "ESTAÇÃO ESPACIAL"
};

// Tipos de Obstáculos por Fase
const OBSTACLE_TYPES = {
  1: ["cogumelo_venenoso", "tronco_mágico"],
  2: ["cacto_gigante", "esfera_espinhos"],
  3: ["drone_laser", "barreira_neon"],
  4: ["cristal_lava", "meteorito_fogo"],
  5: ["alien_flutuante", "portal_plasma"]
};

// Mapeamento de Teclas
const keys = {};

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }
  keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Partículas
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 5 + 2;
    this.speedX = (Math.random() - 0.5) * 3 - gameSpeed * 0.3;
    this.speedY = (Math.random() - 0.5) * 2;
    this.alpha = 1;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= 0.025;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Classe do Jogador
class Player {
  constructor(x, gender, shirtColor, hairColor, controls) {
    this.startX = x;
    this.x = x;
    this.baseY = 560;
    this.y = this.baseY;
    this.width = 40;
    this.height = 90;

    this.gender = gender;
    this.shirtColor = shirtColor;
    this.pantsColor = "#1e293b";
    this.hairColor = hairColor;
    this.skinColor = "#f0b088";
    this.controls = controls;

    this.vy = 0;
    this.gravity = 0.85;
    this.speed = 8;

    this.isJumping = false;
    this.isCrouching = false;
    this.alive = true;

    this.animFrame = 0;
  }

  reset() {
    this.x = this.startX;
    this.y = this.baseY;
    this.height = 90;
    this.vy = 0;
    this.isJumping = false;
    this.isCrouching = false;
    this.alive = true;
  }

  update() {
    if (!this.alive) return;

    if (keys[this.controls.jump] && !this.isJumping) {
      this.vy = -18;
      this.isJumping = true;
    }

    if (keys[this.controls.crouch] && !this.isJumping) {
      this.isCrouching = true;
      this.height = 50;
      this.y = this.baseY + 40;
    } else {
      if (this.isCrouching) {
        this.height = 90;
        this.y = this.baseY;
        this.isCrouching = false;
      }
    }

    if (keys[this.controls.left]) this.x -= this.speed;
    if (keys[this.controls.right]) this.x += this.speed;

    if (this.x < 20) this.x = 20;
    if (this.x + this.width > canvas.width - 20) this.x = canvas.width - this.width - 20;

    this.y += this.vy;
    this.vy += this.gravity;

    const currentBaseY = this.isCrouching ? this.baseY + 40 : this.baseY;
    if (this.y >= currentBaseY) {
      this.y = currentBaseY;
      this.vy = 0;
      this.isJumping = false;

      if (Math.random() > 0.4) {
        let pColor = level === 4 ? "#f97316" : (level === 3 ? "#06b6d4" : "rgba(200, 180, 150, 0.6)");
        particles.push(new Particle(this.x + 10, 650, pColor));
      }
    }

    this.animFrame += gameSpeed * 0.06;
  }

  draw() {
    if (!this.alive) return;

    const px = this.x;
    const py = this.y;
    const swing = Math.sin(this.animFrame) * (this.isJumping ? 0.2 : 0.8);

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(px + 20, 652, 25, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.isCrouching) {
      let shirtGrad = ctx.createLinearGradient(px, py + 20, px + 35, py + 40);
      shirtGrad.addColorStop(0, this.shirtColor);
      shirtGrad.addColorStop(1, "#111");
      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.roundRect(px + 5, py + 20, 32, 22, 6);
      ctx.fill();

      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 25, py + 12, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(px + 22, py + 8, 12, Math.PI * 0.8, Math.PI * 2.1);
      ctx.fill();

      ctx.fillStyle = this.pantsColor;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 38, 36, 14, 4);
      ctx.fill();
    } else {
      if (this.gender === "female") {
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        ctx.arc(px + 5 - Math.sin(swing) * 6, py + 20, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.strokeStyle = this.pantsColor;

      ctx.beginPath();
      ctx.moveTo(px + 20, py + 50);
      ctx.lineTo(px + 20 - Math.sin(swing) * 20, py + 70);
      ctx.lineTo(px + 20 - Math.sin(swing) * 20 + 6, py + 86);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px + 20, py + 50);
      ctx.lineTo(px + 20 + Math.sin(swing) * 20, py + 70);
      ctx.lineTo(px + 20 + Math.sin(swing) * 20 + 6, py + 86);
      ctx.stroke();

      ctx.fillStyle = "#111";
      ctx.fillRect(px + 20 - Math.sin(swing) * 20 + 4, py + 83, 10, 7);
      ctx.fillRect(px + 20 + Math.sin(swing) * 20 + 4, py + 83, 10, 7);

      let shirtGrad = ctx.createLinearGradient(px + 10, py + 25, px + 30, py + 50);
      shirtGrad.addColorStop(0, this.shirtColor);
      shirtGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.roundRect(px + 9, py + 24, 22, 28, 6);
      ctx.fill();

      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 20, py + 14, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(px + 18, py + 11, 13.5, Math.PI * 0.75, Math.PI * 1.95);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(px + 26, py + 11, 3, 4);

      ctx.strokeStyle = this.skinColor;
      ctx.lineWidth = 6;

      ctx.beginPath();
      ctx.moveTo(px + 20, py + 28);
      ctx.lineTo(px + 20 - Math.cos(swing) * 18, py + 44);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px + 20, py + 28);
      ctx.lineTo(px + 20 + Math.cos(swing) * 18, py + 44);
      ctx.stroke();
    }
  }
}

// Classe dos Obstáculos
class Obstacle {
  constructor(kind) {
    this.x = canvas.width;
    this.kind = kind;

    switch (this.kind) {
      case "cogumelo_venenoso":
        this.width = 50; this.height = 65; this.y = 585;
        break;
      case "tronco_mágico":
        this.width = 65; this.height = 50; this.y = 500;
        break;
      case "cacto_gigante":
        this.width = 50; this.height = 80; this.y = 570;
        break;
      case "esfera_espinhos":
        this.width = 55; this.height = 55; this.y = 495;
        break;
      case "drone_laser":
        this.width = 60; this.height = 50; this.y = 490;
        break;
      case "barreira_neon":
        this.width = 45; this.height = 75; this.y = 575;
        break;
      case "cristal_lava":
        this.width = 55; this.height = 80; this.y = 570;
        break;
      case "meteorito_fogo":
        this.width = 60; this.height = 55; this.y = 490;
        break;
      case "alien_flutuante":
        this.width = 55; this.height = 55; this.y = 490;
        break;
      case "portal_plasma":
        this.width = 50; this.height = 85; this.y = 565;
        break;
      default:
        this.width = 50; this.height = 60; this.y = 590;
    }
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    ctx.save();
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    switch (this.kind) {
      case "cogumelo_venenoso":
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(x + w * 0.35, y + h * 0.4, w * 0.3, h * 0.6);
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.4, w / 2, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(x + w * 0.3, y + h * 0.25, 4, 0, Math.PI * 2);
        ctx.arc(x + w * 0.7, y + h * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "tronco_mágico":
        ctx.fillStyle = "#854d0e";
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(x + 10, y + 15, 12, 5);
        ctx.fillRect(x + 35, y + 28, 15, 5);
        break;

      case "cacto_gigante":
        ctx.fillStyle = "#16a34a";
        ctx.beginPath();
        ctx.roundRect(x + w * 0.3, y, w * 0.4, h, 8);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x, y + 25, w * 0.35, 12, 4);
        ctx.roundRect(x, y + 10, 10, 20, 4);
        ctx.roundRect(x + w * 0.65, y + 35, w * 0.35, 12, 4);
        ctx.roundRect(x + w - 10, y + 20, 10, 20, 4);
        ctx.fill();
        break;

      case "esfera_espinhos":
        ctx.fillStyle = "#b45309";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
          let ang = (i * Math.PI) / 4 + globalAnimTime * 0.05;
          ctx.beginPath();
          ctx.moveTo(x + w / 2, y + h / 2);
          ctx.lineTo(x + w / 2 + Math.cos(ang) * (w / 2), y + h / 2 + Math.sin(ang) * (h / 2));
          ctx.stroke();
        }
        break;

      case "drone_laser":
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.roundRect(x, y + 10, w, h - 20, 8);
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h);
        ctx.lineTo(x + w / 2, y + h + 15);
        ctx.stroke();
        break;

      case "barreira_neon":
        ctx.fillStyle = "#06b6d4";
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(x + 10, y, 20, h, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case "cristal_lava":
        ctx.fillStyle = "#ea580c";
        ctx.shadowColor = "#f97316";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h * 0.6);
        ctx.lineTo(x + w * 0.8, y + h);
        ctx.lineTo(x + w * 0.2, y + h);
        ctx.lineTo(x, y + h * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        break;

      case "meteorito_fogo":
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(x + w * 0.7, y + 5);
        ctx.lineTo(x + w + 20, y - 10);
        ctx.lineTo(x + w * 0.9, y + h * 0.6);
        ctx.fill();
        break;

      case "alien_flutuante":
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2 + 5, w / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2 - 2, 14, Math.PI, 0);
        ctx.fill();
        break;

      case "portal_plasma":
        let portalGrad = ctx.createRadialGradient(x + w / 2, y + h / 2, 5, x + w / 2, y + h / 2, w / 2);
        portalGrad.addColorStop(0, "#e11d48");
        portalGrad.addColorStop(1, "#4c0519");
        ctx.fillStyle = portalGrad;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    ctx.restore();
  }
}

// Instâncias dos Jogadores
const player1 = new Player(180, "female", "#ec4899", "#3b0764", {
  jump: "KeyW",
  crouch: "KeyS",
  left: "KeyA",
  right: "KeyD"
});

const player2 = new Player(260, "male", "#0284c7", "#eab308", {
  jump: "ArrowUp",
  crouch: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight"
});

// Colisão AABB
function checkCollision(player, obstacle) {
  return (
    player.x < obstacle.x + obstacle.width &&
    player.x + player.width > obstacle.x &&
    player.y < obstacle.y + obstacle.height &&
    player.y + player.height > obstacle.y
  );
}

// Renderização dos Cenários
function drawBackground() {
  globalAnimTime++;

  if (level === 1) {
    let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#0284c7");
    sky.addColorStop(1, "#bae6fd");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bgOffset1 -= gameSpeed * 0.15;
    if (bgOffset1 <= -600) bgOffset1 = 0;
    ctx.fillStyle = "#334155";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(bgOffset1 + i * 600, 650);
      ctx.lineTo(bgOffset1 + i * 600 + 300, 220);
      ctx.lineTo(bgOffset1 + i * 600 + 600, 650);
      ctx.fill();
    }

    bgOffset2 -= gameSpeed * 0.4;
    if (bgOffset2 <= -300) bgOffset2 = 0;
    for (let i = 0; i < 6; i++) {
      let tx = bgOffset2 + i * 300;
      ctx.fillStyle = "#78350f";
      ctx.fillRect(tx + 40, 420, 20, 230);
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.arc(tx + 50, 390, 50, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#16a34a";
    ctx.fillRect(0, 650, canvas.width, 70);

  } else if (level === 2) {
    let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#ea580c");
    sky.addColorStop(1, "#fef08a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(1000, 180, 90, 0, Math.PI * 2);
    ctx.fill();

    bgOffset1 -= gameSpeed * 0.15;
    if (bgOffset1 <= -600) bgOffset1 = 0;
    ctx.fillStyle = "#c2410c";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(bgOffset1 + i * 600 + 300, 800, 450, 0, Math.PI * 2);
      ctx.fill();
    }

    bgOffset2 -= gameSpeed * 0.3;
    if (bgOffset2 <= -500) bgOffset2 = 0;
    ctx.fillStyle = "#b45309";
    for (let i = 0; i < 4; i++) {
      let px = bgOffset2 + i * 500;
      ctx.beginPath();
      ctx.moveTo(px, 650);
      ctx.lineTo(px + 150, 380);
      ctx.lineTo(px + 300, 650);
      ctx.fill();
    }

    ctx.fillStyle = "#d97706";
    ctx.fillRect(0, 650, canvas.width, 70);

  } else if (level === 3) {
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bgOffset1 -= gameSpeed * 0.2;
    if (bgOffset1 <= -400) bgOffset1 = 0;
    for (let i = 0; i < 5; i++) {
      let bx = bgOffset1 + i * 320;
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(bx, 180, 180, 470);

      ctx.fillStyle = "#06b6d4";
      for (let j = 0; j < 8; j++) {
        ctx.fillRect(bx + 20, 210 + j * 50, 30, 20);
        ctx.fillRect(bx + 110, 210 + j * 50, 30, 20);
      }
    }

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 650, canvas.width, 70);
    ctx.fillStyle = "#ec4899";
    ctx.fillRect(0, 650, canvas.width, 4);

  } else if (level === 4) {
    ctx.fillStyle = "#1c0a00";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#451a03";
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 90, 0);
      ctx.lineTo(i * 90 + 45, 120 + (i % 3) * 30);
      ctx.lineTo(i * 90 + 90, 0);
      ctx.fill();
    }

    bgOffset1 -= gameSpeed * 0.2;
    if (bgOffset1 <= -600) bgOffset1 = 0;
    ctx.fillStyle = "#290d00";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(bgOffset1 + i * 600, 650);
      ctx.lineTo(bgOffset1 + i * 600 + 300, 300);
      ctx.lineTo(bgOffset1 + i * 600 + 600, 650);
      ctx.fill();
    }

    ctx.fillStyle = "#9a3412";
    ctx.fillRect(0, 650, canvas.width, 70);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(0, 650, canvas.width, 8);

  } else {
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 50; i++) {
      let sx = (i * 87) % canvas.width;
      let sy = (i * 43) % 500;
      let size = (i % 3) + 1;
      ctx.fillRect(sx, sy, size, size);
    }

    ctx.fillStyle = "#6366f1";
    ctx.beginPath();
    ctx.arc(200, 200, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(165, 180, 252, 0.6)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.ellipse(200, 200, 180, 40, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 650, canvas.width, 70);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(0, 650, canvas.width, 5);
  }
}

// Iniciar/Reiniciar o Jogo
function startGame() {
  score = 0;
  level = 1;
  gameSpeed = INITIAL_SPEED;
  gameOver = false;
  gameRunning = true;
  obstacles = [];
  particles = [];
  obstacleTimer = 0;

  player1.reset();
  player2.reset();

  overlay.style.display = "none";
  gameLoop();
}

// Fim de Jogo
function triggerGameOver() {
  gameOver = true;
  gameRunning = false;

  overlayTitle.textContent = "FIM DE JOGO!";
  overlaySubtitle.textContent = `Você chegou na Zona ${level} (${ZONES[level]}) com ${Math.floor(score)} PONTOS!`;
  startBtn.textContent = "REINICIAR JOGO";
  overlay.style.display = "flex";
}

// Loop Principal
function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fundo
  drawBackground();

  // Partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].alpha <= 0) particles.splice(i, 1);
  }

  // AUMENTO PROGRESSIVO DA VELOCIDADE DO JOGO
  // A cada quadro a velocidade aumenta continuamente
  gameSpeed += 0.0025;
  score += 0.1 * (gameSpeed / INITIAL_SPEED);

  // Lógica de Troca de Fases
  if (score >= 1200) {
    level = 5;
  } else if (score >= 900) {
    level = 4;
  } else if (score >= 600) {
    level = 3;
  } else if (score >= 300) {
    level = 2;
  } else {
    level = 1;
  }

  score1El.textContent = Math.floor(score);
  score2El.textContent = Math.floor(score);
  levelEl.textContent = level;
  zoneNameEl.textContent = ZONES[level];

  // Jogadores
  player1.update();
  player1.draw();

  player2.update();
  player2.draw();

  // Gerar Obstáculos (adaptado à nova velocidade)
  obstacleTimer++;
  const spawnThreshold = Math.max(30, 110 - gameSpeed * 4.5);
  if (obstacleTimer > spawnThreshold) {
    const availableKinds = OBSTACLE_TYPES[level];
    const randomKind = availableKinds[Math.floor(Math.random() * availableKinds.length)];
    obstacles.push(new Obstacle(randomKind));
    obstacleTimer = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.update();
    obs.draw();

    if (player1.alive && checkCollision(player1, obs)) player1.alive = false;
    if (player2.alive && checkCollision(player2, obs)) player2.alive = false;

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // Fim do Jogo se ambos morrerem
  if (!player1.alive && !player2.alive) {
    triggerGameOver();
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Evento do Botão Iniciar/Reiniciar
startBtn.addEventListener("click", startGame);