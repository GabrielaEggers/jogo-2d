const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");

// Estados e Configurações Globais
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

// Sistema de Partículas para Poeira da Corrida e Efeitos
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
    this.alpha -= 0.02;
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

// Classe de Jogador HD com Iluminação e Anatomia Realista
class Player {
  constructor(x, gender, shirtColor, pantsColor, hairColor, controls) {
    this.startX = x;
    this.x = x;
    this.baseY = 350;
    this.y = this.baseY;
    this.width = 30;
    this.height = 68;

    this.gender = gender;
    this.shirtColor = shirtColor;
    this.pantsColor = pantsColor;
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

    // Movimentação
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

      // Gerar poeira no chão enquanto corre
      if (Math.random() > 0.4) {
        particles.push(new Particle(this.x + 10, 420, "rgba(200, 180, 150, 0.6)"));
      }
    }

    this.animFrame += gameSpeed * 0.08;
  }

  draw() {
    if (!this.alive) return;

    const px = this.x;
    const py = this.y;
    const swing = Math.sin(this.animFrame) * (this.isJumping ? 0.2 : 0.7);

    // Sombra realista projetada no chão
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(px + 15, 422, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.isCrouching) {
      // --- PERSONAGEM AGACHADO ---
      
      // Tronco com gradiente de luz
      let shirtGrad = ctx.createLinearGradient(px, py + 15, px + 25, py + 30);
      shirtGrad.addColorStop(0, this.shirtColor);
      shirtGrad.addColorStop(1, "#111");
      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.roundRect(px + 5, py + 15, 24, 15, 4);
      ctx.fill();

      // Cabeça
      let skinGrad = ctx.createRadialGradient(px + 20, py + 8, 2, px + 20, py + 8, 10);
      skinGrad.addColorStop(0, "#ffdfca");
      skinGrad.addColorStop(1, this.skinColor);
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(px + 20, py + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo
      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(px + 17, py + 5, 9, Math.PI * 0.8, Math.PI * 2.1);
      ctx.fill();

      // Olho e Boca
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(px + 24, py + 6, 2, 4); // Olho
      ctx.fillStyle = "#c0392b";
      ctx.fillRect(px + 23, py + 12, 4, 1.5); // Boca

      // Pernas Dobradas
      ctx.fillStyle = this.pantsColor;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 28, 26, 10, 3);
      ctx.fill();

      // Sapato
      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(px + 22, py + 33, 9, 5);

    } else {
      // --- PERSONAGEM EM PÉ / CORRENDO REALISTA ---

      // 1. Cabelo Longo/Rabo de Cavalo (Mulher)
      if (this.gender === "female") {
        ctx.fillStyle = this.hairColor;
        ctx.beginPath();
        ctx.arc(px + 4 - Math.sin(swing) * 5, py + 15, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Pernas com Traçado Articulado e Gradiente
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.strokeStyle = this.pantsColor;

      // Perna Traseira
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 38);
      ctx.lineTo(px + 15 - Math.sin(swing) * 16, py + 52);
      ctx.lineTo(px + 15 - Math.sin(swing) * 16 + 5, py + 63);
      ctx.stroke();

      // Sapato Traseiro
      ctx.fillStyle = "#111";
      ctx.fillRect(px + 15 - Math.sin(swing) * 16 + 3, py + 61, 8, 5);

      // Perna Dianteira
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 38);
      ctx.lineTo(px + 15 + Math.sin(swing) * 16, py + 52);
      ctx.lineTo(px + 15 + Math.sin(swing) * 16 + 5, py + 63);
      ctx.stroke();

      // Sapato Dianteiro
      ctx.fillRect(px + 15 + Math.sin(swing) * 16 + 3, py + 61, 8, 5);

      // 3. Tronco e Camisa com efeito de Sombra/Volume
      let shirtGrad = ctx.createLinearGradient(px + 8, py + 18, px + 22, py + 38);
      shirtGrad.addColorStop(0, this.shirtColor);
      shirtGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.roundRect(px + 7, py + 18, 16, 22, 4);
      ctx.fill();

      // 4. Cabeça com Efeito 3D Radial
      let skinGrad = ctx.createRadialGradient(px + 13, py + 7, 2, px + 15, py + 10, 10);
      skinGrad.addColorStop(0, "#ffdfca");
      skinGrad.addColorStop(1, this.skinColor);
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(px + 15, py + 10, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo HD
      ctx.fillStyle = this.hairColor;
      if (this.gender === "female") {
        ctx.beginPath();
        ctx.arc(px + 14, py + 7, 10.5, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        ctx.fillRect(px + 6, py + 7, 6, 12);
      } else {
        ctx.beginPath();
        ctx.arc(px + 14, py + 8, 10.5, Math.PI * 0.75, Math.PI * 1.95);
        ctx.fill();
      }

      // Olho Detalhado
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px + 18, py + 7, 4, 5);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(px + 20, py + 8, 2, 3);

      // Nariz 3D
      ctx.fillStyle = "#d28468";
      ctx.fillRect(px + 23, py + 10, 2, 3);

      // Boca
      ctx.fillStyle = this.gender === "female" ? "#d63031" : "#a67c52";
      ctx.fillRect(px + 19, py + 15, 4, 1.5);

      // 5. Braços Articulados
      ctx.strokeStyle = this.skinColor;
      ctx.lineWidth = 4.5;

      // Braço Traseiro
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 21);
      ctx.lineTo(px + 15 - Math.cos(swing) * 14, py + 33);
      ctx.stroke();

      // Mão Traseira
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(px + 15 - Math.cos(swing) * 14, py + 34, 3, 0, Math.PI * 2);
      ctx.fill();

      // Braço Dianteiro
      ctx.beginPath();
      ctx.moveTo(px + 15, py + 21);
      ctx.lineTo(px + 15 + Math.cos(swing) * 14, py + 33);
      ctx.stroke();

      // Mão Dianteira
      ctx.beginPath();
      ctx.arc(px + 15 + Math.cos(swing) * 14, py + 34, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Classe dos Obstáculos Renderizados em 3D Simulado
class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.type = Math.random() > 0.4 ? "ground" : "air";
    this.width = 38;
    this.height = this.type === "ground" ? 48 : 38;
    this.y = this.type === "ground" ? 372 : 305;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    if (this.type === "ground") {
      // Pedra / Monolito com Textura em Gradiente
      let rockGrad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
      rockGrad.addColorStop(0, "#94a3b8");
      rockGrad.addColorStop(0.5, "#475569");
      rockGrad.addColorStop(1, "#1e293b");

      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 6);
      ctx.fill();

      // Ranhuras da Pedra
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + 8, this.y + 6);
      ctx.lineTo(this.x + 18, this.y + 25);
      ctx.lineTo(this.x + 10, this.y + 40);
      ctx.stroke();
    } else {
      // Tronco de Madeira 3D
      let woodGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      woodGrad.addColorStop(0, "#d97706");
      woodGrad.addColorStop(0.5, "#b45309");
      woodGrad.addColorStop(1, "#451a03");

      ctx.fillStyle = woodGrad;
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 8);
      ctx.fill();

      // Anéis da Madeira
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x + 8, this.y + this.height / 2, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Instâncias dos Jogadores
const player1 = new Player(120, "female", "#ec4899", "#8b5cf6", "#3b0764", {
  jump: "KeyW",
  crouch: "KeyS",
  left: "KeyA",
  right: "KeyD"
});

const player2 = new Player(180, "male", "#0284c7", "#1e293b", "#eab308", {
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

// Renderização do Cenário HD com Parallax e Iluminação Atmosférica
function drawBackground() {
  // 1. Céu com iluminação crepuscular
  let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, "#0b0f19");
  skyGrad.addColorStop(0.6, "#1e1b4b");
  skyGrad.addColorStop(1, "#31103f");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Lua Volumétrica com Brilho
  ctx.save();
  let moonGlow = ctx.createRadialGradient(750, 90, 10, 750, 90, 90);
  moonGlow.addColorStop(0, "rgba(254, 240, 138, 0.9)");
  moonGlow.addColorStop(0.3, "rgba(253, 224, 71, 0.2)");
  moonGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(750, 90, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Camada 1: Montanhas Distantes (Parallax Lento)
  bgOffset1 -= gameSpeed * 0.12;
  if (bgOffset1 <= -450) bgOffset1 = 0;

  ctx.fillStyle = "#111827";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bgOffset1 + i * 450, 420);
    ctx.lineTo(bgOffset1 + i * 450 + 225, 160);
    ctx.lineTo(bgOffset1 + i * 450 + 450, 420);
    ctx.fill();
  }

  // 4. Camada 2: Floresta Mística (Parallax Médio)
  bgOffset2 -= gameSpeed * 0.35;
  if (bgOffset2 <= -300) bgOffset2 = 0;

  for (let i = 0; i < 5; i++) {
    let treeX = bgOffset2 + i * 200 + 40;
    
    // Tronco
    ctx.fillStyle = "#1e1b18";
    ctx.fillRect(treeX + 12, 240, 16, 180);

    // Copa das Árvores em Gradiente
    let treeGrad = ctx.createRadialGradient(treeX + 20, 230, 5, treeX + 20, 230, 40);
    treeGrad.addColorStop(0, "#0d9488");
    treeGrad.addColorStop(1, "#064e3b");
    ctx.fillStyle = treeGrad;
    ctx.beginPath();
    ctx.arc(treeX + 20, 230, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Chão de Pedras do Templo
  let floorGrad = ctx.createLinearGradient(0, 420, 0, canvas.height);
  floorGrad.addColorStop(0, "#334155");
  floorGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 420, canvas.width, 60);

  // Faixa Superior Iluminada da Pista
  ctx.fillStyle = "#10b981";
  ctx.fillRect(0, 420, canvas.width, 6);
}

// Loop Principal do Jogo
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "rgba(11, 15, 25, 0.9)";
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

  // Atualiza Partículas
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

  // Atualiza e Desenha Jogadores
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

    // Checagem de Colisão com Efeito de Partículas ao Atingir
    if (player1.alive && checkCollision(player1, obs)) {
      player1.alive = false;
      for (let p = 0; p < 15; p++) particles.push(new Particle(player1.x, player1.y, "#ef4444"));
    }
    if (player2.alive && checkCollision(player2, obs)) {
      player2.alive = false;
      for (let p = 0; p < 15; p++) particles.push(new Particle(player2.x, player2.y, "#3b82f6"));
    }

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // Fim do Jogo
  if (!player1.alive && !player2.alive) {
    gameOver = true;
  }

  requestAnimationFrame(gameLoop);
}

// Iniciar Execução
gameLoop();