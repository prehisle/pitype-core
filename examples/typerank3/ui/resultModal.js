const DEFAULT_ANIMATION_MS = 300;

export function createResultModal({
  modal,
  restartButton,
  onRestart = () => {},
  animationMs = DEFAULT_ANIMATION_MS
}) {
  if (!modal) {
    return {
      show() {},
      hide() {}
    };
  }

  let keydownHandler = null;

  const hide = (callback = () => {}) => {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
      detachKeydown();
      callback();
    }, animationMs);
  };

  const attachKeydown = () => {
    if (keydownHandler) return;
    keydownHandler = (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      hide(onRestart);
    };
    document.addEventListener('keydown', keydownHandler);
  };

  const detachKeydown = () => {
    if (!keydownHandler) return;
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  };

  const show = () => {
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
    });
    attachKeydown();
  };

  const handleRestart = () => {
    hide(onRestart);
  };

  restartButton?.addEventListener('click', handleRestart);

  return {
    show,
    hide: () => hide()
  };
}
