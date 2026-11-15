import Phaser from 'phaser';
import { GAME_ART, svgDataUri } from './art';
import { CHARACTER, type CrewSuitId } from './character';
import { nearestNavigablePoint, planRoute, type Rectangle } from './navigation';
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
  private lastTrackPos: Point = { x: WORLD.roverSpawn.x, y: WORLD.roverSpawn.y };

  private facilityLights = new Map<number, Phaser.GameObjects.Arc[]>();
  private stationBadges = new Map<number, Phaser.GameObjects.Text>();
  private iceSprites: Phaser.GameObjects.Image[] = [];
  private iceGlows: Phaser.GameObjects.Ellipse[] = [];
  private sampleSprites: Phaser.GameObjects.Image[] = [];
  private sampleGlows: Phaser.GameObjects.Ellipse[] = [];
  private samplePrompts: Phaser.GameObjects.Text[] = [];

  private solarImage!: Phaser.GameObjects.Image;
  private batteryLight!: Phaser.GameObjects.Rectangle;
  private habitatLight!: Phaser.GameObjects.Ellipse;
  private habitatWarning!: Phaser.GameObjects.Text;
  private greenhouseLight!: Phaser.GameObjects.Ellipse;
  private cropTitle!: Phaser.GameObjects.Text;
  private cropStatus!: Phaser.GameObjects.Text;
  private cropTrack!: Phaser.GameObjects.Rectangle;
  private cropFill!: Phaser.GameObjects.Rectangle;

  private targetHighlight!: Phaser.GameObjects.Ellipse;
  private beacon!: Phaser.GameObjects.Container;
  private terminalLabel!: Phaser.GameObjects.Text;
  private waypointRing!: Phaser.GameObjects.Ellipse;
  private tractionLabel!: Phaser.GameObjects.Text;

  // Dynamic Graphics Overlays
  private trackGfx!: Phaser.GameObjects.Graphics;
  private lightingCanvasTex!: Phaser.Textures.CanvasTexture;
  private lightingOverlayImg!: Phaser.GameObjects.Image;
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
  private lightRefreshAt = 0;
  private facilityPulseAt = new Map<number, number>();
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

      if (building.id === 'solar') this.solarImage = image;
      if (building.id === 'battery') {
        this.batteryLight = this.add
          .rectangle(-25, -33, 22, 3.5, 0xb8e3a1)
          .setRotation(0.29);
        group.add(this.batteryLight);
      }
      if (building.id === 'habitat') {
        this.habitatLight = this.add
          .ellipse(-64, -71, 64, 32, 0x9ae4d4, 0.18)
          .setRotation(0.29);
        group.add(this.habitatLight);
        this.habitatWarning = this.add
          .text(building.x, building.y + 23, '', {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#ffdfa0',
            backgroundColor: '#302115f5',
            padding: { x: 9, y: 5 },
          })
          .setOrigin(0.5)
          .setDepth(2040)
          .setVisible(false);
      }
      if (building.id === 'greenhouse') {
        this.greenhouseLight = this.add
          .ellipse(-13, -55, 106, 34, 0xa7dab6, 0.16)
          .setRotation(0.3);
        group.add(this.greenhouseLight);
        this.createCropDisplay(building.x - 12, building.y + 27);
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

    // 5 Interactive Glowing 90 K Water-Ice Crystal Clusters in Sector 04
    ICE_DEPOSITS.forEach((pt) => {
      const glow = this.add
        .ellipse(pt.x, pt.y - 6, 56, 22, 0x38bdf8, 0.22)
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

    // Register Walk & Idle Animations for Commander + AI Crewmates
    const suits: CrewSuitId[] = ['commander', 'engineer', 'scientist'];
    for (const suit of suits) {
      const prefix = suit === 'commander' ? 'astronaut' : `crew-${suit}`;
      for (const direction of ['down', 'up', 'left', 'right'] as const) {
        this.anims.create({
          key: `${suit}-walk-${direction}`,
          frames: Array.from({ length: CHARACTER.walkFrames }, (_, i) => ({
            key: `${prefix}-${direction}-${i}`,
          })),
          frameRate: 12,
          repeat: -1,
        });
        this.anims.create({
          key: `${suit}-idle-${direction}`,
          frames: [0, 1].map((i) => ({ key: `${prefix}-${direction}-idle-${i}` })),
          frameRate: 1.2,
          repeat: -1,
        });
      }
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

    // Dynamic FX & Step 3 Polar "Lights Out" Darkness Overlay
    this.fxGfx = this.add.graphics().setDepth(1950);
    const lightTex = this.textures.createCanvas('polar-shadow-mask', 460, 280);
    if (lightTex) {
      this.lightingCanvasTex = lightTex;
      this.lightingOverlayImg = this.add
        .image(0, 0, 'polar-shadow-mask')
        .setOrigin(0)
        .setScale(4)
        .setDepth(1920)
        .setVisible(false);
    }

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
    camera.startFollow(
      this.player,
      true,
      this.bridge.reducedMotion ? 1 : 0.09,
      this.bridge.reducedMotion ? 1 : 0.09,
    );
    camera.setFollowOffset(0, 35);
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

  private createCropDisplay(x: number, y: number) {
    const backing = this.add
      .rectangle(0, 0, 152, 47, 0x10212c, 0.97)
      .setStrokeStyle(1, 0x49656d, 0.9);
    this.cropTitle = this.add
      .text(-66, -18, '', { fontFamily: 'monospace', fontSize: '10px', color: '#a9c8c5' });
    this.cropStatus = this.add
      .text(-66, -5, '', { fontFamily: 'Inter, sans-serif', fontSize: '12px', fontStyle: 'bold' });
    this.cropTrack = this.add.rectangle(-66, 15, 132, 3, 0x314950).setOrigin(0, 0.5);
    this.cropFill = this.add.rectangle(-66, 15, 132, 3, 0x87cebd).setOrigin(0, 0.5);
    this.add
      .container(x, y, [backing, this.cropTitle, this.cropStatus, this.cropTrack, this.cropFill])
      .setDepth(2040);
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
      g.fillStyle(0x0f2537, 0.26).fillPoints(pts, true);
      g.fillStyle(0x0e2030, 0.18).fillEllipse(
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

      g.lineStyle(1.2, 0xd4cfc0, 0.26).beginPath().moveTo(points[0][0] - 14, points[0][1]);
      for (const [x, y] of points.slice(1)) g.lineTo(x - 14, y);
      g.strokePath();

      g.lineStyle(1.2, 0xd4cfc0, 0.2).beginPath().moveTo(points[0][0] + 14, points[0][1]);
      for (const [x, y] of points.slice(1)) g.lineTo(x + 14, y);
      g.strokePath();
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
    g.lineStyle(1.8, 0x38bdf8, 0.35).strokeRoundedRect(995, 598, 120, 74, 8);

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
      g.lineStyle(6, 0x1c2e3f, 0.72).beginPath().moveTo(route[0][0], route[0][1]);
      for (const [x, y] of route.slice(1)) g.lineTo(x, y);
      g.strokePath();
      g.lineStyle(2, 0x86a3aa, 0.62).beginPath().moveTo(route[0][0], route[0][1]);
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
      g.fillStyle(0x9eead9, 0.9).fillRect(x - 2, y - 9, 4, 2.5);
    }

    // Bake static infrastructure into one GPU/Canvas texture
    g.generateTexture('infrastructure', WORLD.width, WORLD.height);
    g.destroy();
    this.add.image(0, 0, 'infrastructure').setOrigin(0).setDepth(-10);

    // Sector Stencil Labels on Lunar Regolith
    const stencils: Array<[number, number, string, string]> = [
      [335, 462, 'SEC-01 · SOLAR RIM (+2)', '#d8d2be'],
      [895, 584, 'SEC-02 · COMMAND PLAZA', '#9ab0b4'],
      [425, 852, 'SEC-03 · CRYO FUEL CELLS', '#9bd2d4'],
      [1365, 995, 'SEC-04 · 90K COLD-TRAP ICE (-2)', '#7dd3fc'],
      [795, 968, 'SEC-05 · STORM BUNKER', '#eab87d'],
      [1530, 535, 'SEC-06 · ASCENT & BIO', '#b8e0b9'],
      [1055, 684, 'LUNAR CAR PAD [V]', '#7dd3fc'],
    ];
    for (const [x, y, label, color] of stencils) {
      this.add
        .text(x, y, label, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color,
          letterSpacing: 2,
        })
        .setOrigin(0.5)
        .setAlpha(0.58)
        .setDepth(-4);
    }
  }

  private updateAiCrewmates(time: number, dtSec: number, snap: WorldBridge['snapshot'], activePos: Point) {
    let closestSpeech: { speaker: string; role: string; text: string; color: string } | null = null;
    let closestDist = 142;
    const isStormEmergency = snap.activeStep === 5 && snap.completedCount < 5;

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
        const idleFrame = Math.floor(time / 650) % 2;
        crew.sprite.setTexture(`crew-${crew.def.suit}-${crew.facing}-idle-${idleFrame}`);
      } else if (dist <= 8) {
        if (!isStormEmergency) {
          crew.waypointIdx = (crew.waypointIdx + 1) % crew.def.patrol.length;
          crew.pauseUntil = time + 2200;
        }
        const idleFrame = Math.floor(time / 650) % 2;
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

    const bob = Math.sin(time * 0.005) * 4.5;
    const rotorIdx = Math.floor(time / 90) % 2;
    this.droneSprite
      .setPosition(this.dronePos.x, this.dronePos.y + bob)
      .setTexture(`ai-drone-${rotorIdx}`)
      .setDepth(groundDepth(this.dronePos.y) + 35);
    this.droneScanRing.setPosition(this.dronePos.x, this.dronePos.y + 6);
    this.droneTag.setPosition(this.dronePos.x, this.dronePos.y - 54 + bob);
  }

  private renderPolarShadowAndStormFX(
    time: number,
    snap: WorldBridge['snapshot'],
    activePos: Point,
    inCar: boolean,
    nearIceIdx: number,
    drilling: boolean,
  ) {
    this.fxGfx.clear();

    // Mission shadow mask. Refresh at 30 Hz as the camera and sprites render independently.
    const isShadowCrisis = snap.activeStep === 3 && snap.completedCount < 3;
    if (this.lightingOverlayImg && this.lightingCanvasTex) {
      this.lightingOverlayImg.setVisible(isShadowCrisis);
      if (!isShadowCrisis) this.lightRefreshAt = 0;
      if (isShadowCrisis && time >= this.lightRefreshAt) {
        this.lightRefreshAt = time + 33;
        const ctx = this.lightingCanvasTex.getContext();
        const w = 460;
        const h = 280;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(6, 15, 26, 0.68)';
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'destination-out';
        const punchLight = (wx: number, wy: number, radiusWorld: number, strength = 1) => {
          const cx = wx / 4;
          const cy = wy / 4;
          const r = radiusWorld / 4;
          const grad = ctx.createRadialGradient(cx, cy, r * 0.12, cx, cy, r);
          grad.addColorStop(0, `rgba(0,0,0,${strength})`);
          grad.addColorStop(0.65, `rgba(0,0,0,${strength * 0.55})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        };

        // Player / Lunar Car Vision Radius + Forward Headlamp Pool
        punchLight(activePos.x, activePos.y - 16, inCar ? 275 : 215, 1);
        punchLight(activePos.x + this.heading.x * 105, activePos.y + this.heading.y * 105, inCar ? 220 : 145, 0.85);

        // The reactor keeps an emergency marker while the main lamps follow battery status.
        const power = snap.energyPercent <= 0 ? 0 : snap.powerLow ? 0.32 : 0.88;
        punchLight(895, 395, 185, power);
        punchLight(425, 775, 165, 0.92); // D3 Cryo-Fuel Reactor Target
        punchLight(1290, 445, 140, power * 0.8);
        for (const c of this.aiCrew) {
          punchLight(c.sprite.x, c.sprite.y - 15, 105, 0.72);
        }
        this.lightingCanvasTex.refresh();
      }
    }

    // Headlight footprint follows the rover's direction, including diagonal travel.
    if (inCar) {
      const { x: dx, y: dy } = this.heading;
      const x = activePos.x + dx * 44;
      const y = activePos.y + dy * 23;
      const beamLength = isShadowCrisis ? 170 : 100;
      this.fxGfx.fillStyle(0xffe9ae, isShadowCrisis ? 0.14 : 0.08);
      for (const side of [-1, 1]) {
        const lampX = x - dy * side * 9;
        const lampY = y + dx * side * 9;
        const endX = lampX + dx * beamLength;
        const endY = lampY + dy * beamLength * 0.75;
        this.fxGfx.fillTriangle(lampX, lampY, endX - dy * 25, endY + dx * 25, endX + dy * 25, endY - dx * 25);
      }
    }

    // Outlined shelter areas and stylized warnings during the training storm.
    const isStormActive = snap.activeStep === 5 && snap.completedCount < 5;
    if (isStormActive) {
      const pulse = this.bridge.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(time * 0.006);
      // Safe Cyan Shield Zones over D5 Storm Bunker & D2 Habitat
      this.fxGfx
        .lineStyle(2.5, 0x38bdf8, 0.55 + pulse * 0.35)
        .strokeEllipse(795, 885, 255, 130);
      this.fxGfx.fillStyle(0x38bdf8, 0.07 + pulse * 0.05).fillEllipse(795, 885, 255, 130);

      this.fxGfx
        .lineStyle(2, 0x2dd4bf, 0.45 + pulse * 0.25)
        .strokeEllipse(895, 395, 285, 140);
      this.fxGfx.fillStyle(0x2dd4bf, 0.05 + pulse * 0.04).fillEllipse(895, 395, 285, 140);

    }

    // 4. Active Cryo-Laser Ice Mining Beam ([Space] near Sector 04 90 K Ice Crystal)
    if (drilling && nearIceIdx >= 0) {
      const icePt = ICE_DEPOSITS[nearIceIdx];
      const ox = activePos.x + (icePt.x >= activePos.x ? 22 : -22);
      const oy = activePos.y - 24;
      this.fxGfx.lineStyle(5, 0x0ea5e9, 0.42).lineBetween(ox, oy, icePt.x, icePt.y - 18);
      this.fxGfx.lineStyle(2.2, 0xe0f2fe, 0.95).lineBetween(ox, oy, icePt.x, icePt.y - 18);
      const sparkR = this.bridge.reducedMotion ? 7 : 7 + Math.sin(time * 0.04) * 3;
      this.fxGfx.fillStyle(0x67e8f9, 0.85).fillCircle(icePt.x, icePt.y - 18, sparkR);
    }

    // 5. Render Fading Lunar Car Tire Tracks
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
        this.cameras.main.startFollow(
          this.carSprite,
          true,
          b.reducedMotion ? 1 : 0.09,
          b.reducedMotion ? 1 : 0.09,
        );
        this.lastTrackPos = { x: this.carSprite.x, y: this.carSprite.y };
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
        this.cameras.main.startFollow(
          this.player,
          true,
          b.reducedMotion ? 1 : 0.09,
          b.reducedMotion ? 1 : 0.09,
        );
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
      const rolling = !b.reducedMotion && Math.hypot(carBody.velocity.x, carBody.velocity.y) > 24;
      this.carSprite.setTexture(rolling && Math.floor(time / 90) % 2 ? 'lunar-car-rolling' : 'lunar-car-occupied');

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

      this.facing = facingDirection(movement, this.facing);
      if (movement.x || movement.y) {
        this.player.play(`commander-walk-${this.facing}`, true);
        if (time > this.stepSoundAt) {
          soundFX.play('footstep');
          this.stepSoundAt = time + 310;
        }
      } else if (!b.reducedMotion && !paused) {
        this.player.play(`commander-idle-${this.facing}`, true);
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
    const near = findNearbyStation(activePos, snap.activeStep);
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

    // Render Polar Shadow ("Lights Out"), Headlights, Storm Shields & Laser FX
    this.renderPolarShadowAndStormFX(
      time,
      snap,
      activePos,
      snap.controllingRover,
      nearIceIdx,
      drilling,
    );

    // Sync Deterministic World Snapshot Visuals
    if (snap !== this.lastSnapshot) {
      const previous = this.lastSnapshot;
      this.lastSnapshot = snap;

      const powerFrac = Math.max(0, Math.min(1, snap.energyPercent / 100));
      this.habitatLight.setFillStyle(snap.lifeSupportLow ? 0xe7af64 : 0x9ae4d4)
        .setAlpha(snap.powerLow ? 0.025 : 0.11 + powerFrac * 0.34);
      this.habitatWarning
        .setText(snap.lang === 'az' ? 'Həyat təminatı zəifləyib' : 'Life support under stress')
        .setVisible(snap.lifeSupportLow);
      const crop = CROP_DISPLAY[snap.cropStatus];
      const cropProgress = Phaser.Math.Clamp(snap.cropProgress, 0, 1);
      const progressLabel = snap.cropStatus === 'idle' ? '' : ` · ${Math.round(cropProgress * 100)}%`;
      this.greenhouseLight.setFillStyle(crop.light).setAlpha(crop.opacity);
      this.cropTitle.setText(snap.lang === 'az' ? 'İSTİXANA' : 'GREENHOUSE');
      this.cropStatus.setText(`${crop[snap.lang]}${progressLabel}`).setColor(crop.text);
      this.cropTrack.setVisible(snap.cropStatus !== 'idle');
      this.cropFill.setFillStyle(crop.light).setScale(cropProgress, 1).setVisible(cropProgress > 0);
      this.batteryLight
        .setScale(Math.max(0.1, powerFrac), 1)
        .setFillStyle(snap.powerLow ? 0xf2916d : 0xb8e3a1);
      this.solarImage.setTexture(snap.activeStep === 3 && snap.completedCount < 3 ? 'solar-off' : 'solar');

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
        if (previous && (changed || previous.powerLow !== snap.powerLow)) {
          this.facilityPulseAt.set(st.decisionId, time);
        }
        const status = snap.energyPercent <= 0 ? 0xf87171
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
        .setStrokeStyle(2, snap.activeStep === 5 ? 0xfb923c : 0xc0e6aa, 0.85);
      this.terminalLabel
        .setPosition(activeSt.x, activeSt.y - 98)
        .setText(`${activeSt.code[snap.lang]}`)
        .setColor(snap.activeStep === 5 ? '#fdba74' : '#d9f99d');

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
