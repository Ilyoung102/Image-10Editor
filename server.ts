import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payload limits for base64 image data from the editor
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize GoogleGenAI client
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// REST-safe utility to check and retreive the AI client
function getAIClient(clientApiKey?: string): GoogleGenAI {
  const keyToUse = clientApiKey || geminiApiKey;
  if (!keyToUse) {
    throw new Error('Gemini API Key is not configured on the server, nor provided by the client.');
  }
  return new GoogleGenAI({
    apiKey: keyToUse,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// --- API Endpoints ---

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiConfigured: !!geminiApiKey });
});

// AI Tutor Chat
app.post('/api/ai/tutor-chat', async (req, res) => {
  try {
    const { text, history, clientApiKey } = req.body;
    const ai = getAIClient(clientApiKey);
    
    // Prepare chat instruction context
    const systemInstruction = 'You are a warm, helpful, and professional AI Image Editor Tutor. Answer the user\'s question clearly in Korean, helping them master the application, handle layers, perform selections, and make artistic edits.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `User request: ${text}` }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error('Tutor Chat Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error executing AI Tutor Chat' });
  }
});

// AI Smart Image Analysis
app.post('/api/ai/smart-analysis', async (req, res) => {
  try {
    const { imageBase64, clientApiKey } = req.body;
    const ai = getAIClient(clientApiKey);

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Strip out base64 header if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = 'Describe this image for editing. Return your answer as a raw JSON string only (do not include markdown wrapping or ```json blocks) containing two keys: "caption" (describing what is in the image in Korean) and "mood" (analyzing its style, colors, lighting, and aesthetic mood in Korean). Format: { "caption": "...", "mood": "..." }';

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/png',
              },
            },
          ],
        },
      ],
    });

    let resultText = response.text || '{}';
    // String cleansing for unexpected markdown code blocks
    resultText = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsedJson = JSON.parse(resultText);
    res.json({ success: true, ...parsedJson });
  } catch (error: any) {
    console.error('Smart Analysis Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error processing Smart Analysis' });
  }
});

// AI Generative Fill & In-painting
app.post('/api/ai/gen-fill', async (req, res) => {
  try {
    const { imageBase64, prompt, clientApiKey } = req.body;
    const ai = getAIClient(clientApiKey);

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          parts: [
            { text: `Edit: ${prompt}. Process the image based on this request and output the resulting edited image in inlineData. Output only the result image.` },
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/png',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      }
    });

    // Find image part
    const inlinePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (inlinePart && inlinePart.inlineData?.data) {
      res.json({ success: true, imageBase64: inlinePart.inlineData.data });
    } else {
      throw new Error('Gemini model did not return inline image data inside parts.');
    }
  } catch (error: any) {
    console.error('Generative Fill Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error executing Generative Fill' });
  }
});

// AI Imagen 4 (Sticker) Generation
app.post('/api/ai/sticker', async (req, res) => {
  try {
    const { prompt, clientApiKey } = req.body;
    const ai = getAIClient(clientApiKey);

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    // Call Imagen-4 generate images tool
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `${prompt}, stylized separate design, isolated cutout sticker outline, white background, high detail`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const stickerBytes = response?.generatedImages?.[0]?.image?.imageBytes;

    if (stickerBytes) {
      res.json({ success: true, imageBase64: stickerBytes });
    } else {
      throw new Error('Imagen did not generate any sticker bytes.');
    }
  } catch (error: any) {
    console.error('Sticker Generation Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error executing AI Sticker generation' });
  }
});

// Serve Vite in dev mode, static index in production
(async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen strictly on host 0.0.0.0 and port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
})();
