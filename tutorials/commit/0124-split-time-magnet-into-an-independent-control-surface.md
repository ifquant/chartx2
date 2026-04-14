# 0124: 把 time magnet 拆成独立控制面

这次不是继续扩新的 snapping 视觉，而是把 `time magnet` 从“依附在现有 magnet 配置上”拆成真正独立的一条能力线。

## 之前的问题

上一刀之后，time snapping 已经有：

- 竖向 guide
- time axis label

但它仍然有一个结构问题：

- `time magnet` 还没有自己的开关

换句话说，调用方虽然能关：

- 整体 magnet
- price guide
- price label

但还不能单独说：

- 我只想保留价格吸附，不要时间吸附

这会让 magnet surface 仍然偏“半成品”。

## 这次做了什么

### 1. 增加独立的 time magnet 配置

现在 `drawings` 下面新增：

- `timeMagnetEnabled`
- `timeMagnetGuideVisible`
- `timeMagnetLabelVisible`

这三个配置的语义是：

- `timeMagnetEnabled`
  - 控制 endpoint time 是否真正吸附到最近 bar 时间槽
- `timeMagnetGuideVisible`
  - 控制竖向 guide 是否显示
- `timeMagnetLabelVisible`
  - 控制 time axis 上的 magnet label 是否显示

这样 price magnet 和 time magnet 终于不再共用一把大开关。

### 2. time magnet 关闭后，不再强制吸到最近 bar

这次最重要的不是多加几个布尔值，而是让关闭后的行为真的变掉。

为了做到这点，`resolveSnappedDrawingTime()` 现在分两种路径：

- time magnet 开启
  - endpoint time 吸到最近 bar
- time magnet 关闭
  - endpoint time 按当前 logical 坐标在相邻 bars 的时间之间做插值

这意味着：

- 关闭后，trend-line endpoint 可以落在连续时间上
- 而不是表面看起来“关了”，实际上还是被最近 bar 吸住

### 3. 绘制路径也跟着支持连续时间

因为关闭 time magnet 后，drawing 上保存的时间可能不再正好等于某根 bar 的时间，
所以 `resolveDrawingTimeCoordinate()` 也同步升级了：

- 以前：总是找最近 bar
- 现在：如果 time 落在两根 bars 之间，会按时间比例插值出真实横坐标

这一步很关键，不然关闭 time magnet 只是数据层变成连续值，画面上还是会被吸回最近 bar。

## 增加了什么验证

新增了一条浏览器契约：

1. 创建 chart
2. `applyOptions({ drawings: { timeMagnetEnabled: false } })`
3. 选中 trend-line
4. 把 endpoint 往中间位置拖动
5. 断言拖完后的 `startTime`/`endTime` 不是整数 bar time

这条测试真正锁住的是：

- 关闭 time magnet 后，时间不再被最近 bar 强制离散化

而不是只验证 guide/label 没显示。

## 为什么这一步重要

这一步的意义在于：

- `time magnet` 第一次从“显示层反馈”升级成“真正独立的行为控制面”

如果没有这一步，time magnet 看起来像有配置，其实本质还是写死在拖拽逻辑里。

## 这次仍然没做

这次**没有**做：

- time magnet source/policy 选择
- 只关 time guide、保留 time label 的更细体验验证
- time snapping tooltip
- drawing 级局部 time magnet override

所以这次做完后，time magnet 仍然是第一版独立控制面，但已经不再是“只能跟着 price magnet 走”的附属能力。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "time magnet can be disabled independently|magnet honors source filters|drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --update-snapshots --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

很多“可配置能力”真正的分水岭不在于：

- 有没有配置项

而在于：

- 配置项会不会改变真实行为

如果关掉后行为不变，那它更像装饰。  
如果关掉后路径真的分叉了，才算独立控制面。
