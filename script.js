const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");
const levelEl = document.getElementById("level");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySubtitle = document.getElementById("overlay-subtitle");
const startBtn = document.getElementById("startBtn");

// Configurações do Jogo
let gameSpeed = 7;
let score = 0;
let level = 1;
let gameRunning = false;
let gameOver = false;

let bgOffset1 = 0;
let bgOffset2 = 0;
let particles = [];
let obstacles = [];
let obstacleTimer = 0;

// Tipos de Obstáculos por Fase
const OBSTACLE_TYPES = {
  1: ["stone", "log"],                           // Fase 1: Floresta (Pedras e Troncos)
  2: ["cactus", "tumbleweed"],                  // Fase 2: Deserto (Cactos e Arbusto)
  3: ["iceberg", "stalagmite", "floating_ice"]  // Fase 3: Gelo (Icebergs, Estalagmites e Placas)
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

// Jogador
class Player {
  constructor(x, gender, shirtColor, hairColor, controls) {
    this.startX = x;
    this.x = x;
    this.baseY = 560; // Ajustado para resolução 1280x720
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
    this.speed = 7;

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

    // Pulo
    if (keys[this.controls.jump] && !this.isJumping) {
      this.vy = -18;
      this.isJumping = true;
    }

    // Agachar
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

    // Movimentação
    if (keys[this.controls.left]) this.x -= this.speed;
    if (keys[this.controls.right]) this.x += this.speed;

    // Limites de tela
    if (this.x < 20) this.x = 20;
    if (this.x + this.width > canvas.width - 20) this.x = canvas.width - this.width - 20;

    // Gravidade
    this.y += this.vy;
    this.vy += this.gravity;

    const currentBaseY = this.isCrouching ? this.baseY + 40 : this.baseY;
    if (this.y >= currentBaseY) {
      this.y = currentBaseY;
      this.vy = 0;
      this.isJumping = false;

      if (Math.random() > 0.4) {
        particles.push(new Particle(this.x + 10, 650, "rgba(200, 180, 150, 0.6)"));
      }
    }

    this.animFrame += gameSpeed * 0.06;
  }

  draw() {
    if (!this.alive) return;

    const px = this.x;
    const py = this.y;
    const swing = Math.sin(this.animFrame) * (this.isJumping ? 0.2 : 0.8);

    // Sombra
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(px + 20, 652, 25, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.isCrouching) {
      // Agachado
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
      // Em pé
      if (this.gender === "female") {
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        ctx.arc(px + 5 - Math.sin(swing) * 6, py + 20, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.strokeStyle = this.pantsColor;

      // Perna Traseira
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 50);
      ctx.lineTo(px + 20 - Math.sin(swing) * 20, py + 70);
      ctx.lineTo(px + 20 - Math.sin(swing) * 20 + 6, py + 86);
      ctx.stroke();

      // Perna Dianteira
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 50);
      ctx.lineTo(px + 20 + Math.sin(swing) * 20, py + 70);
      ctx.lineTo(px + 20 + Math.sin(swing) * 20 + 6, py + 86);
      ctx.stroke();

      // Sapatos
      ctx.fillStyle = "#111";
      ctx.fillRect(px + 20 - Math.sin(swing) * 20 + 4, py + 83, 10, 7);
      ctx.fillRect(px + 20 + Math.sin(swing) * 20 + 4, py + 83, 10, 7);

      // Tronco
      let shirtGrad = ctx.createLinearGradient(px + 10, py + 25, px + 30, py + 50);
      shirtGrad.addColorStop(0, this.shirtColor);
      shirtGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.roundRect(px + 9, py + 24, 22, 28, 6);
      ctx.fill();

      // Cabeça
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 20, py + 14, 13, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo
      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(px + 18, py + 11, 13.5, Math.PI * 0.75, Math.PI * 1.95);
      ctx.fill();

      // Olho
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(px + 26, py + 11, 3, 4);

      // Braços
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

// Obstáculos Variados por Fase
class Obstacle {
  constructor(kind) {
    this.x = canvas.width;
    this.kind = kind;

    // Configuração baseada no tipo de obstáculo
    switch (this.kind) {
      case "stone":
        this.width = 50;
        this.height = 60;
        this.y = 590;
        break;
      case "log":
        this.width = 55;
        this.height = 50;
        this.y = 500; // Necessita agachar
        break;
      case "cactus":
        this.width = 45;
        this.height = 75;
        this.y = 575;
        break;
      case "tumbleweed":
        this.width = 50;
        this.height = 50;
        this.y = 500; // Necessita agachar
        break;
      case "iceberg":
        this.width = 60;
        this.height = 80;
        this.y = 570;
        break;
      case "stalagmite":
        this.width = 45;
        this.height = 65;
        this.y = 585;
        break;
      case "floating_ice":
        this.width = 65;
        this.height = 45;
        this.y = 505; // Necessita agachar
        break;
      default:
        this.width = 50;
        this.height = 60;
        this.y = 590;
    }
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    ctx.save();
    switch (this.kind) {
      case "stone":
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 8);
        ctx.fill();
        break;

      case "log":
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 6);
        ctx.fill();
        break;

      case "cactus":
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        // Espinhos/Braços
        ctx.fillRect(this.x - 8, this.y + 20, 10, 15);
        ctx.fillRect(this.x + this.width - 2, this.y + 35, 10, 15);
        break;

      case "tumbleweed":
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "iceberg":
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.fill();
        break;

      case "stalagmite":
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.fill();
        break;

      case "floating_ice":
        ctx.fillStyle = "#bae6fd";
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
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

// Desenhar Cenário conforme a Fase
function drawBackground() {
  if (level === 1) {
    // Fase 1: Floresta
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, "#0284c7");
    skyGrad.addColorStop(1, "#bae6fd");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Montanhas
    bgOffset1 -= gameSpeed * 0.15;
    if (bgOffset1 <= -600) bgOffset1 = 0;
    ctx.fillStyle = "#64748b";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(bgOffset1 + i * 600, 650);
      ctx.lineTo(bgOffset1 + i * 600 + 300, 250);
      ctx.lineTo(bgOffset1 + i * 600 + 600, 650);
      ctx.fill();
    }

    // Chão
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, 650, canvas.width, 70);

  } else if (level === 2) {
    // Fase 2: Deserto
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, "#f97316");
    skyGrad.addColorStop(1, "#fef08a");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dunas
    bgOffset1 -= gameSpeed * 0.15;
    if (bgOffset1 <= -600) bgOffset1 = 0;
    ctx.fillStyle = "#ea580c";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(bgOffset1 + i * 600 + 300, 750, 400, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chão
    ctx.fillStyle = "#d97706";
    ctx.fillRect(0, 650, canvas.width, 70);

  } else {
    // Fase 3: Neve / Gelo
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, "#0f172a");
    skyGrad.addColorStop(1, "#38bdf8");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Montanhas Geladas
    bgOffset1 -= gameSpeed * 0.15;
    if (bgOffset1 <= -600) bgOffset1 = 0;
    ctx.fillStyle = "#94a3b8";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(bgOffset1 + i * 600, 650);
      ctx.lineTo(bgOffset1 + i * 600 + 300, 200);
      ctx.lineTo(bgOffset1 + i * 600 + 600, 650);
      ctx.fill();
    }

    // Chão
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 650, canvas.width, 70);
  }
}

// Iniciar/Reiniciar o Jogo
function startGame() {
  score = 0;
  level = 1;
  gameSpeed = 7;
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
  overlaySubtitle.textContent = `Você alcançou a Fase ${level} com ${Math.floor(score)} pontos!`;
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

  // Pontuação e Progressão de Fases
  score += 0.1;
  gameSpeed += 0.0008;

  // Lógica de Fases
  if (score >= 600) {
    level = 3;
  } else if (score >= 300) {
    level = 2;
  } else {
    level = 1;
  }

  score1El.textContent = Math.floor(score);
  score2El.textContent = Math.floor(score);
  levelEl.textContent = level;

  // Jogadores
  player1.update();
  player1.draw();

  player2.update();
  player2.draw();

  // Gerar Obstáculos por Fase
  obstacleTimer++;
  if (obstacleTimer > Math.max(40, 95 - gameSpeed * 3)) {
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