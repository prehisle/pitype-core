# 音频反馈系统使用指南

## 概述

Pitype Core 现在支持完整的音频反馈功能，包括：

- **4 种音效类型**: 按键音、正确音、错误音、完成音
- **音量控制**: 0-100% 精确控制
- **启用/禁用开关**: 一键切换音效
- **音效池技术**: 快速连续按键不卡顿
- **自动持久化**: 配置自动保存到 localStorage
- **自动集成**: 可选的 SessionRuntime 自动触发

---

## 快速开始

### 1. 引入必要的模块

```typescript
import { createDomAudioController, type SoundPack } from 'pitype-core';
```

### 2. 准备音效文件

```typescript
// 方式 1: 使用音效文件 URL
const soundPack: SoundPack = {
  keyPress: '/sounds/keypress.mp3',
  correct: '/sounds/correct.mp3',
  error: '/sounds/error.mp3',
  complete: '/sounds/complete.mp3'
};

// 方式 2: 使用预加载的 Audio 对象
const keyPressAudio = new Audio('/sounds/keypress.mp3');
keyPressAudio.preload = 'auto';

const soundPack: SoundPack = {
  keyPress: keyPressAudio
  // ... 其他音效
};
```

### 3. 创建音频控制器

```typescript
const audioController = createDomAudioController({
  soundPack: soundPack,
  enabled: true, // 默认启用
  volume: 0.5, // 音量 50%
  poolSize: 3 // 音效池大小
});

// 预加载所有音效（可选，建议在页面加载后执行）
await audioController.preloadSounds();
```

### 4. 手动触发音效

```typescript
// 播放按键音
audioController.playSound('keyPress');

// 播放正确音
audioController.playSound('correct');

// 播放错误音
audioController.playSound('error');

// 播放完成音
audioController.playSound('complete');
```

---

## 与 SessionRuntime 自动集成

最简单的方式是让 `SessionRuntime` 自动触发音效：

```typescript
import { createSessionRuntime, createDomAudioController } from 'pitype-core';

// 创建音频控制器
const audioController = createDomAudioController({
  soundPack: {
    keyPress: '/sounds/keypress.mp3',
    correct: '/sounds/correct.mp3',
    error: '/sounds/error.mp3',
    complete: '/sounds/complete.mp3'
  },
  enabled: true,
  volume: 0.7
});

// 创建 SessionRuntime 并传入音频控制器
const sessionRuntime = createSessionRuntime({
  audioController: audioController, // 自动触发音效
  onEvaluate: (event) => {
    // 你的其他逻辑
  },
  onComplete: (snapshot) => {
    // 你的其他逻辑
  }
});

// 现在打字时会自动播放音效：
// - 每次按键：keyPress
// - 输入正确：correct
// - 输入错误：error
// - 完成练习：complete
```

---

## 音频控制 API

### 播放音效

```typescript
audioController.playSound(type: 'keyPress' | 'correct' | 'error' | 'complete'): void
```

### 音量控制

```typescript
// 设置音量（0-1）
audioController.setVolume(0.8); // 80%

// 获取当前音量
const volume = audioController.getVolume(); // 0.8
```

### 启用/禁用

```typescript
// 启用音频
audioController.enable();

// 禁用音频
audioController.disable();

// 切换音频状态
const isEnabled = audioController.toggle(); // 返回新状态

// 获取当前状态
const enabled = audioController.isEnabled(); // true/false
```

### 更新音效包

```typescript
// 动态更换音效
audioController.updateSoundPack({
  keyPress: '/sounds/new-keypress.mp3',
  correct: '/sounds/new-correct.mp3',
  error: '/sounds/new-error.mp3',
  complete: '/sounds/new-complete.mp3'
});
```

### 预加载音效

```typescript
// 在页面加载后预加载所有音效
await audioController.preloadSounds();
```

### 销毁控制器

```typescript
// 清理资源（组件卸载时调用）
audioController.destroy();
```

