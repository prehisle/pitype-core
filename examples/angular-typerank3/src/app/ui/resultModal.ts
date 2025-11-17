const DEFAULT_ANIMATION_MS = 300;

export interface ResultModalOptions {
  modal: HTMLElement | null;
  restartButton: HTMLElement | null;
  onRestart?: () => void;
  animationMs?: number;
}

export interface ResultModal {
  show(): void;
  hide(): void;
}

export function createResultModal({
  modal,
  restartButton,
  onRestart = () => {},
  animationMs = DEFAULT_ANIMATION_MS
}: ResultModalOptions): ResultModal {
  if (!modal) {
    return {
      show() {},
      hide() {}
    };
  }

  let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  const hide = (callback: () => void = () => {}): void => {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
      detachKeydown();
      callback();
    }, animationMs);
  };

  const attachKeydown = (): void => {
    if (keydownHandler) return;

    keydownHandler = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      hide(onRestart);
    };

    document.addEventListener('keydown', keydownHandler);
  };

  const detachKeydown = (): void => {
    if (!keydownHandler) return;
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  };

  const show = (): void => {
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
    });
    attachKeydown();
  };

  const handleRestart = (): void => {
    hide(onRestart);
  };

  restartButton?.addEventListener('click', handleRestart);

  return {
    show,
    hide: () => hide()
  };
}
