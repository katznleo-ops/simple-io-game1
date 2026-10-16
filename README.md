# Simple .IO Game

A lightweight, high-performance HTML5 Canvas 2D `.io` game arena.

🎮 **Play Online**: [https://katznleo-ops.github.io/simple-io-game1/](https://katznleo-ops.github.io/simple-io-game1/)

---

## 🕹️ Controls & Mechanics

- **Mouse / Cursor**: Direct your blob towards the cursor.
- **Spacebar / Left Mouse Click / Touch**: **Speed Boost**
  - Accelerates movement by **+75%** (`1.75x`).
  - Burns mass proportional to current size (smaller blobs boost cheaply, giants burn heavier mass).
  - Silent boost: no visual giveaways to other competitors.
- **Food Pellets**:
  - Outlined in crisp white borders.
  - Multi-colored pellets award **+3.5 mass**.
  - Rare Mega Pellets award **+8.0 mass**.
- **Collisions & Combat**:
  - Whenever two entities collide, the smaller entity is instantly consumed—**even if it has only 1 less size**.
  - In a rare exact tie, the player prevails.
- **Game Over & Respawn**:
  - Review your run's stats upon being consumed.
  - Press **Space**, **Enter**, or click **Respawn** to jump straight back into the action.

---

## 🚀 Features

- **Circular Arena**: 1800px radius map with glowing boundary clamping and dynamic relative motion grid.
- **Smooth Auto-Zoom Camera**: Scales out as your blob grows, keeping your surrounding field of view clear.
- **Autonomous AI Competitors**: 16 bots continuously compete, hunt prey, flee predators, and strategically boost.
- **Real-Time Leaderboard**: Tracks the top 7 blobs in the arena.
- **Radar Minimap**: Real-time positions for all entities.