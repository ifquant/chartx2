# 0261: 给 generalized linked pane resize 补浏览器级回归

前面几笔 `0258` 到 `0260` 已经把 pane/layout 这条线里的 downstream linked resize 做出来了：

- primary divider 可以代理下游 resizable pane
- clamp 改成按 controlled pane 的真实 span 算
- fixed secondary-secondary divider 也能继续往下游找第一个 resizable pane

这些行为在 unit 层已经锁得比较严了，但还缺一层更高的确认：

- 浏览器里的真实 canvas pointer drag
- 经过 public API 和实际事件分发之后
- 是不是真的还能把变化落到正确的 pane handle 上

这次补的就是这一层。

## 1. 为什么不能只看 unit

unit 只能证明：

- `resolvePaneDivider(...)`
- `resolveControlledPaneId(...)`
- `resolveControlledResizeHeight(...)`
- `applyPaneResize(...)`

这些纯逻辑和运行时组合是通的。

但 linked resize 还依赖另一个更脆的链：

- 真实 canvas 命中 divider
- pointer down 把 state 锁好
- pointer move 走到 pane runtime
- public pane handle 读到的是正确结果

这部分如果没有浏览器级覆盖，未来很容易在：

- layout 常量
- pointer 命中坐标
- public handle 读值口径

这些地方悄悄漂掉。

## 2. 这次具体加了什么

在：

- `tests/visual/phase-one-api.spec.ts`

新增了一条 Playwright API test：

- 创建 `primary + fixed + fixed + resizable` 的多 pane fixture
- 用真实鼠标去拖 `pane-1 / pane-2` 之间的 divider
- 拖完后回读 pane handles

这条测试验证的是：

- `fixedUpperPane.getOptions().height` 不变
- `fixedLowerPane.getOptions().height` 不变
- `resizablePane.getOptions().height` 发生变化

也就是浏览器实际交互之后，真正被改的是 downstream controlled pane。

## 3. 一个容易踩坑的点

这次测试里最重要的一个经验是：

- 不要用 `pane.getHeight()` 去断言 fixed pane “完全没变”

原因是：

- `getHeight()` 读的是当前 frame/render height
- 在小画布上，多 secondary pane 会一起参与 frame allocation
- 即便某个 fixed pane 的 preferred height 没变，它的最终 render height 也可能因为整体缩放而变化

所以浏览器级测试里真正稳的断言口径应该是：

- `pane.getOptions().height`

这才对应 pane 自己的 preferred height / public options state。

`getHeight()` 仍然有价值，但更适合拿来证明：

- 当前 frame 真的发生了响应

而不是证明：

- 某个 fixed pane 的内部选项没有被改写

## 4. 这一步为什么单独成一笔

这次没有继续改 linked-resize 行为本身。

它做的是另一件同样必要的事：

- 把刚实现出来的 pane/layout 行为，从 unit-only 变成 browser-verified

这能防住一种很常见的回归：

- 纯逻辑没坏
- 但真正的 pointer hit / public handle / runtime glue 漂了

对于这种交互链路，少这一层回归，后面很容易又要靠人工截图或肉眼回归去兜。

## 验证

- `pnpm -C /Users/dev/workspace2/hc_apps/chartx2 exec playwright test tests/visual/phase-one-api.spec.ts -g "fixed middle dividers interactive"`

## 未包含

- 没有新增 screenshot baseline
- 没有跑整份 `phase-one-api.spec.ts`
- 没有再改 pane/layout 的 linked resize 逻辑本身
