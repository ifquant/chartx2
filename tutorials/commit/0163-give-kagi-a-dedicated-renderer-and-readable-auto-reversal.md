# 0163: 给 `Kagi` 单独做 renderer，并把 auto reversal 收到可读区间

这刀不是继续调 demo 颜色，而是直接收 `Kagi` 本体。

用户指出的问题是对的：之前的 `Kagi` 看起来像一团蓝色噪声线，不像真正的 `Kagi`。根因有三层：

1. builder 过于敏感  
   自动 reversal size 对长原始 K 线序列太小，10k 根 workbench bars 最后能生成几百段 `Kagi` swings。

2. renderer 其实还不是 `Kagi` renderer  
   之前只是把 `Kagi` rows 塞进了通用 `segment` 路径，本质上还是普通折返线。

3. workbench 的 lower panes 还在吃 raw time bars  
   这会把 shared logical range 又重新撑回原始时间长度，视觉上更像“噪声折线 + 被拉伸的横轴”。

## 这次做了什么

### 1. 给 `Kagi` 单独做 renderer

把 chart type registry 里的 `kagi` renderer 从通用 `"segment"` 切成独立 `"kagi"`。

新的 `KagiRenderer` 会：

- 按每段 synthetic row 画竖向主干
- 在段与段之间画横向连接
- 用更明显的粗细差表达 `yang/yin` 状态

这一步的意义不是“更好看一点”，而是把 `Kagi` 从“普通段线的别名”推进成真正有自己线型语义的主图。

### 2. 把 `Kagi` auto reversal 改成目标段数驱动

原来的 `inferKagiReversalSize(...)` 只看：

- average true range
- average delta
- sample price range

这会让长输入在高频震荡里生成过多段数。  
这次改成：

- 先算一个 baseline reversal
- 再对一组 candidate reversal 跑真实 `buildKagiSegments(...)`
- 用目标 swing 数打分，选更接近“默认可读区间”的 candidate

这里保留了一个很重要的边界：

- 短输入（`<= 64` 根）继续用 baseline
- 长输入才走“目标段数驱动”的 auto 调整

这样不会把单元测试里那种短而确定的 canonical 数据一起改坏。

### 3. workbench 的 `Kagi` lower panes 改成跟 synthetic rows 走

`Kagi` 主图现在继续吃同一份原始 K 线输入，但：

- volume pane 改成基于 `kagiRows`
- study line pane 也改成基于 `kagiRows`

也就是说，workbench 里的 lower panes 不再把 `Kagi` 横轴硬拉回 raw time bars。

这一步还是 demo 层逻辑，不是完整的 engine-level ordinary secondary parity，但它先把用户真正看到的主图观感拉回来了。

### 4. workbench 默认视口也一起收

`Kagi` 的 bar spacing 和默认 visible logical range 都重新调过：

- 列少时直接看全
- 列多时只看最后一段更可读的窗口

这一步和 auto reversal 是配套的，不然即使段数降下来了，默认视图仍然可能挤成一团。

## 为什么这一步值钱

这刀之后，`Kagi` 不再只是“已经有 chart type 这个名字”：

- builder 不再那么敏感
- renderer 不再复用 generic segment path
- workbench 默认图终于像 `Kagi`，而不是噪声折返线

对 chart engine 来说，更关键的是：

`Kagi` 现在终于有了“builder + renderer + viewport policy”这三件套，而不是只有 builder 占位。

## 还没收完的

这刀仍然不是完整 TradingView parity，后面还缺：

1. `Kagi` 更严格的 reversal / shoulder-waist 语义
2. 更明确的 `yang/yin` 颜色和样式 schema
3. ordinary secondary series 在 engine 层对 synthetic main 的统一对齐，而不是先靠 workbench 层派生
4. API fixture 里的 `Kagi` 默认 visual baseline 还比较薄，当前更主要是 contract coverage，不是最终展示效果
