# pitype-core

打字练习引擎和示例应用的 Monorepo，包含核心引擎、多个示例以及打包/CI 工具链。

> 📚 **文档导航**
>
> - [DEVELOPMENT.md](./DEVELOPMENT.md)：本地开发、脚本说明与常见问题
> - [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)：按场景划分的命令速查
> - [docs/05测试指南.md](./docs/05测试指南.md)：单元、基线与基准测试操作
> - [docs/04接入指南.md](./docs/04接入指南.md)：第三方项目如何集成 `pitype-core`
> - [docs/03规划与实施方案.md](./docs/03规划与实施方案.md)：整体规划和演进背景
> - [docs/framework-integration-proposal.md](./docs/framework-integration-proposal.md)：各框架接入架构与 Hook 计划
> - [docs/incremental-implementation-plan.md](./docs/incremental-implementation-plan.md)：质量门禁增量落地路线
> - [docs/quality-implementation-guide.md](./docs/quality-implementation-guide.md)：CI/CD 门禁与团队规范
> - [docs/codecov-setup-guide.md](./docs/codecov-setup-guide.md)：Codecov 配置与覆盖率可视化
> - [docs/contributor-guide.md](./docs/contributor-guide.md)：贡献指南、提交与测试要求

## 架构速览

| 角色         | 路径                                                                                                                 | 职责                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 🧱 核心引擎  | `packages/pitype-core`                                                                                               | Headless TypingSession、DOM 适配器、统计等 |
| 🌐 示例应用  | `examples/{typerank3,ts-typerank3,react-typerank3,vue3-typerank3,next-typerank3,svelte-typerank3,angular-typerank3}` | 各技术栈的 UI 展示和 E2E 测试入口          |
| 🛠️ 脚本      | `scripts/`                                                                                                           | 构建/同步、Rollup native 安装、任务菜单    |
| ⚙️ CI & 发布 | `.github/workflows/`                                                                                                 | 质量门禁、性能监控、基准测试、自动发布     |

## 项目结构

```
pitype-core/
├── packages/
│   └── pitype-core/          # 核心打字引擎（headless）
├── examples/
│   ├── typerank3/            # JavaScript 示例应用
│   ├── ts-typerank3/         # TypeScript 示例应用
│   ├── react-typerank3/      # React 示例应用
│   ├── vue3-typerank3/       # Vue3 示例应用 ✨
│   ├── next-typerank3/       # Next.js 示例应用
│   ├── svelte-typerank3/     # Svelte 示例应用
│   └── angular-typerank3/    # Angular 示例应用
└── scripts/                  # 构建和同步脚本
```

## 快速开始

### 安装依赖

```bash
# 1. 安装依赖
npm install

# 2. 构建核心库（必需！）
npm run build:core

# 3. 同步到原生 JS 示例（可选，仅 baseline:dev 需要）
npm run sync:demo
```

> **注意**: `examples/typerank3/vendor/` 是生成目录，不提交到 git
>
> 💡 **命令菜单**：执行 `npm run task:menu` 可快速选择常用任务（构建、测试、开发服务器、基准测试等），无需记忆所有脚本。

### 开发

#### Vue3 示例 (vue3-typerank3) ✨ 推荐

```bash
# 启动开发服务器（支持热更新）
npm run vue3-demo:dev
```

访问 http://localhost:4201

**自动热更新内容：**

- ✅ packages/pitype-core 源码
- ✅ examples/vue3-typerank3/src 下的所有文件
- ✅ Vue 组件支持 HMR（热模块替换）

#### JavaScript 示例 (typerank3)

```bash
# 启动开发服务器（支持热更新）
npm run baseline:dev
```

访问 http://localhost:4200

**自动热更新内容：**

- ✅ packages/pitype-core 源码
- ✅ examples/typerank3 的所有文件

#### TypeScript 示例 (ts-typerank3)

```bash
# 启动开发服务器（支持热更新）
npm run ts-demo:dev
```

访问 http://localhost:4202

**自动热更新内容：**

- ✅ packages/pitype-core 源码
- ✅ examples/ts-typerank3/src 下的所有文件
- ✅ HTML 和 CSS

#### Angular 19 示例 (angular-typerank3)

```bash
# 启动开发服务器（支持热更新）
npm run angular-demo:dev
```

访问 http://localhost:4200

**自动热更新内容：**

- ✅ packages/pitype-core 源码（通过 `watch:core`）
- ✅ examples/angular-typerank3/src 下的所有文件
- ✅ Angular CLI Dev Server（Vite）实时刷新

#### Next 示例 (next-typerank3)

```bash
# 启动 Next.js 示例（App Router）
npm run next-demo:dev
```

