// Brennan's Soccer Showdown - Main Application
// Menu system, game flow, and main loop

class App {
  constructor() {
    this.screen = 'title'; // title, team_select, stadium_select, playing, fulltime
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

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // === TITLE SCREEN ===
  updateTitle(dt) {
    if ((input.btnPass || input.btnShoot) && this.menuInputCooldown <= 0) {
      audio.init();
      audio.resume();
      audio.playSelect();
      this.screen = 'team_select';
      this.selectingTeam = 'home';
      this.highlightedTeam = this.selectedHomeTeam;
      this.menuInputCooldown = 0.3;
    }
  }

  renderTitle() {
    const ctx = this.renderer.ctx;
    const w = this.renderer.width;
    const h = this.renderer.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(0.5, '#1a3a5c');
    grad.addColorStop(1, '#0d2137');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Animated field lines in background
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const y = (h * 0.3) + i * 30 + Math.sin(this.titleAnim + i * 0.5) * 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Floating soccer ball in background
    const ballY = h * 0.3 + Math.sin(this.titleAnim * 1.5) * 20;
    ctx.save();
    ctx.translate(w * 0.5, ballY);
    ctx.rotate(this.titleAnim);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(w, h) * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Title
    const titleSize = Math.min(w * 0.08, 60);
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${titleSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillText("BRENNAN'S", w / 2, h * 0.3);

    const subSize = Math.min(w * 0.12, 80);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${subSize}px Arial`;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    ctx.fillText('SOCCER', w / 2, h * 0.3 + subSize * 0.9);
    ctx.fillText('SHOWDOWN', w / 2, h * 0.3 + subSize * 1.8);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#6CABDD';
    ctx.font = `${Math.min(w * 0.02, 16)}px Arial`;
    ctx.fillText('32 TEAMS  |  3 STADIUMS  |  PURE FOOTBALL', w / 2, h * 0.3 + subSize * 2.3);

    // Start prompt (pulsing)
    const pulse = 0.5 + Math.sin(this.titleAnim * 3) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse * 0.6})`;
    ctx.font = `bold ${Math.min(w * 0.03, 22)}px Arial`;
    ctx.fillText('PRESS SPACE OR TAP TO START', w / 2, h * 0.85);

    // Controller hint
    if (input.hasGamepad()) {
      ctx.fillStyle = 'rgba(100,255,100,0.6)';
      ctx.font = `${Math.min(w * 0.018, 14)}px Arial`;
      ctx.fillText('Xbox Controller Detected!', w / 2, h * 0.9);
    }

    // Version
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '11px Arial';
    ctx.fillText('v1.0', w / 2, h * 0.96);
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

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#1a2a3c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.min(w * 0.04, 32)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(this.selectingTeam === 'home' ? 'SELECT HOME TEAM' : 'SELECT AWAY TEAM', w / 2, 40);

    // Already selected team display
    if (this.selectingTeam === 'away') {
      const homeTeam = TEAMS[this.selectedHomeTeam];
      ctx.fillStyle = homeTeam.primaryColor;
      ctx.fillRect(20, 10, 30, 30);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('HOME: ' + homeTeam.shortName, 58, 30);
    }

    // Team grid
    const cols = Math.max(2, Math.min(4, Math.floor(w / 200)));
    const itemW = Math.min(200, (w - 40) / cols - 10);
    const itemH = 50;
    const startX = (w - (cols * (itemW + 10))) / 2;
    const startY = 65;
    const maxVisible = Math.floor((h - startY - 60) / (itemH + 6));

    // Scroll to keep highlighted visible
    const highlightRow = Math.floor(this.highlightedTeam / cols);
    const maxScroll = Math.max(0, Math.ceil(TEAMS.length / cols) - maxVisible);
    const idealScroll = Math.max(0, Math.min(maxScroll, highlightRow - Math.floor(maxVisible / 2)));
    this.teamScrollOffset += (idealScroll - this.teamScrollOffset) * 0.2;

    const scrollY = this.teamScrollOffset * (itemH + 6);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, startY - 5, w, h - startY - 50);
    ctx.clip();

    for (let i = 0; i < TEAMS.length; i++) {
      const team = TEAMS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (itemW + 10);
      const y = startY + row * (itemH + 6) - scrollY;

      if (y < startY - itemH || y > h) continue;

      const isHighlighted = i === this.highlightedTeam;
      const isSelected = (this.selectingTeam === 'away' && i === this.selectedHomeTeam);

      // Background
      if (isHighlighted) {
        ctx.fillStyle = 'rgba(255,215,0,0.3)';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
      } else if (isSelected) {
        ctx.fillStyle = 'rgba(100,200,100,0.2)';
        ctx.strokeStyle = 'rgba(100,200,100,0.5)';
        ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
      }

      this.renderer.roundRect(ctx, x, y, itemW, itemH, 6);
      ctx.fill();
      this.renderer.roundRect(ctx, x, y, itemW, itemH, 6);
      ctx.stroke();

      // Team color swatch
      ctx.fillStyle = team.primaryColor;
      ctx.fillRect(x + 8, y + 8, 32, 32);
      if (team.kitPattern === 'stripes') {
        ctx.fillStyle = team.secondaryColor;
        ctx.fillRect(x + 16, y + 8, 8, 32);
        ctx.fillRect(x + 32, y + 8, 8, 32);
      }
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 8, y + 8, 32, 32);

      // Team name
      ctx.fillStyle = isHighlighted ? '#FFD700' : '#fff';
      ctx.font = `bold ${Math.min(13, itemW * 0.07)}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(team.name, x + 46, y + 20);

      // Rating and league
      ctx.fillStyle = '#888';
      ctx.font = '10px Arial';
      ctx.fillText(`${team.league} | OVR ${team.rating}`, x + 46, y + 36);

      // Star rating
      const stars = Math.round(team.rating / 20);
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('★'.repeat(stars), x + itemW - 8, y + 20);
    }

    ctx.restore();

    // Preview of highlighted team
    const previewTeam = TEAMS[this.highlightedTeam];
    if (previewTeam) {
      const px = w - 200;
      const py = h - 160;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.renderer.roundRect(ctx, w - 210, py - 5, 205, 160, 8);
      ctx.fill();

      ctx.fillStyle = previewTeam.primaryColor;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(previewTeam.name, px + 95, py + 15);

      ctx.fillStyle = '#aaa';
      ctx.font = '11px Arial';
      ctx.fillText(`${previewTeam.country} | ${previewTeam.league}`, px + 95, py + 32);

      // Player list
      ctx.textAlign = 'left';
      ctx.font = '11px Arial';
      previewTeam.players.forEach((pl, i) => {
        ctx.fillStyle = '#888';
        ctx.fillText(pl.pos, px + 5, py + 52 + i * 20);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${pl.name} #${pl.num}`, px + 35, py + 52 + i * 20);
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round((pl.speed + pl.shooting + pl.passing + pl.defense) / 4), px + 190, py + 52 + i * 20);
        ctx.textAlign = 'left';
      });
    }

    // Footer hints
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      input.isMobile ? 'Tap a team to select' : 'Arrow Keys: Navigate | SPACE: Select | C: Back',
      w / 2, h - 15
    );
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

    const stadium = STADIUMS[this.selectedStadium];

    // Background with stadium colors
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    stadium.skyGradient.forEach((c, i) => {
      grad.addColorStop(i / (stadium.skyGradient.length - 1), c);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.min(w * 0.04, 32)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('SELECT STADIUM', w / 2, 40);

    // Match info
    const homeTeam = TEAMS[this.selectedHomeTeam];
    const awayTeam = TEAMS[this.selectedAwayTeam];

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.min(w * 0.03, 22)}px Arial`;
    ctx.fillText(`${homeTeam.shortName}  vs  ${awayTeam.shortName}`, w / 2, 75);

    // Stadium cards
    const cardW = Math.min(300, w * 0.35);
    const cardH = Math.min(350, h * 0.55);
    const totalCardsW = STADIUMS.length * (cardW + 20);
    const startX = (w - totalCardsW) / 2;

    for (let i = 0; i < STADIUMS.length; i++) {
      const s = STADIUMS[i];
      const x = startX + i * (cardW + 20) + 10;
      const y = h * 0.2;
      const isSelected = i === this.selectedStadium;

      // Card background
      ctx.fillStyle = isSelected ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.3)';
      this.renderer.roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#FFD700' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isSelected ? 3 : 1;
      this.renderer.roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.stroke();

      // Mini stadium preview
      const previewH = cardH * 0.5;
      const previewY = y + 10;

      // Sky
      const skyGrad = ctx.createLinearGradient(0, previewY, 0, previewY + previewH);
      s.skyGradient.forEach((c, idx) => {
        skyGrad.addColorStop(idx / (s.skyGradient.length - 1), c);
      });
      ctx.fillStyle = skyGrad;
      this.renderer.roundRect(ctx, x + 10, previewY, cardW - 20, previewH, 6);
      ctx.fill();

      // Mini pitch
      const pitchY = previewY + previewH * 0.5;
      const pitchH = previewH * 0.45;
      ctx.fillStyle = s.grassColor1;
      ctx.fillRect(x + 30, pitchY, cardW - 60, pitchH);

      // Pitch lines
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 30, pitchY, cardW - 60, pitchH);
      ctx.beginPath();
      ctx.moveTo(x + cardW / 2, pitchY);
      ctx.lineTo(x + cardW / 2, pitchY + pitchH);
      ctx.stroke();

      // Stands
      ctx.fillStyle = s.standColor;
      ctx.fillRect(x + 10, previewY + previewH * 0.3, cardW - 20, previewH * 0.2);
      ctx.fillRect(x + 10, pitchY + pitchH, cardW - 20, previewH * 0.2);

      // Crowd dots
      ctx.fillStyle = s.crowdColor1;
      for (let cx = x + 15; cx < x + cardW - 15; cx += 6) {
        for (let cy = previewY + previewH * 0.32; cy < previewY + previewH * 0.48; cy += 5) {
          if (Math.random() < s.crowdDensity) {
            ctx.fillRect(cx, cy, 3, 3);
          }
        }
      }

      // Stadium name
      ctx.fillStyle = isSelected ? '#FFD700' : '#fff';
      ctx.font = `bold ${Math.min(18, cardW * 0.06)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(s.name, x + cardW / 2, previewY + previewH + 30);

      ctx.fillStyle = '#aaa';
      ctx.font = `${Math.min(13, cardW * 0.045)}px Arial`;
      ctx.fillText(s.subtitle, x + cardW / 2, previewY + previewH + 50);

      ctx.fillText(`Capacity: ${s.capacity}`, x + cardW / 2, previewY + previewH + 68);

      ctx.fillStyle = '#777';
      ctx.font = `italic ${Math.min(11, cardW * 0.04)}px Arial`;
      ctx.fillText(s.description, x + cardW / 2, previewY + previewH + 88);

      // Features
      const features = [];
      if (s.floodlights) features.push('Floodlights');
      if (s.hasRoof) features.push('Covered');
      if (s.weatherEffect) features.push(s.weatherEffect === 'sun' ? 'Sunny' : s.weatherEffect);

      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.fillText(features.join(' | '), x + cardW / 2, previewY + previewH + 105);
    }

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      input.isMobile ? 'Tap a stadium to play' : 'Arrow Keys: Choose | SPACE: Start Match | C: Back',
      w / 2, h - 15
    );
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
    // Pause
    if (input.pauseJustPressed()) {
      engine.togglePause();
      this.menuInputCooldown = 0.3;
    }

    // Full time -> return to menu
    if (engine.state === 'fulltime') {
      if (input.passJustPressed() || input.shootJustPressed()) {
        this.screen = 'title';
        audio.stopCrowd();
        engine.state = 'idle';
        this.menuInputCooldown = 0.5;
      }
      return;
    }

    engine.update(dt, input);
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
      this.screen = 'team_select';
      this.selectingTeam = 'home';
      this.highlightedTeam = this.selectedHomeTeam;
      audio.playSelect();
      return;
    }

    if (this.screen === 'team_select') {
      // Calculate which team was clicked
      const cols = Math.max(2, Math.min(4, Math.floor(w / 200)));
      const itemW = Math.min(200, (w - 40) / cols - 10);
      const itemH = 50;
      const startX = (w - (cols * (itemW + 10))) / 2;
      const startY = 65;
      const scrollY = this.teamScrollOffset * (itemH + 6);

      for (let i = 0; i < TEAMS.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const ix = startX + col * (itemW + 10);
        const iy = startY + row * (itemH + 6) - scrollY;

        if (x >= ix && x <= ix + itemW && y >= iy && y <= iy + itemH) {
          this.highlightedTeam = i;

          if (this.selectingTeam === 'home') {
            this.selectedHomeTeam = i;
            this.selectingTeam = 'away';
            this.highlightedTeam = this.selectedAwayTeam;
          } else {
            this.selectedAwayTeam = i;
            this.screen = 'stadium_select';
          }
          audio.playSelect();
          return;
        }
      }
    }

    if (this.screen === 'stadium_select') {
      // Check which stadium was clicked
      const cardW = Math.min(300, w * 0.35);
      const totalCardsW = STADIUMS.length * (cardW + 20);
      const startX = (w - totalCardsW) / 2;

      for (let i = 0; i < STADIUMS.length; i++) {
        const cx = startX + i * (cardW + 20) + 10;
        if (x >= cx && x <= cx + cardW) {
          this.selectedStadium = i;
          this.startMatch();
          audio.playSelect();
          return;
        }
      }
    }

    if (this.screen === 'playing' && engine.state === 'fulltime') {
      this.screen = 'title';
      audio.stopCrowd();
      engine.state = 'idle';
    }
  }
}

// Start the app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
