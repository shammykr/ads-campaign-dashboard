import type { ProfilerOnRenderCallback } from 'react';

export interface ProfilerSample {
  id: string;
  phase: string;
  actualDuration: number;
  commitTime: number;
}

declare global {
  interface Window {
    __profilerSamples?: ProfilerSample[];
  }
}

/**
 * React Profiler callback that records commit timings on `window` so the
 * latency measurement script (scripts/measure-sort-latency.mjs) can read them.
 */
export const recordRender: ProfilerOnRenderCallback = (id, phase, actualDuration, _base, _start, commitTime) => {
  const samples = (window.__profilerSamples ??= []);
  samples.push({ id, phase, actualDuration, commitTime });
  if (samples.length > 1000) samples.shift();
};
