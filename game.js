const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configuration & Constants ---
const MAP_RADIUS = 1800;
const FOOD_COUNT = 750;
const BOT_COUNT = 16;
const INITIAL_MASS = 100;
const MIN_BOOST_MASS = 35;
const BASE_SPEED = 3.4;
const BOOST_SPEED = 5.8; // Uniform boost speed for all sizes

// --- Boost Particle Trail ---
const boostParticles = [];

function spawnBoostParticle(entity, moveAngle) {
  const trailAngle = moveAngle + Math.PI + (Math.random() - 0.5) * 0.45;
  const spawnDist = entity.radius * 0.88;
  const pSpeed = Math.random() * 2.2 + 1.2;

  boostParticles.push({
    x: entity.x + Math.cos(trailAngle) * spawnDist,
    y: entity.y + Math.sin(trailAngle) * spawnDist,
    vx: Math.cos(trailAngle) * pSpeed,
    vy: Math.sin(trailAngle) * pSpeed,
    radius: Math.random() * 3 + 2.5,
    color: entity.color,
    alpha: 0.85,
    life: 20
  });
}

const PELLET_PALETTE = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7',
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
  '#06b6d4', '#14b8a6', '#10b981', '#22c55e',
  '#84cc16', '#eab308', '#f97316', '#ff5722'
];

const BOT_NAMES = [
  'Vortex', 'Echo', 'Titan', 'Cosmo', 'Nova',
  'Blaze', 'Pixel', 'Shadow', 'Zippy', 'Comet',
  'Apex', 'Phantom', 'Luna', 'Orbit', 'Atlas',
  'Zephyr', 'Pulse', 'Hyper', 'Sonic', 'Drift',
  'Nexus', 'Aegis', 'Goliath', 'Specter'
];

const BOT_PALETTES = [
  { fill: '#3b82f6', stroke: '#1d4ed8' },
  { fill: '#ec4899', stroke: '#be185d' },
  { fill: '#8b5cf6', stroke: '#6d28d9' },
  { fill: '#f59e0b', stroke: '#b45309' },
  { fill: '#06b6d4', stroke: '#0e7490' },
  { fill: '#f43f5e', stroke: '#be123c' },
  { fill: '#14b8a6', stroke: '#0f766e' },
  { fill: '#a855f7', stroke: '#7e22ce' },
  { fill: '#e11d48', stroke: '#9f1239' }
];

// Helper: Convert mass to radius with smooth square-root scaling
function massToRadius(mass) {
  return 14 + Math.sqrt(mass) * 2.2;
}

// Helper: Calculate base speed from mass (smaller = agile, larger = heavy)
function massToSpeed(mass) {
  return Math.max(1.1, BASE_SPEED * Math.pow(INITIAL_MASS / mass, 0.22));
}

// Resize canvas to full window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- Camera & Viewport Zoom ---
let currentZoom = 1.0;
const INITIAL_RADIUS = massToRadius(INITIAL_MASS);

// --- Player State ---
let player = {
  name: 'You',
  x: 0,
  y: 0,
  mass: INITIAL_MASS,
  radius: INITIAL_RADIUS,
  color: '#00e676',
  strokeColor: '#00b359',
  speed: BASE_SPEED,
  score: 0,
  isPlayer: true,
  isBoosting: false,
  isDead: false,
  killer: '',
  finalMass: 0,
  finalScore: 0
};

let deathCameraX = 0;
let deathCameraY = 0;

function killPlayer(killerName) {
  player.isDead = true;
  player.killer = killerName || 'A competitor';
  player.finalMass = Math.floor(player.mass);
  player.finalScore = player.score;
  player.isBoosting = false;
  deathCameraX = player.x;
  deathCameraY = player.y;
}

function respawnPlayer() {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.sqrt(Math.random()) * (MAP_RADIUS * 0.45);
  player.x = Math.cos(angle) * dist;
  player.y = Math.sin(angle) * dist;
  player.mass = INITIAL_MASS;
  player.radius = massToRadius(INITIAL_MASS);
  player.speed = massToSpeed(INITIAL_MASS);
  player.score = 0;
  player.isBoosting = false;
  player.isDead = false;
}

// --- Input Controls (Mouse & Boost Keys) ---
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

