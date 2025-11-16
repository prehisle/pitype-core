import { useRef, useEffect, useCallback } from 'react';
import { createDomInputController, type DomInputController, type TypingSession } from 'pitype-core';

interface UseInputControllerOptions {
  getTypingSession: () => TypingSession | null;
  isResultModalVisible: () => boolean;
  onCompositionEnd?: () => void;
}

export function useInputController(options: UseInputControllerOptions) {
  const controllerRef = useRef<DomInputController | null>(null);

  useEffect(() => {
    controllerRef.current = createDomInputController({
      getTypingSession: options.getTypingSession,
      isResultModalVisible: options.isResultModalVisible,
      onCompositionEnd: options.onCompositionEnd
    });

    return () => {
      controllerRef.current?.detachInput();
      controllerRef.current = null;
    };
  }, [options.getTypingSession, options.isResultModalVisible, options.onCompositionEnd]);

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
