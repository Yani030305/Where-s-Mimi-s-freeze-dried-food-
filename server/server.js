import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AI_CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../')));

const OUTLINE_TEMPLATES = {
  normal: path.join(__dirname, '../assets/猫咪线稿.png'),
  happy: path.join(__dirname, '../assets/猫咪线稿-开心.png'),
  sad: path.join(__dirname, '../assets/猫咪线稿-悲伤.png')
};

function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

app.get('/api/config', (req, res) => {
  res.json({
    model: AI_CONFIG.model,
    hasApiKey: !!AI_CONFIG.apiKey && AI_CONFIG.apiKey !== '在这里填入你的API Key',
    hasEndpointId: !!AI_CONFIG.endpointId && AI_CONFIG.endpointId !== '在这里填入你的端点ID'
  });
});

app.post('/api/generate-image', async (req, res) => {
  const { imageSrc, prompt, model, apiKey, endpointId, emotion } = req.body;

  const finalApiKey = apiKey || AI_CONFIG.apiKey;
  const finalEndpointId = endpointId || AI_CONFIG.endpointId;
  const finalModel = model || AI_CONFIG.model;

  if (!finalApiKey || finalApiKey === '在这里填入你的API Key') {
    return res.status(400).json({ error: '请先在 server/config.js 中配置 API Key' });
  }

  const baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

  try {
    const outlineTemplate = OUTLINE_TEMPLATES[emotion] || OUTLINE_TEMPLATES.normal;
    const outlineBase64 = imageToBase64(outlineTemplate);

    let apiUrl, requestBody;

    if (finalModel === 'seedream-4' && finalEndpointId) {
      apiUrl = `${baseUrl}/images/generations`;
      
      requestBody = {
        model: finalEndpointId,
        prompt: `根据参考图片1中猫咪的颜色和花纹，完全按照参考图片2中的线稿轮廓进行填色，保持线稿的姿势和结构完全不变。不要改变任何轮廓形状，只在线稿内部区域填充颜色。背景必须是透明的。${prompt}`,
        image: [imageSrc, outlineBase64],
        size: '2048x2048',
        response_format: 'b64_json',
        watermark: false
      };
    } else if (finalModel === 'general-xl-pro') {
      apiUrl = `${baseUrl}/images/generations`;
      
      requestBody = {
        model: finalEndpointId || 'general-xl-pro',
        prompt: `根据用户猫咪的颜色和花纹，按照线稿结构生成猫咪图片。${prompt}`,
        image: outlineBase64,
        strength: 0.7,
        response_format: 'b64_json'
      };
    } else {
      apiUrl = `${baseUrl}/chat/completions`;
      
      requestBody = {
        model: finalEndpointId || 'doubao-vision-pro-32k',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的猫咪图像生成助手。你需要根据用户提供的猫咪照片提取颜色和花纹特征，然后按照线稿模板的结构生成新的猫咪图片。'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `这是用户上传的猫咪照片，请提取其颜色和花纹特征：`
              },
              {
                type: 'image_url',
                image_url: { url: imageSrc }
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `这是线稿模板，请按照这个结构生成猫咪：`
              },
              {
                type: 'image_url',
                image_url: { url: outlineBase64 }
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请生成一张猫咪图片，要求：
1. 保持线稿模板的姿势和结构
2. 使用用户猫咪的颜色和花纹
3. ${prompt}
4. 生成可爱的卡通风格猫咪图片`
              }
            ]
          }
        ]
      };
    }

    console.log(`正在调用豆包API: ${finalModel}, emotion: ${emotion}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败:', errorText);
      return res.status(response.status).json({ error: `API请求失败: ${errorText}` });
    }

    const data = await response.json();
    console.log('API调用成功');
    res.json(data);

  } catch (error) {
    console.error('API调用错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('打开 http://localhost:3000 即可访问游戏');
  
  if (AI_CONFIG.apiKey && AI_CONFIG.apiKey !== '在这里填入你的API Key') {
    console.log('✓ 已加载配置文件中的 API Key');
  } else {
    console.log('✗ 请在 server/config.js 中配置 API Key');
  }
});
