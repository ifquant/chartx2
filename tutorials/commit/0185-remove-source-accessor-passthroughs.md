# 0185 - 删除 Source Accessor 的 Harness 透传层

## 背景

`chart-source-owner` 已经提供了 source 查询和 study 查询的稳定入口：

- `getMainSource`
- `getMainSourceOrThrow`
- `getStudySourcesForPane`
- `getSecondarySeriesForPane`
- `getSourceByApi`
- `buildPrimaryPaneSeries`
- `refreshTradeLocation`

但 `chart-harness` 还保留了一批同名 private wrapper。它们没有额外 policy，只是做类型 cast 后转给 `sourceOwner`。

## 改动

- render coordinator deps 直接调用 `sourceOwner` 查询 main/study/secondary sources。
- chart state restore 和 main-series state helpers 直接调用 `sourceOwner`。
- trade location restore/refresh 直接调用 `sourceOwner`。
- secondary marker mutation 直接通过 `sourceOwner.getSourceByApi()` 获取 source。
- 删除 harness-local source accessor wrapper：
  - `getMainSource`
  - `refreshTradeLocation`
  - `getMainSourceOrThrow`
  - `getStudySourcesForPane`
  - `getSecondarySeriesForPane`
  - `getSourceByApi`
  - `buildPrimaryPaneSeries`

## 为什么没有行为变化

之前路径：

```ts
this.getSourceByApi(...)
  -> this.sourceOwner.getSourceByApi(...)
```

现在路径：

```ts
this.sourceOwner.getSourceByApi(...)
```

所有 source lookup guard、study specialization 和 main source lookup 仍由 `sourceOwner` 内部实现控制。

## 这一刀的价值

### 1. source owner 成为唯一 accessor surface

后续追踪 source 生命周期时，不再需要在 harness wrapper 和 owner 方法之间跳转。

### 2. harness 更接近 composition root

这次没有抽新模块，只是把已经稳定的 owner surface 直接暴露给现有 deps closure。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 check`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 test:unit -- chart-source-owner chart-render-coordinator chart-state-coordinator chart-series-presentation`
- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 build`

## 还没做

- 没有改 source owner 内部实现。
- 没有改 render coordinator 或 state coordinator 接口。
- 没有处理剩余 interaction / drawing drag 逻辑。
