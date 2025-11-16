import { useRef, useEffect, useCallback } from 'react';
import { createDomTextRenderer, type DomTextRenderer, type TextSource } from 'pitype-core';

export function useTextRenderer(containerRef: React.RefObject<HTMLDivElement>) {
  const rendererRef = useRef<DomTextRenderer | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;

    rendererRef.current = createDomTextRenderer(containerRef.current);
    initializedRef.current = true;

    return () => {
      rendererRef.current = null;
      initializedRef.current = false;
    };
  }, [containerRef]); // containerRef 是稳定的，但保留依赖以防万一

  const render = useCallback((source: TextSource) => {
    if (!rendererRef.current) return;
    rendererRef.current.render(source);
  }, []);

  const applySpanState = useCallback((index: number, correct: boolean) => {
    if (!rendererRef.current) return;
    rendererRef.current.applySpanState(index, correct);
  }, []);

  const resetSpanState = useCallback((index: number) => {
    if (!rendererRef.current) return;
    rendererRef.current.resetSpanState(index);
  }, []);

  const getSpans = useCallback((): HTMLSpanElement[] => {
    return rendererRef.current?.getSpans() || [];
  }, []);

  const setSpans = useCallback((spans: HTMLSpanElement[]) => {
    if (!rendererRef.current) return;
    rendererRef.current.setSpans(spans);
  }, []);

  return {
    renderer: rendererRef.current,
    render,
    applySpanState,
    resetSpanState,
    getSpans,
    setSpans
  };
}
