class Character extends MoveableObject {
  width = 200;
  height = 200;
  y = 240;
  offset = { top: 80, right: 80, bottom: 0, left: 52 };
  hp = 1000;
  speed = 7;
  walkSpeed = 7;
  runSpeedFactor = 1.5;
  IMAGES_WALKING;
  IMAGES_RUNNING;
  IMAGES_IDLE;
  IMAGES_IDLE_LONG;
  idleSince = gameLoop.now();
  lastIdleFrame = 0;
  idleLongFrame = 0;
  animationElapsedMs = 0;
  IMAGES_JUMPING;
  IMAGES_ATTACK;
  attacking = false;
  attackTick = 0;
  attackTicksPerFrame = 2;
  legsImg = null;
  legsArea = { x: 30, y: 98, w: 52, h: 30 };
  attackDamageFrame = 5;
  attackReach = 60;
  IMAGES_HURT;
  IMAGES_DEAD;
  state = "idle";
  stateActions = {
    idle: ["move", "jump", "attack"],
    run: ["move", "jump", "attack"],
    jump: ["move", "attack"],
    attack: ["move", "jump"],
    hurt: ["move"],
    dead: [],
  };
  knockbackDirection = 0;
  knockbackFrames = 0;
  invulnerableUntil = 0;

  world;
  deathStarted = false;
  IMAGES_BUBBLE;
  showBubble = false;

  constructor() {
    super();
    const base = "assets/images/character/male/";
    this.IMAGES_WALKING = this.loadSpriteSheet(base + "Walk.png", 7);
    this.IMAGES_RUNNING = this.loadSpriteSheet(base + "Run.png", 8);
    this.IMAGES_IDLE = this.loadSpriteSheet(base + "Idle.png", 6);
    this.IMAGES_IDLE_LONG = this.loadSpriteSheet(base + "Idle_long.png", 5);
    this.IMAGES_ATTACK = this.loadSpriteSheet(base + "Attack_1.png", 10);
    this.IMAGES_JUMPING = this.loadSpriteSheet(base + "Jump.png", 11);
    this.IMAGES_HURT = this.loadSpriteSheet(base + "Hurt.png", 4);
    this.IMAGES_DEAD = this.loadSpriteSheet(base + "Dead.png", 4);
    this.IMAGES_BUBBLE = this.loadSpriteSheet(base + "idle_long_bubble.png", 2, 15, 16);
    this.img = this.imageCache[this.IMAGES_JUMPING[0]];
    this.animation();
    this.gravity();
  }

  animation() {
    gameLoop.runEvery(1000 / 60, () => {
      this.updateCharacter();
    });
  }

  updateCharacter() {
    if (this.isDead()) {
      this.updateState();
    } else {
      this.updateInput();
      this.updatePhysics();
      this.updateState();
    }
    this.animationElapsedMs += gameLoop.fixedStepMs;
    if (this.animationElapsedMs >= 25) {
      this.animationElapsedMs -= 25;
      this.updateAnimation();
    }
  }

  updateInput() {
    const key = this.world.keyboard;
    this.speed = key.SHIFT ? this.walkSpeed * this.runSpeedFactor : this.walkSpeed;
    if (key.LEFT || key.RIGHT || key.SPACE || this.attacking || this.isAboveGround() || this.gettingHit()) {
      this.idleSince = gameLoop.now();
      this.idleLongFrame = 0;
    }
  }

  updatePhysics() {
    const key = this.world.keyboard;
    if (key.RIGHT && !key.LEFT && this.x < this.world.level.level_end_x) {
      this.moveRight();
    }
    if (key.LEFT && !key.RIGHT && this.x > 0) {
      this.moveLeft();
    }

    if (this.knockbackFrames > 0) {
      this.x += this.knockbackDirection * 2.5;
      this.knockbackFrames--;
    }

    this.x = Math.max(0, Math.min(this.world.level.level_end_x, this.x));
    this.world.camera_x = -this.x;
  }

