import { Component, type ReactNode, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

// Keep Three/Fiber out of the initial mission bundle and closed planning disclosures.
// React caches a rejected lazy() promise forever, so each retry must create a new lazy component.
const loadScene = () => import('./Shackleton3DHologram').then(module => ({ default: module.Shackleton3DHologram }));

class LazyHologramBoundary extends Component<
  { compact: boolean; az: boolean; attempt: number; onRetry: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      const { compact, az, attempt, onRetry } = this.props;
      return (
        <div
          role="alert"
          className={`${compact ? 'h-56' : 'h-72'} flex flex-col items-center justify-center rounded-xl border border-sky-400/25 bg-[#07131d] p-4 text-center text-xs text-slate-300`}
        >
          <Compass size={24} className="mb-2 text-sky-300" />
          <p className="font-semibold text-white">
            {az
              ? 'Şeklton 3D təlim səhnəsi müvəqqəti əlçatmazdır'
              : 'Shackleton 3D teaching scene temporarily unavailable'}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-lg border border-sky-300/40 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-100 hover:bg-sky-500/25"
            >
              <RotateCcw size={12} />
              {az ? 'Yenidən cəhd et' : 'Retry 3D view'}
            </button>
            {attempt > 0 && (
              // A redeployed site may have replaced the hashed chunk; a fresh page load fetches current files.
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2.5 py-1 text-xs font-semibold text-slate-100 hover:bg-white/10"
              >
                {az ? 'Səhifəni yenilə' : 'Reload page'}
              </button>
            )}
          </div>
          {attempt > 0 && <p className="mt-2 max-w-sm text-slate-400">
            {az
              ? 'Problem davam edirsə, səhifəni yeniləyin. Yadda saxlanmamış missiya gedişi itə bilər.'
              : 'If the problem persists, reload the page. Unsaved mission progress may be lost.'}
          </p>}
        </div>
      );
    }
    return this.props.children;
  }
}

export function Shackleton3DHologram({ compact = false }: { compact?: boolean }) {
  const { lang } = useI18n();
  const az = lang === 'az';
  const host = useRef<HTMLDivElement>(null);
  const [intersecting, setIntersecting] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Each panel owns its retry identity. Retrying one panel must not remount another scene.
  const Scene = useMemo(() => lazy(loadScene), [attempt]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const visibility = () => setPageVisible(!document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
      setIntersecting(visible);
      if (visible) setLoaded(true);
    });
    observer.observe(element);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  const placeholder = <div className={`${compact ? 'h-56' : 'h-72'} rounded-xl border border-sky-400/25 bg-[#07131d]`} aria-busy="true" />;
  return <div ref={host}>
    {loaded ? (
      <LazyHologramBoundary
        key={attempt}
        compact={compact}
        az={az}
        attempt={attempt}
        onRetry={() => setAttempt(value => value + 1)}
      >
        <Suspense key={attempt} fallback={placeholder}>
          <Scene compact={compact} active={intersecting && pageVisible} />
        </Suspense>
      </LazyHologramBoundary>
    ) : placeholder}
  </div>;
}
