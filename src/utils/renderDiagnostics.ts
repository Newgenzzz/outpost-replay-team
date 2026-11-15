/** Opt-in local QA counters (?renderStats=1). No visible UI or counter updates in normal play.
 * Counts renderer callbacks, not completed GPU frames or hardware FPS.
 */
export function renderCounter(canvas: HTMLCanvasElement, renderer: string) {
  if (new URLSearchParams(window.location.search).get('renderStats') !== '1') return () => {};
  canvas.dataset.renderProbe = renderer;
  canvas.dataset.renderFrames = '0';
  let frames = 0;
  return () => { canvas.dataset.renderFrames = String(++frames); };
}
