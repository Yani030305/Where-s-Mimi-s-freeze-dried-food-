
# 咪的冻干呢！V0 原型

这是一个**可直接用 VS Code 打开并调整的前端原型项目**。
不依赖打包工具，直接双击 `index.html` 或用 VS Code Live Server 即可预览。

## 当前版本包含

- 首页
- 关卡地图（支持选择已玩过的关卡）
- 皮肤选择（5款预设皮肤：奶牛猫、橘猫、狸花猫、白猫、黑猫）
- 1~10 关基础数值
- 爆款游戏风格UI（渐变配色、光泽动画、毛玻璃效果）
- 核心玩法闭环：
  - 开局展示正确手
  - 3 秒倒计时
  - 手握拳并按配置换位
  - 玩家点击猜测
  - 最多 4 次尝试
  - 奖励 100 / 80 / 50 金币
- 本地存档（关卡、金币、皮肤）

## 启动方式

### 方式 1：直接打开

直接用浏览器打开 `index.html`

### 方式 2：VS Code

1. 用 VS Code 打开项目文件夹
2. 安装 Live Server 扩展
3. 右键 `index.html`
4. 选择 `Open with Live Server`

## 项目结构

```text
cat-treat-guess-prototype/
├─ index.html
├─ README.md
├─ assets/
│  ├─ sounds/           # 音效文件
│  ├─ 奶牛猫.png        # 皮肤图片
│  ├─ 橘猫.png
│  ├─ 狸花猫.png
│  ├─ 白猫.png
│  └─ 黑猫.png
├─ src/
│  ├─ styles.css       # 样式文件
│  ├─ main.js          # 主逻辑
│  └─ modules/         # 模块
│     ├─ levels.js
│     ├─ skins.js
│     ├─ hands.js
│     ├─ state.js
│     ├─ audio.js
│     └─ utils.js
└─ server/             # 后端服务（可选，用于AI功能）
   ├─ server.js
   ├─ config.js
   └─ package.json
```

## 最重要的可改位置

### 1. 改关卡数值

文件：`src/modules/levels.js`

你可以改：

- `handCount`
- `shufflePairs`
- `shuffleDurationMs`
- `pauseBetweenRoundsMs`
- `correctIndex`

### 2. 改皮肤

文件：`src/modules/skins.js`

### 3. 改关卡地图

文件：`src/main.js`

搜索 `renderLevelMap` 函数，可以修改关卡地图的显示逻辑。

### 4. 改玩法主流程

文件：`src/main.js`

重点看这些函数：

- `startCurrentLevel`
- `revealPhase`
- `closeHandsPhase`
- `shufflePhase`
- `onGuess`

### 5. 改 UI 和视觉

文件：`src/styles.css`

包含爆款游戏风格的UI效果：

- 渐变配色
- 光泽动画
- 毛玻璃效果
- 浮动动画

## 后续建议扩展

- 把 emoji 手和猫替换成正式美术资源
- 增加道具系统
- 增加成功结算的双倍奖励按钮
- 增加更复杂路径和假动作
- 后续再迁移到 Cocos / 微信小游戏正式工程

## 注意

这个版本是**方便你快速改玩法、改数值、改交互**的可玩原型，不是正式上线工程。
