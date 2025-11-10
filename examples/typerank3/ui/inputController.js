const compositionTriggerPattern = /[\u4e00-\u9fa5a-zA-Z]/;

export function createInputController({
  getTypingSession = () => null,
  isResultModalVisible = () => false,
  onCompositionEnd = () => {}
} = {}) {
  let inputElement = null;
  let isComposing = false;
  let potentialCompositionStart = false;

  function attachInput(element) {
    detachInput();
    if (!element) return;
    inputElement = element;
    inputElement.addEventListener('input', handleInputEvent);
    inputElement.addEventListener('keydown', handlePotentialCompositionKeydown);
    inputElement.addEventListener('keyup', handlePotentialCompositionKeyup);
    inputElement.addEventListener('compositionstart', handleCompositionStart);
    inputElement.addEventListener('compositionend', handleCompositionEnd);
  }

  function detachInput() {
    if (!inputElement) return;
    inputElement.removeEventListener('input', handleInputEvent);
    inputElement.removeEventListener('keydown', handlePotentialCompositionKeydown);
    inputElement.removeEventListener('keyup', handlePotentialCompositionKeyup);
    inputElement.removeEventListener('compositionstart', handleCompositionStart);
    inputElement.removeEventListener('compositionend', handleCompositionEnd);
    inputElement = null;
    potentialCompositionStart = false;
    isComposing = false;
  }

  function focusInput() {
    if (inputElement) {
      inputElement.focus({ preventScroll: true });
    }
  }

  function handleInputEvent() {
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
  }

  function handlePotentialCompositionKeydown(event) {
    if (
      !isComposing &&
      event.key &&
      event.key.length === 1 &&
      compositionTriggerPattern.test(event.key)
    ) {
      potentialCompositionStart = true;
    }
  }

  function handlePotentialCompositionKeyup() {
    if (potentialCompositionStart && !isComposing) {
      potentialCompositionStart = false;
    }
  }

  function handleCompositionStart() {
    isComposing = true;
    potentialCompositionStart = false;
  }

  function handleCompositionEnd() {
    isComposing = false;
    if (inputElement && inputElement.value) {
      handleInputEvent();
    }
    onCompositionEnd();
  }

  function handleDocumentKeydown(event) {
    if (isResultModalVisible() || !inputElement) return;

    const session = getTypingSession();
    if (!session) return;

    const isCharacterOperation =
      event.key.length === 1 || event.key === 'Backspace' || event.key === 'Enter';

    if (document.activeElement !== inputElement && isCharacterOperation) {
      event.preventDefault();
      focusInput();
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!isComposing) {
        session.input('\n');
      }
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      session.undo();
    }
  }

  document.addEventListener('keydown', handleDocumentKeydown);

  return {
    attachInput,
    detachInput,
    focusInput
  };
}