let isBoostKeyPressed = false;
window.addEventListener('keydown', (e) => {
  if (player.isDead) {
    if (e.code === 'Space' || e.code === 'Enter' || e.key === 'r' || e.key === 'R') {
      respawnPlayer();
    }
    return;
  }
  if (e.code === 'Space') {
    isBoostKeyPressed = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    isBoostKeyPressed = false;
  }
});

let isMousePressed = false;
window.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    if (player.isDead) {
      respawnPlayer();
      return;
    }
    isMousePressed = true;
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    isMousePressed = false;
  }
});

window.addEventListener('touchstart', () => {
  if (player.isDead) {
    respawnPlayer();
    return;
  }
  isMousePressed = true;
}, { passive: true });

window.addEventListener('touchend', () => {
  isMousePressed = false;
}, { passive: true });

// --- Food Pellets ---
function spawnPellet() {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.sqrt(Math.random()) * (MAP_RADIUS - 35);
  const isMega = Math.random() < 0.15;
  const radius = isMega ? 9 : Math.floor(Math.random() * 2) + 6;
  const massValue = isMega ? 8.0 : 3.5;

  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    radius: radius,
    color: PELLET_PALETTE[Math.floor(Math.random() * PELLET_PALETTE.length)],
    massValue: massValue,
    isMega: isMega
  };
}

const foodPellets = [];
for (let i = 0; i < FOOD_COUNT; i++) {
  foodPellets.push(spawnPellet());
}

// --- Bot Management ---
function createBot(name) {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.sqrt(Math.random()) * (MAP_RADIUS - 160);
  const theme = BOT_PALETTES[Math.floor(Math.random() * BOT_PALETTES.length)];

  const roll = Math.random();
  let initialMass;
  if (roll < 0.45) {
    initialMass = 85 + Math.floor(Math.random() * 35);
  } else if (roll < 0.8) {
    initialMass = 130 + Math.floor(Math.random() * 80);
  } else {
    initialMass = 230 + Math.floor(Math.random() * 130);
  }

  return {
    name: name || BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    mass: initialMass,
    radius: massToRadius(initialMass),
    color: theme.fill,
    strokeColor: theme.stroke,
    speed: massToSpeed(initialMass),
    heading: Math.random() * Math.PI * 2,
    score: 0,
    targetChangeTimer: Math.floor(Math.random() * 30),
    isPlayer: false,
    isBoosting: false
  };
}

const bots = [];
for (let i = 0; i < BOT_COUNT; i++) {
  bots.push(createBot(BOT_NAMES[i % BOT_NAMES.length]));
}

