import { TypingSession } from '../typingSession';

const compositionTriggerPattern = /[\u4e00-\u9fa5a-zA-Z]/;

export interface DomInputControllerOptions {
  getTypingSession?: () => TypingSession | null;
  isResultModalVisible?: () => boolean;
  onCompositionEnd?: () => void;
  documentRef?: Document;
  getActiveElement?: () => Element | null;
}

export interface DomInputController {
  attachInput(element: HTMLInputElement): void;
  detachInput(): void;
  focusInput(focusOptions?: FocusOptions): void;
  destroy(): void;
}

export function createDomInputController(
  options: DomInputControllerOptions = {}
): DomInputController {
  const {
    getTypingSession = () => null,
    isResultModalVisible = () => false,
    onCompositionEnd = () => {},
    documentRef = typeof document !== 'undefined' ? document : undefined,
    getActiveElement = () =>
      typeof document !== 'undefined' ? document.activeElement : null
  } = options;

  let inputElement: HTMLInputElement | null = null;
  let isComposing = false;
  let potentialCompositionStart = false;

  const handleInputEvent = (): void => {
    if (!inputElement || isComposing) return;

    if (potentialCompositionStart) {
      const currentValue = inputElement.value;
      inputElement.value = '';

      if (!isComposing && currentValue) {
        inputElement.value = currentValue;
        const tempState = potentialCompositionStart;
        potentialCompositionStart = false;
        handleInputEvent();
        potentialCompositionStart = tempState;
      }
      return;
    }

    const session = getTypingSession();
    if (!session) {
      inputElement.value = '';
      return;
    }

    const inputChar = inputElement.value;
    inputElement.value = '';

    if (!inputChar) return;

    session.input(inputChar);
  };

  const handlePotentialCompositionKeydown = (event: KeyboardEvent): void => {
    if (
      !isComposing &&
      typeof event.key === 'string' &&
      event.key.length === 1 &&
      compositionTriggerPattern.test(event.key)
    ) {
      potentialCompositionStart = true;
    }
  };

  const handlePotentialCompositionKeyup = (): void => {
    if (potentialCompositionStart && !isComposing) {
      potentialCompositionStart = false;
    }
  };

  const handleCompositionStart = (): void => {
    isComposing = true;
    potentialCompositionStart = false;
  };

  const handleCompositionEnd = (): void => {
    isComposing = false;
    if (inputElement && inputElement.value) {
      handleInputEvent();
    }
    onCompositionEnd();
  };

  const focusInput = (focusOptions?: FocusOptions): void => {
    if (!inputElement) return;

    if (typeof inputElement.focus === 'function') {
      inputElement.focus(focusOptions ?? { preventScroll: true });
    }
  };

  const handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (isResultModalVisible() || !inputElement) return;

    const session = getTypingSession();
    if (!session) return;

    const key = typeof event.key === 'string' ? event.key : '';
    const isCharacterOperation =
      key.length === 1 || key === 'Backspace' || key === 'Enter';

    if (isCharacterOperation && getActiveElement() !== inputElement) {
      event.preventDefault?.();
      focusInput();
    }

    if (key === 'Enter') {
      event.preventDefault?.();
      if (!isComposing) {
        session.input('\n');
      }
      return;
    }

    if (key === 'Backspace') {
      event.preventDefault?.();
      session.undo();
    }
  };

  const attachInput = (element: HTMLInputElement): void => {
    detachInput();
    if (!element) return;

    inputElement = element;
    inputElement.addEventListener('input', handleInputEvent);
    inputElement.addEventListener('keydown', handlePotentialCompositionKeydown);
    inputElement.addEventListener('keyup', handlePotentialCompositionKeyup);
    inputElement.addEventListener('compositionstart', handleCompositionStart);
    inputElement.addEventListener('compositionend', handleCompositionEnd);
  };

  const detachInput = (): void => {
    if (!inputElement) return;

    inputElement.removeEventListener('input', handleInputEvent);
    inputElement.removeEventListener(
      'keydown',
      handlePotentialCompositionKeydown
    );
    inputElement.removeEventListener('keyup', handlePotentialCompositionKeyup);
    inputElement.removeEventListener(
      'compositionstart',
      handleCompositionStart
    );
    inputElement.removeEventListener('compositionend', handleCompositionEnd);
    inputElement = null;
    potentialCompositionStart = false;
    isComposing = false;
  };

  documentRef?.addEventListener('keydown', handleDocumentKeydown);

  const destroy = (): void => {
    detachInput();
    documentRef?.removeEventListener('keydown', handleDocumentKeydown);
  };

  return {
    attachInput,
    detachInput,
    focusInput,
    destroy
  };
}
