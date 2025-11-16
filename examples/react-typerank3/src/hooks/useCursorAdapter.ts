import { useRef, useEffect, useCallback, useMemo } from 'react';
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
  const optionsRef = useRef(options);
  const initializedRef = useRef(false);

  // 更新 options ref，但不触发重新创建
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!options.textDisplayRef.current || !options.textContainerRef.current) return;
    if (initializedRef.current) return;

    // 创建适配器，使用稳定的函数引用
    adapterRef.current = createDomCursorAdapter({
      textDisplay: options.textDisplayRef.current,
      textContainer: options.textContainerRef.current,
      getCurrentPosition: () => optionsRef.current.getCurrentPosition(),
      getCursor: () => optionsRef.current.getCursor(),
      getInput: () => optionsRef.current.getInput(),
      getSpans: () => optionsRef.current.getSpans(),
      setSpans: (spans) => optionsRef.current.setSpans(spans)
    });

    // 注意：不在这里调用 enableResponsiveSync() 和 enableMobileSupport()
    // 这些方法应该在 cacheCharSpans() 和首次 updatePosition() 之后调用
    // 否则会导致光标位置偏移（因为此时 spans 还未缓存）

    initializedRef.current = true;

    return () => {
      adapterRef.current = null;
      initializedRef.current = false;
    };
  }, [options.textDisplayRef, options.textContainerRef]); // 只在 DOM refs 变化时重新创建

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

  const getAdapter = useCallback(() => {
    return adapterRef.current;
  }, []);

  return useMemo(
    () => ({
      getAdapter,
      cacheCharSpans,
      updatePosition,
      scheduleRefresh,
      resetAnimation
    }),
    [getAdapter, cacheCharSpans, updatePosition, scheduleRefresh, resetAnimation]
  );
}