访问 http://localhost:4205

**自动热更新内容：**

- ✅ packages/pitype-core 源码
- ✅ examples/next-typerank3/app 下的所有文件
- ✅ Next Fast Refresh（React 组件 + DOM 布局）

#### Svelte 示例 (svelte-typerank3)

```bash
# 启动开发服务器（支持热更新）
npm run svelte-demo:dev
```

访问 http://localhost:4204

**自动热更新内容：**

- ✅ packages/pitype-core 源码
- ✅ examples/svelte-typerank3/src 下的所有文件
- ✅ Svelte 组件、HTML 和全局样式

### 构建

```bash
# 构建核心包
npm run build:core

# 同步到 JavaScript 示例
npm run sync:demo
```

### 测试

```bash
# 运行所有测试
npm test

# 仅运行单元测试
npm run test:unit

# 生成覆盖率报告
npm run test:unit -- --coverage

# 仅运行 E2E 测试
npm run test:baseline
```

> `npm run test:baseline` 会同时启动 `examples/typerank3` 与 `examples/svelte-typerank3`，利用 Playwright 校验两套示例的核心交互。

**测试覆盖率状态**: ✅ 核心模块达到 **88.96%** 语句覆盖率

> 📖 **详细测试指南**: 查看 [docs/05测试指南.md](./docs/05测试指南.md) 了解完整测试文档

## 核心包 (pitype-core)

无 UI 的打字会话引擎，提供：

- **文本分词** - 支持中英文混合
- **会话管理** - TypingSession 核心逻辑
- **统计追踪** - 实时 CPM/WPM/准确率
- **DOM 适配器** - 输入控制器和统计面板

查看 [packages/pitype-core](./packages/pitype-core) 了解更多。

## 示例应用

### vue3-typerank3 (Vue3) ✨ 推荐

基于 Vue 3 组合式 API 的现代化打字练习应用。

**特性：**

- Vue 3 组合式 API（Composition API）
- 完整的 TypeScript 类型安全
- Vite 5.x 构建工具
- 支持 HMR（热模块替换）
- 优化的 DOM 管理（使用 `preserveChildren`）
- 简化的启动流程（单次 nextTick）
- 自动资源清理（onUnmounted）

查看 [examples/vue3-typerank3](./examples/vue3-typerank3) 了解更多。

### typerank3 (JavaScript)

基于原生 JavaScript 的完整打字练习应用。

**特性：**

- 纯 JavaScript ES6+
- 多主题支持
- 多语言支持（简体中文/繁体中文/英文）
- 响应式设计

查看 [examples/typerank3](./examples/typerank3) 了解更多。

### ts-typerank3 (TypeScript)

TypeScript 重写版本，提供完整类型安全。

**特性：**

- 完整的 TypeScript 类型定义
- 使用 Vite 构建
- 直接使用 pitype-core workspace 包
- 开发时热更新支持

查看 [examples/ts-typerank3](./examples/ts-typerank3) 了解更多。

### react-typerank3 (React)

基于 React 18 的打字练习应用，完整复刻 ts-typerank3 功能。

**特性：**

- React 18 + TypeScript
- Vite 5.x 构建工具
- React Hooks 封装 pitype-core API
- Context 实现多语言和主题管理
- 完整的响应式设计和移动端支持
- 5 个主题和 3 种语言支持

查看 [examples/react-typerank3](./examples/react-typerank3) 了解更多。

### next-typerank3 (Next.js)

Next.js 14 App Router 示例，复刻了 `ts-typerank3` 的 DOM 结构与交互，验证 `pitype-core` 能在 SSR/React 体系中直接复用。

**特性：**

- Next.js App Router + React Strict Mode
- DOM 模板与原生版本保持一致，可复用基线计分脚本
- `initTyperank3Demo()` 封装所有 DOM 逻辑，仅在浏览器端运行，避免 SSR 报错
- workspace 依赖主仓库的 `pitype-core`，开发时自动消费最新构建
- 端口 4205，兼容 Fast Refresh

查看 [examples/next-typerank3](./examples/next-typerank3) 了解更多。

### svelte-typerank3 (Svelte)

基于 Svelte 4 + TypeScript 的轻量示例，保持与 ts-typerank3 一致的交互体验。

**特性：**

- Svelte 4 + TypeScript + Vite 5
- 通过 `bind:this` 与 DOM 适配器集成，沿用 pitype-core 的输入/统计能力
- 多语言、主题、结果弹窗、指标说明与 ts 版本保持一比一
- 与核心包 watch 联动，Svelte 组件/HMR 即时生效

查看 [examples/svelte-typerank3](./examples/svelte-typerank3) 了解更多。

