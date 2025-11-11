# 练习回放功能使用指南

## 概述

Pitype Core 现在支持完整的录制和回放功能，包括：

- **自动录制**: 与 SessionRuntime 集成，自动录制打字会话
- **手动录制**: 使用独立的 Recorder 精确控制录制过程
- **精确回放**: 按照原始时间戳精确重现打字过程
- **播放控制**: 播放/暂停/停止/跳转/倍速
- **数据导出**: 导出为 JSON 文件，支持分享和存储
- **数据导入**: 从 JSON 文件加载录制数据

---

## 快速开始

### 方式 1: 使用 SessionRuntime 自动录制（推荐）

```typescript
import { createSessionRuntime, createTextSource } from '@pitype/core';

// 创建 SessionRuntime 并启用录制
const sessionRuntime = createSessionRuntime({
  enableRecording: true,  // 启用录制
  recorderOptions: {
    includeMetadata: true,
    customMetadata: {
      userName: 'John Doe',
      difficulty: 'medium'
    }
  },
  onComplete: (snapshot) => {
    console.log('会话完成！');

    // 获取录制数据
    const recording = sessionRuntime.getLastRecording();
    if (recording) {
      console.log('录制数据:', recording);
      console.log('事件数量:', recording.events.length);
      console.log('总时长:', recording.endTime - recording.startTime, 'ms');
    }
  }
});

// 启动会话（自动开始录制）
const source = createTextSource('Hello World');
sessionRuntime.startSession(source);

// ... 用户打字 ...

// 会话完成后自动停止录制
// 使用 getLastRecording() 获取录制数据
```

### 方式 2: 使用独立 Recorder 手动录制

```typescript
import { TypingSession, createRecorder, createTextSource } from '@pitype/core';

// 创建录制器
const recorder = createRecorder({
  id: 'my-recording-001',
  includeMetadata: true
});

// 创建打字会话
const source = createTextSource('Hello World');
const session = new TypingSession({ source });

// 开始录制
recorder.start(session, source);

// ... 用户打字 ...

// 停止录制
const recording = recorder.stop();

console.log('录制完成:', recording);
```

---

## 回放录制数据

### 基础回放

```typescript
import { createPlayer } from '@pitype/core';

// 假设已经有录制数据
const recording = sessionRuntime.getLastRecording();

if (recording) {
  // 创建播放器
  const player = createPlayer({
    recording: recording,
    playbackSpeed: 1.0,  // 正常速度
    onEvent: (event, currentTime) => {
      console.log('事件:', event.type, '时间:', currentTime);

      // 根据事件类型更新 UI
      if (event.type === 'input:evaluate') {
        // 更新文本显示、光标位置等
      }
    },
    onProgress: (currentTime, duration) => {
      // 更新进度条
      const progress = (currentTime / duration) * 100;
      console.log('播放进度:', progress.toFixed(1) + '%');
    },
    onComplete: () => {
      console.log('回放完成！');
    }
  });

  // 开始播放
  player.play();
}
```

### 完整播放控制

```typescript
// 播放控制
player.play();       // 开始播放
player.pause();      // 暂停
player.resume();     // 恢复播放
player.stop();       // 停止并重置

// 跳转到指定时间（毫秒）
player.seek(5000);   // 跳转到 5 秒位置

// 倍速播放
player.setSpeed(0.5);  // 0.5x 慢速
player.setSpeed(1.0);  // 1x 正常速度
player.setSpeed(2.0);  // 2x 快速
player.setSpeed(5.0);  // 5x 超快速

// 获取播放信息
const currentTime = player.getCurrentTime();  // 当前播放时间（毫秒）
const duration = player.getDuration();         // 总时长（毫秒）
const speed = player.getSpeed();               // 当前播放速度
const state = player.getState();               // 播放状态：'idle' | 'playing' | 'paused' | 'completed'
const isPlaying = player.isPlaying();          // 是否正在播放

// 销毁播放器
player.destroy();
```

---

## 数据导入导出

### 导出录制数据

```typescript
import { exportRecordingToFile, serializeRecording } from '@pitype/core';

const recording = sessionRuntime.getLastRecording();

if (recording) {
  // 方式 1: 直接导出为文件（浏览器环境）
  exportRecordingToFile(recording, 'my-typing-session.json');

  // 方式 2: 序列化为 JSON 字符串
  const json = serializeRecording(recording);
  console.log(json);

  // 可以发送到服务器或存储到 localStorage
  localStorage.setItem('last-recording', json);
}
```

### 导入录制数据

