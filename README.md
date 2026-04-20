# Linux.do 自动阅读助手

## 📋 项目概述

`auto-read.js` 是一个为 [Linux.do](https://linux.do) 设计的用户脚本（UserScript），旨在实现自动滚动浏览、点赞和阅读进度跟踪功能。

## 🎯 主要功能

- **自动滚动**：自动滚动浏览 Linux.do 网站，每次滚动半个屏幕高度
- **手动点赞开关**：可手动开启/关闭自动点赞功能
- **可配置点赞间隔**：开启点赞后，可自定义滚动多少次后触发一次点赞（1-50次可调）
- **阅读进度跟踪**：实时显示当前帖子的阅读进度（如：1/42）
- **方向切换**：支持在向下和向上滚动之间切换
- **运行时间统计**：显示脚本已运行的时间
- **帖子完成检测**：当阅读到帖子底部时自动停止
- **拖拽面板**：可拖拽移动控制面板位置
- **最小化功能**：支持最小化/恢复控制面板

## 📖 使用说明

### 安装方法

1. 安装支持用户脚本的浏览器扩展（如 Tampermonkey 或 Violentmonkey）
2. 将 `auto-read.js` 脚本导入到扩展中
3. 访问 `https://linux.do/*` 页面，脚本会自动运行

### 功能按钮说明

- **▶ 开始 / ⏸ 暂停**：控制脚本的启动和暂停
- **⬇ 方向：向下 / ⬆ 方向：向上**：切换滚动方向
- **−**：最小化控制面板

### 设置选项

- **间隔**：调整滚动间隔时间（1-15秒）
- **幅度**：调整每次滚动的屏幕比例（10%-100%）
- **自动点赞开关**：手动开启后才执行自动点赞
- **滚动N次点赞**：设置滚动多少次后触发一次点赞（1-50次，默认5次）

### 统计信息

- **已点赞**：显示当前会话中已点赞的总数
- **运行时间**：显示脚本已运行的时间（格式：MM:SS）

## ⚙️ 技术实现

### 核心机制

1. **滚动逻辑**：
   - 默认向下滚动，每次滚动屏幕高度的80%
   - 每滚动10次后自动切换为向上滚动（补偿机制）
   - 向上滚动5秒后恢复向下滚动

2. **点赞机制**：
   - 默认关闭，需手动开启"自动点赞"开关后才生效
   - 开启后可设置滚动次数（1-50次可调），控制点赞频率
   - 查找页面中的元素并模拟点击

3. **阅读完成检测**：
   - 监听 `.timeline-replies` 元素
   - 解析其中的文本格式
   - 当当前值等于总值时，判定为阅读完成

4. **URL变化检测**：
   - 定时检测（每5秒）
   - 监听 `popstate` 事件（浏览器前进/后退）
   - 监听 `pushState` 和 `replaceState`（SPA路由变化）
   - 检测到URL变化时自动重置状态

### 代码结构

```javascript
// 配置项
let scrollInterval = 5000;       // 滚动间隔（毫秒）
let scrollRatio    = 0.8;        // 滚动比例（0.8 = 80%）
let scrollDirection = 'down';     // 滚动方向

// 状态变量
let timer = null;                // 定时器
let isRunning = false;           // 运行状态
let downCounter = 0;             // 向下滚动计数器
let likeCount = 0;               // 点赞计数器
let totalLiked = 0;              // 总点赞数
let currentTopicId = ...;        // 当前话题ID
```

## 🎨 用户界面

控制面板包含以下元素：

- 状态指示点（绿色表示运行中）
- 状态文本（显示当前操作状态）
- 开始/暂停按钮
- 方向切换按钮
- 自动点赞开关（Switch样式）
- 点赞间隔设置（开启点赞后显示）
- 间隔和幅度调节滑块
- 统计数据展示（已点赞数、运行时间）

## 🔧 自定义配置

用户可以通过修改脚本开头的配置项来调整行为：

```javascript
let scrollInterval = 5000;       // 滚动间隔（毫秒）
let scrollRatio    = 0.8;        // 滚动比例（0.8 = 80%）
let scrollDirection = 'down';     // 滚动方向
```

## 📝 版本历史

- **v0.0.7**：当前版本
  - 新增手动点赞开关，可手动开启/关闭自动点赞功能
  - 新增点赞间隔设置，可自定义滚动次数后触发点赞（1-50次可调）

- **v0.0.6**：
  - 增强URL变化检测机制
  - 优化阅读完成检测逻辑
  - 修复部分边界情况

## ⚠️ 注意事项

1. 脚本需要在支持用户脚本的环境中运行（如 Tampermonkey）
2. 点赞功能默认关闭，需手动开启"自动点赞"开关后才生效
3. 点赞功能依赖于页面元素的正确选择器
4. 阅读完成检测基于特定的页面结构，可能需要调整
5. 脚本会在页面URL变化时自动重置

## Star History

<a href="https://www.star-history.com/?repos=Mr-Groundhog%2FLinuxDo-auto-read&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=Mr-Groundhog/LinuxDo-auto-read&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=Mr-Groundhog/LinuxDo-auto-read&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=Mr-Groundhog/LinuxDo-auto-read&type=date&legend=top-left" />
 </picture>
</a>
## 🎉 许可证

本项目为个人学习使用脚本。
