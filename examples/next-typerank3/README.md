# Next TypeRank3

Next.js 14 + TypeScript 示例，功能一比一复刻 `examples/ts-typerank3`，用于展示如何在 React/Next 体系内直接复用 `pitype-core`。

## 特性

- **Next.js App Router**，默认开启 React Strict Mode
- **TypeScript + ESLint**，完整的类型、校验链路
- **复用 ts-typerank3 DOM 逻辑**，与原生版本完全一致
- **多语言/多主题支持**，和核心 demo 保持同步
- **workspace 依赖**，可直接调试最新 `pitype-core`

## 快速开始

> 需要先在仓库根目录构建一次核心包：`npm run build:core`

```bash
# 推荐从仓库根目录运行，包含 core 编译 + Next dev server
npm run next-demo:dev

# 或者进入当前目录
cd examples/next-typerank3
npm install
npm run dev
```

访问 http://localhost:5176

### 其它命令

```bash
npm run build      # 生成 .next/ 构建
npm run start      # 生产模式启动
npm run lint       # ESLint (next lint)
npm run type-check # 独立的 TypeScript 检查
```

## 目录结构

```
next-typerank3/
├── app/
│   ├── page.tsx      # JSX 模版，复刻 index.html
│   ├── layout.tsx    # 全局样式 / Head 定义
│   ├── globals.css   # 直接沿用 ts-typerank3 的样式
│   └── lib/          # 直接 copy ts-typerank3/src
│       ├── main.ts   # 初始化入口（封装成函数供 Next 调用）
│       ├── language.ts / texts.ts
│       └── ui/*.ts   # 原生 DOM 控制器
├── next.config.mjs
├── tsconfig.json
└── package.json
```

## 实现细节

- `app/page.tsx` 渲染与 `index.html` 完全一致的 DOM，保证 data-testid/结构不变
- `app/lib/main.ts` 将原来的全局脚本封装成 `initTyperank3Demo()`，在 Next `useEffect` 里按需执行
- Fast Refresh 时通过 idempotent 初始化避免重复绑定事件
- 样式、语言资源、文本库均直接沿用 ts 版本，后续维护保持一次修改多处同步
