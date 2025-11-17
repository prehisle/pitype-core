# 贡献者指南

帮助新人了解 pitype-core monorepo 的结构、脚本与协作要求。配合 [README](../README.md)、[DEVELOPMENT.md](../DEVELOPMENT.md) 以及 [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) 阅读，可快速开始开发与维护。

## 项目结构

| 路径                                                                                                                 | 说明                                          |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `packages/pitype-core/src`                                                                                           | 无 UI 的 TypingSession 引擎与 DOM 适配器实现  |
| `packages/pitype-core/tests`                                                                                         | 紧贴实现的 Vitest 契约测试                    |
| `examples/{typerank3,ts-typerank3,vue3-typerank3,react-typerank3,next-typerank3,svelte-typerank3,angular-typerank3}` | 不同技术栈的演示/验收项目                     |
| `tests/baseline`                                                                                                     | Playwright 基线测试，验证 demo 与 core 的协同 |
| `scripts/*.mjs`                                                                                                      | 构建/同步/rollup native 安装等辅助脚本        |
| `.github/workflows/*`                                                                                                | 质量门禁、性能监控、自动发布                  |

## 常用命令

完整场景列表见 [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) 或运行 `npm run task:menu`。核心动作：

- 构建：`npm run build:core`，发布前必须执行。
- 热编译：`npm run watch:core`。
- 同步 demo：`npm run sync:demo` / `npm run baseline:dev`。
- 测试：`npm test`（先装 Playwright 浏览器），或分开运行 `npm run test:unit`、`npm run test:baseline`、`npm run bench:typing-session`。
- 质量：`npm run lint`、`npm run format`。

## 编码与命名规范

- 全部使用 ESM + TypeScript，缩进 2 空格，文件名 camelCase（如 `textSource.ts`）。
- 核心 API 保持无副作用、无 UI 依赖。与 UI 相关的 hook/样式仅能放在 `examples/` 中。
- 共享类型请优先使用 `type` 导出，`npm run format` 统一引号与导入顺序。

## 测试策略

- Vitest 用 `packages/pitype-core/tests/*.spec.ts`，紧贴目标模块。
- 端到端流程放在 `tests/baseline`，尽量使用 `data-testid`，必要时在文件头记录依赖的初始状态。
- Playwright 浏览器安装会在 `npm test` 前自动执行；若新增浏览器特性，请在 docs/05 中补充说明。

## 提交与 PR 规范

- 采用 Conventional Commits，标题不超过 72 字符（示例：`feat(core): add cursor adapter hook`）。
- 本地可以多次 commit，推送前按需 squash；PR 描述需包含动机、改动点、验证方式（日志/截图/录屏）以及关联 issue。
- 仅在 lint、unit、baseline 全绿后请求评审；如改动同步脚本或测试夹具，请在 PR 中说明回滚策略。
- 需要跳过 commitlint 的自动 release 提交已经在 Husky 中处理，无需手工干预。

## 语言要求

所有对外文档、讨论与提交（除代码）统一使用中文，确保上下游团队理解一致。
