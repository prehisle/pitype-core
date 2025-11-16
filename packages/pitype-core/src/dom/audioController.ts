type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const audioEnabledKey = 'audioEnabled';
const audioVolumeKey = 'audioVolume';

export type SoundType = 'keyPress' | 'correct' | 'error' | 'complete';

export interface SoundPack {
  /** 按键音效（每次按键都播放） */
  keyPress?: string | HTMLAudioElement;
  /** 正确输入音效 */
  correct?: string | HTMLAudioElement;
  /** 错误输入音效 */
  error?: string | HTMLAudioElement;
  /** 完成练习音效 */
  complete?: string | HTMLAudioElement;
}

export interface DomAudioControllerOptions {
  /** 音效包配置 */
  soundPack?: SoundPack;
  /** 是否启用音频（默认从 localStorage 读取） */
  enabled?: boolean;
  /** 音量（0-1，默认从 localStorage 读取或 0.5） */
  volume?: number;
  /** 音效池大小（同时播放数量，默认 3） */
  poolSize?: number;
  /** localStorage 接口（用于持久化） */
  localStorage?: StorageLike;
  /** 窗口引用（用于创建 Audio 对象） */
  windowRef?: Window;
}

export interface DomAudioController {
  /** 播放指定类型的音效 */
  playSound(type: SoundType): void;
  /** 设置音量（0-1） */
  setVolume(volume: number): void;
  /** 获取当前音量 */
  getVolume(): number;
  /** 启用音频 */
  enable(): void;
  /** 禁用音频 */
  disable(): void;
  /** 切换音频启用状态 */
  toggle(): boolean;
  /** 获取音频启用状态 */
  isEnabled(): boolean;
  /** 更新音效包 */
  updateSoundPack(soundPack: SoundPack): void;
  /** 预加载所有音效 */
  preloadSounds(): Promise<void>;
  /** 销毁控制器，释放资源 */
  destroy(): void;
}

interface AudioPool {
  elements: HTMLAudioElement[];
  currentIndex: number;
}

