# 0119: 给 trend-line 端点拖拽补最小 OHLC 磁吸

这次提交补的是 drawing 编辑里的第一条 `magnet / snapping` 能力。

目标不是一次做完整吸附系统，而是先把最有解释力的一条规则立住：

- 拖 trend-line endpoint 时
- 如果当前价格已经很接近最近 chart bar 的某个 OHLC
- 那就直接吸到那个 OHLC 上

这比完全自由拖动更像真实图表软件，也更容易让线段落在“有意义的价格位”上。

## 这次做了什么

### 1. 给 trend-line endpoint drag 加最小 price snap

当前实现里，endpoint 拖拽仍然先算出原始拖拽价格。

然后会去做一步最小吸附判断：

1. 用当前拖拽位置的 `x` 找到最近的 chart bar
2. 取这个 bar 的 `open / high / low / close`
3. 把这 4 个价位都映射回当前 pane 的 `PriceScale`
4. 如果拖拽点距离其中某个价位的像素距离足够近
   - 就直接返回这个 OHLC 价格
5. 否则仍然保留自由拖动得到的原始价格

也就是说，这次的磁吸不是“全局 price grid”，而是：

- `nearest bar OHLC magnet`

### 2. 这条 magnet 仍然服从 chart 当前上下文

它没有引入第二套坐标。

仍然是：

- time 用 chart 当前共享 `TimeScale`
- price 用当前 pane 的 `PriceScale`
- 只是在 price 计算的最后一步加了 OHLC 吸附

这保证了 snapping 只是编辑增强，不是新的 drawing 数据模型。

### 3. 增加浏览器契约

新增 Playwright 契约：

1. 先选中 trend-line
2. 从已命中的 line body 发起拖拽
3. 把 endpoint 拖到接近 `132` 的位置
4. 校验拖拽后至少有一个 endpoint 被吸到 `132`

这里选择 `132`，是因为测试数据里这个价位本身就是最近 bar 的有效 OHLC。

## 为什么先做这条 snapping

因为 snapping 有很多可能做法：

- 对网格吸附
- 对 bar high/low 吸附
- 对 marker / price line 吸附
- 对 session open / previous close 吸附

其中最容易解释、也最符合图表软件直觉的第一条，通常就是：

- 对最近 bar 的 OHLC 吸附

它简单、有效，而且很容易验证。

## 当前仍然没做

这次**没有**做：

- time snapping 的额外策略
- 多种 magnet source 选择
- 开关式 snapping UI
- 对 compare / overlay / study 值的吸附
- 吸附辅助线
- 吸附提示文本

所以这还是最小 price magnet，不是完整 snapping system。

## 验证

本次实际跑过：

```bash
pnpm check
pnpm test:unit
pnpm exec playwright test tests/visual/phase-one-api.spec.ts -g "snaps endpoint prices to nearby bar OHLC levels|move cursor over the nearest endpoint handle|nearest endpoint from the line body" --config /tmp/chartx2.playwright.drawing.config.ts
```

## 一个小知识点

做编辑器时，snapping 的一个实用顺序通常是：

1. 先做“用户能理解为什么会吸过去”的吸附
2. 再做更复杂、更强的吸附体系

如果第一条吸附规则本身就很难解释，用户会把它理解成“拖拽不准确”而不是“有磁吸帮助”。  
OHLC 吸附的好处就是，它天然有金融图表语义。
