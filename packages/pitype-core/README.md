# pitype-core

无 UI 的打字练习引擎，提供核心功能模块。

## 特性

- **Headless 设计** - 不依赖任何 UI 框架，可集成到任何前端项目
- **TypeScript 编写** - 完整的类型定义和类型安全
- **模块化架构** - 各模块职责清晰，可独立使用
- **高性能** - 优化的文本分词和状态管理

## 安装

```bash
npm install pitype-core
```

## 样式与主题（可选）

引擎保持 headless，但提供一份可选的基础样式与主题变量：

```ts
// 在你的入口文件中按需引入（支持 ESM）
import 'pitype-core/styles/pitype-core.css';
```

- 核心结构/状态类统一使用 `pitype-` 前缀（`.pitype-text-container`、`.pitype-text-display`、`.pitype-cursor-visible`、`.pitype-input` 等）。`createDomTextRenderer`、`createDomInputController` 不强制添加类名，宿主需在对应元素上自行添加。
- 内置主题变量同样前缀化（如 `--pitype-bg-color`、`--pitype-accent-color`），默认主题：`dracula | serika | botanical | aether | nord`。调用 `createDomThemeController` 时会在目标元素上添加 `pitype-theme-<name>`（兼容旧的 `theme-<name>`）。
- 可通过覆盖 `--pitype-*` 变量或新增 `.pitype-theme-yourbrand { ... }` 并传入 `themes` 配置扩展自定义配色。
- 如果你在本仓库内开发 demo，需为打包器提供样式解析别名：
  - **Vite**（React/TS/Vue），示例：
    ```ts
    resolve: {
      alias: [
        {
          find: /^pitype-core\/styles\/(.*)$/,
          replacement: path.resolve(__dirname, '../../packages/pitype-core/styles/$1')
        },
        {
          find: 'pitype-core/styles',
          replacement: path.resolve(__dirname, '../../packages/pitype-core/styles')
        },
        {
          find: 'pitype-core',
          replacement: path.resolve(__dirname, '../../packages/pitype-core/dist/index.js')
        }
      ];
    }
    ```
  - **Next.js**，在 `next.config.mjs` 的 `webpack` 中添加：
    ```js
    config.resolve.alias['pitype-core/styles'] = path.resolve(
      __dirname,
      '../../packages/pitype-core/styles'
    );
    config.resolve.alias['pitype-core'] = path.resolve(
      __dirname,
      '../../packages/pitype-core/dist/index.js'
    );
    ```
    这样本地示例可直接 `import 'pitype-core/styles/pitype-core.css'`，无需发布到 NPM。

## 核心模块

### 文本处理

#### `tokenizeText(text: string, options?: TokenizeOptions): TextToken[]`

将文本分词为 token 数组，支持中英文混合文本。

```typescript
import { tokenizeText } from 'pitype-core';

const tokens = tokenizeText('Hello 世界', { locale: 'zh-CN' });
// 返回包含每个字符/单词信息的 token 数组
```

**参数:**

- `text`: 待分词的文本
- `options`: 可选配置
  - `locale`: 语言环境 (如 'en', 'zh-CN')

**返回:** `TextToken[]` - token 数组，每个 token 包含:

- `text`: 字符内容
- `type`: token 类型 ('word', 'space', 'punctuation')
- `wordBoundary`: 是否为单词边界

---

#### `createTextSource(text: string, options?: TextSourceOptions): TextSource`

创建文本源对象，管理练习文本。

```typescript
import { createTextSource } from 'pitype-core';

const source = createTextSource('The quick brown fox', {
  id: 'text-1',
  locale: 'en'
});

console.log(source.getTokens());
console.log(source.getLength());
```

**参数:**

- `text`: 练习文本
- `options`: 可选配置
  - `id`: 文本唯一标识
  - `locale`: 语言环境

**返回:** `TextSource` 对象，提供方法:

- `getText()`: 获取原始文本
- `getTokens()`: 获取 token 数组
- `getLength()`: 获取字符总数
- `getMetadata()`: 获取元数据

### 会话管理

#### `TypingSession`

核心打字会话类，管理输入状态和评估逻辑。

```typescript
import { TypingSession, createTextSource } from 'pitype-core';

const source = createTextSource('Hello World');
const session = new TypingSession(source);

// 输入字符
session.input('H'); // 返回评估结果
session.input('e');

// 回退
session.backspace();

// 获取状态
const state = session.getState();
console.log(state.position, state.isCompleted);
```

**主要方法:**

- `input(char: string)`: 输入字符并评估
- `backspace()`: 回退一个字符
- `getState()`: 获取当前状态
- `reset()`: 重置会话

---

#### `createSessionRuntime(callbacks: SessionRuntimeCallbacks): SessionRuntime`

创建会话运行时，处理会话生命周期和统计追踪。

```typescript
import { createSessionRuntime, createTextSource } from 'pitype-core';

const runtime = createSessionRuntime({
  onEvaluate: (event) => {
    console.log('字符评估:', event);
  },
  onUndo: (event) => {
    console.log('撤销输入:', event);
  },
  onComplete: (snapshot) => {
    console.log('练习完成:', snapshot);
  },
  onSnapshot: (snapshot) => {
    console.log('统计更新:', snapshot);
  }
});

const source = createTextSource('Practice text');
runtime.startSession(source);

// 获取当前会话
const session = runtime.getSession();

// 获取最新统计快照
const stats = runtime.getLatestSnapshot();
```

