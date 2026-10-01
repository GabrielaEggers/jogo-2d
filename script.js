const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const score1El = document.getElementById("score1");
const score2El = document.getElementById("score2");

// Configurações Globais
let gameSpeed = 0.015; // Velocidade em profundidade (Z)
let score = 0;
let gameOver = false;
let roadZ = 0;
let particles = [];

// Geometria da Perspectiva
const HORIZON_Y = 220; // Altura da linha do horizonte
const FOV = 250;       // Distância focal (campo de visão)

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

// Projeção 3D para 2D no Canvas
function project(x, y, z) {
  const scale = FOV / (FOV + z);
  const x2d = (x * scale) + canvas.width / 2;
  const y2d = (y * scale) + HORIZON_Y;
  return { x: x2d, y: y2d, scale: scale };
}

// Classe de Partículas (Poeira da Pista)
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 5 + 2;
    this.speedX = (Math.random() - 0.5) * 2;
    this.speedY = Math.random() * -2 - 1;
    this.alpha = 0.8;
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

// Renderização das Árvores Realistas com Perspectiva
function draw3DTree(worldX, worldZ) {
  let p = project(worldX, 100, worldZ);
  if (p.scale <= 0 || p.y < HORIZON_Y) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.scale, p.scale);

  // 1. Sombra da árvore no chão
  let shadowGrad = ctx.createRadialGradient(-10, 40, 5, 0, 40, 60);
  shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.45)");
  shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(-10, 40, 55, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Tronco Texturizado em 3D
  let trunkGrad = ctx.createLinearGradient(-12, 0, 12, 0);
  trunkGrad.addColorStop(0, "#451a03");
  trunkGrad.addColorStop(0.5, "#78350f");
  trunkGrad.addColorStop(1, "#270e02");
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(-10, 40);
  ctx.lineTo(-6, -30);
  ctx.lineTo(6, -30);
  ctx.lineTo(10, 40);
  ctx.fill();

  // 3. Copa da Folhagem em Camadas
  let foliageGrad = ctx.createRadialGradient(-15, -90, 10, 0, -70, 70);
  foliageGrad.addColorStop(0, "#34d399");
  foliageGrad.addColorStop(0.5, "#059669");
  foliageGrad.addColorStop(1, "#022c22");

  ctx.fillStyle = foliageGrad;

  // Lóbulos folhosos
  const clusters = [
    { x: 0, y: -90, r: 48 },
    { x: -25, y: -70, r: 38 },
    { x: 25, y: -70, r: 38 },
    { x: -18, y: -105, r: 30 },
    { x: 18, y: -105, r: 30 }
  ];

  clusters.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// Classe dos Jogadores
class Player {
  constructor(xOffset, gender, shirtColor, hairColor, controls) {
    this.xOffset = xOffset; // Posição horizontal no mundo 3D (-200 a 200)
    this.worldZ = 40;       // Posição fixa perto da câmera
    this.gender = gender;
    this.shirtColor = shirtColor;
    this.hairColor = hairColor;
    this.skinColor = "#f0b088";
    this.controls = controls;

    this.jumpY = 0;
    this.vy = 0;
    this.gravity = 0.8;

    this.isJumping = false;
    this.isCrouching = false;
    this.alive = true;
    this.animFrame = 0;
  }

  update() {
    if (!this.alive) return;

    // Controles
    if (keys[this.controls.jump] && !this.isJumping) {
      this.vy = -14;
      this.isJumping = true;
    }

    if (keys[this.controls.crouch] && !this.isJumping) {
      this.isCrouching = true;
    } else {
      this.isCrouching = false;
    }

    if (keys[this.controls.left]) this.xOffset -= 8;
    if (keys[this.controls.right]) this.xOffset += 8;

    // Limites de pista
    if (this.xOffset < -180) this.xOffset = -180;
    if (this.xOffset > 180) this.xOffset = 180;

    // Física do Pulo
    if (this.isJumping) {
      this.jumpY += this.vy;
      this.vy += this.gravity;

      if (this.jumpY >= 0) {
        this.jumpY = 0;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    // Poeira ao correr
    if (!this.isJumping && Math.random() > 0.4) {
      let p = project(this.xOffset, 120, this.worldZ);
      particles.push(new Particle(p.x, p.y + 10, "rgba(217, 119, 6, 0.6)"));
    }

    this.animFrame += 0.2;
  }

  draw() {
    if (!this.alive) return;

    let p = project(this.xOffset, 120 + this.jumpY, this.worldZ);
    let shadowP = project(this.xOffset, 120, this.worldZ);

    ctx.save();

    // 1. Sombra Projetada no Chão
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(shadowP.x, shadowP.y + 12, 22 * shadowP.scale, 7 * shadowP.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(p.x, p.y);
    ctx.scale(p.scale * 1.3, p.scale * 1.3);

    const swing = Math.sin(this.animFrame) * 10;

    if (this.isCrouching) {
      // Agachado
      ctx.fillStyle = this.shirtColor;
      ctx.beginPath();
      ctx.roundRect(-16, -10, 32, 20, 6);
      ctx.fill();

      let skinGrad = ctx.createRadialGradient(0, -18, 2, 0, -18, 10);
      skinGrad.addColorStop(0, "#ffdfca");
      skinGrad.addColorStop(1, this.skinColor);
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(0, -18, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(0, -20, 11, Math.PI, Math.PI * 2);
      ctx.fill();
    } else {
      // Em pé / Correndo de costas para o horizonte
      // Pernas
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-8, 22 + swing * 0.5);
      ctx.moveTo(6, 0);
      ctx.lineTo(8, 22 - swing * 0.5);
      ctx.stroke();

      // Tronco
      let shirtGrad = ctx.createLinearGradient(-14, -30, 14, 0);
      shirtGrad.addColorStop(0, this.shirtColor);
      shirtGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = shirtGrad;
      ctx.beginPath();
      ctx.roundRect(-14, -32, 28, 32, 5);
      ctx.fill();

      // Cabeça (Vista de Costas/3/4)
      let skinGrad = ctx.createRadialGradient(-2, -42, 2, 0, -42, 10);
      skinGrad.addColorStop(0, "#ffdfca");
      skinGrad.addColorStop(1, this.skinColor);
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(0, -42, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo
      ctx.fillStyle = this.hairColor;
      ctx.beginPath();
      ctx.arc(0, -44, 11, 0, Math.PI * 2);
      ctx.fill();

      if (this.gender === "female") {
        // Rabo de Cavalo Balançando
        ctx.beginPath();
        ctx.arc(swing * 0.4, -36, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// Obstáculos em 3D vindo do Horizonte
class Obstacle {
  constructor() {
    this.xOffset = (Math.random() - 0.5) * 300;
    this.worldZ = 600; // Surge distante no horizonte
    this.type = Math.random() > 0.4 ? "ground" : "air"; // Ground = Pular, Air = Agachar
    this.width = 70;
    this.height = this.type === "ground" ? 35 : 28;
  }

  update() {
    this.worldZ -= gameSpeed * FOV; // Avança em direção à câmera
  }

  draw() {
    let p = project(this.xOffset, 120, this.worldZ);
    if (p.scale <= 0 || p.y < HORIZON_Y) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.scale, p.scale);

    if (this.type === "ground") {
      // Barreira de Pedra
      let stoneGrad = ctx.createLinearGradient(-this.width / 2, -this.height, this.width / 2, 0);
      stoneGrad.addColorStop(0, "#cbd5e1");
      stoneGrad.addColorStop(1, "#334155");

      ctx.fillStyle = stoneGrad;
      ctx.beginPath();
      ctx.roundRect(-this.width / 2, -this.height, this.width, this.height, 6);
      ctx.fill();
    } else {
      // Tronco Suspenso (Agachar)
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-this.width / 2, -this.height - 40, this.width, this.height);

      // Suportes laterais
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-this.width / 2, -this.height - 40, 8, 55);
      ctx.fillRect(this.width / 2 - 8, -this.height - 40, 8, 55);
    }

    ctx.restore();
  }
}

// Instâncias dos Jogadores
const player1 = new Player(-60, "female", "#ec4899", "#3b0764", {
  jump: "KeyW",
  crouch: "KeyS",
  left: "KeyA",
  right: "KeyD"
});

const player2 = new Player(60, "male", "#0284c7", "#eab308", {
  jump: "ArrowUp",
  crouch: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight"
});

let obstacles = [];
let obstacleTimer = 0;

// Checagem de Colisão 3D
function checkCollision(player, obs) {
  // Apenas checa colisão quando o obstáculo atinge a zona do jogador
  if (Math.abs(obs.worldZ - player.worldZ) < 25) {
    const horizontalHit = Math.abs(obs.xOffset - player.xOffset) < 45;

    if (horizontalHit) {
      if (obs.type === "ground" && player.jumpY > -20) {
        return true; // Não pulou
      }
      if (obs.type === "air" && !player.isCrouching) {
        return true; // Não agachou
      }
    }
  }
  return false;
}

// Desenhar o Cenário Perspectivo / Linha do Horizonte
function drawBackground() {
  // 1. Céu do Horizonte
  let skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
  skyGrad.addColorStop(0, "#0284c7");
  skyGrad.addColorStop(0.7, "#38bdf8");
  skyGrad.addColorStop(1, "#bae6fd");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, HORIZON_Y);

  // Sol no Horizonte
  let sunGrad = ctx.createRadialGradient(canvas.width / 2, HORIZON_Y, 5, canvas.width / 2, HORIZON_Y, 80);
  sunGrad.addColorStop(0, "rgba(253, 224, 71, 0.9)");
  sunGrad.addColorStop(0.4, "rgba(251, 146, 60, 0.4)");
  sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, HORIZON_Y, 80, 0, Math.PI * 2);
  ctx.fill();

  // Montanhas Distantes no Horizonte
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(0, HORIZON_Y);
  ctx.lineTo(150, HORIZON_Y - 40);
  ctx.lineTo(300, HORIZON_Y);
  ctx.lineTo(500, HORIZON_Y - 60);
  ctx.lineTo(700, HORIZON_Y);
  ctx.lineTo(900, HORIZON_Y - 35);
  ctx.lineTo(canvas.width, HORIZON_Y);
  ctx.fill();

  // 2. Terreno de Grama (Abaixo do Horizonte)
  let groundGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, canvas.height);
  groundGrad.addColorStop(0, "#15803d");
  groundGrad.addColorStop(1, "#052e16");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, HORIZON_Y, canvas.width, canvas.height - HORIZON_Y);

  // 3. Pista 3D Convergindo para o Ponto de Fuga no Horizonte
  roadZ = (roadZ + gameSpeed * FOV) % 80;

  let pFarLeft = project(-100, 120, 600);
  let pFarRight = project(100, 120, 600);
  let pNearLeft = project(-220, 120, 20);
  let pNearRight = project(220, 120, 20);

  // Pista Principal
  ctx.fillStyle = "#d97706";
  ctx.beginPath();
  ctx.moveTo(pFarLeft.x, pFarLeft.y);
  ctx.lineTo(pFarRight.x, pFarRight.y);
  ctx.lineTo(pNearRight.x, pNearRight.y);
  ctx.lineTo(pNearLeft.x, pNearLeft.y);
  ctx.fill();

  // Faixa Central da Pista em Profundidade
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 3;
  for (let z = 600; z > 20; z -= 80) {
    let currentZ = z - roadZ;
    if (currentZ < 20) continue;

    let p1 = project(0, 120, currentZ);
    let p2 = project(0, 120, Math.max(20, currentZ - 40));

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // 4. Fileiras de Árvores Realistas nas Laterais do Horizonte
  for (let z = 600; z >= 30; z -= 90) {
    let treeZ = z - roadZ;
    if (treeZ > 20 && treeZ < 650) {
      draw3DTree(-260, treeZ); // Esquerda
      draw3DTree(260, treeZ);  // Direita
    }
  }
}

// Loop Principal
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
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

  // Renderiza Fundo 3D e Horizonte
  drawBackground();

  // Atualiza Partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].alpha <= 0) particles.splice(i, 1);
  }

  // Pontuação e Aumento Gradual de Velocidade
  score += 0.1;
  gameSpeed += 0.000005;

  if (player1.alive) score1El.textContent = Math.floor(score);
  if (player2.alive) score2El.textContent = Math.floor(score);

  // Atualiza e Renderiza Obstáculos
  obstacleTimer++;
  if (obstacleTimer > Math.max(35, 90 - gameSpeed * 1000)) {
    obstacles.push(new Obstacle());
    obstacleTimer = 0;
  }

  // Ordena os obstáculos para desenhar do mais distante ao mais próximo (Depth Sorting)
  obstacles.sort((a, b) => b.worldZ - a.worldZ);

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.update();
    obs.draw();

    if (player1.alive && checkCollision(player1, obs)) player1.alive = false;
    if (player2.alive && checkCollision(player2, obs)) player2.alive = false;

    // Remove obstáculo após passar da câmera
    if (obs.worldZ < 10) {
      obstacles.splice(i, 1);
    }
  }

  // Atualiza e Desenha Jogadores
  player1.update();
  player1.draw();

  player2.update();
  player2.draw();

  // Condição de Fim de Jogo
  if (!player1.alive && !player2.alive) {
    gameOver = true;
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();