```typescript
import { importRecordingFromFile, deserializeRecording } from '@pitype/core';

// 方式 1: 从文件导入（浏览器环境）
const fileInput = document.getElementById('file-input') as HTMLInputElement;
fileInput.addEventListener('change', async (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const recording = await importRecordingFromFile(file);
    console.log('导入成功:', recording);

    // 创建播放器回放
    const player = createPlayer({ recording });
    player.play();
  }
});

// 方式 2: 从 JSON 字符串反序列化
const json = localStorage.getItem('last-recording');
if (json) {
  const recording = deserializeRecording(json);
  console.log('加载成功:', recording);
}
```

---

## 在 Vue 3 中使用

### 完整示例：录制和回放

```vue
<template>
  <div class="playback-demo">
    <!-- 录制控制 -->
    <div class="controls">
      <button @click="startSession" :disabled="isRecording">开始录制</button>
      <button @click="saveRecording" :disabled="!hasRecording">保存录制</button>
      <span v-if="isRecording" class="recording-indicator">● 录制中</span>
    </div>

    <!-- 回放控制 -->
    <div v-if="currentRecording" class="playback-controls">
      <button @click="playRecording" :disabled="isPlaying">播放</button>
      <button @click="pausePlayback" :disabled="!isPlaying">暂停</button>
      <button @click="stopPlayback">停止</button>

      <label>
        速度: {{ playbackSpeed }}x
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          v-model.number="playbackSpeed"
          @input="updateSpeed"
        />
      </label>

      <div class="progress">
        <input
          type="range"
          :min="0"
          :max="duration"
          :value="currentTime"
          @input="seekTo"
        />
        <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
    </div>

    <!-- 文本显示区域 -->
    <div ref="textDisplayRef" class="text-display">
      <input ref="hiddenInputRef" type="text" />
      <div ref="cursorRef" class="cursor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue';
import {
  createSessionRuntime,
  createDomCursorAdapter,
  createDomInputController,
  createDomTextRenderer,
  createTextSource,
  createPlayer,
  exportRecordingToFile,
  type RecordingData,
  type Player
} from '@pitype/core';

const textDisplayRef = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const hiddenInputRef = ref<HTMLInputElement | null>(null);

const currentRecording = ref<RecordingData | null>(null);
const isRecording = ref(false);
const hasRecording = computed(() => currentRecording.value !== null);

const playbackSpeed = ref(1.0);
const currentTime = ref(0);
const duration = ref(0);
const isPlaying = ref(false);

let sessionRuntime: ReturnType<typeof createSessionRuntime>;
let textRenderer: ReturnType<typeof createDomTextRenderer>;
let cursorAdapter: ReturnType<typeof createDomCursorAdapter>;
let inputController: ReturnType<typeof createDomInputController>;
let player: Player | null = null;

function startSession() {
  const source = createTextSource('The quick brown fox jumps over the lazy dog.');

  textRenderer.render(source);
  cursorAdapter.cacheCharSpans();

  sessionRuntime.startSession(source);
  isRecording.value = true;

  inputController.focusInput();
}

function saveRecording() {
  const recording = sessionRuntime.getLastRecording();
  if (recording) {
    exportRecordingToFile(recording);
  }
}

function playRecording() {
  if (!currentRecording.value) return;

  if (!player) {
    player = createPlayer({
      recording: currentRecording.value,
      playbackSpeed: playbackSpeed.value,
      onEvent: (event, time) => {
        // 重现打字效果
        if (event.type === 'input:evaluate') {
          textRenderer.applySpanState(event.index, event.correct);
          cursorAdapter.updatePosition({ immediate: true });
        } else if (event.type === 'input:undo') {
          textRenderer.resetSpanState(event.index);
          cursorAdapter.updatePosition({ immediate: true });
        }
      },
      onProgress: (time, dur) => {
        currentTime.value = time;
        duration.value = dur;
      },
      onComplete: () => {
        isPlaying.value = false;
      }
    });
  }

  player.play();
  isPlaying.value = true;
}

function pausePlayback() {
  player?.pause();
  isPlaying.value = false;
}

function stopPlayback() {
  player?.stop();
  isPlaying.value = false;
  currentTime.value = 0;
}

function updateSpeed() {
  player?.setSpeed(playbackSpeed.value);
}

function seekTo(event: Event) {
  const time = (event.target as HTMLInputElement).valueAsNumber;
  player?.seek(time);
  currentTime.value = time;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

onMounted(() => {
  // 初始化 SessionRuntime（启用录制）
  sessionRuntime = createSessionRuntime({
    enableRecording: true,
    onEvaluate: (event) => {
      textRenderer.applySpanState(event.index, event.correct);
      cursorAdapter.scheduleRefresh();
    },
    onComplete: () => {
      isRecording.value = false;
      currentRecording.value = sessionRuntime.getLastRecording();
    }
  });

  // 初始化其他组件
  textRenderer = createDomTextRenderer(textDisplayRef.value!);

  cursorAdapter = createDomCursorAdapter({
    textDisplay: textDisplayRef.value!,
    getCurrentPosition: () => sessionRuntime.getSession()?.getState().position ?? 0,
    getCursor: () => cursorRef.value,
    getInput: () => hiddenInputRef.value,
    getSpans: () => textRenderer.getSpans()
  });

  inputController = createDomInputController({
    getTypingSession: () => sessionRuntime.getSession()
  });

  inputController.attachInput(hiddenInputRef.value);
});

onUnmounted(() => {
  sessionRuntime.dispose();
  inputController.destroy();
  player?.destroy();
});
</script>

<style scoped>
.recording-indicator {
  color: red;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.progress input[type="range"] {
  width: 100%;
}
</style>
```

