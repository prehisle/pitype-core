# 光标配置功能使用指南

## 概述

Pitype Core 现在支持完整的光标外观自定义功能，包括：

- **4 种光标形状**: `block`（方块）、`line`（竖线）、`underline`（下划线）、`outline`（轮廓）
- **自定义颜色**: 支持任何有效的 CSS 颜色值
- **闪烁效果**: 可配置的光标闪烁动画
- **自动持久化**: 配置自动保存到 localStorage

---

## 快速开始

### 1. 引入必要的模块和样式

```typescript
import { createDomCursorAdapter, type CursorShape } from 'pitype-core';

// 确保引入光标样式
import './cursor-styles.css'; // 或使用你自己的样式
```

### 2. 创建光标适配器时配置

```typescript
const cursorAdapter = createDomCursorAdapter({
  textDisplay: document.getElementById('text-display'),
  getCurrentPosition: () => session.getPosition(),
  getCursor: () => document.getElementById('cursor'),
  getInput: () => document.getElementById('input'),

  // === 新增配置选项 ===
  cursorShape: 'line',           // 光标形状
  cursorColor: '#61dafb',        // 光标颜色
  cursorBlinkEnabled: true,      // 启用闪烁
  cursorBlinkRate: 530           // 闪烁周期（毫秒）
});
```

### 3. 动态修改光标配置

```typescript
// 修改光标形状
cursorAdapter.setCursorShape('outline');

// 修改光标颜色
cursorAdapter.setCursorColor('#ff6b6b');

// 切换闪烁效果
cursorAdapter.setCursorBlink(true);

// 读取当前配置
console.log(cursorAdapter.getCursorShape());    // 'outline'
console.log(cursorAdapter.getCursorColor());    // '#ff6b6b'
console.log(cursorAdapter.getCursorBlink());    // true
```

---

## CSS 样式配置

### 基础光标样式（必需）

```css
.cursor {
  position: absolute;
  pointer-events: none;
  will-change: transform, width, height;
  z-index: 2;
}

.cursor-visible {
  opacity: 1;
}
```

### 光标形状样式

```css
/* 方块光标（默认） */
.cursor-block {
  background-color: var(--cursor-color, #ffd700);
  border-radius: 2px;
}

/* 竖线光标 */
.cursor-line {
  background-color: var(--cursor-color, #ffd700);
  border-radius: 1px;
}

/* 下划线光标 */
.cursor-underline {
  background-color: var(--cursor-color, #ffd700);
  border-radius: 1px;
}

/* 轮廓光标（空心） */
.cursor-outline {
  background-color: transparent;
  border: 2px solid var(--cursor-color, #ffd700);
  border-radius: 2px;
  box-sizing: border-box;
}
```

### 闪烁动画

```css
@keyframes cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
```

---

## 在 Vue 3 中使用

```vue
<template>
  <div class="cursor-settings">
    <label>光标形状:</label>
    <select v-model="cursorShape" @change="updateCursorShape">
      <option value="block">方块</option>
      <option value="line">竖线</option>
      <option value="underline">下划线</option>
      <option value="outline">轮廓</option>
    </select>

    <label>光标颜色:</label>
    <input type="color" v-model="cursorColor" @input="updateCursorColor" />

    <label>
      <input type="checkbox" v-model="cursorBlink" @change="updateCursorBlink" />
      启用闪烁
    </label>
  </div>

  <!-- 文本显示区域 -->
  <div ref="textDisplayRef" class="text-display">
    <input ref="hiddenInputRef" type="text" />
    <div ref="cursorRef" class="cursor" />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue';
import { createDomCursorAdapter, type CursorShape } from 'pitype-core';

const textDisplayRef = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const hiddenInputRef = ref<HTMLInputElement | null>(null);

const cursorAdapter = shallowRef<ReturnType<typeof createDomCursorAdapter>>();
const cursorShape = ref<CursorShape>('block');
const cursorColor = ref('#ffd700');
const cursorBlink = ref(false);

function updateCursorShape() {
  cursorAdapter.value?.setCursorShape(cursorShape.value);
}

function updateCursorColor() {
  cursorAdapter.value?.setCursorColor(cursorColor.value);
}

function updateCursorBlink() {
  cursorAdapter.value?.setCursorBlink(cursorBlink.value);
}

onMounted(() => {
  cursorAdapter.value = createDomCursorAdapter({
    textDisplay: textDisplayRef.value!,
    getCurrentPosition: () => 0, // 实际使用时替换
    getCursor: () => cursorRef.value,
    getInput: () => hiddenInputRef.value,

    // 初始配置
    cursorShape: cursorShape.value,
    cursorColor: cursorColor.value,
    cursorBlinkEnabled: cursorBlink.value
  });

  // 读取已保存的配置
  cursorShape.value = cursorAdapter.value.getCursorShape();
  cursorColor.value = cursorAdapter.value.getCursorColor() || '#ffd700';
  cursorBlink.value = cursorAdapter.value.getCursorBlink();
});
</script>
```