**回调参数:**

- `onEvaluate`: 字符评估时触发
- `onUndo`: 回退时触发
- `onComplete`: 完成时触发，接收最终统计快照
- `onSnapshot`: 统计更新时触发 (每秒一次)
- `onReset`: 会话重置时触发

### 统计追踪

#### `createStatsTracker(session: TypingSession): StatsTracker`

创建统计追踪器，实时计算 CPM/WPM/准确率等指标。

```typescript
import { createStatsTracker } from 'pitype-core';

const tracker = createStatsTracker(session);

// 获取实时快照
const snapshot = tracker.snapshot();
console.log(snapshot.cpm, snapshot.wpm, snapshot.accuracy);
```

**统计指标:**

- `cpm`: 每分钟正确字符数 (Characters Per Minute)
- `totalCpm`: 每分钟总字符数 (包括错误)
- `wpm`: 每分钟单词数 (Words Per Minute，cpm / 5)
- `accuracy`: 准确率百分比
- `elapsed`: 已用时间 (毫秒)
- `totalChars`: 总字符数
- `correctChars`: 正确字符数
- `incorrectChars`: 错误字符数

### DOM 适配器

#### `createDomTextRenderer(textDisplay: HTMLElement, options?: DomTextRendererOptions): DomTextRenderer`

渲染文本源到 DOM，并提供行高亮、状态标记和中文排版禁则支持。

```typescript
import { createDomTextRenderer } from 'pitype-core';

const textRenderer = createDomTextRenderer(document.getElementById('text-display')!, {
  lineBreakOptions: {
    // 追加需要贴靠前一个字符的符号（默认已包含常见中文标点）
    attachToPreviousChars: ['%'],
    // 需要与后一个字符保持同一行的符号（适用于开引号、货币符号等）
    attachToNextChars: ['￥'],
    // 通过 matcher 自定义任意组合
    matchers: [
      ({ token, previousToken }) => {
        if (token.char === '度' && previousToken?.language === 'english') {
          return { attachToPrevious: true };
        }
      }
    ]
  }
});

textRenderer.render(createTextSource('稳定的节奏胜过瞬间的爆发。'));
```

**说明：**

- 未提供 `lineBreakOptions` 时，renderer 会自动让常见中文闭合标点（句号、逗号、问号等）贴靠前一个字符，开口符号（如 `“`、`（`）贴靠后一个字符，避免出现在行首/行尾。
- `lineBreakOptions.attachToPreviousChars` / `attachToNextChars` 接受字符数组，可扩展任何禁则字符。
- `lineBreakOptions.matchers` 提供回调 `(context) => LineBreakDecision`，可根据上下文（前后 token）动态设置贴靠方向，覆盖更复杂的场景（数字+单位、复合符号等）。
- 所有禁则都会为相关节点添加 `.no-break` class，可在样式中自定义表现。

#### `createDomInputController(options: DomInputControllerOptions): DomInputController`

创建 DOM 输入控制器，处理浏览器输入事件。

```typescript
import { createDomInputController } from 'pitype-core';

const inputController = createDomInputController({
  getTypingSession: () => currentSession,
  isResultModalVisible: () => modalVisible,
  onCompositionEnd: () => {
    // 输入法结束时的回调
  }
});

// 附加到输入元素
const input = document.getElementById('input-field');
inputController.attachInput(input);

// 聚焦输入框
inputController.focusInput();

// 分离输入元素
inputController.detachInput();
```

---

#### `createDomStatsPanel(options: DomStatsPanelOptions): DomStatsPanel`

创建 DOM 统计面板适配器，自动更新统计显示。

```typescript
import { createDomStatsPanel } from 'pitype-core';

const statsPanel = createDomStatsPanel({
  getLocaleText: (key) => translations[key],
  realtime: {
    cpm: document.getElementById('cpm'),
    totalCpm: document.getElementById('total-cpm'),
    wpm: document.getElementById('wpm'),
    accuracy: document.getElementById('accuracy'),
    time: document.getElementById('time'),
    chars: document.getElementById('char-count')
  },
  result: {
    time: document.getElementById('final-time'),
    cpm: document.getElementById('final-cpm'),
    totalCpm: document.getElementById('final-total-cpm'),
    wpm: document.getElementById('final-wpm'),
    accuracy: document.getElementById('final-accuracy'),
    chars: document.getElementById('final-char-count')
  }
});

// 渲染实时统计
statsPanel.renderSnapshot(snapshot);

// 渲染结果统计
statsPanel.renderResults(finalSnapshot);

// 重置显示
statsPanel.reset();
```

## 类型定义

所有模块都提供完整的 TypeScript 类型定义。

```typescript
import type {
  TextToken,
  TextSource,
  SessionState,
  StatsSnapshot,
  EvaluateEvent,
  UndoEvent
} from 'pitype-core';
```

## 开发

### 构建

```bash
npm run build
```

### 监听模式

```bash
npm run watch
```

### 测试

```bash
npm test
```

## 示例

查看 `examples/` 目录下的完整示例应用:

- `examples/typerank3` - JavaScript 版本
- `examples/ts-typerank3` - TypeScript 版本
- `examples/react-typerank3` - React 版本
- `examples/vue3-typerank3` - Vue3 版本
- `examples/svelte-typerank3` - Svelte 版本

## License

MIT
