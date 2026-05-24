// Brennan's Soccer Showdown - Game Engine v2
// Enhanced physics, ball trails, screen shake, stamina, smarter controls

class GameEngine {
  constructor() {
    this.PITCH_W = 1050;
    this.PITCH_H = 680;
    this.PITCH_MARGIN = 80;
    this.GOAL_WIDTH = 12;
    this.GOAL_HEIGHT = 120;

    this.pitch = {
      x: this.PITCH_MARGIN, y: this.PITCH_MARGIN,
      width: this.PITCH_W, height: this.PITCH_H,
      centerX: this.PITCH_MARGIN + this.PITCH_W / 2,
      centerY: this.PITCH_MARGIN + this.PITCH_H / 2,
      goalLineLeft: this.PITCH_MARGIN,
      goalLineRight: this.PITCH_MARGIN + this.PITCH_W,
      goalTop: this.PITCH_MARGIN + this.PITCH_H / 2 - this.GOAL_HEIGHT / 2,
      goalBottom: this.PITCH_MARGIN + this.PITCH_H / 2 + this.GOAL_HEIGHT / 2,
      totalWidth: this.PITCH_W + this.PITCH_MARGIN * 2,
      totalHeight: this.PITCH_H + this.PITCH_MARGIN * 2,
    };

    this.state = 'idle';
    this.half = 1;
    this.matchTime = 0;
    this.halfDuration = 180;
    this.score = { home: 0, away: 0 };
    this.lastGoalTeam = null;
    this.stateTimer = 0;

    this.homeTeam = null;
    this.awayTeam = null;
    this.homeTeamData = null;
    this.awayTeamData = null;
    this.homePlayers = [];
    this.awayPlayers = [];

    this.ball = {
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      owner: null, speed: 0, rotation: 0, lastKicker: null,
      trail: [], // [{x,y,age}]
      curve: 0, // spin/curve factor
    };

    this.controlledPlayer = null;
    this.userTeamSide = 'home';
    this.particles = [];
    this.goalScorer = null;
    this.goalEvents = []; // log of goal events for display

    this.shootPower = 0;
    this.isChargingShot = false;

    // Screen shake
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;

    // Slow motion for goal replays
    this.slowMo = 1.0;
    this.slowMoTimer = 0;

    // Commentary text
    this.commentary = '';
    this.commentaryTimer = 0;

    // Match stats per team
    this.stats = this._freshStats();
    // Score pop animation timer (renderer reads this)
    this.scorePopTime = 0;
    this.scorePopSide = null;
  }

  _freshStats() {
    const blank = () => ({ shots: 0, shotsOnTarget: 0, passes: 0, tackles: 0, possessionTicks: 0 });
    return { home: blank(), away: blank() };
  }

  setupMatch(homeTeamData, awayTeamData) {
    this.homeTeamData = homeTeamData;
    this.awayTeamData = awayTeamData;
    this.score = { home: 0, away: 0 };
    this.half = 1;
    this.matchTime = 0;
    this.goalEvents = [];
    this.stats = this._freshStats();
    this.scorePopTime = 0;
    this.scorePopSide = null;
    this.particles = [];
    this.commentary = '';
    this.commentaryTimer = 0;
    this.slowMo = 1.0;

    this.homePlayers = this.createPlayers(homeTeamData, 'left');
    this.awayPlayers = this.createPlayers(awayTeamData, 'right');

    this.resetPositions();
    this.ball.owner = null;
    this.ball.trail = [];
    this.state = 'kickoff';
    this.stateTimer = 2.0;
    this.lastGoalTeam = null;

    this.controlledPlayer = this.homePlayers.find(p => p.pos === 'MID') || this.homePlayers[3];
    this.setCommentary(`${homeTeamData.shortName} vs ${awayTeamData.shortName} - KICK OFF!`);
  }

