# 0121: 把第一版 magnet 收成可控、可读的交互面

这次不是再扩新的吸附规则，而是把已经存在的 magnet 收成一个更像真正编辑器的能力面。

上一刀已经有了：

- OHLC price snapping
- drag 时的虚线 snap guide

但还差两个明显问题：

1. 用户虽然看得到 guide，但不一定能立刻读出“具体吸到了多少价格”
2. chart 没有统一 magnet 开关，调用方没法把这套行为整体关掉

所以这次补的是：

- chart-level magnet options
- price-axis magnet label

## 做了什么

### 1. 给 chart options 加入 drawings.magnet 控制面

这次把 magnet 先收成最小 chart-level 配置，而不是散落在 drawing 自己的局部逻辑里。

现在支持的字段是：

- `drawings.magnetEnabled`
- `drawings.magnetGuideVisible`
- `drawings.magnetLabelVisible`

这三个字段的目的不同：

- `magnetEnabled`
  - 真正控制是否执行 OHLC price snapping
- `magnetGuideVisible`
  - 控制 drag 过程中是否画水平 guide
- `magnetLabelVisible`
  - 控制价格轴上是否显示 magnet label

这样后面要继续扩成更完整的 magnet surface 时，不需要再重新开一套入口。

### 2. 给价格轴补 magnet label

现在如果 trend-line endpoint drag 已经命中了 magnet：

- 除了 pane 内部那条水平虚线
- 价格轴上还会多一个临时标签

当前标签格式是：

- `MAG 132.00`

它用 drawing 自身颜色来画边框和背景。

这个 label 的作用不是替代 guide，而是补上“精确读数”。

用户不必自己估算：

- guide 大概落在哪儿

现在可以直接看到：

- 系统吸到的就是这个价格

### 3. magnet 关闭时彻底退回自由拖动

这次不是只把显示关掉。

如果：

- `drawings.magnetEnabled = false`

那么 endpoint drag 会直接使用 raw price，不再尝试找最近 bar 的 OHLC，也不会挂起 snap guide。

这样“关闭 magnet”才是完整语义，不会变成：

- 表面关了
- 内部其实还在偷偷纠正价格

## 增加了什么验证

### 1. snap guide 的截图基线继续保留

原来的视觉契约还在：

1. 选中 trend-line
2. 发起 drag
3. 拖到会触发 magnet 的区域
4. 在 mouse 仍然按住时截图

这次截图里会把新的 price-axis magnet label 一起锁住。

### 2. 新增 magnet disable 契约

新增了一条浏览器契约：

1. 创建 chart
2. `applyOptions({ drawings: { magnetEnabled: false } })`
3. 仍然把 endpoint 拖到靠近 `132` 的位置
4. 断言拖完后，endpoint 没有被吸到 `132`

这条测试的意义是：

- 锁住 magnet toggle 真正控制行为，而不只是 UI 显示

## 为什么这一步重要

编辑器里的“辅助纠正”要成立，通常要满足两件事：

1. 用户知道系统在帮他做什么
2. 用户能决定要不要这个帮助

之前我们已经做到第 1 条的一半：

- 有 guide

这次把另外一半也补上了：

- 有价格 label
- 有全局开关

所以这次之后，第一版 magnet 才算从“内部算法”升级成了“真正可使用的交互能力”。

## 这次仍然没做

这次**没有**做：

- time snapping
- magnet source 选择（open/high/low/close 单独开关）
- snapping tooltip
- axis 上的更丰富 magnet UI
- drawing 级别的局部 magnet 覆盖

所以这仍然是第一版 magnet surface，不是完整专业版 drawing magnet 系统。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "drawing magnet can be disabled|snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body"
```

## 一个小知识点

编辑器交互里，“assist” 和 “fight the user” 的差别，经常不在算法本身，而在：

- 是否可见
- 是否可关

同一套 snapping，

- 看不见、关不掉时像 bug
- 看得见、关得掉时更像工具
