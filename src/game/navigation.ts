import type { Point } from './world';

export interface Rectangle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function contains(rect: Rectangle, point: Point): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function distance(from: Point, to: Point): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function corners(rect: Rectangle): Point[] {
  return [
    { x: rect.left - 2, y: rect.top - 2 },
    { x: rect.right + 2, y: rect.top - 2 },
    { x: rect.left - 2, y: rect.bottom + 2 },
    { x: rect.right + 2, y: rect.bottom + 2 },
  ];
}

export function nearestNavigablePoint(target: Point, bounds: Rectangle, obstacles: readonly Rectangle[]): Point | null {
  const clamp = (point: Point): Point => ({
    x: Math.max(bounds.left, Math.min(bounds.right, point.x)),
    y: Math.max(bounds.top, Math.min(bounds.bottom, point.y)),
  });
  const origin = clamp(target);
  if (!obstacles.some((obstacle) => contains(obstacle, origin))) return origin;

  let nearest: Point | null = null;
  let bestDistance = Infinity;
  for (const rect of obstacles) {
    const candidates = [
      { x: rect.left - 2, y: origin.y },
      { x: rect.right + 2, y: origin.y },
      { x: origin.x, y: rect.top - 2 },
      { x: origin.x, y: rect.bottom + 2 },
      ...corners(rect),
    ];
    for (const candidate of candidates) {
      const point = clamp(candidate);
      const gap = distance(origin, point);
      if (gap < bestDistance && !obstacles.some((obstacle) => contains(obstacle, point))) {
        nearest = point;
        bestDistance = gap;
      }
    }
  }
  return nearest;
}

function crosses(from: Point, to: Point, rect: Rectangle): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (!dx && (from.x < rect.left || from.x > rect.right)) return false;
  if (!dy && (from.y < rect.top || from.y > rect.bottom)) return false;
  const xs = dx ? [(rect.left - from.x) / dx, (rect.right - from.x) / dx] : [-Infinity, Infinity];
  const ys = dy ? [(rect.top - from.y) / dy, (rect.bottom - from.y) / dy] : [-Infinity, Infinity];
  return Math.max(0, Math.min(...xs), Math.min(...ys)) <= Math.min(1, Math.max(...xs), Math.max(...ys));
}

/** A visibility graph over obstacle corners provides short routes around physical footprints. */
export function planRoute(from: Point, to: Point, bounds: Rectangle, obstacles: readonly Rectangle[]): Point[] {
  const start = nearestNavigablePoint(from, bounds, obstacles);
  const goal = nearestNavigablePoint(to, bounds, obstacles);
  if (!start || !goal) return [];
  const entry = distance(from, start) > 1 ? [start] : [];
  const clear = (a: Point, b: Point) => !obstacles.some((rect) => crosses(a, b, rect));
  if (clear(start, goal)) return [...entry, goal];

  const nodes = [start, goal, ...obstacles.flatMap(corners).filter((point) =>
    contains(bounds, point) && !obstacles.some((rect) => contains(rect, point)),
  )];
  const costs = nodes.map(() => Infinity);
  const previous = nodes.map(() => -1);
  const visited = new Set<number>();
  costs[0] = 0;

  while (true) {
    let best = -1;
    let bestCost = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      const estimate = costs[i] + distance(nodes[i], goal);
      if (estimate < bestCost && !visited.has(i)) {
        best = i;
        bestCost = estimate;
      }
    }
    if (best === -1) return [];
    if (best === 1) {
      const path: Point[] = [];
      for (let i = best; i > 0; i = previous[i]) path.push(nodes[i]);
      return [...entry, ...path.reverse()];
    }
    visited.add(best);
    for (let i = 1; i < nodes.length; i++) {
      if (visited.has(i)) continue;
      const cost = costs[best] + distance(nodes[best], nodes[i]);
      if (cost < costs[i] && clear(nodes[best], nodes[i])) {
        costs[i] = cost;
        previous[i] = best;
      }
    }
  }
}
