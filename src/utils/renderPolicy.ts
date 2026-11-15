/** Keep an offscreen hologram dormant, and render a paused one only after changes. */
export function hologramFrameLoop(visible: boolean, autoRotate: boolean): 'always' | 'demand' | 'never' {
  if (!visible) return 'never';
  return autoRotate ? 'always' : 'demand';
}

interface WorldRendererLoop {
  running: boolean;
  sleep(): void;
  wake(): void;
}

/** Do not race Phaser's asynchronous boot; repeated visibility updates are harmless. */
export function updateWorldRendering(
  game: { isRunning: boolean; loop: WorldRendererLoop },
  suspended: boolean,
): void {
  if (!game.isRunning) return;
  if (suspended && game.loop.running) game.loop.sleep();
  else if (!suspended && !game.loop.running) game.loop.wake();
}

/** Phaser destroys on its next step, so a sleeping loop must run that cleanup step. */
export function destroyWorldRenderer(
  game: { destroy(removeCanvas: boolean): void; loop: Pick<WorldRendererLoop, 'running' | 'wake'> },
): void {
  game.destroy(true);
  if (!game.loop.running) game.loop.wake();
}
