class FinalBoss extends MoveableObject {
  width = 350;
  height = 315;
  y = 60;
  baseY = 60;
  floatAmplitude = 15;
  floatSpeed = 0.002;

  constructor() {
    super();
    this.IMAGES_IDLE = this.loadSpriteSheet("assets/images/4_final_boss/demon_king/demon-idle.png", 6, 160, 144);
    this.img = this.imageCache[this.IMAGES_IDLE[0]];
    this.x = 2500;
    this.animation();
  }

  animation() {
    setInterval(() => this.playAnimation(this.IMAGES_IDLE), 200);
    setInterval(() => this.float(), 1000 / 60);
  }

  float() {
    this.y = this.baseY + Math.sin(Date.now() * this.floatSpeed) * this.floatAmplitude;
  }
}
