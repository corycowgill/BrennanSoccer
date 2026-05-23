// Brennan's Soccer Showdown - AI System v2
// Smarter positioning, ball prediction, pressing, counter-attacks

class AIController {
  constructor() {
    this.difficulty = 0.7;
    this.decisionTimer = 0;
  }

  update(player, team, opposingTeam, ball, pitch, dt, isUserTeam) {
    this.decisionTimer -= dt;

    const hasBall = ball.owner === player;
    const teamHasBall = ball.owner && team.includes(ball.owner);
    const isGK = player.pos === 'GK';

    if (isGK) return this.updateGoalkeeper(player, team, ball, pitch, dt, isUserTeam);
    if (hasBall) return this.updateWithBall(player, team, opposingTeam, ball, pitch, dt);
    if (teamHasBall) return this.updateTeamHasBall(player, team, opposingTeam, ball, pitch, dt, isUserTeam);
    return this.updateDefending(player, team, opposingTeam, ball, pitch, dt, isUserTeam);
  }

  updateGoalkeeper(player, team, ball, pitch, dt, isUserTeam) {
    const actions = { moveX: 0, moveY: 0, pass: false, shoot: false, tackle: false, sprint: false };
    const defendingLeft = player.teamSide === 'left';
    const goalX = defendingLeft ? pitch.goalLineLeft : pitch.goalLineRight;

    // Smart positioning: angle between ball and goal center
    const idealX = goalX + (defendingLeft ? 35 : -35);
    // Track ball Y but clamp to goal area
    const ballInfluence = Math.max(0, 1 - Math.abs(ball.x - goalX) / pitch.width);
    const idealY = pitch.centerY + (ball.y - pitch.centerY) * ballInfluence * 0.8;
    const clampedY = Math.max(pitch.goalTop + 15, Math.min(pitch.goalBottom - 15, idealY));

    const dx = idealX - player.x, dy = clampedY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 3) { actions.moveX = dx / dist; actions.moveY = dy / dist; }

    // Rush out for loose balls near goal
    const distToBall = this.dist(player, ball);
    if (distToBall < 100 && !ball.owner) {
      const bdx = ball.x - player.x, bdy = ball.y - player.y;
      const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
      if (bdist > 0) { actions.moveX = bdx / bdist; actions.moveY = bdy / bdist; }
      actions.sprint = true;
      if (distToBall < 25) actions.tackle = true;
    }

    // GK has ball: look for pass first, then boot it
    if (ball.owner === player) {
      const passTarget = this.findBestPassTarget(player, team, opposingTeam, pitch);
      if (passTarget && this.dist(player, passTarget) < 300) {
        actions.pass = true;
      } else {
        actions.shoot = true;
      }
    }

