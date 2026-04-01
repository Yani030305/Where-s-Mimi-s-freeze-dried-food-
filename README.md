# 咪的冻干呢！V0 原型

这是一个**可直接用 VS Code 打开并调整的前端原型项目**。  
不依赖打包工具，直接双击 `index.html` 或用 VS Code Live Server 即可预览。

## 当前版本包含
- 首页
- 皮肤选择
- 1~10 关基础数值
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
├─ assets/
└─ src/
   ├─ styles.css
   ├─ main.js
   └─ modules/
      ├─ levels.js
      ├─ skins.js
      ├─ hands.js
      ├─ state.js
      └─ utils.js
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

### 3. 改玩法主流程
文件：`src/main.js`

重点看这些函数：
- `startCurrentLevel`
- `revealPhase`
- `closeHandsPhase`
- `shufflePhase`
- `onGuess`

### 4. 改 UI 和视觉
文件：`src/styles.css`

## 后续建议扩展
- 把 emoji 手和猫替换成正式美术资源
- 增加道具系统
- 增加成功结算的双倍奖励按钮
- 增加更复杂路径和假动作
- 后续再迁移到 Cocos / 微信小游戏正式工程

## 注意
这个版本是**方便你快速改玩法、改数值、改交互**的可玩原型，不是正式上线工程。
