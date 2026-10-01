const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");

// Configurações do Jogo
let gameSpeed = 6;
let score = 0;
let gameOver = false;
let bgOffset1 = 0;
let bgOffset2 = 0;
let particles = [];

// Controle de Teclas
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

// Partículas de Poeira e Colisão
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 4 + 2;
    this.speedX = (Math.random() - 0.5) * 2 - gameSpeed * 0.3;
    this.speedY = (Math.random() - 0.5) * 1.5;
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

// Classe do Jogador 2D Lateral
class Player {
  constructor(x, gender, shirtColor, hairColor, controls) {
    this.startX = x;
    this.x = x;
    this.baseY = 350;
    this.y = this.baseY;
    this.width = 30;
    this.height = 68;

    this.gender = gender;
    this.shirtColor = shirtColor;
    this.pantsColor = "#1e293b";
    this.hairColor = hairColor;
    this.skinColor = "#f0b088";
    this.controls = controls;

    this.vy = 0;
    this.gravity = 0.75;
    this.speed = 5;

    this.isJumping = false;
    this.isCrouching = false;
    this.alive = true;

    this.animFrame = 0;
  }

  update() {
    if (!this.alive) return;

    // Pulo
    if (keys[this.controls.jump] && !this.isJumping) {
      this.vy = -14.5;
      this.isJumping = true;
    }

    // Agachar
    if (keys[this.controls.crouch] && !this.isJumping) {
      this.isCrouching = true;
      this.height = 38;
      this.y = this.baseY + 30;
    } else {
      if (this.isCrouching) {
        this.height = 68;
        this.y = this.baseY;
        this.isCrouching = false;
      }
    }

    // Movimentação Lateral
    if (keys[this.controls.left]) this.x -= this.speed;
    if (keys[this.controls.right]) this.x += this.speed;

    // Limites de tela
    if (this.x < 10) this.x = 10;
    if (this.x + this.width > canvas.width - 10) this.x = canvas.width - this.width - 10;

    // Gravidade
    this.y += this.vy;
    this.vy += this.gravity;

    const currentBaseY = this.isCrouching ? this.baseY + 30 : this.baseY;
    if (this.y >= currentBaseY) {
      this.y = currentBaseY;
      this.vy = 0;
      this.isJumping = false;

      // Poeira ao correr no chão
      if (Math.random() > 0.4) {
        particles.push(new Particle(this.x + 5, 418, "rgba(200, 180, 150, 0.6)"));
      }
    }

    this.animFrame += gameSpeed * 0.08;
  }

  draw() {
    if (!this.alive) return;

    const px = this.x;
    const py = this.y;
    const swing = Math.sin(this.animFrame) * (this.isJumping ? 0.2 : 0.7);

    // Sombra suave no chão
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(px + 15, 420, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.isCrouching) {
      // --- PERSONAGEM AGACHADO 2D ---
      let shirtGrad = ctx.createLinearGradient(px, py + 15, px + 25, py + 30);
      shirtGrad.addColorStop(0, this.shirtColor);
      shirtGrad.addColorStop(1, "#111");
      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.roundRect(px + 5, py + 15, 24, 15, 4);
      ctx.fill();

      // Cabeça
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 20, py + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo
      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(px + 17, py + 5, 9, Math.PI * 0.8, Math.PI * 2.1);
      ctx.fill();

      // Pernas Dobradas
      ctx.fillStyle = this.pantsColor;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 28, 26, 10, 3);
      ctx.fill();
    } else {
      // --- PERSONAGEM EM PÉ / CORRENDO 2D ---

      // 1. Cabelo Longo (Feminino)
      if (this.gender === "female") {
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        ctx.arc(px + 4 - Math.sin(swing) * 5, py + 15, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Pernas Articuladas
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.strokeStyle = this.pantsColor;

      // Perna Traseira
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 38);
      ctx.lineTo(px + 15 - Math.sin(swing) * 16, py + 52);
      ctx.lineTo(px + 15 - Math.sin(swing) * 16 + 5, py + 63);
      ctx.stroke();

      // Perna Dianteira
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 38);
      ctx.lineTo(px + 15 + Math.sin(swing) * 16, py + 52);
      ctx.lineTo(px + 15 + Math.sin(swing) * 16 + 5, py + 63);
      ctx.stroke();

      // Sapatos
      ctx.fillStyle = "#111";
      ctx.fillRect(px + 15 - Math.sin(swing) * 16 + 3, py + 61, 8, 5);
      ctx.fillRect(px + 15 + Math.sin(swing) * 16 + 3, py + 61, 8, 5);

      // 3. Tronco e Camisa
      let shirtGrad = ctx.createLinearGradient(px + 8, py + 18, px + 22, py + 38);
      shirtGrad.addColorStop(0, this.shirtColor);
      shirtGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.roundRect(px + 7, py + 18, 16, 22, 4);
      ctx.fill();

      // 4. Cabeça
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 15, py + 10, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo
      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(px + 14, py + 8, 10.5, Math.PI * 0.75, Math.PI * 1.95);
      ctx.fill();

      // Olho
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(px + 20, py + 8, 2, 3);

      // 5. Braços
      ctx.strokeStyle = this.skinColor;
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(px + 15, py + 21);
      ctx.lineTo(px + 15 - Math.cos(swing) * 14, py + 33);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px + 15, py + 21);
      ctx.lineTo(px + 15 + Math.cos(swing) * 14, py + 33);
      ctx.stroke();
    }
  }
}

