# TypeRank3 - Angular 19 版本

Angular 19 示例完整复刻了 `examples/ts-typerank3` 的交互、文案、主题与语言切换能力，并直接消费仓库内的 `pitype-core` 包，便于对比多框架实现。该工程使用 Angular 独立组件（standalone components）与 CLI Vite 构建器，保持现代化开发体验。

## 特性

- 一比一还原 TypeScript 版本的布局、逻辑、结果弹窗与提示信息
- 直接复用 `pitype-core` DOM 控制器：输入、光标、主题、统计面板等
- Angular 19 + 独立组件（无 NgModule）架构，默认严格类型检查
- CLI Dev Server（Vite）提供快速热更新，与 `watch:core` 兼容

## 技术栈

- Angular 19 / Standalone Components
- `@angular-devkit/build-angular:application` (Vite 构建)
- TypeScript 5.6+
- `pitype-core` 工作区依赖

## 项目结构

```
angular-typerank3/
├── angular.json           # CLI 配置
├── package.json
├── tsconfig*.json
├── src/
│   ├── app/
│   │   ├── app.component.*   # Angular Shell + pitype-core 集成
│   │   ├── language.ts       # 多语言资源（复制自 ts-typerank3）
│   │   ├── texts.ts          # 练习文本库
│   │   └── ui/               # 语言、结果弹窗等 DOM 帮助方法
│   ├── index.html            # Angular 入口，包含 Font Awesome
│   └── styles.css            # 完整 UI 样式
└── README.md
```

## 开发

### 快速启动（推荐）

```bash
# 在仓库根目录执行，联动构建核心包
npm run angular-demo:dev
```

该命令会：

1. 监听 `packages/pitype-core`，实时输出最新构建
2. 启动 Angular Dev Server（默认端口 4200）
3. pitype-core 更新后自动刷新示例页面

### 手动启动

```bash
# 构建核心包
npm run build:core

# 进入示例目录并启动 dev server
cd examples/angular-typerank3
npm run dev
```

如需同步核心包更新，可在第二个终端运行 `npm run watch:core`。

### 类型检查 / 构建

```bash
npm run --workspace angular-typerank3 type-check
npm run --workspace angular-typerank3 build
```

## 与 TypeScript 示例的差异

1. 使用 Angular 组件生命周期托管 DOM 初始化而非 `DOMContentLoaded`
2. 提供事件解绑与主题控制清理逻辑，避免在 SPA 中重复创建监听器
3. 同步复用了 `language.ts`、`texts.ts` 与 `ui/*`，确保逻辑与样式完全一致

## License

MIT
