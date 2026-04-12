# 0109: 给 chart persistence 加上 versioned chart template v1 外壳

## 背景

前几次提交已经让 `chartx2` 可以保存和恢复：

- main series state
- chart-owned layout state
- managed secondary series
- 一部分 studies

但这些能力目前都还挂在原始的 `getChartState() / applyChartState()` 上。  
它能工作，但还不够像一个真正可演进的 template 系统。

因为一旦后面要继续扩：

- drawings
- 更多 indicator families
- template migration
- workspace persistence

就一定会碰到一个问题：

**旧 snapshot 怎么兼容新 schema？**

所以这一步先不把 scope 扩大，而是先把 persistence 边界变成：

- 有显式 kind
- 有显式 version
- 有 normalize 入口

这才是后面继续做 template 演进的正确起点。

## 主要目标

在不打碎现有 `chart state` API 的前提下，引入第一版 versioned chart template schema。

## 改动概览

1. 新增 `PhaseOneChartTemplateV1`
   - 结构是：
     - `kind: "chart-template"`
     - `version: 1`
     - `chart: PhaseOneChartStateSnapshot`

2. 新增 template helper
   - `createPhaseOneChartTemplate()`
   - `normalizePhaseOneChartTemplate()`

3. 扩展 public chart API
   - `getChartTemplate()`
   - `applyChartTemplate()`

4. 保留旧 API 作为兼容层
   - `getChartState()`
   - `applyChartState()`
   - 旧调用方不需要立刻迁移

5. 增加验证
   - unit test 锁住：
     - raw state -> template normalize
     - v1 template -> normalize
   - browser parity test 锁住：
     - `getChartTemplate()`
     - 改乱 chart
     - `applyChartTemplate()`
     - 恢复结果应与原模板一致

## 关键知识

### 1. 为什么这一步要先加“外壳”，而不是继续加字段

很多项目做 persistence 时，先一路往原始 snapshot 里塞字段。  
短期会很快，长期会很痛。

因为没有：

- schema identity
- version
- normalize / migration boundary

后面每次升级都会变成“全世界一起改”。

这次先加外壳，目的不是增加用户可见功能，而是把未来演进的成本压下来。

### 2. 为什么还保留 `getChartState() / applyChartState()`

因为当前 repo 里已经有：

- 测试
- demo 用法
- 外部 API 预期

都还建立在 raw state 上。

如果这一步直接删除旧 API，会把一次结构重构变成一次不必要的大规模破坏性迁移。

所以当前策略是：

- 新路径：`getChartTemplate() / applyChartTemplate()`
- 旧路径：`getChartState() / applyChartState()`
- 中间通过 `normalizePhaseOneChartTemplate()` 接起来

这更稳，也更符合逐步演进的做法。

### 3. normalize 层为什么重要

当前 normalize 只做两件事：

1. 识别已经是 `chart-template v1` 的输入
2. 把旧的 raw chart state 包装成 `chart-template v1`

它现在看起来很薄，但这是故意的。

因为以后 template version 升级时，这里就会变成：

- `v1 -> v2`
- `v2 -> v3`
- raw legacy -> latest

也就是说，这一步真正建立的是 migration hook，而不是当前这一版的小功能。

## 补充知识

### 补充 1：为什么 template 的内容仍然放在 `chart` 字段里

因为这一步还没有引入：

- multi-chart layout
- workspace-level settings
- drawing template
- user settings template

所以当前 template 还只是单 chart 模板。

用 `chart` 作为 payload 字段，后面扩展成：

- `layout`
- `charts`
- `userSettings`

会比直接把所有字段平铺在根上更稳。

### 补充 2：为什么这一步不是完整 template versioning

因为真正完整的 template versioning 还需要：

- migration strategy
- schema evolution rules
- downgrade / unsupported behavior policy
- serialization stability tests

这次只是先把 versioned 边界立住，还没有把整个模板系统做完。

## 验证

- `pnpm check`
- `pnpm test`

## 未覆盖项

- template migration 目前只有 `v1 + legacy raw state` 两种输入路径
- drawings、workspace persistence、multi-chart layout 仍未进入 template schema
- 更广的 indicator families 还没有统一的 template snapshot 结构
