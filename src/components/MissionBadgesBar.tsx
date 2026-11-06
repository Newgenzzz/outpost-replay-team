import {
  Award,
  CheckCircle2,
  Compass,
  Flame,
  GitBranch,
  GraduationCap,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sun,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { SimulationResult } from '../engine/simulation';
import type { Bilingual } from '../types';

interface JudgePillar {
  id: string;
  pillar: Bilingual;
  headline: Bilingual;
  evidence: Bilingual;
}

const JUDGE_PILLARS: JudgePillar[] = [
  {
    id: 'impact',
    pillar: { en: '1. Impact', az: '1. Təsir (Impact)' },
    headline: {
      en: 'Bilingual EN | AZ K–12 & University STEM Trainer',
      az: 'İkidilli EN | AZ Məktəb və Universitet STEM Trenajoru',
    },
    evidence: {
      en: '100% offline client-side web app with instant English/Azerbaijani switching—deployable in any classroom with zero logins or cloud dependencies.',
      az: '100% oflayn müştəri-tərəfli veb tətbiq və ani İngilis/Azərbaycan dili keçidi—heç bir qeydiyyat olmadan istənilən sinifdə işləyir.',
    },
  },
  {
    id: 'creativity',
    pillar: { en: '2. Creativity', az: '2. Yaradıcılıq (Creativity)' },
    headline: {
      en: '2D Top-Down RPG + Rewind & Branch Ghost Engine',
      az: '2D Yuxarıdan-Baxış RPG + Geri Sarma və Kölgə Mühərriki',
    },
    evidence: {
      en: 'Combines a playable Phaser 2D RPG (drivable VIPER-Jr Rover [V], 6 collectible field samples, radar minimap) with causal A/B timeline branching.',
      az: 'İdarə olunan Phaser 2D RPG dünyasını (VIPER-Jr Roveri [V], 6 toplanan nümunə, radar minimap) A/B zaman budaqlanması ilə birləşdirir.',
    },
  },
  {
    id: 'validity',
    pillar: { en: '3. Validity', az: '3. Elmi Dəqiqlik (Validity)' },
    headline: {
      en: 'Cited NASA LRO LOLA/Diviner & DONKI Physics',
      az: 'İstinadlı NASA LRO LOLA/Diviner və DONKI Fizikası',
    },
    evidence: {
      en: 'Deterministic equations driven by Mazarico et al. (2011) 72-hr shadow, Paige et al. (2010) 90 K cold trap, and May 2024 AR 13664 205 pfu SEP data.',
      az: 'Mazarico və b. (2011) 72 saatlıq kölgə, Paige və b. (2010) 90 K soyuq tələ və May 2024 AR 13664 205 pfu proton fırtınası ilə hesablanır.',
    },
  },
  {
    id: 'relevance',
    pillar: { en: '4. Relevance', az: '4. Uyğunluq (Relevance)' },
    headline: {
      en: 'Shackleton Crater Rim (89.67°S, 129.78°E) Artemis Ops',
      az: 'Şeklton Krateri Kənarı (89.67°C, 129.78°Ş) Artemis Bazası',
    },
    evidence: {
      en: 'Trains junior astronauts on real polar challenges: 1.5° grazing sun, 10 m VSAT masts, H₂/O₂ fuel cells, ISRU ice mining, and water-wall storm shelters.',
      az: 'Gənc astronavtları real qütb sınaqlarına hazırlayır: 1.5° üfüqi günəş, 10 m dirəklər, H₂/O₂ yanacaq elementləri, buz qazma və su divarlı sığınacaq.',
    },
  },
  {
    id: 'presentation',
    pillar: { en: '5. Storytelling', az: '5. Təqdimat (Storytelling)' },
    headline: {
      en: 'Crew Radio Comms, Web Audio Synth & 1-Click Demo',
      az: 'Ekipaj Radio Rabitəsi, Web Audio Səs və 1-Klik Demo',
    },
    evidence: {
      en: 'Features tactical advice from Cmdr. Azer & Eng. Leyla, procedural Web Audio sound effects, and a 1-click Abort-to-Success Rewind showcase.',
      az: 'Komandir Azər və Mühəndis Leyladan taktiki radio məsləhətlər, Web Audio səs effektləri və 1-kliklə Uğura Geri Sarma nümayişi.',
    },
  },
];

interface BadgeDef {
  id: string;
  icon: LucideIcon;
  title: Bilingual;
  description: Bilingual;
  colorClass: string;
  check: (run: SimulationResult, otherRun: SimulationResult | null, isBranch: boolean) => boolean;
}

const BADGES: BadgeDef[] = [
  {
    id: 'shadowSurvivor',
    icon: Snowflake,
    title: { en: 'Shadow Survivor', az: 'Kölgədən Sağ Çıxan' },
    description: {
      en: 'Crossed the 72-hour LRO horizon shadow (90 K) on Decision 3 with ≥ 20 kWh reserve (zero brownout).',
      az: '3-cü qərardakı 72 saatlıq LRO üfüq kölgəsini (90 K) ≥ 20 kVt·s enerji ehtiyatı ilə (kəsilmə olmadan) keçdi.',
    },
    colorClass: 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200',
    check: (run) => {
      const s3 = run.steps[2];
      return Boolean(s3 && s3.after.powerKwh >= 20 && !s3.rulesTriggered.includes('brownout'));
    },
  },
  {
    id: 'stormShield',
    icon: ShieldCheck,
    title: { en: 'Storm Shield Architect', az: 'Fırtına Qalxanı Memarı' },
    description: {
      en: 'Deflected the May 2024 DONKI 205 pfu solar proton storm on Decision 5 using a storm shelter or regolith berm (< 50 mSv).',
      az: '5-ci qərarda 2024 May DONKI 205 pfu Günəş proton fırtınasından sığınacaq və ya reqolit səddi ilə qorundu (< 50 mSv).',
    },
    colorClass: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
    check: (run) => {
      const s5 = run.steps[4];
      return Boolean(s5 && (s5.choiceIndex === 2 || run.flags.includes('regolithBerm')) && s5.after.radiationMsv < 50);
    },
  },
  {
    id: 'iceProspector',
    icon: Compass,
    title: { en: 'Ice Prospector', az: 'Buz Kəşfiyyatçısı' },
    description: {
      en: 'Sampled water ice in the permanently shadowed Shackleton crater floor (Decision 3 drill or Decision 4 rover).',
      az: 'Daimi kölgəli Şeklton kraterinin dibindən su buzu nümunəsi götürdü (Qərar 3 qazma və ya Qərar 4 rover).',
    },
    colorClass: 'border-sky-400/50 bg-sky-500/15 text-sky-200',
    check: (run) => {
      const d3 = run.choices[2];
      const d4 = run.choices[3];
      return d3 === 2 || d4 === 0 || d4 === 2;
    },
  },
  {
    id: 'solarPioneer',
    icon: Sun,
    title: { en: 'Peak Solar Pioneer', az: 'Günəş Zirvəsi Pioneri' },
    description: {
      en: 'Raised the 10 m vertical solar mast on Shackleton Rim Crest (Decision 1A) to capture 1.5° grazing sunlight.',
      az: '1.5° üfüqi günəş işığını tutmaq üçün Şeklton zirvəsində 10 m-lik şaquli günəş dirəyi qurdu (Qərar 1A).',
    },
    colorClass: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
    check: (run) => run.flags.includes('tallMast'),
  },
  {
    id: 'rewindMaster',
    icon: GitBranch,
    title: { en: 'Rewind Master', az: 'Zaman Mühəndisi' },
    description: {
      en: 'Used Rewind & Branch (Run B) to fix a past flaw and outscore Run A.',
      az: 'Keçmiş qərarı dəyişmək və A Gedişindən daha yüksək nəticə toplamaq üçün Geri Sar və Budaqlan (B Gedişi) işlətdi.',
    },
    colorClass: 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200',
    check: (run, otherRun, isBranch) => {
      if (!isBranch || !otherRun) return false;
      return (run.score ?? 0) > (otherRun.score ?? 0);
    },
  },
  {
    id: 'honorGraduate',
    icon: GraduationCap,
    title: { en: 'Shackleton Honor Commander', az: 'Şeklton Fəxri Komandiri' },
    description: {
      en: 'Completed all 6 decisions with Mission Success and ≥ 50 Science Points.',
      az: 'Bütün 6 qərarı Missiya Uğuru və ≥ 50 Elm Xalı ilə tamamladı.',
    },
    colorClass: 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200',
    check: (run) => run.outcome === 'success' && run.final.sciencePoints >= 50,
  },
];

interface MissionBadgesBarProps {
  runA: SimulationResult;
  runB: SimulationResult | null;
  viewStep: number;
  onJumpToTourStep: (step: number) => void;
  onLoadSplitDemo: () => void;
}

export default function MissionBadgesBar({
  runA,
  runB,
  viewStep,
  onJumpToTourStep,
  onLoadSplitDemo,
}: MissionBadgesBarProps) {
  const { t, tr } = useI18n();

  return (
    <section className="panel space-y-2.5 p-3">
      {/* Top Row: Title + Judge / Classroom Quick-Tour Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {t('badgesAndTourTitle')}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">{t('tourJumpLabel')}</span>
          <button
            onClick={() => onJumpToTourStep(3)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
              viewStep === 3
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-500/50 hover:text-white'
            }`}
          >
            <Snowflake className="h-3 w-3 text-cyan-300" />
            {t('tourD3Shadow')}
          </button>

          <button
            onClick={() => onJumpToTourStep(4)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
              viewStep === 4
                ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-sky-500/50 hover:text-white'
            }`}
          >
            <Compass className="h-3 w-3 text-sky-300" />
            {t('tourD4Rover')}
          </button>

          <button
            onClick={() => onJumpToTourStep(5)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
              viewStep === 5
                ? 'border-rose-400 bg-rose-500/20 text-rose-200'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-rose-500/50 hover:text-white'
            }`}
          >
            <Zap className="h-3 w-3 text-rose-300" />
            {t('tourD5Storm')}
          </button>

          <button
            onClick={onLoadSplitDemo}
            className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-500/50 bg-fuchsia-500/15 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-200 hover:bg-fuchsia-500/25"
          >
            <Flame className="h-3 w-3 text-fuchsia-300" />
            {t('tourSplitDemo')}
          </button>
        </div>
      </div>

      {/* Bottom Row: 6 Gamified Engineering Badges */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {BADGES.map((b) => {
          const earnedA = b.check(runA, runB, false);
          const earnedB = runB ? b.check(runB, runA, true) : false;
          const unlocked = earnedA || earnedB;
          const Icon = b.icon;

          return (
            <div
              key={b.id}
              title={tr(b.description)}
              className={`flex flex-col justify-between rounded-xl border p-2 transition ${
                unlocked
                  ? b.colorClass
                  : 'border-slate-800/80 bg-slate-950/40 text-slate-500 opacity-65'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">{tr(b.title)}</span>
                </div>
              </div>

              <p className="mt-1 line-clamp-2 text-[10px] leading-snug opacity-85">
                {tr(b.description)}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-1 pt-0.5">
                {earnedA && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-900">
                    {t('runA')} ✓
                  </span>
                )}
                {earnedB && (
                  <span className="rounded border border-dashed border-fuchsia-300 bg-fuchsia-500/20 px-1.5 py-0.2 text-[9px] font-bold text-fuchsia-100">
                    {t('runB')} ✓
                  </span>
                )}
                {!unlocked && (
                  <span className="text-[9px] italic text-slate-500">{t('lockedBadge')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Space Apps 5-Pillar Judge Audit Showcase */}
      <div className="mt-3 rounded-xl border border-sky-500/30 bg-slate-950/75 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
              {tr({
                en: 'Space Apps Global Judging Criteria — 5-Pillar Engineering Scorecard',
                az: 'Space Apps Qlobal Münsiflər Meyarları — 5 Sütunlu Mühəndislik Cədvəli',
              })}
            </h3>
          </div>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            100% STATIC · ZERO LOGOS · EN | AZ
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {JUDGE_PILLARS.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/90 p-2.5"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] font-bold uppercase text-amber-300">
                    {tr(p.pillar)}
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <p className="mt-1 text-xs font-bold leading-snug text-white">{tr(p.headline)}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-300">{tr(p.evidence)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
