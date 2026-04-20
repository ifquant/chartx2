# 0172 - 把 Source / Pane / Drawing Owner 接进 Chart Harness

## 背景

前面很多刀都在“收 `chart-harness`”，但那时大多还是把局部 helper 或 runtime 分支拆出去。这样做能减轻文件重量，却还没有解决一个更关键的问题：`chart-harness` 仍然同时在扮演 source owner、pane command center、drawing public facade。

如果继续只抽 helper，不先建立更高一层的 owner 组合面，后面要做 render coordinator 时，`chart-harness` 还是会保留大量跨模块拼装逻辑。那样它依旧不是 adapter，只是一个体积更小但职责仍混杂的大对象。

所以这次的目标不是“再拆几个函数”，而是先把三条最重的运行时 ownership 线收成明确的组合层：

- source / series owner
- pane owner
- drawing lifecycle / public owner

然后再让 `chart-harness` 去消费这些 owner。

## 改动

- 新增 `chart-source-owner.ts`，统一承接：
  - main-series chart type switch
  - primary / secondary data replace 与 update
  - typed source lookup
  - study attach wiring
  - primary pane series assembly
  - trade-location refresh trigger
- 新增 `chart-pane-owner.ts`，统一承接：
  - pane handle construction
  - pane resize subscribe / unsubscribe
  - pane options / height mutation
  - pane removal guard
  - pane target resolution
  - pane state / snapshot / event publication
- 新增 `chart-drawing-owner.ts`，统一承接：
  - drawing meta allocation
  - pane-aware drawing creation
  - drawing registry lookup / list / count
  - selected-drawing public state / property schema / apply-options
  - remove / clear / restore drawing glue
- `chart-harness.ts` 改成把 source、pane、drawing 这三条线的大部分 public/private entrypoint 委托给对应 owner。
- `docs/chart-workstation-architecture.md` 增加了新的 owner 边界说明，并明确下一阶段应该收 render coordinator。

## 这样做的意义

### 1. 先把 ownership 收清楚，再谈 render coordinator

render coordinator 是下一条大线，但它天然会依赖：

- source 如何提供主图和副图数据
- pane 如何提供 pane state 和 event surface
- drawing 如何提供 pane-local drawing lists 和 selected state

如果这三条线还散落在 `chart-harness` 的不同角落，render coordinator 一旦开始抽，就会把更多旧耦合一起打包带走。最后只是把“大 harness”换成“大 render module”。

这次先把三条 owner 面收清楚，下一刀的 render coordinator 才有稳定依赖面。

### 2. `chart-harness` 开始更像 composition root

以前很多 entrypoint 都是：

- 直接在 harness 里组依赖
- 直接做 guard
- 直接触发 render / emit / selection cleanup

现在这些入口更多变成：

- harness 收到命令
- 委托给 source owner / pane owner / drawing owner
- harness 只保留顶层对象引用和极少量 glue

这才是“把 harness 收成 adapter”的真实起点。

### 3. 并发 buildout + 串行 integration 是合理切法

这次的工作方式也值得记住：

- Wave 1：并发新增 owner module 和对应 tests，不改 `chart-harness`
- Wave 2：串行把 owner 接回 `chart-harness`

原因很简单：owner 模块的写集可以分离，但 `chart-harness.ts` 只有一个，平行改它只会制造冲突和脏历史。这个切法比继续一刀一刀抽小 helper 更适合后段收口。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-owner chart-pane-owner chart-drawing-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 还没有抽 render coordinator，`render()` / readout / axis / render tail 这条 fanout 主链还在 `chart-harness`。
- 还没有做 final adapter-shell cleanup，harness 里仍留有不少旧 import 和一些可以继续下沉的辅助分支。
- restore/public shell 还没有在 owner 稳定后再做第二轮总收口。
