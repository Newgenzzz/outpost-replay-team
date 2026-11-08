import { lazy, Suspense, useEffect, useRef, useState } from 'react';

// Keep Three/Fiber out of the initial mission bundle and closed planning disclosures.
const Scene = lazy(() => import('./Shackleton3DHologram').then(module => ({ default: module.Shackleton3DHologram })));

export function Shackleton3DHologram({ compact = false }: { compact?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [intersecting, setIntersecting] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);

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
    {loaded ? <Suspense fallback={placeholder}><Scene compact={compact} active={intersecting && pageVisible} /></Suspense> : placeholder}
  </div>;
}
