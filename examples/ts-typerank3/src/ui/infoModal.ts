const DEFAULT_ANIMATION_MS = 300;

interface InfoData {
  title?: string;
  content?: string;
}

export interface InfoModalOptions {
  triggers?: ArrayLike<Element>;
  modal: HTMLElement | null;
  titleElement: HTMLElement | null;
  contentElement: HTMLElement | null;
  closeButton: HTMLElement | null;
  infoMap?: Record<string, InfoData>;
}

export function initInfoModal(options?: InfoModalOptions): void {
  if (!options) return;

  const {
    triggers = [],
    modal,
    titleElement,
    contentElement,
    closeButton,
    infoMap = {}
  } = options;
  if (!modal) return;

  const show = (type: string): void => {
    const info = infoMap[type];
    if (!info) return;

    if (titleElement) {
      titleElement.textContent = info.title || '';
    }

    if (contentElement) {
      contentElement.textContent = info.content || '';
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.add('show'));
    });
  };

  const hide = (): void => {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, DEFAULT_ANIMATION_MS);
  };

  Array.from(triggers).forEach((trigger) => {
    trigger.addEventListener('click', (event: Event) => {
      event.stopPropagation();
      const type = trigger.getAttribute('data-info');
      if (type) show(type);
    });
  });

  closeButton?.addEventListener('click', () => {
    hide();
  });

  window.addEventListener('click', (event: MouseEvent) => {
    if (event.target === modal) {
      hide();
    }
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && modal.style.display === 'flex') {
      hide();
    }
  });
}
