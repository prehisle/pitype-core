import { useRef, useEffect, useState, useCallback } from 'react';
import { createTextSource } from 'pitype-core';
import { useLanguage } from '../contexts/LanguageContext';
import { useTypingSession } from '../hooks/useTypingSession';
import { useTextRenderer } from '../hooks/useTextRenderer';
import { useCursorAdapter } from '../hooks/useCursorAdapter';
import { useInputController } from '../hooks/useInputController';
import { Cursor } from './Cursor';
import { InputField } from './InputField';
import type { StatsSnapshot } from 'pitype-core';

interface TextDisplayProps {
  text: string;
  textId: string;
  onComplete: (snapshot: StatsSnapshot | null) => void;
  onSnapshot: (snapshot: StatsSnapshot | null) => void;
  isResultModalVisible: () => boolean;
}

export function TextDisplay({
  text,
  textId,
  onComplete,
  onSnapshot,
  isResultModalVisible
}: TextDisplayProps) {
  const { locale } = useLanguage();
  const textDisplayRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [initialized, setInitialized] = useState(false);

  // 文本渲染器
  const { render, applySpanState, resetSpanState, getSpans, setSpans } =
    useTextRenderer(textDisplayRef);

  // 光标适配器 ref（提前声明，以便在回调中使用）
  const cursorAdapterRef = useRef<any>(null);

  // 打字会话
  const { startSession, getSession } = useTypingSession({
    onEvaluate: (event) => {
      applySpanState(event.index, event.correct);
      cursorAdapterRef.current?.scheduleRefresh();
    },
    onUndo: (event) => {
      resetSpanState(event.index);
      cursorAdapterRef.current?.scheduleRefresh();
    },
    onComplete: (snapshot) => {
      if (cursorRef.current) {
        cursorRef.current.remove();
      }
      cursorAdapterRef.current?.resetAnimation();
      onComplete(snapshot);
    },
    onSnapshot
  });

  // 光标适配器
  const cursorAdapter = useCursorAdapter({
    textDisplayRef,
    textContainerRef,
    getCurrentPosition: () => getSession()?.getState().position || 0,
    getCursor: () => cursorRef.current,
    getInput: () => inputRef.current,
    getSpans,
    setSpans
  });

  // 更新 cursorAdapter ref
  useEffect(() => {
    cursorAdapterRef.current = cursorAdapter;
  }, [cursorAdapter]);

  // 输入控制器
  const { attachInput, focusInput } = useInputController({
    getTypingSession: getSession,
    isResultModalVisible,
    onCompositionEnd: () => {
      cursorAdapterRef.current?.updatePosition();
    }
  });

  // 初始化会话
  useEffect(() => {
    if (!text || initialized) return;

    const source = createTextSource(text, {
      id: textId,
      locale
    });

    // 渲染文本
    render(source);

    // 启动会话
    startSession(text, locale, textId);

    // 多层 RAF 确保 DOM 完全更新
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 1. 将光标移动到 textDisplay 内部（而不是 textContainer）
          if (cursorRef.current && textDisplayRef.current) {
            textDisplayRef.current.appendChild(cursorRef.current);
          }

          // 2. 缓存字符元素
          cursorAdapterRef.current?.cacheCharSpans();

          // 3. 重置光标动画状态（必须在 updatePosition 之前）
          cursorAdapterRef.current?.resetAnimation();

          // 4. 附加输入框
          if (inputRef.current) {
            attachInput(inputRef.current);
          }

          // 5. 更新光标位置
          cursorAdapterRef.current?.updatePosition({ immediate: true });

          // 6. 启用移动端支持和响应式同步（必须在 updatePosition 之后）
          cursorAdapterRef.current?.getAdapter()?.enableMobileSupport();
          cursorAdapterRef.current?.getAdapter()?.enableResponsiveSync();

          // 7. 聚焦输入框
          focusInput();

          setInitialized(true);
        });
      });
    });
  }, [
    text,
    textId,
    locale,
    render,
    startSession,
    cursorAdapter,
    attachInput,
    focusInput,
    initialized
  ]);

  // 点击文本区域时聚焦输入框
  const handleContainerClick = useCallback(() => {
    focusInput();
  }, [focusInput]);

  return (
    <div ref={textContainerRef} className="pitype-text-container" onClick={handleContainerClick}>
      <div ref={textDisplayRef} id="text-display" className="pitype-text-display" />
      <Cursor ref={cursorRef} visible={initialized} />
      <InputField ref={inputRef} />
    </div>
  );
}
