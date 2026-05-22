// Brennan's Soccer Showdown - Game Engine
// Core game logic: physics, match state, ball, players

class GameEngine {
  constructor() {
    // Pitch dimensions (game units)
    this.PITCH_W = 1050;
    this.PITCH_H = 680;
    this.PITCH_MARGIN = 80;

    // Goal dimensions
    this.GOAL_WIDTH = 12;
    this.GOAL_HEIGHT = 120;

    // Derived
    this.pitch = {
      x: this.PITCH_MARGIN,
      y: this.PITCH_MARGIN,
      width: this.PITCH_W,
      height: this.PITCH_H,
      centerX: this.PITCH_MARGIN + this.PITCH_W / 2,
      centerY: this.PITCH_MARGIN + this.PITCH_H / 2,
      goalLineLeft: this.PITCH_MARGIN,
      goalLineRight: this.PITCH_MARGIN + this.PITCH_W,
      goalTop: this.PITCH_MARGIN + this.PITCH_H / 2 - this.GOAL_HEIGHT / 2,
      goalBottom: this.PITCH_MARGIN + this.PITCH_H / 2 + this.GOAL_HEIGHT / 2,
      totalWidth: this.PITCH_W + this.PITCH_MARGIN * 2,
      totalHeight: this.PITCH_H + this.PITCH_MARGIN * 2,
    };

    // Match state
    this.state = 'idle'; // idle, kickoff, playing, goal_scored, halftime, fulltime, paused
    this.half = 1;
    this.matchTime = 0; // seconds
    this.halfDuration = 180; // 3 minutes per half
    this.score = { home: 0, away: 0 };
    this.lastGoalTeam = null;

    // Timer for state transitions
    this.stateTimer = 0;

    // Teams
    this.homeTeam = null;
    this.awayTeam = null;
    this.homeTeamData = null;
    this.awayTeamData = null;

    // Players arrays
    this.homePlayers = [];
    this.awayPlayers = [];

    // Ball
    this.ball = {
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      owner: null,
      speed: 0,
      rotation: 0,
      lastKicker: null,
    };

    // Controlled player (user)
    this.controlledPlayer = null;
    this.userTeamSide = 'home'; // home (left) or away (right)

    // Particles
    this.particles = [];

    // Goal scorer info for display
    this.goalScorer = null;

    // Power meter for shooting
    this.shootPower = 0;
    this.isChargingShot = false;
  }

  setupMatch(homeTeamData, awayTeamData) {
    this.homeTeamData = homeTeamData;
    this.awayTeamData = awayTeamData;
    this.score = { home: 0, away: 0 };
    this.half = 1;
    this.matchTime = 0;

    // Create player objects
    this.homePlayers = this.createPlayers(homeTeamData, 'left');
    this.awayPlayers = this.createPlayers(awayTeamData, 'right');

    this.resetPositions();
    this.ball.owner = null;
    this.state = 'kickoff';
    this.stateTimer = 1.5;
    this.lastGoalTeam = null;

    // Set controlled player to midfield of home team
    this.controlledPlayer = this.homePlayers.find(p => p.pos === 'MID') || this.homePlayers[3];
  }

  createPlayers(teamData, side) {
    const p = this.pitch;
    const isLeft = side === 'left';
    const players = [];

    // Formation 1-2-1-1: GK, DEF, DEF, MID, FWD
    const positions = [
      { pos: 'GK', rx: 0.05, ry: 0.5 },
      { pos: 'DEF', rx: 0.2, ry: 0.3 },
      { pos: 'DEF', rx: 0.2, ry: 0.7 },
      { pos: 'MID', rx: 0.38, ry: 0.5 },
      { pos: 'FWD', rx: 0.48, ry: 0.5 },
    ];

    teamData.players.forEach((pd, i) => {
      const fp = positions[i];
      let homeX, homeY;
      if (isLeft) {
        homeX = p.x + fp.rx * p.width;
        homeY = p.y + fp.ry * p.height;
      } else {
        homeX = p.x + (1 - fp.rx) * p.width;
        homeY = p.y + fp.ry * p.height;
      }

      players.push({
        ...pd,
        x: homeX, y: homeY,
        vx: 0, vy: 0,
        homeX, homeY,
        teamSide: side,
        teamData: teamData,
        angle: isLeft ? 0 : Math.PI,
        runFrame: 0,
        kickCooldown: 0,
        tackleCooldown: 0,
        idx: i,
      });
    });

    return players;
  }