---

## API 参考

### `DomCursorAdapterOptions`

新增的配置选项：

```typescript
interface DomCursorAdapterOptions {
  // ... 原有选项 ...

  /** 光标形状：'block' | 'line' | 'underline' | 'outline' */
  cursorShape?: CursorShape;

  /** 光标颜色（任何有效的 CSS 颜色） */
  cursorColor?: string;

  /** 是否启用闪烁效果 */
  cursorBlinkEnabled?: boolean;

  /** 闪烁周期（毫秒），默认 530ms */
  cursorBlinkRate?: number;
}
```

### `DomCursorAdapter` 接口

新增的方法：

```typescript
interface DomCursorAdapter {
  // ... 原有方法 ...

  /** 设置光标形状 */
  setCursorShape(shape: CursorShape): void;

  /** 设置光标颜色 */
  setCursorColor(color: string): void;

  /** 设置光标闪烁 */
  setCursorBlink(enabled: boolean): void;

  /** 获取当前光标形状 */
  getCursorShape(): CursorShape;

  /** 获取当前光标颜色 */
  getCursorColor(): string | null;

  /** 获取当前闪烁状态 */
  getCursorBlink(): boolean;
}
```

### `CursorShape` 类型

```typescript
type CursorShape = 'block' | 'line' | 'underline' | 'outline';
```

---

## 持久化

所有光标配置会自动保存到 `localStorage`，使用以下键：

- `cursorShape` - 光标形状
- `cursorColor` - 光标颜色
- `cursorBlinkEnabled` - 闪烁开关

用户下次访问时会自动恢复之前的配置。

---

## 注意事项

1. **CSS 依赖**: 确保引入了正确的 CSS 样式，否则光标形状可能无法正确显示
2. **颜色格式**: 支持所有 CSS 颜色格式（十六进制、RGB、HSL、颜色名称等）
3. **性能**: 闪烁动画使用 CSS animation，性能开销极小
4. **无障碍**: 自动尊重用户的 `prefers-reduced-motion` 设置

---

## 示例效果

```typescript
// 经典终端风格
cursorAdapter.setCursorShape('block');
cursorAdapter.setCursorColor('#00ff00');
cursorAdapter.setCursorBlink(true);

// 现代编辑器风格
cursorAdapter.setCursorShape('line');
cursorAdapter.setCursorColor('#61dafb');
cursorAdapter.setCursorBlink(false);

// 极简下划线风格
cursorAdapter.setCursorShape('underline');
cursorAdapter.setCursorColor('#ff6b6b');
cursorAdapter.setCursorBlink(false);

// 空心轮廓风格
cursorAdapter.setCursorShape('outline');
cursorAdapter.setCursorColor('#9b59b6');
cursorAdapter.setCursorBlink(true);
```

---

## 完整示例

参考文件：
- `/packages/pitype-core/cursor-styles.css` - CSS 样式参考
- `/examples/vue3-typerank3/src/App.vue` - Vue 3 集成示例
