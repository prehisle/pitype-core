# Framework Integration Proposal for pitype-core

## Problem

Current design issues when integrating with Vue/React/Svelte:

1. **`textRenderer.render()` clears entire container**
   - Uses `innerHTML = ''` which removes ALL children
   - Destroys framework-managed elements (input, cursor)
   - Breaks framework reactivity

2. **Imperative DOM manipulation**
   - Assumes elements are created/destroyed imperatively
   - Conflicts with declarative framework templates

3. **Unclear textDisplay/textContainer separation**
   - Not intuitive why two refs are needed
   - Documentation lacks framework-specific guidance

## Current Status & Quick Links

- ✅ `preserveChildren` / `textContentClass` 选项已实现，详见 [docs/04接入指南.md](docs/04接入指南.md)。
- ✅ `examples/vue3-typerank3`、`examples/react-typerank3`、`examples/svelte-typerank3` 与 `examples/ts-typerank3` 已按照“文本内容与输入/光标分离”的架构改造，可作为直接模板。
- 🟡 `onCursorUpdate` 等 Hook 仍在规划，需要评估事件语义与性能。

| 场景                  | 推荐结构/脚本                                                                         | 参考                                                     |
| --------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Vue/React/Svelte 组件 | `text-content` 交给 renderer，input/cursor 由框架模板管理，开启 `preserveChildren`    | `examples/vue3-typerank3/src/components/TextDisplay.vue` |
| 纯 JS                 | 可沿用旧结构，但建议明确 `textContainer`/`textDisplay`，必要时开启 `preserveChildren` | `examples/typerank3/script.js`                           |
| 自定义渲染            | 依赖未来的 Hook（`onCursorUpdate` 等）把位置数据映射到响应式状态                      | 规划中                                                   |

## Proposed Solutions

### Solution 1: Add `preserveChildren` Option (Minimal Change)

```typescript
export interface DomTextRendererOptions {
  documentRef?: Document;
  preserveChildren?: boolean; // NEW: Don't clear non-text elements
  textContentClass?: string; // NEW: Class to identify text elements
}

export function createDomTextRenderer(
  textDisplay: HTMLElement,
  options: DomTextRendererOptions = {}
): DomTextRenderer {
  const preserveChildren = options.preserveChildren ?? false;
  const textContentClass = options.textContentClass ?? 'text-content';

  const render = (source: TextSource | null | undefined) => {
    if (!textDisplay || !source || !doc) return;

    if (preserveChildren) {
      // Remove only text-related elements
      const textElements = textDisplay.querySelectorAll(`.${textContentClass}, .word, .char`);
      textElements.forEach((el) => el.remove());

      // Insert new text at the beginning
      textDisplay.insertBefore(fragment, textDisplay.firstChild);
    } else {
      // Original behavior: clear everything
      textDisplay.innerHTML = '';
      textDisplay.appendChild(fragment);
    }

    charSpans = [];
  };
}
```

**Usage in Vue:**

```vue
<template>
  <div ref="textDisplay" class="text-display">
    <input ref="input" />
    <div ref="cursor" class="cursor" />
  </div>
</template>

<script setup>
const textRenderer = createDomTextRenderer(textDisplay.value, {
  preserveChildren: true // ← Don't destroy input/cursor
});
</script>
```

### Solution 2: Separate Text Content Container (Recommended)

Better approach: **Don't mix text content with UI elements**

```typescript
// NEW: Recommend this structure
<div class="text-container">
  <div class="text-content" ref="textContent"></div>  <!-- Only text here -->
  <input ref="input" />
  <div ref="cursor" class="cursor" />
</div>

// textRenderer only manages text-content
const textRenderer = createDomTextRenderer(textContentRef.value);
```

Then update `cursorAdapter` to handle nested structure:

```typescript
export interface DomCursorAdapterConfig {
  textDisplay: HTMLElement; // The text-content container
  textContainer: HTMLElement; // The outer container
  positionContext?: HTMLElement; // NEW: Where to position cursor (default: textContainer)
  // ...
}
```

### Solution 3: Framework-Friendly Cursor API