  resetPositions() {
    const p = this.pitch;

    const resetTeam = (players, side) => {
      const isLeft = side === 'left';
      const positions = [
        { rx: 0.05, ry: 0.5 },
        { rx: 0.2, ry: 0.3 },
        { rx: 0.2, ry: 0.7 },
        { rx: 0.38, ry: 0.5 },
        { rx: 0.48, ry: 0.5 },
      ];

      players.forEach((pl, i) => {
        const fp = positions[i];
        if (isLeft) {
          pl.homeX = p.x + fp.rx * p.width;
          pl.homeY = p.y + fp.ry * p.height;
        } else {
          pl.homeX = p.x + (1 - fp.rx) * p.width;
          pl.homeY = p.y + fp.ry * p.height;
        }
        pl.x = pl.homeX;
        pl.y = pl.homeY;
        pl.vx = 0;
        pl.vy = 0;
      });
    };

    resetTeam(this.homePlayers, 'left');
    resetTeam(this.awayPlayers, 'right');

    // Ball at center
    this.ball.x = p.centerX;
    this.ball.y = p.centerY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.owner = null;
    this.ball.lastKicker = null;
  }

  update(dt, inputState) {
    if (this.state === 'paused') return;

    this.stateTimer -= dt;

    switch (this.state) {
      case 'kickoff':
        if (this.stateTimer <= 0) {
          this.state = 'playing';
          audio.playWhistle();
          audio.startCrowd();
          // Give ball to the team that didn't score (or home at start)
          const kickoffTeam = this.lastGoalTeam === 'home' ? this.awayPlayers : this.homePlayers;
          const fwd = kickoffTeam.find(p => p.pos === 'FWD');
          if (fwd) {
            this.ball.owner = fwd;
            this.ball.x = fwd.x;
            this.ball.y = fwd.y;
          }
        }
        return;

      case 'goal_scored':
        this.updateParticles(dt);
        if (this.stateTimer <= 0) {
          this.resetPositions();
          this.state = 'kickoff';
          this.stateTimer = 1.5;
        }
        return;

      case 'halftime':
        if (this.stateTimer <= 0) {
          this.half = 2;
          this.swapSides();
          this.resetPositions();
          this.state = 'kickoff';
          this.stateTimer = 1.5;
        }
        return;

      case 'fulltime':
        return;

      case 'playing':
        break;

      default:
        return;
    }

    // Update match time
    this.matchTime += dt;
    if (this.matchTime >= this.halfDuration) {
      if (this.half === 1) {
        this.state = 'halftime';
        this.stateTimer = 3;
        this.matchTime = 0;
        audio.playWhistle(true);
        audio.stopCrowd();
        return;
      } else {
        this.state = 'fulltime';
        audio.playWhistle(true);
        audio.stopCrowd();
        return;
      }
    }

    // Update user-controlled player
    this.updateControlledPlayer(dt, inputState);

    // Update AI for all non-controlled players
    this.updateAllAI(dt);

    // Update player physics
    this.updatePlayers(dt);

    // Update ball physics
    this.updateBall(dt);

    // Check for goals
    this.checkGoal();

    // Check out of bounds
    this.checkBounds();

    // Update particles
    this.updateParticles(dt);
  }

  updateControlledPlayer(dt, inp) {
    const pl = this.controlledPlayer;
    if (!pl) return;

    const speed = this.getPlayerSpeed(pl) * (inp.btnSprint ? 1.4 : 1.0);

    pl.vx = inp.moveX * speed;
    pl.vy = inp.moveY * speed;

    // Update angle
    if (Math.abs(inp.moveX) > 0.1 || Math.abs(inp.moveY) > 0.1) {
      pl.angle = Math.atan2(inp.moveY, inp.moveX);
    }

    const hasBall = this.ball.owner === pl;

    // Shooting with power charge
    if (inp.btnShoot && hasBall) {
      if (!this.isChargingShot) {
        this.isChargingShot = true;
        this.shootPower = 0;
      }
      this.shootPower = Math.min(1, this.shootPower + dt * 2);
    } else if (this.isChargingShot && !inp.btnShoot) {
      // Release shot
      this.performShot(pl, this.shootPower);
      this.isChargingShot = false;
      this.shootPower = 0;
    }

    // Pass
    if (inp.passJustPressed()) {
      if (hasBall) {
        this.performPass(pl);
      } else {
        // Switch controlled player to nearest teammate to ball
        this.switchPlayer();
      }
    }

    // Tackle
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
      if (d < closestDist) {
        closestDist = d;
        closest = p;
      }
    }