  updateAnimation() {
    this.showBubble = false;
    this.legsImg = null;
    if (this.state === "dead") {
      if (!this.deathStarted) {
        this.deathStarted = true;
        this.currentImage = 0;
      }
      if (this.currentImage < this.IMAGES_DEAD.length * 4) {
        this.img = this.imageCache[this.IMAGES_DEAD[Math.floor(this.currentImage / 4)]];
        this.currentImage++;
      }
    } else if (this.state === "attack") {
      this.playAttack();
      this.playLegsWhileAttacking();
    } else if (this.state === "hurt") {
      this.playAnimation(this.IMAGES_HURT);
    } else if (this.state === "jump") {
      this.playJump();
    } else if (this.world.keyboard.RIGHT !== this.world.keyboard.LEFT) {
      this.playAnimation(this.world.keyboard.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
    } else {
      const idleTime = gameLoop.now() - this.idleSince;
      if (idleTime >= 10000) {
        this.playIdleLong();
      } else if (idleTime >= 3000) {
        this.playIdle(this.IMAGES_IDLE);
      } else {
        this.img = this.imageCache[this.IMAGES_JUMPING[0]];
        this.currentImage = 0;
      }
    }
  }

  updateState() {
    if (this.isDead()) {
      this.state = "dead";
    } else if (this.gettingHit()) {
      this.state = "hurt";
    } else if (this.attacking) {
      this.state = "attack";
    } else if (this.isAboveGround()) {
      this.state = "jump";
    } else if (this.world && this.world.keyboard.RIGHT !== this.world.keyboard.LEFT) {
      this.state = "run";
    } else {
      this.state = "idle";
    }
  }

  canPerformAction(action) {
    return this.stateActions[this.state].includes(action);
  }

  attack() {
    this.updateState();
    if (!this.canPerformAction("attack")) return;
    this.attacking = true;
    this.attackTick = 0;
    this.updateState();
  }

  jump() {
    this.updateState();
    if (!this.canPerformAction("jump")) return;
    super.jump();
    this.updateState();
  }

  hitByEnemy(enemy) {
    if (this.isDead() || this.isInvulnerable()) return false;
    this.invulnerableUntil = gameLoop.now() + 1000;
    this.hit();
    this.attacking = false;
    this.knockbackDirection = enemy.x + enemy.width / 2 < this.x + this.width / 2 ? 1 : -1;
    this.knockbackFrames = 10;
    this.speedY = 12;
    this.updateState();
    return true;
  }

  isInvulnerable() {
    return gameLoop.now() < this.invulnerableUntil;
  }

  playLegsWhileAttacking() {
    const key = this.world.keyboard;
    const moving = key.LEFT !== key.RIGHT;
    if (!moving && !this.isAboveGround()) return;
    const attackImg = this.img;
    if (this.isAboveGround()) this.playJump();
    else this.playAnimation(key.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
    this.legsImg = this.img;
    this.img = attackImg;
  }

  playAttack() {
    const frame = Math.floor(this.attackTick / this.attackTicksPerFrame);
    if (frame >= this.IMAGES_ATTACK.length) {
      this.attacking = false;
      return;
    }
    this.img = this.imageCache[this.IMAGES_ATTACK[frame]];
    if (this.attackTick === this.attackDamageFrame * this.attackTicksPerFrame) this.damageEnemiesInReach();
    this.attackTick++;
  }

  damageEnemiesInReach() {
    const box = this.getHitbox();
    const reach = {
      x: this.oppositeDirection ? box.x - this.attackReach : box.x + box.width,
      y: box.y,
      width: this.attackReach,
      height: box.height,
    };
    this.world.level.enemies.forEach((enemy) => {
      if (enemy.isDead()) return;
      const e = enemy.getHitbox();
      if (enemy instanceof FinalBoss) {
        const bossReach = {
          ...reach,
          x: this.oppositeDirection ? box.x - 120 : box.x + box.width,
          width: 120,
          y: box.y - 140,
          height: box.height + 140,
        };
        if (bossReach.x < e.x + e.width && bossReach.x + bossReach.width > e.x && bossReach.y < e.y + e.height && bossReach.y + bossReach.height > e.y) {
          if (enemy.hit()) this.world.triggerHitFeedback();
        }
      } else if (reach.x < e.x + e.width && reach.x + reach.width > e.x && reach.y < e.y + e.height && reach.y + reach.height > e.y) {
        if (enemy.hit()) this.world.triggerHitFeedback();
      }
    });
  }

  playJump() {
    const progress = (20 - this.speedY) / 40;
    const frame = Math.floor(progress * this.IMAGES_JUMPING.length);
    this.img = this.imageCache[this.IMAGES_JUMPING[Math.max(0, Math.min(frame, this.IMAGES_JUMPING.length - 1))]];
  }

  draw(ctx) {
    const blink = this.isInvulnerable() && Math.floor(gameLoop.now() / 100) % 2 === 0;
    if (!blink) {
      if (this.legsImg) {
        const s = this.width / 128;
        const { x, y, w, h } = this.legsArea;
        const lx = this.x + x * s,
          ly = this.y + y * s,
          lw = w * s,
          lh = h * s;
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x - 500, this.y - 500, this.width + 1000, this.height + 1000);
        ctx.rect(lx, ly, lw, lh);
        ctx.clip("evenodd");
        super.draw(ctx);
        ctx.restore();
        ctx.drawImage(this.legsImg, x, y, w, h, lx, ly, lw, lh);
      } else {
        super.draw(ctx);
      }
    }
    if (this.showBubble) {
      const frame = Math.floor(gameLoop.now() / 500) % this.IMAGES_BUBBLE.length;
      const bubble = this.imageCache[this.IMAGES_BUBBLE[frame]];
      const cx = this.x + this.width / 2;
      ctx.save();
      ctx.translate(cx, 0);
      if (this.oppositeDirection) ctx.scale(-1, 1);
      ctx.drawImage(bubble, 20, this.y + 35, 40, 45);
      ctx.restore();
    }
  }

  playIdleLong() {
    this.showBubble = true;
    this.img = this.imageCache[this.IMAGES_IDLE_LONG[this.idleLongFrame]];
    if (gameLoop.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = gameLoop.now();
    if (this.idleLongFrame < this.IMAGES_IDLE_LONG.length - 1) this.idleLongFrame++;
  }

  playIdle(images) {
    if (gameLoop.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = gameLoop.now();
    this.playAnimation(images);
  }
}
