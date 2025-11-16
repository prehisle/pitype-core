import { createPlayer, type Player } from './player.js';
import { createDomCursorAdapter, type DomCursorAdapter } from './dom/cursorAdapter.js';
import type { RecordingData } from './recorder.js';
import type { CursorShape } from './dom/cursorAdapter.js';

export interface GhostConfig {
  /** 幽灵名称 */
  name: string;
  /** 录制数据 */
  recording: RecordingData;
  /** 光标颜色 */
  color?: string;
  /** 光标形状 */
  shape?: CursorShape;
  /** 光标透明度 (0-1) */
  opacity?: number;
  /** 是否显示名称标签 */
  showLabel?: boolean;
}

export interface Ghost {
  /** 幽灵 ID */
  id: string;
  /** 幽灵配置 */
  config: GhostConfig;
  /** 播放器实例 */
  player: Player;
  /** 光标适配器 */
  cursorAdapter: DomCursorAdapter;
  /** 光标 DOM 元素 */
  cursorElement: HTMLElement;
  /** 名称标签 DOM 元素（可选） */
  labelElement?: HTMLElement;
  /** 当前位置 */
  currentPosition: number;
}

export interface GhostManagerOptions {
  /** 文本显示容器 */
  textDisplay: HTMLElement;
  /** 文本滚动容器 */
  textContainer?: HTMLElement | null;
  /** 获取文本字符元素列表 */
  getSpans: () => HTMLElement[];
  /** 是否在幽灵完成时自动移除（默认 false） */
  autoRemoveOnComplete?: boolean;
  /** 幽灵完成时的回调 */
  onGhostComplete?: (ghostId: string) => void;
}

export interface GhostManager {
  /** 添加幽灵 */
  addGhost(config: GhostConfig): string;
  /** 移除幽灵 */
  removeGhost(ghostId: string): void;
  /** 获取幽灵 */
  getGhost(ghostId: string): Ghost | undefined;
  /** 获取所有幽灵 */
  getAllGhosts(): Ghost[];
  /** 启动所有幽灵 */
  startAll(): void;
  /** 暂停所有幽灵 */
  pauseAll(): void;
  /** 恢复所有幽灵 */
  resumeAll(): void;
  /** 停止所有幽灵 */
  stopAll(): void;
  /** 设置所有幽灵的播放速度 */
  setSpeedAll(speed: number): void;
  /** 清理所有幽灵 */
  destroy(): void;
}

let ghostIdCounter = 0;

