const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to full window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Simple Player Object
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  color: '#00e676',
  speed: 5
};

// Track mouse position
let mouse = { x: player.x, y: player.y };
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// Game Loop
function gameLoop() {
  // 1. Clear previous frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2. Move player smoothly towards mouse
  let dx = mouse.x - player.x;
  let dy = mouse.y - player.y;
  let dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 5) {
    player.x += (dx / dist) * player.speed;
    player.y += (dy / dist) * player.speed;
  }

  // 3. Draw player
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.closePath();

  // 4. Request next frame
  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
