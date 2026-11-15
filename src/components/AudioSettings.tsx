import { useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, Volume2, VolumeX, X } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { soundFX, type AudioPreferences } from '../utils/soundEffects';

interface AudioSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const subscribe = (listener: () => void) => soundFX.subscribe(listener);
const snapshot = () => soundFX.getPreferences();

export function AudioSettings({ open, onOpenChange }: AudioSettingsProps) {
  const { lang } = useI18n();
  const az = lang === 'az';
  const preferences = useSyncExternalStore(subscribe, snapshot, snapshot);
  const dialogId = useId();
  const headingId = useId();
  const noteId = useId();
  const master = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  // Capture external openers too, including the launch screen's audio button.
  useLayoutEffect(() => {
    if (open) {
      if (document.activeElement instanceof HTMLElement) opener.current = document.activeElement;
    } else if (wasOpen.current) {
      const target = opener.current;
      requestAnimationFrame(() => {
        const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
        const topDialog = dialogs[dialogs.length - 1];
        if (target?.isConnected && (!topDialog || topDialog.contains(target))) target.focus();
      });
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (open) master.current?.focus();
  }, [open]);

  function toggleMuted() {
    soundFX.setMuted(!preferences.muted);
    if (preferences.muted) soundFX.unlock();
  }

  const channels: Array<{ key: Exclude<keyof AudioPreferences, 'muted'>; label: string }> = [
    { key: 'master', label: az ? 'Ümumi səs' : 'Master volume' },
    { key: 'music', label: az ? 'Musiqi' : 'Music' },
    { key: 'effects', label: az ? 'Effektlər' : 'Effects' },
  ];
  const title = az ? 'Səs ayarları' : 'Audio settings';
  const muteLabel = preferences.muted ? (az ? 'Səsi aç' : 'Unmute audio') : (az ? 'Səsi söndür' : 'Mute audio');

  return (
    <>
      <div className="inline-flex shrink-0 items-center gap-0.5">
        <button type="button" className="icon-button" onClick={toggleMuted}
          aria-label={muteLabel} title={muteLabel} aria-pressed={preferences.muted}>
          {preferences.muted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
        </button>
        <button type="button" className="icon-button" aria-label={title} title={title}
          aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? dialogId : undefined}
          onClick={() => { soundFX.unlock(); onOpenChange(!open); }}>
          <SlidersHorizontal size={14} aria-hidden="true" />
        </button>
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-[90]" onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            onOpenChange(false);
          }
        }}>
          <section id={dialogId} role="dialog" aria-modal="true" aria-labelledby={headingId}
            aria-describedby={noteId}
            className="fixed overflow-y-auto rounded-xl border border-[#648981] bg-[#101f29] p-4 text-slate-100 shadow-2xl"
            style={{ right: 12, top: 'min(84px, 12vh)', width: 'min(300px, calc(100vw - 24px))', maxHeight: 'calc(100dvh - min(84px, 12vh) - 12px)' }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                onOpenChange(false);
              }
            }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id={headingId} className="text-sm font-semibold text-white">{title}</h2>
              <button type="button" className="rounded-md p-1.5 text-slate-200 hover:bg-white/10"
                onClick={() => onOpenChange(false)} aria-label={az ? 'Səs ayarlarını bağla' : 'Close audio settings'}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              {channels.map(({ key, label }) => {
                const id = `${dialogId}-${key}`;
                const percent = Math.round(preferences[key] * 100);
                return (
                  <div key={key}>
                    <label htmlFor={id} className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span>{label}</span>
                      <output htmlFor={id} className="font-mono text-xs tabular-nums text-[#c5e2b3]">{percent}%</output>
                    </label>
                    <input id={id} ref={key === 'master' ? master : undefined} type="range" min={0} max={100}
                      step={1} value={percent} aria-valuetext={`${percent}%`}
                      className="block h-5 w-full accent-[#c0e6aa]"
                      onChange={(event) => {
                        soundFX.unlock();
                        soundFX.setVolume(key, Number(event.target.value) / 100);
                      }} />
                  </div>
                );
              })}
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 border-t border-white/15 pt-3 text-sm">
              <input type="checkbox" checked={preferences.muted} onChange={toggleMuted} className="h-4 w-4 accent-[#c0e6aa]" />
              {az ? 'Bütün səsləri söndür' : 'Mute all audio'}
            </label>
            <p id={noteId} className="mt-3 text-xs leading-relaxed text-slate-300">
              {az ? 'Musiqi və skafandr/radio siqnalları; Ay vakuumunda səs yayılmır.'
                : 'Music and suit/radio feedback; no sound travels through lunar vacuum.'}
            </p>
          </section>
        </div>, document.body,
      )}
    </>
  );
}
