const compositionTriggerPattern = /[\u4e00-\u9fa5a-zA-Z]/;
export function createDomInputController(options = {}) {
    const { getTypingSession = () => null, isResultModalVisible = () => false, onCompositionEnd = () => { }, documentRef = typeof document !== 'undefined' ? document : undefined, getActiveElement = () => typeof document !== 'undefined' ? document.activeElement : null } = options;
    let inputElement = null;
    let isComposing = false;
    let potentialCompositionStart = false;
    const handleInputEvent = () => {
        if (!inputElement || isComposing)
            return;
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
        if (!inputChar)
            return;
        session.input(inputChar);
    };
    const handlePotentialCompositionKeydown = (event) => {
        if (!isComposing &&
            typeof event.key === 'string' &&
            event.key.length === 1 &&
            compositionTriggerPattern.test(event.key)) {
            potentialCompositionStart = true;
        }
    };
    const handlePotentialCompositionKeyup = () => {
        if (potentialCompositionStart && !isComposing) {
            potentialCompositionStart = false;
        }
    };
    const handleCompositionStart = () => {
        isComposing = true;
        potentialCompositionStart = false;
    };
    const handleCompositionEnd = () => {
        isComposing = false;
        if (inputElement && inputElement.value) {
            handleInputEvent();
        }
        onCompositionEnd();
    };
    const focusInput = (focusOptions) => {
        if (!inputElement)
            return;
        if (typeof inputElement.focus === 'function') {
            inputElement.focus(focusOptions ?? { preventScroll: true });
        }
    };
    const handleDocumentKeydown = (event) => {
        if (isResultModalVisible() || !inputElement)
            return;
        const session = getTypingSession();
        if (!session)
            return;
        const key = typeof event.key === 'string' ? event.key : '';
        const isCharacterOperation = key.length === 1 || key === 'Backspace' || key === 'Enter';
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
    const attachInput = (element) => {
        detachInput();
        if (!element)
            return;
        inputElement = element;
        inputElement.addEventListener('input', handleInputEvent);
        inputElement.addEventListener('keydown', handlePotentialCompositionKeydown);
        inputElement.addEventListener('keyup', handlePotentialCompositionKeyup);
        inputElement.addEventListener('compositionstart', handleCompositionStart);
        inputElement.addEventListener('compositionend', handleCompositionEnd);
    };
    const detachInput = () => {
        if (!inputElement)
            return;
        inputElement.removeEventListener('input', handleInputEvent);
        inputElement.removeEventListener('keydown', handlePotentialCompositionKeydown);
        inputElement.removeEventListener('keyup', handlePotentialCompositionKeyup);
        inputElement.removeEventListener('compositionstart', handleCompositionStart);
        inputElement.removeEventListener('compositionend', handleCompositionEnd);
        inputElement = null;
        potentialCompositionStart = false;
        isComposing = false;
    };
    documentRef?.addEventListener('keydown', handleDocumentKeydown);
    const destroy = () => {
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
