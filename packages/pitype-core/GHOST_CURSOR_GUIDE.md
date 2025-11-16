# 幽灵光标功能使用指南

## 概述

幽灵光标（Ghost Cursor）是一个强大的功能，允许在当前打字练习中同时显示历史录制的光标移动。这创造了一种"与幽灵对战"的体验，类似于赛车游戏中的幽灵车系统。

## 🎯 应用场景

- **竞技对战**: 与朋友或高手的历史成绩实时比拼
- **教学演示**: 学生跟着老师的录制回放同步学习
- **自我提升**: 与自己的历史最佳成绩竞赛
- **娱乐互动**: 增加打字练习的趣味性和挑战性

---

## 🚀 快速开始

### 基础用法

```typescript
import { createGhostManager, type RecordingData } from 'pitype-core';

// 1. 创建幽灵管理器
const ghostManager = createGhostManager({
  textDisplay: document.getElementById('text-display')!,
  textContainer: document.getElementById('text-container'),
  getSpans: () => textRenderer.getSpans()
});

// 2. 添加幽灵（使用历史录制数据）
const ghostId = ghostManager.addGhost({
  name: '用户A',
  recording: recordingA,  // 历史录制数据
  color: 'rgba(255, 0, 0, 0.8)',  // 红色光标
  shape: 'line',
  showLabel: true  // 显示名称标签
});

// 3. 开始打字练习时，启动所有幽灵
sessionRuntime.startSession(source);
ghostManager.startAll();

// 4. 练习结束后，停止幽灵
ghostManager.stopAll();

// 5. 清理资源
ghostManager.destroy();
```

---

## 📚 API 参考

### `createGhostManager(options: GhostManagerOptions): GhostManager`

创建幽灵管理器。

#### GhostManagerOptions

```typescript
interface GhostManagerOptions {
  /** 文本显示容器 */
  textDisplay: HTMLElement;

  /** 文本滚动容器（可选） */
  textContainer?: HTMLElement | null;

  /** 获取文本字符元素列表 */
  getSpans: () => HTMLElement[];

  /** 幽灵完成时是否自动移除（默认 false） */
  autoRemoveOnComplete?: boolean;

  /** 幽灵完成时的回调 */
  onGhostComplete?: (ghostId: string) => void;
}
```

### GhostManager 方法

#### `addGhost(config: GhostConfig): string`

添加一个幽灵，返回幽灵 ID。

```typescript
interface GhostConfig {
  /** 幽灵名称 */
  name: string;

  /** 录制数据 */
  recording: RecordingData;

  /** 光标颜色（可选，默认金色） */
  color?: string;

  /** 光标形状（可选，默认 'line'） */
  shape?: CursorShape;

  /** 光标透明度 0-1（可选，默认 0.6） */
  opacity?: number;

  /** 是否显示名称标签（可选，默认 false） */
  showLabel?: boolean;
}
```

#### 其他方法

```typescript
// 移除幽灵
removeGhost(ghostId: string): void

// 获取幽灵
getGhost(ghostId: string): Ghost | undefined

// 获取所有幽灵
getAllGhosts(): Ghost[]

// 启动所有幽灵
startAll(): void

// 暂停所有幽灵
pauseAll(): void

// 恢复所有幽灵
resumeAll(): void

// 停止所有幽灵
stopAll(): void

// 设置所有幽灵的播放速度
setSpeedAll(speed: number): void

// 清理所有幽灵
destroy(): void
```

---

## 💡 完整示例

### 多幽灵对战

```typescript
import {
  createGhostManager,
  createSessionRuntime,
  createTextSource,
  type RecordingData
} from 'pitype-core';

// 假设有多个历史录制
const recordings: RecordingData[] = [recordingA, recordingB, recordingC];

// 创建幽灵管理器
const ghostManager = createGhostManager({
  textDisplay: textDisplayRef.value!,
  textContainer: textContainerRef.value!,
  getSpans: () => textRenderer.getSpans(),
  onGhostComplete: (ghostId) => {
    console.log(`幽灵 ${ghostId} 完成了练习`);
  }
});

// 添加多个幽灵（不同颜色）
const colors = [
  'rgba(255, 99, 132, 0.8)',  // 粉红
  'rgba(54, 162, 235, 0.8)',  // 蓝色
  'rgba(255, 206, 86, 0.8)'   // 黄色
];

recordings.forEach((recording, index) => {
  ghostManager.addGhost({
    name: `幽灵 #${index + 1}`,
    recording: recording,
    color: colors[index],
    shape: 'line',
    showLabel: true
  });
});

