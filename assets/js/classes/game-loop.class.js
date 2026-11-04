/** Fixed-step game loop with game time, scheduled tasks, pause, hit stop, start delay and intro time. */
class GameLoop {
  fixedStepSeconds = 1 / 60;
  fixedStepMs = 1000 / 60;
  maxFrameDurationMs = 250;
  scheduledTasks = [];
  delayedTasks = [];
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
  introDurationMs = 0;
  introRemainingMs = 0;

  /**
   * Gets the current game time.
   * @returns {number} Game time in milliseconds.
   */
  now() {
    return this.gameTimeMs;
  }

  /**
   * Whether the start delay is still running.
   * @returns {boolean} True during the start delay.
   */
  get isStarting() {
    return this.startDelayRemainingMs > 0;
  }

  /**
   * Whether the camera intro is playing.
   * @returns {boolean} True during the intro.
   */
  get isIntroPlaying() {
    return this.introRemainingMs > 0;
  }

  /**
   * Time since the intro started.
   * @returns {number} Elapsed intro time in milliseconds.
   */
  get introElapsedMs() {
    return this.introDurationMs - this.introRemainingMs;
  }

  /**
   * Runs a callback repeatedly in game time.
   * @param {number} intervalMs - Interval in milliseconds.
   * @param {Function} callback - Task to run.
   * @returns {Function} Function that cancels the task.
   */
  runEvery(intervalMs, callback) {
    const task = { intervalMs, callback, elapsedMs: 0, isActive: true };
    this.scheduledTasks.push(task);
    return () => (task.isActive = false);
  }

  /**
   * Runs a callback once after a delay; the delay pauses with the game.
   * @param {number} delayMs - Delay in milliseconds.
   * @param {Function} callback - Task to run.
   */
  runAfter(delayMs, callback) {
    this.delayedTasks.push({ remainingMs: delayMs, callback });
  }

  /**
   * Starts the loop or replaces its callbacks if already running.
   * @param {Function} updateCallback - Called each fixed step with the step in seconds.
   * @param {Function} renderCallback - Called once per animation frame.
   * @param {number} [startDelayMs=0] - Time before game time starts to advance.
   */
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

  /**
   * Starts an intro during which game time is frozen.
   * @param {number} durationMs - Intro duration in milliseconds.
   */
  startIntro(durationMs) {
    this.introDurationMs = durationMs;
    this.introRemainingMs = durationMs;
  }

  /** Ends the intro immediately. */
  skipIntro() {
    this.introRemainingMs = 0;
  }

  /** Pauses or resumes the game time. */
  togglePause() {
    this.isPaused = !this.isPaused;
    this.lastFrameTimeMs = performance.now();
  }

  /**
   * Freezes the game briefly for hit impact.
   * @param {number} [durationMs=60] - Freeze duration in real milliseconds.
   */
  hitStop(durationMs = 60) {
    this.hitStopUntilMs = Math.max(this.hitStopUntilMs, performance.now() + durationMs);
    this.accumulatorMs = 0;
  }

  /** Stops the loop and clears all tasks, callbacks and timing. */
  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    this.scheduledTasks = [];
    this.delayedTasks = [];
    this.updateCallback = null;
    this.renderCallback = null;
    this.resetTiming();
  }

  /** Resets pause, game time, hit stop, start delay and intro. */
  resetTiming() {
    this.isPaused = false;
    this.accumulatorMs = 0;
    this.gameTimeMs = 0;
    this.hitStopUntilMs = 0;
    this.startDelayRemainingMs = 0;
    this.introDurationMs = 0;
    this.introRemainingMs = 0;
  }

  /**
   * Advances time, renders and requests the next frame.
   * @param {number} currentTimeMs - Timestamp from requestAnimationFrame.
   */
  onAnimationFrame(currentTimeMs) {
    if (!this.isRunning) return;
    const frameDurationMs = Math.min(Math.max(currentTimeMs - this.lastFrameTimeMs, 0), this.maxFrameDurationMs);
    this.lastFrameTimeMs = currentTimeMs;
    this.advanceTime(currentTimeMs, frameDurationMs);
    if (!this.isRunning) return;
    if (this.renderCallback) this.renderCallback();
    this.animationFrameId = requestAnimationFrame((timeMs) => this.onAnimationFrame(timeMs));
  }

  /**
   * Adds frame time to the accumulator and runs delayed tasks and fixed steps unless paused or in hit stop.
   * @param {number} currentTimeMs - Current real time.
   * @param {number} frameDurationMs - Duration of this frame.
   */
  advanceTime(currentTimeMs, frameDurationMs) {
    if (this.isPaused || currentTimeMs < this.hitStopUntilMs) {
      this.accumulatorMs = 0;
      return;
    }
    this.accumulatorMs += this.consumeDelays(frameDurationMs);
    this.runDelayedTasks(frameDurationMs);
    this.runFixedSteps(currentTimeMs);
  }

  /**
   * Counts down delayed tasks and runs the due ones.
   * @param {number} frameDurationMs - Duration of this frame.
   */
  runDelayedTasks(frameDurationMs) {
    this.delayedTasks.forEach((task) => (task.remainingMs -= frameDurationMs));
    const dueTasks = this.delayedTasks.filter((task) => task.remainingMs <= 0);
    this.delayedTasks = this.delayedTasks.filter((task) => task.remainingMs > 0);
    dueTasks.forEach((task) => task.callback());
  }

  /**
   * Uses frame time for the start delay and intro first.
   * @param {number} frameDurationMs - Duration of this frame.
   * @returns {number} Remaining frame time for the game.
   */
  consumeDelays(frameDurationMs) {
    const afterStartDelayMs = this.consumeDelay("startDelayRemainingMs", frameDurationMs);
    return this.consumeDelay("introRemainingMs", afterStartDelayMs);
  }

  /**
   * Uses frame time to count down one delay field.
   * @param {string} delayField - Name of the delay property.
   * @param {number} frameDurationMs - Available frame time.
   * @returns {number} Frame time left after the delay.
   */
  consumeDelay(delayField, frameDurationMs) {
    const delayElapsedMs = Math.min(frameDurationMs, this[delayField]);
    this[delayField] -= delayElapsedMs;
    return frameDurationMs - delayElapsedMs;
  }

  /**
   * Runs as many fixed steps as the accumulator allows.
   * @param {number} currentTimeMs - Current real time.
   */
  runFixedSteps(currentTimeMs) {
    while (this.isRunning && this.accumulatorMs >= this.fixedStepMs) {
      this.runFixedStep();
      if (!this.isRunning) return;
      this.accumulatorMs -= this.fixedStepMs;
      if (currentTimeMs < this.hitStopUntilMs) this.accumulatorMs = 0;
    }
  }

  /** Advances game time by one step and runs tasks and the update callback. */
  runFixedStep() {
    this.gameTimeMs += this.fixedStepMs;
    this.runScheduledTasks(this.fixedStepMs);
    if (this.updateCallback) this.updateCallback(this.fixedStepSeconds);
  }

  /**
   * Runs all active repeating tasks and removes cancelled ones.
   * @param {number} frameDurationMs - Elapsed time to add.
   */
  runScheduledTasks(frameDurationMs) {
    for (const task of this.scheduledTasks) {
      this.runTask(task, frameDurationMs);
    }
    this.scheduledTasks = this.scheduledTasks.filter((task) => task.isActive);
  }

  /**
   * Runs a repeating task once per elapsed interval.
   * @param {{intervalMs: number, callback: Function, elapsedMs: number, isActive: boolean}} task - Task to run.
   * @param {number} frameDurationMs - Elapsed time to add.
   */
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
