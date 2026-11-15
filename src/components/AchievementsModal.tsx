import {
  CheckCircle2,
  Lock,
  Orbit,
  ShieldCheck,
  Snowflake,
  Sparkles,
  SunDim,
  Trophy,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import type { Bilingual } from '../types';

export interface Achievement {
  id: string;
  icon: typeof Trophy;
  title: Bilingual;
  description: Bilingual;
  hint: Bilingual;
  category: 'engineering' | 'science' | 'temporal';
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'solar_vanguard',
    icon: SunDim,
    title: { en: 'Solar Vanguard', az: 'Günəş Qabaqcılı' },
    description: {
      en: 'Selected a 10 m mast; the training scenario assumes 40% nominal output in shadow before pointing losses.',
      az: '10 m dirək seçdiniz; təlimdə kölgə zamanı istiqamət itkilərindən əvvəl nominal gücün 40%-i fərz edilir.',
    },
    hint: {
      en: 'Deploy the 10 m VSAT solar mast at Decision 1.',
      az: '1-ci Qərarda 10 m-lik şaquli günəş dirəyini seçin.',
    },
    category: 'engineering',
  },
  {
    id: 'ice_miner',
    icon: Snowflake,
    title: { en: 'Cryo Core Harvester', az: 'Krio Buz Kəşfiyyatçısı' },
    description: {
      en: 'Traversed into the 90 K (−183 °C) cold-trap basin with the Lunar Car and mined H₂O crystalline deposits.',
      az: 'Ay Maşını ilə 90 K (−183 °C) soyuq tələ hövzəsinə enib H₂O kristallarını qazdınız.',
    },
    hint: {
      en: 'Drive the Pressurized Lunar Car [V] into Sector 04 and mine ice crystals [Space].',
      az: 'Ay Maşını [V] ilə 4-cü Sektora sürün və buz kristalları qazın [Space].',
    },
    category: 'science',
  },
  {
    id: 'storm_sentinel',
    icon: ShieldCheck,
    title: { en: 'Storm Sentinel', az: 'Fırtına Qalxanı' },
    description: {
      en: 'Used the berm in the fictional lunar storm (assumed 6% storm-dose transmission).',
      az: 'Uydurma Ay fırtınasında reqolit səddindən istifadə etdiniz (fərz edilən 6% doza keçiriciliyi).',
    },
    hint: {
      en: 'Build the Regolith Berm at Decision 2 and shelter in the bunker at Decision 5.',
      az: '2-ci qərarda reqolit səddi tikin və 5-ci qərarda sığınacağa keçin.',
    },
    category: 'engineering',
  },
  {
    id: 'sample_hunter',
    icon: Sparkles,
    title: { en: 'Shackleton Geologist', az: 'Şeklton Geoloqu' },
    description: {
      en: 'Surveyed the lunar regolith and discovered fictional science sample nodes across the polar plateau.',
      az: 'Qütb yaylasında uydurma elmi sahə nümunələrini aşkar etdiniz.',
    },
    hint: {
      en: 'Explore the map on foot or by rover to discover lunar rock samples.',
      az: 'Piyada və ya maşınla xəritəni araşdıraraq elmi nümunələr toplayın.',
    },
    category: 'science',
  },
  {
    id: 'temporal_pilot',
    icon: Orbit,
    title: { en: 'Temporal Physicist', az: 'Zaman Fizikçisi' },
    description: {
      en: 'Mastered the deterministic time-machine to rewind past decisions and compare divergent causal timelines.',
      az: 'Deterministik zaman maşınından istifadə edərək keçmiş qərarları geri sardınız və paralel zaman xətlərini müqayisə etdiniz.',
    },
    hint: {
      en: 'Open Rewind & Compare [R] and branch any past decision to spawn Run B.',
      az: 'Geri Sar və Müqayisə [R] pəncərəsini açın və qərarlardan birini dəyişərək B gedişi yaradın.',
    },
    category: 'temporal',
  },
  {
    id: 'mars_pioneer',
    icon: SunDim,
    title: { en: 'Jezero Dust Pioneer', az: 'Yezero Toz Pioneri' },
    description: {
      en: 'Survived a 3-Sol Mars global dust storm and 14-minute Earth radio delay using autonomous MOXIE & power triage.',
      az: 'Avtonom MOXIE və enerji qərarları ilə 3-Solluq Mars toz fırtınasından və 14 dəqiqəlik rabitə gecikməsindən sağ çıxdınız.',
    },
    hint: {
      en: 'Complete Bonus Mission 2: Mars Jezero Dust Storm from the Mission Control bar.',
      az: 'İdarəetmə panelindən Bonus Missiya 2: Mars Yezero Toz Fırtınasını uğurla tamamlayın.',
    },
    category: 'science',
  },
  {
    id: 'master_commander',
    icon: Trophy,
    title: { en: 'Artemis Commander', az: 'Artemis Baş Komandiri' },
    description: {
      en: 'Concluded the 216-hour polar surface expedition with certified Mission Success and score ≥ 75 points.',
      az: '216 saatlıq qütb səth ekspedisiyasını təsdiqlənmiş Missiya Uğuru və ≥ 75 xalla başa vurdunuz.',
    },
    hint: {
      en: 'Balance power, life support, radiation, and science to achieve Mission Success.',
      az: 'Missiya Uğuru qazanmaq üçün enerji, həyat təminatı, radiasiya və elmi tarazlaşdırın.',
    },
    category: 'engineering',
  },
];

