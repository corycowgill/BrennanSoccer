// Brennan's Soccer Showdown - Input System
// Handles keyboard, touch (virtual joystick), and Xbox gamepad

class InputSystem {
  constructor() {
    // Current input state (normalized)
    this.moveX = 0;
    this.moveY = 0;
    this.btnPass = false;
    this.btnShoot = false;
    this.btnTackle = false;
    this.btnSprint = false;
    this.btnPause = false;

    // Previous frame state for edge detection
    this._prevPass = false;
    this._prevShoot = false;
    this._prevTackle = false;
    this._prevPause = false;

    // Key states
    this.keys = {};

    // Touch state
    this.touchActive = false;
    this.touchId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickPos = { x: 0, y: 0 };
    this.joystickRadius = 50;
    this.touchButtons = { pass: false, shoot: false, tackle: false, sprint: false };

    // Button touch tracking
    this.buttonTouches = {};

    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);

    this.setupKeyboard();
    if (this.isMobile) {
      this.setupTouch();
    }
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setupTouch() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
  }

  handleTouchStart(e) {
    e.preventDefault();
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    for (const touch of e.changedTouches) {
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      const screenW = canvas.width;
      const screenH = canvas.height;

      // Left side = joystick
      if (x < screenW * 0.4) {
        this.touchActive = true;
        this.touchId = touch.identifier;
        this.joystickCenter = { x, y };
        this.joystickPos = { x, y };
      } else {
        // Right side = buttons
        this.classifyButtonTouch(touch.identifier, x, y, screenW, screenH, true);
      }
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    const canvas = document.getElementById('gameCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        this.joystickPos = { x, y };
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.touchId) {
        this.touchActive = false;
        this.touchId = null;
        this.joystickPos = { ...this.joystickCenter };
      }
      // Release button
      if (this.buttonTouches[touch.identifier]) {
        const btn = this.buttonTouches[touch.identifier];
        this.touchButtons[btn] = false;
        delete this.buttonTouches[touch.identifier];
      }
    }
  }

  classifyButtonTouch(id, x, y, w, h, pressed) {
    // Button layout on right side of screen
    // Shoot (big, center-right) - top button
    // Pass (bottom-left)
    // Tackle (bottom-right)
    // Sprint is a zone at bottom-center

    const btnAreaX = w * 0.7;
    const btnAreaY = h * 0.55;
    const relX = x - btnAreaX;
    const relY = y - btnAreaY;

    let btn = null;
    if (relY < h * 0.15) {
      btn = 'shoot';
    } else if (relX < w * 0.15) {
      btn = 'pass';
    } else {
      btn = 'tackle';
    }

    if (pressed && btn) {
      this.touchButtons[btn] = true;
      this.buttonTouches[id] = btn;
    }
  }

  // Get button zone positions for rendering
  getButtonZones(w, h) {
    const cx = w * 0.85;
    const cy = h * 0.65;
    const r = Math.min(w, h) * 0.055;
    return {
      shoot: { x: cx, y: cy - r * 2.5, r: r * 1.3, label: 'SHOOT', color: '#ff4444' },
      pass: { x: cx - r * 2.5, y: cy + r * 0.8, r: r * 1.1, label: 'PASS', color: '#44aaff' },
      tackle: { x: cx + r * 2.5, y: cy + r * 0.8, r: r * 1.1, label: 'TCKL', color: '#ffaa44' },
      sprint: { x: cx, y: cy + r * 3.5, r: r * 0.9, label: 'RUN', color: '#44ff44' },
    };
  }

  update() {
    // Store previous state
    this._prevPass = this.btnPass;
    this._prevShoot = this.btnShoot;
    this._prevTackle = this.btnTackle;
    this._prevPause = this.btnPause;

    // Reset
    this.moveX = 0;
    this.moveY = 0;
    this.btnPass = false;
    this.btnShoot = false;
    this.btnTackle = false;
    this.btnSprint = false;
    this.btnPause = false;

    // Keyboard input
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.moveX -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) this.moveX += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) this.moveY -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) this.moveY += 1;
    if (this.keys['Space'] || this.keys['KeyZ']) this.btnPass = true;
    if (this.keys['KeyX'] || this.keys['KeyE']) this.btnShoot = true;
    if (this.keys['KeyC'] || this.keys['KeyQ']) this.btnTackle = true;
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) this.btnSprint = true;
    if (this.keys['Escape'] || this.keys['KeyP']) this.btnPause = true;
    if (this.keys['Enter']) this.btnPass = true;

    // Touch input
    if (this.isMobile && this.touchActive) {
      const dx = this.joystickPos.x - this.joystickCenter.x;
      const dy = this.joystickPos.y - this.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = this.joystickRadius * 2;
      if (dist > 5) {
        this.moveX = Math.max(-1, Math.min(1, dx / maxDist));
        this.moveY = Math.max(-1, Math.min(1, dy / maxDist));
      }
    }
    if (this.touchButtons.pass) this.btnPass = true;
    if (this.touchButtons.shoot) this.btnShoot = true;
    if (this.touchButtons.tackle) this.btnTackle = true;
    if (this.touchButtons.sprint) this.btnSprint = true;

    // Gamepad input
    this.readGamepad();

    // Normalize diagonal movement
    const mag = Math.sqrt(this.moveX * this.moveX + this.moveY * this.moveY);
    if (mag > 1) {
      this.moveX /= mag;
      this.moveY /= mag;
    }
  }

  readGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;

      // Left stick
      if (Math.abs(gp.axes[0]) > 0.15) this.moveX += gp.axes[0];
      if (Math.abs(gp.axes[1]) > 0.15) this.moveY += gp.axes[1];

      // D-pad
      if (gp.buttons[12] && gp.buttons[12].pressed) this.moveY -= 1;
      if (gp.buttons[13] && gp.buttons[13].pressed) this.moveY += 1;
      if (gp.buttons[14] && gp.buttons[14].pressed) this.moveX -= 1;
      if (gp.buttons[15] && gp.buttons[15].pressed) this.moveX += 1;

      // A = pass, X = shoot, B = tackle, RT/LT = sprint
      if (gp.buttons[0] && gp.buttons[0].pressed) this.btnPass = true;
      if (gp.buttons[2] && gp.buttons[2].pressed) this.btnShoot = true;
      if (gp.buttons[1] && gp.buttons[1].pressed) this.btnTackle = true;
      if ((gp.buttons[6] && gp.buttons[6].value > 0.3) ||
          (gp.buttons[7] && gp.buttons[7].value > 0.3)) this.btnSprint = true;
      if (gp.buttons[9] && gp.buttons[9].pressed) this.btnPause = true;

      break; // Use first connected gamepad
    }
  }

  // Edge-triggered checks
  passJustPressed() { return this.btnPass && !this._prevPass; }
  shootJustPressed() { return this.btnShoot && !this._prevShoot; }
  tackleJustPressed() { return this.btnTackle && !this._prevTackle; }
  pauseJustPressed() { return this.btnPause && !this._prevPause; }

  hasGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    return Array.from(gamepads).some(g => g !== null);
  }
}

const input = new InputSystem();
