# dsh-settings-footer

把 DeepSeek Harness 侧边栏的「设置」移到**顶部**，并清空侧边栏底部。

dsh 0.2.1 把 Settings 折进了底部账号入口：未登录时显示「⋯ 更多」，点开是二级菜单
（设置 / 意见反馈 / 登录）。本插件按个人偏好改回单层入口，并把底部清干净。

## 效果

改造前后的侧边栏顶部：

```
之前                          之后
─────────────                ─────────────
品牌行                        品牌行
+ 新会话                      ⚙ 设置
Cordis Plugin · N running     全局面板
对话列表                       对话列表
…
⋯ 更多        ← 底部          （底部完全空白）
```

1. **设置顶置** —— 一行「齿轮 + 设置」，尺寸沿用 dsh 0.2.1 之前官方设置按钮的
   几何（42px 高、8px/10px 内边距、常规字重、无边框），所以它看起来就是官方那一行，
   只是换了位置。
2. **隐藏「新会话」** —— 只隐藏侧边栏这颗按钮。宿主仍注册着 `session.new` 动作，
   `Cmd/Ctrl+N` 与命令面板照常可用。
3. **清空底部** —— 账号 launcher、底部设置单元、Cordis 插件运行时条，以及因此变空的
   底部容器，全部不再占位。

侧边栏收起成图标条时，设置行自动退化为 36×36 的方形图标按钮，与其它轨道按钮一致。

## 原理

- `settings.launcher` 是 `single` 插槽，**优先级最低的渲染**。官方账号 launcher 在
  优先级 0，本插件注册 `priority: -1` 顶掉它，于是底部单元里渲染的是我们的行。
- 随后一个 DOM effect 把这一行**搬**到侧边栏列里、`_newSession` 节点之后（该节点虽然
  被 CSS 隐藏，但仍在 DOM 中，因此可以作为插入锚点）。被搬动的节点始终由 React 持有
  ——它是本插件 span 的子节点，而 React 会保持这个 span 挂载——所以卸载时能干净归位。
- 一个 `MutationObserver` 在宿主重渲染（会把行搬回 span）和布局切换（宽栏 ⇄ 图标条
  会重建列的子节点）之后重新贴位。

所有资源都通过 `ctx.effect` 释放。**禁用插件即恢复原状，无需任何修复步骤。**

## 安装

```bash
dsh plugin --profile web add github:SOVLOOKUP/dsh-settings-footer
```

或本地开发时直接 link：

```bash
cd ~/.dsh/profiles/web
dsh plugin --profile web add /path/to/dsh-settings-footer
```

装完刷新页面即可。

## 开发

源码是 TypeScript，产物在 `lib/`（已提交，宿主直接加载它）。

```bash
pnpm install
pnpm build       # tsc → lib/client.js + lib/index.js
pnpm typecheck   # 仅检查，不产出
```

客户端产物必须是**经典脚本**：宿主通过 `window.__ModuleLoader__.load({ id, factory })`
加载它，所以 `src/client.ts` 不含 `import` / `export`，宿主提供的模块（React、primitives、
插件上下文）都经 `factory(require)` 注入，类型声明在 `src/types/dsh.d.ts`。

## 结构

```
src/
  client.ts            浏览器半区：样式注入、槽位注册、DOM 搬移
  index.ts             宿主半区：空实现
  types/dsh.d.ts       宿主侧接口的环境类型声明
locale/                zh / en 的 meta 文案（插件市场面板展示用）
lib/                   构建产物（提交进仓库）
cordis.patch.yml       bundle patch：把宿主半区插进 profile 的插件 roster
```

## 卸载 / 回退

在插件市场面板禁用，或从 profile 移除。账号菜单（头像 / 登录 / 用量 / 充值）会重新
出现在底部——它一直没有消失，只是被 CSS 隐藏；被搬走的设置行会归位到原来的 React
span 里。