export function createGhostManager(options: GhostManagerOptions): GhostManager {
  const {
    textDisplay,
    textContainer,
    getSpans,
    autoRemoveOnComplete = false,
    onGhostComplete
  } = options;

  const ghosts = new Map<string, Ghost>();

  function generateGhostId(): string {
    return `ghost-${++ghostIdCounter}-${Date.now()}`;
  }

  function createGhostCursorElement(config: GhostConfig): HTMLElement {
    const cursorElement = document.createElement('div');
    cursorElement.classList.add('cursor', 'ghost-cursor');
    cursorElement.setAttribute('data-ghost-name', config.name);

    // 设置透明度
    const opacity = config.opacity !== undefined ? config.opacity : 0.6;
    cursorElement.style.opacity = String(opacity);

    // 设置 z-index 使其低于主光标
    cursorElement.style.zIndex = '1';

    textDisplay.appendChild(cursorElement);
    return cursorElement;
  }

  function createGhostLabelElement(config: GhostConfig): HTMLElement | undefined {
    if (!config.showLabel) return undefined;

    const labelElement = document.createElement('div');
    labelElement.classList.add('ghost-label');
    labelElement.textContent = config.name;
    labelElement.style.position = 'absolute';
    labelElement.style.fontSize = '12px';
    labelElement.style.padding = '2px 6px';
    labelElement.style.borderRadius = '3px';
    labelElement.style.backgroundColor = config.color || 'rgba(255, 255, 255, 0.8)';
    labelElement.style.color = '#000';
    labelElement.style.pointerEvents = 'none';
    labelElement.style.whiteSpace = 'nowrap';
    labelElement.style.transform = 'translateY(-20px)';
    labelElement.style.zIndex = '3';

    textDisplay.appendChild(labelElement);
    return labelElement;
  }

  function updateLabelPosition(ghost: Ghost): void {
    if (!ghost.labelElement) return;

    const cursorRect = ghost.cursorElement.getBoundingClientRect();
    const textRect = textDisplay.getBoundingClientRect();

    const left = cursorRect.left - textRect.left + (textDisplay.scrollLeft ?? 0);
    const top = cursorRect.top - textRect.top + (textDisplay.scrollTop ?? 0);

    ghost.labelElement.style.left = `${left}px`;
    ghost.labelElement.style.top = `${top}px`;
  }

  function addGhost(config: GhostConfig): string {
    const ghostId = generateGhostId();

    // 创建虚拟输入框（幽灵不需要真实输入）
    const dummyInput = document.createElement('input');
    dummyInput.style.display = 'none';

    // 创建光标元素
    const cursorElement = createGhostCursorElement(config);

    // 创建名称标签（可选）
    const labelElement = createGhostLabelElement(config);

    let currentPosition = 0;

    // 创建光标适配器
    const cursorAdapter = createDomCursorAdapter({
      textDisplay,
      textContainer,
      getCurrentPosition: () => currentPosition,
      getCursor: () => cursorElement,
      getInput: () => dummyInput,
      getSpans,
      cursorShape: config.shape || 'line',
      cursorColor: config.color || 'rgba(255, 215, 0, 0.8)',
      cursorBlinkEnabled: false // 幽灵光标不闪烁
    });

    // 创建播放器
    const player = createPlayer({
      recording: config.recording,
      onEvent: (event) => {
        if (event.type === 'input:evaluate') {
          currentPosition = event.index + 1;
          cursorAdapter.updatePosition({ immediate: false });

          // 更新标签位置
          if (labelElement) {
            requestAnimationFrame(() => {
              const ghost = ghosts.get(ghostId);
              if (ghost) updateLabelPosition(ghost);
            });
          }
        } else if (event.type === 'input:undo') {
          currentPosition = event.index;
          cursorAdapter.updatePosition({ immediate: false });

          // 更新标签位置
          if (labelElement) {
            requestAnimationFrame(() => {
              const ghost = ghosts.get(ghostId);
              if (ghost) updateLabelPosition(ghost);
            });
          }
        }
      },
      onComplete: () => {
        onGhostComplete?.(ghostId);
        if (autoRemoveOnComplete) {
          removeGhost(ghostId);
        }
      }
    });

    // 初始化光标位置
    cursorAdapter.cacheCharSpans();
    cursorAdapter.updatePosition({ immediate: true });

    // 初始化标签位置
    if (labelElement) {
      updateLabelPosition({
        id: ghostId,
        config,
        player,
        cursorAdapter,
        cursorElement,
        labelElement,
        currentPosition
      });
    }

    const ghost: Ghost = {
      id: ghostId,
      config,
      player,
      cursorAdapter,
      cursorElement,
      labelElement,
      currentPosition
    };

    ghosts.set(ghostId, ghost);
    return ghostId;
  }

  function removeGhost(ghostId: string): void {
    const ghost = ghosts.get(ghostId);
    if (!ghost) return;

    ghost.player.destroy();
    ghost.cursorElement.remove();
    ghost.labelElement?.remove();

    ghosts.delete(ghostId);
  }

  function getGhost(ghostId: string): Ghost | undefined {
    return ghosts.get(ghostId);
  }

  function getAllGhosts(): Ghost[] {
    return Array.from(ghosts.values());
  }

  function startAll(): void {
    ghosts.forEach((ghost) => {
      ghost.player.play();
    });
  }

  function pauseAll(): void {
    ghosts.forEach((ghost) => {
      ghost.player.pause();
    });
  }

  function resumeAll(): void {
    ghosts.forEach((ghost) => {
      ghost.player.resume();
    });
  }

  function stopAll(): void {
    ghosts.forEach((ghost) => {
      ghost.player.stop();
    });
  }

  function setSpeedAll(speed: number): void {
    ghosts.forEach((ghost) => {
      ghost.player.setSpeed(speed);
    });
  }

  function destroy(): void {
    ghosts.forEach((ghost) => {
      ghost.player.destroy();
      ghost.cursorElement.remove();
      ghost.labelElement?.remove();
    });
    ghosts.clear();
  }

  return {
    addGhost,
    removeGhost,
    getGhost,
    getAllGhosts,
    startAll,
    pauseAll,
    resumeAll,
    stopAll,
    setSpeedAll,
    destroy
  };
}
