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
    // Concrete base (tiered)
    const baseGrad = ctx.createLinearGradient(0, y, 0, y + h);
    baseGrad.addColorStop(0, this.darkenColor(stadium.standColor, 20));
    baseGrad.addColorStop(1, this.darkenColor(stadium.standAccent, 35));
    ctx.fillStyle = baseGrad;
    ctx.fillRect(x, y, w, h);

    // Define tiered seating - 3 tiers separated by walkway bands
    const tiers = 3;
    const tierGap = 4; // walkway between tiers
    const usableH = h - tierGap * (tiers - 1);
    const tierH = usableH / tiers;
    const colors = [stadium.crowdColor1, stadium.crowdColor2, stadium.crowdColor3];
    const skinColors = ['#F5D6BA', '#E8C99A', '#C4A882', '#8B6914', '#6B4226'];
    const isGoal = engine.state === 'goal_scored';
    const time = this.time;

    // Desaturate the bright team colors a bit so the distant crowd reads as
    // a sea of people, not as a flashing pixel field.
    const dimmedColors = colors.map(c => this.mixColor(c, '#3a3a3a', 0.45));

    // Tier-by-tier rendering
    for (let t = 0; t < tiers; t++) {
      const ty = y + t * (tierH + tierGap);
      // Subtle tier highlight on top edge
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x, ty, w, 1);

      // Seat rows inside this tier
      const rowH = 5;
      const rowSpacing = 2;
      for (let ry = ty + 2; ry < ty + tierH - 1; ry += rowH + rowSpacing) {
        // Row separator (concrete step)
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x, ry + rowH, w, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, ry + rowH + 1, w, 1);

        // Wave / pulse
        const waveSpeed = isGoal ? 3 : 0.6;
        const waveAmp = isGoal ? 3 : 0;

        // Sparser seating: every ~8px and only ~density fraction filled
        const seatStep = 8;
        for (let sx = x + 3; sx < x + w; sx += seatStep) {
          const hash = (sx * 31 + ry * 17) & 0xFFFF;
          if ((hash % 100) / 100 > stadium.crowdDensity * 0.7) continue;

          const wave = Math.sin(time * waveSpeed + sx * 0.04 + t * 0.6) * waveAmp;
          const jump = isGoal ? Math.max(0, Math.sin(time * 8 + sx * 0.08)) * 2 : 0;

          // Single 3x3 dot per "person" — head merged into torso visually
          ctx.fillStyle = dimmedColors[hash % dimmedColors.length];
          ctx.fillRect(sx, ry + wave - jump, 3, 3);
          // Tiny dark spot for the head silhouette
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.fillRect(sx + 0.5, ry - 1 + wave - jump, 2, 1);
        }
      }
    }

    // Vertical structural columns (every ~110px) — concrete piers
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let cx = x + 30; cx < x + w; cx += 110) {
      ctx.fillRect(cx, y, 3, h);
    }

    // Roof shadow on top stands
    if (stadium.hasRoof && side === 'top') {
      // Shadow gradient under roof
      const shadowGrad = ctx.createLinearGradient(0, y, 0, y + 18);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(x, y, w, 18);

      // Roof structure
      ctx.fillStyle = stadium.roofColor;
      ctx.fillRect(x, y - 8, w, 10);
      // Roof underside
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x, y + 2, w, 2);
      // Roof front lip highlight
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x, y - 8, w, 1);
    }

    // Bottom railing — keeps the stand from blending into the ad boards
    if (side === 'top') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x, y + h - 2, w, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x, y + h - 1, w, 1);
    } else if (side === 'bottom') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x, y + 1, w, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x, y, w, 1);
    }
  }

  drawAdBoards(ctx, p, stadium) {
    const boardH = 10;
    const colors = stadium.adBoardColors;
    const segW = 90;
    const sponsors = ['FLY EMIRATES', 'CHEVROLET', 'STANDARD CHARTERED', 'QATAR AIRWAYS', 'AON', 'ETIHAD', 'MAIN GLOBAL', 'AIA', 'JEEP', 'AMERICAN EXPRESS', 'KIA'];

    // Scroll the marquee
    const scrollOffset = (this.time * 18) % segW;

    [p.y - boardH - 3, p.y + p.height + 3].forEach((y, row) => {
      ctx.save();
      // Clip to pitch width so panels appear to wrap
      ctx.beginPath();
      ctx.rect(p.x, y, p.width, boardH);
      ctx.clip();

      for (let i = -1; i * segW < p.width + segW; i++) {
        const baseX = p.x + i * segW - scrollOffset;
        const colorIdx = (i + row * 3 + Math.floor(this.time * 0.4)) % colors.length;
        const color = colors[(colorIdx + colors.length) % colors.length];

        // Panel
        const panelGrad = ctx.createLinearGradient(0, y, 0, y + boardH);
        panelGrad.addColorStop(0, this.lightenColor(color, 25));
        panelGrad.addColorStop(0.5, color);
        panelGrad.addColorStop(1, this.darkenColor(color, 30));
        ctx.fillStyle = panelGrad;
        ctx.fillRect(baseX, y, segW - 2, boardH);

        // LED scanline texture
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        for (let ly = y + 1; ly < y + boardH; ly += 2) {
          ctx.fillRect(baseX, ly, segW - 2, 1);
        }

        // Sponsor text
        const text = sponsors[(i + row * 5 + colorIdx) % sponsors.length];
        ctx.fillStyle = this.getContrastColor(color);
        ctx.font = `900 6.5px ${this.fontDisplay}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, baseX + (segW - 2) / 2, y + boardH / 2 + 0.5);
      }
      ctx.restore();

      // Top + bottom edge highlights for the whole board
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(p.x, y, p.width, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(p.x, y + boardH - 1, p.width, 1);
    });
    ctx.textBaseline = 'alphabetic';
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

    // High-traffic wear: lighter grass in the center circle and goalmouths
    // (where the most footfall happens in a real match)
    const wear = (cx, cy, r, intensity) => {
      const wearGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      wearGrad.addColorStop(0, `rgba(165,180,120,${intensity})`);
      wearGrad.addColorStop(1, 'rgba(165,180,120,0)');
      ctx.fillStyle = wearGrad;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    };
    wear(p.centerX, p.centerY, 70, 0.12);
    wear(p.x + 60, p.centerY, 55, 0.16);
    wear(p.x + p.width - 60, p.centerY, 55, 0.16);
    // Subtle darker scuffs near penalty spots from constant retake action
    const scuff = (cx, cy, r) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(60,40,20,0.18)');
      g.addColorStop(1, 'rgba(60,40,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    };
    scuff(p.x + 90, p.centerY, 15);
    scuff(p.x + p.width - 90, p.centerY, 15);

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
    // side === 'left' → goal opens to the right (depth extends to the left)
    // side === 'right' → goal opens to the left (depth extends to the right)
    const depth = side === 'left' ? -32 : 32;
    const backX = x + depth;
    const goalH = bottom - top;
    const sideTriangleW = Math.abs(depth) * 0.55;

    // === BACK NET PANEL (vertical mesh inside the goal) ===
    // Solid back wall fill (slight dark inside the goal)
    ctx.fillStyle = 'rgba(20,20,25,0.55)';
    const fillX = side === 'left' ? backX : x;
    ctx.fillRect(fillX, top, Math.abs(depth), goalH);

    // Subtle interior gradient (darker at top corners)
    const innerGrad = ctx.createLinearGradient(0, top, 0, bottom);
    innerGrad.addColorStop(0, 'rgba(0,0,0,0.25)');
    innerGrad.addColorStop(0.5, 'rgba(0,0,0,0.05)');
    innerGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = innerGrad;
    ctx.fillRect(fillX, top, Math.abs(depth), goalH);

    // === SIDE NET (slanted from front post to back post) ===
    // Top side panel — diagonal mesh that catches a ball lobbed in
    const topSagPattern = (yPos, depth) => {
      // Pattern of mesh lines forming a fan from the front post to the back
      const lines = 8;
      for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        const sx = x + depth * t;
        const sy = yPos + Math.sin(t * Math.PI) * 1.5; // sag
        ctx.beginPath();
        ctx.moveTo(x, yPos);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
    };

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 0.55;
    // Top side mesh from front-top corner spreading back
    // (just a diamond grid look)

    // === MAIN NET MESH on back panel ===
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = 0.5;
    const meshSpacing = 6;
    // Vertical mesh lines on back panel (with subtle sag at the middle)
    for (let nx = 0; nx <= Math.abs(depth); nx += meshSpacing) {
      const actualX = side === 'left' ? x - nx : x + nx;
      ctx.beginPath();
      // Sag: each line dips slightly toward center vertically
      ctx.moveTo(actualX, top);
      const midY = (top + bottom) / 2;
      ctx.quadraticCurveTo(actualX + (side === 'left' ? -0.5 : 0.5), midY + 1.5, actualX, bottom);
      ctx.stroke();
    }
    // Horizontal mesh lines on back panel
    for (let ny = top; ny <= bottom; ny += meshSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, ny);
      const sag = Math.sin((ny - top) / goalH * Math.PI) * 1.0;
      // Mesh bulges out slightly toward bottom-back
      ctx.lineTo(backX, ny + sag);
      ctx.stroke();
    }
    // Front-to-back vertical "ribs" closer together for net density illusion
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 0.35;
    for (let ny = top + meshSpacing / 2; ny <= bottom; ny += meshSpacing) {
      for (let nx = meshSpacing / 2; nx <= Math.abs(depth); nx += meshSpacing) {
        const actualX = side === 'left' ? x - nx : x + nx;
        // Small cross-mesh dots at intersections
        ctx.beginPath();
        ctx.arc(actualX, ny, 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // === TOP SIDE NET (slanted roof panel of the goal) ===
    // Drawn as a quadrilateral with a soft diagonal mesh
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(backX, top);
    ctx.lineTo(backX, top + 4);
    ctx.lineTo(x, top + 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    ctx.restore();

    // === BOTTOM SIDE NET (where the ball would settle) ===
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(backX, bottom);
    ctx.lineTo(backX, bottom - 4);
    ctx.lineTo(x, bottom - 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    ctx.restore();

    // === GOAL POSTS with subtle glow ===
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.8;
    ctx.shadowColor = 'rgba(255,255,255,0.55)';
    ctx.shadowBlur = 7;
    // Front upright + crossbar + back uprights
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(backX, top); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, bottom); ctx.lineTo(backX, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(backX, top); ctx.lineTo(backX, bottom); ctx.stroke();
    ctx.shadowBlur = 0;

    // Post caps (the circular nubs where posts meet the ground)
    ctx.fillStyle = '#fff';
    [[x, top], [x, bottom], [backX, top], [backX, bottom]].forEach(([px, py]) => {
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Subtle inner shadow on the front post (depth cue)
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + Math.sign(depth) * 0.8, top + 2); ctx.lineTo(x + Math.sign(depth) * 0.8, bottom - 2); ctx.stroke();
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
    this.drawSoccerBallPattern(ctx, size);
    ctx.restore();
  }

  // Regular polygon helper (path only — caller fills/strokes)
  drawPolygon(ctx, cx, cy, radius, sides, rotationRad) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + rotationRad;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // Truncated-icosahedron soccer ball, viewed face-on at the central
  // pentagon. 12 black pentagons + 20 white hexagons (only the front-facing
  // ones are rendered; the rest are implied by sphere curvature).
  drawSoccerBallPattern(ctx, size) {
    // White base with soft top-left lighting
    const baseGrad = ctx.createRadialGradient(-size * 0.35, -size * 0.4, 0, 0, 0, size * 1.1);
    baseGrad.addColorStop(0, '#FFFFFF');
    baseGrad.addColorStop(0.65, '#F2F2F2');
    baseGrad.addColorStop(1, '#BFBFBF');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Hexagon outlines surrounding the central pentagon (visible only when
    // the ball is big enough for the line width to register).
    if (size >= 14) {
      ctx.strokeStyle = 'rgba(40,40,40,0.55)';
      ctx.lineWidth = Math.max(0.6, size * 0.025);
      const hexR = size * 0.34;
      const hexRingR = size * 0.5;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5;
        const hx = Math.cos(a) * hexRingR;
        const hy = Math.sin(a) * hexRingR;
        this.drawPolygon(ctx, hx, hy, hexR, 6, a + Math.PI / 2);
        ctx.stroke();
      }
    }

    // Central black pentagon, point-up
    ctx.fillStyle = '#1a1a1a';
    this.drawPolygon(ctx, 0, 0, size * 0.3, 5, -Math.PI / 2);
    ctx.fill();

    // 5 outer black pentagons at the "corners" of the central pentagon,
    // rotated inward by 180° so a flat side faces the center.
    const outerR = size * 0.7;
    const outerSize = size * 0.2;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5;
      const cx = Math.cos(a) * outerR;
      const cy = Math.sin(a) * outerR;
      this.drawPolygon(ctx, cx, cy, outerSize, 5, a + Math.PI / 2);
      ctx.fill();
    }

    // Specular highlight (sphere)
    const hi = ctx.createRadialGradient(-size * 0.35, -size * 0.4, 0, -size * 0.35, -size * 0.4, size);
    hi.addColorStop(0, 'rgba(255,255,255,0.55)');
    hi.addColorStop(0.35, 'rgba(255,255,255,0)');
    ctx.fillStyle = hi;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Subtle bottom-right shadow band for roundness
    const sh = ctx.createRadialGradient(size * 0.3, size * 0.4, 0, size * 0.3, size * 0.4, size * 1.2);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(0.6, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();

    // Sphere outline
    ctx.strokeStyle = 'rgba(30,30,30,0.65)';
    ctx.lineWidth = Math.max(0.5, size * 0.05);
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.stroke();
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

    // Possession ring — bright cyan/white pulse at the feet of whoever
    // has the ball. Always shown (player you don't control too) so it's
    // obvious at a glance.
    if (hasBall) {
      // Outer expanding "sonar" pulse — fades as it grows
      const pulseT = (this.time * 1.8) % 1; // 0..1 each second
      const pulseR = 12 + pulseT * 18;
      const pulseAlpha = 0.6 * (1 - pulseT);
      ctx.strokeStyle = `rgba(0,255,200,${pulseAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 10, pulseR, pulseR * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Solid inner ring so it stays readable when the pulse is mid-fade
      ctx.strokeStyle = 'rgba(0,255,200,0.95)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ffc8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 10, 13, 6.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Selection indicator - pulsing ring (gold) for the player you control
    if (isControlled) {
      const pulseScale = 1 + Math.sin(this.time * 6) * 0.1;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 10, 16 * pulseScale, 8 * pulseScale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Floating arrow — bigger and brighter so you can spot yourself fast
      const arrowBob = Math.sin(this.time * 4) * 3;
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, -28 + arrowBob);
      ctx.lineTo(-6, -20 + arrowBob);
      ctx.lineTo(6, -20 + arrowBob);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
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

    // Ball indicator when dribbling — slightly larger + cyan rim glow
    if (hasBall) {
      const bx = player.x + Math.cos(player.angle) * 13;
      const by = player.y + Math.sin(player.angle) * 13;
      ctx.save();
      ctx.translate(bx, by);
      // Cyan rim glow so the ball pops at small scale
      ctx.shadowColor = '#00ffc8';
      ctx.shadowBlur = 6;
      ctx.rotate(this.time * 5);
      this.drawSoccerBallPattern(ctx, 5.5);
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
    if (engine.state !== 'playing' && engine.state !== 'goal_scored' && engine.state !== 'paused' && engine.state !== 'kickoff') return;
    const ctx = this.ctx;
    const w = this.width, h = this.height;
    // Outer fade — pulls the eye toward the pitch and away from the
    // crowd noise around the edges
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.78);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
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

    // Big center score (with pop animation when a goal just scored)
    const scoreSize = Math.min(28, sbW * 0.075);
    ctx.font = `900 ${scoreSize}px ${this.fontDisplay}`;
    ctx.textAlign = 'center';

    const popT = Math.max(0, engine.scorePopTime || 0); // 0 → 1.2
    const popScale = (side) => {
      if (engine.scorePopSide !== side || popT <= 0) return 1;
      const k = popT / 1.2;
      return 1 + Math.sin(k * Math.PI) * 0.7;
    };
    const popColor = (side) => engine.scorePopSide === side && popT > 0 ? '#FFD700' : '#fff';

    const drawScore = (side, x) => {
      const scale = popScale(side);
      ctx.save();
      ctx.translate(x, sbY + sbH / 2 + 4);
      ctx.scale(scale, scale);
      ctx.fillStyle = popColor(side);
      ctx.fillText(`${engine.score[side]}`, 0, 0);
      ctx.restore();
    };
    drawScore('home', stripeMid - scoreSize * 0.65);
    drawScore('away', stripeMid + scoreSize * 0.65);
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

    // Possession chip — shows team color of whichever side has the ball,
    // sits just under the clock so you can tell at a glance even if the
    // pitch is busy.
    if (engine.ball.owner && (engine.state === 'playing' || engine.state === 'kickoff')) {
      const side = engine.homePlayers.includes(engine.ball.owner) ? 'home' : 'away';
      const teamData = side === 'home' ? engine.homeTeamData : engine.awayTeamData;
      const ownerName = engine.ball.owner.name;
      const chipY = clockY + clockH + 4;
      const chipText = ownerName.toUpperCase();
      ctx.font = `bold 10px ${this.fontDisplay}`;
      const textW = ctx.measureText(chipText).width;
      const padX = 8;
      const ballIconW = 14;
      const chipW = textW + padX * 2 + ballIconW + 4;
      const chipH = 18;
      const chipX = (w - chipW) / 2;

      // Body
      ctx.fillStyle = teamData.primaryColor;
      ctx.fillRect(chipX, chipY, chipW, chipH);
      // Gloss
      const gloss = ctx.createLinearGradient(0, chipY, 0, chipY + chipH);
      gloss.addColorStop(0, 'rgba(255,255,255,0.3)');
      gloss.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(chipX, chipY, chipW, chipH);
      // Tiny ball icon
      ctx.save();
      ctx.translate(chipX + padX + 4, chipY + chipH / 2);
      this.drawSoccerBallPattern(ctx, 5);
      ctx.restore();
      // Owner name
      ctx.fillStyle = this.getContrastColor(teamData.primaryColor);
      ctx.font = `900 10px ${this.fontDisplay}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(chipText, chipX + padX + ballIconW, chipY + chipH / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }

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
      this.drawMatchSummary('HALF TIME', false);
    }

    if (engine.state === 'fulltime') {
      this.drawMatchSummary('FULL TIME', true);
    }

    if (engine.state === 'paused') {
      this.drawPauseMenu();
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

  // Broadcast-style summary used for halftime and fulltime.
  drawMatchSummary(label, isFulltime) {
    const ctx = this.ctx;
    const w = this.width, h = this.height;
    const home = engine.homeTeamData;
    const away = engine.awayTeamData;
    const stats = engine.getStats();

    // Dim backdrop
    ctx.fillStyle = isFulltime ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);

    // Top header band
    const headerH = Math.min(56, h * 0.08);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, headerH);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, headerH, w, 2);
    ctx.fillStyle = '#FFD700';
    ctx.font = `900 ${Math.min(28, w * 0.034)}px ${this.fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, w / 2, headerH / 2 + 2);

    // Score row — big two color blocks with score in the middle
    const scoreY = headerH + h * 0.04;
    const scoreH = Math.min(150, h * 0.22);
    const halfW = Math.min(w * 0.35, 380);
    const scoreCenter = w / 2;

    // Home block
    ctx.fillStyle = home.primaryColor;
    ctx.fillRect(scoreCenter - halfW, scoreY, halfW - 10, scoreH);
    // Away block
    ctx.fillStyle = away.primaryColor;
    ctx.fillRect(scoreCenter + 10, scoreY, halfW - 10, scoreH);
    // Gloss
    const gloss = ctx.createLinearGradient(0, scoreY, 0, scoreY + scoreH);
    gloss.addColorStop(0, 'rgba(255,255,255,0.22)');
    gloss.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(scoreCenter - halfW, scoreY, halfW - 10, scoreH);
    ctx.fillRect(scoreCenter + 10, scoreY, halfW - 10, scoreH);

    // Team names
    ctx.font = `900 ${Math.min(22, w * 0.025)}px ${this.fontDisplay}`;
    ctx.fillStyle = this.getContrastColor(home.primaryColor);
    ctx.textAlign = 'left';
    ctx.fillText(home.shortName.toUpperCase(), scoreCenter - halfW + 14, scoreY + 22);
    ctx.fillStyle = this.getContrastColor(away.primaryColor);
    ctx.textAlign = 'right';
    ctx.fillText(away.shortName.toUpperCase(), scoreCenter + halfW - 14, scoreY + 22);

    // Score numbers on each side
    ctx.font = `900 ${Math.min(90, w * 0.1)}px ${this.fontDisplay}`;
    ctx.fillStyle = this.getContrastColor(home.primaryColor);
    ctx.textAlign = 'right';
    ctx.fillText(`${engine.score.home}`, scoreCenter - 18, scoreY + scoreH - 18);
    ctx.fillStyle = this.getContrastColor(away.primaryColor);
    ctx.textAlign = 'left';
    ctx.fillText(`${engine.score.away}`, scoreCenter + 18, scoreY + scoreH - 18);

    // Center colon plate
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(scoreCenter - 10, scoreY, 20, scoreH);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.min(60, w * 0.07)}px ${this.fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.fillText(':', scoreCenter, scoreY + scoreH / 2 + 4);

    // Winner banner on fulltime
    if (isFulltime) {
      let winner = '', winnerColor = '#FFD700';
      if (engine.score.home > engine.score.away) { winner = home.name.toUpperCase() + ' WIN'; winnerColor = home.primaryColor; }
      else if (engine.score.away > engine.score.home) { winner = away.name.toUpperCase() + ' WIN'; winnerColor = away.primaryColor; }
      else winner = 'DRAW';

      const bannerY = scoreY + scoreH + 14;
      const bannerH = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, bannerY, w, bannerH);
      ctx.fillStyle = winnerColor;
      ctx.fillRect(0, bannerY, 8, bannerH);
      ctx.fillRect(w - 8, bannerY, 8, bannerH);
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${Math.min(22, w * 0.026)}px ${this.fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(winner, w / 2, bannerY + bannerH / 2 + 1);
    }

    // Stats comparison
    const statsTop = scoreY + scoreH + (isFulltime ? 56 : 26);
    const statsW = Math.min(w * 0.72, 620);
    const statsX = (w - statsW) / 2;
    const rows = [
      { label: 'POSSESSION', a: stats.home.possession + '%', b: stats.away.possession + '%', bar: stats.home.possession / 100 },
      { label: 'SHOTS',      a: stats.home.shots,             b: stats.away.shots,             bar: this.barRatio(stats.home.shots, stats.away.shots) },
      { label: 'ON TARGET',  a: stats.home.shotsOnTarget,     b: stats.away.shotsOnTarget,     bar: this.barRatio(stats.home.shotsOnTarget, stats.away.shotsOnTarget) },
      { label: 'PASSES',     a: stats.home.passes,            b: stats.away.passes,            bar: this.barRatio(stats.home.passes, stats.away.passes) },
      { label: 'TACKLES',    a: stats.home.tackles,           b: stats.away.tackles,           bar: this.barRatio(stats.home.tackles, stats.away.tackles) },
    ];
    const rowH = 26;

    rows.forEach((r, i) => {
      const ry = statsTop + i * rowH;
      // Label (center)
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `bold 11px ${this.fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.label, statsX + statsW / 2, ry);

      // Bar
      const barY = ry + 8;
      const barH = 4;
      const barW = statsW * 0.6;
      const barX = statsX + (statsW - barW) / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(barX, barY, barW, barH);
      // Split bar in home + away colors based on ratio
      const splitX = barX + barW * r.bar;
      ctx.fillStyle = home.primaryColor;
      ctx.fillRect(barX, barY, splitX - barX, barH);
      ctx.fillStyle = away.primaryColor;
      ctx.fillRect(splitX, barY, barX + barW - splitX, barH);

      // Home value (right of label, left side)
      ctx.fillStyle = '#fff';
      ctx.font = `bold 14px ${this.fontMono}`;
      ctx.textAlign = 'right';
      ctx.fillText(String(r.a), barX - 12, ry);
      // Away value
      ctx.textAlign = 'left';
      ctx.fillText(String(r.b), barX + barW + 12, ry);
    });

    // Goal scorers list at bottom (if any)
    if (engine.goalEvents.length > 0) {
      const goalsTop = statsTop + rows.length * rowH + 14;
      ctx.fillStyle = 'rgba(255,215,0,0.85)';
      ctx.font = `900 11px ${this.fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('GOALSCORERS', w / 2, goalsTop);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 12px ${this.fontBody}`;
      engine.goalEvents.forEach((ge, i) => {
        ctx.fillText(`${ge.time}'  ${ge.scorer}  (${ge.team})`, w / 2, goalsTop + 18 + i * 16);
      });
    }

    // Footer hint
    const pulse = 0.5 + Math.sin(this.time * 3) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse * 0.5})`;
    ctx.font = `900 ${Math.min(16, w * 0.022)}px ${this.fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isFulltime) {
      ctx.fillText('▶  PRESS SPACE / TAP TO PLAY AGAIN', w / 2, h - 28);
    } else {
      ctx.fillText('SECOND HALF STARTING SOON...', w / 2, h - 28);
    }
    ctx.textBaseline = 'alphabetic';
  }

  // Helper for stats bar split — 0..1 where higher means home dominates.
  barRatio(homeVal, awayVal) {
    const total = homeVal + awayVal;
    if (total === 0) return 0.5;
    return homeVal / total;
  }

  drawPauseMenu() {
    const ctx = this.ctx;
    const w = this.width, h = this.height;

    // Soft backdrop with blur-ish feel (overlay only, canvas blur is expensive)
    ctx.fillStyle = 'rgba(5,10,20,0.82)';
    ctx.fillRect(0, 0, w, h);

    // Pause panel
    const panelW = Math.min(360, w * 0.7);
    const panelH = Math.min(360, h * 0.7);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(panelX + 4, panelY + 6, panelW, panelH);

    // Panel body
    ctx.fillStyle = 'rgba(16,22,36,0.98)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    // Top accent
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(panelX, panelY, panelW, 4);

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = `900 ${Math.min(34, panelW * 0.1)}px ${this.fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PAUSED', panelX + panelW / 2, panelY + 22);

    // Current score line under title
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `bold ${Math.min(14, panelW * 0.04)}px ${this.fontDisplay}`;
    const home = engine.homeTeamData, away = engine.awayTeamData;
    ctx.fillText(`${home.shortName}  ${engine.score.home} - ${engine.score.away}  ${away.shortName}`, panelX + panelW / 2, panelY + 64);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `bold 11px ${this.fontMono}`;
    ctx.fillText(engine.getDisplayTime() + "'   " + (engine.half === 1 ? 'FIRST HALF' : 'SECOND HALF'), panelX + panelW / 2, panelY + 84);

    // Menu items
    const items = ['RESUME', 'RESTART MATCH', 'QUIT TO MENU'];
    const itemH = 48;
    const itemsStartY = panelY + panelH - itemH * items.length - 24;
    const selected = (window.app && window.app.pauseMenuIndex) || 0;

    items.forEach((label, i) => {
      const iy = itemsStartY + i * itemH;
      const isSelected = i === selected;
      // Item background
      ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(panelX + 18, iy + 4, panelW - 36, itemH - 8);
      // Left accent if selected
      if (isSelected) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(panelX + 18, iy + 4, 4, itemH - 8);
      }
      // Label
      ctx.fillStyle = isSelected ? '#FFD700' : '#fff';
      ctx.font = `900 ${Math.min(18, panelW * 0.052)}px ${this.fontDisplay}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, panelX + 38, iy + itemH / 2);
      // Tap target hint on right for mobile
      if (isSelected) {
        ctx.fillStyle = 'rgba(255,215,0,0.8)';
        ctx.textAlign = 'right';
        ctx.fillText('▶', panelX + panelW - 38, iy + itemH / 2);
      }
    });
    ctx.textBaseline = 'alphabetic';
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

  // Mix two hex colors. t=0 returns a, t=1 returns b.
  mixColor(a, b, t) {
    const ar = parseInt(a.slice(1, 3), 16);
    const ag = parseInt(a.slice(3, 5), 16);
    const ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16);
    const bg = parseInt(b.slice(3, 5), 16);
    const bb = parseInt(b.slice(5, 7), 16);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return `rgb(${r},${g},${bl})`;
  }
}