### angular-typerank3 (Angular 19)

Angular 19 独立组件示例，以 SPA 方式复刻 TypeScript 版本全部交互。

**特性：**

- Standalone Component + CLI Vite 构建，默认严格模式
- 以生命周期钩子托管 DOM 初始化，集中清理事件监听
- 完整复用 `language.ts`、`texts.ts`、`ui/*` 以保持功能对齐
- 兼容 `watch:core` 的 workspace 依赖链

查看 [examples/angular-typerank3](./examples/angular-typerank3) 了解更多。

## CI 与发布

- **Quality Gate**（`quality-gate.yml`）：在 PR/main push 时执行 lint、unit + coverage、Playwright 基线、type-check、构建和安全审计，所有检查通过后才允许合并。
- **Performance Monitoring**（`performance.yml`）：在 push/PR 时运行 bundle 分析与 TypingSession 基准测试，结果写入 GitHub Step Summary。
- **自动发布**：`npx semantic-release` 根据 commit 信息决定版本（`feat` → `minor`，`fix` → `patch`），并发布到 npm / GitHub Release。需要在 CI 中配置 `NPM_TOKEN`、`GITHUB_TOKEN`，且 GitHub Runner 必须使用 Node 18+/npm ≥ 10 才能正确安装 `workspace:*` 依赖。
- **脚本自动化**：`pretest` 会安装 Playwright 浏览器，`postinstall` 会在 Linux x64 环境拉取 Rollup 原生二进制，确保 CI、本地环境一致。

👉 详细流程与常见故障排除，参见 [DEVELOPMENT.md](./DEVELOPMENT.md#ci--release)。

## 开发工作流

### 修改核心包

1. 修改 `packages/pitype-core/src` 下的代码
2. TypeScript 会自动重新编译到 `dist/`
3. 示例应用会自动检测变化并重载

### 修改示例应用

**JavaScript 版本：**

- 直接修改 `examples/typerank3` 下的文件
- Live Server 会自动刷新浏览器

**TypeScript 版本：**

- 修改 `examples/ts-typerank3/src` 下的文件
- Vite 会自动触发 HMR

**React 版本：**

- 修改 `examples/react-typerank3/src` 下的文件
- React Fast Refresh 自动生效

**Next 版本：**

- 修改 `examples/next-typerank3/app` 下的文件
- Next Fast Refresh 会热更新 React 组件，SSR 逻辑由 Next 处理

**Svelte 版本：**

- 修改 `examples/svelte-typerank3/src` 下的文件
- Svelte HMR 即时生效

**Angular 版本：**

- 修改 `examples/angular-typerank3/src` 下的文件
- Angular CLI Dev Server 会自动刷新（默认 4200 端口）

## 脚本说明

| 脚本                       | 说明                           |
| -------------------------- | ------------------------------ |
| `npm run vue3-demo:dev`    | 启动 Vue3 示例开发环境（推荐） |
| `npm run react-demo:dev`   | 启动 React 示例开发环境        |
| `npm run angular-demo:dev` | 启动 Angular 示例开发环境      |
| `npm run next-demo:dev`    | 启动 Next.js 示例开发环境      |
| `npm run svelte-demo:dev`  | 启动 Svelte 示例开发环境       |
| `npm run ts-demo:dev`      | 启动 TypeScript 示例开发环境   |
| `npm run baseline:dev`     | 启动 JavaScript 示例开发环境   |
| `npm run build:core`       | 构建核心包                     |
| `npm run watch:core`       | 监听核心包变化并自动重新编译   |
| `npm run sync:demo`        | 同步核心包到 JavaScript 示例   |
| `npm test`                 | 运行所有测试                   |
| `npm run lint`             | 运行 ESLint                    |
| `npm run format`           | 格式化代码                     |

> 💡 更多命令和使用场景请查看 [DEVELOPMENT.md](./DEVELOPMENT.md)

## 技术栈

- **核心引擎**: TypeScript 5.x
- **Vue3 示例**: Vue 3.4+, TypeScript 5.x, Vite 5.x
- **React 示例**: React 18.3+, TypeScript 5.x, Vite 5.x
- **Next 示例**: Next.js 14+, React 18.3+
- **Svelte 示例**: Svelte 4, TypeScript 5.x, Vite 5.x
- **Angular 示例**: Angular 19 + CLI Vite
- **TypeScript 示例**: TypeScript 5.x, Vite 5.x
- **JavaScript 示例**: 原生 ES6+, Live Server
- **测试**: Playwright (E2E), Vitest (单元测试)
- **工具链**: npm workspaces, concurrently, chokidar

## License

MIT