---

## 在 Vue 3 中使用

### 基础示例

```vue
<template>
  <div class="audio-settings">
    <label>
      <input type="checkbox" :checked="audioEnabled" @change="toggleAudio" />
      启用音效
    </label>

    <label>
      音量: {{ Math.round(audioVolume * 100) }}%
      <input type="range" min="0" max="100" :value="audioVolume * 100" @input="updateVolume" />
    </label>

    <button @click="testSound">测试音效</button>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import {
  createDomAudioController,
  createSessionRuntime,
  type DomAudioController
} from 'pitype-core';

const audioController = shallowRef<DomAudioController>();
const audioEnabled = ref(false);
const audioVolume = ref(0.5);

function toggleAudio() {
  const newState = audioController.value?.toggle();
  if (newState !== undefined) {
    audioEnabled.value = newState;
  }
}

function updateVolume(event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber / 100;
  audioController.value?.setVolume(value);
  audioVolume.value = value;
}

function testSound() {
  audioController.value?.playSound('keyPress');
}

onMounted(async () => {
  // 创建音频控制器
  audioController.value = createDomAudioController({
    soundPack: {
      keyPress: '/sounds/keypress.mp3',
      correct: '/sounds/correct.mp3',
      error: '/sounds/error.mp3',
      complete: '/sounds/complete.mp3'
    }
  });

  // 读取当前状态
  audioEnabled.value = audioController.value.isEnabled();
  audioVolume.value = audioController.value.getVolume();

  // 预加载音效
  await audioController.value.preloadSounds();
});

onUnmounted(() => {
  // 清理资源
  audioController.value?.destroy();
});
</script>
```

### 完整集成示例

```vue
<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import {
  createSessionRuntime,
  createDomAudioController,
  createDomInputController,
  createDomCursorAdapter,
  createDomTextRenderer,
  createTextSource
} from 'pitype-core';

const textDisplayRef = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const hiddenInputRef = ref<HTMLInputElement | null>(null);

const audioController = shallowRef<DomAudioController>();
const audioEnabled = ref(false);
const audioVolume = ref(0.5);

onMounted(async () => {
  // 1. 创建音频控制器
  audioController.value = createDomAudioController({
    soundPack: {
      keyPress: '/sounds/keypress.mp3',
      correct: '/sounds/correct.mp3',
      error: '/sounds/error.mp3',
      complete: '/sounds/complete.mp3'
    },
    enabled: true,
    volume: 0.7
  });

  // 2. 创建 SessionRuntime 并集成音频
  const sessionRuntime = createSessionRuntime({
    audioController: audioController.value, // 自动触发音效
    onEvaluate: (event) => {
      textRenderer.value?.applySpanState(event.index, event.correct);
      cursorAdapter.value?.scheduleRefresh();
    },
    onComplete: (snapshot) => {
      console.log('完成！', snapshot);
    }
  });

  // 3. 创建其他组件...
  const textRenderer = shallowRef(createDomTextRenderer(textDisplayRef.value!));
  const cursorAdapter = shallowRef(
    createDomCursorAdapter({
      textDisplay: textDisplayRef.value!,
      getCurrentPosition: () => sessionRuntime.getSession()?.getState().position ?? 0,
      getCursor: () => cursorRef.value,
      getInput: () => hiddenInputRef.value,
      getSpans: () => textRenderer.value?.getSpans() ?? []
    })
  );

  const inputController = shallowRef(
    createDomInputController({
      getTypingSession: () => sessionRuntime.getSession()
    })
  );

  inputController.value.attachInput(hiddenInputRef.value);

  // 4. 预加载音效
  await audioController.value.preloadSounds();

  // 5. 启动会话
  const source = createTextSource('Hello World');
  textRenderer.value.render(source);
  cursorAdapter.value.cacheCharSpans();
  sessionRuntime.startSession(source);
});

onUnmounted(() => {
  audioController.value?.destroy();
});
</script>
```

