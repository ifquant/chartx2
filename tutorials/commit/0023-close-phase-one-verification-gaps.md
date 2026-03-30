# 0023: 收掉 phase-one 最后的验证缺口

这次提交把 `chartx2` 的 phase-one 从“功能上大体够了”推进到“文档、测试、状态都真正闭环了”。

核心变化：

- 增加 host init failure 的浏览器测试，确认图表初始化失败时页面会显示可见错误态。
- 增加 high-DPI 浏览器基线，确认 canvas backing-store 会按 `devicePixelRatio` 放大。
- 增加 `2K / 5K bars` 的性能 smoke，覆盖首帧、zoom、crosshair、pan 这几个 phase-one 热点。
- 更新 phase-one checklist、foundation summary 和宿主页文案，把当前状态切到 `COMPLETE`。

为什么这一步单独值得做：

- 如果只看功能实现，phase-one 很容易过早宣布完成。
- 真正的收口需要把 checklist 里剩下的 failure modes、performance floor、和验证空格都补上。

这一步刻意没有做的事：

- 没有扩更多 series，也没有开始多 pane、指标或工作台 UI。
- 没有把性能 smoke 变成终局 benchmark；它仍然只是 phase-one floor 的保守门槛。

补充知识：

1. `high-DPI` 验证不一定非得依赖真 Retina 机器。在浏览器测试里覆盖 `window.devicePixelRatio`，就能先锁住 canvas backing-store 是否按比例放大。
2. 做性能 smoke 时，门槛最好保守且可重复。phase-one 要的是“及时发现退化”，不是在 CI 里追求极限跑分。
