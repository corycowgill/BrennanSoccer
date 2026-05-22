// Brennan's Soccer Showdown - AI System
// Intelligent computer-controlled players

class AIController {
  constructor() {
    this.difficulty = 0.7; // 0-1 scale
    this.decisionTimer = 0;
    this.currentAction = 'idle';
    this.targetPos = null;
    this.passTarget = null;
  }

  update(player, team, opposingTeam, ball, pitch, dt, isUserTeam) {
    this.decisionTimer -= dt;

    const hasBall = ball.owner === player;
    const teamHasBall = ball.owner && team.includes(ball.owner);
    const distToBall = this.dist(player, ball);
    const isGK = player.pos === 'GK';

    if (isGK) {
      return this.updateGoalkeeper(player, team, ball, pitch, dt, isUserTeam);
    }

    if (hasBall) {
      return this.updateWithBall(player, team, opposingTeam, ball, pitch, dt);
    } else if (teamHasBall) {
      return this.updateTeamHasBall(player, team, opposingTeam, ball, pitch, dt, isUserTeam);
    } else {
      return this.updateDefending(player, team, opposingTeam, ball, pitch, dt, isUserTeam);
    }
  }

  updateGoalkeeper(player, team, ball, pitch, dt, isUserTeam) {
    const actions = { moveX: 0, moveY: 0, pass: false, shoot: false, tackle: false, sprint: false };

    // Determine which goal we're defending
    const defendingLeft = player.teamSide === 'left';
    const goalX = defendingLeft ? pitch.goalLineLeft : pitch.goalLineRight;
    const goalY = pitch.centerY;

    // Position between ball and goal
    const idealX = goalX + (defendingLeft ? 30 : -30);
    const idealY = Math.max(pitch.goalTop + 20, Math.min(pitch.goalBottom - 20, ball.y));

    // Move toward ideal position
    const dx = idealX - player.x;
    const dy = idealY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 3) {
      actions.moveX = dx / dist;
      actions.moveY = dy / dist;
    }

    // If ball is very close, try to grab/tackle it
    const distToBall = this.dist(player, ball);
    if (distToBall < 80 && !ball.owner) {
      const bdx = ball.x - player.x;
      const bdy = ball.y - player.y;
      const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
      actions.moveX = bdx / bdist;
      actions.moveY = bdy / bdist;
      actions.sprint = true;
      if (distToBall < 25) actions.tackle = true;
    }

    // If GK has ball, kick it far upfield
    if (ball.owner === player) {
      actions.shoot = true;
    }