interface AchievementsModalProps {
  unlockedIds: string[];
  onClose: () => void;
}

export function AchievementsModal({ unlockedIds, onClose }: AchievementsModalProps) {
  const { lang, tr } = useI18n();
  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const progressPct = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04101a]/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Mission Achievements & Honors"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-amber-400/50 bg-[#0e1d26] p-6 shadow-2xl scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
              <Trophy size={22} />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                ARTEMIS MISSION HONORS
              </span>
              <h2 className="text-xl font-bold text-white">
                {lang === 'az' ? 'Missiya Nailiyyətləri və Medallar' : 'Expedition Honors & Badges'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-mono text-xs font-bold text-amber-200">
              {unlockedCount} / {totalCount} ({progressPct}%)
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Achievements Modal"
              className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Badges Grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedIds.includes(ach.id);
            const Icon = ach.icon;

            return (
              <div
                key={ach.id}
                className={`relative flex items-start gap-3.5 rounded-xl border p-3.5 transition ${
                  isUnlocked
                    ? 'border-amber-400/50 bg-[#142630] shadow-[0_0_15px_rgba(245,158,11,0.12)]'
                    : 'border-white/5 bg-white/[0.02] opacity-60'
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                    isUnlocked
                      ? 'border-amber-400/60 bg-amber-400/20 text-amber-300'
                      : 'border-slate-700 bg-slate-800 text-slate-500'
                  }`}
                >
                  {isUnlocked ? <Icon size={20} /> : <Lock size={18} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3
                      className={`text-sm font-bold ${
                        isUnlocked ? 'text-amber-100' : 'text-slate-400'
                      }`}
                    >
                      {tr(ach.title)}
                    </h3>
                    {isUnlocked && (
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {isUnlocked ? tr(ach.description) : tr(ach.hint)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const { lang, tr } = useI18n();
  const Icon = achievement.icon;

  return (
    <aside
      className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border-2 border-amber-400 bg-[#0e1e28]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md animate-slide-down"
      role="status"
      aria-live="polite"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-400 bg-amber-400/20 text-amber-300">
        <Icon size={18} />
      </div>
      <div className="min-w-0 pr-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">
          🏆 {lang === 'az' ? 'YENİ NAİLİYYƏT QAZANILDI!' : 'ACHIEVEMENT UNLOCKED!'}
        </span>
        <h4 className="text-xs font-bold text-white">{tr(achievement.title)}</h4>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 hover:text-white p-1"
        aria-label="Dismiss Achievement Toast"
      >
        <X size={14} />
      </button>
    </aside>
  );
}
