import { Component, type ReactNode, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

// Keep Three/Fiber out of the initial mission bundle and closed planning disclosures.
const Scene = lazy(() => import('./Shackleton3DHologram').then(module => ({ default: module.Shackleton3DHologram })));

class LazyHologramBoundary extends Component<
  { compact: boolean; az: boolean; onRetry: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      const { compact, az, onRetry } = this.props;
      return (
        <div
          className={`${compact ? 'h-56' : 'h-72'} flex flex-col items-center justify-center rounded-xl border border-sky-400/25 bg-[#07131d] p-4 text-center text-xs text-slate-300`}
        >
          <Compass size={24} className="mb-2 text-sky-300" />
          <p className="font-semibold text-white">
            {az
              ? 'Şeklton 3D təlim səhnəsi müvəqqəti əlçatmazdır'
              : 'Shackleton 3D teaching scene temporarily unavailable'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              onRetry();
            }}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-sky-300/40 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-100 hover:bg-sky-500/25"
          >
            <RotateCcw size={12} />
            {az ? 'Yenidən cəhd et' : 'Retry 3D view'}
          </button>
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
  const [retryKey, setRetryKey] = useState(0);

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
      <LazyHologramBoundary compact={compact} az={az} onRetry={() => setRetryKey(k => k + 1)}>
        <Suspense key={retryKey} fallback={placeholder}>
          <Scene compact={compact} active={intersecting && pageVisible} />
        </Suspense>
      </LazyHologramBoundary>
    ) : placeholder}
  </div>;
}
