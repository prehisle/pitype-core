# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指导。

## 项目概述

`pitype-core` 是一个 monorepo，包含无头（headless）打字练习引擎（`packages/pitype-core`）以及 Vue3、TypeScript 和原生 JavaScript 的示例应用。核心包是框架无关的，遵循事件驱动、函数式架构。

## 架构

### 核心包结构

**状态管理：**

- **TypingSession** (`typingSession.ts`)：核心状态机，管理打字输入、评估和事件。状态是不可变的 - `getState()` 返回快照。所有变更通过 `subscribe()` 发出事件。
- **SessionRuntime** (`sessionRuntime.ts`)：高级编排器，封装 TypingSession + StatsTracker。处理生命周期、定期统计快照、音频反馈和可选的录制功能。

**关键模块：**

- **StatsTracker** (`statsTracker.ts`)：订阅会话事件，实时计算 CPM/TCPM/WPM/准确率
- **Tokenizer** (`tokenizer.ts`)：中英文混合内容的文本分词
- **TextSource** (`textSource.ts`)：不可变的文本表示，包含 tokens、locale 和 ID
- **Recorder/Player** (`recorder.ts`, `player.ts`)：带时间戳的会话录制、序列化/反序列化、回放
- **GhostManager** (`ghostManager.ts`)：管理竞速模式的幽灵玩家

**DOM 适配器** (`dom/`)：框架无关的 DOM 工具（核心是无头的）

- `inputController.ts`：键盘处理、焦点管理
- `textRenderer.ts`：文本显示与换行逻辑
- `cursorAdapter.ts`：使用 CSS transitions 的动画光标
- `statsPanel.ts`：统计数据显示
- `themeController.ts`：主题切换
- `audioController.ts`：音效

**设计模式：** 工厂函数（`createStatsTracker`、`createSessionRuntime`）返回带方法的对象。核心包零运行时依赖。

### 示例应用

- **`examples/vue3-typerank3`**：Vue 3 + Composition API（推荐，直接 workspace 依赖，支持 HMR）
- **`examples/ts-typerank3`**：TypeScript + Vite（workspace 依赖）
- **`examples/typerank3`**：原生 JS（使用生成的 `vendor/` 目录，E2E 基线）

## 核心命令

### 初始化

```bash
npm install              # 安装依赖
npm run build:core       # 运行示例前必须执行
npm run sync:demo        # 仅原生 JS 示例需要
```

### 开发

```bash
# 开发服务器（自动重新构建）
npm run vue3-demo:dev    # http://localhost:4174 ✨ 推荐
npm run ts-demo:dev      # http://localhost:5173
npm run baseline:dev     # http://localhost:4173

# 核心包
npm run build:core       # 单次构建
npm run watch:core       # 监听模式
npm run sync:demo        # 同步到 examples/typerank3/vendor/
```

### 测试

```bash
npm test                 # 所有测试（通过 pretest 自动安装 Playwright）
npm run test:unit        # Vitest 单元测试
npm run test:unit -- --coverage  # 带覆盖率
npm run test:baseline    # Playwright E2E 测试
npm run bench:typing-session  # 基准测试

# 单个测试
npx vitest packages/pitype-core/tests/typingSession.spec.ts

# 调试
npx vitest --inspect-brk  # 使用 chrome://inspect
```

**测试结构：**

- 单元测试：`packages/pitype-core/tests/**/*.spec.ts`（Vitest，覆盖率阈值：80%/80%/80%/70%）
- E2E 测试：`tests/baseline/**/*.spec.ts`（Playwright，运行于 http://127.0.0.1:4173）

### 代码质量

```bash
npm run lint             # ESLint 检查
npm run format           # Prettier 格式化
npm run format:check     # Prettier 检查（CI 阻塞）
npm run type-check       # TypeScript 类型检查
```

## 开发工作流

### 修改核心包

1. 编辑 `packages/pitype-core/src/`
2. TypeScript 编译到 `dist/`（监听模式下自动）
3. 使用 `*-demo:dev` 命令时示例自动重载

**添加功能：**

1. 在 `src/` 中创建模块，导出工厂函数
2. 添加 types/interfaces，在 `index.ts` 中导出
3. 在 `tests/` 中添加测试（镜像 src 结构）
4. DOM 功能使用 `dom/` 子目录

### 修改示例应用

- **Vue3/TS**：直接 workspace 依赖，修改立即生效
- **原生 JS**：核心包修改后需要运行 `npm run sync:demo`

## CI/CD

**质量门禁** (`.github/workflows/quality-gate.yml`)：

- Prettier（阻塞）、ESLint（非阻塞）、单元测试 + 覆盖率（Codecov）、类型检查、Playwright E2E、构建、安全扫描

**发布流程** (semantic-release)：

- 提交格式决定版本：`feat:` → minor，`fix:` → patch，`BREAKING CHANGE:` → major
- 需要在 CI 中配置 `NPM_TOKEN` 和 `GITHUB_TOKEN`
- 通过 commitlint + Husky 验证提交

**提交格式：**

```bash
feat(core): add new feature
fix(dom): resolve bug
docs: update documentation
chore: update dependencies
test: add tests
```

## 重要模式

### 创建会话

```typescript
import { createTextSource, TypingSession, createStatsTracker } from 'pitype-core';

const source = createTextSource('Hello world', { id: 'demo', locale: 'en' });
const session = new TypingSession({ source });
const tracker = createStatsTracker(session);

session.subscribe((event) => {
  switch (event.type) {
    case 'input:evaluate':
      // 使用 event.index, event.correct 更新 UI
      break;
    case 'session:complete':
      // 显示结果
      break;
  }
});

session.input('H'); // 评估字符
session.undo(); // 退格
session.reset(); // 重新开始
```

### 使用 SessionRuntime

```typescript
import { createSessionRuntime, createTextSource } from 'pitype-core';

const runtime = createSessionRuntime({
  snapshotIntervalMs: 1000,
  onEvaluate: (event) => {
    /* 更新 UI */
  },
  onComplete: (snapshot) => {
    /* 显示统计 */
  }
});

runtime.startSession(createTextSource('Test'));
```

## 常见问题

1. **示例无法运行**：先运行 `npm run build:core`
2. **原生 JS 示例过时**：运行 `npm run sync:demo`
3. **核心修改未生效**：使用 `*-demo:dev` 而非 `*-demo:serve`
4. **Playwright 缺失**：`npm test` 会自动安装，或运行 `npx playwright install --with-deps chromium`
5. **Lock 文件不匹配**：本地运行 `npm install`（而非 `npm ci`）

## 关键文件

**生成文件（已忽略）：**

- `packages/pitype-core/dist/` - 构建输出
- `examples/typerank3/vendor/` - 同步的核心文件

**配置文件：**

- `vitest.config.ts` - 单元测试配置
- `playwright.config.ts` - E2E 测试配置
- `packages/pitype-core/tsconfig.build.json` - 核心包构建配置

**钩子：**

- `postinstall` - 下载 Rollup 原生二进制（Linux x64）
- `pretest` - 安装 Playwright 浏览器

## Workspace 命令

```bash
npm run --workspace pitype-core <command>
npm run --workspace vue3-typerank3 <command>
npm run --workspace ts-typerank3 <command>
```
