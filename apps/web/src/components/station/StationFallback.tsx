import { RefreshCw, Smartphone } from 'lucide-react';
import { getConfig } from '@fit-nation/shared';
import type { StationProblem } from '../../utils/station';
import { appGetUrl } from '../../utils/station';

/**
 * The friendly end of a stale sticker (ADR-0005): an unknown or deleted
 * Station never dead-ends in a bare error — it points at the app instead.
 * An indefinite failure (gym wifi) gets a retry button rather than telling
 * the visitor their sticker is dead.
 */
export function StationFallback({ problem, onRetry }: { problem: StationProblem; onRetry?: () => void }) {
  const definitive = problem !== 'error';

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <img src="/logo.png" alt="Fit Nation" className="w-16 h-16 rounded-full mb-6" />

        {definitive ? (
          <>
            <h1 className="text-2xl font-bold mb-2">This station has moved on</h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              The sticker you scanned isn&apos;t connected to an exercise station anymore. Every exercise — with demo
              videos and step-by-step guidance — lives in the Fit Nation app.
            </p>
            <a
              href={appGetUrl(getConfig().baseUrl)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              <Smartphone className="w-5 h-5" />
              Get the free app
            </a>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Couldn&apos;t load this station</h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Looks like a connection hiccup. Check your signal and try again.
            </p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              <RefreshCw className="w-5 h-5" />
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
