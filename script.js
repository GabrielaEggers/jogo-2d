const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");

// Configurações do Jogo
let gameSpeed = 6;
let score = 0;
let gameOver = false;
let bgOffset = 0;

// Mapeamento de Teclas
const keys = {};

window.addEventListener("keydown", (e) => {
  // Previne que a barra de espaço ou setas rolem a página do navegador
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }
  keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// Classe dos Jogadores
class Player {
  constructor(x, color, controls) {
    this.startX = x;
    this.x = x;
    this.baseY = 340;
    this.y = this.baseY;
    this.width = 32;
    this.height = 50;
    this.color = color;
    this.controls = controls;
    
    this.vy = 0;
    this.gravity = 0.75;
    this.speed = 5;
    
    this.isJumping = false;
    this.isCrouching = false;
    this.alive = true;
  }

  update() {
    if (!this.alive) return;

    // --- PULO ---
    if (keys[this.controls.jump] && !this.isJumping) {
      this.vy = -14;
      this.isJumping = true;
    }

    // --- AGACHAR ---
    if (keys[this.controls.crouch] && !this.isJumping) {
      this.isCrouching = true;
      this.height = 25;
      this.y = this.baseY + 25;
    } else {
      if (this.isCrouching) {
        this.height = 50;
        this.y = this.baseY;
        this.isCrouching = false;
      }
    }

    // --- MOVIMENTO HORIZONTAL ---
    if (keys[this.controls.left]) {
      this.x -= this.speed;
    }
    if (keys[this.controls.right]) {
      this.x += this.speed;
    }

    // Limites da tela para não sair do canvas
    if (this.x < 10) this.x = 10;
    if (this.x + this.width > canvas.width - 10) {
      this.x = canvas.width - this.width - 10;
    }

    // --- GRAVIDADE E CHÃO ---
    this.y += this.vy;
    this.vy += this.gravity;

    const currentBaseY = this.isCrouching ? this.baseY + 25 : this.baseY;
    if (this.y >= currentBaseY) {
      this.y = currentBaseY;
      this.vy = 0;
      this.isJumping = false;
    }
  }

  draw() {
    if (!this.alive) return;

    // Sombra do jogador
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, 390, this.width / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo do jogador
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Detalhe visual (Visor/Olhos)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x + this.width - 10, this.y + 8, 6, 6);
  }
}

// Classe dos Obstáculos
class Obstacle {
  constructor() {
    this.x = canvas.width;
    // Define aleatoriamente se é um obstáculo baixo (pular) ou alto (agachar)
    this.type = Math.random() > 0.45 ? "ground" : "air";
    this.width = 30;
    this.height = this.type === "ground" ? 40 : 30;
    this.y = this.type === "ground" ? 350 : 295;
    this.color = "#f59e0b"; // Cor laranja dos obstáculos
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Criando os dois jogadores com os mapeamentos solicitados
const player1 = new Player(100, "#ef4444", {
  jump: "KeyW",
  crouch: "KeyS",
  left: "KeyA",
  right: "KeyD"
});

const player2 = new Player(160, "#3b82f6", {
  jump: "Space",
  crouch: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight"
});

let obstacles = [];
let obstacleTimer = 0;

// Verificação de Colisão (AABB)
function checkCollision(player, obstacle) {
  return (
    player.x < obstacle.x + obstacle.width &&
    player.x + player.width > obstacle.x &&
    player.y < obstacle.y + obstacle.height &&
    player.y + player.height > obstacle.y
  );
}

// Desenho do Cenário Parallax
function drawBackground() {
  // Camada de Fundo (Montanhas)
  bgOffset -= gameSpeed * 0.25;
  if (bgOffset <= -450) bgOffset = 0;

  ctx.fillStyle = "#334155";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bgOffset + i * 450, 390);
    ctx.lineTo(bgOffset + i * 450 + 225, 200);
    ctx.lineTo(bgOffset + i * 450 + 450, 390);
    ctx.fill();
  }

  // Chão principal
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 390, canvas.width, 60);

  // Linha de grama/pista superior do chão
  ctx.fillStyle = "#10b981";
  ctx.fillRect(0, 390, canvas.width, 8);
}

// Loop Principal
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FIM DE JOGO!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "18px sans-serif";
    ctx.fillText("Pressione F5 ou recarregue a página para jogar novamente", canvas.width / 2, canvas.height / 2 + 25);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Renderiza cenário
  drawBackground();

  // Atualiza pontuação e aceleração
  score += 0.1;
  gameSpeed += 0.0008;

  if (player1.alive) score1El.textContent = Math.floor(score);
  if (player2.alive) score2El.textContent = Math.floor(score);

  // Atualiza e desenha os Jogadores
  player1.update();
  player1.draw();

  player2.update();
  player2.draw();

  // Gerencia spawning de obstáculos
  obstacleTimer++;
  if (obstacleTimer > Math.max(50, 110 - gameSpeed * 4)) {
    obstacles.push(new Obstacle());
    obstacleTimer = 0;
  }

  // Atualiza e checa colisão de obstáculos
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.update();
    obs.draw();

    if (player1.alive && checkCollision(player1, obs)) {
      player1.alive = false;
    }
    if (player2.alive && checkCollision(player2, obs)) {
      player2.alive = false;
    }

    // Remove obstáculos fora da tela
    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // Se ambos os jogadores forem atingidos, o jogo encerra
  if (!player1.alive && !player2.alive) {
    gameOver = true;
  }

  requestAnimationFrame(gameLoop);
}

// Inicia a execução do jogo
gameLoop();