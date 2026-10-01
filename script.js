const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");

// Estados e Configurações
let gameSpeed = 6;
let score = 0;
let gameOver = false;
let bgOffset1 = 0;
let bgOffset2 = 0;

// Mapeamento das Teclas
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

// Classe do Jogador Detalhada (Humanoide Completo)
class Player {
  constructor(x, gender, shirtColor, pantsColor, hairColor, controls) {
    this.startX = x;
    this.x = x;
    this.baseY = 360;
    this.y = this.baseY;
    this.width = 30;
    this.height = 60;
    
    this.gender = gender; // 'female' ou 'male'
    this.shirtColor = shirtColor;
    this.pantsColor = pantsColor;
    this.hairColor = hairColor;
    this.skinColor = "#f8c291";
    this.controls = controls;

    this.vy = 0;
    this.gravity = 0.75;
    this.speed = 5;

    this.isJumping = false;
    this.isCrouching = false;
    this.alive = true;

    // Ciclo de Animação
    this.animFrame = 0;
  }

  update() {
    if (!this.alive) return;

    // Pulo
    if (keys[this.controls.jump] && !this.isJumping) {
      this.vy = -14;
      this.isJumping = true;
    }

    // Agachar
    if (keys[this.controls.crouch] && !this.isJumping) {
      this.isCrouching = true;
      this.height = 35;
      this.y = this.baseY + 25;
    } else {
      if (this.isCrouching) {
        this.height = 60;
        this.y = this.baseY;
        this.isCrouching = false;
      }
    }

    // Movimento Horizontal
    if (keys[this.controls.left]) this.x -= this.speed;
    if (keys[this.controls.right]) this.x += this.speed;

    // Colisão com Limites da Tela
    if (this.x < 10) this.x = 10;
    if (this.x + this.width > canvas.width - 10) this.x = canvas.width - this.width - 10;

    // Gravidade
    this.y += this.vy;
    this.vy += this.gravity;

    const currentBaseY = this.isCrouching ? this.baseY + 25 : this.baseY;
    if (this.y >= currentBaseY) {
      this.y = currentBaseY;
      this.vy = 0;
      this.isJumping = false;
    }

    this.animFrame += gameSpeed * 0.08;
  }