    if (closest) {
      this.controlledPlayer = closest;
    }
  }

  performPass(player) {
    if (player.kickCooldown > 0) return;

    const myTeam = player.teamSide === 'left' ? this.homePlayers : this.awayPlayers;
    const oppTeam = player.teamSide === 'left' ? this.awayPlayers : this.homePlayers;

    // Find best pass target in facing direction
    let bestTarget = null;
    let bestScore = -Infinity;

    for (const tm of myTeam) {
      if (tm === player || tm.pos === 'GK') continue;
      const dx = tm.x - player.x;
      const dy = tm.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30 || dist > 400) continue;

      // Prefer players in facing direction
      const angle = Math.atan2(dy, dx);
      let angleDiff = Math.abs(angle - player.angle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      const score = -angleDiff * 100 - dist * 0.3;
      if (score > bestScore) {
        bestScore = score;
        bestTarget = tm;
      }
    }

    if (bestTarget) {
      const dx = bestTarget.x - player.x;
      const dy = bestTarget.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const passSpeed = Math.min(12, 5 + dist * 0.02) * (1 + player.passing / 200);

      this.ball.owner = null;
      this.ball.vx = (dx / dist) * passSpeed;
      this.ball.vy = (dy / dist) * passSpeed;
      this.ball.vz = 1;
      this.ball.lastKicker = player;
      player.kickCooldown = 0.3;
      audio.playKick(0.5);
    }
  }

  performShot(player, power) {
    if (player.kickCooldown > 0) return;

    const attackRight = player.teamSide === 'left';
    const goalX = attackRight ? this.pitch.goalLineRight : this.pitch.goalLineLeft;
    const goalY = this.pitch.centerY + (Math.random() - 0.5) * this.GOAL_HEIGHT * 0.6;

    const dx = goalX - player.x;
    const dy = goalY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const shootSpeed = (8 + power * 12) * (1 + player.shooting / 200);

    // Add some inaccuracy based on player skill
    const accuracy = player.shooting / 100;
    const spread = (1 - accuracy) * 0.3;

    this.ball.owner = null;
    this.ball.vx = (dx / dist) * shootSpeed + (Math.random() - 0.5) * spread * shootSpeed;
    this.ball.vy = (dy / dist) * shootSpeed + (Math.random() - 0.5) * spread * shootSpeed;
    this.ball.vz = 2 + power * 4;
    this.ball.lastKicker = player;
    player.kickCooldown = 0.5;

    audio.playKick(0.5 + power * 0.5);

    // Shot particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: player.x, y: player.y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 0.4,
        maxLife: 0.4,
        color: '#ffffff',
        size: 3,
      });
    }
  }

  performTackle(player) {
    if (player.tackleCooldown > 0) return;

    // Lunge forward
    const lungeSpeed = 8;
    player.vx = Math.cos(player.angle) * lungeSpeed;
    player.vy = Math.sin(player.angle) * lungeSpeed;
    player.tackleCooldown = 0.8;

    // Check if we can dispossess nearby ball carrier
    const allPlayers = [...this.homePlayers, ...this.awayPlayers];
    for (const other of allPlayers) {
      if (other.teamSide === player.teamSide) continue;
      if (this.ball.owner !== other) continue;

      const dist = this.distTo(player, other);
      if (dist < 35) {
        // Tackle success based on defense stat
        const successChance = 0.4 + (player.defense / 100) * 0.5;
        if (Math.random() < successChance) {
          this.ball.owner = null;
          this.ball.vx = Math.cos(player.angle) * 3;
          this.ball.vy = Math.sin(player.angle) * 3;
          audio.playTackle();

          for (let i = 0; i < 4; i++) {
            this.particles.push({
              x: other.x, y: other.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 0.3,
              maxLife: 0.3,
              color: '#8B4513',
              size: 4,
            });
          }
        }
        break;
      }
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

      const speed = this.getPlayerSpeed(player) * (actions.sprint ? 1.3 : 1.0);
      player.vx = actions.moveX * speed;
      player.vy = actions.moveY * speed;

      if (Math.abs(actions.moveX) > 0.1 || Math.abs(actions.moveY) > 0.1) {
        player.angle = Math.atan2(actions.moveY, actions.moveX);
      }

      if (actions.pass && this.ball.owner === player) {
        this.performPass(player);
      }
      if (actions.shoot && this.ball.owner === player) {
        this.performShot(player, 0.5 + Math.random() * 0.4);
      }
      if (actions.tackle) {
        this.performTackle(player);
      }
    }
  }

  updatePlayers(dt) {
    const allPlayers = [...this.homePlayers, ...this.awayPlayers];

    for (const player of allPlayers) {
      // Apply velocity
      player.x += player.vx * dt * 60;
      player.y += player.vy * dt * 60;

      // Friction
      player.vx *= 0.85;
      player.vy *= 0.85;

      // Keep on pitch (with some margin)
      const margin = -10;
      player.x = Math.max(this.pitch.x + margin, Math.min(this.pitch.x + this.pitch.width - margin, player.x));
      player.y = Math.max(this.pitch.y + margin, Math.min(this.pitch.y + this.pitch.height - margin, player.y));

      // GK stays near goal
      if (player.pos === 'GK') {
        const isLeft = player.teamSide === 'left';
        const goalX = isLeft ? this.pitch.goalLineLeft : this.pitch.goalLineRight;
        const maxDist = 80;
        const dx = player.x - goalX;
        if (Math.abs(dx) > maxDist) {
          player.x = goalX + Math.sign(dx) * maxDist;
        }
      }

      // Update run animation
      const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (speed > 0.5) {
        player.runFrame += speed * dt * 8;
      }

      // Cooldowns
      player.kickCooldown = Math.max(0, player.kickCooldown - dt);
      player.tackleCooldown = Math.max(0, player.tackleCooldown - dt);

      // Ball pickup
      if (!this.ball.owner && player.kickCooldown <= 0) {
        const distToBall = this.distTo(player, this.ball);
        if (distToBall < 18) {
          // Don't let recently kicked player pick up immediately
          if (this.ball.lastKicker !== player || this.ball.speed < 2) {
            this.ball.owner = player;
            this.ball.lastKicker = null;
          }
        }
      }
    }

    // Player-player collision
    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const a = allPlayers[i];
        const b = allPlayers[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 16;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
      }
    }
  }

  updateBall(dt) {
    const ball = this.ball;

    if (ball.owner) {
      // Ball follows owner
      const offset = 12;
      ball.x = ball.owner.x + Math.cos(ball.owner.angle) * offset;
      ball.y = ball.owner.y + Math.sin(ball.owner.angle) * offset;
      ball.z = 0;
      ball.vx = 0;
      ball.vy = 0;
      ball.vz = 0;
    } else {
      // Free ball physics
      ball.x += ball.vx * dt * 60;
      ball.y += ball.vy * dt * 60;
      ball.z += ball.vz * dt * 60;

      // Gravity on z
      ball.vz -= 0.3 * dt * 60;
      if (ball.z <= 0) {
        ball.z = 0;
        ball.vz = -ball.vz * 0.4;
        if (Math.abs(ball.vz) < 0.5) ball.vz = 0;
      }

      // Friction
      const groundFriction = ball.z <= 0 ? 0.97 : 0.995;
      ball.vx *= groundFriction;
      ball.vy *= groundFriction;

      // Speed
      ball.speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

      // Rotation
      ball.rotation += ball.speed * dt * 10;

      // Bounce off pitch boundaries (simplified)
      if (ball.y < this.pitch.y || ball.y > this.pitch.y + this.pitch.height) {
        ball.vy *= -0.7;
        ball.y = Math.max(this.pitch.y, Math.min(this.pitch.y + this.pitch.height, ball.y));
        audio.playBounce();
      }

      // Goal post collisions
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
      const dx = ball.x - post.x;
      const dy = ball.y - post.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < postRadius + 6) {
        // Bounce off post
        const nx = dx / dist;
        const ny = dy / dist;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx;
        ball.vy -= 2 * dot * ny;
        ball.vx *= 0.6;
        ball.vy *= 0.6;
        audio.playBounce();

        // Spark particles
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: post.x, y: post.y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 0.3,
            maxLife: 0.3,
            color: '#ffff00',
            size: 3,
          });
        }
      }
    }
  }

  checkGoal() {
    const ball = this.ball;
    if (ball.owner) return;

    // Left goal (away team scores)
    if (ball.x <= this.pitch.goalLineLeft &&
        ball.y > this.pitch.goalTop && ball.y < this.pitch.goalBottom && ball.z < 30) {
      this.goalScored('away');
    }

    // Right goal (home team scores)
    if (ball.x >= this.pitch.goalLineRight &&
        ball.y > this.pitch.goalTop && ball.y < this.pitch.goalBottom && ball.z < 30) {
      this.goalScored('home');
    }
  }

  goalScored(team) {
    if (team === 'home') {
      this.score.home++;
    } else {
      this.score.away++;
    }

    this.lastGoalTeam = team;
    this.goalScorer = this.ball.lastKicker;
    this.state = 'goal_scored';
    this.stateTimer = 4;

    audio.playGoal();
    audio.playCheer();

    // Goal celebration particles
    const goalX = team === 'home' ? this.pitch.goalLineRight : this.pitch.goalLineLeft;
    const goalY = this.pitch.centerY;

    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const colors = ['#FFD700', '#FF6347', '#00FF7F', '#FF69B4', '#00BFFF', '#FFFFFF'];
      this.particles.push({
        x: goalX + (Math.random() - 0.5) * 40,
        y: goalY + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1 + Math.random() * 2,
        maxLife: 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
      });
    }
  }

  checkBounds() {
    const ball = this.ball;
    if (ball.owner) return;

    // Simplified: if ball goes off the sides, give throw-in
    // If ball goes off the ends (but not in goal), give goal kick
    const p = this.pitch;

    if (ball.x < p.x - 20 || ball.x > p.x + p.width + 20) {
      // Goal kick or corner - simplified: just reset ball
      if (ball.y < p.goalTop || ball.y > p.goalBottom) {
        // Goal kick
        const isLeft = ball.x < p.centerX;
        ball.x = isLeft ? p.x + 50 : p.x + p.width - 50;
        ball.y = p.centerY;
        ball.vx = 0;
        ball.vy = 0;
        ball.vz = 0;
        ball.owner = null;

        // Give to the GK
        const team = isLeft ? this.homePlayers : this.awayPlayers;
        const gk = team.find(pl => pl.pos === 'GK');
        if (gk) {
          ball.owner = gk;
          ball.x = gk.x;
          ball.y = gk.y;
        }
      }
    }

    if (ball.y < p.y - 15 || ball.y > p.y + p.height + 15) {
      // Throw-in
      ball.y = Math.max(p.y, Math.min(p.y + p.height, ball.y));
      ball.vx = 0;
      ball.vy = 0;
      ball.vz = 0;

      // Give to nearest player of opposing team to last kicker
      if (ball.lastKicker) {
        const team = ball.lastKicker.teamSide === 'left' ? this.awayPlayers : this.homePlayers;
        let nearest = null;
        let nearDist = Infinity;
        for (const pl of team) {
          if (pl.pos === 'GK') continue;
          const d = this.distTo(pl, ball);
          if (d < nearDist) {
            nearDist = d;
            nearest = pl;
          }
        }
        if (nearest) {
          nearest.x = ball.x;
          nearest.y = ball.y < p.centerY ? p.y + 5 : p.y + p.height - 5;
          ball.owner = nearest;
          ball.x = nearest.x;
          ball.y = nearest.y;
        }
      }
    }
  }

  swapSides() {
    // Swap home positions
    const p = this.pitch;
    const swapTeam = (players) => {
      players.forEach(pl => {
        pl.homeX = p.x + p.width - (pl.homeX - p.x);
        pl.teamSide = pl.teamSide === 'left' ? 'right' : 'left';
        pl.angle = pl.teamSide === 'left' ? 0 : Math.PI;
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
      p.vy += 0.05;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getPlayerSpeed(player) {
    return 1.5 + (player.speed / 100) * 2.5;
  }

  distTo(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getDisplayTime() {
    const totalSeconds = Math.floor(this.matchTime);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const halfMin = (this.half - 1) * 45;
    const displayMin = halfMin + Math.floor(minutes * (45 / (this.halfDuration / 60)));
    return `${String(displayMin).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }
}

const engine = new GameEngine();