---

## API 参考

### `DomAudioControllerOptions`

```typescript
interface DomAudioControllerOptions {
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
```

### `SoundPack`

```typescript
interface SoundPack {
  /** 按键音效（每次按键都播放） */
  keyPress?: string | HTMLAudioElement;

  /** 正确输入音效 */
  correct?: string | HTMLAudioElement;

  /** 错误输入音效 */
  error?: string | HTMLAudioElement;

  /** 完成练习音效 */
  complete?: string | HTMLAudioElement;
}
```

### `SoundType`

```typescript
type SoundType = 'keyPress' | 'correct' | 'error' | 'complete';
```

### `DomAudioController` 接口

```typescript
interface DomAudioController {
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
```

---

## 持久化

音频配置会自动保存到 `localStorage`，使用以下键：

- `audioEnabled` - 音频启用状态（`"true"` 或 `"false"`）
- `audioVolume` - 音量值（`"0"` - `"1"`）

用户下次访问时会自动恢复之前的配置。

---

## 音效池技术

为了支持快速连续按键而不卡顿，音频控制器使用了**音效池**技术：

- 每种音效类型预创建多个 Audio 对象（默认 3 个）
- 播放时循环使用池中的对象
- 避免同一音效被中断

```typescript
const audioController = createDomAudioController({
  soundPack: { keyPress: '/sounds/keypress.mp3' },
  poolSize: 5 // 增加池大小以支持更快的连续按键
});
```

---

## 音效文件格式

推荐使用以下格式：

- **MP3**: 兼容性最好
- **OGG**: 文件更小，Chrome/Firefox 支持
- **WAV**: 无损格式，但文件较大

### 音效文件特征建议

- **文件大小**: < 50KB
- **时长**: 0.1-0.5 秒
- **采样率**: 44.1kHz
- **比特率**: 128kbps（MP3）

---

## 浏览器兼容性

- ✅ Chrome 4+
- ✅ Firefox 3.5+
- ✅ Safari 3.1+
- ✅ Edge 12+
- ✅ Opera 10.5+

**注意**: 某些浏览器在用户未交互前会阻止音频自动播放。音频控制器会自动处理这些情况，不会抛出错误。

---

## 常见问题

### Q: 为什么音效不播放？

**A**: 检查以下几点：

1. 确保音频已启用：`audioController.isEnabled()`
2. 确保音量不是 0：`audioController.getVolume()`
3. 确保音效文件路径正确
4. 检查浏览器控制台是否有错误
5. 用户是否与页面交互过（浏览器自动播放策略）

### Q: 如何获取免费的音效文件？

**A**: 推荐资源：

- [Freesound.org](https://freesound.org/)
- [Zapsplat.com](https://www.zapsplat.com/)
- [Mixkit.co](https://mixkit.co/free-sound-effects/)

### Q: 音效延迟怎么办？

**A**: 尝试以下方法：

1. 使用 `preloadSounds()` 预加载音效
2. 减小音效文件大小
3. 增加音效池大小
4. 使用更短的音效文件

### Q: 如何实现不同的按键音？

**A**: 可以在 `onEvaluate` 回调中根据按键字符播放不同的音效：

```typescript
const sessionRuntime = createSessionRuntime({
  onEvaluate: (event) => {
    // 根据字符类型播放不同音效
    if (event.char === ' ') {
      audioController.playSound('keyPress'); // 空格音
    } else if (event.char === '\n') {
      audioController.playSound('complete'); // 回车音
    } else if (event.correct) {
      audioController.playSound('correct'); // 正确音
    } else {
      audioController.playSound('error'); // 错误音
    }
  }
});
```

---

## 完整示例

参考文件：

- `/packages/pitype-core/src/dom/audioController.ts` - 音频控制器实现
- `/packages/pitype-core/src/sessionRuntime.ts` - SessionRuntime 集成示例
