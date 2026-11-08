import Phaser from 'phaser';
import { GAME_ART, svgDataUri } from './art';
import { CHARACTER } from './character';
import { nearestNavigablePoint, planRoute, type Rectangle } from './navigation';
import { BATTERY_CAPACITY_KWH } from '../engine/power';
import { fmt } from '../components/metricMeta';
import {
  AI_CREWMATES,
  BUILDINGS,
  FIELD_SAMPLES,
  ICE_DEPOSITS,
  IMPACT_CRATERS,
  ROCKS,
  STATIONS,
  WORLD,
  facingDirection,
  findNearbyStation,
  findNearestIceIndex,
  findNearestSampleIndex,
  footprintBounds,
  getElevationTier,
  groundAnchor,
  groundDepth,
  movementVector,
  terrainTraction,
  type AiCrewmateDef,
  type CropStatus,
  type Facing,
  type Point,
  type StationNode,
  type WorldBridge,
} from './world';
import { soundFX } from '../utils/soundEffects';

interface AiCrewRuntime {
  def: AiCrewmateDef;
  sprite: Phaser.GameObjects.Image;
  nameTag: Phaser.GameObjects.Text;
  speechTag: Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Ellipse;
  facing: Facing;
  waypointIdx: number;
  pauseUntil: number;
}

interface TireTrack {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  bornAt: number;
}

interface DustPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  size: number;
}

type FacilityReadout = 'solar' | 'habitat' | 'greenhouse' | 'ice' | 'shelter';

const NAV_BOUNDS: Rectangle = { left: 90, top: 150, right: WORLD.width - 90, bottom: WORLD.height - 70 };
const CROP_DISPLAY = {
  idle: { en: 'Trial inactive', az: 'Sınaq fəal deyil', text: '#b3c9ca', light: 0x9aafb2, opacity: 0.07 },
  ready: { en: 'Tray ready', az: 'Əkin qabı hazırdır', text: '#bfe3d9', light: 0x87cebd, opacity: 0.14 },
  growing: { en: 'Growing', az: 'Böyüyür', text: '#d3f6b6', light: 0xb9f5a7, opacity: 0.42 },
  paused: { en: 'Growth paused', az: 'Böyümə dayandı', text: '#ffdf9f', light: 0xe7af64, opacity: 0.1 },
  harvested: { en: 'Harvested', az: 'Məhsul yığıldı', text: '#baf5c1', light: 0x8ddeaa, opacity: 0.22 },
} satisfies Record<CropStatus, { en: string; az: string; text: string; light: number; opacity: number }>;

