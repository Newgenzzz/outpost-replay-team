import { useEffect, useState } from 'react';
import { BookOpen, Languages, MoonStar, PlayCircle, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { MISSION_TITLE } from '../data/missionDecisions';
import { LRO_SITE } from '../data/nasaTelemetry';
import { soundFX } from '../utils/soundEffects';
import type { Lang } from '../types';

interface HeaderProps {
  onReset: () => void;
  onLoadDemo: () => void;
  showBriefing: boolean;
  setShowBriefing: (v: boolean) => void;
}

export default function Header({ onReset, onLoadDemo, showBriefing, setShowBriefing }: HeaderProps) {
  const { t, tr, lang, setLang } = useI18n();
  const [muted, setMuted] = useState(() => soundFX.isMuted());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function handleToggleSound() {
    const nextMuted = soundFX.toggleMute();
    setMuted(nextMuted);
  }

  return (
    <>
      <header className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-500 text-slate-900 shadow-inner">
            <MoonStar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-100">
              {t('appName')} <span className="font-normal text-slate-400">· {t('tagline')}</span>
            </h1>
            <p className="text-xs text-slate-400">
              {tr(MISSION_TITLE)} · {tr(LRO_SITE.name)} ({LRO_SITE.coordinateLabel})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleSound}
            aria-pressed={!muted}
            title={muted ? t('soundMuted') : t('soundOn')}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              muted
                ? 'border-slate-700 bg-slate-900/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span>{muted ? t('soundMuted') : t('soundOn')}</span>
          </button>

          <button
            onClick={() => setShowBriefing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
          >
            <BookOpen className="h-4 w-4" /> {t('missionBriefing')}
          </button>

          <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/70 p-0.5" role="group" aria-label={t('language')}>
            <Languages className="mx-1.5 h-4 w-4 text-slate-400" />
            {(['en', 'az'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition ${
                  lang === l ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" /> {t('reset')}
          </button>
          <button
            onClick={onLoadDemo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            <PlayCircle className="h-4 w-4" /> {t('loadDemo')}
          </button>
        </div>
      </header>

      {showBriefing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur"
          onClick={() => setShowBriefing(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="panel max-w-2xl space-y-4 p-6 text-slate-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-100">{t('briefingTitle')}</h2>
              <button onClick={() => setShowBriefing(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={t('close')}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p>{t('briefingBody1')}</p>
            <p>{t('briefingBody2')}</p>
            <p>{t('briefingBody3')}</p>
            <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sky-200">{t('briefingGoal')}</p>
            <p className="text-xs text-slate-500">{t('noLogosNote')}</p>
            <div className="flex justify-end">
              <button onClick={() => setShowBriefing(false)} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
