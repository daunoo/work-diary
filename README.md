# 上班日记（Work Diary）

一个**纯前端、无需账号、数据只存在本机**的上班打卡日历。
选择日期记录「全天 / 半天」上班，自动统计当月工资与累计工资。
支持添加到 iPhone / 安卓手机主屏幕，像 App 一样全屏使用。

- 日历范围：2026 年 10 月 – 2027 年 1 月
- 每天三种状态：未记录 → 全天 → 半天（循环切换）
- 半天按日薪的 **一半** 计算
- 工资 = （全天天数 + 半天天数 × 0.5）× 日薪
- 数据保存在浏览器 `localStorage`，键名 `work-diary-v1`，不上传任何服务器

技术栈：React 19 + TanStack Start（Vite 8）+ Tailwind CSS v4 + TypeScript。

---

## 一、快速开始

需要电脑装好 [Node.js](https://nodejs.org/) 18 或更高版本。

```bash
npm install --legacy-peer-deps
npm run dev
```

终端会打印一个本机地址（通常是 `http://localhost:5173/`），用浏览器打开即可使用。

> `--legacy-peer-deps` 这个参数是必需的：npm 10 在解析本项目依赖的同类版本时有一个已知问题，
> 不加会安装失败。用 `bun install` 则不需要这个参数。

其他常用命令：

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发预览 |
| `npm run build` | 打包成可部署的静态网站（输出在 `dist/`） |
| `npm run preview` | 本地预览打包结果 |
| `npm run test` | 跑单元测试 |
| `npm run lint` | 代码检查 |
| `npm run format` | 自动格式化代码 |

---

## 二、上传到 GitHub

### 方式 A：命令行推送（推荐）

先在 GitHub 网页上**新建一个空仓库**（不要勾选自动生成 README），然后在本项目目录里执行：

```bash
git init
git add .
git commit -m "上班日记 v1"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

`.gitignore` 已经配好，`node_modules`、`dist` 等不会上传。

### 方式 B：网页直接上传（不会命令行时用这个）

1. 在 GitHub 新建空仓库
2. 打开仓库页面 → `uploading an existing file`
3. 把本项目的文件拖进去（**不要**拖 `node_modules` 和 `dist` 文件夹）
4. 点 `Commit changes`

### 上传后想让别人也能访问？

在 GitHub 仓库里进 `Settings → Pages`，或者用 Netlify / Vercel 导入仓库，
执行 `npm run build` 后把 `dist/` 目录作为发布目录即可。

---

## 三、目录结构

```text
work-diary/
├── package.json            # 依赖与命令清单
├── vite.config.ts          # 构建配置（预渲染首页）
├── tsconfig.json           # TypeScript 配置（@ 指向 src）
├── vitest.config.ts        # 测试配置
├── eslint.config.js        # 代码检查规则
├── components.json         # 组件库配置（模板自带，本项目未使用）
├── bunfig.toml             # bun 安装配置
├── .prettierrc             # 代码风格
├── .gitignore              # Git 忽略规则
│
├── public/                 # 静态资源（原样发布）
│   ├── manifest.webmanifest  # PWA 安装清单（名称、图标、全屏）
│   ├── icon-192.png          # 安卓安装所需图标
│   ├── icon-512.png          # 主图标
│   ├── icon-maskable-512.png # 安卓圆角安全图标
│   ├── favicon.png           # 浏览器标签页图标
│   └── robots.txt
│
└── src/
    ├── router.tsx          # 路由创建
    ├── server.ts           # 服务端渲染错误包装
    ├── start.ts            # 应用启动入口
    ├── styles.css          # 全站配色（oklch 色板，橙色主题）
    ├── routeTree.gen.ts    # 路由表（自动生成，不用手改）
    │
    ├── routes/
    │   ├── __root.tsx      # 根布局：PWA meta 标签 + <Outlet />
    │   └── index.tsx       # ★ 全部业务代码：日历、状态切换、工资统计
    │
    ├── lib/                # 工具函数与错误上报（模板自带）
    ├── hooks/use-mobile.tsx  # 模板自带，本项目未使用
    ├── components/ui/      # 模板自带的组件库，本项目未使用
    └── test/               # 路由测试
```

**层级关系（浏览器打开 `/` 时发生了什么）**

```text
浏览器 /
  └── src/router.tsx        匹配路由
        └── src/routes/__root.tsx   根布局（PWA meta、样式表、<Outlet />）
              └── src/routes/index.tsx  上班日记页面（日历 + 统计 + 日薪设置）
                    └── src/styles.css  配色变量
                          └── localStorage["work-diary-v1"]  读写数据
```

---

## 四、数据说明

浏览器里只有一条记录：

```json
{
  "wage": 300,
  "days": {
    "2026-10-13": "full",
    "2026-10-14": "half",
    "2026-10-15": null
  }
}
```

- `wage`：日薪（元）
- `days`：日期 → 状态，`"full"` 全天、`"half"` 半天、`null` 未记录
- 早期版本记录过的日子会被自动识别为「全天」，不会丢数据
- 想备份或迁移：在浏览器控制台执行 `localStorage["work-diary-v1"]` 复制内容，
  在新设备上再执行 `localStorage["work-diary-v1"] = '刚才复制的内容'`
- 删除浏览器数据或删掉主屏幕图标，记录会清空

---

## 五、装到手机上

先把它部署成一个公开网址（见上面「上传后想让别人也能访问」），然后：

**iPhone（Safari）**
1. 用 **Safari** 打开网址（微信内打开无效）
2. 点页面底部的 **分享** 按钮
3. 菜单里选 **添加到主屏幕** → 右上「添加」

**安卓（Chrome）**
1. 用 **Chrome** 打开网址
2. 点右上角 **⋮ 菜单** → **添加到主屏幕**（部分机型显示为「安装应用」）

装好后从桌面图标打开是全屏的，没有浏览器地址栏，体验和 App 基本一致。
注意：记录只存在装它的那台手机里，换设备需要重新备份迁移。

---

## 六、常见问题

**装依赖报错 / 卡住？**
加参数：`npm install --legacy-peer-deps`。

**打开页面是空白的？**
确认是用 `npm run dev` 打印出来的地址访问，而不是直接双击 `index.html`。

**想改日历范围？**
编辑 `src/routes/index.tsx` 顶部的 `MONTHS` 数组（每项是 `{ year, month }`，month 从 0 开始）。

**想改默认日薪？**
编辑同一文件里的默认日薪常量（当前是 300）。

**颜色想换？**
改 `src/styles.css` 里 `:root` 下的 `--primary`、`--background` 等 oklch 变量。
