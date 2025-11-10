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
│   ├── vendor/          # 核心功能模块
│   │   ├── dom/        # DOM 相关适配器
│   │   ├── tokenizer.ts
│   │   ├── textSource.ts
│   │   ├── typingSession.ts
│   │   ├── statsTracker.ts
│   │   ├── sessionRuntime.ts
│   │   └── index.ts
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

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
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

## 核心模块说明

### vendor 目录

- `tokenizer.ts`: 文本分词器，支持中英文混合
- `textSource.ts`: 文本源管理
- `typingSession.ts`: 打字会话核心逻辑
- `statsTracker.ts`: 统计数据追踪
- `sessionRuntime.ts`: 会话运行时管理
- `dom/inputController.ts`: 输入控制器
- `dom/statsPanel.ts`: 统计面板渲染

### ui 目录

- `textRenderer.ts`: 文本渲染引擎
- `cursorAdapter.ts`: 光标适配器
- `themeController.ts`: 主题控制器
- `languageController.ts`: 语言切换控制器
- `resultModal.ts`: 结果弹窗
- `infoModal.ts`: 信息弹窗
- `localeUtils.ts`: 国际化工具

## License

MIT
