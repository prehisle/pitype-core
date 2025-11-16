# TypeRank3 - TypeScript Version

这是 TypeRank3 的 TypeScript 版本实现，提供完整的类型安全和更好的开发体验。

## 特性

- 完全使用 TypeScript 编写
- 严格的类型检查
- 模块化架构
- 使用 Vite 构建
- 支持热更新开发

## 技术栈

- TypeScript 5.x
- Vite 5.x
- ES2020 模块系统
- 原生 DOM API

## 项目结构

```
ts-typerank3/
├── src/
│   ├── ui/             # UI 组件
│   │   ├── textRenderer.ts
│   │   ├── cursorAdapter.ts
│   │   ├── themeController.ts
│   │   ├── languageController.ts
│   │   ├── resultModal.ts
│   │   ├── infoModal.ts
│   │   └── localeUtils.ts
│   ├── language.ts     # 国际化资源
│   ├── texts.ts        # 练习文本库
│   └── main.ts         # 主入口
├── index.html
├── style.css
├── tsconfig.json
├── vite.config.ts
└── package.json
```

**核心功能**: 直接使用 `pitype-core` workspace 包，而不是复制代码，确保与仓库核心逻辑保持同步。

## 开发

### 快速启动（推荐）

**从项目根目录启动，支持 pitype-core 和 ts-typerank3 的热更新：**

```bash
# 在项目根目录执行
npm run ts-demo:dev
```

这个命令会自动：
1. 监听 `packages/pitype-core` 源码变化并自动重新编译
2. 启动 Vite 开发服务器（端口 3000）
3. 当 pitype-core 重新编译后，Vite 会自动重载页面

浏览器会自动打开 http://localhost:3000

### 手动启动

如果需要分开运行：

#### 1. 首次构建核心包

```bash
# 在项目根目录
npm run build:core
```

#### 2. 启动开发服务器

```bash
# 方式1：从根目录启动
npm run ts-demo:serve

# 方式2：进入 ts-typerank3 目录
cd examples/ts-typerank3
npm run dev
```

#### 3. 监听核心包变化（可选）

如果需要修改 `packages/pitype-core`，在另一个终端运行：

```bash
# 在项目根目录
npm run watch:core
```

### 类型检查

```bash
npm run type-check
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 与原版的区别

1. **类型安全**: 所有模块都有完整的 TypeScript 类型定义
2. **更好的 IDE 支持**: 完整的类型提示和自动补全
3. **构建系统**: 使用 Vite 替代原生 ES 模块
4. **开发体验**: 热更新、快速构建
5. **代码复用**: 直接使用 `pitype-core` workspace 包，不重复维护核心逻辑

## 模块说明

### 核心依赖 (pitype-core)

本项目直接使用仓库中的 `pitype-core` 包，包含：
- 文本分词器 (tokenizeText)
- 文本源管理 (createTextSource)
- 打字会话 (TypingSession)
- 统计追踪 (createStatsTracker)
- 会话运行时 (createSessionRuntime)
- DOM 输入控制器 (createDomInputController)
- DOM 统计面板 (createDomStatsPanel)

### UI 组件 (ui/)

- `textRenderer.ts`: 文本渲染引擎
- `cursorAdapter.ts`: 光标适配器（支持动画和自适应）
- `themeController.ts`: 主题切换控制器
- `languageController.ts`: 语言切换控制器
- `resultModal.ts`: 结果弹窗
- `infoModal.ts`: 信息弹窗
- `localeUtils.ts`: 国际化工具

## 热更新说明

### 自动热更新的内容

✅ **src/** 目录下的所有 TypeScript 文件（UI 组件、语言配置等）
✅ **packages/pitype-core** 的代码（通过 watch:core 自动重新编译）
✅ **index.html** 和 **style.css**

### 工作原理

1. `watch:core` 监听 pitype-core 源码，有变化时自动重新编译到 `dist/`
2. Vite 通过 alias 直接使用 `packages/pitype-core/dist/` 的输出
3. 当 dist 文件更新时，Vite 检测到变化并触发 HMR 或页面重载

## License

MIT
