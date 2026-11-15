import { useEffect, useState } from 'react';
import {
  Award,
  Compass,
  Database,
  ExternalLink,
  Sparkles,
  X,
} from 'lucide-react';
import { FIELD_SAMPLES, type FieldSampleNode } from '../game/world';
import { useI18n } from '../i18n/LanguageContext';
import { soundFX } from '../utils/soundEffects';

interface SampleDiscoveryModalProps {
  sampleIdx: number | null;
  collectedSamples: boolean[];
  onSelectSample: (idx: number) => void;
  onClose: () => void;
  onRouteToSample: (idx: number) => void;
  onOpenScience: () => void;
}

export function SampleDiscoveryModal({
  sampleIdx,
  collectedSamples,
  onSelectSample,
  onClose,
  onRouteToSample,
  onOpenScience,
}: SampleDiscoveryModalProps) {
  const { lang } = useI18n();

  useEffect(() => {
    soundFX.play('hotspot');
  }, [sampleIdx]);

  const activeIdx =
    sampleIdx !== null
      ? sampleIdx
      : collectedSamples.findIndex(Boolean) >= 0
        ? collectedSamples.findIndex(Boolean)
        : 0;
  const activeSample: FieldSampleNode = FIELD_SAMPLES[activeIdx] ?? FIELD_SAMPLES[0];
  const isCollected = collectedSamples[activeIdx] ?? false;
  const collectedCount = collectedSamples.filter(Boolean).length;
  const totalCount = FIELD_SAMPLES.length;
  const totalScienceBonus = FIELD_SAMPLES.reduce(
    (sum, sample, index) => sum + (collectedSamples[index] ? sample.scienceBonus : 0),
    0,
  );
  const elevation = {
    high_ridge: { en: 'Upper ridge', az: 'Yuxarı silsilə' },
    base_plateau: { en: 'Base plateau', az: 'Baza platosu' },
    sunken_crater: { en: 'Crater basin', az: 'Krater hövzəsi' },
  }[activeSample.elevation][lang];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04101a]/85 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'az' ? 'Ay sahə tədqiqatı kataloqu' : 'Lunar field science catalog'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-amber-400/50 bg-[#0e1d26] p-6 shadow-2xl scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-amber-400/50 bg-amber-500/20 text-2xl shadow-inner">
              {activeSample.icon}
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                {lang === 'az' ? 'SAHƏ TƏLİM NÜMUNƏSİ' : 'FIELD TRAINING SPECIMEN'}
              </span>
              <h2 className="text-xl font-bold text-white">
                {activeSample.name[lang]}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={lang === 'az' ? 'Nümunə kataloqunu bağla' : 'Close sample catalog'}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* 6 Sample Specimen Selector Bar */}
        <div className="my-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {lang === 'az' ? 'Ekspedisiya Toplusu:' : 'Expedition Catalog:'}
            </span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {collectedCount}/{totalCount} {lang === 'az' ? 'toplanıb' : 'collected'} · +{totalScienceBonus} {lang === 'az' ? 'xal' : 'points'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {FIELD_SAMPLES.map((s, idx) => {
              const collected = collectedSamples[idx];
              const isSelected = idx === activeIdx;
              const status = lang === 'az' ? (collected ? 'Toplanıb' : 'Tapılmayıb') : (collected ? 'Collected' : 'Undiscovered');
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSample(idx)}
                  title={`${s.name[lang]} (${status})`}
                  aria-label={`${s.name[lang]} (${status})`}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/25 text-amber-200 shadow-sm'
                      : collected
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="hidden sm:inline">#{idx + 1}</span>
                  {collected && <span className="text-[10px] text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reward Status Banner */}
        <div
          className={`mb-4 flex items-center justify-between rounded-xl border p-3 ${
            isCollected
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
              : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Award size={18} className={isCollected ? 'text-emerald-400' : 'text-amber-400'} />
            <div>
              <div className="text-xs font-bold">
                {isCollected
                  ? lang === 'az'
                    ? '✓ Nümunə qeydə alınıb'
                    : '✓ Specimen logged'
                  : lang === 'az'
                    ? 'Sahədə Aşkar Edilməyib · Xəritəni araşdırın'
                    : 'Undiscovered in Field · Explore coordinates on foot or by rover'}
              </div>
              <div className="text-[11px] opacity-80">
                {activeSample.locationName[lang]}
              </div>
            </div>
          </div>
          <span className="rounded-md border border-current/30 px-2 py-0.5 font-mono text-[11px] font-bold uppercase">
            {isCollected
              ? lang === 'az' ? `+${activeSample.scienceBonus} xal qazanıldı` : `Earned +${activeSample.scienceBonus}`
              : lang === 'az' ? `Topladıqda +${activeSample.scienceBonus} xal` : `+${activeSample.scienceBonus} when collected`}
          </span>
        </div>

        {activeSample.id === 'sample_lola' && <RidgeInvestigation collected={isCollected}
          onRoute={() => onRouteToSample(activeIdx)} onOpenScience={onOpenScience} />}

        {/* Core Geological & Science Dossier */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Scientific Identification */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
              <Compass size={14} />
              <span>{lang === 'az' ? 'Sahə nümunəsi' : 'Field specimen'}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {activeSample.description[lang]}
            </p>
            <div className="space-y-1.5 border-t border-white/10 pt-2 text-xs">
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span className="text-slate-400">{lang === 'az' ? 'Elmi istinad' : 'Science reference'}</span>
                <span className="text-right font-mono text-amber-300">{activeSample.instrument[lang]}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">{lang === 'az' ? 'Xəritə koordinatları' : 'Game map coordinates'}</span>
                <span className="font-mono text-sky-300">X: {activeSample.x} · Y: {activeSample.y}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">{lang === 'az' ? 'Relyef' : 'Terrain'}</span>
                <span className="font-mono text-emerald-300">{elevation}</span>
              </div>
            </div>
          </div>

          {/* NASA Planetary Mission Context */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Database size={14} />
              <span>{lang === 'az' ? 'NASA araşdırması' : 'NASA research'}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-200">
              {activeSample.nasaContext[lang]}
            </p>
            <a className="inline-flex items-center gap-2 rounded border border-sky-400/20 px-2.5 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-950"
              href={activeSample.sourceUrl} target="_blank" rel="noreferrer">
              {lang === 'az' ? 'NASA mənbəyini aç' : 'Open NASA source'}
              <ExternalLink aria-hidden="true" size={12} />
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="text-xs text-slate-400">
            {lang === 'az'
              ? 'Xəritədəki nümunələr təlim üçün modelləşdirilib.'
              : 'Specimens on this map are simulated for training.'}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-md transition hover:bg-amber-300"
          >
            <span>{lang === 'az' ? 'Ekspedisiyaya Davam Et' : 'Continue Expedition'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RidgeInvestigation({ collected, onRoute, onOpenScience }: {
  collected: boolean; onRoute: () => void; onOpenScience: () => void;
}) {
  const { lang } = useI18n();
  const az = lang === 'az';
  const [answer, setAnswer] = useState<'terrain' | 'average' | null>(null);
  return (
    <section className="mb-4 space-y-2 rounded-xl border border-sky-200/30 bg-sky-950/30 p-3 text-sm text-slate-200">
      <h3 className="font-semibold text-sky-100">{az ? 'Silsilə araşdırması · İşıq üçün yer seçin' : 'Ridge investigation · Find a place for solar power'}</h3>
      <p>{collected
        ? az ? 'Nişan qeydə alındı. Hündürlük və yaxınlıqdakı maneələr panelin Günəşi görməsinə təsir edir.' : 'Marker logged. Height and nearby obstructions affect whether a panel can see the Sun.'
        : az ? 'Günəşli silsiləyə gedin, qızılı altimetriya nişanını tapın və E düyməsi ilə qeydə alın.' : 'Follow the route up to the sunlit ridge. Find the gold altimetry marker and press E to log it.'}</p>
      {!collected ? <button type="button" onClick={onRoute} className="rounded-lg bg-sky-200 px-3 py-2 font-semibold text-slate-950">
        {az ? 'Silsilə nişanına get' : 'Go to the ridge marker'}
      </button> : <>
        <p className="font-medium text-white">{az ? 'Kölgənin panelə çatıb-çatmadığını anlamaq üçün nəyi yoxlayardınız?' : 'What would you check to understand whether a panel falls into shadow?'}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={answer === 'terrain'} onClick={() => setAnswer('terrain')} className="rounded border border-sky-300/40 px-2.5 py-2 hover:bg-sky-700/20">{az ? 'Hündürlük və yerli üfüq' : 'Height and the local horizon'}</button>
          <button type="button" aria-pressed={answer === 'average'} onClick={() => setAnswer('average')} className="rounded border border-sky-300/40 px-2.5 py-2 hover:bg-sky-700/20">{az ? 'Yalnız orta işıqlanma' : 'Average sunlight alone'}</button>
        </div>
        {answer && <p role="status" className="rounded bg-white/5 p-2 text-sky-100">{answer === 'terrain'
          ? az ? 'Bəli. Yerli relyef işığın qarşısını kəsə bilər. Orta işıqlanma ən uzun kölgə müddətini göstərmir.' : 'Yes. Local terrain can block the light. Average illumination does not tell you the longest shadow duration.'
          : az ? 'Yerli üfüqü də yoxlayın. Daha yüksək orta işıqlanma uzun bir kölgə dövrünü istisna etmir.' : 'Check the local horizon too. Higher average illumination can still include a long shadow.'}</p>}
        <button type="button" onClick={onOpenScience} className="rounded-lg bg-sky-200 px-3 py-2 font-semibold text-slate-950">{az ? 'Günəş işığı araşdırmasını aç' : 'Open Sunlight research'}</button>
      </>}
      <p className="text-xs text-slate-300">{az ? 'Bu nişan uydurma təlim nöqtəsidir. LOLA lazer ölçmələri real Ay relyefinin modellərini qurmağa kömək edir.' : 'This marker is a fictional training point. LOLA laser measurements help build models of the real lunar terrain.'}</p>
    </section>
  );
}
