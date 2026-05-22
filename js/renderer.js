// Brennan's Soccer Showdown - Renderer
// Canvas 2D rendering for all game visuals

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

    // Pre-render cache
    this.pitchCache = null;
    this.stadiumCache = null;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);

    this.width = w;
    this.height = h;

    // Calculate scale to fit pitch
    const totalW = engine.pitch.totalWidth;
    const totalH = engine.pitch.totalHeight;
    const scaleX = w / totalW;
    const scaleY = h / totalH;
    this.scale = Math.min(scaleX, scaleY);
    this.offsetX = (w - totalW * this.scale) / 2;
    this.offsetY = (h - totalH * this.scale) / 2;

    // Invalidate cache
    this.pitchCache = null;
    this.stadiumCache = null;
  }

  setStadium(stadiumData) {
    this.stadiumData = stadiumData;
    this.pitchCache = null;
    this.stadiumCache = null;
  }

  // Transform game coords to screen coords
  toScreen(gx, gy) {
    return {
      x: this.offsetX + gx * this.scale,
      y: this.offsetY + gy * this.scale,
    };
  }

  render() {
    this.frameCount++;
    const ctx = this.ctx;
    ctx.save();

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw in game coordinates
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Stadium background
    this.drawStadium();

    // Pitch
    this.drawPitch();

    // Shadows (draw before players/ball)
    this.drawShadows();

    // Players (sorted by Y for depth)
    this.drawAllPlayers();

    // Ball
    this.drawBall();

    // Particles
    this.drawParticles();

    // Goals overlay (net)
    this.drawGoalNets();

    ctx.restore();

    // HUD (screen space)
    this.drawHUD();

    // Mobile controls
    if (input.isMobile && engine.state === 'playing') {
      this.drawTouchControls();
    }

    // State overlays
    this.drawStateOverlay();
  }

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

    // Stadium stands - top
    this.drawStands(ctx, -20, -totalH * 0.15, totalW + 40, p.y + totalH * 0.15, s, 'top');

    // Stadium stands - bottom
    this.drawStands(ctx, -20, p.y + p.height, totalW + 40, totalH * 0.4, s, 'bottom');

    // Stadium stands - left
    this.drawStands(ctx, -30, p.y - 10, p.x + 30, p.height + 20, s, 'left');

    // Stadium stands - right
    this.drawStands(ctx, p.x + p.width, p.y - 10, p.x + 30, p.height + 20, s, 'right');

    // Ad boards
    this.drawAdBoards(ctx, p, s);

    // Floodlights
    if (s.floodlights) {
      this.drawFloodlights(ctx, p, totalW, totalH);
    }

    // Sun effect
    if (s.weatherEffect === 'sun') {
      const sunX = totalW * 0.8;
      const sunY = -totalH * 0.1;
      const grad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 200);
      grad.addColorStop(0, 'rgba(255,255,200,0.3)');
      grad.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sunX - 200, sunY - 200, 400, 400);
    }
  }

  drawStands(ctx, x, y, w, h, stadium, side) {
    // Stand structure
    ctx.fillStyle = stadium.standColor;
    ctx.fillRect(x, y, w, h);

    // Accent stripe
    ctx.fillStyle = stadium.standAccent;
    if (side === 'top') {
      ctx.fillRect(x, y + h - 8, w, 8);
    } else if (side === 'bottom') {
      ctx.fillRect(x, y, w, 8);
    }

    // Crowd (dots)
    const density = stadium.crowdDensity;
    const spacing = 8;
    const colors = [stadium.crowdColor1, stadium.crowdColor2, stadium.crowdColor3];
    const time = this.frameCount * 0.03;

    for (let cx = x + 4; cx < x + w; cx += spacing) {
      for (let cy = y + 4; cy < y + h - 2; cy += spacing) {
        if (Math.random() > density) continue;
        const hash = (cx * 31 + cy * 17) & 0xFFFF;
        const colorIdx = hash % colors.length;

        // Animate crowd slightly
        const wave = Math.sin(time + cx * 0.05 + cy * 0.03) * 1.5;

        ctx.fillStyle = colors[colorIdx];
        ctx.fillRect(cx, cy + wave, 4, 5);

        // Head
        ctx.fillStyle = '#F5D6BA';
        ctx.fillRect(cx + 0.5, cy + wave - 2.5, 3, 3);
      }
    }

    // Roof
    if (stadium.hasRoof && (side === 'top' || side === 'bottom')) {
      ctx.fillStyle = stadium.roofColor;
      if (side === 'top') {
        ctx.fillRect(x, y - 5, w, 8);
      }
    }
  }

  drawAdBoards(ctx, p, stadium) {
    const boardH = 6;
    const colors = stadium.adBoardColors;
    const segW = 50;

    // Top ad board
    let y = p.y - boardH - 2;
    for (let x = p.x; x < p.x + p.width; x += segW) {
      ctx.fillStyle = colors[Math.floor(x / segW) % colors.length];
      ctx.fillRect(x, y, segW - 1, boardH);
    }

    // Bottom ad board
    y = p.y + p.height + 2;
    for (let x = p.x; x < p.x + p.width; x += segW) {
      ctx.fillStyle = colors[Math.floor((x + 25) / segW) % colors.length];
      ctx.fillRect(x, y, segW - 1, boardH);
    }
  }

  drawFloodlights(ctx, p, totalW, totalH) {
    const positions = [
      { x: 20, y: -totalH * 0.1 },
      { x: totalW - 20, y: -totalH * 0.1 },
    ];

    for (const fl of positions) {
      // Pole
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fl.x, fl.y);
      ctx.lineTo(fl.x, fl.y + totalH * 0.25);
      ctx.stroke();

      // Light fixture
      ctx.fillStyle = '#DDD';
      ctx.fillRect(fl.x - 12, fl.y - 5, 24, 10);

      // Light glow
      const grad = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y + 100, 300);
      grad.addColorStop(0, 'rgba(255,255,220,0.15)');
      grad.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(fl.x - 300, fl.y, 600, 400);
    }
  }

  drawPitch() {
    const ctx = this.ctx;
    const p = engine.pitch;
    const s = this.stadiumData || STADIUMS[0];

    // Grass with stripe pattern
    const stripeW = p.width / 14;
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = i % 2 === 0 ? s.grassColor1 : s.grassColor2;
      ctx.fillRect(p.x + i * stripeW, p.y, stripeW, p.height);
    }

    // Pitch markings
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(p.x, p.y, p.width, p.height);

    // Halfway line
    ctx.beginPath();
    ctx.moveTo(p.centerX, p.y);
    ctx.lineTo(p.centerX, p.y + p.height);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(p.centerX, p.centerY, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.centerX, p.centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Penalty areas
    const penW = 120;
    const penH = 260;
    const penTop = p.centerY - penH / 2;

    // Left penalty area
    ctx.strokeRect(p.x, penTop, penW, penH);
    // Left goal area
    ctx.strokeRect(p.x, p.centerY - 80, 50, 160);
    // Left penalty spot
    ctx.beginPath();
    ctx.arc(p.x + 90, p.centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Right penalty area
    ctx.strokeRect(p.x + p.width - penW, penTop, penW, penH);
    // Right goal area
    ctx.strokeRect(p.x + p.width - 50, p.centerY - 80, 50, 160);
    // Right penalty spot
    ctx.beginPath();
    ctx.arc(p.x + p.width - 90, p.centerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Corner arcs
    const corners = [
      [p.x, p.y], [p.x + p.width, p.y],
      [p.x, p.y + p.height], [p.x + p.width, p.y + p.height],
    ];
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      const startAngle = cx === p.x ? (cy === p.y ? 0 : -Math.PI / 2) : (cy === p.y ? Math.PI / 2 : Math.PI);
      ctx.arc(cx, cy, 10, startAngle, startAngle + Math.PI / 2);
      ctx.stroke();
    }

    // Goal structures
    this.drawGoalStructure(ctx, p.goalLineLeft, p.goalTop, p.goalBottom, 'left');
    this.drawGoalStructure(ctx, p.goalLineRight, p.goalTop, p.goalBottom, 'right');
  }

  drawGoalStructure(ctx, x, top, bottom, side) {
    const depth = side === 'left' ? -20 : 20;
    const postW = 4;

    // Back of net
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(
      side === 'left' ? x + depth : x,
      top,
      Math.abs(depth),
      bottom - top
    );

    // Net lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    const netSpacing = 8;

    // Vertical net lines
    for (let ny = top; ny <= bottom; ny += netSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, ny);
      ctx.lineTo(x + depth, ny);
      ctx.stroke();
    }
    // Horizontal net lines
    for (let nx = 0; nx <= Math.abs(depth); nx += netSpacing) {
      const actualX = side === 'left' ? x - nx : x + nx;
      ctx.beginPath();
      ctx.moveTo(actualX, top);
      ctx.lineTo(actualX, bottom);
      ctx.stroke();
    }

    // Posts
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 3;

    // Left/Right post (top)
    ctx.fillRect(x - postW / 2, top - postW / 2, postW, postW);
    // Left/Right post (bottom)
    ctx.fillRect(x - postW / 2, bottom - postW / 2, postW, postW);

    // Post lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();

    // Crossbar
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + depth, top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x + depth, bottom);
    ctx.stroke();

    // Top bar
    ctx.beginPath();
    ctx.moveTo(x + depth, top);
    ctx.lineTo(x + depth, bottom);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  drawGoalNets() {
    // Drawn as overlay for depth effect - already handled in structure
  }

  drawShadows() {
    const ctx = this.ctx;
    const allPlayers = [...engine.homePlayers, ...engine.awayPlayers];

    ctx.fillStyle = 'rgba(0,0,0,0.2)';

    for (const p of allPlayers) {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 10, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball shadow
    if (!engine.ball.owner) {
      const shadowScale = 1 + engine.ball.z * 0.02;
      ctx.beginPath();
      ctx.ellipse(engine.ball.x, engine.ball.y + 10, 5 * shadowScale, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawAllPlayers() {
    const allPlayers = [...engine.homePlayers, ...engine.awayPlayers];

    // Sort by Y for depth ordering
    allPlayers.sort((a, b) => a.y - b.y);

    for (const p of allPlayers) {
      this.drawPlayer(p);
    }
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const team = player.teamData;
    const isControlled = player === engine.controlledPlayer;
    const hasBall = engine.ball.owner === player;
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    const runPhase = Math.sin(player.runFrame);

    ctx.save();
    ctx.translate(player.x, player.y);

    // Selection indicator
    if (isControlled) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 10, 14, 7, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Arrow pointing down
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(-5, -22);
      ctx.lineTo(5, -22);
      ctx.closePath();
      ctx.fill();
    }

    // Legs
    const legSpread = speed > 0.5 ? runPhase * 4 : 0;
    ctx.fillStyle = team.shortsColor === '#FFFFFF' ? '#F5F5F5' : team.shortsColor;

    // Left leg
    ctx.fillRect(-4, 2 + legSpread, 3, 8);
    // Right leg
    ctx.fillRect(1, 2 - legSpread, 3, 8);

    // Socks
    ctx.fillStyle = team.socksColor;
    ctx.fillRect(-4, 7 + legSpread, 3, 4);
    ctx.fillRect(1, 7 - legSpread, 3, 4);

    // Boots
    ctx.fillStyle = '#111';
    ctx.fillRect(-4, 10 + legSpread, 4, 2);
    ctx.fillRect(1, 10 - legSpread, 4, 2);

    // Body / Jersey
    this.drawJersey(ctx, player, team);

    // Arms
    const armSwing = speed > 0.5 ? runPhase * 2 : 0;
    ctx.fillStyle = this.getSkinColor(player.skinTone);
    ctx.fillRect(-8, -4 - armSwing, 3, 7);
    ctx.fillRect(5, -4 + armSwing, 3, 7);

    // Goalkeeper gloves
    if (player.pos === 'GK') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-9, 1 - armSwing, 4, 3);
      ctx.fillRect(5, 1 + armSwing, 4, 3);
    }

    // Head
    ctx.fillStyle = this.getSkinColor(player.skinTone);
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    this.drawHair(ctx, player);

    // Number on jersey
    ctx.fillStyle = this.getContrastColor(team.primaryColor);
    ctx.font = 'bold 6px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.num, 0, 1);

    ctx.restore();

    // Name label
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const nameWidth = ctx.measureText(player.name).width;
    ctx.fillRect(player.x - nameWidth / 2 - 2, player.y + 15, nameWidth + 4, 9);
    ctx.fillStyle = '#fff';
    ctx.font = '7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x, player.y + 22);
  }

  drawJersey(ctx, player, team) {
    const w = 12;
    const h = 14;
    const x = -w / 2;
    const y = -h + 4;

    switch (team.kitPattern) {
      case 'stripes':
        // Vertical stripes
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
          ctx.fillRect(x + i * (w / 4), y, w / 4, h);
        }
        break;

      case 'stripes_thin':
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
          ctx.fillRect(x + i * (w / 6), y, w / 6, h);
        }
        break;

      case 'hoops':
        // Horizontal hoops
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
          ctx.fillRect(x, y + i * (h / 5), w, h / 5);
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
        ctx.moveTo(x, y);
        ctx.lineTo(x + w * 0.4, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w * 0.6, y + h);
        ctx.closePath();
        ctx.fill();
        break;

      case 'stripe_center':
        ctx.fillStyle = team.primaryColor;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = team.tertiaryColor;
        ctx.fillRect(x + w * 0.35, y, w * 0.3, h);
        break;

      case 'sleeves':
        ctx.fillStyle = team.primaryColor;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = team.secondaryColor;
        ctx.fillRect(x, y, 3, h * 0.5);
        ctx.fillRect(x + w - 3, y, 3, h * 0.5);
        break;

      default: // solid
        ctx.fillStyle = player.pos === 'GK' ? this.getGKColor(team.primaryColor) : team.primaryColor;
        ctx.fillRect(x, y, w, h);
        break;
    }

    // GK has different jersey
    if (player.pos === 'GK') {
      ctx.fillStyle = this.getGKColor(team.primaryColor);
      ctx.fillRect(x, y, w, h);
    }

    // Jersey collar
    ctx.fillStyle = team.tertiaryColor;
    ctx.fillRect(x + 2, y, w - 4, 2);
  }

  getGKColor(teamPrimary) {
    // Pick a GK jersey color that contrasts with team
    const r = parseInt(teamPrimary.slice(1, 3), 16);
    const g = parseInt(teamPrimary.slice(3, 5), 16);
    const b = parseInt(teamPrimary.slice(5, 7), 16);
    const brightness = (r + g + b) / 3;

    if (brightness > 128) {
      return '#2D5016'; // Dark green
    } else {
      return '#CCFF00'; // Bright yellow-green
    }
  }

  drawHair(ctx, player) {
    ctx.fillStyle = player.hairColor;
    switch (player.hair) {
      case 'short':
        ctx.beginPath();
        ctx.arc(0, -12, 6, Math.PI, 0);
        ctx.fill();
        break;
      case 'medium':
        ctx.beginPath();
        ctx.arc(0, -12, 7, Math.PI * 0.8, Math.PI * 0.2);
        ctx.fill();
        ctx.fillRect(-5, -14, 10, 4);
        break;
      case 'long':
        ctx.beginPath();
        ctx.arc(0, -12, 7, Math.PI * 0.8, Math.PI * 0.2);
        ctx.fill();
        ctx.fillRect(-5, -14, 10, 4);
        // Hair flowing down
        ctx.fillRect(-5, -10, 2, 8);
        ctx.fillRect(3, -10, 2, 8);
        break;
      case 'buzz':
        ctx.beginPath();
        ctx.arc(0, -11, 5.5, Math.PI, 0);
        ctx.fill();
        break;
      case 'curly':
        ctx.beginPath();
        ctx.arc(0, -12, 7, 0, Math.PI * 2);
        ctx.fill();
        // Re-draw face
        ctx.fillStyle = this.getSkinColor(player.skinTone);
        ctx.beginPath();
        ctx.arc(0, -10, 5.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'afro':
        ctx.beginPath();
        ctx.arc(0, -13, 9, 0, Math.PI * 2);
        ctx.fill();
        // Re-draw face
        ctx.fillStyle = this.getSkinColor(player.skinTone);
        ctx.beginPath();
        ctx.arc(0, -10, 5.5, 0, Math.PI);
        ctx.fill();
        break;
    }
  }

  getSkinColor(tone) {
    return tone || '#F5D6BA';
  }

  getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }

  drawBall() {
    const ctx = this.ctx;
    const ball = engine.ball;

    if (ball.owner) return; // Ball drawn with player

    const z = Math.max(0, ball.z);
    const drawY = ball.y - z;
    const size = 5 + z * 0.1;

    ctx.save();
    ctx.translate(ball.x, drawY);
    ctx.rotate(ball.rotation);

    // Ball body
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Pentagon pattern
    ctx.fillStyle = '#333';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * size * 0.5;
      const py = Math.sin(angle) * size * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of engine.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawHUD() {
    const ctx = this.ctx;
    const w = this.width;

    if (engine.state === 'idle') return;

    // Scoreboard background
    const sbW = 320;
    const sbH = 44;
    const sbX = (w - sbW) / 2;
    const sbY = 8;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.roundRect(ctx, sbX, sbY, sbW, sbH, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, sbX, sbY, sbW, sbH, 8);
    ctx.stroke();

    // Home team
    ctx.fillStyle = engine.homeTeamData.primaryColor;
    ctx.fillRect(sbX + 8, sbY + 8, 28, 28);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sbX + 8, sbY + 8, 28, 28);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(engine.homeTeamData.shortName, sbX + 42, sbY + 27);

    // Score
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${engine.score.home}  -  ${engine.score.away}`, sbX + sbW / 2, sbY + 31);

    // Away team
    ctx.fillStyle = engine.awayTeamData.primaryColor;
    ctx.fillRect(sbX + sbW - 36, sbY + 8, 28, 28);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(sbX + sbW - 36, sbY + 8, 28, 28);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(engine.awayTeamData.shortName, sbX + sbW - 42, sbY + 27);

    // Time
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.fillText(engine.getDisplayTime() + (engine.half === 1 ? ' 1st' : ' 2nd'), sbX + sbW / 2, sbY + 14);

    // Power meter (when charging shot)
    if (engine.isChargingShot) {
      const pmW = 100;
      const pmH = 8;
      const pmX = (w - pmW) / 2;
      const pmY = sbY + sbH + 8;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(pmX - 2, pmY - 2, pmW + 4, pmH + 4);

      // Power gradient
      const grad = ctx.createLinearGradient(pmX, 0, pmX + pmW, 0);
      grad.addColorStop(0, '#00ff00');
      grad.addColorStop(0.5, '#ffff00');
      grad.addColorStop(1, '#ff0000');
      ctx.fillStyle = grad;
      ctx.fillRect(pmX, pmY, pmW * engine.shootPower, pmH);

      ctx.strokeStyle = '#fff';
      ctx.strokeRect(pmX, pmY, pmW, pmH);
    }

    // Controls hint (desktop)
    if (!input.isMobile && engine.state === 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('WASD/Arrows: Move | SPACE: Pass/Switch | X: Shoot | C: Tackle | SHIFT: Sprint | P: Pause', 10, this.height - 10);
    }
  }

  drawTouchControls() {
    const ctx = this.ctx;

    // Virtual joystick
    if (input.touchActive) {
      // Outer ring
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const jc = this.toScreen(0, 0); // We need screen coords
      // Convert joystick positions from canvas pixel space
      ctx.arc(input.joystickCenter.x / (window.devicePixelRatio || 1),
              input.joystickCenter.y / (window.devicePixelRatio || 1),
              input.joystickRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner knob
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      const dx = input.joystickPos.x - input.joystickCenter.x;
      const dy = input.joystickPos.y - input.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = input.joystickRadius;
      let knobX = input.joystickCenter.x;
      let knobY = input.joystickCenter.y;
      if (dist > 0) {
        const clampDist = Math.min(dist, maxDist);
        knobX = input.joystickCenter.x + (dx / dist) * clampDist;
        knobY = input.joystickCenter.y + (dy / dist) * clampDist;
      }
      ctx.arc(knobX / (window.devicePixelRatio || 1),
              knobY / (window.devicePixelRatio || 1),
              20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Action buttons
    const zones = input.getButtonZones(this.canvas.width, this.canvas.height);
    const dpr = window.devicePixelRatio || 1;
    for (const [key, btn] of Object.entries(zones)) {
      const active = input.touchButtons[key];
      ctx.fillStyle = active ? btn.color : 'rgba(255,255,255,0.15)';
      ctx.strokeStyle = btn.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(btn.x / dpr, btn.y / dpr, btn.r / dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${11}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x / dpr, btn.y / dpr);
    }
    ctx.textBaseline = 'alphabetic';
  }

  drawStateOverlay() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (engine.state === 'goal_scored') {
      // GOAL!! overlay
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, h * 0.3, w, h * 0.4);

      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${Math.min(w * 0.12, 80)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('GOAL!!', w / 2, h * 0.48);

      if (engine.goalScorer) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.min(w * 0.04, 28)}px Arial`;
        ctx.fillText(engine.goalScorer.name, w / 2, h * 0.56);
        ctx.font = `${Math.min(w * 0.025, 18)}px Arial`;
        ctx.fillStyle = '#ccc';
        ctx.fillText(engine.goalScorer.teamData.name, w / 2, h * 0.62);
      }
    }

    if (engine.state === 'halftime') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w * 0.08, 56)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('HALF TIME', w / 2, h * 0.4);

      ctx.font = `bold ${Math.min(w * 0.06, 42)}px Arial`;
      ctx.fillText(`${engine.score.home} - ${engine.score.away}`, w / 2, h * 0.55);

      ctx.font = `${Math.min(w * 0.03, 20)}px Arial`;
      ctx.fillStyle = '#aaa';
      ctx.fillText(`${engine.homeTeamData.name}  vs  ${engine.awayTeamData.name}`, w / 2, h * 0.65);
    }

    if (engine.state === 'fulltime') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${Math.min(w * 0.08, 56)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('FULL TIME', w / 2, h * 0.3);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w * 0.1, 72)}px Arial`;
      ctx.fillText(`${engine.score.home} - ${engine.score.away}`, w / 2, h * 0.45);

      // Team names
      ctx.font = `bold ${Math.min(w * 0.03, 24)}px Arial`;
      ctx.fillText(`${engine.homeTeamData.name}  vs  ${engine.awayTeamData.name}`, w / 2, h * 0.55);

      // Winner announcement
      let winner = '';
      if (engine.score.home > engine.score.away) winner = engine.homeTeamData.name + ' WINS!';
      else if (engine.score.away > engine.score.home) winner = engine.awayTeamData.name + ' WINS!';
      else winner = 'DRAW!';

      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${Math.min(w * 0.05, 36)}px Arial`;
      ctx.fillText(winner, w / 2, h * 0.68);

      // Play again prompt
      ctx.fillStyle = '#aaa';
      ctx.font = `${Math.min(w * 0.025, 18)}px Arial`;
      ctx.fillText('Press SPACE or tap to play again', w / 2, h * 0.82);
    }

    if (engine.state === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w * 0.08, 56)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', w / 2, h * 0.45);

      ctx.font = `${Math.min(w * 0.025, 18)}px Arial`;
      ctx.fillStyle = '#aaa';
      ctx.fillText('Press P or ESC to resume', w / 2, h * 0.55);
    }

    if (engine.state === 'kickoff') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, h * 0.4, w, h * 0.2);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(w * 0.05, 36)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(engine.half === 1 ? 'KICK OFF!' : 'SECOND HALF!', w / 2, h * 0.53);
    }
  }

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
}
