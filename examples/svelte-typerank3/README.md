# svelte-typerank3

基于 Svelte + Vite 的打字练习示例，功能一比一复刻 `examples/ts-typerank3`。

## 开发

在仓库根目录：

```bash
npm install
npm run --workspace svelte-typerank3 dev
```

或进入示例目录：

```bash
cd examples/svelte-typerank3
npm install
npm run dev
```

## 构建与预览

```bash
npm run --workspace svelte-typerank3 build
npm run --workspace svelte-typerank3 preview
```

## 说明

- 直接复用 `pitype-core` 提供的 DOM 控制器，保持与 TypeScript 示例一致的交互。
- 文本库、语言切换、主题切换、统计面板与结果/说明弹窗均保持一致。