// Obstáculos em 2D Lateral
class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.type = Math.random() > 0.4 ? "ground" : "air"; // Ground = Pular, Air = Agachar
    this.width = 38;
    this.height = this.type === "ground" ? 48 : 38;
    this.y = this.type === "ground" ? 372 : 305;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    if (this.type === "ground") {
      // Pedra no Chão
      let rockGrad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
      rockGrad.addColorStop(0, "#94a3b8");
      rockGrad.addColorStop(1, "#1e293b");

      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 6);
      ctx.fill();
    } else {
      // Tronco Aéreo / Suspenso
      let woodGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      woodGrad.addColorStop(0, "#d97706");
      woodGrad.addColorStop(1, "#451a03");

      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 6);
      ctx.fill();
    }
  }
}

// Instâncias dos Jogadores
const player1 = new Player(120, "female", "#ec4899", "#3b0764", {
  jump: "KeyW",
  crouch: "KeyS",
  left: "KeyA",
  right: "KeyD"
});

const player2 = new Player(180, "male", "#0284c7", "#eab308", {
  jump: "ArrowUp",
  crouch: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight"
});

let obstacles = [];
let obstacleTimer = 0;

// Checagem de Colisão AABB
function checkCollision(player, obstacle) {
  return (
    player.x < obstacle.x + obstacle.width &&
    player.x + player.width > obstacle.x &&
    player.y < obstacle.y + obstacle.height &&
    player.y + player.height > obstacle.y
  );
}

// Renderização do Fundo 2D com Parallax
function drawBackground() {
  // Céu
  let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, "#0284c7");
  skyGrad.addColorStop(0.6, "#38bdf8");
  skyGrad.addColorStop(1, "#bae6fd");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sol
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(750, 80, 40, 0, Math.PI * 2);
  ctx.fill();

  // Camada 1: Montanhas Distantes (Parallax Lento)
  bgOffset1 -= gameSpeed * 0.15;
  if (bgOffset1 <= -450) bgOffset1 = 0;

  ctx.fillStyle = "#64748b";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bgOffset1 + i * 450, 420);
    ctx.lineTo(bgOffset1 + i * 450 + 225, 180);
    ctx.lineTo(bgOffset1 + i * 450 + 450, 420);
    ctx.fill();
  }

  // Camada 2: Árvores em 2D (Parallax Médio)
  bgOffset2 -= gameSpeed * 0.4;
  if (bgOffset2 <= -200) bgOffset2 = 0;

  for (let i = 0; i < 6; i++) {
    let treeX = bgOffset2 + i * 200 + 20;

    // Tronco
    ctx.fillStyle = "#78350f";
    ctx.fillRect(treeX + 14, 260, 12, 160);

    // Folhagem
    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.arc(treeX + 20, 240, 35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chão
  ctx.fillStyle = "#334155";
  ctx.fillRect(0, 420, canvas.width, 60);

  // Faixa do topo do chão
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(0, 420, canvas.width, 6);
}

// Loop Principal
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FIM DE JOGO!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "18px sans-serif";
    ctx.fillText("Pressione F5 para jogar novamente", canvas.width / 2, canvas.height / 2 + 30);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Renderiza Cenário
  drawBackground();

  // Partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].alpha <= 0) particles.splice(i, 1);
  }

  // Pontuação e Velocidade
  score += 0.1;
  gameSpeed += 0.0006;

  if (player1.alive) score1El.textContent = Math.floor(score);
  if (player2.alive) score2El.textContent = Math.floor(score);

  // Jogadores
  player1.update();
  player1.draw();

  player2.update();
  player2.draw();

  // Obstáculos
  obstacleTimer++;
  if (obstacleTimer > Math.max(48, 105 - gameSpeed * 3.5)) {
    obstacles.push(new Obstacle());
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

  // Fim do jogo se ambos morrerem
  if (!player1.alive && !player2.alive) {
    gameOver = true;
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();