  draw() {
    if (!this.alive) return;

    const px = this.x;
    const py = this.y;
    const swing = Math.sin(this.animFrame) * (this.isJumping ? 0.2 : 0.65);

    // Sombra no chão
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(px + 15, 420, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.isCrouching) {
      // --- PERSONAGEM AGACHADO ---
      
      // Cabelo de Trás (Mulher)
      if (this.gender === 'female') {
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        ctx.arc(px + 12, py + 12, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cabeça
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 20, py + 8, 8, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo Superior / Franja
      ctx.fillStyle = this.hairColor;
      if (this.gender === 'female') {
        ctx.fillRect(px + 14, py, 10, 5);
      } else {
        ctx.fillRect(px + 14, py, 12, 6); // Cabelo curto masculino
      }

      // Rosto Agachado
      ctx.fillStyle = "#222"; // Olho
      ctx.fillRect(px + 23, py + 6, 2, 3);
      ctx.fillStyle = "#e55039"; // Boca
      ctx.fillRect(px + 23, py + 11, 3, 1.5);

      // Corpo e Roupas
      ctx.fillStyle = this.shirtColor;
      ctx.fillRect(px + 8, py + 14, 20, 12);

      ctx.fillStyle = this.pantsColor;
      ctx.fillRect(px + 5, py + 26, 22, 9);

      // Sapato
      ctx.fillStyle = "#222";
      ctx.fillRect(px + 22, py + 30, 8, 5);

      // Mão
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 24, py + 22, 3, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // --- PERSONAGEM EM PÉ / CORRENDO ---

      // 1. Cabelo Longo/Rabo de Cavalo (atrás da cabeça para a mulher)
      if (this.gender === 'female') {
        ctx.fillStyle = this.hairColor;
        // Rabo de cavalo balançando com a corrida
        ctx.beginPath();
        ctx.arc(px + 5 - Math.sin(swing) * 4, py + 12, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Pernas e Pés
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = this.pantsColor;

      // Perna Traseira
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 35);
      ctx.lineTo(px + 15 - Math.sin(swing) * 14, py + 48);
      ctx.lineTo(px + 15 - Math.sin(swing) * 14 + 4, py + 57);
      ctx.stroke();

      // Pé Traseiro
      ctx.fillStyle = "#1e272e";
      ctx.fillRect(px + 15 - Math.sin(swing) * 14 + 2, py + 55, 7, 4);

      // Perna Dianteira
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 35);
      ctx.lineTo(px + 15 + Math.sin(swing) * 14, py + 48);
      ctx.lineTo(px + 15 + Math.sin(swing) * 14 + 4, py + 57);
      ctx.stroke();

      // Pé Dianteiro
      ctx.fillRect(px + 15 + Math.sin(swing) * 14 + 2, py + 55, 7, 4);

      // 3. Tronco / Camisa
      ctx.fillStyle = this.shirtColor;
      ctx.fillRect(px + 8, py + 17, 14, 19);

      // 4. Cabeça e Rosto
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 15, py + 9, 9, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo (Topo e Franja)
      ctx.fillStyle = this.hairColor;
      if (this.gender === 'female') {
        // Cabelo feminino (franja + cacho lateral)
        ctx.beginPath();
        ctx.arc(px + 14, py + 6, 9, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(px + 8, py + 5, 5, 10);
      } else {
        // Cabelo masculino (estilo topete)
        ctx.beginPath();
        ctx.arc(px + 14, py + 7, 9.5, Math.PI * 0.8, Math.PI * 1.9);
        ctx.fill();
      }

      // Olho (Com íris/brilho)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px + 18, py + 6, 4, 4);
      ctx.fillStyle = "#000000";
      ctx.fillRect(px + 20, py + 7, 2, 2);

      // Nariz
      ctx.fillStyle = "#d28468";
      ctx.fillRect(px + 22, py + 9, 2, 2);

      // Boca
      ctx.fillStyle = this.gender === 'female' ? "#e84118" : "#b2bec3";
      ctx.fillRect(px + 19, py + 13, 3, 1.5);

      // 5. Braços e Mãos
      ctx.strokeStyle = this.skinColor;
      ctx.lineWidth = 3.5;

      // Braço Traseiro
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 20);
      ctx.lineTo(px + 15 - Math.cos(swing) * 12, py + 31);
      ctx.stroke();

      // Mão Traseira
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 15 - Math.cos(swing) * 12, py + 32, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Braço Dianteiro
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 20);
      ctx.lineTo(px + 15 + Math.cos(swing) * 12, py + 31);
      ctx.stroke();

      // Mão Dianteira
      ctx.beginPath();
      ctx.arc(px + 15 + Math.cos(swing) * 12, py + 32, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Classe dos Obstáculos
class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.type = Math.random() > 0.4 ? "ground" : "air";
    this.width = 35;
    this.height = this.type === "ground" ? 45 : 35;
    this.y = this.type === "ground" ? 375 : 310;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    if (this.type === "ground") {
      ctx.fillStyle = "#64748b";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "#475569";
      ctx.fillRect(this.x + 5, this.y + 5, 12, 12);
      ctx.fillRect(this.x + 18, this.y + 20, 10, 15);
    } else {
      ctx.fillStyle = "#b45309";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, 6);
    }
  }
}

// Criando os Jogadores
// Player 1: Mulher (Camisa Rosa, Calça Roxa, Cabelo Castanho) -> WASD
const player1 = new Player(120, "female", "#e84393", "#6c5ce7", "#4b2d1f", {
  jump: "KeyW",
  crouch: "KeyS",
  left: "KeyA",
  right: "KeyD"
});

// Player 2: Homem (Camisa Azul, Calça Jeans, Cabelo Loiro) -> Setas
const player2 = new Player(180, "male", "#0984e3", "#2d3436", "#f1c40f", {
  jump: "ArrowUp",
  crouch: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight"
});

let obstacles = [];
let obstacleTimer = 0;

// Colisão AABB
function checkCollision(player, obstacle) {
  return (
    player.x < obstacle.x + obstacle.width &&
    player.x + player.width > obstacle.x &&
    player.y < obstacle.y + obstacle.height &&
    player.y + player.height > obstacle.y
  );
}

// Desenhar Fundo
function drawBackground() {
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lua / Sol
  ctx.fillStyle = "rgba(253, 230, 138, 0.15)";
  ctx.beginPath();
  ctx.arc(750, 100, 60, 0, Math.PI * 2);
  ctx.fill();

  // Camada 1 (Montanhas)
  bgOffset1 -= gameSpeed * 0.15;
  if (bgOffset1 <= -450) bgOffset1 = 0;

  ctx.fillStyle = "#1e293b";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bgOffset1 + i * 450, 420);
    ctx.lineTo(bgOffset1 + i * 450 + 225, 180);
    ctx.lineTo(bgOffset1 + i * 450 + 450, 420);
    ctx.fill();
  }

  // Camada 2 (Árvores)
  bgOffset2 -= gameSpeed * 0.4;
  if (bgOffset2 <= -300) bgOffset2 = 0;

  ctx.fillStyle = "#0f766e";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(bgOffset2 + i * 200 + 40, 260, 15, 160);
    ctx.beginPath();
    ctx.arc(bgOffset2 + i * 200 + 47, 250, 35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chão
  ctx.fillStyle = "#334155";
  ctx.fillRect(0, 420, canvas.width, 60);

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(0, 420, canvas.width, 8);
}

// Loop do Jogo
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FIM DE JOGO!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "18px sans-serif";
    ctx.fillText("Recarregue a página (F5) para jogar novamente", canvas.width / 2, canvas.height / 2 + 25);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  score += 0.1;
  gameSpeed += 0.0006;

  if (player1.alive) score1El.textContent = Math.floor(score);
  if (player2.alive) score2El.textContent = Math.floor(score);

  player1.update();
  player1.draw();

  player2.update();
  player2.draw();

  obstacleTimer++;
  if (obstacleTimer > Math.max(50, 110 - gameSpeed * 3.5)) {
    obstacles.push(new Obstacle());
    obstacleTimer = 0;
  }

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

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  if (!player1.alive && !player2.alive) {
    gameOver = true;
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();