# 0112: 给 chart template 加上显式 migration pipeline

## 背景

前面已经有了：

- `chart-template v1`
- model-layer create / normalize helper
- golden JSON contract

但 normalize 之前仍然同时承担了两件事：

1. 判断输入是不是 versioned template
2. 决定怎么处理 version

这在只有 `v1` 时还能接受，但如果以后真的出现：

- `v2`
- `v3`
- 不同持久化来源

那么 migration 逻辑就不该继续藏在 normalize 里。

## 主要目标

把 template version 处理从“隐式分支”推进成“显式 migration pipeline”。

## 改动概览

1. 新增 `LATEST_CHART_TEMPLATE_VERSION`
   - 当前值是 `1`
   - 明确告诉运行时和测试：latest 是哪一版

2. 新增 `migrateVersionedChartTemplateToLatest()`
   - 当前只支持：
     - `v1 -> v1`
   - 但它已经把未来 schema 升级的分支位置固定住了

3. `normalizeVersionedChartTemplate()` 改成两阶段
   - 先判断输入是不是 versioned template
   - 如果不是：
     - 包成 latest template
   - 如果是：
     - 通过 migration pipeline 迁到 latest

4. 单测补齐
   - 断言 latest 常量
   - 断言 `v1` 会经过 migration function
   - 断言 `v2` 仍然被显式拒绝

## 关键知识

### 1. 为什么 “现在只有 v1” 也值得先做 migration pipeline

因为 migration 这种东西最容易被拖成技术债。

常见坏路径是：

- 先写个 normalize
- 以后版本多了再补 migration
- 最后 normalize 里堆满 if/else

那时再想拆边界，成本会更高。

现在虽然只有 `v1`，但先把：

- latest 常量
- migrate 函数
- normalize 调 migrate

这三件事立住，后面升级才不会乱。

### 2. normalize 和 migrate 的职责现在分清了

现在两者职责是：

- `normalize`
  - 接受 legacy raw state 或 versioned template
  - 统一成 latest template

- `migrate`
  - 只处理已经带版本号的 template
  - 负责版本升级或拒绝

这比原来“一个函数把所有事都做了”更清楚。

### 3. 为什么 unsupported version 继续直接报错

因为现在还没有：

- `v2 -> v1` 降级策略
- `v2 -> latest` 升级策略
- 宽松兼容规则

在这些都没定义前，最稳的行为仍然是：

- 明确拒绝
- 不偷偷兼容

## 补充知识

### 补充 1：latest 常量的价值不只是可读性

它还决定了后面很多地方的写法：

- 新建 template 默认写哪个版本
- tests 应该期望哪个版本
- migrate 最终要落到哪个版本

所以把它抽成常量，是为了让后续 schema 升级有一个明确锚点。

### 补充 2：为什么这一步还不等于真正支持迁移

因为目前还没有实际发生：

- `v1 -> v2`
- `v2 -> v3`

所以当前只是把迁移框架立住，还没有真实迁移内容。

## 验证

- `pnpm check`
- `pnpm test`

## 未覆盖项

- 还没有实际的跨版本迁移逻辑
- 还没有 persisted file / service payload 的 migration fixtures
- drawings、workspace、multi-chart layout 仍未进入 template schema
