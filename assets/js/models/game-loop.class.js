class GameLoop {
  fixedStepSeconds = 1 / 60;
  fixedStepMs = 1000 / 60;
  maxFrameDurationMs = 250;
  scheduledTasks = [];
  updateCallback = null;
  renderCallback = null;
  isRunning = false;
  isPaused = false;
  lastFrameTimeMs = 0;
  accumulatorMs = 0;
  gameTimeMs = 0;
  animationFrameId = 0;

  now() {
    return this.gameTimeMs;
  }

  runEvery(intervalMs, callback) {
    const task = { intervalMs, callback, elapsedMs: 0, isActive: true };
    this.scheduledTasks.push(task);
    return () => (task.isActive = false);
  }

  runOnceAfter(delayMs, callback) {
    const cancel = this.runEvery(delayMs, () => {
      cancel();
      callback();
    });
    return cancel;
  }

  start(updateCallback, renderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTimeMs = performance.now();
    this.accumulatorMs = 0;
    this.animationFrameId = requestAnimationFrame((timeMs) => this.onAnimationFrame(timeMs));
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.lastFrameTimeMs = performance.now();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  onAnimationFrame(currentTimeMs) {
    if (!this.isRunning) return;
    const frameDurationMs = Math.min(Math.max(currentTimeMs - this.lastFrameTimeMs, 0), this.maxFrameDurationMs);
    this.lastFrameTimeMs = currentTimeMs;
    if (!this.isPaused) {
      this.accumulatorMs += frameDurationMs;
      while (this.accumulatorMs >= this.fixedStepMs) {
        this.gameTimeMs += this.fixedStepMs;
        this.runScheduledTasks(this.fixedStepMs);
        if (this.updateCallback) this.updateCallback(this.fixedStepSeconds);
        this.accumulatorMs -= this.fixedStepMs;
      }
    } else {
      this.accumulatorMs = 0;
    }
    if (this.renderCallback) this.renderCallback();
    this.animationFrameId = requestAnimationFrame((timeMs) => this.onAnimationFrame(timeMs));
  }

  runScheduledTasks(frameDurationMs) {
    for (const task of this.scheduledTasks) {
      if (!task.isActive) continue;
      task.elapsedMs += frameDurationMs;
      while (task.elapsedMs >= task.intervalMs && task.isActive) {
        task.elapsedMs -= task.intervalMs;
        task.callback();
      }
    }
    this.scheduledTasks = this.scheduledTasks.filter((task) => task.isActive);
  }
}
const gameLoop = new GameLoop();
