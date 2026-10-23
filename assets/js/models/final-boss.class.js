class FinalBoss extends MoveableObject {
  IMAGES_IDLE = [];
  IMAGES_ATTACK = [];
  IMAGES_HURT = [];
  width = 350;
  height = 315;
  y = 90;
  baseY = 90;
  floatAmplitude = 15;
  floatSpeed = 0.002;
  hp = 10;
  maxHp = 10;
  offset = { top: 95, right: 105, bottom: 65, left: 95 };
  target = null;
  isAttacking = false;
  attackHitRegistered = false;
  phase = "normal";
  normalAttackCooldown = 3000;
  enragedAttackCooldown = 2500;
  attackRange = 300;
  normalAttackFrameDuration = 115;
  enragedAttackFrameDuration = 95;
  attackStartedAt = Number.NEGATIVE_INFINITY;
  hurtStartedAt = Number.NEGATIVE_INFINITY;
  hurtFrameDuration = 100;
  lastIdleFrameAt = 0;
  currentImage = 0;

  constructor() {
    super();
    this.IMAGES_IDLE = this.loadSpriteSheet("assets/images/4_final_boss/demon_king/demon-idle.png", 6, 160, 144);
    this.IMAGES_ATTACK = this.loadSpriteSheet("assets/images/4_final_boss/demon_king/demon-attack.png", 11, 240, 192);
    this.IMAGES_HURT = this.loadSpriteSheet("assets/images/4_final_boss/demon_king/demon-hurt.png", 8, 192, 176);
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
    this.x = 2500;
    this.animation();
  }

  animation() {
    gameLoop.runEvery(1000 / 60, () => {
      this.updateEnragePhase();

      if (this.gettingHit() && !this.isDead()) {
        const frame = Math.min(Math.floor((gameLoop.now() - this.hurtStartedAt) / this.hurtFrameDuration), this.IMAGES_HURT.length - 1);
        this.currentImage = frame;
        this.img = this.imageCache[this.IMAGES_HURT[frame]];
        return;
      }

      if (this.isAttacking) {
        const frame = Math.floor((gameLoop.now() - this.attackStartedAt) / this.getAttackFrameDuration());
        if (frame >= this.IMAGES_ATTACK.length) {
          this.isAttacking = false;
          this.currentImage = 0;
          this.playAnimation(this.IMAGES_IDLE);
          return;
        }
        this.currentImage = frame;
        this.img = this.imageCache[this.IMAGES_ATTACK[frame]];
        return;
      }

      if (gameLoop.now() - this.lastIdleFrameAt >= 200) {
        this.currentImage = (this.currentImage + 1) % this.IMAGES_IDLE.length;
        this.img = this.imageCache[this.IMAGES_IDLE[this.currentImage]];
        this.lastIdleFrameAt = gameLoop.now();
      }
      if (this.isDead() || !this.target || this.target.x >= this.x) return;

      const distance = this.x - (this.target.x + this.target.width);
      if (distance <= this.attackRange && gameLoop.now() - this.attackStartedAt >= this.getAttackCooldown()) {
        this.startAttack();
      }
    });
    gameLoop.runEvery(1000 / 60, () => this.float());
  }

  updateEnragePhase() {
    if (this.phase === "normal" && this.hp <= this.maxHp / 2) {
      this.phase = "enraged";
    }
  }

  getAttackCooldown() {
    return this.isEnraged() ? this.enragedAttackCooldown : this.normalAttackCooldown;
  }

  getAttackFrameDuration() {
    return this.isEnraged() ? this.enragedAttackFrameDuration : this.normalAttackFrameDuration;
  }

  isEnraged() {
    return this.phase === "enraged";
  }

  hit() {
    if (this.isDead()) return;
    super.hit();
    this.isAttacking = false;
    this.hurtStartedAt = gameLoop.now();
    this.currentImage = 0;
    if (!this.isDead()) this.img = this.imageCache[this.IMAGES_HURT[0]];
  }

  startAttack() {
    this.isAttacking = true;
    this.attackHitRegistered = false;
    this.attackStartedAt = gameLoop.now();
    this.currentImage = 0;
    this.img = this.imageCache[this.IMAGES_ATTACK[0]];
  }

  getHitbox() {
    return {
      x: this.x + this.offset.left,
      y: this.y + this.offset.top,
      width: this.width - this.offset.left - this.offset.right,
      height: this.height - this.offset.top - this.offset.bottom,
    };
  }

  getAttackHitbox() {
    const hitbox = this.getHitbox();
    const fireExpansion = this.getFireExpansion();
    return {
      x: hitbox.x - fireExpansion.left,
      y: hitbox.y,
      width: hitbox.width + fireExpansion.left,
      height: hitbox.height + fireExpansion.bottom,
    };
  }

  getFireExpansion() {
    if (!this.isAttacking) return { left: 0, bottom: 0 };

    const expansions = [0, 0, 0, 0, 0, 0, 40, 95, 150, 150, 100];
    const frame = Math.min(this.currentImage, expansions.length - 1);
    const expansion = Math.round(expansions[frame] * (this.isEnraged() ? 1.3 : 1));
    return { left: expansion, bottom: Math.round(expansion * 0.3) };
  }

  float() {
    this.y = this.baseY + Math.sin(gameLoop.now() * this.floatSpeed) * this.floatAmplitude;
  }
}
