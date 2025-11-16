const DEFAULT_ANIMATION_MS = 300;

export function initInfoModal({
  triggers = [],
  modal,
  titleElement,
  contentElement,
  closeButton,
  infoMap = {}
} = {}) {
  if (!modal) return;

  const show = (type) => {
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

  const hide = () => {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, DEFAULT_ANIMATION_MS);
  };

  Array.from(triggers).forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const type = trigger.getAttribute('data-info');
      show(type);
    });
  });

  closeButton?.addEventListener('click', () => {
    hide();
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      hide();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'flex') {
      hide();
    }
  });
}
