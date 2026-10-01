const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");

// Configurações do Jogo
let gameSpeed = 5;
let score = 0;
let gameOver = false;
let roadOffsetY = 0;
let particles = [];

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

// Partículas para poeira da estrada
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 4 + 2;
    this.speedX = (Math.random() - 0.5) * 1.5;
    this.speedY = gameSpeed * 0.5;
    this.alpha = 0.8;
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

// Desenho de Árvores Realistas (Visão Superior/Perspectiva 2.5D)
function drawRealisticTree(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 1. Sombra projetada da árvore no chão
  let shadowGrad = ctx.createRadialGradient(-10, 15, 5, 0, 15, 45);
  shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.5)");
  shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(-10, 15, 40, 25, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Copa Base (Sombra interna das folhas)
  ctx.fillStyle = "#064e3b";
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fill();

  // 3. Camada do Meio da Folhagem
  let midGrad = ctx.createRadialGradient(-8, -8, 4, 0, 0, 28);
  midGrad.addColorStop(0, "#10b981");
  midGrad.addColorStop(1, "#047857");
  ctx.fillStyle = midGrad;

  // Lóbulos de folhas para textura natural
  const leafClusters = [
    { x: -10, y: -10, r: 18 },
    { x: 12, y: -8, r: 16 },
    { x: -8, y: 12, r: 17 },
    { x: 10, y: 10, r: 15 },
    { x: 0, y: -14, r: 19 }
  ];

  leafClusters.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Highlight / Iluminação de Topo (Sol vindo do topo-esquerdo)
  let topGrad = ctx.createRadialGradient(-12, -12, 2, -5, -5, 18);
  topGrad.addColorStop(0, "#6ee7b7");
  topGrad.addColorStop(1, "rgba(16, 185, 129, 0)");
  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.arc(-6, -6, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Classe do Jogador no Eixo Y
class Player {
  constructor(x, gender, shirtColor, hairColor, controls) {
    this.x = x;
    this.y = 360; // Posição fixa no eixo Y (movimenta-se lateralmente e em pulo/agacho)
    this.width = 28;
    this.height = 38;

    this.gender = gender;
    this.shirtColor = shirtColor;
    this.hairColor = hairColor;
    this.skinColor = "#f0b088";
    this.controls = controls;

    this.speed = 5.5;
    this.jumpZ = 0; // Altitude do pulo no eixo Z
    this.vz = 0;
    this.gravity = 0.7;

    this.isJumping = false;
    this.isCrouching = false;
    this.alive = true;

    this.animFrame = 0;
  }

  update() {
    if (!this.alive) return;

    // --- PULO ---
    if (keys[this.controls.jump] && !this.isJumping) {
      this.vz = 11;
      this.isJumping = true;
    }

    // --- AGACHAR ---
    if (keys[this.controls.crouch] && !this.isJumping) {
      this.isCrouching = true;
    } else {
      this.isCrouching = false;
    }

    // --- MOVIMENTO HORIZONTAL NO EIXO X ---
    if (keys[this.controls.left]) this.x -= this.speed;
    if (keys[this.controls.right]) this.x += this.speed;

    // Limites da pista (250px até 650px)
    if (this.x < 260) this.x = 260;
    if (this.x + this.width > 640) this.x = 640 - this.width;

    // --- FÍSICA DO PULO (EIXO Z) ---
    if (this.isJumping) {
      this.jumpZ += this.vz;
      this.vz -= this.gravity;

      if (this.jumpZ <= 0) {
        this.jumpZ = 0;
        this.vz = 0;
        this.isJumping = false;
      }
    }

    // Poeira ao correr
    if (!this.isJumping && Math.random() > 0.5) {
      particles.push(new Particle(this.x + this.width / 2, this.y + 35, "rgba(217, 119, 6, 0.5)"));
    }

    this.animFrame += gameSpeed * 0.1;
  }

  draw() {
    if (!this.alive) return;

    const px = this.x;
    const renderY = this.y - this.jumpZ; // Desloca para cima ao pular
    const scale = 1 + this.jumpZ * 0.015; // Aumenta levemente no pulo
    const swing = Math.sin(this.animFrame) * 8;

    ctx.save();

    // 1. Sombra do Jogador
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(
      px + this.width / 2,
      this.y + 36,
      (this.width / 2) * (1 - this.jumpZ * 0.01),
      6 * (1 - this.jumpZ * 0.01),
      0, 0, Math.PI * 2
    );
    ctx.fill();

    ctx.translate(px + this.width / 2, renderY + this.height / 2);
    ctx.scale(scale, scale);

    if (this.isCrouching) {
      // --- VISUAL AGACHADO ---
      ctx.fillStyle = this.shirtColor;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Cabeça inclinada
      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(0, -4, 10, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // --- VISUAL NORMAL / CORRENDO (VISÃO SUPERIOR) ---
      
      // Ombro e Corpo
      ctx.fillStyle = this.shirtColor;
      ctx.beginPath();
      ctx.roundRect(-14, -10, 28, 20, 6);
      ctx.fill();

      // Braços em movimento
      ctx.fillStyle = this.skinColor;
      ctx.beginPath();
      ctx.arc(-16, swing, 4.5, 0, Math.PI * 2); // Braço Esquerdo
      ctx.arc(16, -swing, 4.5, 0, Math.PI * 2); // Braço Direito
      ctx.fill();

      // Cabeça
      let skinGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9);
      skinGrad.addColorStop(0, "#ffdfca");
      skinGrad.addColorStop(1, this.skinColor);
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(0, -2, 9, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo
      ctx.fillStyle = this.hairColor;
      if (this.gender === "female") {
        ctx.beginPath();
        ctx.arc(0, -4, 9.5, Math.PI, Math.PI * 2);
        ctx.fill();
        // Rabo de cavalo balançando atrás
        ctx.beginPath();
        ctx.arc(-swing * 0.4, 8, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, -4, 9.5, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// Obstáculos descendo no eixo Y
class Obstacle {
  constructor() {
    this.x = Math.random() * (600 - 270) + 270;
    this.y = -60; // Surge no topo da tela
    this.type = Math.random() > 0.4 ? "ground" : "air"; // Ground = Pular, Air = Agachar
    this.width = 65;
    this.height = this.type === "ground" ? 35 : 25;
  }

  update() {
    this.y += gameSpeed; // Movimento vertical descendente
  }

  draw() {
    ctx.save();
    if (this.type === "ground") {
      // Pedra / Barreira no Chão
      let stoneGrad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
      stoneGrad.addColorStop(0, "#94a3b8");
      stoneGrad.addColorStop(1, "#334155");

      ctx.fillStyle = stoneGrad;
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 6);
      ctx.fill();

      // Sombra
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(this.x, this.y + this.height, this.width, 6);
    } else {
      // Tronco Alto (Passa agachando)
      ctx.fillStyle = "#78350f";
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Listras amarelas de aviso
      ctx.fillStyle = "#f59e0b";
      for (let i = 0; i < this.width; i += 15) {
        ctx.fillRect(this.x + i, this.y, 7, this.height);
      }
    }
    ctx.restore();
  }
}

// Instâncias dos Jogadores
const player1 = new Player(380, "female", "#ec4899", "#3b0764", {
  jump: "KeyW",
  crouch: "KeyS",
  left: "KeyA",
  right: "KeyD"
});

const player2 = new Player(460, "male", "#0284c7", "#eab308", {
  jump: "ArrowUp",
  crouch: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight"
});

let obstacles = [];
let obstacleTimer = 0;

// Colisão 2.5D no Eixo Y
function checkCollision(player, obs) {
  const horizontalHit = player.x < obs.x + obs.width && player.x + player.width > obs.x;
  const verticalHit = player.y < obs.y + obs.height && player.y + player.height > obs.y;

  if (horizontalHit && verticalHit) {
    if (obs.type === "ground" && player.jumpZ < 20) {
      return true; // Colidiu por não pular alto o suficiente
    }
    if (obs.type === "air" && !player.isCrouching) {
      return true; // Colidiu por não agachar
    }
  }
  return false;
}

// Desenhar o Cenário em Rolo Vertical
function drawScene() {
  // 1. Grama das Laterais
  ctx.fillStyle = "#15803d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Pista Central (Eixo Y)
  ctx.fillStyle = "#78350f"; // Borda de terra
  ctx.fillRect(240, 0, 420, canvas.height);

  let roadGrad = ctx.createLinearGradient(250, 0, 650, 0);
  roadGrad.addColorStop(0, "#d97706");
  roadGrad.addColorStop(0.5, "#f59e0b");
  roadGrad.addColorStop(1, "#d97706");
  ctx.fillStyle = roadGrad;
  ctx.fillRect(250, 0, 400, canvas.height);

  // Linhas tracejadas da pista em movimento Y
  roadOffsetY += gameSpeed;
  if (roadOffsetY >= 40) roadOffsetY = 0;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 20]);
  ctx.lineDashOffset = -roadOffsetY;

  ctx.beginPath();
  ctx.moveTo(450, 0);
  ctx.lineTo(450, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]); // Reset linha contínua

  // 3. Árvores Realistas nas Florestas Laterais
  const treePositions = [
    { x: 60, y: 50 }, { x: 170, y: 130 }, { x: 80, y: 250 }, { x: 180, y: 380 }, { x: 70, y: 460 },
    { x: 730, y: 40 }, { x: 830, y: 150 }, { x: 720, y: 280 }, { x: 820, y: 390 }, { x: 740, y: 470 }
  ];

  treePositions.forEach(pos => {
    let animY = (pos.y + roadOffsetY * 1.5) % (canvas.height + 60) - 30;
    drawRealisticTree(pos.x, animY, 1.1);
  });
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
    ctx.fillText("Pressione F5 para reiniciar", canvas.width / 2, canvas.height / 2 + 30);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Renderiza Fundo
  drawScene();

  // Partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].alpha <= 0) particles.splice(i, 1);
  }

  // Pontuação e Velocidade
  score += 0.1;
  gameSpeed += 0.0005;

  if (player1.alive) score1El.textContent = Math.floor(score);
  if (player2.alive) score2El.textContent = Math.floor(score);

  // Jogadores
  player1.update();
  player1.draw();

  player2.update();
  player2.draw();

  // Obstáculos
  obstacleTimer++;
  if (obstacleTimer > Math.max(45, 100 - gameSpeed * 3)) {
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

    // Remoção de obstáculos que saíram por baixo
    if (obs.y > canvas.height) {
      obstacles.splice(i, 1);
    }
  }

  // Fim do Jogo
  if (!player1.alive && !player2.alive) {
    gameOver = true;
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();