import { CHARACTER_SETTING_KEYS, EXTRA_ATTACK_COIN_THRESHOLD, MALE_CHARACTER_CONFIG } from "../data.js";
import { gameLoop } from "./game-loop.class.js";
import { FinalBoss } from "./final-boss.class.js";
import { MoveableObject } from "./movable-object.class.js";

export class MaleCharacter extends MoveableObject {
  width;
  height;
  y;
  hp;
  speed;
  walkSpeed;
  runSpeedFactor;
  IMAGES_WALKING;
  IMAGES_RUNNING;
  IMAGES_IDLE;
  IMAGES_IDLE_LONG;
  idleSince = gameLoop.now();
  lastIdleFrame = 0;
  idleLongFrame = 0;
  animationElapsedMs = 0;
  IMAGES_JUMPING;
  IMAGES_STANDING;
  IMAGES_ATTACK;
  IMAGES_EXTRA_ATTACK;
  extraAttackDamageFrame;
  extraAttackReach;
  activeAttackImages;
  activeAttackDamageFrame;
  activeAttackReach;
  attackTick = 0;
  attackTicksPerFrame;
  legsImg = null;
  legsArea;
  attackDamageFrame;
  attackReach;
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
  drawHitbox = true;

  world;
  isDeathStarted = false;
  IMAGES_BUBBLE;
  isBubbleVisible = false;
  coins = 0;

  constructor(config = {}) {
    super();
    const settings = this.mergeSettings(config);
    this.applySettings(settings);
    this.loadMovementSprites(settings);
    this.loadCombatSprites(settings);
    this.img = this.imageCache[this.IMAGES_JUMPING[0]];
    this.animation();
    this.gravity();
  }

  mergeSettings(config) {
    return {
      ...MALE_CHARACTER_CONFIG,
      ...config,
      offset: { ...MALE_CHARACTER_CONFIG.offset, ...config.offset },
      legsArea: { ...MALE_CHARACTER_CONFIG.legsArea, ...config.legsArea },
      sprites: { ...MALE_CHARACTER_CONFIG.sprites, ...config.sprites },
    };
  }

  applySettings(settings) {
    CHARACTER_SETTING_KEYS.forEach((key) => {
      this[key] = settings[key];
    });
    this.speed = settings.walkSpeed;
  }

  loadCharacterSprites(settings, name) {
    const sprite = settings.sprites[name];
    if (!sprite) return [];
    return this.loadSpriteSheet(settings.spritePath + sprite.file, sprite.count, sprite.frameSize, sprite.frameHeight);
  }

  loadMovementSprites(settings) {
    this.IMAGES_WALKING = this.loadCharacterSprites(settings, "walking");
    this.IMAGES_RUNNING = this.loadCharacterSprites(settings, "running");
    this.IMAGES_IDLE = this.loadCharacterSprites(settings, "idle");
    this.IMAGES_IDLE_LONG = settings.sprites.idleLong ? this.loadCharacterSprites(settings, "idleLong") : this.IMAGES_IDLE;
    this.IMAGES_JUMPING = this.loadCharacterSprites(settings, "jumping");
    this.IMAGES_STANDING = settings.sprites.standing ? this.loadCharacterSprites(settings, "standing") : this.IMAGES_JUMPING;
  }

