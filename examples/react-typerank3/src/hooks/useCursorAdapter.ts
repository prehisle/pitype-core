import { useRef, useEffect, useCallback } from 'react';
import { createDomCursorAdapter, type DomCursorAdapter } from 'pitype-core';

interface UseCursorAdapterOptions {
  textDisplayRef: React.RefObject<HTMLDivElement>;
  textContainerRef: React.RefObject<HTMLDivElement>;
  getCurrentPosition: () => number;
  getCursor: () => HTMLDivElement | null;
  getInput: () => HTMLInputElement | null;
  getSpans: () => HTMLSpanElement[];
  setSpans: (spans: HTMLSpanElement[]) => void;
}

export function useCursorAdapter(options: UseCursorAdapterOptions) {
  const adapterRef = useRef<DomCursorAdapter | null>(null);

  useEffect(() => {
    if (!options.textDisplayRef.current || !options.textContainerRef.current) return;

    adapterRef.current = createDomCursorAdapter({
      textDisplay: options.textDisplayRef.current,
      textContainer: options.textContainerRef.current,
      getCurrentPosition: options.getCurrentPosition,
      getCursor: options.getCursor,
      getInput: options.getInput,
      getSpans: options.getSpans,
      setSpans: options.setSpans
    });

    // 启用响应式和移动端支持
    adapterRef.current.enableResponsiveSync();
    adapterRef.current.enableMobileSupport();

    return () => {
      adapterRef.current = null;
    };
  }, [options]);

  const cacheCharSpans = useCallback(() => {
    adapterRef.current?.cacheCharSpans();
  }, []);

  const updatePosition = useCallback((opts?: { immediate?: boolean }) => {
    adapterRef.current?.updatePosition(opts);
  }, []);

  const scheduleRefresh = useCallback(() => {
    adapterRef.current?.scheduleRefresh();
  }, []);

  const resetAnimation = useCallback(() => {
    adapterRef.current?.resetAnimation();
  }, []);

  return {
    adapter: adapterRef.current,
    cacheCharSpans,
    updatePosition,
    scheduleRefresh,
    resetAnimation
  };
}
