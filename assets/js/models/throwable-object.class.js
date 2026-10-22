class ThrowableObject extends MoveableObject {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
    this.loadImage("assets/images/6_salsa_bottle/salsa_bottle.png");
    this.throw(x, y);
  }

  throw(x, y) {
    this.speedY = 15;
    this.gravity();
    setInterval(() => {
      this.x += 10;
    }, 25);
  }
}
