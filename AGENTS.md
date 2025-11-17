# Repository Guidelines

本指南帮助你在贡献 pitype-core 单体仓库时保持与核心引擎、演示项目与基线测试的一致性。（供内部/代理助手参考，请保留在根目录。）

## 项目结构与模块组织

- `packages/pitype-core/src` 存放无界面打字会话引擎，构建产物输出到 `packages/pitype-core/dist`。
- `packages/pitype-core/tests` 维护紧邻实现的单元测试，覆盖 tokenizer、locale 与 session 辅助函数。
- `examples/typerank3` 承载演示站点，`tests/baseline/typerank3.spec.ts` 通过 Playwright 驱动该示例完成端到端验证。
- `scripts/*.mjs`（如 `sync-demo.mjs`、`watch-sync.mjs`）负责将最新构建同步至示例并协调 watch 流程；根目录配置文件（`vitest.config.ts`、`playwright.config.ts`、`eslint.config.cjs`）集中定义工具链行为。

## 构建、测试与开发命令

- `npm run build:core`：使用 `tsc -p tsconfig.build.json` 编译核心包；发布前务必运行。
- `npm run watch:core`：进入热编译模式，配合编辑器可即时得到类型与构建反馈。
- `npm run sync:demo` / `npm run baseline:dev`：重建核心、同步到示例并在 4173 端口启动本地服务器与监听器，便于调试基线。
- `npm run test` 会串行执行 `test:unit`(Vitest) 与 `test:baseline`(Playwright)；若仅验证逻辑可运行 `npm run test:unit`。
- `npm run lint`、`npm run format` 覆盖 ESLint 与 Prettier，提交前需确保无差异。

## 编码风格与命名约定

- 统一使用 ES Module、TypeScript、两空格缩进以及具描述性的 camelCase 文件名（例如 `textSource.ts`）。
- 公共 API 保持无副作用、无 UI 依赖；与演示相关的钩子或样式仅能放在 `examples/typerank3`。
- 所有 demo（`examples/*-typerank3`）在 `package.json` 中必须以 `workspace:*` 依赖当前仓库的 `pitype-core`，禁止写死版本号，确保同步使用最新构建。
- 通过 `npm run format` 维持引号、空格与导入顺序；如需共享类型，优先使用 `type` 导入导出。

## 测试规范

- 在 `packages/pitype-core/tests` 中以 `xxx.spec.ts` 命名新增或调整单元测试，紧贴目标模块。
- 端到端流程统一写在 `tests/baseline`，优先使用稳定的 `data-testid` 选择器，必要时在文件头记录依赖的初始数据。
- 提交前运行 `npm run test`，UI 行为或文案调整需同时更新 Playwright 基线，确保 demo 与引擎保持同步。

## 提交与 Pull Request 指南

- 沿用 Conventional Commits（如 `feat: add typing core scaffolding`，或带作用域的 `fix(core): adjust locale lookup`），标题使用祈使句且不超过 72 字符。
- 本地可多次提交以保留语义，推送前按需压缩并保持清晰的变更说明与要点列表。
- PR 描述需包含动机、主要改动、验证方式（`npm run test` 结果、必要的截图或录屏）以及关联 issue/失败基线链接。
- 仅在 lint、unit、baseline 全绿后请求评审；若改动影响同步脚本或测试夹具，请在 PR 中注明回滚策略与验证要点。

## 语言要求

- 总是使用中文和用户交互