  loadCombatSprites(settings) {
    this.IMAGES_ATTACK = this.loadCharacterSprites(settings, "attack");
    this.IMAGES_EXTRA_ATTACK = this.loadCharacterSprites(settings, "extraAttack");
    this.setActiveAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach);
    this.IMAGES_HURT = this.loadCharacterSprites(settings, "hurt");
    this.IMAGES_DEAD = this.loadCharacterSprites(settings, "dead");
    this.IMAGES_BUBBLE = this.loadCharacterSprites(settings, "bubble");
  }

  animation() {
    gameLoop.runEvery(1000 / 60, () => this.updateCharacter());
  }

  updateCharacter() {
    if (!this.isDead()) {
      this.updateInput();
      this.updatePhysics();
    }
    this.updateState();
    this.tickAnimation();
  }

  tickAnimation() {
    this.animationElapsedMs += gameLoop.fixedStepMs;
    if (this.animationElapsedMs < 25) return;
    this.animationElapsedMs -= 25;
    this.updateAnimation();
  }

  updateInput() {
    const key = this.world.keyboard;
    this.speed = key.SHIFT ? this.walkSpeed * this.runSpeedFactor : this.walkSpeed;
    if (key.LEFT || key.RIGHT || key.SPACE || this.isAttacking || this.isAboveGround() || this.gettingHit()) {
      this.idleSince = gameLoop.now();
      this.idleLongFrame = 0;
    }
  }

  updatePhysics() {
    this.updateMovement();
    this.applyKnockback();
    this.x = Math.max(0, Math.min(this.world.level.levelEndX, this.x));
    this.world.cameraX = -this.x;
  }

  updateMovement() {
    const key = this.world.keyboard;
    if (key.RIGHT && !key.LEFT && this.x < this.world.level.levelEndX) this.moveRight();
    if (key.LEFT && !key.RIGHT && this.x > 0) this.moveLeft();
  }

  applyKnockback() {
    if (this.knockbackFrames <= 0) return;
    this.x += this.knockbackDirection * 2.5;
    this.knockbackFrames--;
  }

  updateAnimation() {
    this.isBubbleVisible = false;
    this.legsImg = null;
    if (this.state === "dead") this.playDeathAnimation();
    else if (this.state === "attack") this.playAttackWithLegs();
    else if (this.state === "hurt") this.playAnimation(this.IMAGES_HURT);
    else if (this.state === "jump") this.playJump();
    else if (this.world.keyboard.RIGHT !== this.world.keyboard.LEFT) this.playMovement();
    else this.playIdleState();
  }

  playDeathAnimation() {
    if (!this.isDeathStarted) {
      this.isDeathStarted = true;
      this.currentImage = 0;
    }
    if (this.currentImage < this.IMAGES_DEAD.length * 4) {
      this.img = this.imageCache[this.IMAGES_DEAD[Math.floor(this.currentImage / 4)]];
      this.currentImage++;
    }
  }

  playAttackWithLegs() {
    this.playAttack();
    this.playLegsWhileAttacking();
  }

  playMovement() {
    this.playAnimation(this.world.keyboard.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
  }

  playIdleState() {
    const idleTime = gameLoop.now() - this.idleSince;
    if (idleTime >= 10000) this.playIdleLong();
    else if (idleTime >= 3000) this.playIdle(this.IMAGES_IDLE);
    else this.playStanding();
  }

  playStanding() {
    this.img = this.imageCache[this.IMAGES_STANDING[0]];
    this.currentImage = 0;
  }

  updateState() {
    this.state = this.getState();
  }

  getState() {
    if (this.isDead()) return "dead";
    if (this.gettingHit()) return "hurt";
    if (this.isAttacking) return "attack";
    if (this.isAboveGround()) return "jump";
    if (this.world && this.world.keyboard.RIGHT !== this.world.keyboard.LEFT) return "run";
    return "idle";
  }

  canPerformAction(action) {
    return this.stateActions[this.state].includes(action);
  }

  attack() {
    this.updateState();
    if (!this.canPerformAction("attack")) return;
    this.startAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach);
  }

  extraAttack() {
    this.updateState();
    if (!this.canPerformAction("attack") || this.coins < EXTRA_ATTACK_COIN_THRESHOLD) return;
    this.startAttack(this.IMAGES_EXTRA_ATTACK, this.extraAttackDamageFrame, this.extraAttackReach);
  }

  startAttack(images, damageFrame, reach) {
    this.isAttacking = true;
    this.attackTick = 0;
    this.setActiveAttack(images, damageFrame, reach);
    this.updateState();
  }

  setActiveAttack(images, damageFrame, reach) {
    this.activeAttackImages = images;
    this.activeAttackDamageFrame = damageFrame;
    this.activeAttackReach = reach;
  }

  collectCoin() {
    this.coins++;
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
    this.isAttacking = false;
    this.startKnockback(enemy);
    this.updateState();
    return true;
  }

  startKnockback(enemy) {
    this.knockbackDirection = enemy.x + enemy.width / 2 < this.x + this.width / 2 ? 1 : -1;
    this.knockbackFrames = 10;
    this.speedY = 12;
  }

  isInvulnerable() {
    return gameLoop.now() < this.invulnerableUntil;
  }

  playLegsWhileAttacking() {
    const key = this.world.keyboard;
    const isMoving = key.LEFT !== key.RIGHT;
    if (!isMoving && !this.isAboveGround()) return;
    const attackImg = this.img;
    if (this.isAboveGround()) this.playJump();
    else this.playAnimation(key.SHIFT ? this.IMAGES_RUNNING : this.IMAGES_WALKING);
    this.legsImg = this.img;
    this.img = attackImg;
  }

  playAttack() {
    const frame = Math.floor(this.attackTick / this.attackTicksPerFrame);
    if (frame >= this.activeAttackImages.length) {
      this.finishAttack();
      return;
    }
    this.img = this.imageCache[this.activeAttackImages[frame]];
    if (this.attackTick === this.activeAttackDamageFrame * this.attackTicksPerFrame) this.damageEnemiesInReach();
    this.attackTick++;
  }

  finishAttack() {
    this.isAttacking = false;
    this.setActiveAttack(this.IMAGES_ATTACK, this.attackDamageFrame, this.attackReach);
  }

  damageEnemiesInReach() {
    const box = this.getHitbox();
    this.world.level.enemies.forEach((enemy) => {
      if (enemy.isDead()) return;
      const reach = enemy instanceof FinalBoss ? this.getBossReach(box) : this.getReach(box);
      if (!this.world.hitboxesOverlap(reach, enemy.getHitbox())) return;
      if (enemy.hit()) this.world.triggerHitFeedback();
    });
  }

  getReach(box) {
    return {
      x: this.isOppositeDirection ? box.x - this.activeAttackReach : box.x + box.width,
      y: box.y,
      width: this.activeAttackReach,
      height: box.height,
    };
  }

  getBossReach(box) {
    const width = Math.max(120, this.activeAttackReach);
    return {
      x: this.isOppositeDirection ? box.x - width : box.x + box.width,
      y: box.y - 140,
      width,
      height: box.height + 140,
    };
  }

  playJump() {
    const progress = (20 - this.speedY) / 40;
    const frame = Math.floor(progress * this.IMAGES_JUMPING.length);
    this.img = this.imageCache[this.IMAGES_JUMPING[Math.max(0, Math.min(frame, this.IMAGES_JUMPING.length - 1))]];
  }

  draw(ctx) {
    const isBlinking = this.isInvulnerable() && Math.floor(gameLoop.now() / 100) % 2 === 0;
    if (!isBlinking) this.drawBody(ctx);
    if (this.isBubbleVisible && this.IMAGES_BUBBLE.length > 0) this.drawBubble(ctx);
  }

  drawBody(ctx) {
    if (this.legsImg) this.drawWithLegs(ctx);
    else super.draw(ctx);
  }

  drawWithLegs(ctx) {
    const { x, y, w, h } = this.legsArea;
    const legs = this.getLegsRect();
    ctx.save();
    this.clipOutRect(ctx, legs);
    super.draw(ctx);
    ctx.restore();
    ctx.drawImage(this.legsImg, x, y, w, h, legs.x, legs.y, legs.width, legs.height);
  }

  getLegsRect() {
    const scale = this.width / 128;
    const { x, y, w, h } = this.legsArea;
    return { x: this.x + x * scale, y: this.y + y * scale, width: w * scale, height: h * scale };
  }

  clipOutRect(ctx, rect) {
    ctx.beginPath();
    ctx.rect(this.x - 500, this.y - 500, this.width + 1000, this.height + 1000);
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip("evenodd");
  }

  drawBubble(ctx) {
    const frame = Math.floor(gameLoop.now() / 500) % this.IMAGES_BUBBLE.length;
    const bubble = this.imageCache[this.IMAGES_BUBBLE[frame]];
    ctx.save();
    ctx.translate(this.x + this.width / 2, 0);
    if (this.isOppositeDirection) ctx.scale(-1, 1);
    ctx.drawImage(bubble, 20, this.y + 35, 40, 45);
    ctx.restore();
  }

  playIdle(images) {
    if (gameLoop.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = gameLoop.now();
    this.playAnimation(images);
  }

  playIdleLong() {
    this.isBubbleVisible = this.IMAGES_BUBBLE.length > 0;
    this.img = this.imageCache[this.IMAGES_IDLE_LONG[this.idleLongFrame]];
    if (gameLoop.now() - this.lastIdleFrame < 150) return;
    this.lastIdleFrame = gameLoop.now();
    if (this.idleLongFrame < this.IMAGES_IDLE_LONG.length - 1) this.idleLongFrame++;
  }
}
