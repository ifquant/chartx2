# 0126: 增加显式的 time magnet policy 控制面

这次继续收 `drawing magnet`，但不是再加一个布尔开关，而是把时间吸附的“选哪个 bar”从隐式逻辑升级成显式 policy。

## 之前的问题

前面已经有：

- `timeMagnetEnabled`
- `timeMagnetTolerancePx`

这两项已经能控制：

- 时间磁吸开不开
- 多近才算命中

但还缺一层真正的策略面：

- 命中以后，到底吸到哪个 bar？

之前代码里这件事是隐式的：

- 默认就是“最近 bar”

这会带来两个问题：

1. 行为可用，但不可声明
2. 后面如果要做更专业的 drawing assist，就只能继续往 helper 里塞 if/else

## 这次做了什么

### 1. 增加 `timeMagnetPolicy`

现在 `drawings` 下面新增：

- `timeMagnetPolicy: "nearest" | "previous" | "next"`

默认值仍然是：

- `nearest`

所以不改配置时，用户看到的行为不会变化。

### 2. 把时间磁吸目标选择独立成 policy helper

`resolveSnappedDrawingTime()` 不再自己直接决定目标 bar，改成调用：

- `resolveTimeMagnetTargetBar()`

这个 helper 现在分 3 条路径：

- `nearest`
  - 延续原来的最近 bar 行为
- `previous`
  - 吸到当前 logical 坐标左侧最近的 bar
- `next`
  - 吸到当前 logical 坐标右侧最近的 bar

这样结构上就清楚了：

- 是否启用：`timeMagnetEnabled`
- 命中阈值：`timeMagnetTolerancePx`
- 命中后策略：`timeMagnetPolicy`

这是比继续加散乱布尔值更健康的模型。

### 3. 保持“未命中时走连续时间”

这一点没有被这次改坏：

- 只有命中 tolerance 时，才按 policy 离散化到某个 bar
- 未命中时，仍然走插值连续时间

也就是说：

- policy 决定的是“命中后吸哪根”
- 不是“永远强行跳到某根 bar”

## 增加了什么验证

这次补了两条浏览器契约：

1. `timeMagnetPolicy: "previous"` + 大 tolerance
   - 把 endpoint 拖到 bar 1 和 bar 2 的中间
   - 断言最终时间落到前一根 bar

2. `timeMagnetPolicy: "next"` + 大 tolerance
   - 同样拖到中间
   - 断言最终时间落到后一根 bar

这两条测试锁住的是：

- time magnet policy 不再只是类型定义
- 它已经进入真实交互路径

## 为什么这一步重要

很多交互系统开始时，配置只有：

- 开 / 关

然后再往前一步：

- 开 / 关 + tolerance

但真正变成“系统能力”的时候，通常还要再补：

- 开 / 关 + tolerance + policy

因为用户感知到的交互差异，常常不是有没有命中，而是：

- 命中后到底怎么选目标

## 这次仍然没做

这次**没有**做：

- time magnet 更丰富的 source 模型
- drawing 级 time magnet policy override
- 针对不同 drawing tool 的默认 policy
- 更丰富的 snap tooltip
- z-order / grouping / 多选编辑

所以这一步做完后，time magnet 已经有了第一版明确策略面，但还没进入完整的专业 drawing editor 级别。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "time magnet policy can snap to the previous bar|time magnet policy can snap to the next bar|time magnet tolerance can disable time snapping without disabling the feature|magnet tolerance can disable price snapping without disabling magnet|time magnet can be disabled independently|magnet honors source filters|drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

很多“看起来已经能用”的交互，之所以还不算系统能力，往往就是因为：

- 行为是隐式的

一旦把隐式行为提炼成：

- policy

它才真正开始可测试、可复用、可演进。
