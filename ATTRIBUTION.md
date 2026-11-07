# Sources, credits, and licensing status

The [2026 NASA Space Apps participant terms](https://www.spaceappschallenge.org/legal/) require source citations and applicable third-party license documentation. Original challenge content must be freely available without restriction or under an OSI-approved license. The terms specify Apache 2.0 as NASA’s distribution default if the team specifies no qualifying license.

## Proposed license for team materials

**Pending approval by the rights holders.** Use [Apache-2.0](https://opensource.org/license/apache-2.0) for confirmed team-owned code, documentation, and original art and audio. The [candidate license text](licensing/Apache-2.0.txt) is supplied for review. This draft grants no project license. After approval, record the copyright holders and scope, add the approved text as the root `LICENSE`, and keep this attribution alongside the submission. Third-party material retains its own terms.

## Scientific sources and media

- [NASA_SCIENCE.md](NASA_SCIENCE.md) credits the published NASA, NOAA, IAU/USGS, and research references, and identifies the values used in the exercise. The in-game Evidence panel also links the Williams et al. Diviner paper, the LRO PDS archive, and the Schwadron et al. CRaTER paper. See [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) for agency media and marks.
- The field specimen cards credit [NASA LRO LOLA](https://science.nasa.gov/mission/lro/lola/), [Apollo 15 Genesis Rock](https://science.nasa.gov/solar-system/moon/genesis-rock/), [NASA’s lunar regolith processing reference](https://ntrs.nasa.gov/citations/20080008755), [LRO instruments including Diviner and CRaTER](https://science.nasa.gov/mission/lro/spacecraft-and-instruments/), and [LCROSS](https://science.nasa.gov/mission/lcross/). These cards describe training analogs and link to agency references.
- The nine SVGs in `public/assets/` depict astronauts, a rover and stations. The game also draws SVG art in `src/game/`, has an inline SVG favicon in `index.html`, and synthesizes sounds in `src/utils/soundEffects.ts`. The source inspection found no embedded external images or shipped audio recordings. Authorship and any reference inputs for the inherited SVGs and other project art were not established by the supplied copy. The team should confirm their provenance, record any creators and license terms, and clear or replace any assets with unresolved rights before submitting.
- The interface uses Lucide icons, whose package notice credits Feather. CSS names local fonts and uses system fallbacks. The practice copy ships no font files.

## Direct software dependencies

Versions below come from the installed packages and correspond to the lockfile. Preserve applicable upstream notices for redistributed code and check the transitive packages included in any submitted build. `package-lock.json` records the resolved package tree.

| Package | Version | Declared license | Upstream |
| --- | --- | --- | --- |
| `@react-three/drei` | 9.120.4 | MIT | [Project](https://github.com/pmndrs/drei) |
| `@react-three/fiber` | 8.17.10 | MIT | [Project](https://github.com/pmndrs/react-three-fiber#readme) |
| `@tailwindcss/vite` | 4.3.3 | MIT | [Project](https://tailwindcss.com) |
| `@types/canvas-confetti` | 1.9.0 | MIT | [Project](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/canvas-confetti) |
| `@types/react` | 18.3.31 | MIT | [Project](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react) |
| `@types/react-dom` | 18.3.7 | MIT | [Project](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-dom) |
| `@types/three` | 0.187.0 | MIT | [Project](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/three) |
| `@vitejs/plugin-react` | 4.7.0 | MIT | [Project](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#readme) |
| `canvas-confetti` | 1.9.4 | ISC | [Project](https://github.com/catdad/canvas-confetti#readme) |
| `lucide-react` | 0.468.0 | ISC | [Project](https://lucide.dev) |
| `phaser` | 4.2.1 | MIT | [Project](https://phaser.io) |
| `react` | 18.3.1 | MIT | [Project](https://reactjs.org/) |
| `react-dom` | 18.3.1 | MIT | [Project](https://reactjs.org/) |
| `recharts` | 2.15.4 | MIT | [Project](https://github.com/recharts/recharts) |
| `tailwindcss` | 4.3.3 | MIT | [Project](https://tailwindcss.com) |
| `three` | 0.187.0 | MIT | [Project](https://threejs.org/) |
| `typescript` | 5.6.3 | Apache-2.0 | [Project](https://www.typescriptlang.org/) |
| `vite` | 6.4.5 | MIT | [Project](https://vite.dev) |

**GSAP review.** The legacy prototype's two GSAP animations were replaced with browser and Phaser animations, and GSAP was removed from the package and lockfile. The active outpost already used Phaser. The earlier package used the [GSAP Standard No Charge License](https://gsap.com/community/standard-license/), which limits the grant to permitted uses.

The lockfile review also found the build-time `caniuse-lite` dataset (CC BY 4.0) and `webgl-constants` (MIT in its bundled LICENSE; absent from its package metadata). If distributing either package, carry its upstream notice.

**Submission follow-up.** Confirm the team license and inherited artwork provenance before submission. Preserve applicable upstream notices, including those for transitive libraries in the final bundle, and include the source citations with the submission.

**7 November 2026 audit.** Rechecked the official 2026 terms (updated 7 August). The approval and artwork tasks above remain open. [Bundled runtime notices](public/THIRD_PARTY_NOTICES.txt) now collect installed license texts for 31 packages from the actual production module graph, including nested victory-vendor notices and its [versioned upstream MIT license](licensing/Victory-LICENSE.txt). Regenerate with `node scripts/prepare-notices.mjs` and rebuild after import/dependency changes. Review embedded third-party components before release; this collection grants no team-material license and does not establish inherited art rights. See [COMPETITION_READINESS.md](COMPETITION_READINESS.md).
