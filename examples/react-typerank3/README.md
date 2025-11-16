# React TypeRank3

基于 React 18 的打字练习应用，完整复刻 ts-typerank3 的所有功能。

## 特性

- **React 18** - 使用最新的 React 特性
- **TypeScript** - 完整的类型安全
- **Vite** - 快速的开发体验和 HMR
- **pitype-core** - 使用核心打字引擎（workspace 依赖）
- **多语言** - 支持简体中文、繁体中文、英文
- **多主题** - 5 个精美主题（Dracula、Serika、Botanical、Aether、Nord）
- **响应式设计** - 完美适配移动端

## 技术栈

- React 18.3+
- TypeScript 5.6+
- Vite 5.4+
- pitype-core 1.0.0

## 快速开始

### 前置条件

需要先构建核心包：

```bash
# 在项目根目录
npm run build:core
```

### 开发

```bash
# 在项目根目录（推荐）
npm run react-demo:dev

# 或在当前目录
npm run dev
```

访问 http://localhost:5174

### 构建

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

## 项目结构

```
src/
├── components/          # React 组件
│   ├── Cursor.tsx       # 光标组件
│   ├── InputField.tsx   # 输入框组件
│   ├── TextDisplay.tsx  # 文本显示组件（核心）
│   ├── Header.tsx       # 顶部栏
│   ├── StatsPanel.tsx   # 统计面板
│   ├── LanguageSelector.tsx  # 语言选择器
│   ├── ThemeSelector.tsx     # 主题选择器
│   ├── ResultModal.tsx       # 结果弹窗
│   └── InfoModal.tsx         # 信息弹窗
├── contexts/            # React Context
│   ├── LanguageContext.tsx   # 多语言上下文
│   └── ThemeContext.tsx      # 主题上下文
├── hooks/               # 自定义 Hooks
│   ├── useTypingSession.ts   # 会话管理 Hook
│   ├── useTextRenderer.ts    # 文本渲染 Hook
│   ├── useCursorAdapter.ts   # 光标适配 Hook
│   └── useInputController.ts # 输入控制 Hook
├── language.ts          # 多语言资源定义
├── texts.ts             # 练习文本库（50+ 文本）
├── App.tsx              # 根组件
└── main.tsx             # 入口文件
```

## 架构设计

### Context 架构

- **LanguageContext** - 管理多语言状态，提供 `getText` 方法
- **ThemeContext** - 管理主题状态，自动应用 CSS 类

### Hooks 封装

所有 pitype-core 的 API 都通过自定义 Hooks 封装，实现了：

- **useTypingSession** - 封装 SessionRuntime，管理会话生命周期
- **useTextRenderer** - 封装 DomTextRenderer，处理文本渲染
- **useCursorAdapter** - 封装 DomCursorAdapter，管理光标位置
- **useInputController** - 封装 DomInputController，处理输入事件

### 性能优化

- 使用 `React.memo` 优化组件渲染
- 使用 `useCallback` 缓存回调函数
- 使用 `useMemo` 缓存计算结果
- pitype-core 直接操作 DOM，避免触发 React 重渲染

## 与 ts-typerank3 的对比

| 特性     | ts-typerank3              | react-typerank3              |
| -------- | ------------------------- | ---------------------------- |
| 框架     | 原生 TypeScript           | React 18                     |
| DOM 操作 | `document.getElementById` | React Refs                   |
| 状态管理 | 闭包变量                  | React Hooks + Context        |
| 组件化   | 函数式模块                | React 组件                   |
| 事件绑定 | `addEventListener`        | React 事件系统 + pitype-core |
| 构建工具 | Vite                      | Vite + React 插件            |

## 开发说明

### 热更新

- 修改 React 组件 → HMR 即时更新（< 100ms）
- 修改 pitype-core 源码 → 自动重新编译 + 重载（~700ms）

### Ref 使用

TextDisplay 组件使用多个 Ref 与 pitype-core 交互：

```tsx
const textDisplayRef = useRef<HTMLDivElement>(null); // 文本容器
const cursorRef = useRef<HTMLDivElement>(null); // 光标元素
const inputRef = useRef<HTMLInputElement>(null); // 输入框
```

### 生命周期时序

确保 pitype-core 在 DOM 完全挂载后初始化：

```tsx
useEffect(() => {
  // 渲染文本
  render(source);

  // 启动会话
  startSession(text, locale, textId);

  // 多层 RAF 确保 DOM 完全更新
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        cursorAdapter.cacheCharSpans();
        // ...
      });
    });
  });
}, [text, textId, locale]);
```

## License

MIT