// 启动会话和幽灵
const source = createTextSource('Hello World');
sessionRuntime.startSession(source);
ghostManager.startAll();

// 练习完成后
ghostManager.stopAll();
ghostManager.destroy();
```

### 与 SessionRuntime 集成

```typescript
const sessionRuntime = createSessionRuntime({
  enableRecording: true,
  onComplete: (snapshot) => {
    // 停止幽灵
    ghostManager.stopAll();

    // 保存当前录制为新的幽灵候选
    const newRecording = sessionRuntime.getLastRecording();
    if (newRecording) {
      savedRecordings.push(newRecording);
    }
  }
});
```

---

## 🎨 Vue 3 集成示例

### 组件实现

```vue
<template>
  <div class="ghost-battle">
    <!-- 幽灵选择器 -->
    <div class="ghost-selector">
      <h3>选择幽灵对手</h3>
      <div v-for="(recording, index) in savedRecordings" :key="index">
        <label>
          <input
            type="checkbox"
            :checked="selectedGhosts.includes(index)"
            @change="toggleGhost(index)"
          />
          幽灵 #{{ index + 1 }} ({{ recording.events.length }} 个事件)
        </label>
        <input
          type="color"
          v-model="ghostColors[index]"
          @change="updateGhostColor(index)"
        />
      </div>
    </div>

    <!-- 文本显示区域 -->
    <div ref="textDisplayRef" class="text-display">
      <div ref="cursorRef" class="cursor" />
      <!-- 幽灵光标会动态添加到这里 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import {
  createGhostManager,
  createSessionRuntime,
  type GhostManager,
  type RecordingData
} from 'pitype-core';

const textDisplayRef = ref<HTMLElement | null>(null);
const textContainerRef = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);

const savedRecordings = ref<RecordingData[]>([]);
const selectedGhosts = ref<number[]>([]);
const ghostColors = ref<string[]>([
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 206, 86, 0.8)'
]);

const ghostManager = shallowRef<GhostManager | null>(null);

function toggleGhost(index: number) {
  const idx = selectedGhosts.value.indexOf(index);
  if (idx > -1) {
    selectedGhosts.value.splice(idx, 1);
  } else {
    selectedGhosts.value.push(index);
  }
}

function updateGhostColor(index: number) {
  // 颜色更新逻辑
}

function initializeGhosts() {
  if (!ghostManager.value) return;

  // 清除旧幽灵
  ghostManager.value.destroy();

  // 重新创建管理器
  ghostManager.value = createGhostManager({
    textDisplay: textDisplayRef.value!,
    textContainer: textContainerRef.value!,
    getSpans: () => textRenderer.getSpans()
  });

  // 添加选中的幽灵
  selectedGhosts.value.forEach(index => {
    ghostManager.value!.addGhost({
      name: `幽灵 #${index + 1}`,
      recording: savedRecordings.value[index],
      color: ghostColors.value[index],
      shape: 'line',
      showLabel: true
    });
  });
}

function startBattle() {
  // 初始化幽灵
  initializeGhosts();

  // 启动会话
  sessionRuntime.startSession(source);

  // 启动幽灵
  ghostManager.value?.startAll();
}

onMounted(() => {
  ghostManager.value = createGhostManager({
    textDisplay: textDisplayRef.value!,
    textContainer: textContainerRef.value!,
    getSpans: () => textRenderer.getSpans()
  });
});

onUnmounted(() => {
  ghostManager.value?.destroy();
});
</script>

<style scoped>
.ghost-cursor {
  opacity: 0.6;
  pointer-events: none;
}

.ghost-label {
  position: absolute;
  font-size: 12px;
  font-weight: bold;
  pointer-events: none;
}
</style>
```

---

## 🎨 CSS 样式

### 基础样式

```css
/* 幽灵光标 */
.ghost-cursor {
  position: absolute;
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
  will-change: transform;
}

/* 幽灵名称标签 */
.ghost-label {
  position: absolute;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.8);
  color: #000;
  pointer-events: none;
  white-space: nowrap;
  z-index: 3;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* 不同颜色的幽灵光标 */
.ghost-cursor[data-ghost-name="用户A"] {
  background-color: rgba(255, 99, 132, 0.8);
}

.ghost-cursor[data-ghost-name="用户B"] {
  background-color: rgba(54, 162, 235, 0.8);
}

.ghost-cursor[data-ghost-name="用户C"] {
  background-color: rgba(255, 206, 86, 0.8);
}
```

---

## ⚙️ 高级用法

### 动态速度控制

```typescript
// 让幽灵以 2x 速度播放
ghostManager.setSpeedAll(2.0);