/** Renders the 2.5D training site and translates field input into world interactions. */
export class LunarWorld extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerNameTag!: Phaser.GameObjects.Text;
  private playerMarker!: Phaser.GameObjects.Ellipse;

  private carSprite!: Phaser.Physics.Arcade.Sprite;
  private carPromptTag!: Phaser.GameObjects.Text;
  private carRing!: Phaser.GameObjects.Ellipse;

  private droneSprite!: Phaser.GameObjects.Image;
  private droneScanRing!: Phaser.GameObjects.Ellipse;
  private droneTag!: Phaser.GameObjects.Text;
  private dronePos: Point = { x: 895, y: 495 };

  private ghostSprite!: Phaser.GameObjects.Image;
  private ghostTag!: Phaser.GameObjects.Text;

  private aiCrew: AiCrewRuntime[] = [];
  private tireTracks: TireTrack[] = [];
  private dustPuffs: DustPuff[] = [];
  private lastTrackPos: Point = { x: WORLD.roverSpawn.x, y: WORLD.roverSpawn.y };
  private geigerAt = 0;

  private facilityLights = new Map<number, Phaser.GameObjects.Arc[]>();
  private stationBadges = new Map<number, Phaser.GameObjects.Text>();
  private sectorLabels: Phaser.GameObjects.Text[] = [];
  private iceSprites: Phaser.GameObjects.Image[] = [];
  private iceGlows: Phaser.GameObjects.Ellipse[] = [];
  private sampleSprites: Phaser.GameObjects.Image[] = [];
  private sampleGlows: Phaser.GameObjects.Ellipse[] = [];
  private samplePrompts: Phaser.GameObjects.Text[] = [];

  private solarImage!: Phaser.GameObjects.Image;
  private shelterImage!: Phaser.GameObjects.Image;
  private isruGlow!: Phaser.GameObjects.Ellipse;
  private batteryLight!: Phaser.GameObjects.Rectangle;
  private habitatLight!: Phaser.GameObjects.Ellipse;
  private greenhouseImage!: Phaser.GameObjects.Image;
  private greenhouseLight!: Phaser.GameObjects.Ellipse;
  private cropTrack!: Phaser.GameObjects.Rectangle;
  private cropFill!: Phaser.GameObjects.Rectangle;
  private iceFill!: Phaser.GameObjects.Rectangle;
  private readouts = new Map<FacilityReadout, {
    panel: Phaser.GameObjects.Container;
    title: Phaser.GameObjects.Text;
    value: Phaser.GameObjects.Text;
    indicator: Phaser.GameObjects.Arc;
  }>();

  private targetHighlight!: Phaser.GameObjects.Ellipse;
  private beacon!: Phaser.GameObjects.Container;
  private terminalLabel!: Phaser.GameObjects.Text;
  private waypointRing!: Phaser.GameObjects.Ellipse;
  private tractionLabel!: Phaser.GameObjects.Text;

  private trackGfx!: Phaser.GameObjects.Graphics;
  private shade!: Phaser.GameObjects.Rectangle;
  private roverLamps: Phaser.GameObjects.Ellipse[] = [];
  private fxGfx!: Phaser.GameObjects.Graphics;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private facing: Facing = 'down';
  private carFacingLeft = false;
  private heading: Point = { x: 0, y: 1 };
  private nearStation: StationNode | null = null;
  private obstacles: Rectangle[] = [];
  private walkingObstacles: Rectangle[] = [];
  private drivingObstacles: Rectangle[] = [];
  private route: Point[] = [];
  private previewRoute: Point[] = [];
  private previewStep = 0;
  private previewAt = 0;
  private zoomAdjustment = 0;
  private targetZoom = 1;
  private facilityPulseAt = new Map<number, number>();
  private walkPace = 0;
  private wheelTravel = 0;
  private reportAt = 0;
  private stepSoundAt = 0;
  private lastSnapshot: WorldBridge['snapshot'] | null = null;
  private lastPaused = true;
  private wasControllingRover = false;

  constructor(private bridge: WorldBridge) {
    super('LunarWorld');
  }

  preload() {
    for (const asset of GAME_ART) {
      this.load.svg(`source:${asset.key}`, svgDataUri(asset.svg), {
        width: asset.width,
        height: asset.height,
      });
    }
    this.load.on('loaderror', () =>
      this.bridge.onError('Could not load original world artwork. Reload to retry.'),
    );
  }

  create() {
    // Pre-rasterize SVGs so the canvas reuses textures during play.
    for (const asset of GAME_ART) {
      const sourceKey = `source:${asset.key}`;
      const texture = this.textures.createCanvas(asset.key, asset.width, asset.height);
      if (!texture) {
        this.bridge.onError(`Could not prepare artwork: ${asset.key}`);
        return;
      }
      const ctx = texture.getContext();
      ctx.drawImage(
        this.textures.get(sourceKey).getSourceImage() as HTMLImageElement,
        0,
        0,
        asset.width,
        asset.height,
      );
      texture.refresh();
      this.textures.remove(sourceKey);
    }

    this.add.image(0, 0, 'terrain').setOrigin(0).setDepth(-100);
    this.physics.world.setBounds(48, 120, WORLD.width - 96, WORLD.height - 165);
    this.drawInfrastructure();

    this.trackGfx = this.add.graphics().setDepth(-6);

    // Static Obstacles: 2.5D Buildings + Lunar Boulders
    const obstacles = this.physics.add.staticGroup();
    const addObstacle = ({ x, y, width, height }: ReturnType<typeof footprintBounds>) => {
      obstacles.add(this.add.zone(x, y, width, height));
      this.obstacles.push({
        left: x - width / 2,
        right: x + width / 2,
        top: y - height / 2,
        bottom: y + height / 2,
      });
    };
    for (const building of BUILDINGS) {
      const art = GAME_ART.find((a) => a.key === building.artKey)!;
      const image = this.add
        .image(0, 0, building.artKey)
        .setOrigin(0.5, groundAnchor(art) / art.height);
      const group = this.add
        .container(building.x, building.y, [image])
        .setDepth(groundDepth(building.y));

      if (building.id === 'solar') {
        this.solarImage = image;
        this.createFacilityReadout('solar', building.x - 27, building.y + 22, 156);
      }
      if (building.id === 'battery') {
        this.batteryLight = this.add
          .rectangle(-33, -33, 25, 4, 0xb8e3a1).setOrigin(0, 0.5)
          .setRotation(0.29);
        group.add(this.batteryLight);
      }
      if (building.id === 'habitat') {
        this.habitatLight = this.add
          .ellipse(-64, -71, 64, 32, 0x9ae4d4, 0.18)
          .setRotation(0.29);
        group.add(this.habitatLight);
        this.createFacilityReadout('habitat', building.x - 118, building.y + 15, 168);
      }
      if (building.id === 'greenhouse') {
        this.greenhouseImage = image;
        this.greenhouseLight = this.add
          .ellipse(-13, -55, 106, 34, 0xa7dab6, 0.16)
          .setRotation(0.3);
        group.add(this.greenhouseLight);
        const panel = this.createFacilityReadout('greenhouse', building.x - 12, building.y + 27, 172, 49);
        this.cropTrack = this.add.rectangle(-76, 16, 152, 3, 0x314950).setOrigin(0, 0.5);
        this.cropFill = this.add.rectangle(-76, 16, 152, 3, 0x87cebd).setOrigin(0, 0.5);
        panel.add([this.cropTrack, this.cropFill]);
      }
      if (building.id === 'iceProcessor') {
        this.iceFill = this.add.rectangle(24, -13, 11, 16, 0x7dd3fc, 0.85).setOrigin(0.5, 1);
        group.add(this.iceFill);
        this.createFacilityReadout('ice', building.x + 119, building.y - 72, 179);
      }
      if (building.id === 'lifeSupport') {
        this.isruGlow = this.add
          .ellipse(0, -48, 76, 30, 0x38bdf8, 0)
          .setStrokeStyle(1.5, 0x7dd3fc, 0);
        group.add(this.isruGlow);
      }
      if (building.id === 'shelter') {
        this.shelterImage = image;
        this.createFacilityReadout('shelter', building.x + 111, building.y - 30, 171);
      }

      if (building.stationStep !== undefined) {
        const statusDot = this.add
          .circle(art.width * 0.28, -42, 4, 0x729299)
          .setStrokeStyle(1.2, 0x1b3444);
        group.add(statusDot);
        const list = this.facilityLights.get(building.stationStep) ?? [];
        list.push(statusDot);
        this.facilityLights.set(building.stationStep, list);
      }

      addObstacle(footprintBounds(building, art));
    }

    for (const rock of ROCKS) {
      const art = GAME_ART.find((a) => a.key === 'rock')!;
      this.add
        .image(rock.x, rock.y, 'rock')
        .setOrigin(0.5, groundAnchor(art) / art.height)
        .setScale(rock.scale)
        .setDepth(groundDepth(rock.y));
      addObstacle(footprintBounds(rock, art, rock.scale));
    }
    this.walkingObstacles = this.navigationObstacles(CHARACTER.bodyWidth / 2 + 5, 10, 10);
    this.drivingObstacles = this.navigationObstacles(39, 13, 23);

    // Five marked regolith sampling points in the training basin.
    ICE_DEPOSITS.forEach((pt) => {
      const glow = this.add
        .ellipse(pt.x, pt.y, 56, 22, 0x72c5d8, 0.06)
        .setStrokeStyle(1, 0x9adce7, 0.52)
        .setDepth(groundDepth(pt.y) - 4);
      const crystal = this.add
        .image(pt.x, pt.y, 'ice-crystal')
        .setOrigin(0.5, 0.88)
        .setDepth(groundDepth(pt.y));
      this.iceGlows.push(glow);
      this.iceSprites.push(crystal);
    });

    // Six collectible training specimens across the outpost.
    FIELD_SAMPLES.forEach((s) => {
      const glow = this.add
        .ellipse(s.x, s.y - 4, 46, 18, 0xf59e0b, 0.22)
        .setDepth(groundDepth(s.y) - 4);
      const sprite = this.add
        .image(s.x, s.y, 'field-sample')
        .setOrigin(0.5, 0.88)
        .setDepth(groundDepth(s.y));
      const prompt = this.add
        .text(s.x, s.y - 62, `[E] ${s.name.en}`, {
          fontFamily: 'Inter, monospace',
          fontSize: '9.5px',
          color: '#fef08a',
          backgroundColor: '#171a07ee',
          padding: { x: 6, y: 2.5 },
        })
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(2080);

      this.sampleGlows.push(glow);
      this.sampleSprites.push(sprite);
      this.samplePrompts.push(prompt);
    });

    // Interactive Station Pads & Badges (D1..D6)
    for (const st of STATIONS) {
      this.add
        .ellipse(st.x, st.y, 56, 24, 0x87cebd, 0.09)
        .setStrokeStyle(1.4, 0xb8ded2, 0.42)
        .setDepth(-3);
      const badge = this.add
        .text(st.x, st.y + 18, `D${st.decisionId}`, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#cfe6dc',
          backgroundColor: '#11222de6',
          padding: { x: 5, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(-2);
      this.stationBadges.set(st.decisionId, badge);
    }

    // Active Objective Beacon & Label
    this.targetHighlight = this.add
      .ellipse(STATIONS[0].x, STATIONS[0].y, 92, 40, 0x8bddd0, 0.1)
      .setStrokeStyle(2, 0xc0e6aa, 0.8)
      .setDepth(-2);
    const ring = this.add
      .ellipse(0, 0, 50, 22, 0xc0e6aa, 0.16)
      .setStrokeStyle(1.8, 0xdff2ce, 0.95);
    const diamond = this.add
      .graphics()
      .fillStyle(0xc0e6aa, 1)
      .fillPoints(
        [
          [0, -34],
          [7, -25],
          [0, -16],
          [-7, -25],
        ].map(([x, y]) => new Phaser.Math.Vector2(x, y)),
        true,
      );
    this.beacon = this.add.container(STATIONS[0].x, STATIONS[0].y, [ring, diamond]).setDepth(-1);
    if (!this.bridge.reducedMotion) {
      this.tweens.add({
        targets: diamond,
        y: -6,
        duration: 1050,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    this.terminalLabel = this.add
      .text(STATIONS[0].x, STATIONS[0].y - 96, '', {
        fontFamily: 'monospace',
        fontSize: '10.5px',
        color: '#e7eedf',
        backgroundColor: '#10212cf2',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(2100);

    this.waypointRing = this.add
      .ellipse(0, 0, 36, 16, 0x38bdf8, 0.15)
      .setStrokeStyle(1.6, 0x7dd3fc, 0.85)
      .setVisible(false)
      .setDepth(-2);
    this.tractionLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#fde5ab',
        backgroundColor: '#241b11ed',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(2090)
      .setVisible(false);

    for (const direction of ['down', 'up', 'left', 'right'] as const) {
      this.anims.create({
        key: `commander-walk-${direction}`,
        frames: Array.from({ length: CHARACTER.walkFrames }, (_, i) => ({
          key: `astronaut-${direction}-${i}`,
        })),
        frameRate: 12,
        repeat: -1,
      });
      this.anims.create({
        key: `commander-idle-${direction}`,
        frames: [0, 1].map((i) => ({ key: `astronaut-${direction}-idle-${i}` })),
        frameRate: 1.2,
        repeat: -1,
      });
    }

    // Driveable 2.5D Lunar Car / Pressurized Rover
    const carArt = GAME_ART.find((a) => a.key === 'lunar-car')!;
    this.carRing = this.add
      .ellipse(WORLD.roverSpawn.x, WORLD.roverSpawn.y + 2, 118, 44, 0x38bdf8, 0.08)
      .setStrokeStyle(1.4, 0x7dd3fc, 0.45)
      .setDepth(-2);
    this.carSprite = this.physics.add
      .sprite(WORLD.roverSpawn.x, WORLD.roverSpawn.y, 'lunar-car')
      .setOrigin(0.5, groundAnchor(carArt) / carArt.height)
      .setCollideWorldBounds(true);
    (this.carSprite.body as Phaser.Physics.Arcade.Body)
      .setSize(68, 26)
      .setOffset(carArt.width / 2 - 34, groundAnchor(carArt) - 18)
      .setImmovable(true);
    this.carSprite.setDepth(groundDepth(this.carSprite.y));
    this.carPromptTag = this.add
      .text(WORLD.roverSpawn.x, WORLD.roverSpawn.y - 76, '[V] LUNAR CAR', {
        fontFamily: 'monospace',
        fontSize: '9.5px',
        color: '#bae6fd',
        backgroundColor: '#0f2434eb',
        padding: { x: 7, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(2050);

    // Autonomous AI Crewmates (Eng. Leyla & Dr. Rashad)
    for (const def of AI_CREWMATES) {
      const startPt = def.patrol[0];
      const prefix = `crew-${def.suit}`;
      const ringEl = this.add
        .ellipse(startPt.x, startPt.y + 1, 38, 17)
        .setStrokeStyle(1.2, Phaser.Display.Color.HexStringToColor(def.colorHex).color, 0.45)
        .setDepth(-1);
      const sp = this.add
        .image(startPt.x, startPt.y, `${prefix}-down-idle-0`)
        .setOrigin(0.5, CHARACTER.groundY / CHARACTER.height)
        .setDepth(groundDepth(startPt.y));
      const nameTag = this.add
        .text(startPt.x, startPt.y - 90, def.name.en, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontStyle: '600',
          color: def.colorHex,
          backgroundColor: '#0d1d27d9',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(2040);
      const speechTag = this.add
        .text(startPt.x, startPt.y - 112, '', {
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          color: '#eef6f0',
          backgroundColor: '#132836f2',
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(2120);
      this.aiCrew.push({
        def,
        sprite: sp,
        nameTag,
        speechTag,
        ring: ringEl,
        facing: 'down',
        waypointIdx: 1,
        pauseUntil: 0,
      });
    }

    // Autonomous Hovering AI Recon Drone ("SPARK-9")
    this.droneScanRing = this.add
      .ellipse(this.dronePos.x, this.dronePos.y + 4, 48, 20, 0x38bdf8, 0.1)
      .setStrokeStyle(1.2, 0x67e8f9, 0.5)
      .setDepth(-1);
    this.droneSprite = this.add
      .image(this.dronePos.x, this.dronePos.y, 'ai-drone-0')
      .setOrigin(0.5, 0.88)
      .setDepth(groundDepth(this.dronePos.y) + 30);
    this.droneTag = this.add
      .text(this.dronePos.x, this.dronePos.y - 56, 'SPARK-9 AI', {
        fontFamily: 'monospace',
        fontSize: '8.5px',
        color: '#67e8f9',
        backgroundColor: '#0c1e2acc',
        padding: { x: 5, y: 1.5 },
      })
      .setOrigin(0.5)
      .setDepth(2035);

    // Run A Temporal Ghost Crewmate (visible when Rewind Run B is active!)
    this.ghostSprite = this.add
      .image(STATIONS[2].x + 48, STATIONS[2].y, 'crew-ghost-down-idle-0')
      .setOrigin(0.5, CHARACTER.groundY / CHARACTER.height)
      .setVisible(false)
      .setDepth(groundDepth(STATIONS[2].y));
    this.ghostTag = this.add
      .text(STATIONS[2].x + 48, STATIONS[2].y - 92, 'RUN A GHOST', {
        fontFamily: 'monospace',
        fontSize: '9.5px',
        color: '#e9d5ff',
        backgroundColor: '#2e1065e6',
        padding: { x: 6, y: 2.5 },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(2060);

    // Commander Player Sprite
    this.player = this.physics.add
      .sprite(WORLD.spawn.x, WORLD.spawn.y, 'astronaut-down-0')
      .setOrigin(0.5, CHARACTER.groundY / CHARACTER.height)
      .setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body)
      .setSize(CHARACTER.bodyWidth, CHARACTER.bodyHeight)
      .setOffset(
        CHARACTER.groundX - CHARACTER.bodyWidth / 2,
        CHARACTER.groundY - CHARACTER.bodyHeight / 2,
      );
    this.physics.add.collider(this.player, obstacles);
    this.physics.add.collider(this.carSprite, obstacles);
    this.player.setDepth(groundDepth(this.player.y));

    this.playerMarker = this.add
      .ellipse(this.player.x, this.player.y + 1, 44, 20)
      .setStrokeStyle(1.4, 0xc0e6aa, 0.5)
      .setDepth(-1);
    this.playerNameTag = this.add
      .text(this.player.x, this.player.y - 92, 'YOU · CMDR', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: '#d9f99d',
        backgroundColor: '#11252be6',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(2080);

    this.fxGfx = this.add.graphics().setDepth(1950);
    this.shade = this.add.rectangle(0, 0, WORLD.width, WORLD.height, 0x101e30)
      .setOrigin(0).setDepth(1850).setVisible(false);
    this.roverLamps = [-1, 1].map(() => this.add.ellipse(0, 0, 90, 31, 0xf8e2b3)
      .setDepth(-8).setVisible(false));

    // Keyboard & Pointer Controls
    this.keys = this.input.keyboard!.addKeys(
      'W,A,S,D,UP,DOWN,LEFT,RIGHT,E,V,SPACE',
      false,
    ) as Record<string, Phaser.Input.Keyboard.Key>;

    this.keys.E.on('down', (_key: Phaser.Input.Keyboard.Key, event: KeyboardEvent) => {
      const b = this.bridge;
      if (!event.repeat && !b.paused && !document.hidden) {
        b.interactRequested = true;
      }
    });

    this.keys.V.on('down', (_key: Phaser.Input.Keyboard.Key, event: KeyboardEvent) => {
      const b = this.bridge;
      if (!event.repeat && !b.paused && !document.hidden) {
        soundFX.play('uiClick');
        b.onToggleRover();
      }
    });

    // Primary click and touch use the same route planner as Auto-pilot.
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.bridge.paused || pointer.button !== 0) return;
      const worldPt = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.setDestination(worldPt);
    });
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _objects: unknown[], _x: number, dy: number) => {
      if (this.bridge.paused || !dy) return;
      this.zoomAdjustment = Phaser.Math.Clamp(this.zoomAdjustment - Math.sign(dy) * 0.09, -0.26, 0.35);
      this.resizeCamera();
    });

    this.input.keyboard!.addCapture([37, 38, 39, 40, 32]);
    this.input.keyboard!.disableGlobalCapture();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD.width, WORLD.height);
    this.follow(this.player, false);
    this.resizeCamera();
    camera.setZoom(this.targetZoom);
    this.scale.on('resize', this.resizeCamera, this);

    this.events.once('shutdown', () => {
      this.input.keyboard?.removeAllKeys(true);
      this.scale.off('resize', this.resizeCamera, this);
    });

    this.bridge.onReady();
  }

  private resizeCamera() {
    const baseZoom = this.scale.width < 720 ? 0.92 : Math.min(1.04, Math.max(0.88, this.scale.height / 760));
    this.targetZoom = baseZoom + this.zoomAdjustment;
    if (this.bridge.reducedMotion) this.cameras.main.setZoom(this.targetZoom);
  }

  private follow(entity: Phaser.Physics.Arcade.Sprite, transition = true) {
    const camera = this.cameras.main;
    const { scrollX, scrollY } = camera;
    const lerp = this.bridge.reducedMotion ? 1 : 0.09;
    camera.startFollow(entity, true, lerp, lerp, 0, 35);
    if (transition && !this.bridge.reducedMotion) camera.setScroll(scrollX, scrollY);
  }

  private createFacilityReadout(key: FacilityReadout, x: number, y: number, width: number, height = 41) {
    const backing = this.add
      .rectangle(0, 0, width, height, 0x0c1c25, 0.97)
      .setStrokeStyle(1, 0x60818a, 0.9);
    const title = this.add.text(19 - width / 2, 5 - height / 2, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#b4c9c8',
    });
    const value = this.add.text(9 - width / 2, 19 - height / 2, '', {
      fontFamily: 'Inter, sans-serif', fontSize: '12.5px', fontStyle: 'bold',
    });
    const indicator = this.add.circle(10 - width / 2, 11 - height / 2, 2.6, 0x8bb8b4);
    const panel = this.add.container(x, y, [backing, indicator, title, value]).setDepth(2030);
    this.readouts.set(key, { panel, title, value, indicator });
    return panel;
  }

  private setReadout(key: FacilityReadout, title: string, value: string, color: string, visible = true) {
    const readout = this.readouts.get(key)!;
    readout.panel.setVisible(visible);
    if (visible) {
      readout.title.setText(title);
      readout.value.setText(value).setColor(color);
      readout.indicator.setFillStyle(Phaser.Display.Color.HexStringToColor(color).color);
    }
  }

  private acknowledgeFacility(key: FacilityReadout, color: number) {
    if (this.bridge.reducedMotion) return;
    const { panel } = this.readouts.get(key)!;
    const frame = this.add.rectangle(panel.x, panel.y, panel.width || 175, key === 'greenhouse' ? 49 : 41)
      .setFillStyle(0, 0).setStrokeStyle(2, color).setDepth(2029);
    this.tweens.add({ targets: frame, alpha: 0, scaleX: 1.12, scaleY: 1.3,
      duration: 700, ease: 'Sine.Out', onComplete: () => frame.destroy() });
  }

  private navigationObstacles(x: number, top: number, bottom: number): Rectangle[] {
    return this.obstacles.map((rect) => ({
      left: rect.left - x,
      right: rect.right + x,
      top: rect.top - top,
      bottom: rect.bottom + bottom,
    }));
  }

  private setDestination(target: Point) {
    const driving = this.bridge.snapshot.controllingRover;
    const entity = driving ? this.carSprite : this.player;
    this.route = planRoute(entity, target, NAV_BOUNDS, driving ? this.drivingObstacles : this.walkingObstacles);
    const destination = this.route[this.route.length - 1];
    if (destination) this.waypointRing.setPosition(destination.x, destination.y);
    this.waypointRing.setVisible(destination !== undefined);
  }

  private cancelRoute() {
    this.route = [];
    this.waypointRing.setVisible(false);
  }

  private drawInfrastructure() {
    const g = this.add.graphics().setDepth(-10);

    // Directional ground shadows reinforce the low-angle lighting and equipment silhouettes.
    for (const building of BUILDINGS) {
      const art = GAME_ART.find((a) => a.key === building.artKey)!;
      const f = footprintBounds(building, art);
      const dx = Math.min(84, art.height * 0.42);
      const dy = dx * 0.48;
      const pts = [
        [f.x - f.width / 2, f.y],
        [f.x + f.width / 2, f.y - f.height / 2],
        [f.x + f.width / 2 + dx, f.y + dy],
        [f.x + dx - f.width / 4, f.y + f.height / 2 + dy],
        [f.x - f.width / 2, f.y + f.height / 2],
      ].map(([x, y]) => new Phaser.Math.Vector2(x, y));
      g.fillStyle(0x0a2034, 0.36).fillPoints(pts, true);
      g.fillStyle(0x0a2034, 0.24).fillEllipse(
        f.x + 5,
        f.y + f.height * 0.4,
        f.width * 1.12,
        f.height * 0.9,
      );
    }

    // 2. Isometric architectural service foundation pads under buildings
    for (const building of BUILDINGS) {
      const art = GAME_ART.find((a) => a.key === building.artKey)!;
      const f = footprintBounds(building, art);
      const w = f.width + 36;
      const h = f.height + 22;
      const points = [
        [f.x - w / 2, f.y],
        [f.x - w * 0.13, f.y - h / 2],
        [f.x + w / 2, f.y],
        [f.x + w * 0.13, f.y + h / 2],
      ].map(([x, y]) => new Phaser.Math.Vector2(x, y));
      g.fillStyle(0x193349, 0.36).fillPoints(points, true);
      g.lineStyle(1.2, 0xc2c6b6, 0.32).strokePoints(points, true);
      g.lineStyle(2, 0xd4b275, 0.42).lineBetween(
        f.x - w * 0.25,
        f.y + h * 0.2,
        f.x - w * 0.05,
        f.y + h * 0.3,
      );
    }

    // Graded routes connect facilities and link the ridge and basin ramps.
    const routes: number[][][] = [
      // Central East-West Spine Plaza
      [
        [425, 555],
        [1530, 555],
      ],
      // Spur to Sector 01 (NW Sunlit Solar Rim Ramp)
      [
        [475, 555],
        [475, 430],
      ],
      // Spur to Sector 02 (Habitat & ECLSS)
      [
        [895, 555],
        [895, 435],
      ],
      // Spur to Sector 03 (West Cryo-Fuel Reactor)
      [
        [425, 555],
        [425, 800],
      ],
      // Spur to Sector 05 (South Armored Storm Bunker)
      [
        [795, 555],
        [795, 915],
      ],
      // Wide Rover Ramp into Sector 04 (SE 90 K Cold-Trap Ice Basin)
      [
        [1055, 555],
        [1055, 645],
        [1165, 815],
      ],
      // Spurs to Sector 06 (Greenhouse & Ascent Launchpad)
      [
        [1290, 555],
        [1290, 475],
      ],
      [
        [1530, 555],
        [1530, 490],
      ],
    ];

    for (const points of routes) {
      g.lineStyle(32, 0x203342, 0.22).beginPath().moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) g.lineTo(x, y);
      g.strokePath();

      g.lineStyle(24, 0xcbbfa6, 0.19).beginPath().moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) g.lineTo(x, y);
      g.strokePath();

      for (let i = 1; i < points.length; i++) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        const edge = movementVector(y0 - y1, x1 - x0, 14);
        g.lineStyle(1.2, 0xe2d5b9, 0.49)
          .lineBetween(x0 + edge.x, y0 + edge.y, x1 + edge.x, y1 + edge.y)
          .lineBetween(x0 - edge.x, y0 - edge.y, x1 - edge.x, y1 - edge.y);
      }
    }

    // Ramp caution chevrons on NW Ridge Ramp & SE Cold-Trap Rover Ramp
    for (const y of [475, 495, 515, 535]) {
      g.lineStyle(2, 0xe8c47c, 0.45)
        .lineBetween(465, y + 4, 475, y)
        .lineBetween(475, y, 485, y + 4);
    }
    for (let i = 0; i < 5; i++) {
      const rx = 1075 + i * 18;
      const ry = 675 + i * 28;
      g.lineStyle(2.2, 0x38bdf8, 0.45)
        .lineBetween(rx - 9, ry - 2, rx, ry + 5)
        .lineBetween(rx, ry + 5, rx + 9, ry - 2);
    }

    // Mark the rim of traversable but low-traction terrain.
    for (const crater of IMPACT_CRATERS) {
      g.lineStyle(2, 0xffce8b, 0.48);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        const b = a + 0.11;
        g.lineBetween(
          crater.x + Math.cos(a) * crater.radius,
          crater.y + Math.sin(a) * crater.radius * 0.53,
          crater.x + Math.cos(b) * crater.radius,
          crater.y + Math.sin(b) * crater.radius * 0.53,
        );
      }
    }

    // Rover Staging Pad Outline
    g.fillStyle(0x243744, 0.48).fillRoundedRect(995, 598, 120, 74, 8);
    g.lineStyle(1.8, 0x9dc1c5, 0.65).strokeRoundedRect(995, 598, 120, 74, 8);
    for (const x of [1005, 1094]) {
      g.lineStyle(2, 0xe1bb7d, 0.8).lineBetween(x, 605, x + 11, 605)
        .lineBetween(x, 665, x + 11, 665);
    }

    // HVDC Power & Cryo Fluid Conduits connecting sectors
    const conduits: number[][][] = [
      [
        [340, 355],
        [585, 355],
        [585, 415],
        [895, 415],
      ],
      [
        [425, 745],
        [425, 595],
        [795, 595],
        [795, 865],
      ],
      [
        [1085, 415],
        [1290, 415],
        [1545, 445],
      ],
    ];
    for (const route of conduits) {
      g.lineStyle(5, 0x172e3e, 0.46).beginPath().moveTo(route[0][0], route[0][1]);
      for (const [x, y] of route.slice(1)) g.lineTo(x, y);
      g.strokePath();
      g.lineStyle(1.5, 0x99b5bb, 0.35).beginPath().moveTo(route[0][0], route[0][1]);
      for (const [x, y] of route.slice(1)) g.lineTo(x, y);
      g.strokePath();
    }

    // Illuminated Path Guide Bollards
    const bollards = [
      [555, 555],
      [690, 555],
      [810, 555],
      [985, 555],
      [1155, 555],
      [1395, 555],
      [425, 665],
      [795, 685],
      [795, 790],
    ];
    for (const [x, y] of bollards) {
      g.fillStyle(0x142434, 0.4).fillEllipse(x + 5, y + 4, 16, 5);
      g.fillStyle(0x7c9096, 1).fillRect(x - 2, y - 8, 4, 11);
      g.fillStyle(0xd3d6bb).fillRect(x - 2, y - 9, 4, 2.5);
    }

    // Bake static infrastructure into one GPU/Canvas texture
    g.generateTexture('infrastructure', WORLD.width, WORLD.height);
    g.destroy();
    this.add.image(0, 0, 'infrastructure').setOrigin(0).setDepth(-10);

    // Sector Stencil Labels on Lunar Regolith
    const stencils: Array<[number, number, string]> = [
      [335, 462, '#eee4c9'],
      [895, 584, '#e0dfc8'],
      [425, 852, '#c0e0da'],
      [1365, 995, '#b7e1e6'],
      [795, 968, '#f4d3a6'],
      [1530, 535, '#c6e2c8'],
      [1055, 684, '#badde5'],
    ];
    this.sectorLabels = stencils.map(([x, y, color]) =>
      this.add.text(x, y, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color,
        letterSpacing: 1,
        stroke: '#263743',
        strokeThickness: 2,
      })
        .setOrigin(0.5)
        .setAlpha(0.83)
        .setDepth(-4),
    );
  }

  private updateAiCrewmates(time: number, dtSec: number, snap: WorldBridge['snapshot'], activePos: Point) {
    let closestSpeech: { speaker: string; role: string; text: string; color: string } | null = null;
    let closestDist = 142;
    const isStormEmergency = snap.stormPending;

    for (const crew of this.aiCrew) {
      const targetPt = isStormEmergency
        ? crew.def.shelterPos
        : crew.def.patrol[crew.waypointIdx % crew.def.patrol.length];
      const dx = targetPt.x - crew.sprite.x;
      const dy = targetPt.y - crew.sprite.y;
      const dist = Math.hypot(dx, dy);
      const speed = isStormEmergency ? 235 : 98;

      const distToPlayer = Math.hypot(activePos.x - crew.sprite.x, activePos.y - crew.sprite.y);
      const stepKey = Math.min(6, Math.max(1, snap.activeStep));
      const line = crew.def.stepLines[stepKey]?.[snap.lang] ?? crew.def.stepLines[1][snap.lang];

      if (distToPlayer < closestDist) {
        closestDist = distToPlayer;
        closestSpeech = {
          speaker: crew.def.name[snap.lang],
          role: crew.def.role[snap.lang],
          text: line,
          color: crew.def.colorHex,
        };
      }

      // Pause briefly at waypoints (or face player if talking) unless fleeing a solar storm!
      if (!isStormEmergency && (time < crew.pauseUntil || distToPlayer < 95)) {
        if (distToPlayer < 95) {
          crew.facing = facingDirection(
            { x: activePos.x - crew.sprite.x, y: activePos.y - crew.sprite.y },
            crew.facing,
          );
        }
        const idleFrame = this.bridge.reducedMotion ? 0 : Math.floor(time / 650) % 2;
        crew.sprite.setTexture(`crew-${crew.def.suit}-${crew.facing}-idle-${idleFrame}`);
      } else if (dist <= 8) {
        if (!isStormEmergency) {
          crew.waypointIdx = (crew.waypointIdx + 1) % crew.def.patrol.length;
          crew.pauseUntil = time + 2200;
        }
        const idleFrame = this.bridge.reducedMotion ? 0 : Math.floor(time / 650) % 2;
        crew.sprite.setTexture(`crew-${crew.def.suit}-${crew.facing}-idle-${idleFrame}`);
      } else {
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        crew.sprite.x += vx * dtSec;
        crew.sprite.y += vy * dtSec;
        crew.facing = facingDirection({ x: vx, y: vy }, crew.facing);
        const walkFrame = Math.floor(time / (isStormEmergency ? 65 : 95)) % CHARACTER.walkFrames;
        crew.sprite.setTexture(`crew-${crew.def.suit}-${crew.facing}-${walkFrame}`);
      }

      crew.sprite.setDepth(groundDepth(crew.sprite.y));
      crew.ring.setPosition(crew.sprite.x, crew.sprite.y + 1);
      crew.nameTag
        .setPosition(crew.sprite.x, crew.sprite.y - 90)
        .setText(crew.def.name[snap.lang]);

      const showBubble = isStormEmergency || distToPlayer < 135;
      crew.speechTag.setVisible(showBubble);
      if (showBubble) {
        crew.speechTag.setPosition(crew.sprite.x, crew.sprite.y - 112).setText(line);
      }
    }

    return closestSpeech;
  }

  private updateAiDrone(time: number, dtSec: number, snap: WorldBridge['snapshot'], activePos: Point) {
    const st = STATIONS[Math.min(5, Math.max(0, snap.activeStep - 1))];
    // Hover smoothly halfway between player and active station (guiding scout!)
    const orbitAngle = time * 0.0018;
    const goalX = activePos.x * 0.45 + st.x * 0.55 + Math.cos(orbitAngle) * 42;
    const goalY = activePos.y * 0.45 + st.y * 0.55 + Math.sin(orbitAngle) * 24 - 18;
    const lerp = 1 - Math.exp(-dtSec * 2.4);
    this.dronePos.x = Phaser.Math.Linear(this.dronePos.x, goalX, lerp);
    this.dronePos.y = Phaser.Math.Linear(this.dronePos.y, goalY, lerp);

    const bob = this.bridge.reducedMotion ? 0 : Math.sin(time * 0.005) * 4.5;
    const rotorIdx = this.bridge.reducedMotion ? 0 : Math.floor(time / 90) % 2;
    this.droneSprite
      .setPosition(this.dronePos.x, this.dronePos.y + bob)
      .setTexture(`ai-drone-${rotorIdx}`)
      .setDepth(groundDepth(this.dronePos.y) + 35);
    this.droneScanRing.setPosition(this.dronePos.x, this.dronePos.y + 6);
    this.droneTag.setPosition(this.dronePos.x, this.dronePos.y - 54 + bob);
  }

  private renderFieldFeedback(
    time: number,
    snap: WorldBridge['snapshot'],
    activePos: Point,
    nearIceIdx: number,
    drilling: boolean,
  ) {
    this.fxGfx.clear();

    // Lamps illuminate a patch of ground ahead of the rover.
    const { x: dx, y: dy } = this.heading;
    this.roverLamps.forEach((lamp, index) => {
      const side = index === 0 ? -1 : 1;
      lamp.setVisible(snap.controllingRover);
      if (snap.controllingRover) {
        lamp.setPosition(activePos.x + dx * 80 - dy * side * 12, activePos.y + dy * 61 + dx * side * 12)
          .setRotation(Math.atan2(dy, dx))
          .setAlpha(0.06 + 0.23 * (1 - snap.sunlightFraction));
      }
    });

    // Show glowing cryo-laser beam and sparkling ice shards while the training drill is in use.
    if (drilling && nearIceIdx >= 0) {
      const point = ICE_DEPOSITS[nearIceIdx];
      const beamOriginY = snap.controllingRover ? activePos.y - 18 : activePos.y - 36;
      const radius = this.bridge.reducedMotion ? 6 : 6 + Math.sin(time * 0.02) * 2.5;
      this.fxGfx.lineStyle(5, 0x0ea5e9, 0.32).lineBetween(activePos.x, beamOriginY, point.x, point.y - 14);
      this.fxGfx.lineStyle(2.2, 0xe0f2fe, 0.95).lineBetween(activePos.x, beamOriginY, point.x, point.y - 14);
      this.fxGfx.lineStyle(1.8, 0x67e8f9, 0.95).strokeCircle(point.x, point.y - 14, radius + 3);
      this.fxGfx.fillStyle(0xffffff, 0.95).fillCircle(point.x, point.y - 14, 3);
      if (!this.bridge.reducedMotion) {
        for (let k = 0; k < 4; k++) {
          const ang = time * 0.012 + (k * Math.PI) / 2;
          const dist = 6 + ((time * 0.05 + k * 7) % 16);
          this.fxGfx.fillStyle(0x7dd3fc, 0.85).fillCircle(
            point.x + Math.cos(ang) * dist,
            point.y - 14 + Math.sin(ang) * dist * 0.6,
            1.8,
          );
        }
      }
    }

    // Commander helmet headlamp beam when outside in polar horizon shadow
    if (!snap.controllingRover && snap.sunlightFraction < 0.85) {
      const lampAlpha = 0.22 * (1 - snap.sunlightFraction);
      this.fxGfx.fillStyle(0xfef08a, lampAlpha).fillEllipse(
        activePos.x + dx * 48,
        activePos.y + dy * 34 - 8,
        68,
        28,
      );
    }

    // Low-gravity regolith dust puffs kicked up by boots and rover wheels
    this.dustPuffs = this.dustPuffs.filter((p) => time - p.bornAt < 680);
    for (const puff of this.dustPuffs) {
      const age = (time - puff.bornAt) / 680;
      const px = puff.x + puff.vx * age * 18;
      const py = puff.y + puff.vy * age * 14 - Math.sin(age * Math.PI) * 7;
      this.fxGfx
        .fillStyle(0xd6cbb5, (1 - age) * 0.34)
        .fillCircle(px, py, puff.size * (0.7 + age * 0.9));
    }

    // Energetic solar proton streaks & emergency bunker strobe during D5 Solar Storm
    if (snap.stormPending && !this.bridge.reducedMotion) {
      const cam = this.cameras.main;
      const viewLeft = cam.worldView.x;
      const viewTop = cam.worldView.y;
      const viewW = cam.worldView.width || 960;
      const viewH = cam.worldView.height || 600;
      for (let s = 0; s < 14; s++) {
        const seedX = ((s * 197 + time * 0.42) % (viewW + 160)) - 80;
        const seedY = ((s * 131 + time * 0.65) % (viewH + 120)) - 60;
        const sx = viewLeft + seedX;
        const sy = viewTop + seedY;
        this.fxGfx
          .lineStyle(1.4, s % 3 === 0 ? 0xfda4af : 0xfde047, 0.38)
          .lineBetween(sx, sy, sx - 18, sy - 26);
      }
      const bunkerPulse = 0.5 + 0.5 * Math.sin(time * 0.01);
      this.fxGfx
        .lineStyle(2.4, 0xfb7185, 0.35 + bunkerPulse * 0.5)
        .strokeEllipse(STATIONS[4].x, STATIONS[4].y, 118 + bunkerPulse * 26, 52 + bunkerPulse * 12);
    }

    // Fade the tracks left by actual rover movement.
    this.trackGfx.clear();
    this.tireTracks = this.tireTracks.filter((tr) => time - tr.bornAt < 9000);
    for (const tr of this.tireTracks) {
      const age = (time - tr.bornAt) / 9000;
      const alpha = (1 - age) * 0.28;
      const across = movementVector(tr.y1 - tr.y2, tr.x2 - tr.x1, 13);
      this.trackGfx.lineStyle(3, 0x172533, alpha);
      for (const side of [-1, 1]) {
        const offsetX = across.x * side;
        const offsetY = across.y * side;
        this.trackGfx.lineBetween(tr.x1 + offsetX, tr.y1 + offsetY, tr.x2 + offsetX, tr.y2 + offsetY);
      }
    }

    // Wayfinding uses the same traversable segments as movement.
    const route = this.route.length ? this.route : this.previewRoute;
    const color = this.route.length ? 0x8ae4f5 : snap.activeStep === 5 ? 0xfcc081 : 0xdaf5bb;
    const step = 35;
    let nextMarker = this.bridge.reducedMotion ? step : step + ((time * 0.042) % step);
    let from = activePos;
    for (const point of route) {
      const dx = point.x - from.x;
      const dy = point.y - from.y;
      const length = Math.hypot(dx, dy);
      for (; nextMarker < length; nextMarker += step) {
        const x = from.x + (dx * nextMarker) / length;
        const y = from.y + (dy * nextMarker) / length;
        const hx = dx / length;
        const hy = dy / length;
        this.fxGfx.lineStyle(2, color, 0.76)
          .lineBetween(x - hx * 5 - hy * 4, y - hy * 5 + hx * 4, x, y)
          .lineBetween(x - hx * 5 + hy * 4, y - hy * 5 - hx * 4, x, y);
      }
      nextMarker -= length;
      from = point;
    }

    if (!this.bridge.reducedMotion) {
      for (const [stepId, start] of this.facilityPulseAt) {
        const phase = (time - start) / 1200;
        if (phase >= 1) {
          this.facilityPulseAt.delete(stepId);
          continue;
        }
        const pulse = phase % 0.5;
        for (const light of this.facilityLights.get(stepId) ?? []) {
          const parent = light.parentContainer;
          this.fxGfx.lineStyle(1.6, light.fillColor, 0.72 * (1 - pulse * 2))
            .strokeCircle(parent.x + light.x, parent.y + light.y, 4 + pulse * 25);
        }
      }
    }
  }

  update(time: number, delta: number) {
    if (!this.player) return;
    const b = this.bridge;
    const dtSec = Math.min(delta, 50) / 1000;
    const snap = b.snapshot;
    const camera = this.cameras.main;
    if (Math.abs(camera.zoom - this.targetZoom) > 0.002) {
      camera.setZoom(Phaser.Math.Linear(camera.zoom, this.targetZoom, 1 - Math.exp(-dtSec * 12)));
    }

    const resetting = b.resetRequested;
    if (resetting) {
      this.player.setPosition(WORLD.spawn.x, WORLD.spawn.y);
      (this.player.body as Phaser.Physics.Arcade.Body).reset(WORLD.spawn.x, WORLD.spawn.y);
      this.carSprite.setPosition(WORLD.roverSpawn.x, WORLD.roverSpawn.y);
      (this.carSprite.body as Phaser.Physics.Arcade.Body).reset(
        WORLD.roverSpawn.x,
        WORLD.roverSpawn.y,
      );
      this.tireTracks = [];
      this.lastTrackPos = { ...WORLD.roverSpawn };
      this.cancelRoute();
      this.zoomAdjustment = 0;
      this.resizeCamera();
      this.facing = 'down';
      this.heading = { x: 0, y: 1 };
      this.walkPace = 0;
      this.wheelTravel = 0;
      b.drillHeld = false;
      b.resetRequested = false;
    }

    // Handle Entering / Exiting the 2.5D Lunar Car [V]
    if (snap.controllingRover !== this.wasControllingRover) {
      this.wasControllingRover = snap.controllingRover;
      const destination = this.route[this.route.length - 1];
      if (snap.controllingRover) {
        // Preserve remote rover recall, placing it on clear ground for its larger footprint.
        const distToCar = Math.hypot(
          this.player.x - this.carSprite.x,
          this.player.y - this.carSprite.y,
        );
        if (distToCar > 165) {
          const rendezvous = nearestNavigablePoint(this.player, NAV_BOUNDS, this.drivingObstacles);
          if (rendezvous) {
            (this.carSprite.body as Phaser.Physics.Arcade.Body).reset(rendezvous.x, rendezvous.y);
          }
        }
        this.carSprite.setTexture('lunar-car-occupied');
        (this.carSprite.body as Phaser.Physics.Arcade.Body).setImmovable(false);
        this.player.setVisible(false);
        (this.player.body as Phaser.Physics.Arcade.Body).enable = false;
        this.follow(this.carSprite);
        this.lastTrackPos = { x: this.carSprite.x, y: this.carSprite.y };
        this.wheelTravel = 0;
      } else {
        this.carSprite.setTexture('lunar-car');
        this.carSprite.setVelocity(0, 0);
        (this.carSprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        const exit = resetting
          ? WORLD.spawn
          : nearestNavigablePoint(
              { x: this.carSprite.x - 54, y: this.carSprite.y + 18 },
              NAV_BOUNDS,
              this.walkingObstacles,
            ) ?? this.carSprite;
        this.player.setVisible(true);
        (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
        (this.player.body as Phaser.Physics.Arcade.Body).reset(exit.x, exit.y);
        this.follow(this.player);
        this.walkPace = 0;
      }
      if (!b.reducedMotion && !resetting) {
        this.tweens.killTweensOf(this.playerMarker);
        this.playerMarker.setScale(1.28).setAlpha(0.6);
        this.tweens.add({ targets: this.playerMarker, scale: 1, alpha: 1, duration: 260, ease: 'Sine.Out' });
      }
      this.previewAt = 0;
      if (destination) this.setDestination(destination);
    }

    // Apply fast deployment after rover transitions so a dismount can't replace the landing.
    if (b.teleportTarget) {
      const landing = nearestNavigablePoint(
        b.teleportTarget,
        NAV_BOUNDS,
        snap.controllingRover ? this.drivingObstacles : this.walkingObstacles,
      );
      if (landing) {
        if (snap.controllingRover) {
          (this.carSprite.body as Phaser.Physics.Arcade.Body).reset(landing.x, landing.y);
          this.lastTrackPos = landing;
        }
        (this.player.body as Phaser.Physics.Arcade.Body).reset(landing.x, landing.y);
      }
      this.cancelRoute();
      b.teleportTarget = null;
    }

    if (b.walkToTarget) {
      this.setDestination(b.walkToTarget);
      b.walkToTarget = null;
    }

    const paused = b.paused || document.hidden;
    if (paused !== this.lastPaused) {
      if (paused) {
        this.input.keyboard?.resetKeys();
        b.direction = { x: 0, y: 0 };
        b.nudgeUntil = 0;
        b.drillHeld = false;
      }
      this.lastPaused = paused;
    }

    const focused = b.host.contains(document.activeElement);
    if (!paused && focused) this.input.keyboard?.enableGlobalCapture();
    else this.input.keyboard?.disableGlobalCapture();

    const activeEntity = snap.controllingRover ? this.carSprite : this.player;
    const traction = terrainTraction(activeEntity);
    const topSpeed = snap.controllingRover
      ? WORLD.roverSpeed * traction
      : WORLD.speed * (0.5 + 0.5 * traction);
    let horizontal = 0;
    let vertical = 0;
    let routeSpeed: number | null = null;
    if (!paused) {
      if (b.nudgeUntil && performance.now() > b.nudgeUntil) {
        b.direction = { x: 0, y: 0 };
        b.nudgeUntil = 0;
      }
      horizontal =
        Number(this.keys.D.isDown || this.keys.RIGHT.isDown) -
        Number(this.keys.A.isDown || this.keys.LEFT.isDown);
      vertical =
        Number(this.keys.S.isDown || this.keys.DOWN.isDown) -
        Number(this.keys.W.isDown || this.keys.UP.isDown);
      horizontal += b.direction.x;
      vertical += b.direction.y;

      // Manual input overrides click-to-move waypoint
      if (horizontal !== 0 || vertical !== 0) {
        if (this.route.length) this.cancelRoute();
      } else {
        while (this.route.length) {
          const next = this.route[0];
          const dx = next.x - activeEntity.x;
          const dy = next.y - activeEntity.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= (this.route.length === 1 ? 6 : 3)) {
            this.route.shift();
            if (!this.route.length) this.cancelRoute();
          } else {
            horizontal = dx;
            vertical = dy;
            routeSpeed = Math.min(topSpeed, dist * 22);
            break;
          }
        }
      }
    }

    const movement = movementVector(horizontal, vertical, routeSpeed ?? topSpeed);
    const easing = routeSpeed !== null
      ? 1
      : 1 - Math.exp(-Math.min(delta, 50) / (snap.controllingRover ? 75 : 42));
    if (horizontal || vertical) this.heading = movementVector(horizontal, vertical, 1);

    if (snap.controllingRover) {
      const carBody = this.carSprite.body as Phaser.Physics.Arcade.Body;
      this.carSprite.setVelocity(
        paused ? 0 : Phaser.Math.Linear(carBody.velocity.x, movement.x, easing),
        paused ? 0 : Phaser.Math.Linear(carBody.velocity.y, movement.y, easing),
      );
      if (!horizontal && !vertical && Math.hypot(carBody.velocity.x, carBody.velocity.y) < 8) {
        this.carSprite.setVelocity(0, 0);
      }
      if (Math.abs(movement.x) > 5) {
        this.carFacingLeft = movement.x < 0;
        this.carSprite.setFlipX(this.carFacingLeft);
      }
      this.facing = facingDirection(movement, this.facing);
      this.player.setPosition(this.carSprite.x, this.carSprite.y);
      const travel = Math.hypot(carBody.deltaXFinal(), carBody.deltaYFinal());
      const rolling = !b.reducedMotion && !paused && travel > 0.08;
      if (rolling) this.wheelTravel = (this.wheelTravel + travel) % 24;
      this.carSprite.setTexture(rolling && this.wheelTravel >= 12 ? 'lunar-car-rolling' : 'lunar-car-occupied');

      const movedDist = Math.hypot(
        this.carSprite.x - this.lastTrackPos.x,
        this.carSprite.y - this.lastTrackPos.y,
      );
      if (movedDist >= 18) {
        this.tireTracks.push({
          x1: this.lastTrackPos.x,
          y1: this.lastTrackPos.y,
          x2: this.carSprite.x,
          y2: this.carSprite.y,
          bornAt: time,
        });
        this.lastTrackPos = { x: this.carSprite.x, y: this.carSprite.y };
        if (!b.reducedMotion) {
          this.dustPuffs.push({
            x: this.carSprite.x - this.heading.x * 26,
            y: this.carSprite.y - this.heading.y * 12 + 4,
            vx: -this.heading.x + (Math.random() - 0.5) * 0.6,
            vy: -this.heading.y + (Math.random() - 0.5) * 0.4,
            bornAt: time,
            size: 6.5,
          });
        }
        if (time > this.stepSoundAt) {
          soundFX.play('roverMotor');
          this.stepSoundAt = time + 240;
        }
      }
    } else {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      this.player.setVelocity(
        paused ? 0 : Phaser.Math.Linear(body.velocity.x, movement.x, easing),
        paused ? 0 : Phaser.Math.Linear(body.velocity.y, movement.y, easing),
      );
      if (!horizontal && !vertical) this.player.setVelocity(0, 0);

      const travel = Math.hypot(body.deltaXFinal(), body.deltaYFinal());
      const actualPace = (movement.x || movement.y) && dtSec > 0 ? travel / dtSec : 0;
      this.walkPace = Phaser.Math.Linear(this.walkPace, actualPace, 1 - Math.exp(-dtSec * 15));
      this.facing = facingDirection(movement, this.facing);
      if ((movement.x || movement.y) && this.walkPace > 14) {
        const { currentAnim, currentFrame } = this.player.anims;
        const startFrame = currentAnim?.key.startsWith('commander-walk-') ? (currentFrame?.index ?? 1) - 1 : 0;
        this.player.play({ key: `commander-walk-${this.facing}`, startFrame }, true);
        this.player.anims.timeScale = Phaser.Math.Clamp(this.walkPace / WORLD.speed, 0.55, 1.12);
        if (time > this.stepSoundAt) {
          soundFX.play('footstep');
          if (!b.reducedMotion) {
            this.dustPuffs.push({
              x: this.player.x - this.heading.x * 8,
              y: this.player.y + 2,
              vx: -this.heading.x * 0.7,
              vy: -this.heading.y * 0.5,
              bornAt: time,
              size: 4.2,
            });
          }
          this.stepSoundAt = time + 310;
        }
      } else if (!b.reducedMotion && !paused) {
        this.player.play(`commander-idle-${this.facing}`, true);
        this.player.anims.timeScale = 1;
      } else {
        this.player.anims.stop();
        this.player.setTexture(`astronaut-${this.facing}-idle-0`);
      }
    }

    const activePos: Point = snap.controllingRover
      ? { x: this.carSprite.x, y: this.carSprite.y }
      : { x: this.player.x, y: this.player.y };

    this.player.setDepth(groundDepth(this.player.y));
    this.carSprite.setDepth(groundDepth(this.carSprite.y));
    this.carRing.setPosition(this.carSprite.x, this.carSprite.y + 2);

    const distToParkedCar = Math.hypot(
      this.player.x - this.carSprite.x,
      this.player.y - this.carSprite.y,
    );
    const nearParkedCar = !snap.controllingRover && distToParkedCar <= 135;
    this.carPromptTag
      .setPosition(this.carSprite.x, this.carSprite.y - 78)
      .setVisible(!snap.controllingRover)
      .setText(
        snap.lang === 'az'
          ? nearParkedCar
            ? '[V] MAŞINA MİN'
            : 'AY MAŞINI [V]'
          : nearParkedCar
            ? '[V] DRIVE CAR'
            : 'LUNAR CAR [V]',
      )
      .setAlpha(nearParkedCar ? 1 : 0.68);

    this.playerMarker.setPosition(activePos.x, activePos.y + 1);
    this.tractionLabel
      .setPosition(activePos.x, activePos.y - 104)
      .setText(snap.lang === 'az' ? 'ZƏİF TUTUŞ · KRATER' : 'LOW TRACTION · CRATER')
      .setVisible(snap.controllingRover && traction < 1);
    this.playerNameTag
      .setPosition(activePos.x, activePos.y - (snap.controllingRover ? 82 : 94))
      .setText(
        snap.controllingRover
          ? snap.lang === 'az'
            ? 'SİZ · AY MAŞINI'
            : 'YOU · LUNAR CAR'
          : snap.lang === 'az'
            ? 'SİZ · KOMANDİR'
            : 'YOU · CMDR',
      );

    // Check Station Proximity & USE [E] Interaction
    const near = findNearbyStation(activePos, snap.activeStep, snap.lastAvailableStep);
    if (near?.decisionId !== this.nearStation?.decisionId) {
      this.nearStation = near;
      b.onNearby(near);
    }

    // Give the closest specimen priority over a distant station prompt.
    const nearSampleIdx = findNearestSampleIndex(activePos, snap.collectedSamples);
    const sample = FIELD_SAMPLES[nearSampleIdx];
    const sampleInteraction = sample && (!near || Math.hypot(sample.x - activePos.x, sample.y - activePos.y) <= 54);
    this.samplePrompts.forEach((p, idx) => {
      const isNear = sampleInteraction && idx === nearSampleIdx && !snap.collectedSamples[idx];
      p.setVisible(isNear);
      if (isNear) {
        p.setText(`[E] ${snap.lang === 'az' ? 'KƏŞF ET' : 'DISCOVER'} · ${FIELD_SAMPLES[idx].name[snap.lang]}`);
      }
    });

    if (!paused && b.interactRequested) {
      if (sampleInteraction && b.onCollectSample) {
        this.cancelRoute();
        b.onCollectSample(nearSampleIdx);
      } else if (near) {
        b.paused = true;
        this.player.setVelocity(0, 0);
        this.carSprite.setVelocity(0, 0);
        this.cancelRoute();
        this.input.keyboard?.resetKeys();
        b.onInteract(near);
      }
    }
    b.interactRequested = false;

    // Cryo-Laser Ice Mining ([Space] or UI Hold near Sector 04 Ice Crystals)
    const nearIceIdx = findNearestIceIndex(activePos, snap.minedCrystals);
    const drilling = !paused && nearIceIdx >= 0 && (this.keys.SPACE.isDown || b.drillHeld);
    if (drilling) {
      b.onDrillTick(nearIceIdx, dtSec);
    }

    // Update Autonomous AI Crewmates & Recon Drone
    const nearbyCrewSpeech = this.updateAiCrewmates(time, dtSec, snap, activePos);
    this.updateAiDrone(time, dtSec, snap, activePos);

    const targetSt = STATIONS[Math.min(5, Math.max(0, snap.activeStep - 1))];
    if (!this.route.length && (time >= this.previewAt || this.previewStep !== snap.activeStep)) {
      this.previewStep = snap.activeStep;
      this.previewAt = time + 280;
      this.previewRoute = near?.decisionId === targetSt.decisionId
        ? []
        : planRoute(activePos, targetSt, NAV_BOUNDS, snap.controllingRover ? this.drivingObstacles : this.walkingObstacles);
    }

    this.renderFieldFeedback(time, snap, activePos, nearIceIdx, drilling);

    // Subtle Geiger counter ticks while exposed outdoors during D5 Solar Storm alert
    if (!paused && snap.stormPending && time > this.geigerAt) {
      soundFX.play('geiger');
      this.geigerAt = time + 1150 + Math.random() * 900;
    }

    // Sync Deterministic World Snapshot Visuals
    if (snap !== this.lastSnapshot) {
      const previous = this.lastSnapshot;
      this.lastSnapshot = snap;

      const az = snap.lang === 'az';
      const powerFrac = Phaser.Math.Clamp(snap.batteryKwh / BATTERY_CAPACITY_KWH, 0, 1);
      const lowLight = snap.sunlightFraction < 1;
      const hasTallMast = snap.choices[0] === 0;
      const hasRegolithBerm = snap.choices[1] === 0;
      const hasIsruOxygen = snap.choices[1] === 1;
      this.shade.setAlpha(0.44 * (1 - snap.sunlightFraction)).setVisible(lowLight);
      this.solarImage.setTexture(
        hasTallMast
          ? lowLight ? 'solar-mast-off' : 'solar-mast'
          : lowLight ? 'solar-off' : 'solar',
      );
      this.shelterImage.setTexture(hasRegolithBerm ? 'shelter-berm' : 'shelter');
      this.isruGlow
        .setFillStyle(0x38bdf8, hasIsruOxygen ? 0.24 : 0)
        .setStrokeStyle(1.5, 0x7dd3fc, hasIsruOxygen ? 0.65 : 0);
      this.setReadout('solar', az ? 'GÜNƏŞ PANELLƏRİ' : 'SOLAR ARRAY', snap.solarOutputPct === null
        ? az ? 'Quraşdırma gözlənilir' : 'Setup pending'
        : az ? `Nominal gücün ${snap.solarOutputPct}%-i` : `${snap.solarOutputPct}% of nominal output`,
      lowLight ? '#f6d99e' : '#c6e9d1');
      if (previous && (previous.powerLow !== snap.powerLow || previous.sunlightFraction !== snap.sunlightFraction)) {
        this.acknowledgeFacility('solar', snap.powerLow || lowLight ? 0xf6d99e : 0xc6e9d1);
      }

      this.habitatLight.setFillStyle(snap.powerLow ? 0xe7af64 : 0xa4eadc)
        .setAlpha(snap.powerLow ? 0.05 : 0.19 + powerFrac * 0.32);
      const habitatStatus = snap.lifeSupportLow
        ? az ? `Həyat təminatı zəif · ${fmt(snap.lifeSupportPct)}%` : `Life support low · ${fmt(snap.lifeSupportPct)}%`
        : snap.powerLow
          ? az ? 'Batareya ehtiyatı azdır' : 'Battery reserve low'
          : az ? `Həyat təminatı · ${fmt(snap.lifeSupportPct)}%` : `Life support · ${fmt(snap.lifeSupportPct)}%`;
      this.setReadout('habitat', az ? 'YAŞAYIŞ MODULU' : 'HABITAT', habitatStatus,
        snap.lifeSupportLow || snap.powerLow ? '#f6d59b' : '#c6e9d1');

      const crop = CROP_DISPLAY[snap.cropStatus];
      const cropProgress = Phaser.Math.Clamp(snap.cropProgress, 0, 1);
      const cropDetail = snap.harvestedFoodKg > 0 ? ` · ${fmt(snap.harvestedFoodKg)} ${az ? 'kq' : 'kg'}`
        : snap.cropStatus === 'idle' ? '' : ` · ${Math.round(cropProgress * 100)}%`;
      const hasCrop = snap.cropStatus !== 'idle' && snap.cropStatus !== 'harvested';
      this.greenhouseImage.setTexture(hasCrop
        ? cropProgress >= 0.8 ? 'greenhouse-growing' : cropProgress >= 0.4 ? 'greenhouse-mid' : 'greenhouse-tray'
        : snap.cropStatus === 'harvested' ? 'greenhouse-harvested' : 'greenhouse');
      this.greenhouseLight.setFillStyle(crop.light).setAlpha(crop.opacity);
      this.setReadout('greenhouse', az ? 'İSTİXANA' : 'GREENHOUSE', `${crop[snap.lang]}${cropDetail}`, crop.text);
      this.cropTrack.setVisible(snap.cropStatus !== 'idle');
      this.cropFill.setFillStyle(crop.light).setScale(cropProgress, 1).setVisible(cropProgress > 0);
      if (previous && previous.cropStatus !== snap.cropStatus) this.acknowledgeFacility('greenhouse', crop.light);

      const water = snap.iceWaterKg;
      const iceStatus = water !== null
        ? az ? `${fmt(water, 2)} kq təmiz su` : `${fmt(water, 2)} kg water recovered`
        : snap.iceBypassed ? az ? 'Emal seçilmədi' : 'Processing skipped'
          : snap.activeStep === 4 ? snap.icePreparationAvailable
            ? az ? 'Hazırlıq açılıb · D4-A' : 'Prep unlocked · D4-A'
            : az ? 'D4 planı gözlənilir' : 'Awaiting D4 plan'
            : az ? 'Gözləmə rejimi' : 'Standby';
      this.setReadout('ice', az ? 'BUZ EMAL QURĞUSU' : 'ICE PROCESSOR', iceStatus,
        water !== null && water > 0 ? '#bceaf5' : '#c0d0d1');
      if (water !== previous?.iceWaterKg) {
        this.tweens.killTweensOf(this.iceFill);
        const level = Phaser.Math.Clamp(water ?? 0, 0, 1);
        this.iceFill.setVisible(level > 0).setScale(1, b.reducedMotion ? level : 0);
        if (level > 0 && !b.reducedMotion) {
          this.tweens.add({ targets: this.iceFill, scaleY: level, duration: 480, ease: 'Sine.Out' });
        }
      }
      if (previous && (previous.icePreparationAvailable !== snap.icePreparationAvailable || previous.iceWaterKg !== water)) {
        this.acknowledgeFacility('ice', 0x9edce8);
      }
      this.setReadout('shelter', az ? 'D5 · SIĞINACAQ' : 'D5 · SHELTER',
        az ? 'Qorunma planını seçin' : 'Choose a shielding plan', '#f6d59b', snap.stormPending);

      this.batteryLight
        .setVisible(powerFrac > 0)
        .setScale(powerFrac, 1)
        .setFillStyle(snap.powerLow ? 0xf2916d : 0xb8e3a1);

      if (previous?.lang !== snap.lang) {
        STATIONS.forEach((station, idx) => {
          this.sectorLabels[idx].setText(`${station.sectorCode} / ${station.roomName[snap.lang].toLocaleUpperCase(snap.lang)}`);
        });
        this.sectorLabels[6].setText(az ? 'AY MAŞINININ DAYANACAĞI' : 'ROVER PARKING');
      }

      // Update Ice Crystal Sprites
      snap.minedCrystals.forEach((mined, idx) => {
        this.iceSprites[idx]?.setTexture(mined ? 'ice-crystal-mined' : 'ice-crystal');
        this.iceGlows[idx]?.setVisible(!mined);
      });

      // Update Collectible Field Sample Sprites
      snap.collectedSamples?.forEach((collected, idx) => {
        this.sampleSprites[idx]?.setTexture(collected ? 'field-sample-collected' : 'field-sample');
        this.sampleGlows[idx]?.setVisible(!collected);
      });

      // Update Station Lights & Badges
      for (const st of STATIONS) {
        const done = st.decisionId <= snap.completedCount;
        const isCurrent = st.decisionId === snap.activeStep;
        const calibrated = snap.calibratedTasks[st.decisionId - 1];
        const lights = this.facilityLights.get(st.decisionId) ?? [];
        const changed = previous && previous.choices[st.decisionId - 1] !== snap.choices[st.decisionId - 1];
        const harvest = st.decisionId === 6 && previous?.harvestedFoodKg === 0 && snap.harvestedFoodKg > 0;
        if (previous && (changed || harvest || previous.powerLow !== snap.powerLow)) {
          this.facilityPulseAt.set(st.decisionId, time);
        }
        const status = st.decisionId === 5 && snap.stormPending ? 0xf8bd74
          : snap.batteryKwh <= 0 ? 0xf87171
          : snap.powerLow ? 0xfb923c
          : done ? 0x86efac
          : isCurrent ? 0xfde047
          : 0x8399a1;
        for (const light of lights) {
          light.setFillStyle(status);
        }
        const badge = this.stationBadges.get(st.decisionId);
        if (badge) {
          const choiceIdx = snap.choices?.[st.decisionId - 1];
          const optLetter =
            choiceIdx !== undefined && ['A', 'B', 'C'][choiceIdx]
              ? ` [${['A', 'B', 'C'][choiceIdx]}]`
              : '';
          badge
            .setText(
              done
                ? `D${st.decisionId}${optLetter} ✓`
                : calibrated
                  ? `D${st.decisionId} ★`
                  : `D${st.decisionId}`,
            )
            .setColor(done ? '#bbf7d0' : isCurrent ? '#fef08a' : '#cbd5e1');
        }
      }

      // Active Objective Beacon
      const activeSt = STATIONS[Math.min(5, Math.max(0, snap.activeStep - 1))];
      this.beacon.setPosition(activeSt.x, activeSt.y);
      this.targetHighlight
        .setPosition(activeSt.x, activeSt.y)
        .setStrokeStyle(2, snap.stormPending ? 0xfb923c : 0xc0e6aa, 0.85);
      this.terminalLabel
        .setPosition(activeSt.x, activeSt.y - 98)
        .setText(`${activeSt.code[snap.lang]}`)
        .setColor(snap.stormPending ? '#fdba74' : '#d9f99d');

      // Run A Temporal Ghost Crewmate at Diverged Rewind Station
      if (snap.hasBranch && snap.divergedStep !== null) {
        const divSt = STATIONS[snap.divergedStep - 1];
        if (divSt) {
          this.ghostSprite
            .setPosition(divSt.x + 56, divSt.y - 8)
            .setDepth(groundDepth(divSt.y - 8))
            .setVisible(true);
          this.ghostTag
            .setPosition(divSt.x + 56, divSt.y - 102)
            .setText(`RUN A · ${snap.runAChoiceLabel}`)
            .setVisible(true);
        }
      } else {
        this.ghostSprite.setVisible(false);
        this.ghostTag.setVisible(false);
      }
    }
    if (this.ghostSprite.visible && !b.reducedMotion) {
      this.ghostSprite.setTexture(`crew-ghost-down-idle-${Math.floor(time / 700) % 2}`);
    }

    this.beacon.setAlpha(near ? 1 : 0.72);
    this.terminalLabel.setAlpha(near ? 0.2 : 0.95);

    if (time > this.reportAt) {
      b.onTelemetry({
        player: { x: Math.round(activePos.x), y: Math.round(activePos.y) },
        car: { x: Math.round(this.carSprite.x), y: Math.round(this.carSprite.y) },
        drone: { x: Math.round(this.dronePos.x), y: Math.round(this.dronePos.y) },
        tier: getElevationTier(activePos.x, activePos.y),
        nearIceIdx,
        nearSampleIdx: sampleInteraction ? nearSampleIdx : -1,
        nearCar: nearParkedCar,
        crew: this.aiCrew.map((c) => ({
          id: c.def.id,
          x: Math.round(c.sprite.x),
          y: Math.round(c.sprite.y),
          statusText:
            c.def.stepLines[Math.min(6, Math.max(1, snap.activeStep))]?.[snap.lang] ?? '',
        })),
        nearbyCrewSpeech,
      });
      this.reportAt = time + 140;
    }
  }
}
