# 开发指南

> 👩‍💻 **阅读指引**
>
> - 只想运行示例或快速验证：阅读「🚀 快速开始」与「📦 开发命令」。
> - 需要修改核心/测试：继续看「🧪 测试命令」「🎯 常用开发场景」。
> - 想了解 CI、发布或常见故障：跳到文末的「CI & Release」与「常见问题」。

## 🚀 快速开始

### 首次安装

```bash
# 1. 安装所有依赖
npm install

# 2. 构建核心库（必需！）
npm run build:core

# 3. 同步到原生 JS 示例（仅 baseline:dev 需要）
npm run sync:demo
```

> **重要**: `examples/typerank3/vendor/` 是生成目录（已添加到 .gitignore），首次克隆仓库后必须先运行 `npm run build:core` 和 `npm run sync:demo`

## 📦 开发命令

### 示例项目开发（支持热重载）

```bash
# Vue3 示例（推荐）
npm run vue3-demo:dev
# 访问: http://localhost:4174

# React 示例
npm run react-demo:dev
# 访问: http://localhost:5174

# TypeScript 示例
npm run ts-demo:dev
# 访问: http://localhost:5173

# Next.js 示例
npm run next-demo:dev
# 访问: http://localhost:5176

# 原生 JS 示例
npm run baseline:dev
# 访问: http://localhost:4173
```

**说明：**

- 这些命令会同时监听 `pitype-core` 和示例代码的变化
- 修改核心库会自动重新构建并刷新页面
- 修改示例代码会通过 HMR 快速更新

### 只启动示例服务器（不监听核心库）

```bash
# Vue3
cd examples/vue3-typerank3
npm run dev

# React
cd examples/react-typerank3
npm run dev

# TypeScript
cd examples/ts-typerank3
npm run dev

# Next.js
cd examples/next-typerank3
npm run dev

# Angular
cd examples/angular-typerank3
npm run dev

# Svelte
cd examples/svelte-typerank3
npm run dev

# 原生 JS
npm run demo:serve
```

## 🔨 构建命令

```bash
# 构建核心库
npm run build:core

# 同步核心库到原生 JS 示例
npm run sync:demo

# 监听核心库变化并自动重新构建
npm run watch:core
```

## 🧪 测试命令

```bash
# 运行所有测试（单元测试 + 基线测试）
npm test

# 只运行单元测试
npm run test:unit

# 只运行基线测试（Playwright）
npm run test:baseline

# TypingSession 基准测试
npm run bench:typing-session

# Vue3 示例类型检查
cd examples/vue3-typerank3
npm run type-check

# Svelte 示例类型检查
cd examples/svelte-typerank3
npm run check
```

> `npm test` 会先执行 `pretest`（自动安装 Playwright Chromium），请保持网络通畅。
>
> `npm run test:baseline` 会自动启动 `examples/typerank3` 与 `examples/svelte-typerank3`，涵盖两种 UI 技术栈的端到端用例。

## 🎯 常用开发场景

### 场景 1：开发 Vue3 示例

```bash
# 1. 启动开发服务器
npm run vue3-demo:dev

# 2. 打开浏览器访问 http://localhost:4174

# 3. 修改代码
# - 修改 examples/vue3-typerank3/src/* → 自动热重载
# - 修改 packages/pitype-core/src/* → 自动重新构建并刷新
```

### 场景 2：修改核心库并测试

```bash
# 1. 修改 packages/pitype-core/src/* 中的代码

# 2. 运行单元测试
npm run test:unit

# 3. 构建并同步到原生 JS 示例
npm run sync:demo

# 4. 运行基线测试
npm run test:baseline
```

### 场景 3：添加新功能并完整验证

```bash
# 1. 启动开发服务器（选择一个示例）
npm run vue3-demo:dev

# 2. 边开发边在浏览器中验证

# 3. 运行所有测试
npm test

# 4. 检查代码格式
npm run lint
```

## ⚙️ CI & Release

- **Quality Gate**（`.github/workflows/quality-gate.yml`）：lint、unit + coverage（上传 Codecov）、Playwright 基线、type-check、build、npm audit/Snyk，全都通过才算成功。
- **Performance Monitoring**（`.github/workflows/performance.yml`）：构建核心 & 统计 bundle 大小，运行 TypingSession 基准测试并输出 Step Summary。
- **自动发布**：`npx semantic-release` 依据 commit 类型自动发布 npm/GitHub Release。必须在 CI Secret 中配置 `NPM_TOKEN`、`GITHUB_TOKEN`；首次发布前确保已有 `v0.x.x` tag 以维持版本线。
- **安装脚本**：
  - `postinstall`：在 Linux x64 环境下载 Rollup 原生二进制（`scripts/install-rollup-native.mjs`），避免 Vite/ts-demo 构建失败。
  - `pretest`：执行 `npx playwright install --with-deps chromium`，确保基线测试始终具备浏览器。
- **commitlint/Husky**：提交前自动运行 lint-staged 和 commitlint；`chore(release):` 类自动提交会跳过 commitlint。

## ❓ 常见问题