// 让幽灵慢速播放
ghostManager.setSpeedAll(0.5);
```

### 单独控制幽灵

```typescript
// 获取特定幽灵
const ghost = ghostManager.getGhost(ghostId);

// 控制单个幽灵的播放器
if (ghost) {
  ghost.player.pause();
  ghost.player.setSpeed(1.5);
  ghost.player.resume();
}
```

### 自动移除完成的幽灵

```typescript
const ghostManager = createGhostManager({
  textDisplay: element,
  getSpans: () => spans,
  autoRemoveOnComplete: true,  // 自动移除
  onGhostComplete: (ghostId) => {
    console.log(`幽灵 ${ghostId} 已完成并移除`);
  }
});
```

---

## 📊 完整工作流程

### 1. 录制阶段

```typescript
// 启用录制
const sessionRuntime = createSessionRuntime({
  enableRecording: true
});

// 用户完成练习
sessionRuntime.startSession(source);
// ... 用户打字 ...

// 获取录制
const recording = sessionRuntime.getLastRecording();

// 保存录制（例如到 localStorage）
savedRecordings.push(recording);
localStorage.setItem('recordings', JSON.stringify(savedRecordings));
```

### 2. 幽灵对战阶段

```typescript
// 加载历史录制
const savedRecordings = JSON.parse(localStorage.getItem('recordings') || '[]');

// 创建幽灵管理器
const ghostManager = createGhostManager({
  textDisplay: element,
  getSpans: () => spans
});

// 用户选择要对战的幽灵
savedRecordings.forEach((recording, index) => {
  if (userSelected(index)) {
    ghostManager.addGhost({
      name: `对手 #${index + 1}`,
      recording: recording,
      color: colors[index],
      showLabel: true
    });
  }
});

// 开始对战
sessionRuntime.startSession(source);
ghostManager.startAll();
```

### 3. 清理阶段

```typescript
// 练习完成
sessionRuntime.getSession()?.subscribe(event => {
  if (event.type === 'session:complete') {
    ghostManager.stopAll();

    // 可选：保存新录制作为新的幽灵候选
    const newRecording = sessionRuntime.getLastRecording();
    if (newRecording) {
      savedRecordings.push(newRecording);
    }
  }
});

// 组件卸载时清理
onUnmounted(() => {
  ghostManager.destroy();
});
```

---

## 🎯 最佳实践

1. **限制幽灵数量**: 建议同时显示不超过 3-5 个幽灵，避免视觉混乱
2. **使用不同颜色**: 为每个幽灵分配明显不同的颜色，便于区分
3. **显示名称标签**: 启用 `showLabel` 帮助用户识别幽灵
4. **保存录制历史**: 将优秀的录制保存下来作为幽灵候选
5. **性能优化**: 大量幽灵时考虑使用较低的透明度或关闭标签

---

## 🐛 常见问题

### Q: 幽灵光标不显示？

**A**: 检查以下几点：
1. 确保录制数据有效
2. 确保 `getSpans()` 返回正确的字符元素
3. 检查 CSS 样式是否正确加载
4. 确保在会话启动后调用 `startAll()`

### Q: 幽灵光标位置不准确？

**A**: 确保：
1. 文本渲染完成后再初始化幽灵
2. 调用 `cursorAdapter.cacheCharSpans()` 缓存字符元素
3. 录制数据的文本源与当前文本相同

### Q: 如何实现幽灵排行榜？

**A**: 结合录制数据的统计信息：

```typescript
import { getRecordingStats } from 'pitype-core';

// 获取录制统计
const stats = getRecordingStats(recording);

// 按速度排序
const ranked = savedRecordings
  .map(r => ({ recording: r, stats: getRecordingStats(r) }))
  .sort((a, b) => b.stats.duration - a.stats.duration);

// 显示前 3 名作为幽灵
ranked.slice(0, 3).forEach((item, index) => {
  ghostManager.addGhost({
    name: `第 ${index + 1} 名`,
    recording: item.recording,
    color: medalColors[index]
  });
});
```

---

## 📚 相关文档

- [录制功能指南](./PLAYBACK_GUIDE.md) - 了解如何录制和回放
- [光标配置指南](./CURSOR_CONFIG_GUIDE.md) - 自定义光标外观
- [Vue 3 集成示例](../../examples/vue3-typerank3/NEW_FEATURES.md) - 完整的 Vue 3 示例

---

## 🎉 完整示例项目

参考 `examples/vue3-typerank3` 查看完整的幽灵光标实现，包括：
- 历史录制管理
- 幽灵选择 UI
- 颜色自定义
- 实时对战体验
