# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 (2025-11-16)

### ✨ Features

- add hot reload dev workflow ([75b7943](https://github.com/prehisle/pitype-core/commit/75b79431d3dfb2c829f6eb25695a20a4ae1de951))
- add task menu runner ([d4a8ad3](https://github.com/prehisle/pitype-core/commit/d4a8ad37ee33aca8c08a7edd06820e2d1a0db7bd))
- add typing core scaffolding and docs ([12a3bfe](https://github.com/prehisle/pitype-core/commit/12a3bfe4f4c92ef1b9d7773ea338c0d43b9a36e3))
- **core:** add cjk line-break control ([da61515](https://github.com/prehisle/pitype-core/commit/da61515e811b9638c5854f9dc6335f530c143e8d))
- **core:** add DOM cursor adapter ([2a56f24](https://github.com/prehisle/pitype-core/commit/2a56f24d847064a5e11123b8ee3e13832b2ba675))
- **core:** add DOM text renderer ([1ed2bb4](https://github.com/prehisle/pitype-core/commit/1ed2bb46f54922e85e10f2ca6c7de5c9fc1766dc))
- **core:** add theme controller adapter ([4746ff1](https://github.com/prehisle/pitype-core/commit/4746ff1f9f48beb52bebc3d9c34e4f656b87a7b7))
- **core:** support framework text renderer ([1175e92](https://github.com/prehisle/pitype-core/commit/1175e92efc182cffaec12b2caf7d6a7ed9feb9d4))
- **core:** 抽象会话运行时并更新 demo ([c9f0709](https://github.com/prehisle/pitype-core/commit/c9f07097ff989d5f17cad9b9d0c1161cee3956e2))
- **core:** 抽象统计面板 DOM 适配层 ([9bab74d](https://github.com/prehisle/pitype-core/commit/9bab74d96bf066e8910aad18b42d1dfbdf84846a))
- **core:** 提供 DOM 输入控制器 ([22fb316](https://github.com/prehisle/pitype-core/commit/22fb316f5f69fc3cc0b3497c3bd7604535920ec2))
- **demo:** add vue3 example ([7591db3](https://github.com/prehisle/pitype-core/commit/7591db38be5eb137ce1b5efb31f8c8c69d67ddb6))
- **examples:** 添加 TypeScript 版本的 TypeRank3 ([5de3ad2](https://github.com/prehisle/pitype-core/commit/5de3ad2982ea3b49f4dbcfb0cb23ddd8554156a0))
- **ghost:** 添加幽灵光标对战功能 ([b5bbacc](https://github.com/prehisle/pitype-core/commit/b5bbaccce93b861bf5c993cab11153692fc1468e))
- rename core package ([8a38067](https://github.com/prehisle/pitype-core/commit/8a3806758399073209937352584edccb5ba6198f))
- **ts-typerank3:** 添加热更新开发支持 ([4693527](https://github.com/prehisle/pitype-core/commit/46935277232405efdd99b3669ed694e081d5ed67))
- **typerank3:** animate cursor with easing ([22326bb](https://github.com/prehisle/pitype-core/commit/22326bbcb2f4d409951c6a623f3b0126e9ad39b1))
- **typerank3:** smooth cursor transition ([b26b954](https://github.com/prehisle/pitype-core/commit/b26b9549a753556339cd596b8a657f7ec3393c2d))
- update replay trigger and ghost playback ([6b5e529](https://github.com/prehisle/pitype-core/commit/6b5e5299446ec695b6c06599e373022efb551dca))
- **vue3-example:** 统一光标和主题默认配置与 TypeScript 版本一致 ([5930aec](https://github.com/prehisle/pitype-core/commit/5930aec7a4cebc2280317a80637dfab7034abd3c)), closes [#ffd700](https://github.com/prehisle/pitype-core/issues/ffd700) [#6c7](https://github.com/prehisle/pitype-core/issues/6c7) [#f5f7](https://github.com/prehisle/pitype-core/issues/f5f7) [#6c7](https://github.com/prehisle/pitype-core/issues/6c7) [#6c7](https://github.com/prehisle/pitype-core/issues/6c7)
- 优化 Vue3 示例和核心库框架集成支持 ([0b2e8d5](https://github.com/prehisle/pitype-core/commit/0b2e8d506c6baf411ca39665f48e0375331c7b94))
- 添加光标配置、音频反馈和练习回放三大个性化功能 ([c78eefc](https://github.com/prehisle/pitype-core/commit/c78eefc3b7a6b081a55ef83e5afec089fa249c80))

### 🐛 Bug Fixes

- **build:** add WindowWithAudio interface for Audio constructor type ([a1f068e](https://github.com/prehisle/pitype-core/commit/a1f068e1790b60d523e7ef8d01876ce57fd62a86))
- **ci:** add Playwright browser installation step ([3708604](https://github.com/prehisle/pitype-core/commit/3708604419e9d5ffc50b01e4aa2abdb5d9de89d0))
- **ci:** make lint step non-blocking to align with incremental improvement strategy ([37c5c9c](https://github.com/prehisle/pitype-core/commit/37c5c9c016154d42bd1672d877c1824595f3bb7c))
- **core:** 修复光标移动动画并调整默认配置 ([a9c941f](https://github.com/prehisle/pitype-core/commit/a9c941f5ee26b48d23ba845ad3f95a423a5570a0))
- **demo:** 修复调整窗口时光标定位 ([822bca3](https://github.com/prehisle/pitype-core/commit/822bca3214e6596d96dde0a3557450725ad56b1f))
- **eslint:** disable no-undef rule for TypeScript files ([147e997](https://github.com/prehisle/pitype-core/commit/147e997981e2d36b71016a841560823067a134bd))
- **lint-staged:** remove blocking eslint check from pre-commit hook ([8d31f34](https://github.com/prehisle/pitype-core/commit/8d31f342e9f68421ffc17048e3858f49a4c5b9fc))
- **renderer:** keep cjk punctuation within word ([38c926d](https://github.com/prehisle/pitype-core/commit/38c926d221cb376299d5189392fdb9866f2e0858))
- resolve all TypeScript and ESLint errors ([a5788cf](https://github.com/prehisle/pitype-core/commit/a5788cf5e41877cbef861034d13e80e6b6a3e64f))
- **typescript:** create separate tsconfig for type-check to exclude tests ([7a0f516](https://github.com/prehisle/pitype-core/commit/7a0f516153e6ae8d01436668c3130fb43f6c29df))
- **vue-demo:** cursor layering ([79eeb9e](https://github.com/prehisle/pitype-core/commit/79eeb9e05f8eaf057c3764a4905d4e17e7f5c814))
- **vue3-example:** add type guards for metadata access ([912ea60](https://github.com/prehisle/pitype-core/commit/912ea605bc1c78e34b1c956bcd409c98ea3648a8))
- **vue3-example:** 修复主题切换时文字和光标颜色显示问题 ([d9ebe8c](https://github.com/prehisle/pitype-core/commit/d9ebe8c26380c30d163b921b2db933832c44337e))
- **vue3-example:** 修复录制数据保存问题并优化文本选择界面 ([7f8a446](https://github.com/prehisle/pitype-core/commit/7f8a446bd211bae6b26af687138eaba6e9caf005))
- **vue3-example:** 修复输入功能和光标位置问题 ([33b495e](https://github.com/prehisle/pitype-core/commit/33b495ef6511244db7b030b6fe31143df4761ef4))

### ⚡️ Performance

- **vue3-example:** 优化统计数据更新以提升光标移动流畅度 ([57758a1](https://github.com/prehisle/pitype-core/commit/57758a19a3cd18e89ebf4f790845b27175bd49ad))

### 📝 Documentation

- 添加项目文档 ([63ef2d3](https://github.com/prehisle/pitype-core/commit/63ef2d37e755d0847ff6329a540c31ee64c255f8))

### ♻️ Code Refactoring

- **ts-typerank3:** 使用 @pitype/core 替代重复代码 ([651db30](https://github.com/prehisle/pitype-core/commit/651db3062443f57dc94c382ecb2cdf5ed06e85d1))
- **typerank3:** centralize locale helpers ([db92f99](https://github.com/prehisle/pitype-core/commit/db92f995670f9a6f3dad64bba628c8a1631723c5))
- **typerank3:** extract cursor adapter ([3a3f60e](https://github.com/prehisle/pitype-core/commit/3a3f60e3ca248da7943420c868b82f439cefe6e5))
- **typerank3:** extract input controller ([969ee18](https://github.com/prehisle/pitype-core/commit/969ee185557c18c9134aa2c07288802b3923d6b1))
- **typerank3:** extract text renderer ([9495130](https://github.com/prehisle/pitype-core/commit/949513001c61ac36d7f319ef50b88435a501b58a))
- **typerank3:** introduce session controller ([15b6105](https://github.com/prehisle/pitype-core/commit/15b6105bd7a7306744eb4c558b9c70ebdfa0093a))
- **typerank3:** modularize modals ([57917c9](https://github.com/prehisle/pitype-core/commit/57917c99afbb77c26f44014506b8bbee0ee7d82b))
- **typerank3:** modularize ui controls ([36455dc](https://github.com/prehisle/pitype-core/commit/36455dc32fb0541dde33ae6e460dc46234c63115))