  createPlayers(teamData, side) {
    const p = this.pitch;
    const isLeft = side === 'left';
    const players = [];
    const positions = [
      { pos: 'GK', rx: 0.05, ry: 0.5 },
      { pos: 'DEF', rx: 0.2, ry: 0.3 },
      { pos: 'DEF', rx: 0.2, ry: 0.7 },
      { pos: 'MID', rx: 0.38, ry: 0.5 },
      { pos: 'FWD', rx: 0.48, ry: 0.5 },
    ];

    teamData.players.forEach((pd, i) => {
      const fp = positions[i];
      const homeX = isLeft ? p.x + fp.rx * p.width : p.x + (1 - fp.rx) * p.width;
      const homeY = p.y + fp.ry * p.height;

      players.push({
        ...pd,
        x: homeX, y: homeY, vx: 0, vy: 0,
        homeX, homeY,
        teamSide: side, teamData: teamData,
        angle: isLeft ? 0 : Math.PI,
        targetAngle: isLeft ? 0 : Math.PI,
        runFrame: 0,
        kickCooldown: 0, tackleCooldown: 0,
        idx: i,
        stamina: 100, // new: sprint stamina
        staminaRecovery: 0,
      });
    });
    return players;
  }

  resetPositions() {
    const p = this.pitch;
    const resetTeam = (players, side) => {
      const isLeft = side === 'left';
      const positions = [
        { rx: 0.05, ry: 0.5 }, { rx: 0.2, ry: 0.3 },
        { rx: 0.2, ry: 0.7 }, { rx: 0.38, ry: 0.5 }, { rx: 0.48, ry: 0.5 },
      ];
      players.forEach((pl, i) => {
        const fp = positions[i];
        pl.homeX = isLeft ? p.x + fp.rx * p.width : p.x + (1 - fp.rx) * p.width;
        pl.homeY = p.y + fp.ry * p.height;
        pl.x = pl.homeX; pl.y = pl.homeY;
        pl.vx = 0; pl.vy = 0;
        pl.stamina = 100;
      });
    };
    resetTeam(this.homePlayers, this.homePlayers[0]?.teamSide || 'left');
    resetTeam(this.awayPlayers, this.awayPlayers[0]?.teamSide || 'right');

    this.ball.x = p.centerX; this.ball.y = p.centerY; this.ball.z = 0;
    this.ball.vx = 0; this.ball.vy = 0; this.ball.vz = 0;
    this.ball.owner = null; this.ball.lastKicker = null;
    this.ball.trail = []; this.ball.curve = 0;
  }

  update(dt, inputState) {
    if (this.state === 'paused') return;

    // Apply slow motion
    const effectiveDt = dt * this.slowMo;

    // Slow mo decay
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      if (this.slowMoTimer <= 0) this.slowMo = 1.0;
    }

