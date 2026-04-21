# 0201 - Extract Series Build Owner

## 背景

`chart-harness` 里还剩一组看起来很小、但 ownership 很关键的 private builder：

- `createSeriesMeta`
- `createSeriesLabel`
- `createSeriesOptions`
- `createMainSeriesOptions`
- `createMainSourceState`

这些方法不是独立业务能力。它们共同负责 series 创建时的基础材料：id 分配、显示名、默认 options 克隆、主图 style surface 映射、主图 source state 创建。

如果继续把它们留在 harness，source owner 和 primary/secondary factory deps 看起来仍然依赖 harness 的“内部能力”，而不是一个清晰的 series build composition surface。

## 本次改动

新增 `chart-series-build-owner.ts`，集中承接：

- series ordinal 分配
- series meta / label 创建
- generic series options 克隆
- main-series options 克隆
- main source state 创建

`chart-harness` 现在只创建一次 `seriesBuildOwner`，然后把它传给 source owner / primary factory / state coordinator 的依赖闭包。

## 为什么这是 owner 而不是 leaf helper

`chart-series-builders.ts` 已经是 leaf use-case 层，适合测试纯函数：

```ts
createSeriesMeta(kind, ordinal, deps)
createSeriesOptions(kind, defaults)
createMainSourceState(params, defaults, deps)
```

但 harness 之前真正持有的是组合责任：

- 下一个 series ordinal 是 mutable runtime state
- defaults 来自 chart runtime options
- main style schema 要解析成 option surface
- main source state 创建要复用 main options builder

这些组合关系不应该散在 harness private methods 里，所以这次新增的是 build owner，而不是继续扩大 leaf helper。

## 对 harness 的影响

删除了 `nextSeriesId` 字段和 5 个 private builder methods。

调用路径从：

```ts
this.createSeriesMeta(kind)
this.createSeriesOptions(kind)
this.createMainSourceState(...)
```

变成：

```ts
this.seriesBuildOwner.createMeta(kind)
this.seriesBuildOwner.createOptions(kind)
this.seriesBuildOwner.createMainSource(...)
```

这让 harness 更接近 composition root：它提供 defaults 和 price scale identity，但不再自己表现为 series builder。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-series-build-owner chart-series-builders chart-primary-series-factory chart-source-owner`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`
- `git diff --check -- src/lib/chartx/internal/views/chart-harness.ts src/lib/chartx/internal/views/chart-series-build-owner.ts tests/unit/chart-series-build-owner.test.ts docs/chart-workstation-architecture.md tutorials/commit/0201-extract-series-build-owner.md`

## Not included

- 没有改 series options 默认值。
- 没有改 main-series style schema 映射规则。
- 没有改 source owner 的 public surface。
