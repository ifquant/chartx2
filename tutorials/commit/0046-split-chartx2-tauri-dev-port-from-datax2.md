# 0046 - 把 chartx2 的 Tauri 开发端口从 datax2 拆开

这次提交解决的是一个很容易误导人的问题：在 `chartx2` 里执行 `pnpm tauri dev`，结果窗口里看到的却是 `datax2`。原因不是 Tauri 指错了项目，而是两个项目都把前端开发服务绑定在同一个端口上。

## 问题根因

- `chartx2` 的 `vite dev` 使用 `1420`
- `chartx2` 的 `tauri.conf.json` 也把 `devUrl` 指向 `http://localhost:1420`
- `datax2` 恰好也用了同一组端口

这样只要 `datax2` 先启动，`chartx2` 的桌面壳就会连到已经存在的 `1420`，于是看起来像“打开错项目”。

## 这次改了什么

1. 把 `chartx2` 的 Vite dev 端口改成 `1422`
2. 把 `chartx2` 的 HMR 端口改成 `1423`
3. 把 Tauri `devUrl` 改成 `http://localhost:1422`

这样 `chartx2` 和 `datax2` 就不会再争抢同一个前端地址。

## 新人需要知道的两件事

1. Tauri 开发态看到的页面，取决于 `devUrl` 指向哪个前端服务  
   所以如果多个项目共用端口，桌面窗口“串项目”是完全可能发生的。

2. `strictPort: true` 很适合这类桌面项目  
   它会要求 Vite 必须拿到指定端口，而不是悄悄跳到别的端口，能更快暴露配置冲突。

## 这次还没做

- 没有统一整个 `hc_apps` 下所有 Tauri 项目的端口规划
- 没有改动 `datax2`，只修正了 `chartx2` 这一侧的冲突
