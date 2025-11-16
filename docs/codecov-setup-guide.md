# 📊 Codecov 配置指南

## 什么是 Codecov？

Codecov 是一个代码覆盖率可视化平台，可以：

- 📈 追踪覆盖率趋势
- 📊 生成可视化报告
- 💬 在 PR 中自动评论覆盖率变化
- 🎯 设置覆盖率目标

## 🚀 快速配置（5分钟）

### 步骤1：注册 Codecov 账号

1. 访问 https://codecov.io
2. 点击 **"Sign up with GitHub"**
3. 授权 Codecov 访问你的 GitHub 账号
4. 选择你的组织或个人账号

### 步骤2：添加仓库

1. 在 Codecov Dashboard，点击 **"Add new repository"**
2. 找到并选择 `pitype-core` 仓库
3. Codecov 会自动生成一个 **Upload Token**

### 步骤3：复制 Upload Token

1. 在仓库设置页面，找到 **"Repository Upload Token"**
2. 点击复制按钮
3. Token 格式类似：`a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 步骤4：配置 GitHub Secret

1. 访问你的 GitHub 仓库：`https://github.com/prehisle/pitype-core`
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **"New repository secret"**
4. 填写：
   - **Name**: `CODECOV_TOKEN`
   - **Secret**: 粘贴从 Codecov 复制的 token
5. 点击 **"Add secret"**

### 步骤5：验证配置

配置完成后，下次推送代码时：

1. GitHub Actions 会自动上传覆盖率报告
2. 在 Codecov Dashboard 可以看到覆盖率数据
3. PR 会收到覆盖率变化的评论

---

## 📋 配置检查清单

配置完成后，确认以下各项：

- [ ] Codecov 账号已创建
- [ ] pitype-core 仓库已添加到 Codecov
- [ ] Upload Token 已复制
- [ ] GitHub Secret `CODECOV_TOKEN` 已配置
- [ ] 推送代码后 CI 显示 "Upload coverage to Codecov" 步骤成功

---

## 🔍 验证 Codecov 是否工作

### 方法1：查看 GitHub Actions 日志

1. 访问：https://github.com/prehisle/pitype-core/actions
2. 点击最新的 workflow run
3. 展开 **"Upload coverage to Codecov"** 步骤
4. 应该看到：
   ```
   [info] Codecov report uploaded successfully
   ```

### 方法2：查看 Codecov Dashboard

1. 访问：https://codecov.io/gh/prehisle/pitype-core
2. 应该看到：
   - 当前覆盖率百分比
   - 覆盖率趋势图
   - 文件级别的覆盖率详情

### 方法3：PR 评论

创建 PR 后，Codecov bot 会自动添加评论，显示：

- 覆盖率变化（增加/减少）
- 受影响的文件
- 详细报告链接

---

## ⚙️ 可选：配置 Codecov 行为

在仓库根目录创建 `.codecov.yml`（可选）：

```yaml
# Codecov 配置
coverage:
  status:
    project:
      default:
        target: 80% # 项目整体覆盖率目标
        threshold: 1% # 允许下降1%
    patch:
      default:
        target: 70% # 新增代码覆盖率目标

comment:
  layout: 'reach,diff,flags,tree'
  behavior: default
  require_changes: false

ignore:
  - 'examples/**' # 忽略示例代码
  - 'scripts/**' # 忽略脚本
  - '**/*.spec.ts' # 忽略测试文件
  - '**/*.test.ts'
```

---

## 🎯 Codecov 功能亮点

### 1. 覆盖率徽章

添加到 README.md：

```markdown
[![codecov](https://codecov.io/gh/prehisle/pitype-core/branch/main/graph/badge.svg)](https://codecov.io/gh/prehisle/pitype-core)
```

### 2. PR 集成

每个 PR 会自动收到：

- 📊 覆盖率变化报告
- 🔍 未覆盖代码高亮
- ✅ 通过/失败状态

### 3. 可视化图表

- 📈 覆盖率趋势（时间序列）
- 🌳 文件树形图
- 🎯 热力图（哪些文件覆盖率低）

### 4. 覆盖率 Sunburst

可视化展示项目各部分的覆盖率占比

---

## ❓ 常见问题

### Q: 配置后 CI 仍然显示覆盖率上传失败？

**A**: 这是正常的，因为我们设置了 `continue-on-error: true`。只要 Secret 配置正确，Codecov 仍会收到数据。

### Q: 不配置 Codecov 会影响 CI 吗？

**A**: 不会！我们的配置使用了 `continue-on-error: true`，即使没有配置 token，CI 也会成功通过。

### Q: Codecov 是免费的吗？

**A**: 对于开源项目完全免费，私有项目有免费额度。

### Q: 如何查看详细的覆盖率报告？

**A**: 访问 Codecov Dashboard，点击任意文件可以看到逐行的覆盖情况（绿色=已覆盖，红色=未覆盖）。

---

## 🔗 相关链接

- Codecov 官网：https://codecov.io
- Codecov 文档：https://docs.codecov.com
- GitHub Action：https://github.com/codecov/codecov-action
- 仓库 Dashboard：https://codecov.io/gh/prehisle/pitype-core

---

## 📝 总结

配置 Codecov 后，你将获得：

- ✅ 自动化的覆盖率报告
- ✅ 覆盖率趋势追踪
- ✅ PR 中的覆盖率变化通知
- ✅ 可视化的覆盖率图表

**注意**：即使暂时不配置 Codecov，CI 也会正常运行，不会受到任何影响。可以随时添加。

---

**最后更新**: 2025-11-16