Instead of manipulating cursor styles directly, provide hooks:

```typescript
export interface DomCursorAdapterConfig {
  // ...
  onCursorUpdate?: (metrics: CursorMetrics) => void; // NEW
}

function updatePosition(options = {}) {
  const metrics = calculateCursorPosition();

  // Option 1: Traditional (current behavior)
  if (!config.onCursorUpdate) {
    applyCursorMetrics(metrics, cursor, input);
  }

  // Option 2: Let framework handle it
  else {
    config.onCursorUpdate(metrics);
  }
}
```

**Usage in Vue:**

```vue
<script setup>
const cursorStyle = ref({});

createDomCursorAdapter({
  // ...
  onCursorUpdate: (metrics) => {
    // Update reactive state instead of DOM
    cursorStyle.value = {
      transform: `translate3d(${metrics.left}px, ${metrics.top}px, 0)`,
      width: `${metrics.width}px`,
      height: `${metrics.height}px`
    };
  }
});
</script>

<template>
  <div class="cursor" :style="cursorStyle"></div>
</template>
```

## Recommended Architecture

### For Pure JS Apps (Current)

```
text-container
  └── text-display (managed by textRenderer)
      ├── [text spans] (added by render())
      ├── input (added dynamically)
      └── cursor (added dynamically)
```

### For Framework Apps (Recommended)

```
text-container (Vue component root)
  ├── text-display (managed by textRenderer)
  │   └── [text spans] (added by render())
  ├── input (Vue template)
  └── cursor (Vue template)
```

## Implementation Priority

1. **Phase 1 (Quick Fix)**: Add `preserveChildren` option
   - Minimal breaking changes
   - Solves immediate Vue integration issue
   - Keep backward compatibility

2. **Phase 2 (Better Design)**: Document recommended structure
   - Update examples
   - Add framework-specific guides
   - Recommend separate text-content container

3. **Phase 3 (Advanced)**: Add framework hooks
   - `onCursorUpdate` callback
   - More flexible APIs
   - Support for custom rendering strategies

## Benefits

1. ✅ Works with all major frameworks (Vue, React, Svelte)
2. ✅ Preserves framework reactivity
3. ✅ Backward compatible (preserveChildren defaults to false)
4. ✅ Cleaner separation of concerns
5. ✅ Better testability

## Migration Guide

### For Existing Pure JS Apps

No changes needed - default behavior unchanged.

### For New Framework Integrations

**Before:**

```js
// Had to manually append after render()
textRenderer.render(source);
textDisplay.appendChild(input);
textDisplay.appendChild(cursor);
```

**After (Option 1):**

```js
// Elements preserved automatically
const textRenderer = createDomTextRenderer(textDisplay, {
  preserveChildren: true
});
textRenderer.render(source); // input/cursor not touched
```

**After (Option 2 - Recommended):**

```html
<!-- Separate text container -->
<div class="text-display">
  <div ref="textContent" class="text-content"></div>
  <input ref="input" />
  <div ref="cursor" class="cursor" />
</div>

<script>
  const textRenderer = createDomTextRenderer(textContent);
  // No need to re-append - they're siblings
</script>
```

## Open Questions

1. Should we make `preserveChildren: true` the default in v2.0?
2. Should we deprecate putting input/cursor inside text container?
3. Do we need a `@pitype/vue` wrapper package?

## Example: Vue3 Integration

See `examples/vue3-typerank3` for full implementation using current workaround.

With proposed changes:

- No need to manually appendChild after render()
- Cleaner template structure
- Better TypeScript support

## Action Checklist

- [ ] 在 React/Svelte 示例中复刻 `text-content + preserveChildren` 模式，并记录差异化实现。
- [ ] 设计并实现 `onCursorUpdate`/`onTextRender` Hook API，配套 Vitest 契约测试。
- [ ] 更新 `docs/04接入指南.md` 与 README，加入上述架构图与 Hook 使用示例。
- [ ] 在 Playwright 基线中新增针对 `preserveChildren` 的用例，验证 input/cursor 不会被移除。
