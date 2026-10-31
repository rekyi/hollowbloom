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
  hitStopUntilMs = 0;
  startDelayRemainingMs = 0;

  now() {
    return this.gameTimeMs;
  }

  get isStarting() {
    return this.startDelayRemainingMs > 0;
  }

  runEvery(intervalMs, callback) {
    const task = { intervalMs, callback, elapsedMs: 0, isActive: true };
    this.scheduledTasks.push(task);
    return () => (task.isActive = false);
  }

  start(updateCallback, renderCallback, startDelayMs = 0) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    if (this.isRunning) return;
    this.startDelayRemainingMs = Math.max(0, startDelayMs);
    this.isRunning = true;
    this.lastFrameTimeMs = performance.now();
    this.accumulatorMs = 0;
    this.animationFrameId = requestAnimationFrame((timeMs) => this.onAnimationFrame(timeMs));
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.lastFrameTimeMs = performance.now();
  }

  hitStop(durationMs = 60) {
    this.hitStopUntilMs = Math.max(this.hitStopUntilMs, performance.now() + durationMs);
    this.accumulatorMs = 0;
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    this.scheduledTasks = [];
    this.updateCallback = null;
    this.renderCallback = null;
    this.resetTiming();
  }

  resetTiming() {
    this.isPaused = false;
    this.accumulatorMs = 0;
    this.gameTimeMs = 0;
    this.hitStopUntilMs = 0;
    this.startDelayRemainingMs = 0;
  }

  onAnimationFrame(currentTimeMs) {
    if (!this.isRunning) return;
    const frameDurationMs = Math.min(Math.max(currentTimeMs - this.lastFrameTimeMs, 0), this.maxFrameDurationMs);
    this.lastFrameTimeMs = currentTimeMs;
    this.advanceTime(currentTimeMs, frameDurationMs);
    if (!this.isRunning) return;
    if (this.renderCallback) this.renderCallback();
    this.animationFrameId = requestAnimationFrame((timeMs) => this.onAnimationFrame(timeMs));
  }

  advanceTime(currentTimeMs, frameDurationMs) {
    if (this.isPaused || currentTimeMs < this.hitStopUntilMs) {
      this.accumulatorMs = 0;
      return;
    }
    if (this.startDelayRemainingMs > 0) {
      const delayElapsedMs = Math.min(frameDurationMs, this.startDelayRemainingMs);
      this.startDelayRemainingMs -= delayElapsedMs;
      frameDurationMs -= delayElapsedMs;
    }
    this.accumulatorMs += frameDurationMs;
    this.runFixedSteps(currentTimeMs);
  }

  runFixedSteps(currentTimeMs) {
    while (this.isRunning && this.accumulatorMs >= this.fixedStepMs) {
      this.runFixedStep();
      if (!this.isRunning) return;
      this.accumulatorMs -= this.fixedStepMs;
      if (currentTimeMs < this.hitStopUntilMs) this.accumulatorMs = 0;
    }
  }

  runFixedStep() {
    this.gameTimeMs += this.fixedStepMs;
    this.runScheduledTasks(this.fixedStepMs);
    if (this.updateCallback) this.updateCallback(this.fixedStepSeconds);
  }

  runScheduledTasks(frameDurationMs) {
    for (const task of this.scheduledTasks) {
      this.runTask(task, frameDurationMs);
    }
    this.scheduledTasks = this.scheduledTasks.filter((task) => task.isActive);
  }

  runTask(task, frameDurationMs) {
    if (!task.isActive) return;
    task.elapsedMs += frameDurationMs;
    while (task.elapsedMs >= task.intervalMs && task.isActive) {
      task.elapsedMs -= task.intervalMs;
      task.callback();
    }
  }
}
export const gameLoop = new GameLoop();
