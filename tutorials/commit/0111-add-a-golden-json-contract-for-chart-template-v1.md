# 0111: 给 chart-template v1 补一条 golden JSON contract

## 背景

前面两步已经做了：

- `chart-template v1`
- model-layer create / normalize helper

但如果只有类型和 helper，没有对“实际序列化结果”的约束，template schema 仍然很容易悄悄漂移。

最典型的问题是：

- 字段顺序改了
- 空字段处理变了
- 某些属性突然被保留或丢弃
- 旧版本号没有被明确拒绝

这些问题在运行时不一定立刻炸，但一旦进入：

- 文件存储
- 服务端存储
- 模板迁移
- 跨版本兼容

就会变成真正的问题。

## 主要目标

给 `chart-template v1` 建立一条明确的 JSON golden contract，并锁住不支持的版本会被拒绝。

## 改动概览

1. 新增 `stringifyVersionedChartTemplate()`
   - 输入：
     - raw legacy state
     - 或 v1 template
   - 输出：
     - 规范化后的 v1 pretty JSON 字符串

2. 新增 `chart-template.test.ts`
   - 精确断言：
     - `chart-template v1` 的 JSON 字符串形状
   - 精确断言：
     - `version: 2` 这样的输入会被拒绝

3. 文档同步更新
   - gap checklist 明确记录：template JSON 现在已经有第一条 golden contract

## 关键知识

### 1. 为什么这里要测“字符串”，而不是只测对象相等

对象相等只能说明“语义差不多”。  
但 persistence 真正写出去的是 JSON。

所以这里要锁住的是：

- 根字段名
- 层级结构
- 某些 `undefined` 字段不会被写出去
- 当前 v1 的 JSON 输出长什么样

这比单纯测对象更接近真实存储边界。

### 2. 为什么 unsupported version 要尽早拒绝

如果 `version: 2` 输入被悄悄当成普通对象接受，后面的问题会更隐蔽：

- 看起来“能读”
- 实际上 schema 已经错了
- 错误会拖到更后面的恢复流程才暴露

这次明确在 normalize 阶段就拒绝 unsupported version，是更正确的 schema discipline。

### 3. 为什么现在只做一条 golden，不做整套迁移系统

因为 migration 机制真正复杂的部分还没到：

- `v1 -> v2`
- downgrade policy
- storage adapters
- persisted file tests

这一步先做最小但高价值的约束：

- 当前 v1 长什么样
- 非 v1 不接受

这已经能防止很多低级 schema 漂移。

## 补充知识

### 补充 1：为什么 `undefined` 字段没有出现在 golden JSON 里

`JSON.stringify()` 本来就会跳过对象里的 `undefined` 字段。  
所以像 `requestedSymbol: undefined` 这种值，在最终 JSON 里不会出现。

这也是为什么 golden contract 很重要：

- 它记录的不是 TypeScript 运行时对象
- 而是最终实际可持久化的 JSON 结果

### 补充 2：为什么这个 helper 放在 model layer

因为它表达的是：

- schema normalize
- schema serialize
- schema reject

这都是 persistence / migration 层的职责，不是 view 层职责。

## 验证

- `pnpm check`
- `pnpm test`

## 未覆盖项

- 还没有真正的 `v1 -> future version` migration 测试
- 还没有文件级或服务端存储级 golden fixture
- workspace / multi-chart / drawings 仍未进入 template schema