    return actions;
  }

  updateWithBall(player, team, opposingTeam, ball, pitch, dt) {
    const actions = { moveX: 0, moveY: 0, pass: false, shoot: false, tackle: false, sprint: false };

    const attackingRight = player.teamSide === 'left';
    const goalX = attackingRight ? pitch.goalLineRight : pitch.goalLineLeft;
    const goalY = pitch.centerY;

    const distToGoal = Math.abs(player.x - goalX);

    // Check for nearby defenders
    let closestDefDist = Infinity;
    for (const opp of opposingTeam) {
      const d = this.dist(player, opp);
      if (d < closestDefDist) closestDefDist = d;
    }

    // Shooting range
    if (distToGoal < 200 && Math.abs(player.y - goalY) < 150) {
      if (Math.random() < this.difficulty * 0.6) {
        actions.shoot = true;
        return actions;
      }
    }

    // Under pressure - try to pass
    if (closestDefDist < 50 && Math.random() < this.difficulty * 0.8) {
      const passTarget = this.findBestPassTarget(player, team, opposingTeam, pitch);
      if (passTarget) {
        // Face toward target before passing
        const pdx = passTarget.x - player.x;
        const pdy = passTarget.y - player.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        actions.moveX = pdx / pdist;
        actions.moveY = pdy / pdist;
        actions.pass = true;
        return actions;
      }
    }

    // Dribble toward goal
    const dx = goalX - player.x;
    const dy = goalY + (Math.random() - 0.5) * 100 - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    actions.moveX = dx / dist;
    actions.moveY = dy / dist;

    // Avoid nearest defender
    for (const opp of opposingTeam) {
      const d = this.dist(player, opp);
      if (d < 60) {
        const avoidX = player.x - opp.x;
        const avoidY = player.y - opp.y;
        const avoidDist = Math.sqrt(avoidX * avoidX + avoidY * avoidY);
        if (avoidDist > 0) {
          actions.moveY += (avoidY / avoidDist) * 0.6;
        }
      }
    }

    // Sprint when clear
    if (closestDefDist > 80) actions.sprint = true;

    // Occasionally pass forward
    if (this.decisionTimer <= 0 && Math.random() < 0.3 * this.difficulty) {
      const passTarget = this.findBestPassTarget(player, team, opposingTeam, pitch);
      if (passTarget && this.isForward(player, passTarget, attackingRight)) {
        actions.pass = true;
      }
      this.decisionTimer = 0.5 + Math.random() * 1.0;
    }

    return actions;
  }

  updateTeamHasBall(player, team, opposingTeam, ball, pitch, dt, isUserTeam) {
    const actions = { moveX: 0, moveY: 0, pass: false, shoot: false, tackle: false, sprint: false };

    const attackingRight = player.teamSide === 'left';
    const goalX = attackingRight ? pitch.goalLineRight : pitch.goalLineLeft;

    // Move to create space - find a good attacking position
    let targetX, targetY;

    if (player.pos === 'FWD') {
      targetX = attackingRight ? pitch.width * 0.75 : pitch.width * 0.25;
      targetY = pitch.centerY + (player.y > pitch.centerY ? -80 : 80);
    } else if (player.pos === 'MID') {
      targetX = attackingRight ? pitch.width * 0.6 : pitch.width * 0.4;
      targetY = player.homeY + (Math.sin(Date.now() / 2000 + player.num) * 60);
    } else {
      // DEF - hold position but shift toward ball side
      targetX = player.homeX + (attackingRight ? 40 : -40);
      targetY = player.homeY + (ball.y - pitch.centerY) * 0.3;
    }

    // Stay onside (simplified)
    if (player.pos === 'FWD') {
      // Don't go past the last defender
      let lastDefX = attackingRight ? 0 : pitch.width;
      for (const opp of opposingTeam) {
        if (opp.pos === 'GK') continue;
        if (attackingRight) {
          lastDefX = Math.max(lastDefX, opp.x);
        } else {
          lastDefX = Math.min(lastDefX, opp.x);
        }
      }
      if (attackingRight && targetX > lastDefX) targetX = lastDefX - 5;
      if (!attackingRight && targetX < lastDefX) targetX = lastDefX + 5;
    }

    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 15) {
      actions.moveX = dx / dist;
      actions.moveY = dy / dist;
      if (dist > 60) actions.sprint = true;
    }

    return actions;
  }

  updateDefending(player, team, opposingTeam, ball, pitch, dt, isUserTeam) {
    const actions = { moveX: 0, moveY: 0, pass: false, shoot: false, tackle: false, sprint: false };

    const defendingLeft = player.teamSide === 'left';
    const distToBall = this.dist(player, ball);

    // Find closest teammate to ball (that's not this player)
    let closestTeammateDist = Infinity;
    for (const tm of team) {
      if (tm === player || tm.pos === 'GK') continue;
      const d = this.dist(tm, ball);
      if (d < closestTeammateDist) closestTeammateDist = d;
    }

    // Am I the closest non-GK to the ball?
    const iAmClosest = distToBall <= closestTeammateDist + 10;

    if (iAmClosest && !isUserTeam) {
      // Chase ball
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        actions.moveX = dx / dist;
        actions.moveY = dy / dist;
        actions.sprint = distToBall > 60;
      }
      if (distToBall < 25) {
        actions.tackle = true;
      }
    } else {
      // Position defensively
      let targetX = player.homeX;
      let targetY = player.homeY;

      // Shift toward ball
      targetX += (ball.x - pitch.centerX) * 0.2;
      targetY += (ball.y - pitch.centerY) * 0.3;

      // Stay in defensive shape
      if (player.pos === 'DEF') {
        if (defendingLeft) {
          targetX = Math.min(targetX, pitch.width * 0.45);
        } else {
          targetX = Math.max(targetX, pitch.width * 0.55);
        }
      }

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        actions.moveX = dx / dist;
        actions.moveY = dy / dist;
        if (dist > 80) actions.sprint = true;
      }

      // If ball comes near, intercept
      if (distToBall < 40 && !ball.owner) {
        const bdx = ball.x - player.x;
        const bdy = ball.y - player.y;
        const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
        if (bdist > 0) {
          actions.moveX = bdx / distToBall;
          actions.moveY = bdy / distToBall;
          if (distToBall < 20) actions.tackle = true;
        }
      }
    }

    return actions;
  }

  findBestPassTarget(player, team, opposingTeam, pitch) {
    let bestTarget = null;
    let bestScore = -Infinity;
    const attackingRight = player.teamSide === 'left';

    for (const tm of team) {
      if (tm === player || tm.pos === 'GK') continue;

      const dist = this.dist(player, tm);
      if (dist < 30 || dist > 350) continue;

      // Check if pass lane is clear
      let blocked = false;
      for (const opp of opposingTeam) {
        if (this.isInPassLane(player, tm, opp, 20)) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      // Score: prefer forward passes, reasonable distance
      let score = 0;
      if (attackingRight) {
        score += (tm.x - player.x) * 0.5; // Forward bonus
      } else {
        score += (player.x - tm.x) * 0.5;
      }
      score -= Math.abs(dist - 150) * 0.2; // Prefer medium distance

      if (score > bestScore) {
        bestScore = score;
        bestTarget = tm;
      }
    }

    return bestTarget;
  }

  isInPassLane(from, to, blocker, width) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;

    const nx = -dy / len;
    const ny = dx / len;

    const bx = blocker.x - from.x;
    const by = blocker.y - from.y;

    const proj = (bx * dx + by * dy) / len;
    if (proj < 0 || proj > len) return false;

    const perp = Math.abs(bx * nx + by * ny);
    return perp < width;
  }

  isForward(player, target, attackingRight) {
    return attackingRight ? target.x > player.x + 20 : target.x < player.x - 20;
  }

  dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

const ai = new AIController();