// --- Bot AI Logic ---
function updateBots() {
  for (let i = 0; i < bots.length; i++) {
    const bot = bots[i];
    bot.targetChangeTimer--;

    // Gentle natural decay when very large
    if (bot.mass > 1200) {
      bot.mass -= bot.mass * 0.00008;
      bot.radius = massToRadius(bot.mass);
      bot.speed = massToSpeed(bot.mass);
    }

    const distFromCenter = Math.hypot(bot.x, bot.y);
    let desiredHeading = bot.heading;
    let shouldBoost = false;

    // 1. Boundary steering: steer toward center when close to arena border
    if (distFromCenter > MAP_RADIUS - 180) {
      desiredHeading = Math.atan2(-bot.y, -bot.x);
    } else if (bot.targetChangeTimer <= 0) {
      bot.targetChangeTimer = 18 + Math.floor(Math.random() * 20);

      let nearestThreat = null;
      let minThreatDist = 320;
      let nearestTarget = null;
      let minTargetDist = 260;

      // Check player threat / prey only if player is alive
      if (!player.isDead) {
        const distToPlayer = Math.hypot(player.x - bot.x, player.y - bot.y);
        if (player.mass > bot.mass && distToPlayer < minThreatDist) {
          nearestThreat = player;
          minThreatDist = distToPlayer;
        } else if (bot.mass > player.mass && distToPlayer < minTargetDist) {
          nearestTarget = player;
          minTargetDist = distToPlayer;
        }
      }

      // Check other bots
      for (let j = 0; j < bots.length; j++) {
        if (i === j) continue;
        const other = bots[j];
        const d = Math.hypot(other.x - bot.x, other.y - bot.y);
        if (other.mass > bot.mass && d < minThreatDist) {
          nearestThreat = other;
          minThreatDist = d;
        } else if (bot.mass > other.mass && d < minTargetDist) {
          nearestTarget = other;
          minTargetDist = d;
        }
      }

      if (nearestThreat) {
        desiredHeading = Math.atan2(bot.y - nearestThreat.y, bot.x - nearestThreat.x);
        if (minThreatDist < 220 && bot.mass > MIN_BOOST_MASS + 20) {
          shouldBoost = true;
        }
      } else if (nearestTarget) {
        desiredHeading = Math.atan2(nearestTarget.y - bot.y, nearestTarget.x - bot.x);
        if (minTargetDist < 190 && bot.mass > MIN_BOOST_MASS + 40) {
          shouldBoost = true;
        }
      } else {
        let closestPellet = null;
        let minPelletDist = 360;
        for (let p = 0; p < foodPellets.length; p += 6) {
          const pellet = foodPellets[p];
          const d = Math.hypot(pellet.x - bot.x, pellet.y - bot.y);
          if (d < minPelletDist) {
            minPelletDist = d;
            closestPellet = pellet;
          }
        }

        if (closestPellet) {
          desiredHeading = Math.atan2(closestPellet.y - bot.y, closestPellet.x - bot.x);
        } else {
          desiredHeading = bot.heading + (Math.random() - 0.5) * 1.2;
        }
      }
    }

    bot.isBoosting = shouldBoost && bot.mass > MIN_BOOST_MASS;

    // Smooth heading rotation
    let angleDiff = desiredHeading - bot.heading;
    angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    bot.heading += angleDiff * 0.12;

    // Calculate effective speed (uniform boost speed for all sizes)
    let effectiveSpeed = bot.speed;
    if (bot.isBoosting) {
      effectiveSpeed = BOOST_SPEED;
      const massCost = 0.22 + bot.mass * 0.0015;
      bot.mass -= massCost;
      bot.radius = massToRadius(bot.mass);
      bot.speed = massToSpeed(bot.mass);
      spawnBoostParticle(bot, bot.heading);
    }

    // Move bot
    bot.x += Math.cos(bot.heading) * effectiveSpeed;
    bot.y += Math.sin(bot.heading) * effectiveSpeed;

    // Constrain within map bounds
    const bDist = Math.hypot(bot.x, bot.y);
    if (bDist + bot.radius > MAP_RADIUS) {
      const a = Math.atan2(bot.y, bot.x);
      bot.x = Math.cos(a) * (MAP_RADIUS - bot.radius);
      bot.y = Math.sin(a) * (MAP_RADIUS - bot.radius);
    }

    // Bot eats food pellets
    for (let f = 0; f < foodPellets.length; f++) {
      const pellet = foodPellets[f];
      const pDist = Math.hypot(bot.x - pellet.x, bot.y - pellet.y);
      if (pDist < bot.radius + pellet.radius) {
        bot.mass += pellet.massValue;
        bot.score++;
        bot.radius = massToRadius(bot.mass);
        bot.speed = massToSpeed(bot.mass);
        foodPellets[f] = spawnPellet();
      }
    }
  }
}

// --- Entity-on-Entity Consumption ---
function checkEntityCollisions() {
  // 1. Player vs Bots (only if alive)
  if (!player.isDead) {
    for (let i = 0; i < bots.length; i++) {
      const bot = bots[i];
      const dist = Math.hypot(player.x - bot.x, player.y - bot.y);

      // On collision, the smaller entity dies even if by 1 mass!
      if (dist < player.radius + bot.radius) {
        if (player.mass >= bot.mass) {
          // Player eats Bot
          const massGained = Math.floor(bot.mass * 0.85);
          player.mass += massGained;
          player.score += Math.floor(bot.mass);
          player.radius = massToRadius(player.mass);
          player.speed = massToSpeed(player.mass);
          bots[i] = createBot(bot.name);
        } else {
          // Bot eats Player
          const massGained = Math.floor(player.mass * 0.85);
          bot.mass += massGained;
          bot.score += Math.floor(player.mass);
          bot.radius = massToRadius(bot.mass);
          bot.speed = massToSpeed(bot.mass);
          killPlayer(bot.name);
          break;
        }
      }
    }
  }

  // 2. Bot vs Bot
  for (let i = 0; i < bots.length; i++) {
    const botA = bots[i];
    for (let j = i + 1; j < bots.length; j++) {
      const botB = bots[j];
      const dist = Math.hypot(botA.x - botB.x, botA.y - botB.y);

      // On collision, the smaller entity dies even if by 1 mass!
      if (dist < botA.radius + botB.radius) {
        if (botA.mass >= botB.mass) {
          botA.mass += Math.floor(botB.mass * 0.85);
          botA.score += Math.floor(botB.mass);
          botA.radius = massToRadius(botA.mass);
          botA.speed = massToSpeed(botA.mass);
          bots[j] = createBot(botB.name);
        } else {
          botB.mass += Math.floor(botA.mass * 0.85);
          botB.score += Math.floor(botA.mass);
          botB.radius = massToRadius(botB.mass);
          botB.speed = massToSpeed(botB.mass);
          bots[i] = createBot(botA.name);
          break;
        }
      }
    }
  }
}

