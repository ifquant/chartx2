# 0120: 给 trend-line 的磁吸补可见 guide

这次提交没有继续扩磁吸规则，而是补了磁吸时的可见反馈。

上一刀已经能把 trend-line endpoint 吸到最近 bar 的 OHLC。  
但如果用户看不见“现在已经吸住了哪个价位”，体验仍然会像是：

- 拖动时价格偶尔自己跳了一下

所以这次补的是：

- drag 过程中如果当前 endpoint 已经被 magnet 吸住
- 就在当前 pane 里画出一条临时 guide line

## 做了什么

### 1. 增加 runtime-only snap guide state

新增的是：

- `drawingSnapGuide`

它只在当前 drag 过程中存在，包含：

- `paneId`
- `price`
- `color`

这仍然是纯运行时交互状态，不进入 template / snapshot。

### 2. 只有真的 magnet 命中时才显示 guide

price snapping helper 现在返回两部分信息：

- `price`
- `snapped`

也就是：

- 没有吸附时
  - 仍然走自由拖动价格
  - 不显示 guide
- 吸附命中时
  - 返回吸附后的 OHLC 价格
  - 同时挂起一条临时 snap guide

这样 guide 不会污染普通拖动。

### 3. 在 pane 内画一条临时虚线 guide

当前 guide 的视觉是最小版本：

- 水平虚线
- 使用当前 drawing 的颜色
- 只在对应 pane 内显示

它的作用只是告诉用户：

- “你现在已经吸到这个价位”

这一步还没有做 price label、吸附说明、或更复杂的引导 UI。

### 4. 增加视觉契约

这次新增了一条截图型 Playwright 契约：

1. 选中 trend-line
2. 发起 endpoint drag
3. 把它拖到会触发 OHLC magnet 的位置
4. 在 mouse 仍然按住、guide 仍然存在时截一张图

这样能把“吸附确实有可见反馈”这件事锁成真实视觉基线，而不是只靠数据断言。

## 为什么先做这个

因为 magnet 如果没有可见反馈，用户会很难分清：

- 是我手抖了
- 还是系统在帮我吸附

所以一个常见顺序是：

1. 先让 snapping 发生
2. 再让 snapping 可见
3. 之后再做更高级的 guides / labels / controls

这次做的是第 2 步。

## 这次仍然没做

这次**没有**做：

- snap guide 的价格标签
- 多条 guide 同时显示
- time snapping guide
- 可配置 magnet source
- snapping 开关
- snapping tooltip

所以这仍然只是最小视觉 magnet feedback，不是完整 snapping UI。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "snap guide|snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

编辑器类交互里，用户通常更能接受“被系统纠正”，前提是这个纠正是可见的。

如果 correction 不可见，它就像 bug。  
如果 correction 可见，它就更像 assist。
