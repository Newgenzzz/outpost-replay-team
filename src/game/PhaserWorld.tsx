import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import Phaser from 'phaser';
import { LunarWorld } from './LunarWorld';
import { renderCounter } from '../utils/renderDiagnostics';
import { destroyWorldRenderer, updateWorldRendering } from '../utils/renderPolicy';
import type {
  Point,
  StationNode,
  WorldBridge,
  WorldSnapshot,
  WorldTelemetryPayload,
} from './world';

export interface WorldHandle {
  focus: () => void;
  move: (direction: Point) => void;
  nudge: (direction: Point) => void;
  interact: () => void;
  reset: () => void;
  teleportTo: (point: Point) => void;
  walkTo: (point: Point) => void;
  setDrillHeld: (held: boolean) => void;
}

interface Props {
  snapshot: WorldSnapshot;
  paused: boolean;
  /** Freeze the obscured world while the science deck owns the GPU. Queued changes apply on wake. */
  suspendRendering?: boolean;
  label: string;
  onReady: () => void;
  onError: (message: string) => void;
  onNearby: (station: StationNode | null) => void;
  onInteract: (station: StationNode) => void;
  onTelemetry: (payload: WorldTelemetryPayload) => void;
  onToggleRover: () => void;
  onDrillTick: (nearIceIdx: number, dt: number) => void;
  onCollectSample?: (sampleIdx: number) => void;
}

export const PhaserWorld = forwardRef<WorldHandle, Props>(function PhaserWorld(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const bridge = useRef<WorldBridge | null>(null);
  const latest = useRef(props);
  const instance = useRef<Phaser.Game | null>(null);

  useLayoutEffect(() => {
    latest.current = props;
    if (bridge.current) {
      bridge.current.paused = props.paused;
      bridge.current.snapshot = props.snapshot;
    }
  }, [props]);

  useEffect(() => {
    if (instance.current) updateWorldRendering(instance.current, Boolean(props.suspendRendering));
  }, [props.suspendRendering]);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        if (!bridge.current?.paused) host.current?.focus({ preventScroll: true });
      },
      move: (direction) => {
        if (bridge.current) {
          bridge.current.direction = direction;
          bridge.current.nudgeUntil = 0;
        }
      },
      nudge: (direction) => {
        if (bridge.current && !bridge.current.paused) {
          bridge.current.direction = direction;
          bridge.current.nudgeUntil = performance.now() + 155;
        }
      },
      interact: () => {
        if (bridge.current) bridge.current.interactRequested = true;
      },
      reset: () => {
        if (bridge.current) {
          bridge.current.resetRequested = true;
          bridge.current.direction = { x: 0, y: 0 };
          bridge.current.teleportTarget = null;
          bridge.current.walkToTarget = null;
        }
      },
      teleportTo: (point) => {
        if (bridge.current) bridge.current.teleportTarget = point;
      },
      walkTo: (point) => {
        if (bridge.current) bridge.current.walkToTarget = point;
      },
      setDrillHeld: (held) => {
        if (bridge.current) bridge.current.drillHeld = held;
      },
    }),
    [],
  );

  useEffect(() => {
    if (!host.current) return;
    const b: WorldBridge = {
      host: host.current,
      paused: latest.current.paused,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      direction: { x: 0, y: 0 },
      nudgeUntil: 0,
      interactRequested: false,
      resetRequested: false,
      drillHeld: false,
      teleportTarget: null,
      walkToTarget: null,
      snapshot: latest.current.snapshot,
      onReady: () => latest.current.onReady(),
      onError: (message) => latest.current.onError(message),
      onNearby: (station) => latest.current.onNearby(station),
      onInteract: (station) => latest.current.onInteract(station),
      onTelemetry: (payload) => latest.current.onTelemetry(payload),
      onToggleRover: () => latest.current.onToggleRover(),
      onDrillTick: (idx, dt) => latest.current.onDrillTick(idx, dt),
      onCollectSample: (idx) => latest.current.onCollectSample?.(idx),
    };
    bridge.current = b;

    let game: Phaser.Game;
    try {
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host.current,
        backgroundColor: '#0c1824',
        transparent: false,
        // All sound is mixed by soundFX; Phaser must not create an unused audio context.
        audio: { noAudio: true },
        scale: {
          mode: Phaser.Scale.RESIZE,
          width: host.current.clientWidth,
          height: host.current.clientHeight,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: { antialias: true, roundPixels: false },
        physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
        scene: new LunarWorld(b),
        banner: false,
      });
    } catch (error) {
      latest.current.onError(
        error instanceof Error ? error.message : 'Unable to start the game renderer.',
      );
      return;
    }

    instance.current = game;
    // READY precedes loop.start. Also reapply suspension after a browser visibility resume.
    game.events.on(Phaser.Core.Events.POST_RENDER, () => updateWorldRendering(game, Boolean(latest.current.suspendRendering)));
    game.events.once(Phaser.Core.Events.READY, () => {
      game.events.on(Phaser.Core.Events.POST_RENDER, renderCounter(game.canvas, 'phaser'));
    });
    const observer = new ResizeObserver(() => {
      const element = host.current;
      if (element && game.isBooted) game.scale.resize(element.clientWidth, element.clientHeight);
    });
    observer.observe(host.current);

    const blur = () => {
      b.direction = { x: 0, y: 0 };
      b.nudgeUntil = 0;
      b.drillHeld = false;
    };
    window.addEventListener('blur', blur);

    return () => {
      observer.disconnect();
      window.removeEventListener('blur', blur);
      bridge.current = null;
      instance.current = null;
      destroyWorldRenderer(game);
    };
  }, []);

  return (
    <div
      ref={host}
      className="phaser-world"
      tabIndex={0}
      role="region"
      aria-label={props.label}
      onPointerDown={() => host.current?.focus({ preventScroll: true })}
    />
  );
});
