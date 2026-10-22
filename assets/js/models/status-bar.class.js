class StatusBar extends DrawableObject {
  IMAGES = {
    HEALTH: "assets/images/7_statusbars/1_statusbar/2_statusbar_health/blue/0.png",
    HEALTH1: "assets/images/7_statusbars/1_statusbar/2_statusbar_health/blue/20.png",
    HEALTH2: "assets/images/7_statusbars/1_statusbar/2_statusbar_health/blue/40.png",
    HEALTH3: "assets/images/7_statusbars/1_statusbar/2_statusbar_health/blue/60.png",
    HEALTH4: "assets/images/7_statusbars/1_statusbar/2_statusbar_health/blue/80.png",
    HEALTH5: "assets/images/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png",
  };
  percentage = 100;

  constructor() {
    super();
    this.x = 10;
    this.y = 5;
    this.width = 150;
    this.height = 50;
    this.loadImages(Object.values(this.IMAGES));
    this.setPercentage(100);
  }

  setPercentage(percentage) {
    this.percentage = percentage;
    let path = this.IMAGES.HEALTH;
    if (percentage > 0) path = this.IMAGES.HEALTH1;
    if (percentage > 20) path = this.IMAGES.HEALTH2;
    if (percentage > 40) path = this.IMAGES.HEALTH3;
    if (percentage > 60) path = this.IMAGES.HEALTH4;
    if (percentage > 80) path = this.IMAGES.HEALTH5;
    this.img = this.imageCache[path];
  }
}
