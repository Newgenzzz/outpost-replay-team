import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  Columns2,
  Compass,
  Flame,
  HeartPulse,
  Maximize2,
  Radiation,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Sun,
  ThermometerSnowflake,
  X,
  Zap,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { SimulationResult } from '../engine/simulation';
import type { Bilingual, MetricState } from '../types';
import { soundFX } from '../utils/soundEffects';

export type HotspotId = 'solar' | 'habitat' | 'rover' | 'shelter';

interface HotspotContent {
  id: HotspotId;
  number: number;
  badge: Bilingual;
  title: Bilingual;
  howItWorks: Bilingual;
  nasaMeasurement: Bilingual;
  whyItMatters: Bilingual;
  accentColor: string;
}

const HOTSPOTS: Record<HotspotId, HotspotContent> = {
  solar: {
    id: 'solar',
    number: 1,
    badge: { en: 'Hotspot 1 · Solar Peak', az: 'Nöqtə 1 · Günəş Zirvəsi' },
    title: {
      en: 'Grazing Polar Sunlight & 10 m Solar Mast',
      az: 'Üfüqi Qütb Günəş İşığı və 10 m Günəş Dirəyi',
    },
    howItWorks: {
      en: 'At the Lunar South Pole, the Sun never rises high overhead—it skims the horizon at just 1.5°. A nearby mountain ridge can block low deck panels for days. Raising solar panels on a 10-meter vertical tower lifts them above local shadows so they keep making electricity.',
      az: 'Ayın Cənub Qütbündə Günəş heç vaxt baş üzərinə qalxmır—üfüqdə cəmi 1.5° bucaq altında hərəkət edir. Yaxınlıqdakı dağ silsiləsi alçaq panelləri günlərlə kölgədə qoya bilər. Günəş panellərini 10 metrlik şaquli qülləyə qaldırmaq onları yerli kölgələrdən yuxarı çıxarır və elektrik istehsalını davam etdirir.',
    },
    nasaMeasurement: {
      en: 'NASA LRO LOLA laser altimetry (Mazarico et al., 2011) mapped Shackleton Rim (89.67°S, 129.78°E): during a 72-hour topographic horizon shadow, ground-level solar visibility drops by 85% (to 15%), while a 10 m mast preserves ~40% solar output.',
      az: 'NASA LRO LOLA lazer altimetriyası (Mazarico və b., 2011) Şeklton kənarını (89.67°C, 129.78°Ş) xəritələşdirib: 72 saatlıq topoqrafik üfüq kölgəsi zamanı səthdə günəş görünüşü 85% azalır (15%-ə düşür), 10 m-lik dirək isə ~40% gücü qoruyub saxlayır.',
    },
    whyItMatters: {
      en: 'Without steady power during the 72-hour shadow, batteries drain below 20 kWh (triggering an ECLSS brownout) or hit 0 kWh (a freezing blackout). Backup H₂/O₂ fuel cells or a tall solar mast prevent the crew from freezing!',
      az: '72 saatlıq kölgədə sabit enerji olmasa, batareyalar 20 kVt·s-dən aşağı düşür (həyat təminatında enerji çatışmazlığı) və ya 0 kVt·s-ə çatır (dondurucu tam kəsilmə). Ehtiyat H₂/O₂ yanacaq elementləri və ya hündür günəş dirəyi ekipajı donmaqdan xilas edir!',
    },
    accentColor: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
  },
  habitat: {
    id: 'habitat',
    number: 2,
    badge: { en: 'Hotspot 2 · Habitat & ECLSS', az: 'Nöqtə 2 · Yaşayış Günbəzi və ECLSS' },
    title: {
      en: 'Pressurized Habitat Dome & Closed-Loop Life Support',
      az: 'Hermetik Yaşayış Günbəzi və Qapalı Dövrəli Həyat Təminatı',
    },
    howItWorks: {
      en: 'Every drop of water and breath of air on the Moon is precious. Inside the dome, the Environmental Control and Life Support System (ECLSS) scrubs carbon dioxide exhaled by the astronauts, recycles 98% of wastewater, and heats the cabin against the vacuum of space.',
      az: 'Ayda hər damcı su və hər nəfəs hava qızıldan qiymətlidir. Günbəzin içində Ətraf Mühitə Nəzarət və Həyat Təminatı Sistemi (ECLSS) astronavtların nəfəs verdiyi karbon qazını təmizləyir, çirkab suyun 98%-ni təkrar emal edir və kabini kosmosun soyuğundan qoruyur.',
    },
    nasaMeasurement: {
      en: 'NASA Life Support BVAD (NASA/TP-2015-218570) & ISS ECLSS (2023): each astronaut consumes 0.82 kg of O₂/day and exhales 1.04 kg of CO₂/day, while ISS Brine Processor technology achieves 98% water recovery.',
      az: 'NASA Həyat Təminatı BVAD Sənədi (NASA/TP-2015-218570) və BKS ECLSS (2023): hər astronavt gündə 0.82 kq O₂ sərf edir və 1.04 kq CO₂ buraxır; BKS su emalı sistemi isə suyun 98%-ni bərpa edir.',
    },
    whyItMatters: {
      en: 'Life support needs continuous electrical power (10 kWh/day base load + heaters). If battery power drops below 20 kWh, heaters and CO₂ scrubbers throttle down (−10% Life Support), putting the crew in immediate danger.',
      az: 'Həyat təminatı sisteminə fasiləsiz elektrik enerjisi (gündə 10 kVt·s əsas yük + qızdırıcılar) lazımdır. Batareya 20 kVt·s-dən aşağı düşərsə, qızdırıcılar və CO₂ təmizləyiciləri zəifləyir (−10% Həyat Təminatı) və ekipaj təhlükə ilə üzləşir.',
    },
    accentColor: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200',
  },
  rover: {
    id: 'rover',
    number: 3,
    badge: { en: 'Hotspot 3 · Cold-Trap Rover', az: 'Nöqtə 3 · Soyuq Tələ Roveri' },
    title: {
      en: 'Shackleton Cold-Trap Crater Floor & Water-Ice Drill',
      az: 'Şeklton Soyuq Tələ Krateri və Su Buzu Qazma Qurğusu',
    },
    howItWorks: {
      en: 'Because the Moon’s axis is tilted only 1.54°, sunlight never reaches the floor of Shackleton Crater (4.2 km deep). For billions of years, comets and solar wind delivered water molecules that froze solid into these "cold traps." Rovers use core drills and lasers to sample this ancient ice.',
      az: 'Ayın oxu cəmi 1.54° əyildiyi üçün Günəş işığı heç vaxt Şeklton kraterinin dibinə (4.2 km dərinliyə) düşmür. Milyardlarla il ərzində kometalar və günəş küləyi bura su molekulları gətirib və onlar bu "soyuq tələlərdə" donub qalıb. Roverlər bu qədim buzu qazma və lazerlə çıxarır.',
    },
    nasaMeasurement: {
      en: 'NASA LRO Diviner Lunar Radiometer (Paige et al., 2010; Williams et al., 2017) measured south-polar cold-trap temperatures plunging to 90 K (−183°C) and below—colder than Pluto—keeping water ice stable in vacuum.',
      az: 'NASA LRO Diviner Ay Radiometri (Paige və b., 2010; Williams və b., 2017) cənub qütbündəki soyuq tələlərdə temperaturun 90 K (−183°C) və daha aşağı düşdüyünü ölçüb—bu, su buzunu vakuumda sabit saxlayır.',
    },
    whyItMatters: {
      en: 'Lunar water ice can be melted for drinking water, split into breathable oxygen (O₂), or turned into hydrogen/oxygen rocket propellant! However, driving into a 90 K crater drains rover batteries rapidly.',
      az: 'Ay su buzu içməli su üçün əridilə bilər, nəfəs almaq üçün oksigenə (O₂) və ya raket yanacağına çevrilə bilər! Lakin 90 K-lik kraterə enmək rover batareyalarını sürətlə boşaldır.',
    },
    accentColor: 'border-sky-400/50 bg-sky-500/10 text-sky-200',
  },
  shelter: {
    id: 'shelter',
    number: 4,
    badge: { en: 'Hotspot 4 · Storm Shelter', az: 'Nöqtə 4 · Fırtına Sığınacağı' },
    title: {
      en: 'Solar Energetic Particle (SEP) Shielding & Regolith Berm',
      az: 'Günəş Enerjili Hissəciklərindən (SEP) Qorunma və Reqolit Səddi',
    },
    howItWorks: {
      en: 'The Moon has no atmosphere and no global magnetic field. When the Sun erupts with an X-class flare, high-energy protons race across space. Astronauts shelter behind hydrogen-rich water walls or thick lunar soil (regolith) berms that absorb incoming protons.',
      az: 'Ayın atmosferi və qlobal maqnit sahəsi yoxdur. Günəşdə X-sinif alışma baş verdikdə, yüksək enerjili protonlar kosmosda sürətlə yayılır. Astronavtlar protonları udan su divarları və ya qalın Ay torpağı (reqolit) sədləri arxasında sığınırlar.',
    },
    nasaMeasurement: {
      en: 'NASA CCMC DONKI recorded the May 10–14, 2024 AR 13664 solar superstorm (X5.8 & X8.7 flares), where ≥10 MeV proton flux spiked to ~205 pfu (~46.7 mSv unshielded storm dose; NASA-STD-3001 limit).',
      az: 'NASA CCMC DONKI 10–14 May 2024-cü ildə AR 13664 Günəş superfırtınasını (X5.8 və X8.7 alışmaları) qeydə alıb: ≥10 MeV proton axını ~205 pfu-ya çatıb (qorunmasız ~46.7 mSv fırtına dozası).',
    },
    whyItMatters: {
      en: 'Staying outside in an EVA suit during a 205 pfu storm adds ~36.8 mSv, pushing total crew dose over the 50 mSv safety threshold. A water-wall shelter cuts storm dose to 15% (7.0 mSv), and a robotic regolith berm cuts it to 6% (2.8 mSv)!',
      az: '205 pfu fırtınası zamanı skafandrda çöldə qalmaq ~36.8 mSv əlavə edir və ekipaj dozasını 50 mSv təhlükəsizlik həddindən yuxarı qaldırır. Su divarı dozanı 15%-ə (7.0 mSv), reqolit səddi isə 6%-ə (2.8 mSv) endirir!',
    },
    accentColor: 'border-rose-400/50 bg-rose-500/10 text-rose-200',
  },
};