    return actions;
  }

  updateWithBall(player, team, opposingTeam, ball, pitch, dt) {
    const actions = { moveX: 0, moveY: 0, pass: false, shoot: false, tackle: false, sprint: false };
    const attackingRight = player.teamSide === 'left';
    const goalX = attackingRight ? pitch.goalLineRight : pitch.goalLineLeft;
    const goalY = pitch.centerY;
    const distToGoal = Math.abs(player.x - goalX);

    let closestDefDist = Infinity;
    for (const opp of opposingTeam) {
      const d = this.dist(player, opp);
      if (d < closestDefDist) closestDefDist = d;
    }

    // Shooting range - more nuanced
    if (distToGoal < 220 && Math.abs(player.y - goalY) < 160) {
      const shootChance = this.difficulty * 0.5 * (1 - distToGoal / 300);
      if (Math.random() < shootChance) { actions.shoot = true; return actions; }
    }

    // Under heavy pressure - pass immediately
    if (closestDefDist < 40) {
      const passTarget = this.findBestPassTarget(player, team, opposingTeam, pitch);
      if (passTarget && Math.random() < this.difficulty * 0.9) {
        const pdx = passTarget.x - player.x, pdy = passTarget.y - player.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        actions.moveX = pdx / pdist; actions.moveY = pdy / pdist;
        actions.pass = true;
        return actions;
      }
    }

    // Dribble toward goal, but pick a lane
    const laneOffset = ((player.idx * 73 + Math.floor(Date.now() / 3000)) % 3 - 1) * 80;
    const targetY = goalY + laneOffset;
    const dx = goalX - player.x, dy = targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    actions.moveX = dx / dist; actions.moveY = dy / dist;

    // Dodge defenders
    for (const opp of opposingTeam) {
      const d = this.dist(player, opp);
      if (d < 55 && d > 0) {
        const avoidX = player.x - opp.x, avoidY = player.y - opp.y;
        const avoidDist = Math.sqrt(avoidX * avoidX + avoidY * avoidY);
        actions.moveX += (avoidX / avoidDist) * 0.4;
        actions.moveY += (avoidY / avoidDist) * 0.5;
      }
    }

    // Normalize
    const mag = Math.sqrt(actions.moveX * actions.moveX + actions.moveY * actions.moveY);
    if (mag > 0) { actions.moveX /= mag; actions.moveY /= mag; }

    if (closestDefDist > 70) actions.sprint = true;

    // Forward pass opportunities
    if (this.decisionTimer <= 0 && Math.random() < 0.35 * this.difficulty) {
      const passTarget = this.findBestPassTarget(player, team, opposingTeam, pitch);
      if (passTarget && this.isForward(player, passTarget, attackingRight)) {
        actions.pass = true;
      }
      this.decisionTimer = 0.4 + Math.random() * 0.8;
    }

    return actions;
  }

  updateTeamHasBall(player, team, opposingTeam, ball, pitch, dt, isUserTeam) {
    const actions = { moveX: 0, moveY: 0, pass: false, shoot: false, tackle: false, sprint: false };
    const attackingRight = player.teamSide === 'left';
    let targetX, targetY;

    // Smarter movement based on position
    if (player.pos === 'FWD') {
      // Make attacking runs, stretch the defense
      targetX = attackingRight ? pitch.x + pitch.width * 0.78 : pitch.x + pitch.width * 0.22;
      // Alternate sides based on ball position
      const ballSide = ball.y > pitch.centerY ? -1 : 1;
      targetY = pitch.centerY + ballSide * 100 + Math.sin(Date.now() / 1500 + player.num) * 40;

      // Stay onside
      let lastDefX = attackingRight ? pitch.x : pitch.x + pitch.width;
      for (const opp of opposingTeam) {
        if (opp.pos === 'GK') continue;
        if (attackingRight) lastDefX = Math.max(lastDefX, opp.x);
        else lastDefX = Math.min(lastDefX, opp.x);
      }
      if (attackingRight && targetX > lastDefX - 5) targetX = lastDefX - 10;
      if (!attackingRight && targetX < lastDefX + 5) targetX = lastDefX + 10;

    } else if (player.pos === 'MID') {
      // Support play, create passing angles
      targetX = attackingRight ? pitch.x + pitch.width * 0.55 : pitch.x + pitch.width * 0.45;
      targetY = player.homeY + Math.sin(Date.now() / 2000 + player.num * 2) * 70;
      // Move toward ball side
      targetY += (ball.y - pitch.centerY) * 0.25;

    } else { // DEF
      targetX = player.homeX + (attackingRight ? 50 : -50);
      targetY = player.homeY + (ball.y - pitch.centerY) * 0.2;
    }

    const dx = targetX - player.x, dy = targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 12) { actions.moveX = dx / dist; actions.moveY = dy / dist; }
    if (dist > 50) actions.sprint = true;

    return actions;
  }

  updateDefending(player, team, opposingTeam, ball, pitch, dt, isUserTeam) {
    const actions = { moveX: 0, moveY: 0, pass: false, shoot: false, tackle: false, sprint: false };
    const defendingLeft = player.teamSide === 'left';
    const distToBall = this.dist(player, ball);

    // Find closest non-GK teammate to ball
    let closestTeammateDist = Infinity;
    for (const tm of team) {
      if (tm === player || tm.pos === 'GK') continue;
      const d = this.dist(tm, ball);
      if (d < closestTeammateDist) closestTeammateDist = d;
    }

    const iAmClosest = distToBall <= closestTeammateDist + 8;

    if (iAmClosest && !isUserTeam) {
      // Chase ball - predict where it will be
      let targetX = ball.x + ball.vx * 10;
      let targetY = ball.y + ball.vy * 10;

      const dx = targetX - player.x, dy = targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) { actions.moveX = dx / dist; actions.moveY = dy / dist; }
      actions.sprint = distToBall > 50;
      if (distToBall < 25) actions.tackle = true;

    } else {
      // Position defensively between ball and goal
      const goalX = defendingLeft ? pitch.goalLineLeft : pitch.goalLineRight;
      let targetX = player.homeX;
      let targetY = player.homeY;

      // Compact toward ball
      targetX += (ball.x - pitch.centerX) * 0.25;
      targetY += (ball.y - pitch.centerY) * 0.35;

      // Defenders: don't push too far up
      if (player.pos === 'DEF') {
        const limit = defendingLeft ? pitch.x + pitch.width * 0.45 : pitch.x + pitch.width * 0.55;
        if (defendingLeft) targetX = Math.min(targetX, limit);
        else targetX = Math.max(targetX, limit);
      }

      // Track nearby attacker if one is close
      let nearestAttacker = null, nearestAttDist = Infinity;
      for (const opp of opposingTeam) {
        if (opp.pos === 'GK') continue;
        const d = this.dist(player, opp);
        if (d < nearestAttDist && d < 120) { nearestAttDist = d; nearestAttacker = opp; }
      }
      if (nearestAttacker && player.pos === 'DEF') {
        // Mark the attacker: position between them and goal
        targetX = (nearestAttacker.x + goalX) / 2;
        targetY = nearestAttacker.y;
      }

      const dx = targetX - player.x, dy = targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) { actions.moveX = dx / dist; actions.moveY = dy / dist; }
      if (dist > 70) actions.sprint = true;

      // Intercept loose ball
      if (distToBall < 45 && !ball.owner) {
        const bdx = ball.x - player.x, bdy = ball.y - player.y;
        if (distToBall > 0) {
          actions.moveX = bdx / distToBall; actions.moveY = bdy / distToBall;
          if (distToBall < 22) actions.tackle = true;
        }
      }
    }

    return actions;
  }

  findBestPassTarget(player, team, opposingTeam, pitch) {
    let bestTarget = null, bestScore = -Infinity;
    const attackingRight = player.teamSide === 'left';

    for (const tm of team) {
      if (tm === player || tm.pos === 'GK') continue;
      const dist = this.dist(player, tm);
      if (dist < 30 || dist > 380) continue;

      let blocked = false;
      for (const opp of opposingTeam) {
        if (this.isInPassLane(player, tm, opp, 18)) { blocked = true; break; }
      }
      if (blocked) continue;

      let score = 0;
      if (attackingRight) score += (tm.x - player.x) * 0.4;
      else score += (player.x - tm.x) * 0.4;
      score -= Math.abs(dist - 140) * 0.15;

      // Bonus for players in space
      let minOppDist = Infinity;
      for (const opp of opposingTeam) {
        const d = this.dist(tm, opp);
        if (d < minOppDist) minOppDist = d;
      }
      score += Math.min(minOppDist, 100) * 0.3;

      if (score > bestScore) { bestScore = score; bestTarget = tm; }
    }
    return bestTarget;
  }

  isInPassLane(from, to, blocker, width) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;
    const nx = -dy / len, ny = dx / len;
    const bx = blocker.x - from.x, by = blocker.y - from.y;
    const proj = (bx * dx + by * dy) / len;
    if (proj < 0 || proj > len) return false;
    return Math.abs(bx * nx + by * ny) < width;
  }

  isForward(player, target, attackingRight) {
    return attackingRight ? target.x > player.x + 20 : target.x < player.x - 20;
  }

  dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
}

const ai = new AIController();
