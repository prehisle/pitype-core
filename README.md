# pitype-core

打字练习引擎和示例应用的 Monorepo。

## 项目结构

```
pitype-core/
├── packages/
│   └── pitype-core/          # 核心打字引擎（headless）
├── examples/
│   ├── typerank3/            # JavaScript 示例应用
│   └── ts-typerank3/         # TypeScript 示例应用
└── scripts/                  # 构建和同步脚本
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发

#### JavaScript 示例 (typerank3)

```bash
# 启动开发服务器（支持热更新）
npm run baseline:dev
```

访问 http://localhost:4173

**自动热更新内容：**
- ✅ packages/pitype-core 源码
- ✅ examples/typerank3 的所有文件

#### TypeScript 示例 (ts-typerank3)

```bash
# 启动开发服务器（支持热更新）
npm run ts-demo:dev
```

访问 http://localhost:3000

**自动热更新内容：**
- ✅ packages/pitype-core 源码
- ✅ examples/ts-typerank3/src 下的所有文件
- ✅ HTML 和 CSS

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

# 仅运行 E2E 测试
npm run test:baseline
```

## 核心包 (@pitype/core)

无 UI 的打字会话引擎，提供：

- **文本分词** - 支持中英文混合
- **会话管理** - TypingSession 核心逻辑
- **统计追踪** - 实时 CPM/WPM/准确率
- **DOM 适配器** - 输入控制器和统计面板

查看 [packages/pitype-core](./packages/pitype-core) 了解更多。

## 示例应用

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
- 直接使用 @pitype/core workspace 包
- 开发时热更新支持

查看 [examples/ts-typerank3](./examples/ts-typerank3) 了解更多。

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

## 脚本说明

| 脚本 | 说明 |
|------|------|
| `npm run baseline:dev` | 启动 JavaScript 示例开发环境 |
| `npm run ts-demo:dev` | 启动 TypeScript 示例开发环境 |
| `npm run build:core` | 构建核心包 |
| `npm run watch:core` | 监听核心包变化并自动重新编译 |
| `npm run sync:demo` | 同步核心包到 JavaScript 示例 |
| `npm test` | 运行所有测试 |
| `npm run lint` | 运行 ESLint |
| `npm run format` | 格式化代码 |

## 技术栈

- **核心引擎**: TypeScript 5.x
- **JavaScript 示例**: 原生 ES6+, Live Server
- **TypeScript 示例**: TypeScript 5.x, Vite 5.x
- **测试**: Playwright (E2E), Vitest (单元测试)
- **工具链**: npm workspaces, concurrently, chokidar

## License

MIT