export function createDomAudioController(
  options: DomAudioControllerOptions = {}
): DomAudioController {
  const {
    soundPack: initialSoundPack = {},
    enabled: initialEnabled,
    volume: initialVolume,
    poolSize = 3,
    localStorage = typeof window !== 'undefined' ? window.localStorage : undefined,
    windowRef = typeof window !== 'undefined' ? window : undefined
  } = options;

  // 音效池映射：每种音效类型对应一个池
  const audioPools = new Map<SoundType, AudioPool>();

  // 当前音效包
  let currentSoundPack: SoundPack = { ...initialSoundPack };

  // 当前状态
  let currentVolume: number = loadVolume();
  let currentEnabled: boolean = loadEnabled();

  // 从 localStorage 或初始配置加载音量
  function loadVolume(): number {
    if (initialVolume !== undefined) return Math.max(0, Math.min(1, initialVolume));
    const stored = localStorage?.getItem(audioVolumeKey);
    if (stored !== null && stored !== undefined) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return Math.max(0, Math.min(1, parsed));
    }
    return 0.5;
  }

  // 从 localStorage 或初始配置加载启用状态
  function loadEnabled(): boolean {
    if (initialEnabled !== undefined) return initialEnabled;
    const stored = localStorage?.getItem(audioEnabledKey);
    if (stored !== null) return stored === 'true';
    return false;
  }

  // 创建 Audio 元素
  function createAudioElement(source: string | HTMLAudioElement): HTMLAudioElement | null {
    if (typeof source === 'string') {
      try {
        // 使用全局 Audio 构造函数（如果可用）
        interface WindowWithAudio extends Window {
          Audio?: typeof Audio;
        }
        const AudioCtor =
          (windowRef as WindowWithAudio)?.Audio || (typeof Audio !== 'undefined' ? Audio : null);
        if (!AudioCtor) return null;

        const audio = new AudioCtor(source);
        audio.volume = currentVolume;
        audio.preload = 'auto';
        return audio;
      } catch (error) {
        console.warn(`Failed to create audio element from URL: ${source}`, error);
        return null;
      }
    } else {
      try {
        // 克隆已有的 Audio 对象
        const audio = source.cloneNode(true) as HTMLAudioElement;
        audio.volume = currentVolume;
        return audio;
      } catch (error) {
        console.warn('Failed to clone audio element', error);
        return null;
      }
    }
  }

  // 初始化音效池
  function initializePool(type: SoundType): void {
    const source = currentSoundPack[type];
    if (!source) return;

    const elements: HTMLAudioElement[] = [];
    for (let i = 0; i < poolSize; i++) {
      const audio = createAudioElement(source);
      if (audio) {
        elements.push(audio);
      }
    }

    if (elements.length > 0) {
      audioPools.set(type, {
        elements,
        currentIndex: 0
      });
    }
  }

  // 初始化所有音效池
  function initializeAllPools(): void {
    const types: SoundType[] = ['keyPress', 'correct', 'error', 'complete'];
    types.forEach((type) => {
      if (currentSoundPack[type]) {
        initializePool(type);
      }
    });
  }

  // 播放音效
  function playSound(type: SoundType): void {
    if (!currentEnabled) return;

    const pool = audioPools.get(type);
    if (!pool || pool.elements.length === 0) return;

    const audio = pool.elements[pool.currentIndex];
    if (!audio) return;

    // 更新池索引（循环）
    pool.currentIndex = (pool.currentIndex + 1) % pool.elements.length;

    // 重置播放位置并播放
    try {
      audio.currentTime = 0;
      audio.volume = currentVolume;

      // 使用 promise 播放，忽略错误（避免未交互时的警告）
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // 忽略用户未交互导致的自动播放失败
          if (error.name !== 'NotAllowedError') {
            console.warn(`Failed to play sound: ${type}`, error);
          }
        });
      }
    } catch (error) {
      console.warn(`Error playing sound: ${type}`, error);
    }
  }

  // 设置音量
  function setVolume(volume: number): void {
    currentVolume = Math.max(0, Math.min(1, volume));
    localStorage?.setItem(audioVolumeKey, String(currentVolume));

    // 更新所有音频元素的音量
    audioPools.forEach((pool) => {
      pool.elements.forEach((audio) => {
        audio.volume = currentVolume;
      });
    });
  }

  // 获取音量
  function getVolume(): number {
    return currentVolume;
  }

  // 启用音频
  function enable(): void {
    currentEnabled = true;
    localStorage?.setItem(audioEnabledKey, 'true');
  }

  // 禁用音频
  function disable(): void {
    currentEnabled = false;
    localStorage?.setItem(audioEnabledKey, 'false');
  }

  // 切换音频状态
  function toggle(): boolean {
    if (currentEnabled) {
      disable();
    } else {
      enable();
    }
    return currentEnabled;
  }

  // 获取启用状态
  function isEnabled(): boolean {
    return currentEnabled;
  }

  // 更新音效包
  function updateSoundPack(soundPack: SoundPack): void {
    currentSoundPack = { ...soundPack };

    // 清理旧的音效池
    audioPools.forEach((pool) => {
      pool.elements.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
    });
    audioPools.clear();

    // 重新初始化音效池
    initializeAllPools();
  }

  // 预加载所有音效
  async function preloadSounds(): Promise<void> {
    const promises: Promise<void>[] = [];

    audioPools.forEach((pool) => {
      pool.elements.forEach((audio) => {
        const promise = new Promise<void>((resolve) => {
          if (audio.readyState >= 2) {
            // 已经加载完成
            resolve();
          } else {
            audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            audio.addEventListener('error', () => resolve(), { once: true });
            audio.load();
          }
        });
        promises.push(promise);
      });
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Some audio files failed to preload', error);
    }
  }

  // 销毁控制器
  function destroy(): void {
    audioPools.forEach((pool) => {
      pool.elements.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
    });
    audioPools.clear();
  }

  // 初始化
  initializeAllPools();

  return {
    playSound,
    setVolume,
    getVolume,
    enable,
    disable,
    toggle,
    isEnabled,
    updateSoundPack,
    preloadSounds,
    destroy
  };
}