interface SingleSceneProps {
  run: SimulationResult;
  viewStep: number;
  runLabel: string;
  isBranch?: boolean;
  compact?: boolean;
  activeHotspot: HotspotId | null;
  onSelectHotspot: (id: HotspotId) => void;
}

function OutpostSceneSVG({
  run,
  viewStep,
  runLabel,
  isBranch = false,
  compact = false,
  activeHotspot,
  onSelectHotspot,
}: SingleSceneProps) {
  const { t } = useI18n();

  // State at the currently inspected step (or latest available step in Run A)
  const stepIndex = Math.min(viewStep, Math.max(1, run.choices.length));
  const stateAtStep: MetricState = run.history[stepIndex] ?? run.history[run.history.length - 1];
  const stepRecord = run.steps[stepIndex - 1];

  // Choices made up to viewStep
  const d1Choice = run.choices[0]; // 0 = 10m mast, 1 = low deck panels, 2 = battery-only
  const d2Choice = viewStep >= 2 ? run.choices[1] : undefined; // 0 = regolith berm, 1 = ISRU O2, 2 = geophysics
  const d3Choice = viewStep >= 3 ? run.choices[2] : undefined; // 0 = survival mode, 1 = backup fuel cells, 2 = drill cold trap
  const d4Choice = viewStep >= 4 ? run.choices[3] : undefined; // 0 = crewed rover, 1 = recharge/service, 2 = teleop rover
  const d5Choice = viewStep >= 5 ? run.choices[4] : undefined; // 0 = finish EVA in storm, 1 = habitat, 2 = storm shelter

  const hasTallMast = d1Choice === 0;
  const hasDeckPanels = d1Choice === 1 || d1Choice === undefined;
  const hasRegolithBerm = d2Choice === 0;
  const hasIsruO2 = d2Choice === 1;
  const fuelCellsActive = viewStep === 3 && d3Choice === 1;
  const fuelCellsUsed = (viewStep >= 3 && d3Choice === 1) || run.flags.includes('fuelCellsSpent');

  const inShadowStep = viewStep === 3;
  const inRoverStep = viewStep === 4 || (viewStep === 3 && d3Choice === 2);
  const inStormStep = viewStep === 5;

  // Surface temperature from LRO Diviner profile at this step
  const surfaceTempK = inShadowStep ? 90 : viewStep === 4 ? 168 : 219;
  const surfaceTempC = surfaceTempK - 273;

  // Habitat health & lighting state
  const isAbortOrBlackout =
    stateAtStep.powerKwh <= 0 ||
    stateAtStep.lifeSupportPct <= 0 ||
    (stepRecord?.rulesTriggered.includes('blackout') ?? false) ||
    (run.outcome === 'abort' && stepIndex === run.choices.length);

  const isBrownout =
    !isAbortOrBlackout &&
    (stateAtStep.powerKwh < 20 || (stepRecord?.rulesTriggered.includes('brownout') ?? false));

  const habDomeFill = isAbortOrBlackout
    ? 'rgba(244, 63, 94, 0.22)'
    : isBrownout
      ? 'rgba(245, 158, 11, 0.22)'
      : 'rgba(56, 189, 248, 0.20)';

  const habDomeStroke = isAbortOrBlackout
    ? '#f43f5e'
    : isBrownout
      ? '#f59e0b'
      : '#38bdf8';

  const waterWallActive = inStormStep && (d5Choice === 2 || d5Choice === 1 || d5Choice === undefined);
  const exposedEvaInStorm = inStormStep && d5Choice === 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      {/* Top Status Overlay Bar inside the 2D Viewport */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800/90 bg-slate-900/90 px-3 py-1.5 text-[11px]">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 font-bold ${
              isBranch
                ? 'border border-dashed border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200'
                : 'bg-sky-500 text-slate-950'
            }`}
          >
            {runLabel} · {t('step')} {viewStep}/6
          </span>

          {/* Habitat thermal & electrical state badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${
              isAbortOrBlackout
                ? 'border-rose-500/60 bg-rose-500/20 text-rose-200'
                : isBrownout
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                  : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
            }`}
          >
            {isAbortOrBlackout ? (
              <>
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                {t('habAbort')}
              </>
            ) : isBrownout ? (
              <>
                <Zap className="h-3 w-3 text-amber-400" />
                {t('habBrownout')}
              </>
            ) : (
              <>
                <HeartPulse className="h-3 w-3 text-cyan-400" />
                {t('habNominal')}
              </>
            )}
          </span>
        </div>

        {/* Live LRO Diviner Surface Thermometer + Resource Mini-Readout */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
              inShadowStep
                ? 'border-cyan-400/60 bg-cyan-950/80 text-cyan-200'
                : 'border-slate-700 bg-slate-800/80 text-amber-200'
            }`}
          >
            <ThermometerSnowflake className="h-3 w-3" />
            {t('surfaceTempLabel')}: <strong>{surfaceTempK} K</strong> ({surfaceTempC}°C)
          </span>
          <span className="text-amber-300">⚡{stateAtStep.powerKwh} kWh</span>
          <span className="text-emerald-300">♥{stateAtStep.lifeSupportPct}%</span>
          <span className={stateAtStep.radiationMsv >= 50 ? 'font-bold text-rose-400' : 'text-rose-300'}>
            ☢{stateAtStep.radiationMsv} mSv
          </span>
        </div>
      </div>

      {/* Crisis Alert Banner when viewing Decision 3 (LRO Shadow) or Decision 5 (DONKI Storm) */}
      {inShadowStep && (
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 via-cyan-950/90 to-slate-900 px-3 py-1 text-center text-[11px] font-semibold text-cyan-200">
          <Snowflake className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
          <span>{t('crisisShadowBanner')}</span>
        </div>
      )}
      {inStormStep && (
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-950/90 via-orange-950/90 to-rose-950/90 px-3 py-1 text-center text-[11px] font-semibold text-rose-200">
          <Radiation className="h-3.5 w-3.5 shrink-0 animate-spin text-rose-300" />
          <span>{t('crisisStormBanner')}</span>
        </div>
      )}

      {/* Main 2D Cross-Section SVG of Shackleton Crater Rim */}
      <svg
        viewBox="0 0 900 340"
        className={`w-full select-none block ${compact ? 'h-56 sm:h-64' : 'h-64 sm:h-80'}`}
        role="img"
        aria-label={t('viewportTitle')}
      >
        <defs>
          {/* Deep Lunar Sky Gradient */}
          <linearGradient id={`sky-${runLabel}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={inStormStep ? '#2a0815' : '#020617'} />
            <stop offset="65%" stopColor={inStormStep ? '#1e0b16' : '#091024'} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* 1.5° Grazing Sunlight Beam Gradient */}
          <linearGradient id={`sunbeam-${runLabel}`} x1="0" y1="0.3" x2="0.85" y2="0.6">
            <stop offset="0%" stopColor="#fde047" stopOpacity={inShadowStep ? 0.08 : 0.42} />
            <stop offset="55%" stopColor="#f59e0b" stopOpacity={inShadowStep ? 0.03 : 0.16} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>

          {/* Shackleton Rim Regolith Slope Gradient */}
          <linearGradient id={`regolith-${runLabel}`} x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor={inShadowStep ? '#334155' : '#64748b'} />
            <stop offset="55%" stopColor={inShadowStep ? '#1e293b' : '#475569'} />
            <stop offset="80%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          {/* Permanently Shadowed Crater Cold-Trap Gradient */}
          <linearGradient id={`coldtrap-${runLabel}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#090e1a" />
            <stop offset="100%" stopColor="#020409" />
          </linearGradient>

          {/* Cyan Water-Wall Radiation Shield Dome Gradient */}
          <radialGradient id={`shield-${runLabel}`} cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.02" />
            <stop offset="75%" stopColor="#22d3ee" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* 1. STARRY LUNAR SKY */}
        <rect x="0" y="0" width="900" height="340" fill={`url(#sky-${runLabel})`} />
        {[
          [45, 28, 1.3],
          [110, 52, 1.0],
          [175, 22, 1.5],
          [240, 44, 1.1],
          [310, 18, 1.4],
          [390, 36, 1.2],
          [455, 25, 1.6],
          [520, 55, 1.0],
          [595, 20, 1.3],
          [660, 42, 1.5],
          [740, 26, 1.2],
          [810, 48, 1.4],
          [865, 19, 1.1],
          [690, 78, 1.2],
          [835, 85, 1.3],
        ].map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="#e2e8f0"
            opacity={i % 2 === 0 ? 0.85 : 0.45}
          />
        ))}

        {/* 2. EARTH ON THE HORIZON (No logos, pure procedural crescent blue marble) */}
        <g transform="translate(530, 66)">
          <circle cx="0" cy="0" r="18" fill="#0284c7" />
          <path
            d="M-8,-12 C-2,-10 4,-6 2,2 C0,8 -6,12 -11,8 C-14,3 -12,-7 -8,-12 Z"
            fill="#34d399"
            opacity="0.7"
          />
          <path
            d="M6,-8 C11,-4 13,4 8,10 C4,12 2,6 5,0 Z"
            fill="#34d399"
            opacity="0.65"
          />
          {/* Subtle atmospheric limb glow & shadow crescent */}
          <path d="M 6,-16 A 18,18 0 1,1 6,16 A 14,18 0 1,0 6,-16 Z" fill="#020617" opacity="0.65" />
          <circle cx="0" cy="0" r="18.5" fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.6" />
          <text x="0" y="30" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
            {t('earthHorizon')}
          </text>
        </g>

        {/* 3. LOW 1.5° GRAZING SUNLIGHT RAYS ON THE LEFT HORIZON */}
        <g>
          {/* Grazing Solar Disk */}
          <circle
            cx="18"
            cy={inShadowStep ? 148 : 118}
            r={inShadowStep ? 16 : 24}
            fill="#fde047"
            opacity={inShadowStep ? 0.25 : 0.9}
          />
          <circle
            cx="18"
            cy={inShadowStep ? 148 : 118}
            r={inShadowStep ? 26 : 38}
            fill="#f59e0b"
            opacity={inShadowStep ? 0.12 : 0.3}
          />

          {/* Grazing 1.5° Sunbeam Cone across the Shackleton Peak */}
          <polygon points="0,90 650,55 650,195 0,165" fill={`url(#sunbeam-${runLabel})`} />

          {/* Individual grazing rays */}
          {!inShadowStep && (
            <g stroke="#fde047" strokeWidth="1.2" strokeDasharray="8 6" opacity="0.45">
              <line x1="36" y1="108" x2="290" y2="96" />
              <line x1="36" y1="118" x2="460" y2="115" />
              <line x1="36" y1="128" x2="340" y2="138" />
            </g>
          )}

          {/* Horizon Ridge Blocking Ray during Decision 3 (72-hour LRO Shadow) */}
          {inShadowStep && (
            <g>
              {/* Distant horizon mountain ridge casting the 72h shadow */}
              <polygon points="0,122 68,104 118,165 0,175" fill="#090d16" stroke="#334155" strokeWidth="1" />
              {/* Only high grazing ray reaches the top of the 10m mast! */}
              {hasTallMast && (
                <line
                  x1="28"
                  y1="102"
                  x2="165"
                  y2="82"
                  stroke="#fde047"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.85"
                />
              )}
            </g>
          )}

          <text x="16" y="75" fill="#fde047" fontSize="10" fontWeight="600" fontFamily="monospace">
            ☀ {t('solarGrazingLabel')} ({inShadowStep ? '15%' : '100%'})
          </text>
        </g>

        {/* 4. SHACKLETON CRATER RIM & PERMANENTLY SHADOWED COLD-TRAP FLOOR */}
        {/* Deep Cold-Trap Crater Floor (Right side: x=560..900) */}
        <polygon
          points="520,185 630,275 900,285 900,340 520,340"
          fill={`url(#coldtrap-${runLabel})`}
        />

        {/* Subsurface Water-Ice Deposits glittering in the Cold Trap */}
        <g opacity="0.85">
          <polygon points="655,284 680,276 705,286 675,294" fill="#0284c7" opacity="0.45" />
          <polygon points="725,288 765,278 805,289 765,298" fill="#38bdf8" opacity="0.55" />
          <polygon points="815,286 855,279 882,289 845,296" fill="#7dd3fc" opacity="0.45" />
          <text x="765" y="315" textAnchor="middle" fill="#7dd3fc" fontSize="9.5" fontFamily="monospace">
            ❄ {t('shackletonCraterLabel')}
          </text>
        </g>

        {/* Main Illuminated Shackleton Crater Rim Crest & Bench (Left & Center: x=0..640) */}
        <path
          d="M 0,170 Q 95,148 165,146 L 245,168 L 495,172 L 555,192 L 645,278 L 900,285 L 900,340 L 0,340 Z"
          fill={`url(#regolith-${runLabel})`}
          stroke="#64748b"
          strokeWidth="1.5"
        />

        {/* Crater Rim Surface Craters & Boulders */}
        <ellipse cx="95" cy="188" rx="22" ry="5" fill="#1e293b" opacity="0.65" />
        <ellipse cx="290" cy="196" rx="18" ry="4" fill="#1e293b" opacity="0.6" />
        <ellipse cx="475" cy="192" rx="15" ry="3.5" fill="#1e293b" opacity="0.6" />

        {/* Frost overlay across the rim during Decision 3 72-Hour Shadow */}
        {inShadowStep && (
          <path
            d="M 0,170 Q 95,148 165,146 L 245,168 L 495,172 L 555,192"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="2.5"
            strokeDasharray="4 6"
            opacity="0.65"
          />
        )}

        {/* 5. SOLAR & POWER ZONE ON THE PEAK (x=135..235) */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectHotspot('solar')}
          role="button"
          tabIndex={0}
          aria-label="Hotspot 1: Solar Array Peak"
        >
          {/* Power Conduit from Solar Peak to Habitat */}
          <path
            d="M 168,148 L 235,174 L 325,174"
            fill="none"
            stroke={stateAtStep.powerKwh > 0 ? '#f59e0b' : '#475569'}
            strokeWidth="2.5"
            className={stateAtStep.powerKwh > 0 ? 'animate-conduit' : ''}
          />

          {hasTallMast ? (
            /* Decision 1 Choice A: 10 m Vertical Solar Mast on Rim Crest */
            <g>
              {/* Tripod base */}
              <polygon points="153,148 165,132 177,148" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
              {/* 10m Vertical Lattice Mast */}
              <line x1="165" y1="134" x2="165" y2="66" stroke="#e2e8f0" strokeWidth="3.5" />
              <line x1="161" y1="125" x2="169" y2="115" stroke="#94a3b8" strokeWidth="1" />
              <line x1="169" y1="115" x2="161" y2="105" stroke="#94a3b8" strokeWidth="1" />
              <line x1="161" y1="105" x2="169" y2="95" stroke="#94a3b8" strokeWidth="1" />
              {/* Vertically-oriented bifacial solar wings catching grazing sun */}
              <rect
                x="136"
                y="68"
                width="25"
                height="42"
                rx="2"
                fill={inShadowStep ? '#0284c7' : '#38bdf8'}
                stroke="#fde047"
                strokeWidth="1.5"
              />
              <rect
                x="169"
                y="68"
                width="25"
                height="42"
                rx="2"
                fill={inShadowStep ? '#0284c7' : '#38bdf8'}
                stroke="#fde047"
                strokeWidth="1.5"
              />
              {/* Solar cell grid lines */}
              <line x1="148" y1="68" x2="148" y2="110" stroke="#0f172a" strokeWidth="0.8" />
              <line x1="181" y1="68" x2="181" y2="110" stroke="#0f172a" strokeWidth="0.8" />
              {/* Beacon on top of 10m mast */}
              <circle cx="165" cy="62" r="4" fill="#fde047" className="animate-pulse-glow" />
              <text x="165" y="52" textAnchor="middle" fill="#fde047" fontSize="9" fontFamily="monospace">
                {t('solarMast10m')}
              </text>
            </g>
          ) : hasDeckPanels ? (
            /* Decision 1 Choice B (or initial): Low Deck Panels beside lander */
            <g>
              <rect
                x="130"
                y="136"
                width="36"
                height="10"
                rx="1.5"
                transform="rotate(-8 148 141)"
                fill={inShadowStep ? '#1e293b' : '#0284c7'}
                stroke={inShadowStep ? '#475569' : '#38bdf8'}
                strokeWidth="1.5"
              />
              <rect
                x="172"
                y="140"
                width="36"
                height="10"
                rx="1.5"
                transform="rotate(6 190 145)"
                fill={inShadowStep ? '#1e293b' : '#0284c7'}
                stroke={inShadowStep ? '#475569' : '#38bdf8'}
                strokeWidth="1.5"
              />
              <text x="168" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                {t('deckPanelsLow')}
              </text>
            </g>
          ) : (
            /* Decision 1 Choice C: Battery-Only Mode (Arrays Stowed) */
            <g>
              <rect x="148" y="134" width="34" height="14" rx="2" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="165" y="125" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace">
                {t('batteryOnlyMode')}
              </text>
            </g>
          )}

          {/* H2/O2 Backup Fuel Cells (Decision 3 Choice B) */}
          {(fuelCellsActive || fuelCellsUsed) && (
            <g transform="translate(222, 144)">
              <rect
                x="0"
                y="8"
                width="36"
                height="20"
                rx="4"
                fill={fuelCellsActive ? '#065f46' : '#1e293b'}
                stroke={fuelCellsActive ? '#34d399' : '#64748b'}
                strokeWidth="1.8"
              />
              <text x="18" y="21" textAnchor="middle" fill="#ecfdf5" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                H₂/O₂
              </text>
              {fuelCellsActive && (
                <>
                  {/* Animated green/cyan fuel-cell exhaust plumes */}
                  <circle cx="10" cy="2" r="4.5" fill="#34d399" className="animate-plume" />
                  <circle cx="26" cy="-1" r="5.5" fill="#6ee7b7" className="animate-plume" />
                  {/* Glowing green power conduit into the habitat */}
                  <line
                    x1="36"
                    y1="18"
                    x2="98"
                    y2="18"
                    stroke="#34d399"
                    strokeWidth="3.5"
                    className="animate-conduit"
                  />
                  <text x="18" y="-10" textAnchor="middle" fill="#34d399" fontSize="8.5" fontFamily="monospace">
                    {t('fuelCellActive')}
                  </text>
                </>
              )}
            </g>
          )}
        </g>

        {/* 6. HABITAT CUTAWAY DOME, CREW, HYDROPONICS & ECLSS (x=310..455) */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectHotspot('habitat')}
          role="button"
          tabIndex={0}
          aria-label="Hotspot 2: Pressurized Habitat & ECLSS Dome"
        >
          {/* Regolith Berm Overburden Shield (if Decision 2 Choice A `regolithBerm` was built) */}
          {hasRegolithBerm && (
            <path
              d="M 296,174 Q 380,90 464,174"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="12"
              strokeDasharray="10 3"
              opacity="0.85"
            />
          )}

          {/* Glowing Cyan Water-Wall Radiation Shield Dome (active in Storm / Shelter) */}
          {waterWallActive && (
            <path
              d="M 288,175 A 92,82 0 0,1 472,175 Z"
              fill={`url(#shield-${runLabel})`}
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeDasharray="8 4"
              className="animate-pulse-glow"
            />
          )}

          {/* Pressurized Cutaway Habitat Dome */}
          <path
            d="M 312,172 A 68,60 0 0,1 448,172 Z"
            fill={habDomeFill}
            stroke={habDomeStroke}
            strokeWidth="2.5"
            className={isAbortOrBlackout ? 'animate-emergency' : isBrownout ? 'animate-pulse-glow' : ''}
          />

          {/* Habitat Floor Platform & Airlock */}
          <rect x="306" y="168" width="148" height="10" rx="3" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
          {/* Airlock Door on Right */}
          <rect x="444" y="148" width="16" height="24" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />

          {/* Interior Overhead Light Bar */}
          <line
            x1="350"
            y1="122"
            x2="410"
            y2="122"
            stroke={isAbortOrBlackout ? '#f43f5e' : isBrownout ? '#f59e0b' : '#67e8f9'}
            strokeWidth="3.5"
            strokeLinecap="round"
            className={isAbortOrBlackout ? 'animate-emergency' : isBrownout ? 'animate-pulse-glow' : ''}
          />

          {/* Green Hydroponic Plant Racks (Left interior of dome) */}
          <g transform="translate(325, 138)">
            <rect x="0" y="0" width="24" height="28" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <line x1="2" y1="9" x2="22" y2="9" stroke="#334155" strokeWidth="1" />
            <line x1="2" y1="18" x2="22" y2="18" stroke="#334155" strokeWidth="1" />
            {/* Glowing green hydroponic leaves */}
            <circle cx="6" cy="6" r="2.5" fill={isAbortOrBlackout ? '#64748b' : '#22c55e'} />
            <circle cx="12" cy="5" r="2.8" fill={isAbortOrBlackout ? '#64748b' : '#4ade80'} />
            <circle cx="18" cy="6" r="2.5" fill={isAbortOrBlackout ? '#64748b' : '#22c55e'} />
            <circle cx="7" cy="15" r="2.5" fill={isAbortOrBlackout ? '#64748b' : '#4ade80'} />
            <circle cx="15" cy="15" r="2.5" fill={isAbortOrBlackout ? '#64748b' : '#22c55e'} />
          </g>

          {/* ECLSS Air/Water Recycler Loop (Right interior of dome) */}
          <g transform="translate(412, 138)">
            <rect x="0" y="0" width="22" height="28" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <circle cx="7" cy="10" r="4" fill="none" stroke="#38bdf8" strokeWidth="1.4" />
            <circle cx="15" cy="18" r="4" fill="none" stroke="#34d399" strokeWidth="1.4" />
            <text x="11" y="26" textAnchor="middle" fill="#7dd3fc" fontSize="6" fontFamily="monospace">
              98%H₂O
            </text>
          </g>

          {/* 2 Animated Junior Astronauts inside the Habitat Cutaway */}
          {/* Astronaut 1 */}
          <g className="animate-float" transform="translate(364, 140)">
            <circle cx="0" cy="0" r="6" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Visor */}
            <ellipse cx="1" cy="0" rx="3.5" ry="2.5" fill="#0284c7" />
            {/* Suit torso */}
            <rect x="-5" y="6" width="10" height="12" rx="3" fill="#e2e8f0" />
            <rect x="-3" y="8" width="6" height="5" rx="1" fill="#38bdf8" />
            {/* Legs */}
            <line x1="-3" y1="18" x2="-4" y2="26" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="3" y1="18" x2="4" y2="26" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Astronaut 2 (Inside habitat unless exposed on Storm EVA in D5-A) */}
          {!exposedEvaInStorm && (
            <g className="animate-float-delayed" transform="translate(392, 142)">
              <circle cx="0" cy="0" r="5.5" fill="#f8fafc" stroke="#34d399" strokeWidth="1.5" />
              <ellipse cx="-1" cy="0" rx="3.2" ry="2.2" fill="#0284c7" />
              <rect x="-4.5" y="5.5" width="9" height="11" rx="3" fill="#e2e8f0" />
              <rect x="-2.5" y="7.5" width="5" height="4.5" rx="1" fill="#34d399" />
              <line x1="-2.5" y1="16.5" x2="-3.5" y2="24" stroke="#cbd5e1" strokeWidth="2.3" strokeLinecap="round" />
              <line x1="2.5" y1="16.5" x2="3.5" y2="24" stroke="#cbd5e1" strokeWidth="2.3" strokeLinecap="round" />
            </g>
          )}

          {/* Frost crystals on habitat dome during blackout or deep shadow */}
          {(inShadowStep || isAbortOrBlackout) && (
            <g stroke="#a5f3fc" strokeWidth="1.2" opacity={isAbortOrBlackout ? 0.9 : 0.45}>
              <path d="M 332,130 L 340,138 M 340,130 L 332,138" />
              <path d="M 420,128 L 428,136 M 428,128 L 420,136" />
              {isAbortOrBlackout && <path d="M 375,118 L 385,128 M 385,118 L 375,128" />}
            </g>
          )}

          {/* ISRU Oxygen-from-Regolith Plant (if Decision 2 Choice B was chosen) */}
          {hasIsruO2 && (
            <g transform="translate(274, 148)">
              <rect x="0" y="4" width="26" height="18" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="13" cy="13" r="5" fill="#0284c7" />
              <text x="13" y="-2" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontFamily="monospace">
                {t('isruPlantActive')}
              </text>
            </g>
          )}
        </g>

        {/* 7. RADIATION STORM SHELTER HOTSPOT & DONKI SOLAR PROTON WAVES (Decision 5) */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectHotspot('shelter')}
          role="button"
          tabIndex={0}
          aria-label="Hotspot 4: Radiation Storm Shelter"
        >
          {inStormStep && (
            <g>
              {/* Intense red/orange DONKI SEP 205 pfu solar proton waves streaming across the sky */}
              {[
                [60, 18, 290, 108],
                [130, 12, 345, 96],
                [210, 14, 390, 94],
                [290, 16, 440, 105],
                [380, 18, 515, 130],
                [470, 22, 620, 155],
                [560, 24, 720, 170],
              ].map(([x1, y1, x2, y2], i) => (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={i % 2 === 0 ? '#f43f5e' : '#fb923c'}
                  strokeWidth="2.2"
                  className="animate-proton"
                />
              ))}

              {/* Deflection arcs where protons bounce off the Water-Wall / Regolith Shield Dome */}
              {waterWallActive && (
                <path
                  d="M 285,135 Q 380,68 475,135"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
              )}
            </g>
          )}

          {/* If astronaut stayed outside in EVA suit during D5 Storm (Choice A) */}
          {exposedEvaInStorm && (
            <g transform="translate(505, 156)" className="animate-float">
              <circle cx="0" cy="0" r="16" fill="rgba(244,63,94,0.28)" stroke="#f43f5e" strokeWidth="1.5" />
              <circle cx="0" cy="-4" r="5.5" fill="#f8fafc" stroke="#f43f5e" strokeWidth="1.5" />
              <rect x="-4.5" y="2" width="9" height="11" rx="2.5" fill="#e2e8f0" />
              <text x="0" y="-22" textAnchor="middle" fill="#fda4af" fontSize="9" fontWeight="bold" fontFamily="monospace">
                ⚠ EVA +36.8 mSv!
              </text>
            </g>
          )}

          {/* Shield Status Label above Habitat */}
          {(hasRegolithBerm || waterWallActive) && (
            <text x="380" y="88" textAnchor="middle" fill="#67e8f9" fontSize="9.5" fontWeight="600" fontFamily="monospace">
              🛡 {hasRegolithBerm ? t('regolithBermBuilt') : t('waterWallShield')}
            </text>
          )}
        </g>

        {/* 8. COLD-TRAP ICE ROVER & CORE DRILL (Right Crater Slope & Shadowed Floor: x=560..760) */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectHotspot('rover')}
          role="button"
          tabIndex={0}
          aria-label="Hotspot 3: Cold-Trap Ice Rover"
        >
          {/* Telemetry waves from habitat antenna to rover */}
          {inRoverStep && (
            <path
              d="M 455,142 Q 565,165 658,238"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              className="animate-conduit"
            />
          )}

          {/* Rover Positioned in the Cold-Trap Crater Floor (when D4 active or D3-C drilling) or on the Rim Slope */}
          <g
            transform={
              inRoverStep && d4Choice !== 1
                ? 'translate(655, 248) rotate(6)'
                : 'translate(535, 178) rotate(22)'
            }
          >
            {/* Rover Chassis */}
            <rect x="-26" y="-12" width="52" height="14" rx="4" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Rover Mast & Camera / Dish */}
            <line x1="12" y1="-12" x2="16" y2="-26" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="16" cy="-28" r="4" fill="#38bdf8" />
            {/* Astronaut riding rover if D4 Choice A (crewed traverse) */}
            {viewStep >= 4 && d4Choice === 0 && (
              <g transform="translate(-6, -22)">
                <circle cx="0" cy="0" r="4.5" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.2" />
                <rect x="-3.5" y="4.5" width="7" height="7" rx="2" fill="#cbd5e1" />
              </g>
            )}
            {/* 3 Woven-Mesh Lunar Wheels */}
            <circle cx="-16" cy="5" r="6.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="0" cy="5" r="6.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="16" cy="5" r="6.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />

            {/* Active Laser / Ice Core Drill Beam into Shackleton Cold Trap */}
            {inRoverStep && d4Choice !== 1 && (
              <g>
                <line
                  x1="24"
                  y1="-4"
                  x2="58"
                  y2="28"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  className="animate-pulse-glow"
                />
                <circle cx="58" cy="28" r="6" fill="#7dd3fc" className="animate-plume" />
                <text x="12" y="-36" textAnchor="middle" fill="#7dd3fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  ❄ H₂O ICE DRILL
                </text>
              </g>
            )}
          </g>
        </g>

        {/* 9. FOUR CLICKABLE ENGINEERING HOTSPOT NUMBERED PINS */}
        {(
          [
            { id: 'solar' as HotspotId, n: 1, x: 165, y: 102, color: '#f59e0b' },
            { id: 'habitat' as HotspotId, n: 2, x: 380, y: 152, color: '#10b981' },
            { id: 'rover' as HotspotId, n: 3, x: 675, y: 232, color: '#38bdf8' },
            { id: 'shelter' as HotspotId, n: 4, x: 380, y: 104, color: '#f43f5e' },
          ] as const
        ).map((pin) => {
          const isSelected = activeHotspot === pin.id;
          return (
            <g
              key={pin.id}
              transform={`translate(${pin.x}, ${pin.y})`}
              className="cursor-pointer"
              onClick={() => onSelectHotspot(pin.id)}
            >
              <circle
                cx="0"
                cy="0"
                r={isSelected ? 15 : 12}
                fill={pin.color}
                opacity="0.28"
                className="animate-pulse-glow"
              />
              <circle
                cx="0"
                cy="0"
                r="9.5"
                fill="#020617"
                stroke={pin.color}
                strokeWidth={isSelected ? '2.5' : '1.8'}
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pin.n}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface LunarOutpost2DProps {
  runA: SimulationResult;
  runB: SimulationResult | null;
  viewStep: number;
}

export default function LunarOutpost2D({ runA, runB, viewStep }: LunarOutpost2DProps) {
  const { t, tr } = useI18n();
  const [splitMode, setSplitMode] = useState<boolean>(false);
  const [activeHotspot, setActiveHotspot] = useState<HotspotId | null>(null);

  // Automatically enable Split Compare when Run B is created so learners immediately see the side-by-side comparison
  useEffect(() => {
    if (runB) {
      setSplitMode(true);
    } else {
      setSplitMode(false);
    }
  }, [runB !== null]);

  function handleSelectHotspot(id: HotspotId) {
    soundFX.play('hotspot');
    setActiveHotspot((prev) => (prev === id ? null : id));
  }

  const showSplit = splitMode && runB !== null;
  const hotspotData = activeHotspot ? HOTSPOTS[activeHotspot] : null;

  return (
    <section className="panel space-y-2.5 p-3.5">
      {/* Viewport Header + Single View | Split Compare Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sky-300">
            <Compass className="h-4 w-4 text-sky-400" />
            {t('viewportTitle')}
          </h2>
          <p className="text-xs text-slate-400">{t('viewportSubtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {runB && (
            <div className="inline-flex items-center rounded-lg border border-fuchsia-500/40 bg-slate-900/90 p-0.5">
              <button
                onClick={() => {
                  soundFX.play('StepNav');
                  setSplitMode(false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  !splitMode ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {t('singleView')}
              </button>
              <button
                onClick={() => {
                  soundFX.play('StepNav');
                  setSplitMode(true);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  splitMode ? 'bg-fuchsia-500 text-slate-950' : 'text-fuchsia-200 hover:text-white'
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" />
                {t('splitCompare')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2D Canvas Area: Single View OR Side-by-Side Split Compare (Run A vs Run B) */}
      {showSplit && runB ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <OutpostSceneSVG
            run={runA}
            viewStep={viewStep}
            runLabel={t('runA')}
            compact
            activeHotspot={activeHotspot}
            onSelectHotspot={handleSelectHotspot}
          />
          <OutpostSceneSVG
            run={runB}
            viewStep={viewStep}
            runLabel={t('runB')}
            isBranch
            compact
            activeHotspot={activeHotspot}
            onSelectHotspot={handleSelectHotspot}
          />
        </div>
      ) : (
        <OutpostSceneSVG
          run={runB ?? runA}
          viewStep={viewStep}
          runLabel={runB ? t('runB') : t('runA')}
          isBranch={Boolean(runB)}
          activeHotspot={activeHotspot}
          onSelectHotspot={handleSelectHotspot}
        />
      )}

      {/* Quick Hotspot Selector Strip for Ages 7-12 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px] font-medium text-slate-400">{t('hotspotPrompt')}</span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.values(HOTSPOTS) as HotspotContent[]).map((h) => {
            const isActive = activeHotspot === h.id;
            const Icon =
              h.id === 'solar'
                ? Sun
                : h.id === 'habitat'
                  ? HeartPulse
                  : h.id === 'rover'
                    ? BatteryCharging
                    : ShieldAlert;
            return (
              <button
                key={h.id}
                onClick={() => handleSelectHotspot(h.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? h.accentColor
                    : 'border-slate-700/80 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tr(h.badge)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Hotspot Educational Pop-Up Card */}
      {hotspotData && (
        <div className={`rounded-xl border p-3.5 transition ${hotspotData.accentColor}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                <Sparkles className="h-3.5 w-3.5" />
                {tr(hotspotData.badge)}
              </span>
              <h3 className="mt-0.5 text-base font-semibold text-white">{tr(hotspotData.title)}</h3>
            </div>
            <button
              onClick={() => setActiveHotspot(null)}
              className="rounded-lg p-1 text-slate-300 hover:bg-slate-800/60 hover:text-white"
              aria-label={t('close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 grid gap-2.5 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800/90 bg-slate-950/75 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                <Flame className="h-3.5 w-3.5" />
                {t('howItWorksMoon')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-200">{tr(hotspotData.howItWorks)}</p>
            </div>

            <div className="rounded-lg border border-slate-800/90 bg-slate-950/75 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                <Compass className="h-3.5 w-3.5" />
                {t('realNasaMeasurement')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-200">{tr(hotspotData.nasaMeasurement)}</p>
            </div>

            <div className="rounded-lg border border-slate-800/90 bg-slate-950/75 p-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5" />
                {t('whyItMattersSurvival')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-200">{tr(hotspotData.whyItMatters)}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
