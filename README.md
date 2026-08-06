# 像素推箱子 Pixel Sokoban

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)

经典像素风**推箱子（Sokoban）**益智游戏。把所有木箱推进发光目标点即可通关！基于 Vite + TypeScript 构建，支持键盘与触屏操作，无任何运行时依赖，并内置 AI 求解器、关卡编辑器、成就系统与 PWA 离线支持。

## ✨ 功能特性

- 🎮 **70 个关卡 + 6 大世界章节**，逐步解锁，难度曲线经过 AI 校验
- 🧩 **AI 求解器**：逐步提示、一键自动演示通关、求解过程可视化
- 🏗️ **关卡编辑器**：自由编辑、随机生成、URL 分享、JSON 导入/导出
- ⭐ **星级评价**：按步数/推数结算 ★，挑战模式设置目标步数
- 🏆 **成就系统**：12 项成就，解锁即弹窗庆祝
- 📅 **每日挑战**：每天一个随机关卡，连续天数记录
- ⚡ **速通模式**：实时计时 HUD，冲击最快纪录
- 🏅 **排行榜**：玩家档案与本地排行，比拼最佳成绩
- 📊 **统计面板**：热力图、日历、难度曲线、通关统计图表
- 🤖 **AI 教练**：技能分析 + 针对性建议（自适应提示延迟）
- 👻 **幽灵回放**：录制并回放最佳走法，复盘学习
- 🎨 **像素艺术**：全部图块纯 CSS 渲染，无图片素材，风格统一
- 🎵 **程序化音频**：Web Audio 合成 SFX/BGM，多套音效包可选
- 📱 **多端适配**：键盘 / 触屏 / 手势滑动 / 触觉反馈 / 无障碍支持
- 🌐 **多语言**：简体中文 / English / 日本語
- 💾 **完整存档**：多槽位存档、笔记、收藏夹、关卡搜索、JSON 导出/导入
- 📤 **分享**：一键分享卡片、截图保存
- 🟢 **PWA**：可安装到主屏幕、离线畅玩、自动更新

## 🎮 操作说明

| 按键 | 功能 |
| --- | --- |
| `↑↓←→` / `WASD` | 移动 |
| `Z` / `Ctrl+Z` | 撤销一步 |
| `R` | 重新开始 |
| `H` | AI 提示 |
| `F` | 收藏 / 取消收藏 |
| `N` / `Enter` | 下一关 |
| `P` | 上一关 |
| `L` | 关卡选择 |
| `E` | 关卡编辑器 |
| `G` | 随机关卡 |
| `T` | 速通挑战 |
| `I` | 显示统计 |
| `Ctrl+S` | 快速存档 |
| `Ctrl+M` / `Ctrl+P` | 宏录制 / 回放 |
| `Ctrl+1~6` | 跳转世界章节 |
| `M` | 切换 BGM |
| `+` / `-` | 放大 / 缩小 |
| `?` | 快捷键帮助 |
| `Esc` | 关闭弹窗 |

> 游戏中按 `?` 可随时查看完整快捷键列表。

## 🚀 快速开始

```bash
npm install        # 安装开发依赖
npm run dev        # 启动开发服务器 http://localhost:3000
npm run build      # 类型检查 + 生产构建 → dist/
npm run preview    # 预览生产构建
```

关卡可解性校验（开发用）：

```bash
python tools/test_quick.py
python tools/test_quick2.py
```

## 🛠 技术栈

- [Vite 5](https://vitejs.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- 原生 ES Modules，**零运行时依赖**
- Web Audio API（程序化音效与 BGM）
- Service Worker + Web App Manifest（PWA 离线支持）
- localStorage 持久化（记录 / 统计 / 配置）

## 📁 项目结构

```
├── index.html            # 应用外壳
├── src/                  # TypeScript 源码
│   ├── main.ts           # 入口，装配所有功能模块
│   ├── game.ts           # 核心游戏逻辑（移动/撤销/胜利判定）
│   ├── levels.ts         # 70 关关卡数据与配置
│   ├── solver.ts         # AI 求解器
│   ├── ui.ts             # 棋盘渲染与界面更新
│   ├── editor_modal.ts   # 关卡编辑器
│   ├── generator.ts      # 随机关卡生成
│   └── ...               # 成就/每日/速通/统计/皮肤等模块
├── public/               # 静态资源（图标、manifest、Service Worker）
├── style.css             # 像素艺术全局样式
├── vite.config.ts        # 构建配置（按功能自动分包）
├── tools/                 # 开发辅助脚本
│   ├── test_quick.py       # 关卡可解性校验脚本
│   └── test_quick2.py      # 关卡可解性校验脚本（扩展关卡）
└── LICENSE               # MIT 协议
```

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源，欢迎自由使用、修改与分发。

Copyright (c) 2025 Techd81
