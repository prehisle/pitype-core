# 快速参考 - 常用命令

> 💡 这是一个命令速查表，详细文档请查看 [DEVELOPMENT.md](./DEVELOPMENT.md)

## ⚡ 最常用命令

```bash
# 🚀 启动 Vue3 开发（推荐）
npm run vue3-demo:dev

# 🧪 运行所有测试
npm test

# 🔨 构建核心库
npm run build:core
```

## 🧰 命令菜单

```bash
# 打开交互菜单，选择要运行的任务
npm run task:menu

# 也可以直接指定关键字（如 lint、unit、e2e、vue-dev、watch-core 等）
npm run task:menu lint
```

---

## 📦 启动开发服务器

| 命令                    | 示例       | 端口 | 说明     |
| ----------------------- | ---------- | ---- | -------- |
| `npm run vue3-demo:dev` | Vue3       | 4174 | ✨ 推荐  |
| `npm run ts-demo:dev`   | TypeScript | 5173 | Vite HMR |
| `npm run baseline:dev`  | JavaScript | 4173 | 原生 JS  |

## 🧪 测试命令

```bash
npm test              # 运行所有测试
npm run test:unit     # 单元测试
npm run test:baseline # E2E 测试（Playwright）
```

## 🔨 构建命令

```bash
npm run build:core    # 构建核心库
npm run sync:demo     # 同步到 JS 示例
npm run watch:core    # 监听并自动构建
```

## 📝 代码质量

```bash
npm run lint          # ESLint 检查
npm run format        # Prettier 格式化
```

## 🎯 常见场景

### 首次启动项目（克隆仓库后）

```bash
npm install          # 安装依赖
npm run build:core   # 构建核心库（必需！）
npm run sync:demo    # 同步到 JS 示例（仅 baseline:dev 需要）
npm run vue3-demo:dev # 启动开发服务器
```

> **注意**: `examples/typerank3/vendor/` 是生成目录，已添加到 .gitignore

### 修改核心库后测试

```bash
npm run test:unit     # 单元测试
npm run build:core    # 构建
npm run test:baseline # E2E 测试
```

### 在示例中验证改动

```bash
# 打开一个终端运行开发服务器
npm run vue3-demo:dev

# 修改 packages/pitype-core/src/* 代码
# 自动重新构建并刷新浏览器 ✨
```

## 📂 文件位置

| 路径                           | 说明       |
| ------------------------------ | ---------- |
| `packages/pitype-core/src/`    | 核心库源码 |
| `examples/vue3-typerank3/src/` | Vue3 示例  |
| `examples/ts-typerank3/src/`   | TS 示例    |
| `examples/typerank3/`          | JS 示例    |
| `tests/baseline/`              | E2E 测试   |
| `packages/pitype-core/tests/`  | 单元测试   |

## 🌐 访问地址

- Vue3: http://localhost:4174
- TypeScript: http://localhost:5173
- JavaScript: http://localhost:4173

## 🔍 调试技巧

### 浏览器调试

```bash
npm run vue3-demo:dev
# 打开 http://localhost:4174
# 按 F12 打开开发者工具
# 在 Sources 面板中设置断点
```

### 测试调试

```bash
npx vitest --inspect-brk
# 在 Chrome 中打开 chrome://inspect
# 点击 "inspect" 连接调试器
```

## ⚙️ Workspace 命令

```bash
# 在核心库运行命令
npm run --workspace pitype-core <command>

# 在 Vue3 示例运行命令
npm run --workspace vue3-typerank3 <command>

# 在 TS 示例运行命令
npm run --workspace ts-typerank3 <command>
```

## 💾 光标动画调试

在浏览器控制台中执行：

```javascript
// 关闭动画
localStorage.setItem('cursorAnimationMode', 'off');

// 慢速动画
localStorage.setItem('cursorAnimationMode', 'slow');

// 快速动画（默认）
localStorage.setItem('cursorAnimationMode', 'fast');
```

---

**完整文档**: [DEVELOPMENT.md](./DEVELOPMENT.md)
**项目说明**: [README.md](./README.md)
