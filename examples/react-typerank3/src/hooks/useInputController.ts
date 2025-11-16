import { useRef, useEffect, useCallback } from 'react';
import { createDomInputController, type DomInputController, type TypingSession } from 'pitype-core';

interface UseInputControllerOptions {
  getTypingSession: () => TypingSession | null;
  isResultModalVisible: () => boolean;
  onCompositionEnd?: () => void;
}

export function useInputController(options: UseInputControllerOptions) {
  const controllerRef = useRef<DomInputController | null>(null);
  const optionsRef = useRef(options);

  // 更新 options ref，但不触发重新创建
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    // 创建控制器，使用稳定的函数引用
    controllerRef.current = createDomInputController({
      getTypingSession: () => optionsRef.current.getTypingSession(),
      isResultModalVisible: () => optionsRef.current.isResultModalVisible(),
      onCompositionEnd: () => optionsRef.current.onCompositionEnd?.()
    });

    return () => {
      controllerRef.current?.detachInput();
      controllerRef.current = null;
    };
  }, []); // 只创建一次

  const attachInput = useCallback((input: HTMLInputElement) => {
    controllerRef.current?.attachInput(input);
  }, []);

  const detachInput = useCallback(() => {
    controllerRef.current?.detachInput();
  }, []);

  const focusInput = useCallback(() => {
    controllerRef.current?.focusInput();
  }, []);

  return {
    controller: controllerRef.current,
    attachInput,
    detachInput,
    focusInput
  };
}
