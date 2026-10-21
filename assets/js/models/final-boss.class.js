class FinalBoss extends MoveableObject {
  width = 350;
  height = 450;
  y = 10;
  IMAGES_WALKING = [
    "assets/images/4_enemie_boss_chicken/2_alert/G5.png",
    "assets/images/4_enemie_boss_chicken/2_alert/G6.png",
    "assets/images/4_enemie_boss_chicken/2_alert/G7.png",
    "assets/images/4_enemie_boss_chicken/2_alert/G8.png",
    "assets/images/4_enemie_boss_chicken/2_alert/G9.png",
    "assets/images/4_enemie_boss_chicken/2_alert/G10.png",
    "assets/images/4_enemie_boss_chicken/2_alert/G11.png",
    "assets/images/4_enemie_boss_chicken/2_alert/G12.png",
  ];

  constructor() {
    super();
    this.loadImage(this.IMAGES_WALKING[7]);
    this.loadImages(this.IMAGES_WALKING);
    this.x = 2000;
    this.animation();
  }

  animation() {
    setInterval(() => {
      this.playAnimation(this.IMAGES_WALKING);
    }, 200);
  }
}
