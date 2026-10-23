class GameLoop {
  maxFrameDurationMs = 250;
  scheduledTasks = [];
  renderCallback = null;
  isRunning = false;
  lastFrameTimeMs = 0;
  animationFrameId = 0;

  // Führt callback alle intervalMs aus; gibt eine Funktion zum Abbrechen zurück.
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

  start(renderCallback) {
    this.renderCallback = renderCallback;
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTimeMs = performance.now();
    this.animationFrameId = requestAnimationFrame((timeMs) => this.onAnimationFrame(timeMs));
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  onAnimationFrame(currentTimeMs) {
    if (!this.isRunning) return;
    const frameDurationMs = Math.min(currentTimeMs - this.lastFrameTimeMs, this.maxFrameDurationMs);
    this.lastFrameTimeMs = currentTimeMs;
    this.runScheduledTasks(frameDurationMs);
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
