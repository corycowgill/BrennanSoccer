// Brennan's Soccer Showdown - Main Application
// Menu system, game flow, and main loop

class App {
  constructor() {
    this.screen = 'title'; // title, controls, team_select, stadium_select, playing, fulltime
    this.canvas = null;
    this.renderer = null;

    // Selection state
    this.selectedHomeTeam = 0;
    this.selectedAwayTeam = 7; // Real Madrid
    this.selectedStadium = 0;
    this.selectingTeam = 'home'; // which team is being selected
    this.teamScrollOffset = 0;
    this.highlightedTeam = 0;

    // Menu animation
    this.titleAnim = 0;
    this.menuTransition = 0;

    // Last frame time
    this.lastTime = 0;

    // Input cooldown for menus
    this.menuInputCooldown = 0;

    // Pause menu cursor
    this.pauseMenuIndex = 0;

    this.init();
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.renderer.resize();

    window.addEventListener('resize', () => this.renderer.resize());

    // Click/tap handler for menus
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.screen !== 'playing') {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleClick({
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
      }
    }, { passive: false });

    // Start game loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  gameLoop(timestamp) {
    try {
      const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
      this.lastTime = timestamp;

      input.update();

      this.menuInputCooldown = Math.max(0, this.menuInputCooldown - dt);
      this.titleAnim += dt;

      switch (this.screen) {
        case 'title':
          this.updateTitle(dt);
          this.renderTitle();
          break;
        case 'controls':
          this.updateControls(dt);
          this.renderControls();
          break;
        case 'team_select':
          this.updateTeamSelect(dt);
          this.renderTeamSelect();
          break;
        case 'stadium_select':
          this.updateStadiumSelect(dt);
          this.renderStadiumSelect();
          break;
        case 'playing':
          this.updatePlaying(dt);
          this.renderPlaying();
          break;
      }
    } catch (err) {
      this.lastTime = timestamp;
      if (typeof window.__showDebugError === 'function') {
        window.__showDebugError('gameLoop screen=' + this.screen + ' engine.state=' + (typeof engine !== 'undefined' ? engine.state : '?'), err);
      } else {
        console.error('gameLoop error', err);
      }
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // === TITLE SCREEN ===
  updateTitle(dt) {
    if (this.menuInputCooldown > 0) return;

    if (input.btnPass || input.btnShoot) {
      audio.init();
      audio.resume();
      audio.playSelect();
      this.screen = 'team_select';
      this.selectingTeam = 'home';
      this.highlightedTeam = this.selectedHomeTeam;
      this.menuInputCooldown = 0.3;
    }
    if (input.tackleJustPressed()) {
      audio.init();
      audio.resume();
      audio.playSelect();
      this.screen = 'controls';
      this.menuInputCooldown = 0.3;
    }
  }

  renderTitle() {
    const ctx = this.renderer.ctx;
    const w = this.renderer.width;
    const h = this.renderer.height;
    const fontDisplay = this.renderer.fontDisplay;
    const fontMono = this.renderer.fontMono;

    // Stadium-night background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#06101e');
    grad.addColorStop(0.45, '#0f2a4a');
    grad.addColorStop(0.85, '#1d4a2a');
    grad.addColorStop(1, '#0a1f15');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Pitch perspective: trapezoid of striped grass at bottom
    const horizon = h * 0.55;
    for (let i = 0; i < 8; i++) {
      const t1 = i / 8;
      const t2 = (i + 1) / 8;
      const y1 = horizon + (h - horizon) * t1;
      const y2 = horizon + (h - horizon) * t2;
      const xL1 = w * 0.5 - (w * 0.1 + (w * 0.5) * t1);
      const xR1 = w * 0.5 + (w * 0.1 + (w * 0.5) * t1);
      const xL2 = w * 0.5 - (w * 0.1 + (w * 0.5) * t2);
      const xR2 = w * 0.5 + (w * 0.1 + (w * 0.5) * t2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(40,110,55,0.5)' : 'rgba(30,90,45,0.5)';
      ctx.beginPath();
      ctx.moveTo(xL1, y1);
      ctx.lineTo(xR1, y1);
      ctx.lineTo(xR2, y2);
      ctx.lineTo(xL2, y2);
      ctx.closePath();
      ctx.fill();
    }

    // Stadium lights flare overlay
    const flareGrad = ctx.createRadialGradient(w * 0.5, h * 0.05, 0, w * 0.5, h * 0.05, h * 0.5);
    flareGrad.addColorStop(0, 'rgba(255,255,230,0.18)');
    flareGrad.addColorStop(1, 'rgba(255,255,230,0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, w, h);

    // Floating soccer ball — proper truncated icosahedron pattern
    const ballR = Math.min(w, h) * 0.08;
    const ballY = h * 0.28 + Math.sin(this.titleAnim * 1.4) * 14;
    ctx.save();
    ctx.translate(w * 0.5, ballY);
    // Drop shadow under the floating ball
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, ballR * 1.3, ballR * 0.7, ballR * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Outer glow
    ctx.shadowColor = 'rgba(255,255,255,0.55)';
    ctx.shadowBlur = 50;
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.beginPath(); ctx.arc(0, 0, ballR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Rotated pattern
    ctx.save();
    ctx.rotate(this.titleAnim * 0.5);
    this.renderer.drawSoccerBallPattern(ctx, ballR);
    ctx.restore();
    ctx.restore();

    // Title block
    const titleSize = Math.min(w * 0.06, 44);
    ctx.fillStyle = '#FFD700';
    ctx.font = `900 ${titleSize}px ${fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255,215,0,0.6)';
    ctx.shadowBlur = 16;
    ctx.fillText("BRENNAN'S", w / 2, h * 0.48);
    ctx.shadowBlur = 0;

    const subSize = Math.min(w * 0.14, 90);
    // White SOCCER with red outline (jersey number style)
    ctx.font = `900 ${subSize}px ${fontDisplay}`;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 12;
    ctx.fillText('SOCCER', w / 2, h * 0.48 + subSize * 0.95);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#DA291C';
    ctx.strokeText('SOCCER', w / 2, h * 0.48 + subSize * 0.95);

    // SHOWDOWN — thinner band underneath
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${subSize * 0.55}px ${fontDisplay}`;
    ctx.fillText('• SHOWDOWN •', w / 2, h * 0.48 + subSize * 1.55);

    // Stats strip — like a broadcast lower third
    const stripY = h * 0.78;
    const stripH = 30;
    const stripW = Math.min(w * 0.7, 520);
    const stripX = (w - stripW) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(stripX, stripY, stripW, stripH);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(stripX, stripY, stripW, 2);
    const stats = [
      { label: 'TEAMS', value: TEAMS.length },
      { label: 'STADIUMS', value: STADIUMS.length },
      { label: 'LEAGUES', value: new Set(TEAMS.map(t => t.league)).size },
    ];
    stats.forEach((s, i) => {
      const cx = stripX + stripW * (i + 0.5) / stats.length;
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${Math.min(w * 0.024, 18)}px ${fontDisplay}`;
      ctx.fillText(String(s.value), cx, stripY + 16);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `bold ${Math.min(w * 0.014, 10)}px ${fontDisplay}`;
      ctx.fillText(s.label, cx, stripY + 27);
      if (i < stats.length - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(stripX + stripW * (i + 1) / stats.length - 0.5, stripY + 4, 1, stripH - 8);
      }
    });

    // Start prompt (pulsing)
    const pulse = 0.5 + Math.sin(this.titleAnim * 3) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + pulse * 0.5})`;
    ctx.font = `900 ${Math.min(w * 0.028, 20)}px ${fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.fillText(input.isMobile ? '▶  TAP TO KICK OFF' : '▶  PRESS SPACE TO KICK OFF', w / 2, h * 0.9);

    // Controls hint
    ctx.fillStyle = 'rgba(200,220,255,0.45)';
    ctx.font = `bold ${Math.min(w * 0.018, 13)}px ${fontDisplay}`;
    ctx.fillText(input.isMobile ? 'TAP BELOW FOR CONTROLS' : 'PRESS C FOR CONTROLS', w / 2, h * 0.94);

    // Controller hint
    if (input.hasGamepad()) {
      ctx.fillStyle = 'rgba(100,255,100,0.7)';
      ctx.font = `bold ${Math.min(w * 0.018, 13)}px ${fontDisplay}`;
      ctx.fillText('🎮 XBOX CONTROLLER READY', w / 2, h * 0.97);
    }

    // Version corner
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = `bold 10px ${fontMono}`;
    ctx.textAlign = 'right';
    ctx.fillText('v1.1', w - 8, h - 8);
  }

  // === CONTROLS SCREEN ===
  updateControls(dt) {
    if (this.menuInputCooldown > 0) return;

    if (input.btnPass || input.btnShoot || input.tackleJustPressed() || input.pauseJustPressed()) {
      audio.playSelect();
      this.screen = 'title';
      this.menuInputCooldown = 0.3;
    }
  }

  renderControls() {
    const ctx = this.renderer.ctx;
    const w = this.renderer.width;
    const h = this.renderer.height;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(0.5, '#162840');
    grad.addColorStop(1, '#0d2137');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle pitch pattern in background
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * (h / 20));
      ctx.lineTo(w, i * (h / 20));
      ctx.stroke();
    }

    // Header
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.min(w * 0.05, 40)}px Arial`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillText('CONTROLS', w / 2, h * 0.08);
    ctx.shadowBlur = 0;

    // Layout: up to 3 columns (keyboard, touch, gamepad)
    const isMobile = input.isMobile;
    const sections = [];

    if (!isMobile) {
      sections.push({
        title: 'KEYBOARD',
        icon: 'Keyboard',
        color: '#6CABDD',
        controls: [
          ['Move', 'WASD / Arrow Keys'],
          ['Pass / Switch Player', 'SPACE or Z'],
          ['Shoot (hold to charge)', 'X or E'],
          ['Tackle / Slide', 'C or Q'],
          ['Sprint', 'SHIFT'],
          ['Pause', 'P or ESC'],
        ],
      });
    }

    sections.push({
      title: isMobile ? 'TOUCH CONTROLS' : 'TOUCH (Mobile)',
      icon: 'Touch',
      color: '#44DDAA',
      controls: [
        ['Move', 'Left side joystick'],
        ['Shoot', 'Red button (top)'],
        ['Pass / Switch', 'Blue button (left)'],
        ['Tackle', 'Orange button (right)'],
        ['Sprint', 'Green button (bottom)'],
      ],
    });

    sections.push({
      title: 'XBOX CONTROLLER',
      icon: 'Gamepad',
      color: '#77DD44',
      controls: [
        ['Move', 'Left Stick / D-Pad'],
        ['Pass / Switch Player', 'A Button'],
        ['Shoot (hold to charge)', 'X Button'],
        ['Tackle / Slide', 'B Button'],
        ['Sprint', 'LT / RT Triggers'],
        ['Pause', 'Start / Menu'],
      ],
    });

    const colCount = sections.length;
    const colW = Math.min(320, (w - 40) / colCount - 20);
    const startX = (w - (colCount * (colW + 20))) / 2 + 10;
    const startY = h * 0.14;

    for (let s = 0; s < sections.length; s++) {
      const sec = sections[s];
      const x = startX + s * (colW + 20);
      const y = startY;
      const cardH = h * 0.65;

      // Card background
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      this.renderer.roundRect(ctx, x, y, colW, cardH, 10);
      ctx.fill();

      ctx.strokeStyle = sec.color + '55';
      ctx.lineWidth = 1;
      this.renderer.roundRect(ctx, x, y, colW, cardH, 10);
      ctx.stroke();

      // Section header bar
      ctx.fillStyle = sec.color + '22';
      this.renderer.roundRect(ctx, x, y, colW, 40, 10);
      ctx.fill();
      // Cover bottom corners of header
      ctx.fillRect(x, y + 30, colW, 10);

      // Section title
      ctx.fillStyle = sec.color;
      ctx.font = `bold ${Math.min(16, colW * 0.055)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(sec.title, x + colW / 2, y + 26);

      // Control rows
      const rowH = Math.min(44, (cardH - 60) / sec.controls.length);
      const rowStartY = y + 52;

      for (let r = 0; r < sec.controls.length; r++) {
        const [action, binding] = sec.controls[r];
        const ry = rowStartY + r * rowH;

        // Alternating row background
        if (r % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.02)';
          ctx.fillRect(x + 4, ry - 2, colW - 8, rowH);
        }

        // Action name
        ctx.fillStyle = '#ccc';
        ctx.font = `${Math.min(13, colW * 0.044)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(action, x + 12, ry + 12);

        // Binding (styled as a key/button)
        ctx.fillStyle = sec.color;
        ctx.font = `bold ${Math.min(12, colW * 0.04)}px Arial`;
        ctx.textAlign = 'right';
        ctx.fillText(binding, x + colW - 12, ry + 12);

        // Separator line
        if (r < sec.controls.length - 1) {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x + 10, ry + rowH - 2);
          ctx.lineTo(x + colW - 10, ry + rowH - 2);
          ctx.stroke();
        }
      }
    }

    // Gameplay tips section
    const tipsY = startY + h * 0.65 + 15;
    ctx.fillStyle = 'rgba(255,215,0,0.08)';
    const tipsW = Math.min(700, w - 40);
    const tipsX = (w - tipsW) / 2;
    this.renderer.roundRect(ctx, tipsX, tipsY, tipsW, h * 0.12, 8);
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.min(14, w * 0.02)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('GAMEPLAY TIPS', w / 2, tipsY + 18);

    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.min(12, w * 0.017)}px Arial`;
    const tips = [
      'Hold SHOOT to charge a power shot - release to fire!',
      'Press PASS when you don\'t have the ball to switch to the nearest player.',
      'Use SPRINT to burst past defenders, but watch your angles!',
    ];
    tips.forEach((tip, i) => {
      ctx.fillText(tip, w / 2, tipsY + 36 + i * 18);
    });

    // Back prompt
    const pulse = 0.5 + Math.sin(this.titleAnim * 3) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + pulse * 0.4})`;
    ctx.font = `bold ${Math.min(w * 0.025, 18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(input.isMobile ? 'TAP ANYWHERE TO GO BACK' : 'PRESS SPACE OR C TO GO BACK', w / 2, h * 0.96);
  }

  // === TEAM SELECT ===
  updateTeamSelect(dt) {
    if (this.menuInputCooldown > 0) return;

    if (input.moveY < -0.5) {
      this.highlightedTeam = Math.max(0, this.highlightedTeam - 1);
      this.menuInputCooldown = 0.15;
      audio.playNavigate();
    }
    if (input.moveY > 0.5) {
      this.highlightedTeam = Math.min(TEAMS.length - 1, this.highlightedTeam + 1);
      this.menuInputCooldown = 0.15;
      audio.playNavigate();
    }
    if (input.moveX < -0.5) {
      this.highlightedTeam = Math.max(0, this.highlightedTeam - 4);
      this.menuInputCooldown = 0.15;
      audio.playNavigate();
    }
    if (input.moveX > 0.5) {
      this.highlightedTeam = Math.min(TEAMS.length - 1, this.highlightedTeam + 4);
      this.menuInputCooldown = 0.15;
      audio.playNavigate();
    }

    if (input.passJustPressed() || input.shootJustPressed()) {
      if (this.selectingTeam === 'home') {
        this.selectedHomeTeam = this.highlightedTeam;
        this.selectingTeam = 'away';
        this.highlightedTeam = this.selectedAwayTeam;
        audio.playSelect();
      } else {
        this.selectedAwayTeam = this.highlightedTeam;
        this.screen = 'stadium_select';
        audio.playSelect();
      }
      this.menuInputCooldown = 0.3;
    }

    if (input.tackleJustPressed()) {
      if (this.selectingTeam === 'away') {
        this.selectingTeam = 'home';
        this.highlightedTeam = this.selectedHomeTeam;
        audio.playNavigate();
      } else {
        this.screen = 'title';
        audio.playNavigate();
      }
      this.menuInputCooldown = 0.3;
    }
  }

  renderTeamSelect() {
    const ctx = this.renderer.ctx;
    const w = this.renderer.width;
    const h = this.renderer.height;
    const fontDisplay = this.renderer.fontDisplay;
    const previewTeam = TEAMS[this.highlightedTeam];

    // Background — tinted by the highlighted team's primary color
    const accent = previewTeam ? previewTeam.primaryColor : '#1a3a5c';
    const tint = this.renderer.mixColor('#06101e', accent, 0.18);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#04080f');
    grad.addColorStop(0.5, tint);
    grad.addColorStop(1, '#04080f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft pitch perspective at the bottom (just like title)
    ctx.fillStyle = 'rgba(40,110,55,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.2, h * 0.7);
    ctx.lineTo(w * 0.8, h * 0.7);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // === Top bar — matchup so far ===
    const barH = Math.min(58, h * 0.085);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, barH);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, barH, w, 2);

    const isSelectingHome = this.selectingTeam === 'home';
    const drawSlot = (label, team, x, align, isActive) => {
      ctx.font = `bold 11px ${fontDisplay}`;
      ctx.fillStyle = isActive ? '#FFD700' : 'rgba(255,255,255,0.4)';
      ctx.textAlign = align;
      ctx.textBaseline = 'top';
      ctx.fillText(label, x, 8);
      if (team) {
        // Kit swatch
        const swX = align === 'left' ? x : x - 26;
        ctx.fillStyle = team.primaryColor;
        ctx.fillRect(swX, 24, 26, 26);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeRect(swX + 0.5, 24.5, 25, 25);
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${Math.min(20, w * 0.024)}px ${fontDisplay}`;
        ctx.fillText(team.shortName.toUpperCase(), align === 'left' ? x + 32 : x - 32, 27);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = `900 ${Math.min(20, w * 0.024)}px ${fontDisplay}`;
        ctx.fillText('—', align === 'left' ? x + 32 : x - 32, 27);
      }
    };

    drawSlot('HOME', isSelectingHome ? null : TEAMS[this.selectedHomeTeam], 20, 'left', isSelectingHome);
    drawSlot('AWAY', null, w - 20, 'right', !isSelectingHome);

    // Center VS
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `900 ${Math.min(26, w * 0.03)}px ${fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', w / 2, barH / 2 + 2);

    // === Layout: left = scrollable team list, right = featured team preview ===
    // On narrow screens, hide the preview pane and use full-width list.
    const showPreview = w >= 720;
    const previewW = showPreview ? Math.min(380, w * 0.36) : 0;
    const listX = 20;
    const listY = barH + 18;
    const listW = w - previewW - (showPreview ? 60 : 40);
    const listH = h - listY - 50;

    // List card background
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(listX + 0.5, listY + 0.5, listW - 1, listH - 1);

    // Section header
    ctx.fillStyle = 'rgba(255,215,0,0.85)';
    ctx.font = `900 12px ${fontDisplay}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(isSelectingHome ? 'CHOOSE HOME TEAM' : 'CHOOSE AWAY TEAM', listX + 14, listY + 10);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `bold 10px ${fontDisplay}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${TEAMS.length} TEAMS`, listX + listW - 14, listY + 10);

    // Scrollable list of team rows
    const rowH = 38;
    const visibleTop = listY + 30;
    const visibleH = listH - 38;
    const maxVisible = Math.floor(visibleH / rowH);
    const highlightRow = this.highlightedTeam;
    const maxScroll = Math.max(0, TEAMS.length - maxVisible);
    const idealScroll = Math.max(0, Math.min(maxScroll, highlightRow - Math.floor(maxVisible / 2)));
    this.teamScrollOffset += (idealScroll - this.teamScrollOffset) * 0.2;
    const scrollY = this.teamScrollOffset * rowH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(listX + 4, visibleTop, listW - 8, visibleH);
    ctx.clip();

    for (let i = 0; i < TEAMS.length; i++) {
      const team = TEAMS[i];
      const y = visibleTop + i * rowH - scrollY;
      if (y < visibleTop - rowH || y > visibleTop + visibleH) continue;
      const isHi = i === this.highlightedTeam;
      const isLocked = !isSelectingHome && i === this.selectedHomeTeam;

      // Row background
      if (isHi) {
        ctx.fillStyle = team.primaryColor + 'cc';
        ctx.fillRect(listX + 6, y + 2, listW - 12, rowH - 4);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(listX + 6, y + 2, 4, rowH - 4);
      } else if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(listX + 6, y + 2, listW - 12, rowH - 4);
      }

      // Kit swatch with secondary color stripe if striped
      const swatchX = listX + 18;
      const swatchY = y + 8;
      ctx.fillStyle = team.primaryColor;
      ctx.fillRect(swatchX, swatchY, 22, 22);
      if (team.kitPattern && team.kitPattern.includes('stripes')) {
        ctx.fillStyle = team.secondaryColor;
        ctx.fillRect(swatchX + 8, swatchY, 6, 22);
      } else if (team.kitPattern === 'hoops' || team.kitPattern === 'hoopSingle') {
        ctx.fillStyle = team.secondaryColor;
        ctx.fillRect(swatchX, swatchY + 8, 22, 6);
      } else if (team.kitPattern === 'halves') {
        ctx.fillStyle = team.secondaryColor;
        ctx.fillRect(swatchX + 11, swatchY, 11, 22);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(swatchX + 0.5, swatchY + 0.5, 21, 21);

      // Locked indicator
      if (isLocked) {
        ctx.fillStyle = 'rgba(0,200,80,0.85)';
        ctx.font = `900 8px ${fontDisplay}`;
        ctx.textAlign = 'right';
        ctx.fillText('HOME', listX + listW - 14, y + 13);
      }

      // Team name
      ctx.fillStyle = isHi ? '#fff' : '#fff';
      ctx.font = `900 ${Math.min(14, listW * 0.022)}px ${fontDisplay}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(team.name.toUpperCase(), swatchX + 30, y + 16);

      // League + country
      ctx.fillStyle = isHi ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)';
      ctx.font = `bold 10px ${fontDisplay}`;
      ctx.fillText(`${team.league} · ${team.country}`, swatchX + 30, y + 28);

      // Overall rating chip (right-aligned)
      const rating = team.rating;
      const ratingColor = rating >= 88 ? '#FFD700' : rating >= 82 ? '#7ee87e' : rating >= 75 ? '#7ec8ff' : '#aaaaaa';
      const chipX = listX + listW - (isLocked ? 60 : 22) - 28;
      ctx.fillStyle = ratingColor;
      ctx.fillRect(chipX, y + 11, 24, 16);
      ctx.fillStyle = '#000';
      ctx.font = `900 11px ${fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(rating), chipX + 12, y + 19);
    }
    ctx.restore();
    ctx.textBaseline = 'alphabetic';

    // === Preview panel ===
    if (previewTeam && showPreview) {
      const pX = w - previewW - 20;
      const pY = listY;
      const pH = listH;
      // Big team color background
      const previewGrad = ctx.createLinearGradient(0, pY, 0, pY + pH);
      previewGrad.addColorStop(0, previewTeam.primaryColor);
      previewGrad.addColorStop(1, this.renderer.darkenColor(previewTeam.primaryColor, 50));
      ctx.fillStyle = previewGrad;
      ctx.fillRect(pX, pY, previewW, pH);
      // Gloss
      const glossGrad = ctx.createLinearGradient(0, pY, 0, pY + pH * 0.5);
      glossGrad.addColorStop(0, 'rgba(255,255,255,0.18)');
      glossGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glossGrad;
      ctx.fillRect(pX, pY, previewW, pH * 0.5);
      // Dark info panel at bottom
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(pX, pY + pH - 168, previewW, 168);

      const textColor = this.renderer.getContrastColor(previewTeam.primaryColor);
      ctx.fillStyle = textColor;
      ctx.font = `900 ${Math.min(28, previewW * 0.075)}px ${fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(previewTeam.name.toUpperCase(), pX + previewW / 2, pY + 16);

      ctx.font = `bold 11px ${fontDisplay}`;
      ctx.fillStyle = textColor === '#000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
      ctx.fillText(`${previewTeam.country.toUpperCase()}  ·  ${previewTeam.league.toUpperCase()}`, pX + previewW / 2, pY + 50);

      // Mini jersey graphic
      const jerseyY = pY + 80;
      const jerseyW = 80;
      const jerseyH = 90;
      const jX = pX + (previewW - jerseyW) / 2;
      this._drawMiniJersey(ctx, jX, jerseyY, jerseyW, jerseyH, previewTeam);

      // Star rating + OVR
      const ovrY = pY + pH - 158;
      ctx.fillStyle = '#FFD700';
      ctx.font = `900 ${Math.min(30, previewW * 0.08)}px ${fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${previewTeam.rating}`, pX + previewW / 2 - 35, ovrY + 14);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `bold 9px ${fontDisplay}`;
      ctx.fillText('OVR', pX + previewW / 2 - 35, ovrY + 36);
      // Stars
      const stars = Math.max(1, Math.round(previewTeam.rating / 20));
      ctx.fillStyle = '#FFD700';
      ctx.font = `${Math.min(20, previewW * 0.05)}px ${fontDisplay}`;
      ctx.fillText('★'.repeat(stars), pX + previewW / 2 + 30, ovrY + 16);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `bold 9px ${fontDisplay}`;
      ctx.fillText('RATING', pX + previewW / 2 + 30, ovrY + 36);

      // Player list under jersey
      ctx.textAlign = 'left';
      ctx.font = `bold 10px ${fontDisplay}`;
      const rosterY = pY + pH - 110;
      previewTeam.players.forEach((pl, i) => {
        const ry = rosterY + i * 18;
        // Position chip
        const posColors = { GK: '#FFC107', DEF: '#4A90E2', MID: '#7ED321', FWD: '#E94B3C' };
        ctx.fillStyle = posColors[pl.pos] || '#888';
        ctx.fillRect(pX + 14, ry + 1, 24, 13);
        ctx.fillStyle = '#000';
        ctx.font = `900 9px ${fontDisplay}`;
        ctx.textAlign = 'center';
        ctx.fillText(pl.pos, pX + 14 + 12, ry + 11);
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = `bold 11px ${fontDisplay}`;
        ctx.textAlign = 'left';
        ctx.fillText(pl.name, pX + 44, ry + 11);
        // Number
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = `bold 10px ${this.renderer.fontMono}`;
        ctx.fillText(`#${pl.num}`, pX + previewW - 60, ry + 11);
        // Rating
        const r = Math.round((pl.speed + pl.shooting + pl.passing + pl.defense) / 4);
        ctx.fillStyle = '#FFD700';
        ctx.font = `900 11px ${fontDisplay}`;
        ctx.textAlign = 'right';
        ctx.fillText(String(r), pX + previewW - 14, ry + 11);
      });
    }

    // === Footer hint bar ===
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, h - 36, w, 36);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, h - 36, w, 2);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.min(13, w * 0.018)}px ${fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      input.isMobile ? 'TAP A TEAM TO SELECT  ·  TAP A LOCKED PICK TO CHANGE' :
        '↑↓ NAVIGATE   ·   SPACE / ENTER SELECT   ·   C BACK',
      w / 2, h - 18
    );
    ctx.textBaseline = 'alphabetic';
  }

  _drawMiniJersey(ctx, x, y, w, h, team) {
    // Body shape (jersey + sleeves)
    const bodyX = x + w * 0.18;
    const bodyW = w * 0.64;

    // Sleeves
    ctx.fillStyle = team.kitPattern === 'sleeves' ? team.secondaryColor : team.primaryColor;
    ctx.fillRect(x, y + h * 0.15, w * 0.22, h * 0.3);
    ctx.fillRect(x + w * 0.78, y + h * 0.15, w * 0.22, h * 0.3);

    // Body
    ctx.fillStyle = team.primaryColor;
    ctx.fillRect(bodyX, y + h * 0.05, bodyW, h * 0.85);

    // Kit pattern
    switch (team.kitPattern) {
      case 'stripes':
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
          ctx.fillRect(bodyX + i * (bodyW / 4), y + h * 0.05, bodyW / 4 + 0.5, h * 0.85);
        }
        break;
      case 'stripes_thin':
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
          ctx.fillRect(bodyX + i * (bodyW / 8), y + h * 0.05, bodyW / 8 + 0.5, h * 0.85);
        }
        break;
      case 'hoops':
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 === 0 ? team.primaryColor : team.secondaryColor;
          ctx.fillRect(bodyX, y + h * 0.05 + i * (h * 0.85 / 5), bodyW, h * 0.85 / 5 + 0.5);
        }
        break;
      case 'halves':
        ctx.fillStyle = team.secondaryColor;
        ctx.fillRect(bodyX + bodyW / 2, y + h * 0.05, bodyW / 2, h * 0.85);
        break;
      case 'hoopSingle':
        ctx.fillStyle = team.secondaryColor;
        ctx.fillRect(bodyX, y + h * 0.4, bodyW, h * 0.18);
        break;
    }

    // Collar (V neck)
    ctx.fillStyle = team.tertiaryColor || team.secondaryColor;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2 - 8, y + h * 0.12);
    ctx.lineTo(x + w / 2 + 8, y + h * 0.12);
    ctx.closePath();
    ctx.fill();
    // Neck hole
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 2);
    ctx.lineTo(x + w / 2 - 4, y + h * 0.08);
    ctx.lineTo(x + w / 2 + 4, y + h * 0.08);
    ctx.closePath();
    ctx.fill();

    // Drop shadow under jersey for depth
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h + 4, w * 0.35, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // === STADIUM SELECT ===
  updateStadiumSelect(dt) {
    if (this.menuInputCooldown > 0) return;

    if (input.moveX < -0.5 || input.moveY < -0.5) {
      this.selectedStadium = (this.selectedStadium - 1 + STADIUMS.length) % STADIUMS.length;
      this.menuInputCooldown = 0.2;
      audio.playNavigate();
    }
    if (input.moveX > 0.5 || input.moveY > 0.5) {
      this.selectedStadium = (this.selectedStadium + 1) % STADIUMS.length;
      this.menuInputCooldown = 0.2;
      audio.playNavigate();
    }

    if (input.passJustPressed() || input.shootJustPressed()) {
      this.startMatch();
      this.menuInputCooldown = 0.5;
      audio.playSelect();
    }

    if (input.tackleJustPressed()) {
      this.screen = 'team_select';
      this.selectingTeam = 'away';
      this.highlightedTeam = this.selectedAwayTeam;
      this.menuInputCooldown = 0.3;
      audio.playNavigate();
    }
  }

  renderStadiumSelect() {
    const ctx = this.renderer.ctx;
    const w = this.renderer.width;
    const h = this.renderer.height;
    const fontDisplay = this.renderer.fontDisplay;
    const fontMono = this.renderer.fontMono;

    const stadium = STADIUMS[this.selectedStadium];
    const homeTeam = TEAMS[this.selectedHomeTeam];
    const awayTeam = TEAMS[this.selectedAwayTeam];

    // === Hero: full-bleed sky background from the selected stadium ===
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    stadium.skyGradient.forEach((c, i) => {
      skyGrad.addColorStop(i / (stadium.skyGradient.length - 1), c);
    });
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun / lights flare for atmosphere
    if (stadium.weatherEffect === 'sun') {
      const sx = w * 0.85, sy = h * 0.18;
      const fg = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.35);
      fg.addColorStop(0, 'rgba(255,255,210,0.6)');
      fg.addColorStop(0.5, 'rgba(255,255,200,0.18)');
      fg.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, w, h);
    } else if (stadium.floodlights) {
      // Floodlight glows from the rim
      [w * 0.18, w * 0.5, w * 0.82].forEach(fx => {
        const fg = ctx.createRadialGradient(fx, -h * 0.05, 0, fx, -h * 0.05, h * 0.55);
        fg.addColorStop(0, 'rgba(255,250,200,0.35)');
        fg.addColorStop(1, 'rgba(255,250,200,0)');
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, w, h);
      });
    }

    // === Stadium silhouette across the middle ===
    this._drawStadiumSilhouette(ctx, stadium, 0, h * 0.32, w, h * 0.36);

    // Pitch strip at the bottom (perspective trapezoid)
    const horizonY = h * 0.68;
    for (let i = 0; i < 8; i++) {
      const t1 = i / 8, t2 = (i + 1) / 8;
      const y1 = horizonY + (h - horizonY) * t1;
      const y2 = horizonY + (h - horizonY) * t2;
      const offset1 = (w * 0.5) * t1;
      const offset2 = (w * 0.5) * t2;
      ctx.fillStyle = i % 2 === 0 ? stadium.grassColor1 : stadium.grassColor2;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - w * 0.1 - offset1, y1);
      ctx.lineTo(w * 0.5 + w * 0.1 + offset1, y1);
      ctx.lineTo(w * 0.5 + w * 0.1 + offset2, y2);
      ctx.lineTo(w * 0.5 - w * 0.1 - offset2, y2);
      ctx.closePath();
      ctx.fill();
    }
    // Center line on perspective pitch
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, horizonY);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();

    // Top vignette so the header reads
    const topShade = ctx.createLinearGradient(0, 0, 0, h * 0.25);
    topShade.addColorStop(0, 'rgba(0,0,0,0.7)');
    topShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, w, h * 0.25);

    // === Header bar ===
    ctx.fillStyle = '#FFD700';
    ctx.font = `900 12px ${fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('CHOOSE STADIUM', w / 2, 18);

    // Matchup tag
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const matchTagW = Math.min(w * 0.45, 380);
    ctx.fillRect((w - matchTagW) / 2, 36, matchTagW, 36);

    // Home swatch
    ctx.fillStyle = homeTeam.primaryColor;
    ctx.fillRect((w - matchTagW) / 2 + 12, 42, 24, 24);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.min(15, w * 0.018)}px ${fontDisplay}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(homeTeam.shortName, (w - matchTagW) / 2 + 42, 54);
    // VS
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `bold 13px ${fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.fillText('VS', w / 2, 54);
    // Away swatch
    ctx.fillStyle = awayTeam.primaryColor;
    ctx.fillRect((w + matchTagW) / 2 - 36, 42, 24, 24);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.min(15, w * 0.018)}px ${fontDisplay}`;
    ctx.textAlign = 'right';
    ctx.fillText(awayTeam.shortName, (w + matchTagW) / 2 - 42, 54);
    ctx.textBaseline = 'alphabetic';

    // === Big stadium info card centered ===
    const infoH = 120;
    const infoW = Math.min(w * 0.6, 540);
    const infoX = (w - infoW) / 2;
    const infoY = h * 0.34;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(infoX, infoY, infoW, infoH);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(infoX, infoY, 6, infoH);
    ctx.fillRect(infoX, infoY, infoW, 2);

    // Stadium name big
    ctx.fillStyle = '#FFD700';
    ctx.font = `900 ${Math.min(34, infoW * 0.075)}px ${fontDisplay}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(stadium.name.toUpperCase(), infoX + 22, infoY + 14);

    // Subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `bold ${Math.min(14, infoW * 0.03)}px ${fontDisplay}`;
    ctx.fillText(stadium.subtitle.toUpperCase(), infoX + 22, infoY + 52);

    // Capacity + features row
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `bold 11px ${fontDisplay}`;
    ctx.fillText('CAPACITY', infoX + 22, infoY + 76);
    ctx.fillStyle = '#fff';
    ctx.font = `900 14px ${fontMono}`;
    ctx.fillText(stadium.capacity.toLocaleString(), infoX + 22, infoY + 92);

    // Features as chips
    const feats = [];
    if (stadium.floodlights) feats.push({ label: 'FLOODLIGHTS', color: '#FFD700' });
    if (stadium.hasRoof) feats.push({ label: 'COVERED', color: '#7ec8ff' });
    if (stadium.weatherEffect === 'sun') feats.push({ label: 'SUNNY', color: '#FF9F40' });
    else if (stadium.weatherEffect === 'rain') feats.push({ label: 'RAIN', color: '#3eaaff' });
    else if (stadium.weatherEffect === 'snow') feats.push({ label: 'SNOW', color: '#ddeeff' });
    let cx = infoX + 170;
    feats.forEach(f => {
      ctx.font = `900 10px ${fontDisplay}`;
      const tw = ctx.measureText(f.label).width;
      ctx.fillStyle = f.color;
      ctx.fillRect(cx, infoY + 76, tw + 14, 18);
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.label, cx + 7, infoY + 76 + 9);
      cx += tw + 22;
    });
    ctx.textBaseline = 'alphabetic';

    // Description
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `italic 12px ${this.renderer.fontBody}`;
    ctx.textAlign = 'left';
    ctx.fillText(`"${stadium.description}"`, infoX + 22, infoY + 110);

    // === Thumbnail strip at bottom (small stadium cards as nav) ===
    const stripY = h - 110;
    const stripH = 70;
    const thumbW = Math.min(150, w * 0.16);
    const thumbGap = 12;
    const totalStripW = STADIUMS.length * thumbW + (STADIUMS.length - 1) * thumbGap;
    const stripX = (w - totalStripW) / 2;

    // Strip background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, stripY - 14, w, stripH + 28);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, stripY - 14, w, 2);

    for (let i = 0; i < STADIUMS.length; i++) {
      const s = STADIUMS[i];
      const isSel = i === this.selectedStadium;
      const tx = stripX + i * (thumbW + thumbGap);
      const ty = stripY;

      // Card mini preview
      this._drawStadiumThumbnail(ctx, s, tx, ty, thumbW, stripH);

      // Selection ring
      if (isSel) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
        ctx.strokeRect(tx - 1, ty - 1, thumbW + 2, stripH + 2);
        ctx.shadowBlur = 0;
        // Tiny pulse marker above
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(tx + thumbW / 2, ty - 6);
        ctx.lineTo(tx + thumbW / 2 - 6, ty - 12);
        ctx.lineTo(tx + thumbW / 2 + 6, ty - 12);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx + 0.5, ty + 0.5, thumbW - 1, stripH - 1);
      }

      // Stadium short name under thumbnail
      ctx.fillStyle = isSel ? '#FFD700' : 'rgba(255,255,255,0.7)';
      ctx.font = `900 ${Math.min(11, thumbW * 0.085)}px ${fontDisplay}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(s.name.toUpperCase(), tx + thumbW / 2, ty + stripH + 6);
    }

    // === Footer hint ===
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, h - 28, w, 28);
    const pulse = 0.5 + Math.sin(this.titleAnim * 3) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.55 + pulse * 0.45})`;
    ctx.font = `900 ${Math.min(13, w * 0.018)}px ${fontDisplay}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      input.isMobile ? '▶  TAP A STADIUM TO START THE MATCH' :
        '◀ ▶ BROWSE   ·   SPACE / ENTER KICK OFF   ·   C BACK',
      w / 2, h - 14
    );
    ctx.textBaseline = 'alphabetic';
  }

  // Big stadium silhouette/cross-section drawn behind the info card
  _drawStadiumSilhouette(ctx, stadium, x, y, w, h) {
    // Far stands (back row)
    const farH = h * 0.55;
    const farY = y;
    const farGrad = ctx.createLinearGradient(0, farY, 0, farY + farH);
    farGrad.addColorStop(0, this.renderer.darkenColor(stadium.standColor, 30));
    farGrad.addColorStop(1, stadium.standAccent);
    ctx.fillStyle = farGrad;
    // Curved silhouette: trapezoid with raised middle for big stadium feel
    ctx.beginPath();
    ctx.moveTo(x, farY + farH);
    ctx.lineTo(x, farY + farH * 0.55);
    ctx.quadraticCurveTo(x + w * 0.5, farY - farH * 0.05, x + w, farY + farH * 0.55);
    ctx.lineTo(x + w, farY + farH);
    ctx.closePath();
    ctx.fill();

    // Roof line (if covered)
    if (stadium.hasRoof) {
      ctx.fillStyle = stadium.roofColor;
      ctx.beginPath();
      ctx.moveTo(x, farY + farH * 0.55);
      ctx.quadraticCurveTo(x + w * 0.5, farY - farH * 0.05, x + w, farY + farH * 0.55);
      ctx.quadraticCurveTo(x + w * 0.5, farY - farH * 0.12, x, farY + farH * 0.55);
      ctx.closePath();
      ctx.fill();
    }

    // Crowd dots on far stands
    const colors = [stadium.crowdColor1, stadium.crowdColor2, stadium.crowdColor3];
    const dimmed = colors.map(c => this.renderer.mixColor(c, '#3a3a3a', 0.45));
    for (let cx = x + 8; cx < x + w; cx += 9) {
      for (let cy = farY + farH * 0.35; cy < farY + farH * 0.95; cy += 6) {
        const hash = (cx * 31 + cy * 17) & 0xFFFF;
        if ((hash % 100) / 100 > stadium.crowdDensity * 0.6) continue;
        // Wave
        const wv = Math.sin(this.titleAnim * 0.8 + cx * 0.03) * 1.5;
        ctx.fillStyle = dimmed[hash % dimmed.length];
        ctx.fillRect(cx, cy + wv, 3, 3);
      }
    }

    // Floodlight masts
    if (stadium.floodlights) {
      [w * 0.12, w * 0.88].forEach(fx => {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + fx, y);
        ctx.lineTo(x + fx, y + h * 0.4);
        ctx.stroke();
        // Light cluster
        ctx.fillStyle = '#ccc';
        ctx.fillRect(x + fx - 12, y - 4, 24, 8);
        ctx.fillStyle = 'rgba(255,255,220,0.8)';
        ctx.beginPath();
        ctx.arc(x + fx, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // Mini-thumbnail used in the bottom navigation strip.
  _drawStadiumThumbnail(ctx, stadium, x, y, w, h) {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, y, 0, y + h * 0.7);
    stadium.skyGradient.forEach((c, i) => {
      skyGrad.addColorStop(i / (stadium.skyGradient.length - 1), c);
    });
    ctx.fillStyle = skyGrad;
    ctx.fillRect(x, y, w, h);

    // Distant stands silhouette
    ctx.fillStyle = this.renderer.darkenColor(stadium.standColor, 20);
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.55);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.25, x + w, y + h * 0.55);
    ctx.lineTo(x + w, y + h * 0.7);
    ctx.lineTo(x, y + h * 0.7);
    ctx.closePath();
    ctx.fill();

    // Crowd hint
    const colors = [stadium.crowdColor1, stadium.crowdColor2, stadium.crowdColor3];
    for (let cx = x + 2; cx < x + w; cx += 4) {
      const hash = (cx * 13) & 0xFFFF;
      if ((hash % 100) / 100 > stadium.crowdDensity * 0.5) continue;
      ctx.fillStyle = this.renderer.mixColor(colors[hash % 3], '#3a3a3a', 0.4);
      ctx.fillRect(cx, y + h * 0.42 + (hash % 8), 2, 2);
    }

    // Pitch (perspective)
    ctx.fillStyle = stadium.grassColor1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.7);
    ctx.lineTo(x + w * 0.85, y + h * 0.7);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    // Pitch stripes
    ctx.fillStyle = stadium.grassColor2;
    for (let i = 0; i < 4; i++) {
      if (i % 2 === 0) continue;
      const stripW = w / 4;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.15 + stripW * i * 0.7, y + h * 0.7);
      ctx.lineTo(x + w * 0.15 + stripW * (i + 1) * 0.7, y + h * 0.7);
      ctx.lineTo(x + w * 0.0 + stripW * (i + 1), y + h);
      ctx.lineTo(x + w * 0.0 + stripW * i, y + h);
      ctx.closePath();
      ctx.fill();
    }

    // Floodlight markers
    if (stadium.floodlights) {
      ctx.fillStyle = 'rgba(255,255,210,0.9)';
      ctx.beginPath(); ctx.arc(x + w * 0.15, y + h * 0.18, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.85, y + h * 0.18, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // === MATCH ===
  startMatch() {
    const homeTeam = TEAMS[this.selectedHomeTeam];
    const awayTeam = TEAMS[this.selectedAwayTeam];
    const stadium = STADIUMS[this.selectedStadium];

    engine.setupMatch(homeTeam, awayTeam);
    this.renderer.setStadium(stadium);
    this.renderer.resize();

    // Set AI difficulty based on away team rating
    ai.difficulty = 0.4 + (awayTeam.rating / 100) * 0.5;

    this.screen = 'playing';
  }

  updatePlaying(dt) {
    // Pause toggle
    if (input.pauseJustPressed()) {
      if (engine.state === 'paused') {
        engine.togglePause();
      } else if (engine.state === 'playing') {
        engine.togglePause();
        this.pauseMenuIndex = 0;
      }
      this.menuInputCooldown = 0.3;
    }

    // Pause menu navigation
    if (engine.state === 'paused') {
      if (this.menuInputCooldown <= 0) {
        if (input.moveY < -0.5) {
          this.pauseMenuIndex = Math.max(0, (this.pauseMenuIndex || 0) - 1);
          this.menuInputCooldown = 0.18;
          audio.playNavigate();
        } else if (input.moveY > 0.5) {
          this.pauseMenuIndex = Math.min(2, (this.pauseMenuIndex || 0) + 1);
          this.menuInputCooldown = 0.18;
          audio.playNavigate();
        }
        if (input.passJustPressed() || input.shootJustPressed()) {
          this.selectPauseMenuItem(this.pauseMenuIndex || 0);
        }
      }
      return;
    }

    // Full time -> rematch with same teams (any button) or quit (tackle)
    if (engine.state === 'fulltime') {
      if (input.passJustPressed() || input.shootJustPressed()) {
        engine.restartMatch();
        audio.startCrowd();
        this.menuInputCooldown = 0.5;
      } else if (input.tackleJustPressed()) {
        this.quitToMenu();
        this.menuInputCooldown = 0.5;
      }
      return;
    }

    engine.update(dt, input);
  }

  selectPauseMenuItem(index) {
    audio.playSelect();
    if (index === 0) {
      engine.togglePause();
    } else if (index === 1) {
      engine.restartMatch();
      audio.startCrowd();
    } else {
      this.quitToMenu();
    }
    this.menuInputCooldown = 0.3;
  }

  quitToMenu() {
    this.screen = 'title';
    audio.stopCrowd();
    engine.state = 'idle';
  }

  renderPlaying() {
    this.renderer.render();
  }

  // === CLICK HANDLER ===
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = this.renderer.width;
    const h = this.renderer.height;

    audio.init();
    audio.resume();

    if (this.screen === 'title') {
      // Check if click is near the "Controls" text area (bottom portion)
      if (y > h * 0.85) {
        this.screen = 'controls';
        audio.playSelect();
        return;
      }
      this.screen = 'team_select';
      this.selectingTeam = 'home';
      this.highlightedTeam = this.selectedHomeTeam;
      audio.playSelect();
      return;
    }

    if (this.screen === 'controls') {
      this.screen = 'title';
      audio.playSelect();
      return;
    }

    if (this.screen === 'team_select') {
      // Layout matches renderTeamSelect: scrollable list on the left.
      const showPreview = w >= 720;
      const previewW = showPreview ? Math.min(380, w * 0.36) : 0;
      const listX = 20;
      const barH = Math.min(58, h * 0.085);
      const listY = barH + 18;
      const listW = w - previewW - (showPreview ? 60 : 40);
      const listH = h - listY - 50;
      const rowH = 38;
      const visibleTop = listY + 30;
      const visibleH = listH - 38;
      const scrollY = this.teamScrollOffset * rowH;

      // Only register clicks inside the list area
      if (x >= listX && x <= listX + listW && y >= visibleTop && y <= visibleTop + visibleH) {
        for (let i = 0; i < TEAMS.length; i++) {
          const iy = visibleTop + i * rowH - scrollY;
          if (y >= iy && y <= iy + rowH) {
            // First tap highlights, second tap (same row) selects — feels
            // safer on mobile than instant select.
            if (this.highlightedTeam === i) {
              if (this.selectingTeam === 'home') {
                this.selectedHomeTeam = i;
                this.selectingTeam = 'away';
                this.highlightedTeam = this.selectedAwayTeam;
              } else {
                this.selectedAwayTeam = i;
                this.screen = 'stadium_select';
              }
              audio.playSelect();
            } else {
              this.highlightedTeam = i;
              audio.playNavigate();
            }
            return;
          }
        }
      }
    }

    if (this.screen === 'stadium_select') {
      // Thumbnail strip layout matches renderStadiumSelect
      const stripY = h - 110;
      const stripH = 70;
      const thumbW = Math.min(150, w * 0.16);
      const thumbGap = 12;
      const totalStripW = STADIUMS.length * thumbW + (STADIUMS.length - 1) * thumbGap;
      const stripX = (w - totalStripW) / 2;

      for (let i = 0; i < STADIUMS.length; i++) {
        const tx = stripX + i * (thumbW + thumbGap);
        if (x >= tx && x <= tx + thumbW && y >= stripY - 6 && y <= stripY + stripH + 22) {
          // Tap the highlighted thumbnail again to kick off; otherwise just preview
          if (this.selectedStadium === i) {
            this.startMatch();
            audio.playSelect();
          } else {
            this.selectedStadium = i;
            audio.playNavigate();
          }
          return;
        }
      }
    }

    if (this.screen === 'playing' && engine.state === 'fulltime') {
      engine.restartMatch();
      audio.startCrowd();
      return;
    }

    // Pause menu taps — figure out which row was hit
    if (this.screen === 'playing' && engine.state === 'paused') {
      const panelW = Math.min(360, w * 0.7);
      const panelH = Math.min(360, h * 0.7);
      const panelX = (w - panelW) / 2;
      const panelY = (h - panelH) / 2;
      const items = 3;
      const itemH = 48;
      const itemsStartY = panelY + panelH - itemH * items - 24;
      for (let i = 0; i < items; i++) {
        const iy = itemsStartY + i * itemH;
        if (x >= panelX + 18 && x <= panelX + panelW - 18 && y >= iy + 4 && y <= iy + itemH - 4) {
          this.pauseMenuIndex = i;
          this.selectPauseMenuItem(i);
          return;
        }
      }
    }
  }
}

// Start the app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