---

## API 参考

### Recorder

#### `createRecorder(options?: RecorderOptions): Recorder`

创建录制器。

**选项**:
```typescript
interface RecorderOptions {
  id?: string;                    // 录制 ID（默认自动生成）
  includeMetadata?: boolean;      // 是否包含元数据（默认 true）
  customMetadata?: Record<string, any>;  // 自定义元数据
}
```

**方法**:
- `start(session, textSource)` - 开始录制
- `stop(finalStats?)` - 停止录制，返回录制数据
- `isRecording()` - 是否正在录制
- `getCurrentRecording()` - 获取当前录制数据（录制中）
- `clear()` - 清空录制数据

### Player

#### `createPlayer(options: PlayerOptions): Player`

创建播放器。

**选项**:
```typescript
interface PlayerOptions {
  recording: RecordingData;       // 录制数据
  playbackSpeed?: number;         // 播放速度（默认 1.0）
  onEvent?: (event, time) => void;     // 事件回调
  onComplete?: () => void;        // 完成回调
  onProgress?: (time, duration) => void;  // 进度回调
  progressInterval?: number;      // 进度更新间隔（默认 100ms）
}
```

**方法**:
- `play()` - 开始播放
- `pause()` - 暂停播放
- `resume()` - 恢复播放
- `stop()` - 停止并重置
- `seek(timestamp)` - 跳转到指定时间
- `setSpeed(speed)` - 设置播放速度（0.1-10x）
- `getSpeed()` - 获取播放速度
- `getCurrentTime()` - 获取当前播放时间
- `getDuration()` - 获取总时长
- `getState()` - 获取播放状态
- `isPlaying()` - 是否正在播放
- `destroy()` - 销毁播放器

### RecordingData

```typescript
interface RecordingData {
  id: string;                     // 录制 ID
  textSource: TextSource;         // 文本源
  events: TypingEvent[];          // 事件序列
  startTime: number;              // 开始时间（Unix 时间戳）
  endTime: number;                // 结束时间
  finalStats?: StatsSnapshot;     // 最终统计
  metadata?: {                    // 元数据
    version?: string;
    userAgent?: string;
    duration?: number;
    eventCount?: number;
    [key: string]: any;
  };
}
```

### 工具函数

- `serializeRecording(recording)` - 序列化为 JSON
- `deserializeRecording(json)` - 从 JSON 反序列化
- `exportRecordingToFile(recording, filename?)` - 导出为文件
- `importRecordingFromFile(file)` - 从文件导入
- `getRecordingStats(recording)` - 获取录制统计信息

---

## 使用场景

### 1. 教学演示

录制高级用户的打字过程，供初学者学习参考。

### 2. 性能分析

分析用户的打字模式，找出常见错误和改进点。

### 3. 成就分享

用户可以导出自己的高分录制，分享给朋友。

### 4. 自动化测试

录制标准的打字流程，用于自动化测试。

### 5. 数据收集

收集用户的打字数据用于研究和分析。

---

## 注意事项

1. **存储空间**: 录制数据包含所有事件和时间戳，较长的会话可能占用较多空间
2. **隐私保护**: 录制数据包含完整的打字过程，分享前请确保不包含敏感信息
3. **兼容性**: 导入录制数据时请确保版本兼容
4. **性能**: 回放时会触发所有事件回调，确保回调函数高效

---

## 完整示例

参考文件：
- `/packages/pitype-core/src/recorder.ts` - 录制器实现
- `/packages/pitype-core/src/player.ts` - 播放器实现
- `/packages/pitype-core/src/sessionRuntime.ts` - SessionRuntime 集成