    // Screen shake decay
    if (this.shakeIntensity > 0) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.3) { this.shakeIntensity = 0; this.shakeX = 0; this.shakeY = 0; }
    }

    // Commentary timer
    if (this.commentaryTimer > 0) this.commentaryTimer -= dt;

    this.stateTimer -= effectiveDt;

    switch (this.state) {
      case 'kickoff':
        if (this.stateTimer <= 0) {
          this.state = 'playing';
          audio.playWhistle();
          audio.startCrowd();
          const kickoffTeam = this.lastGoalTeam === 'home' ? this.awayPlayers : this.homePlayers;
          const fwd = kickoffTeam.find(p => p.pos === 'FWD');
          if (fwd) { this.ball.owner = fwd; this.ball.x = fwd.x; this.ball.y = fwd.y; }
        }
        return;
      case 'goal_scored':
        this.updateParticles(dt); // real dt for particles even in slow-mo
        if (this.stateTimer <= 0) {
          this.resetPositions(); this.state = 'kickoff'; this.stateTimer = 1.5;
        }
        return;
      case 'halftime':
        if (this.stateTimer <= 0) {
          this.half = 2; this.swapSides(); this.resetPositions();
          this.state = 'kickoff'; this.stateTimer = 1.5;
          this.setCommentary('Second half underway!');
        }
        return;
      case 'fulltime': return;
      case 'playing': break;
      default: return;
    }

    this.matchTime += effectiveDt;
    if (this.matchTime >= this.halfDuration) {
      if (this.half === 1) {
        this.state = 'halftime'; this.stateTimer = 3; this.matchTime = 0;
        audio.playWhistle(true); audio.stopCrowd();
        this.setCommentary('Half time!');
        return;
      } else {
        this.state = 'fulltime'; audio.playWhistle(true); audio.stopCrowd();
        return;
      }
    }

    this.updateControlledPlayer(effectiveDt, inputState);
    this.updateAllAI(effectiveDt);
    this.updatePlayers(effectiveDt);
    this.updateBall(effectiveDt);
    this.checkGoal();
    this.checkBounds();
    this.updateParticles(dt);

    // Possession tick — whoever owns the ball gets a tick this frame
    if (this.ball.owner) {
      const side = this.homePlayers.includes(this.ball.owner) ? 'home' : 'away';
      this.stats[side].possessionTicks++;
    }

    if (this.scorePopTime > 0) this.scorePopTime -= dt;
  }

  updateControlledPlayer(dt, inp) {
    const pl = this.controlledPlayer;
    if (!pl) return;

    // Stamina-based sprint
    const canSprint = pl.stamina > 10 && inp.btnSprint;
    if (canSprint) {
      pl.stamina = Math.max(0, pl.stamina - dt * 30);
    } else {
      pl.stamina = Math.min(100, pl.stamina + dt * 15);
    }

    const sprintMult = canSprint ? 1.45 : 1.0;
    const speed = this.getPlayerSpeed(pl) * sprintMult;

    // Smooth acceleration instead of instant velocity
    const targetVx = inp.moveX * speed;
    const targetVy = inp.moveY * speed;
    const accel = 0.25;
    pl.vx += (targetVx - pl.vx) * accel;
    pl.vy += (targetVy - pl.vy) * accel;

    if (Math.abs(inp.moveX) > 0.1 || Math.abs(inp.moveY) > 0.1) {
      pl.targetAngle = Math.atan2(inp.moveY, inp.moveX);
    }
    // Smooth angle rotation
    let angleDiff = pl.targetAngle - pl.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    pl.angle += angleDiff * 0.2;

    const hasBall = this.ball.owner === pl;

    if (inp.btnShoot && hasBall) {
      if (!this.isChargingShot) { this.isChargingShot = true; this.shootPower = 0; }
      this.shootPower = Math.min(1, this.shootPower + dt * 2.2);
    } else if (this.isChargingShot && !inp.btnShoot) {
      this.performShot(pl, this.shootPower);
      this.isChargingShot = false; this.shootPower = 0;
    }

    if (inp.passJustPressed()) {
      if (hasBall) { this.performPass(pl); }
      else { this.switchPlayer(); }
    }

    if (inp.tackleJustPressed() && !hasBall) {
      this.performTackle(pl);
    }
  }

  switchPlayer() {
    const myTeam = this.userTeamSide === 'home' ? this.homePlayers : this.awayPlayers;
    let closest = null;
    let closestDist = Infinity;

    for (const p of myTeam) {
      if (p === this.controlledPlayer || p.pos === 'GK') continue;
      const d = this.distTo(p, this.ball);
      if (d < closestDist) { closestDist = d; closest = p; }
    }
    if (closest) this.controlledPlayer = closest;
  }

  // Auto-switch to best player when ball becomes loose
  autoSwitchOnLoose() {
    if (this.ball.owner) return;
    const myTeam = this.userTeamSide === 'home' ? this.homePlayers : this.awayPlayers;
    let closest = null;
    let closestDist = Infinity;
    for (const p of myTeam) {
      if (p.pos === 'GK') continue;
      const d = this.distTo(p, this.ball);
      if (d < closestDist) { closestDist = d; closest = p; }
    }
    if (closest && closestDist < this.distTo(this.controlledPlayer, this.ball) - 30) {
      this.controlledPlayer = closest;
    }
  }

  performPass(player) {
    if (player.kickCooldown > 0) return;
    const myTeam = player.teamSide === 'left' ? this.homePlayers : this.awayPlayers;

    let bestTarget = null;
    let bestScore = -Infinity;

    for (const tm of myTeam) {
      if (tm === player || tm.pos === 'GK') continue;
      const dx = tm.x - player.x;
      const dy = tm.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30 || dist > 450) continue;

      const angle = Math.atan2(dy, dx);
      let angleDiff = Math.abs(angle - player.angle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      // Weighted scoring: direction match, distance, forward position
      const score = -angleDiff * 80 - dist * 0.2;
      if (score > bestScore) { bestScore = score; bestTarget = tm; }
    }

    if (bestTarget) {
      const dx = bestTarget.x - player.x;
      const dy = bestTarget.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Lead the target slightly based on their velocity
      const leadX = bestTarget.vx * 8;
      const leadY = bestTarget.vy * 8;
      const tdx = dx + leadX;
      const tdy = dy + leadY;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

      const passSpeed = Math.min(13, 5 + dist * 0.022) * (1 + player.passing / 250);
      this.ball.owner = null;
      this.ball.vx = (tdx / tdist) * passSpeed;
      this.ball.vy = (tdy / tdist) * passSpeed;
      this.ball.vz = 0.8;
      this.ball.lastKicker = player;
      this.ball.curve = 0;
      player.kickCooldown = 0.3;
      audio.playKick(0.5);
      this.stats[player.teamSide === 'left' ? 'home' : 'away'].passes++;

      // Grass spray particles
      this.spawnGrassSpray(player.x, player.y, 3);
    }
  }

  performShot(player, power) {
    if (player.kickCooldown > 0) return;
    const attackRight = player.teamSide === 'left';
    const goalX = attackRight ? this.pitch.goalLineRight : this.pitch.goalLineLeft;
    const goalY = this.pitch.centerY + (Math.random() - 0.5) * this.GOAL_HEIGHT * 0.7;

    const dx = goalX - player.x;
    const dy = goalY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const shootSpeed = (8 + power * 14) * (1 + player.shooting / 250);
    const accuracy = player.shooting / 100;
    const spread = (1 - accuracy) * 0.25 * (1 - power * 0.3); // Higher power = slightly less spread

    // Add curve based on player angle vs shot direction
    const shotAngle = Math.atan2(dy, dx);
    let angleDiff = shotAngle - player.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const curve = angleDiff * 0.015 * power;

    this.ball.owner = null;
    this.ball.vx = (dx / dist) * shootSpeed + (Math.random() - 0.5) * spread * shootSpeed;
    this.ball.vy = (dy / dist) * shootSpeed + (Math.random() - 0.5) * spread * shootSpeed;
    this.ball.vz = 1.5 + power * 5;
    this.ball.lastKicker = player;
    this.ball.curve = curve;
    player.kickCooldown = 0.5;

    audio.playKick(0.5 + power * 0.5);
    this.stats[player.teamSide === 'left' ? 'home' : 'away'].shots++;

    // More dramatic shot particles
    const particleCount = 5 + Math.floor(power * 8);
    for (let i = 0; i < particleCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3 * power;
      this.particles.push({
        x: player.x, y: player.y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.3 + Math.random() * 0.3, maxLife: 0.6,
        color: power > 0.7 ? '#ff6600' : '#ffffff',
        size: 2 + Math.random() * 3, type: 'spark',
      });
    }
    this.spawnGrassSpray(player.x, player.y, 5);

    if (power > 0.8) {
      this.shakeIntensity = 4 + power * 4;
    }
  }

  performTackle(player) {
    if (player.tackleCooldown > 0) return;
    const lungeSpeed = 9;
    player.vx = Math.cos(player.angle) * lungeSpeed;
    player.vy = Math.sin(player.angle) * lungeSpeed;
    player.tackleCooldown = 0.7;

    const allPlayers = [...this.homePlayers, ...this.awayPlayers];
    for (const other of allPlayers) {
      if (other.teamSide === player.teamSide) continue;
      if (this.ball.owner !== other) continue;
      const dist = this.distTo(player, other);
      if (dist < 40) {
        const successChance = 0.35 + (player.defense / 100) * 0.55;
        if (Math.random() < successChance) {
          this.ball.owner = null;
          this.ball.vx = Math.cos(player.angle) * 3.5;
          this.ball.vy = Math.sin(player.angle) * 3.5;
          this.ball.curve = 0;
          audio.playTackle();
          this.spawnGrassSpray(other.x, other.y, 6);
          this.shakeIntensity = 3;
          this.stats[player.teamSide === 'left' ? 'home' : 'away'].tackles++;
        }
        break;
      }
    }
    // Slide tackle grass trail
    this.spawnGrassSpray(player.x, player.y, 4);
  }

  spawnGrassSpray(x, y, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y: y + 5,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2 - 1,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        color: '#4a8c3c',
        size: 2 + Math.random() * 2,
        type: 'grass',
      });
    }
  }

  updateAllAI(dt) {
    const allPlayers = [...this.homePlayers, ...this.awayPlayers];
    for (const player of allPlayers) {
      if (player === this.controlledPlayer) continue;
      const isHomeTeam = this.homePlayers.includes(player);
      const myTeam = isHomeTeam ? this.homePlayers : this.awayPlayers;
      const oppTeam = isHomeTeam ? this.awayPlayers : this.homePlayers;
      const isUserTeam = (isHomeTeam && this.userTeamSide === 'home') ||
                          (!isHomeTeam && this.userTeamSide === 'away');

      const actions = ai.update(player, myTeam, oppTeam, this.ball, this.pitch, dt, isUserTeam);
      const canSprint = player.stamina > 10 && actions.sprint;
      if (canSprint) player.stamina = Math.max(0, player.stamina - dt * 25);
      else player.stamina = Math.min(100, player.stamina + dt * 12);

      const speed = this.getPlayerSpeed(player) * (canSprint ? 1.35 : 1.0);
      // Smooth acceleration for AI too
      const targetVx = actions.moveX * speed;
      const targetVy = actions.moveY * speed;
      player.vx += (targetVx - player.vx) * 0.2;
      player.vy += (targetVy - player.vy) * 0.2;

      if (Math.abs(actions.moveX) > 0.1 || Math.abs(actions.moveY) > 0.1) {
        player.targetAngle = Math.atan2(actions.moveY, actions.moveX);
      }
      let ad = player.targetAngle - player.angle;
      while (ad > Math.PI) ad -= Math.PI * 2;
      while (ad < -Math.PI) ad += Math.PI * 2;
      player.angle += ad * 0.15;

      if (actions.pass && this.ball.owner === player) this.performPass(player);
      if (actions.shoot && this.ball.owner === player) this.performShot(player, 0.45 + Math.random() * 0.45);
      if (actions.tackle) this.performTackle(player);
    }
  }

  updatePlayers(dt) {
    const allPlayers = [...this.homePlayers, ...this.awayPlayers];
    for (const player of allPlayers) {
      player.x += player.vx * dt * 60;
      player.y += player.vy * dt * 60;
      player.vx *= 0.87;
      player.vy *= 0.87;

      const margin = -10;
      player.x = Math.max(this.pitch.x + margin, Math.min(this.pitch.x + this.pitch.width - margin, player.x));
      player.y = Math.max(this.pitch.y + margin, Math.min(this.pitch.y + this.pitch.height - margin, player.y));

      if (player.pos === 'GK') {
        const isLeft = player.teamSide === 'left';
        const goalX = isLeft ? this.pitch.goalLineLeft : this.pitch.goalLineRight;
        const maxDist = 90;
        const dx = player.x - goalX;
        if (Math.abs(dx) > maxDist) player.x = goalX + Math.sign(dx) * maxDist;
      }

      const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (speed > 0.5) player.runFrame += speed * dt * 10;

      player.kickCooldown = Math.max(0, player.kickCooldown - dt);
      player.tackleCooldown = Math.max(0, player.tackleCooldown - dt);

      if (!this.ball.owner && player.kickCooldown <= 0) {
        const distToBall = this.distTo(player, this.ball);
        if (distToBall < 18) {
          if (this.ball.lastKicker !== player || this.ball.speed < 2) {
            this.ball.owner = player;
            this.ball.lastKicker = null;
            this.ball.curve = 0;

            // Auto-switch user control when user team picks up ball
            const isUserTeamPlayer = (this.userTeamSide === 'home' && this.homePlayers.includes(player)) ||
                                      (this.userTeamSide === 'away' && this.awayPlayers.includes(player));
            if (isUserTeamPlayer && player.pos !== 'GK') {
              this.controlledPlayer = player;
            }
          }
        }
      }
    }

    // Player-player collision
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const a = allPlayers[i], b = allPlayers[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 16;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
        }
      }
    }
  }

  updateBall(dt) {
    const ball = this.ball;
    if (ball.owner) {
      const offset = 12;
      ball.x = ball.owner.x + Math.cos(ball.owner.angle) * offset;
      ball.y = ball.owner.y + Math.sin(ball.owner.angle) * offset;
      ball.z = 0; ball.vx = 0; ball.vy = 0; ball.vz = 0;
      ball.trail = [];
    } else {
      // Apply curve (swerve)
      if (Math.abs(ball.curve) > 0.001) {
        const perpX = -ball.vy;
        const perpY = ball.vx;
        ball.vx += perpX * ball.curve;
        ball.vy += perpY * ball.curve;
        ball.curve *= 0.96;
      }

      ball.x += ball.vx * dt * 60;
      ball.y += ball.vy * dt * 60;
      ball.z += ball.vz * dt * 60;

      ball.vz -= 0.3 * dt * 60;
      if (ball.z <= 0) {
        ball.z = 0; ball.vz = -ball.vz * 0.4;
        if (Math.abs(ball.vz) < 0.5) ball.vz = 0;
      }

      const groundFriction = ball.z <= 0 ? 0.97 : 0.995;
      ball.vx *= groundFriction;
      ball.vy *= groundFriction;

      ball.speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.rotation += ball.speed * dt * 10;

      // Trail
      if (ball.speed > 3) {
        ball.trail.push({ x: ball.x, y: ball.y, age: 0 });
        if (ball.trail.length > 12) ball.trail.shift();
      }
      for (const t of ball.trail) t.age += dt;
      ball.trail = ball.trail.filter(t => t.age < 0.3);

      if (ball.y < this.pitch.y || ball.y > this.pitch.y + this.pitch.height) {
        ball.vy *= -0.7;
        ball.y = Math.max(this.pitch.y, Math.min(this.pitch.y + this.pitch.height, ball.y));
        audio.playBounce();
      }
      this.checkGoalPostCollision(ball);
    }
  }

  checkGoalPostCollision(ball) {
    const postRadius = 5;
    const posts = [
      { x: this.pitch.goalLineLeft, y: this.pitch.goalTop },
      { x: this.pitch.goalLineLeft, y: this.pitch.goalBottom },
      { x: this.pitch.goalLineRight, y: this.pitch.goalTop },
      { x: this.pitch.goalLineRight, y: this.pitch.goalBottom },
    ];
    for (const post of posts) {
      const dx = ball.x - post.x, dy = ball.y - post.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < postRadius + 6) {
        const nx = dx / dist, ny = dy / dist;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
        ball.vx *= 0.6; ball.vy *= 0.6;
        audio.playBounce();
        this.shakeIntensity = 6;
        this.setCommentary('OFF THE POST!');
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            x: post.x, y: post.y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 0.4, maxLife: 0.4,
            color: i % 2 ? '#ffff00' : '#ffffff', size: 2 + Math.random() * 3, type: 'spark',
          });
        }
      }
    }
  }

  checkGoal() {
    const ball = this.ball;
    if (ball.owner) return;
    if (ball.x <= this.pitch.goalLineLeft && ball.y > this.pitch.goalTop && ball.y < this.pitch.goalBottom && ball.z < 30) {
      this.goalScored('away');
    }
    if (ball.x >= this.pitch.goalLineRight && ball.y > this.pitch.goalTop && ball.y < this.pitch.goalBottom && ball.z < 30) {
      this.goalScored('home');
    }
  }

  goalScored(team) {
    if (team === 'home') this.score.home++;
    else this.score.away++;

    this.stats[team].shotsOnTarget++;
    this.scorePopTime = 1.2;
    this.scorePopSide = team;

    this.lastGoalTeam = team;
    this.goalScorer = this.ball.lastKicker;
    this.state = 'goal_scored';
    this.stateTimer = 4.5;

    const scorerName = this.goalScorer ? this.goalScorer.name : 'Unknown';
    const scorerTeam = team === 'home' ? this.homeTeamData : this.awayTeamData;
    this.goalEvents.push({ scorer: scorerName, team: scorerTeam.shortName, time: this.getDisplayTime() });
    this.setCommentary(`GOOOAAAL! ${scorerName} scores for ${scorerTeam.name}!`);

    audio.playGoal();
    audio.playCheer();

    // Screen shake
    this.shakeIntensity = 12;

    // Slow motion effect
    this.slowMo = 0.3;
    this.slowMoTimer = 1.5;

    // Massive celebration particles
    const goalX = team === 'home' ? this.pitch.goalLineRight : this.pitch.goalLineLeft;
    const goalY = this.pitch.centerY;
    const colors = ['#FFD700', '#FF6347', '#00FF7F', '#FF69B4', '#00BFFF', '#FFFFFF', '#FF4444', '#44FF44'];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 7;
      this.particles.push({
        x: goalX + (Math.random() - 0.5) * 50,
        y: goalY + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
        life: 1.5 + Math.random() * 2.5, maxLife: 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 5, type: 'confetti',
      });
    }
  }

  checkBounds() {
    const ball = this.ball;
    if (ball.owner) return;
    const p = this.pitch;

    if (ball.x < p.x - 20 || ball.x > p.x + p.width + 20) {
      if (ball.y < p.goalTop || ball.y > p.goalBottom) {
        const isLeft = ball.x < p.centerX;
        ball.x = isLeft ? p.x + 50 : p.x + p.width - 50;
        ball.y = p.centerY; ball.vx = 0; ball.vy = 0; ball.vz = 0; ball.owner = null; ball.curve = 0;
        const team = isLeft ? this.homePlayers : this.awayPlayers;
        const gk = team.find(pl => pl.pos === 'GK');
        if (gk) { ball.owner = gk; ball.x = gk.x; ball.y = gk.y; }
        this.setCommentary('Goal kick');
      }
    }

    if (ball.y < p.y - 15 || ball.y > p.y + p.height + 15) {
      ball.y = Math.max(p.y, Math.min(p.y + p.height, ball.y));
      ball.vx = 0; ball.vy = 0; ball.vz = 0; ball.curve = 0;
      if (ball.lastKicker) {
        const team = ball.lastKicker.teamSide === 'left' ? this.awayPlayers : this.homePlayers;
        let nearest = null, nearDist = Infinity;
        for (const pl of team) {
          if (pl.pos === 'GK') continue;
          const d = this.distTo(pl, ball);
          if (d < nearDist) { nearDist = d; nearest = pl; }
        }
        if (nearest) {
          nearest.x = ball.x;
          nearest.y = ball.y < p.centerY ? p.y + 5 : p.y + p.height - 5;
          ball.owner = nearest; ball.x = nearest.x; ball.y = nearest.y;
        }
        this.setCommentary('Throw-in');
      }
    }
  }

  swapSides() {
    const p = this.pitch;
    const swapTeam = (players) => {
      players.forEach(pl => {
        pl.homeX = p.x + p.width - (pl.homeX - p.x);
        pl.teamSide = pl.teamSide === 'left' ? 'right' : 'left';
        pl.angle = pl.teamSide === 'left' ? 0 : Math.PI;
        pl.targetAngle = pl.angle;
      });
    };
    swapTeam(this.homePlayers);
    swapTeam(this.awayPlayers);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.type === 'confetti') {
        p.vy += 0.03; // Gentle gravity
        p.vx *= 0.99;
      } else {
        p.vy += 0.05;
      }
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  setCommentary(text) {
    this.commentary = text;
    this.commentaryTimer = 3;
  }

  getPlayerSpeed(player) { return 1.6 + (player.speed / 100) * 2.6; }
  distTo(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

  getDisplayTime() {
    const totalSeconds = Math.floor(this.matchTime);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const halfMin = (this.half - 1) * 45;
    const displayMin = halfMin + Math.floor(minutes * (45 / (this.halfDuration / 60)));
    return `${String(displayMin).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  togglePause() {
    if (this.state === 'playing') this.state = 'paused';
    else if (this.state === 'paused') this.state = 'playing';
  }

  // Reset the current match using the same two teams.
  restartMatch() {
    if (!this.homeTeamData || !this.awayTeamData) return;
    this.setupMatch(this.homeTeamData, this.awayTeamData);
  }

  // Totals used by halftime/fulltime panels
  getStats() {
    const h = this.stats.home, a = this.stats.away;
    const totalPossession = h.possessionTicks + a.possessionTicks;
    const homePoss = totalPossession ? Math.round(100 * h.possessionTicks / totalPossession) : 50;
    return {
      home: {
        possession: homePoss,
        shots: h.shots,
        shotsOnTarget: h.shotsOnTarget,
        passes: h.passes,
        tackles: h.tackles,
      },
      away: {
        possession: 100 - homePoss,
        shots: a.shots,
        shotsOnTarget: a.shotsOnTarget,
        passes: a.passes,
        tackles: a.tackles,
      },
    };
  }
}

const engine = new GameEngine();