// Helper to draw an entity (player or bot) - no visual tell for boosting
function drawEntity(entity) {
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
  ctx.fillStyle = entity.color;
  ctx.fill();
  ctx.lineWidth = Math.max(3.5, entity.radius * 0.075);
  ctx.strokeStyle = entity.strokeColor;
  ctx.stroke();
  ctx.closePath();

  // Name and mass labels inside blob
  if (entity.radius >= 16) {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = Math.max(11, Math.floor(entity.radius * 0.28));
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.fillText(entity.name, entity.x, entity.y - fontSize * 0.38);

    ctx.font = `bold ${Math.max(10, Math.floor(fontSize * 0.85))}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(Math.floor(entity.mass), entity.x, entity.y + fontSize * 0.72);
  }
}

// --- Game Loop ---
function gameLoop() {
  const screenCenterX = canvas.width / 2;
  const screenCenterY = canvas.height / 2;

  // 1. Player Boosting logic & Movement (only if alive)
  let camX = player.x;
  let camY = player.y;

  if (!player.isDead) {
    const wantBoost = isBoostKeyPressed || isMousePressed;
    player.isBoosting = wantBoost && player.mass > MIN_BOOST_MASS;

    let currentSpeed = player.speed;
    const dx = mouse.x - screenCenterX;
    const dy = mouse.y - screenCenterY;
    const dist = Math.hypot(dx, dy);
    const moveAngle = Math.atan2(dy, dx);

    // Speed up to uniform BOOST_SPEED and burn mass when boosting
    if (player.isBoosting) {
      currentSpeed = BOOST_SPEED;
      const massBurn = 0.25 + player.mass * 0.0018;
      player.mass -= massBurn;
      player.radius = massToRadius(player.mass);
      player.speed = massToSpeed(player.mass);
      spawnBoostParticle(player, moveAngle);
    }

    if (dist > 8) {
      const speedMult = Math.min(1, (dist - 8) / 80);
      const step = currentSpeed * speedMult;
      player.x += (dx / dist) * step;
      player.y += (dy / dist) * step;
    }

    // Constrain player within circular map boundary
    const distFromCenter = Math.hypot(player.x, player.y);
    if (distFromCenter + player.radius > MAP_RADIUS) {
      const angle = Math.atan2(player.y, player.x);
      player.x = Math.cos(angle) * (MAP_RADIUS - player.radius);
      player.y = Math.sin(angle) * (MAP_RADIUS - player.radius);
    }

    // Natural high-mass decay for player
    if (player.mass > 1200) {
      player.mass -= player.mass * 0.00008;
      player.radius = massToRadius(player.mass);
      player.speed = massToSpeed(player.mass);
    }

    // Food Collision Detection for Player
    for (let i = 0; i < foodPellets.length; i++) {
      const pellet = foodPellets[i];
      const pDist = Math.hypot(player.x - pellet.x, player.y - pellet.y);
      if (pDist < player.radius + pellet.radius) {
        player.mass += pellet.massValue;
        player.score++;
        player.radius = massToRadius(player.mass);
        player.speed = massToSpeed(player.mass);
        foodPellets[i] = spawnPellet();
      }
    }
  } else {
    camX = deathCameraX;
    camY = deathCameraY;
  }

  // 2. Update Bots & Check Battles
  updateBots();
  checkEntityCollisions();

  // 3. Dynamic Camera Zoom calculation
  const targetZoom = Math.max(0.2, Math.min(1.0, Math.pow(INITIAL_RADIUS / player.radius, 0.48)));
  currentZoom += (targetZoom - currentZoom) * 0.05;

  // 4. Clear Canvas (Outer void color)
  ctx.fillStyle = '#0b0d13';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 5. World Camera Transform (centered on player or death point, dynamically scaled)
  ctx.save();
  ctx.translate(screenCenterX, screenCenterY);
  ctx.scale(currentZoom, currentZoom);
  ctx.translate(-camX, -camY);

  // Draw circular arena ground
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, MAP_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#151922';
  ctx.fill();
  ctx.clip();

  // Draw arena grid
  const GRID_SIZE = 70;
  const startX = Math.floor(-MAP_RADIUS / GRID_SIZE) * GRID_SIZE;
  const endX = Math.ceil(MAP_RADIUS / GRID_SIZE) * GRID_SIZE;
  const startY = Math.floor(-MAP_RADIUS / GRID_SIZE) * GRID_SIZE;
  const endY = Math.ceil(MAP_RADIUS / GRID_SIZE) * GRID_SIZE;

  ctx.strokeStyle = '#202634';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX; x <= endX; x += GRID_SIZE) {
    ctx.moveTo(x, -MAP_RADIUS);
    ctx.lineTo(x, MAP_RADIUS);
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    ctx.moveTo(-MAP_RADIUS, y);
    ctx.lineTo(MAP_RADIUS, y);
  }
  ctx.stroke();
  ctx.restore();

  // Draw glowing circular map boundary
  ctx.beginPath();
  ctx.arc(0, 0, MAP_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff3366';
  ctx.lineWidth = Math.max(5, 9 / currentZoom);
  ctx.shadowColor = '#ff3366';
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Visible region in world coordinates
  const halfVisibleWidth = (canvas.width / currentZoom) / 2 + 100;
  const halfVisibleHeight = (canvas.height / currentZoom) / 2 + 100;
  const viewLeft = camX - halfVisibleWidth;
  const viewRight = camX + halfVisibleWidth;
  const viewTop = camY - halfVisibleHeight;
  const viewBottom = camY + halfVisibleHeight;

  // Draw boost particle trail
  for (let i = boostParticles.length - 1; i >= 0; i--) {
    const p = boostParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 1 / p.life;
    p.radius *= 0.96;

    if (p.alpha <= 0 || p.radius <= 0.4) {
      boostParticles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }

  // Draw food pellets (all with white bordering)
  for (let i = 0; i < foodPellets.length; i++) {
    const pellet = foodPellets[i];
    if (
      pellet.x >= viewLeft &&
      pellet.x <= viewRight &&
      pellet.y >= viewTop &&
      pellet.y <= viewBottom
    ) {
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, pellet.radius, 0, Math.PI * 2);
      ctx.fillStyle = pellet.color;
      ctx.fill();
      ctx.lineWidth = pellet.isMega ? 2.5 : 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.closePath();
    }
  }

  // Draw bots (sorted by radius)
  const culledBots = bots.filter(
    (b) =>
      b.x + b.radius >= viewLeft &&
      b.x - b.radius <= viewRight &&
      b.y + b.radius >= viewTop &&
      b.y - b.radius <= viewBottom
  );
  culledBots.sort((a, b) => a.radius - b.radius);

  for (const bot of culledBots) {
    drawEntity(bot);
  }

  // Draw player only if alive
  if (!player.isDead) {
    drawEntity(player);
  }

  // Restore camera context to screen space
  ctx.restore();

  // 6. Draw HUD (Screen Space)
  // Score badge in top-left
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(20, 20, 185, 68, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillRect(20, 20, 185, 68);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('MASS', 34, 28);
  ctx.fillText('SCORE', 115, 28);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`${Math.floor(player.mass)}`, 34, 46);

  ctx.fillStyle = '#00e676';
  ctx.fillText(`${player.score}`, 115, 46);

  // Leaderboard in top-right
  const allEntities = player.isDead ? [...bots] : [player, ...bots];
  allEntities.sort((a, b) => b.mass - a.mass);

  const lbWidth = 190;
  const lbHeight = 230;
  const lbX = canvas.width - lbWidth - 20;
  const lbY = 20;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(lbX, lbY, lbWidth, lbHeight, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillRect(lbX, lbY, lbWidth, lbHeight);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LEADERBOARD', lbX + lbWidth / 2, lbY + 12);

  const topEntities = allEntities.slice(0, 7);
  for (let k = 0; k < topEntities.length; k++) {
    const entry = topEntities[k];
    const rowY = lbY + 38 + k * 25;

    ctx.font = entry.isPlayer ? 'bold 13px sans-serif' : '13px sans-serif';
    ctx.fillStyle = entry.isPlayer ? '#00e676' : '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText(`${k + 1}. ${entry.name}`, lbX + 16, rowY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${Math.floor(entry.mass)}`, lbX + lbWidth - 16, rowY);
  }

  // Circular Minimap in bottom-right corner
  const minimapRadius = 65;
  const minimapMargin = 25;
  const minimapCenterX = canvas.width - minimapRadius - minimapMargin;
  const minimapCenterY = canvas.height - minimapRadius - minimapMargin;

  // Minimap background & border
  ctx.beginPath();
  ctx.arc(minimapCenterX, minimapCenterY, minimapRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 51, 102, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw bot dots on minimap
  for (const bot of bots) {
    const miniBotX = minimapCenterX + (bot.x / MAP_RADIUS) * minimapRadius;
    const miniBotY = minimapCenterY + (bot.y / MAP_RADIUS) * minimapRadius;
    const miniBotRadius = Math.max(2.5, Math.min(5.5, Math.sqrt(bot.mass) * 0.14));
    ctx.beginPath();
    ctx.arc(miniBotX, miniBotY, miniBotRadius, 0, Math.PI * 2);
    ctx.fillStyle = bot.color;
    ctx.fill();
  }

  // Draw player dot on minimap (if alive)
  if (!player.isDead) {
    const miniPlayerX = minimapCenterX + (player.x / MAP_RADIUS) * minimapRadius;
    const miniPlayerY = minimapCenterY + (player.y / MAP_RADIUS) * minimapRadius;
    const miniPlayerRadius = Math.max(4, Math.min(7.5, Math.sqrt(player.mass) * 0.17));
    ctx.beginPath();
    ctx.arc(miniPlayerX, miniPlayerY, miniPlayerRadius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 7. Death / Respawn Option Modal (Screen Space)
  if (player.isDead) {
    // Semi-transparent backdrop overlay
    ctx.fillStyle = 'rgba(8, 12, 22, 0.82)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const modalW = 390;
    const modalH = 290;
    const modalX = screenCenterX - modalW / 2;
    const modalY = screenCenterY - modalH / 2;

    ctx.save();
    // Modal card background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(modalX, modalY, modalW, modalH, 16);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(modalX, modalY, modalW, modalH);
      ctx.strokeRect(modalX, modalY, modalW, modalH);
    }

    // Top red accent line
    ctx.fillStyle = '#ef4444';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(modalX + 30, modalY, modalW - 60, 4, 2);
      ctx.fill();
    }

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('GAME OVER', screenCenterX, modalY + 28);

    // Eaten by line
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Consumed by ${player.killer}`, screenCenterX, modalY + 68);

    // Stats summary cards
    const statW = 145;
    const statH = 56;
    const stat1X = modalX + 35;
    const stat2X = modalX + modalW - 35 - statW;
    const statY = modalY + 104;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(stat1X, statY, statW, statH, 8);
      ctx.roundRect(stat2X, statY, statW, statH, 8);
      ctx.fill();
    } else {
      ctx.fillRect(stat1X, statY, statW, statH);
      ctx.fillRect(stat2X, statY, statW, statH);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('FINAL MASS', stat1X + statW / 2, statY + 10);
    ctx.fillText('FINAL SCORE', stat2X + statW / 2, statY + 10);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(`${player.finalMass}`, stat1X + statW / 2, statY + 28);

    ctx.fillStyle = '#00e676';
    ctx.fillText(`${player.finalScore}`, stat2X + statW / 2, statY + 28);

    // Respawn Button
    const btnW = 210;
    const btnH = 46;
    const btnX = screenCenterX - btnW / 2;
    const btnY = modalY + 184;

    const isHovered = mouse.x >= btnX && mouse.x <= btnX + btnW && mouse.y >= btnY && mouse.y <= btnY + btnH;
    canvas.style.cursor = isHovered ? 'pointer' : 'default';

    ctx.fillStyle = isHovered ? '#10b981' : '#059669';
    if (isHovered) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 14;
    }
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 8);
      ctx.fill();
    } else {
      ctx.fillRect(btnX, btnY, btnW, btnH);
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('RESPAWN', screenCenterX, btnY + btnH / 2);

    // Keyboard shortcut hint
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('Press [Space], [Enter], or click to respawn', screenCenterX, btnY + btnH + 12);

    ctx.restore();
  } else {
    canvas.style.cursor = 'default';
  }

  // Request next frame
  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