| 问题                                       | 解决方案                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `npm ci` 报 lock file 不同步               | 运行 `npm install` 同步 `package-lock.json`，或确保最近没有未提交的包版本变更                                    |
| Playwright 报 “Executable doesn’t exist”   | 执行 `npx playwright install --with-deps chromium`（CI 由 `pretest` 自动完成）                                   |
| Rollup 缺少 `@rollup/rollup-linux-x64-gnu` | 确保 `postinstall` 没有失败；如本地是非 Linux x64，可忽略该依赖                                                  |
| `semantic-release` 报 `Invalid npm token`  | 在 CI 中配置有效 `NPM_TOKEN`，且若启用 2FA 需改为 “Authorization only”；确保 `GITHUB_TOKEN` 具备 repo write 权限 |
| Dependabot PR 被 commitlint 拒绝           | 我们已禁用 `body-max-line-length`，若仍有其他规则，可按需在 `.commitlintrc.json` 中调节                          |

更多操作细节与调试命令，见 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) 与 [docs/05测试指南.md](./docs/05测试指南.md)。

## 📝 代码质量

```bash
# 运行 ESLint 检查
npm run lint

# 自动格式化代码
npm run format
```

## 📂 项目结构

```
pitype-core/
├── packages/
│   └── pitype-core/          # 核心库
│       ├── src/              # 源代码
│       ├── dist/             # 构建输出
│       └── tests/            # 单元测试
├── examples/
│   ├── typerank3/            # 原生 JS 示例
│   ├── ts-typerank3/         # TypeScript 示例
│   ├── react-typerank3/      # React 示例
│   ├── vue3-typerank3/       # Vue3 示例
│   ├── next-typerank3/       # Next.js 示例
│   ├── svelte-typerank3/     # Svelte 示例
│   └── angular-typerank3/    # Angular 示例
├── tests/                    # 基线测试（Playwright）
└── scripts/                  # 构建脚本
```

## 🔧 Workspace 命令

```bash
# 在核心库 workspace 中运行命令
npm run --workspace pitype-core <command>

# 在 Vue3 示例 workspace 中运行命令
npm run --workspace vue3-typerank3 <command>

# 在 React 示例 workspace 中运行命令
npm run --workspace react-typerank3 <command>

# 在 Next 示例 workspace 中运行命令
npm run --workspace next-typerank3 <command>

# 在 Angular 示例 workspace 中运行命令
npm run --workspace angular-typerank3 <command>

# 在 TypeScript 示例 workspace 中运行命令
npm run --workspace ts-typerank3 <command>

# 在 Svelte 示例 workspace 中运行命令
npm run --workspace svelte-typerank3 <command>
```

## 🐛 调试技巧

### 在浏览器中调试

1. 启动开发服务器：`npm run vue3-demo:dev`
2. 打开浏览器开发者工具（F12）
3. 在 Sources 面板中找到 `.vue` 或 `.ts` 文件
4. 设置断点并调试

### 调试单元测试

```bash
# 运行测试并等待调试器连接
npx vitest --inspect-brk

# 在 Chrome 中打开 chrome://inspect
# 点击 "inspect" 连接到 Node 进程
```

## 📊 性能监控

### 在示例中查看性能

所有示例都显示实时统计数据：

- **CPM**: 正确字符每分钟
- **总 CPM**: 总字符每分钟（包括错误）
- **WPM**: 单词每分钟
- **正确率**: 输入准确度
- **时间**: 练习用时

### 测试光标性能

修改 `localStorage` 中的光标动画速度：

```javascript
// 在浏览器控制台中执行
localStorage.setItem('cursorAnimationMode', 'off'); // 关闭动画
localStorage.setItem('cursorAnimationMode', 'slow'); // 慢速（150ms）
localStorage.setItem('cursorAnimationMode', 'medium'); // 中速（115ms）
localStorage.setItem('cursorAnimationMode', 'fast'); // 快速（85ms，默认）
```

## 🚢 发布流程

```bash
# 1. 确保所有测试通过
npm test

# 2. 检查代码格式
npm run lint

# 3. 构建核心库
npm run build:core

# 4. 更新版本号（在 packages/pitype-core/package.json）

# 5. 发布到 npm（如果配置了）
cd packages/pitype-core
npm publish
```

## 💡 提示

- 开发时推荐使用 `npm run vue3-demo:dev` 或 `npm run ts-demo:dev`，它们会自动监听变化
- 提交代码前记得运行 `npm test` 确保所有测试通过
- 使用 `npm run format` 自动格式化代码，保持代码风格一致
- Vue3 示例使用了最新的改进，包括 `preserveChildren: true` 和简化的启动流程

## 🆘 常见问题

### Q: 启动开发服务器后修改核心库代码没有生效？

A: 确保使用 `*-demo:dev` 命令而不是 `*-demo:serve`。`dev` 命令会同时监听核心库变化。

### Q: 测试失败怎么办？

A:

1. 确保先运行 `npm run build:core`
2. 检查是否有 TypeScript 类型错误
3. 查看测试输出的详细错误信息

### Q: Vite 报错找不到模块？

A:

1. 删除 `node_modules` 和 lock 文件
2. 重新运行 `npm install`
3. 重新运行 `npm run build:core`

### Q: 如何添加新的示例项目？

A:

1. 在 `examples/` 下创建新目录
2. 在根 `package.json` 的 `workspaces` 中添加
3. 参考现有示例配置依赖关系
4. 添加对应的 npm 脚本到根 `package.json`
