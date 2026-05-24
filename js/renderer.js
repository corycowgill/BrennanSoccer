// Brennan's Soccer Showdown - Renderer v2
// Enhanced visuals: ball trails, screen shake, vignette, minimap, better particles,
// improved player rendering, dynamic crowd, commentary bar

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.frameCount = 0;
    this.stadiumData = null;
    this.time = 0;

    // Broadcast-style font stack. Falls back gracefully on iOS / web.
    this.fontDisplay = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
    this.fontBody = 'Arial, "Helvetica Neue", sans-serif';
    this.fontMono = '"SFMono-Regular", "Menlo", "Consolas", "Courier New", monospace';
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = w;
    this.height = h;
    const totalW = engine.pitch.totalWidth;
    const totalH = engine.pitch.totalHeight;
    this.scale = Math.min(w / totalW, h / totalH);
    this.offsetX = (w - totalW * this.scale) / 2;
    this.offsetY = (h - totalH * this.scale) / 2;
  }

  setStadium(stadiumData) { this.stadiumData = stadiumData; }

  toScreen(gx, gy) {
    return { x: this.offsetX + gx * this.scale, y: this.offsetY + gy * this.scale };
  }

  render() {
    this.frameCount++;
    this.time += 1/60;
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);

    // Apply screen shake
    const shakeX = engine.shakeX * this.scale;
    const shakeY = engine.shakeY * this.scale;

    ctx.translate(this.offsetX + shakeX, this.offsetY + shakeY);
    ctx.scale(this.scale, this.scale);

    this.drawStadium();
    this.drawPitch();
    this.drawShadows();

    // Sort all entities by Y for depth
    const entities = [];
    for (const p of [...engine.homePlayers, ...engine.awayPlayers]) {
      entities.push({ type: 'player', obj: p, y: p.y });
    }
    if (!engine.ball.owner) {
      entities.push({ type: 'ball', obj: engine.ball, y: engine.ball.y });
    }
    entities.sort((a, b) => a.y - b.y);

    // Draw ball trail (behind everything)
    this.drawBallTrail();

    for (const e of entities) {
      if (e.type === 'player') this.drawPlayer(e.obj);
      else this.drawBall();
    }

    this.drawParticles();
    this.drawGoalStructure(ctx, engine.pitch.goalLineLeft, engine.pitch.goalTop, engine.pitch.goalBottom, 'left');
    this.drawGoalStructure(ctx, engine.pitch.goalLineRight, engine.pitch.goalTop, engine.pitch.goalBottom, 'right');

    ctx.restore();

    // Screen-space overlays
    this.drawVignette();
    this.drawHUD();
    this.drawCommentary();
    this.drawMinimap();

    if (input.isMobile && engine.state === 'playing') this.drawTouchControls();
    this.drawStateOverlay();
  }

  // === STADIUM ===
  drawStadium() {
    const ctx = this.ctx;
    const p = engine.pitch;
    const s = this.stadiumData || STADIUMS[0];
    const totalW = p.totalWidth;
    const totalH = p.totalHeight;

    // Sky
    const skyGrad = ctx.createLinearGradient(0, -totalH * 0.5, 0, p.y);
    s.skyGradient.forEach((color, i) => {
      skyGrad.addColorStop(i / (s.skyGradient.length - 1), color);
    });
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-50, -totalH * 0.5, totalW + 100, p.y + totalH * 0.5);

    // Stands
    this.drawStands(ctx, -20, -totalH * 0.15, totalW + 40, p.y + totalH * 0.15, s, 'top');
    this.drawStands(ctx, -20, p.y + p.height, totalW + 40, totalH * 0.4, s, 'bottom');
    this.drawStands(ctx, -30, p.y - 10, p.x + 30, p.height + 20, s, 'left');
    this.drawStands(ctx, p.x + p.width, p.y - 10, p.x + 30, p.height + 20, s, 'right');

    this.drawAdBoards(ctx, p, s);

    if (s.floodlights) this.drawFloodlights(ctx, p, totalW, totalH);

    if (s.weatherEffect === 'sun') {
      const sunX = totalW * 0.8, sunY = -totalH * 0.1;
      const grad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 250);
      grad.addColorStop(0, 'rgba(255,255,220,0.5)');
      grad.addColorStop(0.3, 'rgba(255,255,200,0.15)');
      grad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 250, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawStands(ctx, x, y, w, h, stadium, side) {
    // Gradient stand
    const standGrad = ctx.createLinearGradient(0, y, 0, y + h);
    standGrad.addColorStop(0, stadium.standColor);
    standGrad.addColorStop(1, stadium.standAccent);
    ctx.fillStyle = standGrad;
    ctx.fillRect(x, y, w, h);

    // Crowd with wave animation
    const density = stadium.crowdDensity;
    const spacing = 7;
    const colors = [stadium.crowdColor1, stadium.crowdColor2, stadium.crowdColor3];
    const time = this.time;
    // Mexican wave during goals
    const isGoal = engine.state === 'goal_scored';
    const waveSpeed = isGoal ? 3 : 0.5;
    const waveAmp = isGoal ? 4 : 1.5;

    for (let cx = x + 3; cx < x + w; cx += spacing) {
      for (let cy = y + 3; cy < y + h - 2; cy += spacing) {
        const hash = ((cx * 31 + cy * 17) & 0xFFFF);
        if ((hash % 100) / 100 > density) continue;
        const colorIdx = hash % colors.length;
        const wave = Math.sin(time * waveSpeed + cx * 0.04 + cy * 0.02) * waveAmp;
        const jumpUp = isGoal ? Math.max(0, Math.sin(time * 8 + cx * 0.1)) * 3 : 0;

        // Body
        ctx.fillStyle = colors[colorIdx];
        ctx.fillRect(cx, cy + wave - jumpUp, 4, 5);
        // Head
        const skinColors = ['#F5D6BA', '#E8C99A', '#C4A882', '#8B6914', '#6B4226'];
        ctx.fillStyle = skinColors[hash % skinColors.length];
        ctx.beginPath();
        ctx.arc(cx + 2, cy + wave - jumpUp - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (stadium.hasRoof && (side === 'top')) {
      ctx.fillStyle = stadium.roofColor;
      ctx.fillRect(x, y - 6, w, 10);
      // Roof edge highlight
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(x, y + 3, w, 1);
    }
  }

  drawAdBoards(ctx, p, stadium) {
    const boardH = 7;
    const colors = stadium.adBoardColors;
    const segW = 45;

    // Animated LED effect
    const ledOffset = Math.floor(this.time * 30) % segW;

    [p.y - boardH - 2, p.y + p.height + 2].forEach((y, row) => {
      for (let x = p.x; x < p.x + p.width; x += segW) {
        const idx = (Math.floor((x + row * 25) / segW) + Math.floor(this.time * 0.5)) % colors.length;
        ctx.fillStyle = colors[idx];
        ctx.fillRect(x, y, segW - 1, boardH);
        // LED glow
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 1, y + 1, segW - 3, 2);
      }
    });
  }

  drawFloodlights(ctx, p, totalW, totalH) {
    const positions = [
      { x: 15, y: -totalH * 0.12 },
      { x: totalW - 15, y: -totalH * 0.12 },
      { x: totalW * 0.35, y: -totalH * 0.15 },
      { x: totalW * 0.65, y: -totalH * 0.15 },
    ];
    for (const fl of positions) {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fl.x, fl.y + 5);
      ctx.lineTo(fl.x, fl.y + totalH * 0.27);
      ctx.stroke();

      // Fixture
      ctx.fillStyle = '#CCC';
      ctx.fillRect(fl.x - 10, fl.y - 3, 20, 8);

      // Light glow
      const grad = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y + 80, 350);
      grad.addColorStop(0, 'rgba(255,255,230,0.12)');
      grad.addColorStop(1, 'rgba(255,255,230,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(fl.x - 350, fl.y, 700, 500);

      // Bright point
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === PITCH ===
  drawPitch() {
    const ctx = this.ctx;
    const p = engine.pitch;
    const s = this.stadiumData || STADIUMS[0];

    // Grass stripes with slight gradient for depth
    const stripeW = p.width / 14;
    for (let i = 0; i < 14; i++) {
      const baseColor = i % 2 === 0 ? s.grassColor1 : s.grassColor2;
      const grad = ctx.createLinearGradient(0, p.y, 0, p.y + p.height);
      grad.addColorStop(0, this.lightenColor(baseColor, 8));
      grad.addColorStop(0.5, baseColor);
      grad.addColorStop(1, this.darkenColor(baseColor, 8));
      ctx.fillStyle = grad;
      ctx.fillRect(p.x + i * stripeW, p.y, stripeW + 0.5, p.height);
    }

    // Subtle grass noise texture
    ctx.fillStyle = 'rgba(0,0,0,0.015)';
    for (let gx = p.x; gx < p.x + p.width; gx += 20) {
      for (let gy = p.y; gy < p.y + p.height; gy += 20) {
        if (((gx * 7 + gy * 13) & 3) === 0) {
          ctx.fillRect(gx, gy, 10, 10);
        }
      }
    }

    // Pitch markings with glow
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 4;

    ctx.strokeRect(p.x, p.y, p.width, p.height);

    ctx.beginPath();
    ctx.moveTo(p.centerX, p.y);
    ctx.lineTo(p.centerX, p.y + p.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.centerX, p.centerY, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.centerX, p.centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    const penW = 120, penH = 260, penTop = p.centerY - penH / 2;
    ctx.strokeRect(p.x, penTop, penW, penH);
    ctx.strokeRect(p.x, p.centerY - 80, 50, 160);
    ctx.beginPath(); ctx.arc(p.x + 90, p.centerY, 3, 0, Math.PI * 2); ctx.fill();

    ctx.strokeRect(p.x + p.width - penW, penTop, penW, penH);
    ctx.strokeRect(p.x + p.width - 50, p.centerY - 80, 50, 160);
    ctx.beginPath(); ctx.arc(p.x + p.width - 90, p.centerY, 3, 0, Math.PI * 2); ctx.fill();

    // Penalty arcs
    ctx.beginPath();
    ctx.arc(p.x + 90, p.centerY, 55, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x + p.width - 90, p.centerY, 55, Math.PI - 0.7, Math.PI + 0.7);
    ctx.stroke();

    // Corner arcs
    [[p.x, p.y, 0], [p.x + p.width, p.y, Math.PI / 2],
     [p.x, p.y + p.height, -Math.PI / 2], [p.x + p.width, p.y + p.height, Math.PI]].forEach(([cx, cy, sa]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 10, sa, sa + Math.PI / 2);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    // Corner flags (triangle pennants that flutter slightly)
    const flagH = 22;
    const flagW = 14;
    const homeFlagColor = engine.homeTeamData ? engine.homeTeamData.primaryColor : '#FF3333';
    const awayFlagColor = engine.awayTeamData ? engine.awayTeamData.primaryColor : '#3366FF';
    const corners = [
      { x: p.x, y: p.y, side: -1, color: homeFlagColor },
      { x: p.x, y: p.y + p.height, side: -1, color: homeFlagColor },
      { x: p.x + p.width, y: p.y, side: 1, color: awayFlagColor },
      { x: p.x + p.width, y: p.y + p.height, side: 1, color: awayFlagColor },
    ];
    corners.forEach((c, i) => {
      // Flagpole
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x, c.y - flagH);
      ctx.stroke();
      // Pennant - flutter via Math.sin
      const flutter = Math.sin(this.time * 4 + i) * 1.5;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - flagH);
      ctx.lineTo(c.x + c.side * (flagW + flutter), c.y - flagH + 4);
      ctx.lineTo(c.x, c.y - flagH + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });
  }

  drawGoalStructure(ctx, x, top, bottom, side) {
    const depth = side === 'left' ? -22 : 22;

    // Net fill
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(side === 'left' ? x + depth : x, top, Math.abs(depth), bottom - top);

    // Net mesh
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.4;
    const netSpacing = 7;
    for (let ny = top; ny <= bottom; ny += netSpacing) {
      ctx.beginPath(); ctx.moveTo(x, ny); ctx.lineTo(x + depth, ny); ctx.stroke();
    }
    for (let nx = 0; nx <= Math.abs(depth); nx += netSpacing) {
      const actualX = side === 'left' ? x - nx : x + nx;
      ctx.beginPath(); ctx.moveTo(actualX, top); ctx.lineTo(actualX, bottom); ctx.stroke();
    }

    // Posts with glow
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + depth, top); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, bottom); ctx.lineTo(x + depth, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + depth, top); ctx.lineTo(x + depth, bottom); ctx.stroke();
    ctx.shadowBlur = 0;

    // Post circles
    ctx.fillStyle = '#fff';
    [[x, top], [x, bottom]].forEach(([px, py]) => {
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  // === SHADOWS ===
  drawShadows() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (const p of [...engine.homePlayers, ...engine.awayPlayers]) {
      ctx.beginPath();
      ctx.ellipse(p.x + 3, p.y + 11, 10, 4.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!engine.ball.owner) {
      const bz = Math.max(0, engine.ball.z);
      const shadowAlpha = Math.max(0.05, 0.18 - bz * 0.01);
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(engine.ball.x + 2, engine.ball.y + 11, 5 + bz * 0.05, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === BALL ===
  drawBallTrail() {
    const ball = engine.ball;
    if (ball.trail.length < 2) return;
    const ctx = this.ctx;

    for (let i = 0; i < ball.trail.length; i++) {
      const t = ball.trail[i];
      const alpha = (1 - t.age / 0.3) * 0.4;
      const size = 3 * (1 - t.age / 0.3);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBall() {
    const ctx = this.ctx;
    const ball = engine.ball;
    if (ball.owner) return;

    const z = Math.max(0, ball.z);
    const drawY = ball.y - z;
    const size = 5 + z * 0.08;
    const isMovingFast = ball.speed > 8;

    ctx.save();
    ctx.translate(ball.x, drawY);

    // Motion blur glow for fast shots
    if (isMovingFast) {
      const glowSize = size + ball.speed * 0.3;
      ctx.fillStyle = `rgba(255,255,200,${Math.min(0.3, ball.speed * 0.02)})`;
      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.rotate(ball.rotation);

    // Ball body
    const ballGrad = ctx.createRadialGradient(-1, -1, 0, 0, 0, size);
    ballGrad.addColorStop(0, '#FFFFFF');
    ballGrad.addColorStop(1, '#DDDDDD');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Pentagon pattern
    ctx.fillStyle = '#222';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * size * 0.45;
      const py = Math.sin(angle) * size * 0.45;
      ctx.beginPath();
      ctx.arc(px, py, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center pentagon
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // === PLAYERS ===
  drawPlayer(player) {
    const ctx = this.ctx;
    const team = player.teamData;
    const isControlled = player === engine.controlledPlayer;
    const hasBall = engine.ball.owner === player;
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    const runPhase = Math.sin(player.runFrame);
    const isTackling = player.tackleCooldown > 0.4;

    ctx.save();
    ctx.translate(player.x, player.y);

    // Selection indicator - pulsing ring
    if (isControlled) {
      const pulseScale = 1 + Math.sin(this.time * 6) * 0.1;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 10, 14 * pulseScale, 7 * pulseScale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Floating arrow
      const arrowBob = Math.sin(this.time * 4) * 3;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(0, -30 + arrowBob);
      ctx.lineTo(-5, -24 + arrowBob);
      ctx.lineTo(5, -24 + arrowBob);
      ctx.closePath();
      ctx.fill();
    }

    if (isTackling) {
      // Slide tackle pose
      ctx.rotate(player.angle);
      ctx.fillStyle = team.shortsColor === '#FFFFFF' ? '#F5F5F5' : team.shortsColor;
      ctx.fillRect(-8, -3, 16, 6);
      this.drawJersey(ctx, player, team, true);
      ctx.fillStyle = this.getSkinColor(player.skinTone);
      ctx.beginPath(); ctx.arc(-2, -5, 5, 0, Math.PI * 2); ctx.fill();
      this.drawHairSmall(ctx, player, -2, -5);
    } else {
      // Normal standing/running pose
      const legSpread = speed > 0.5 ? runPhase * 4.5 : 0;
      // Shorts
      ctx.fillStyle = team.shortsColor === '#FFFFFF' ? '#F0F0F0' : team.shortsColor;
      ctx.fillRect(-4, 2 + legSpread, 3, 7);
      ctx.fillRect(1, 2 - legSpread, 3, 7);

      // Socks
      ctx.fillStyle = team.socksColor;
      ctx.fillRect(-4, 7 + legSpread, 3, 4);
      ctx.fillRect(1, 7 - legSpread, 3, 4);

      // Boots
      ctx.fillStyle = '#111';
      ctx.fillRect(-4.5, 10 + legSpread, 4.5, 2);
      ctx.fillRect(0.5, 10 - legSpread, 4.5, 2);

      // Jersey
      this.drawJersey(ctx, player, team, false);

      // Arms
      const armSwing = speed > 0.5 ? runPhase * 2.5 : 0;
      ctx.fillStyle = this.getSkinColor(player.skinTone);
      ctx.fillRect(-8.5, -4 - armSwing, 3, 7);
      ctx.fillRect(5.5, -4 + armSwing, 3, 7);

      if (player.pos === 'GK') {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-9, 1.5 - armSwing, 4, 3);
        ctx.fillRect(5, 1.5 + armSwing, 4, 3);
      }

      // Head
      ctx.fillStyle = this.getSkinColor(player.skinTone);
      ctx.beginPath();
      ctx.arc(0, -10, 6, 0, Math.PI * 2);
      ctx.fill();

      // Face dot (eyes direction)
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      const faceDx = Math.cos(player.angle) * 2;
      const faceDy = Math.sin(player.angle) * 1;
      ctx.beginPath();
      ctx.arc(faceDx - 1.5, -10.5 + faceDy, 0.8, 0, Math.PI * 2);
      ctx.arc(faceDx + 1.5, -10.5 + faceDy, 0.8, 0, Math.PI * 2);
      ctx.fill();

      this.drawHair(ctx, player);

      // Number on jersey
      ctx.fillStyle = this.getContrastColor(player.pos === 'GK' ? this.getGKColor(team.primaryColor) : team.primaryColor);
      ctx.font = `900 6px ${this.fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.num, 0, -1);
    }

    ctx.restore();

    // Ball indicator when dribbling
    if (hasBall) {
      const bx = player.x + Math.cos(player.angle) * 12;
      const by = player.y + Math.sin(player.angle) * 12;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(this.time * 5);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * 2, Math.sin(a) * 2, 1.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // Name label with background
    ctx.font = `bold 7px ${this.fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const nameW = ctx.measureText(player.name).width;
    const labelX = player.x - nameW / 2 - 3;
    const labelY = player.y + 14;

    // Label bg
    ctx.fillStyle = isControlled ? 'rgba(255,215,0,0.7)' : 'rgba(0,0,0,0.55)';
    this.roundRect(ctx, labelX, labelY, nameW + 6, 10, 3);
    ctx.fill();

    ctx.fillStyle = isControlled ? '#000' : '#fff';
    ctx.fillText(player.name, player.x, labelY + 1);
    ctx.textBaseline = 'alphabetic';

    // Stamina bar for controlled player
    if (isControlled && player.stamina < 80) {
      const barW = 20;
      const barH = 2.5;
      const barX = player.x - barW / 2;
      const barY = player.y + 26;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      const staminaColor = player.stamina > 40 ? '#44ff44' : player.stamina > 20 ? '#ffaa00' : '#ff4444';
      ctx.fillStyle = staminaColor;
      ctx.fillRect(barX, barY, barW * (player.stamina / 100), barH);
    }
  }

  drawJersey(ctx, player, team, small) {
    const w = small ? 10 : 12;
    const h = small ? 10 : 14;
    const x = -w / 2;
    const y = small ? -6 : -h + 4;

    const primaryColor = player.pos === 'GK' ? this.getGKColor(team.primaryColor) : team.primaryColor;

    if (player.pos === 'GK') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x, y, w, h);
    } else {
      switch (team.kitPattern) {
        case 'stripes':
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
            ctx.fillRect(x + i * (w / 4), y, w / 4 + 0.5, h);
          }
          break;
        case 'stripes_thin':
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
            ctx.fillRect(x + i * (w / 6), y, w / 6 + 0.5, h);
          }
          break;
        case 'hoops':
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
            ctx.fillRect(x, y + i * (h / 5), w, h / 5 + 0.5);
          }
          break;
        case 'hoopSingle':
          ctx.fillStyle = team.primaryColor;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = team.secondaryColor;
          ctx.fillRect(x, y + h * 0.35, w, h * 0.3);
          break;
        case 'halves':
          ctx.fillStyle = team.primaryColor;
          ctx.fillRect(x, y, w / 2, h);
          ctx.fillStyle = team.secondaryColor;
          ctx.fillRect(x + w / 2, y, w / 2, h);
          break;
        case 'sash':
          ctx.fillStyle = team.primaryColor;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = team.secondaryColor;
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x + w * 0.4, y);
          ctx.lineTo(x + w, y + h); ctx.lineTo(x + w * 0.6, y + h);
          ctx.closePath(); ctx.fill();
          break;
        case 'stripe_center':
          ctx.fillStyle = team.primaryColor;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = team.tertiaryColor;
          ctx.fillRect(x + w * 0.33, y, w * 0.34, h);
          break;
        case 'sleeves':
          ctx.fillStyle = team.primaryColor;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = team.secondaryColor;
          ctx.fillRect(x, y, 3, h * 0.5);
          ctx.fillRect(x + w - 3, y, 3, h * 0.5);
          break;
        default:
          ctx.fillStyle = team.primaryColor;
          ctx.fillRect(x, y, w, h);
      }
    }

    // Collar
    ctx.fillStyle = team.tertiaryColor;
    ctx.fillRect(x + 2, y, w - 4, 2);
  }

  getGKColor(teamPrimary) {
    const r = parseInt(teamPrimary.slice(1, 3), 16);
    const g = parseInt(teamPrimary.slice(3, 5), 16);
    const b = parseInt(teamPrimary.slice(5, 7), 16);
    return (r + g + b) / 3 > 128 ? '#2D5016' : '#CCFF00';
  }

  // Two-letter team initials for the broadcast scoreboard chips
  shortInitials(shortName) {
    if (!shortName) return '';
    const tokens = shortName.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) return (tokens[0][0] + tokens[1][0]).toUpperCase();
    return shortName.slice(0, 3).toUpperCase();
  }

  drawHair(ctx, player) {
    ctx.fillStyle = player.hairColor;
    switch (player.hair) {
      case 'short':
        ctx.beginPath(); ctx.arc(0, -12, 6, Math.PI, 0); ctx.fill(); break;
      case 'medium':
        ctx.beginPath(); ctx.arc(0, -12, 7, Math.PI * 0.8, Math.PI * 0.2); ctx.fill();
        ctx.fillRect(-5, -15, 10, 4); break;
      case 'long':
        ctx.beginPath(); ctx.arc(0, -12, 7, Math.PI * 0.8, Math.PI * 0.2); ctx.fill();
        ctx.fillRect(-5, -15, 10, 4);
        ctx.fillRect(-6, -10, 2, 9); ctx.fillRect(4, -10, 2, 9); break;
      case 'buzz':
        ctx.beginPath(); ctx.arc(0, -11, 5.5, Math.PI, 0); ctx.fill(); break;
      case 'curly':
        ctx.beginPath(); ctx.arc(0, -12, 7.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = this.getSkinColor(player.skinTone);
        ctx.beginPath(); ctx.arc(0, -10, 5.5, 0, Math.PI * 2); ctx.fill(); break;
      case 'afro':
        ctx.beginPath(); ctx.arc(0, -13, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = this.getSkinColor(player.skinTone);
        ctx.beginPath(); ctx.arc(0, -10, 5.5, 0, Math.PI); ctx.fill(); break;
    }
  }

  drawHairSmall(ctx, player, hx, hy) {
    ctx.fillStyle = player.hairColor;
    ctx.beginPath(); ctx.arc(hx, hy - 2, 4, Math.PI, 0); ctx.fill();
  }

  getSkinColor(tone) { return tone || '#F5D6BA'; }

  getContrastColor(hex) {
    if (!hex || hex.length < 7) return '#FFFFFF';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#000000' : '#FFFFFF';
  }

  // === PARTICLES ===
  drawParticles() {
    const ctx = this.ctx;
    for (const p of engine.particles) {
      const alpha = Math.pow(p.life / p.maxLife, 0.5);
      ctx.globalAlpha = alpha;

      if (p.type === 'confetti') {
        // Confetti: rotating rectangles
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(this.time * 5 + p.x);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // === SCREEN-SPACE UI ===
  drawVignette() {
    if (engine.state !== 'playing' && engine.state !== 'goal_scored' && engine.state !== 'paused') return;
    const ctx = this.ctx;
    const w = this.width, h = this.height;
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawHUD() {
    const ctx = this.ctx;
    const w = this.width;
    if (engine.state === 'idle') return;

    // Broadcast lower-third scoreboard
    const sbW = Math.min(420, w * 0.52);
    const sbH = 44;
    const sbX = (w - sbW) / 2;
    const sbY = 8;
    const colorBarW = sbH; // square team blocks on each side
    const homeColor = engine.homeTeamData.primaryColor;
    const awayColor = engine.awayTeamData.primaryColor;

    // Drop shadow under whole bar
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(sbX + 2, sbY + 3, sbW, sbH);

    // Center info plate (dark)
    const plateGrad = ctx.createLinearGradient(0, sbY, 0, sbY + sbH);
    plateGrad.addColorStop(0, 'rgba(15,15,25,0.96)');
    plateGrad.addColorStop(1, 'rgba(5,5,15,0.98)');
    ctx.fillStyle = plateGrad;
    ctx.fillRect(sbX + colorBarW, sbY, sbW - colorBarW * 2, sbH);

    // Solid team color blocks on each end
    ctx.fillStyle = homeColor;
    ctx.fillRect(sbX, sbY, colorBarW, sbH);
    ctx.fillStyle = awayColor;
    ctx.fillRect(sbX + sbW - colorBarW, sbY, colorBarW, sbH);

    // Subtle inner highlight on color blocks (jersey gloss)
    const homeGloss = ctx.createLinearGradient(0, sbY, 0, sbY + sbH);
    homeGloss.addColorStop(0, 'rgba(255,255,255,0.25)');
    homeGloss.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = homeGloss;
    ctx.fillRect(sbX, sbY, colorBarW, sbH);
    ctx.fillRect(sbX + sbW - colorBarW, sbY, colorBarW, sbH);

    // Top accent stripe in team colors meeting at the score
    const stripeH = 3;
    const stripeMid = sbX + sbW / 2;
    ctx.fillStyle = homeColor;
    ctx.fillRect(sbX + colorBarW, sbY, stripeMid - sbX - colorBarW, stripeH);
    ctx.fillStyle = awayColor;
    ctx.fillRect(stripeMid, sbY, sbW - colorBarW - (stripeMid - sbX), stripeH);

    // Bottom dark line for crisp edge
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(sbX, sbY + sbH - 2, sbW, 2);

    // Team initials on color blocks (jersey style)
    const initialSize = Math.min(20, colorBarW * 0.48);
    ctx.font = `900 ${initialSize}px ${this.fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.getContrastColor(homeColor);
    ctx.fillText(this.shortInitials(engine.homeTeamData.shortName), sbX + colorBarW / 2, sbY + sbH / 2 + 2);
    ctx.fillStyle = this.getContrastColor(awayColor);
    ctx.fillText(this.shortInitials(engine.awayTeamData.shortName), sbX + sbW - colorBarW / 2, sbY + sbH / 2 + 2);

    // Team short names next to the blocks
    const nameSize = Math.min(15, sbW * 0.038);
    ctx.font = `bold ${nameSize}px ${this.fontDisplay}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(engine.homeTeamData.shortName, sbX + colorBarW + 8, sbY + sbH / 2 + 1);
    ctx.textAlign = 'right';
    ctx.fillText(engine.awayTeamData.shortName, sbX + sbW - colorBarW - 8, sbY + sbH / 2 + 1);

    // Big center score
    const scoreSize = Math.min(28, sbW * 0.075);
    ctx.font = `900 ${scoreSize}px ${this.fontDisplay}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`${engine.score.home}`, stripeMid - scoreSize * 0.65, sbY + sbH / 2 + 4);
    ctx.fillText(`${engine.score.away}`, stripeMid + scoreSize * 0.65, sbY + sbH / 2 + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(':', stripeMid, sbY + sbH / 2 + 2);

    ctx.textBaseline = 'alphabetic';

    // Clock bar below scoreboard
    const clockH = 16;
    const clockW = Math.min(150, sbW * 0.4);
    const clockX = (w - clockW) / 2;
    const clockY = sbY + sbH + 2;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(clockX, clockY, clockW, clockH);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(clockX, clockY, clockW, 1);

    // Pulsing red LIVE dot
    if (engine.state === 'playing' || engine.state === 'kickoff') {
      const pulse = 0.6 + Math.sin(this.time * 4) * 0.4;
      ctx.fillStyle = `rgba(255,40,40,${pulse})`;
      ctx.beginPath();
      ctx.arc(clockX + 10, clockY + clockH / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 9px ${this.fontDisplay}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('LIVE', clockX + 18, clockY + clockH / 2 + 1);
    }

    // Monospace clock
    ctx.fillStyle = '#fff';
    ctx.font = `bold 12px ${this.fontMono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(engine.getDisplayTime(), clockX + clockW / 2 + 8, clockY + clockH / 2 + 1);

    // Half indicator
    ctx.fillStyle = 'rgba(255,215,0,0.85)';
    ctx.font = `bold 9px ${this.fontDisplay}`;
    ctx.textAlign = 'right';
    ctx.fillText(engine.half === 1 ? '1ST' : '2ND', clockX + clockW - 8, clockY + clockH / 2 + 1);
    ctx.textBaseline = 'alphabetic';

    // Power meter
    if (engine.isChargingShot) {
      const pmW = Math.min(120, w * 0.15);
      const pmH = 10;
      const pmX = (w - pmW) / 2;
      const pmY = sbY + sbH + 10;

      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.roundRect(ctx, pmX - 3, pmY - 3, pmW + 6, pmH + 6, 5);
      ctx.fill();

      const grad = ctx.createLinearGradient(pmX, 0, pmX + pmW, 0);
      grad.addColorStop(0, '#00ff44');
      grad.addColorStop(0.5, '#ffcc00');
      grad.addColorStop(0.85, '#ff4400');
      grad.addColorStop(1, '#ff0000');
      ctx.fillStyle = grad;
      this.roundRect(ctx, pmX, pmY, pmW * engine.shootPower, pmH, 3);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, pmX, pmY, pmW, pmH, 3);
      ctx.stroke();

      // "POWER" label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px Arial';
      ctx.fillText('POWER', pmX + pmW / 2, pmY - 1);
    }

    // Controls hint
    if (!input.isMobile && engine.state === 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = `bold 9px ${this.fontDisplay}`;
      ctx.textAlign = 'left';
      ctx.fillText('WASD MOVE   •   SPACE PASS / SWITCH   •   X SHOOT   •   C TACKLE   •   SHIFT SPRINT', 10, this.height - 9);
    }
  }

  drawCommentary() {
    if (engine.commentaryTimer <= 0 || !engine.commentary) return;
    const ctx = this.ctx;
    const w = this.width;
    const alpha = Math.min(1, engine.commentaryTimer);

    // Broadcast lower-third style
    const text = engine.commentary;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.min(14, w * 0.022)}px ${this.fontDisplay}`;
    const textW = ctx.measureText(text).width;
    const padX = 18;
    const tagW = 70; // "LIVE COMMS" tag width
    const barH = 32;
    const totalW = Math.min(w * 0.85, textW + tagW + padX * 2);
    const barX = (w - totalW) / 2;
    const barY = this.height - 56;

    // Yellow accent bar on top
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(barX, barY, totalW, 3);
    // Main dark plate
    ctx.fillStyle = 'rgba(8,12,22,0.92)';
    ctx.fillRect(barX, barY + 3, totalW, barH);
    // Tag block on the left
    const tagColor = engine.homeTeamData ? engine.homeTeamData.primaryColor : '#444';
    ctx.fillStyle = tagColor;
    ctx.fillRect(barX, barY + 3, tagW, barH);
    // Tag gloss
    const gloss = ctx.createLinearGradient(0, barY, 0, barY + barH);
    gloss.addColorStop(0, 'rgba(255,255,255,0.22)');
    gloss.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(barX, barY + 3, tagW, barH);

    ctx.fillStyle = this.getContrastColor(tagColor);
    ctx.font = `900 10px ${this.fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIVE', barX + tagW / 2, barY + 3 + barH / 2 - 5);
    ctx.font = `bold 8px ${this.fontDisplay}`;
    ctx.fillText('COMMS', barX + tagW / 2, barY + 3 + barH / 2 + 7);

    // Commentary text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(14, w * 0.022)}px ${this.fontDisplay}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, barX + tagW + padX, barY + 3 + barH / 2 + 1);

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  drawMinimap() {
    if (engine.state !== 'playing' && engine.state !== 'paused') return;
    const ctx = this.ctx;
    const mmW = Math.min(140, this.width * 0.14);
    const mmH = mmW * (engine.pitch.height / engine.pitch.width);
    const mmX = this.width - mmW - 8;
    const mmY = this.height - mmH - 28;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.roundRect(ctx, mmX - 2, mmY - 2, mmW + 4, mmH + 4, 4);
    ctx.fill();

    // Pitch
    ctx.fillStyle = '#1a5c28';
    ctx.fillRect(mmX, mmY, mmW, mmH);

    // Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(mmX, mmY, mmW, mmH);
    ctx.beginPath();
    ctx.moveTo(mmX + mmW / 2, mmY);
    ctx.lineTo(mmX + mmW / 2, mmY + mmH);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mmX + mmW / 2, mmY + mmH / 2, mmW * 0.08, 0, Math.PI * 2);
    ctx.stroke();

    const p = engine.pitch;
    const scaleX = mmW / p.width;
    const scaleY = mmH / p.height;

    // Home players
    for (const pl of engine.homePlayers) {
      const px = mmX + (pl.x - p.x) * scaleX;
      const py = mmY + (pl.y - p.y) * scaleY;
      ctx.fillStyle = pl === engine.controlledPlayer ? '#FFD700' : engine.homeTeamData.primaryColor;
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Away players
    for (const pl of engine.awayPlayers) {
      const px = mmX + (pl.x - p.x) * scaleX;
      const py = mmY + (pl.y - p.y) * scaleY;
      ctx.fillStyle = engine.awayTeamData.primaryColor;
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Ball
    const bx = mmX + (engine.ball.x - p.x) * scaleX;
    const by = mmY + (engine.ball.y - p.y) * scaleY;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  drawTouchControls() {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;

    if (input.touchActive) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(input.joystickCenter.x / dpr, input.joystickCenter.y / dpr,
              input.joystickRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      const dx = input.joystickPos.x - input.joystickCenter.x;
      const dy = input.joystickPos.y - input.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = input.joystickRadius;
      let knobX = input.joystickCenter.x, knobY = input.joystickCenter.y;
      if (dist > 0) {
        const cd = Math.min(dist, maxDist);
        knobX += (dx / dist) * cd; knobY += (dy / dist) * cd;
      }
      ctx.beginPath();
      ctx.arc(knobX / dpr, knobY / dpr, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    const zones = input.getButtonZones(this.canvas.width, this.canvas.height);
    for (const [key, btn] of Object.entries(zones)) {
      const active = input.touchButtons[key];
      ctx.fillStyle = active ? btn.color + 'AA' : 'rgba(255,255,255,0.12)';
      ctx.strokeStyle = btn.color + '88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(btn.x / dpr, btn.y / dpr, btn.r / dpr, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = `900 11px ${this.fontDisplay}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x / dpr, btn.y / dpr);
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawStateOverlay() {
    const ctx = this.ctx;
    const w = this.width, h = this.height;

    if (engine.state === 'goal_scored') {
      // Cinematic black bars
      const barH = h * 0.09;
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.fillRect(0, 0, w, barH);
      ctx.fillRect(0, h - barH, w, barH);

      // Determine the scoring team's colors
      const scoringTeam = engine.lastGoalTeam === 'home' ? engine.homeTeamData : engine.awayTeamData;
      const teamColor = (scoringTeam && scoringTeam.primaryColor) || '#FFD700';
      const teamSecondary = (scoringTeam && scoringTeam.secondaryColor) || '#FFFFFF';
      // White on white looks bad — fall back to gold for the glow
      const glowColor = teamColor.toUpperCase() === '#FFFFFF' ? '#FFD700' : teamColor;

      // Sweeping color band behind the GOAL text
      const bandY = h * 0.32;
      const bandH = h * 0.22;
      const bandGrad = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
      bandGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bandGrad.addColorStop(0.5, teamColor + 'CC');
      bandGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, bandY, w, bandH);

      // Diagonal speed lines from the band
      ctx.strokeStyle = teamSecondary + '55';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const off = (this.time * 200 + i * 90) % (w + 200) - 100;
        ctx.beginPath();
        ctx.moveTo(off, bandY);
        ctx.lineTo(off + 60, bandY + bandH);
        ctx.stroke();
      }

      // GOAL text with team-colored glow + pulsing scale
      const goalSize = Math.min(w * 0.16, 130);
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 35;
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${goalSize}px ${this.fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const pulse = 1 + Math.sin(this.time * 9) * 0.04;
      ctx.translate(w / 2, h * 0.42);
      ctx.scale(pulse, pulse);
      ctx.fillText('GOAL!', 0, 0);
      // Outline pass for definition
      ctx.lineWidth = 4;
      ctx.strokeStyle = glowColor;
      ctx.shadowBlur = 0;
      ctx.strokeText('GOAL!', 0, 0);
      ctx.restore();
      ctx.textBaseline = 'alphabetic';

      if (engine.goalScorer) {
        // Scorer plate (lower third)
        const plateW = Math.min(w * 0.6, 520);
        const plateH = 90;
        const plateX = (w - plateW) / 2;
        const plateY = h * 0.56;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(plateX, plateY, plateW, plateH);
        // Team color side bar
        ctx.fillStyle = teamColor;
        ctx.fillRect(plateX, plateY, 8, plateH);
        // Top accent
        ctx.fillStyle = teamSecondary;
        ctx.fillRect(plateX + 8, plateY, plateW - 8, 2);

        // SCORER label
        ctx.fillStyle = teamColor;
        ctx.font = `900 11px ${this.fontDisplay}`;
        ctx.textAlign = 'left';
        ctx.fillText('SCORER', plateX + 20, plateY + 20);

        // Scorer name
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${Math.min(w * 0.04, 28)}px ${this.fontDisplay}`;
        ctx.fillText(engine.goalScorer.name.toUpperCase(), plateX + 20, plateY + 48);

        // Team name + score on right
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = `bold ${Math.min(w * 0.02, 14)}px ${this.fontDisplay}`;
        ctx.fillText((engine.goalScorer.teamData.name || '').toUpperCase(), plateX + 20, plateY + 70);

        ctx.fillStyle = '#fff';
        ctx.font = `900 ${Math.min(w * 0.06, 42)}px ${this.fontMono}`;
        ctx.textAlign = 'right';
        ctx.fillText(`${engine.score.home}-${engine.score.away}`, plateX + plateW - 20, plateY + 60);

        // Time
        ctx.fillStyle = teamColor;
        ctx.font = `bold 11px ${this.fontDisplay}`;
        ctx.fillText(engine.getDisplayTime() + "'", plateX + plateW - 20, plateY + 78);
      }
    }

    if (engine.state === 'halftime') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${Math.min(w * 0.07, 52)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('HALF TIME', w / 2, h * 0.38);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w * 0.08, 56)}px Arial`;
      ctx.fillText(`${engine.score.home} - ${engine.score.away}`, w / 2, h * 0.52);
      ctx.font = `${Math.min(w * 0.025, 18)}px Arial`;
      ctx.fillStyle = '#888';
      ctx.fillText(`${engine.homeTeamData.name}  vs  ${engine.awayTeamData.name}`, w / 2, h * 0.62);

      // Goal events
      if (engine.goalEvents.length > 0) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        engine.goalEvents.forEach((ge, i) => {
          ctx.fillText(`${ge.time} - ${ge.scorer} (${ge.team})`, w / 2, h * 0.68 + i * 18);
        });
      }
    }

    if (engine.state === 'fulltime') {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${Math.min(w * 0.07, 52)}px Arial`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20;
      ctx.fillText('FULL TIME', w / 2, h * 0.25);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w * 0.12, 80)}px Arial`;
      ctx.fillText(`${engine.score.home} - ${engine.score.away}`, w / 2, h * 0.42);

      ctx.font = `bold ${Math.min(w * 0.025, 20)}px Arial`;
      ctx.fillStyle = '#aaa';
      ctx.fillText(`${engine.homeTeamData.name}  vs  ${engine.awayTeamData.name}`, w / 2, h * 0.5);

      let winner = '';
      if (engine.score.home > engine.score.away) winner = engine.homeTeamData.name + ' WINS!';
      else if (engine.score.away > engine.score.home) winner = engine.awayTeamData.name + ' WINS!';
      else winner = 'DRAW!';

      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${Math.min(w * 0.05, 38)}px Arial`;
      ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 15;
      ctx.fillText(winner, w / 2, h * 0.62);
      ctx.shadowBlur = 0;

      // Goal scorers
      if (engine.goalEvents.length > 0) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#999';
        ctx.fillText('Goal Scorers:', w / 2, h * 0.7);
        engine.goalEvents.forEach((ge, i) => {
          ctx.fillStyle = '#bbb';
          ctx.fillText(`${ge.time}  ${ge.scorer} (${ge.team})`, w / 2, h * 0.74 + i * 17);
        });
      }

      const pulse = 0.5 + Math.sin(this.time * 3) * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + pulse * 0.5})`;
      ctx.font = `bold ${Math.min(w * 0.022, 16)}px Arial`;
      ctx.fillText('Press SPACE or tap to play again', w / 2, h * 0.92);
    }

    if (engine.state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w * 0.08, 56)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', w / 2, h * 0.45);
      ctx.font = `${Math.min(w * 0.022, 16)}px Arial`;
      ctx.fillStyle = '#888';
      ctx.fillText('Press P or ESC to resume', w / 2, h * 0.54);
    }

    if (engine.state === 'kickoff') {
      // Match intro banner
      const bannerH = h * 0.15;
      const bannerY = h * 0.42;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, bannerY, w, bannerH);

      // Team color stripes
      ctx.fillStyle = engine.homeTeamData.primaryColor + '88';
      ctx.fillRect(0, bannerY, w * 0.5, bannerH);
      ctx.fillStyle = engine.awayTeamData.primaryColor + '88';
      ctx.fillRect(w * 0.5, bannerY, w * 0.5, bannerH);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w * 0.04, 30)}px Arial`;
      ctx.textAlign = 'center';
      const label = engine.half === 1 && engine.matchTime < 1 ? 'KICK OFF' : 'SECOND HALF';
      ctx.fillText(label, w / 2, bannerY + bannerH * 0.42);

      ctx.font = `${Math.min(w * 0.022, 16)}px Arial`;
      ctx.fillStyle = '#ddd';
      ctx.fillText(`${engine.homeTeamData.shortName}  vs  ${engine.awayTeamData.shortName}`, w / 2, bannerY + bannerH * 0.72);
    }
  }

  // === HELPERS ===
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  lightenColor(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `rgb(${r},${g},${b})`;
  }

  darkenColor(hex, amount) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `rgb(${r},${g},${b})`;
  }
}
