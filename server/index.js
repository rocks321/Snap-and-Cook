require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const Recipe = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leftover-chef')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.warn('⚠️  MongoDB not connected:', err.message));

// ── OpenRouter free vision models (updated March 2026) ───
// 'openrouter/free' auto-picks the best available free vision model
const MODELS = [
  'openrouter/free',                              // ← auto-router, always up to date
  'qwen/qwen2.5-vl-72b-instruct:free',           // best free vision model
  'qwen/qwen2.5-vl-32b-instruct:free',           // strong fallback
  'mistralai/mistral-small-3.1-24b-instruct:free', // good vision support
  'meta-llama/llama-3.2-11b-vision-instruct:free', // reliable fallback
  'google/gemma-3-27b-it:free',                  // Google free vision
];

const RECIPE_PROMPT = `You are a chef. Analyze this food image. Return ONLY a raw JSON object — no markdown, no code fences, no explanation.

Required JSON structure:
{
  "detectedIngredients": ["item1", "item2"],
  "recipe": {
    "title": "Recipe Name",
    "description": "2-sentence description.",
    "prepTime": "10 minutes",
    "cookTime": "20 minutes",
    "servings": "2 servings",
    "difficulty": "Easy",
    "ingredients": ["1 cup rice", "2 eggs"],
    "steps": ["Step one.", "Step two.", "Step three."],
    "tips": ["One helpful tip."],
    "nutritionHighlights": ["High in protein"]
  }
}`;

// ── Call OpenRouter with automatic model fallback ────────
async function callOpenRouter(imageData, mimeType) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw { status: 503, message: 'OPENROUTER_API_KEY not set in .env — get a free key at https://openrouter.ai/keys' };
  }

  for (const model of MODELS) {
    try {
      console.log(`🤖 Trying: ${model}`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Leftover Chef'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType};base64,${imageData}` }
                },
                {
                  type: 'text',
                  text: RECIPE_PROMPT
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();

      // Handle errors from OpenRouter
      if (!response.ok) {
        const errMsg = data?.error?.message || `HTTP ${response.status}`;
        const is429 = response.status === 429 || errMsg.includes('rate') || errMsg.includes('quota');
        const is400 = response.status === 400 || errMsg.includes('not supported') || errMsg.includes('vision');

        if (is429 || is400) {
          console.warn(`⚠️  ${model}: ${errMsg} — trying next`);
          continue;
        }
        throw { status: response.status, message: errMsg };
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        console.warn(`⚠️  ${model}: empty response — trying next`);
        continue;
      }

      console.log(`✅ Success: ${model}`);
      return text;

    } catch (err) {
      if (err.status) throw err; // our own thrown error — rethrow
      console.warn(`⚠️  ${model} fetch error:`, err.message);
      continue;
    }
  }

  throw { status: 429, message: 'All free models are busy. Please wait a moment and try again.', retryAfter: 30 };
}

// ── Routes ───────────────────────────────────────────────
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      return res.status(503).json({
        error: 'OPENROUTER_API_KEY not configured.',
        hint: 'Get a free key at https://openrouter.ai/keys and add it to your .env file'
      });
    }

    let imageData, mimeType;
    if (req.file) {
      imageData = req.file.buffer.toString('base64');
      mimeType  = req.file.mimetype;
    } else if (req.body.imageBase64) {
      imageData = req.body.imageBase64.replace(/^data:[^;]+;base64,/, '');
      mimeType  = req.body.mimeType || 'image/jpeg';
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }

    let rawText;
    try {
      rawText = await callOpenRouter(imageData, mimeType);
    } catch (e) {
      return res.status(e.status || 500).json({ error: e.message, retryAfter: e.retryAfter || null });
    }

    // Clean and parse JSON
    let text = rawText.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/g, '')
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('JSON parse failed. Raw:\n', rawText.slice(0, 400));
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    let savedId = null;
    if (mongoose.connection.readyState === 1) {
      const doc = await Recipe.create({
        imageBase64: imageData,
        imageMimeType: mimeType,
        detectedIngredients: parsed.detectedIngredients,
        recipe: parsed.recipe
      });
      savedId = doc._id;
    }

    res.json({ ...parsed, savedId });

  } catch (err) {
    console.error('Unhandled:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1)
      return res.json({ recipes: [], note: 'MongoDB not connected' });
    const recipes = await Recipe.find().select('-imageBase64').sort({ savedAt: -1 }).limit(20);
    res.json({ recipes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/recipes/:id/rating', async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be 1-5' });
    if (mongoose.connection.readyState === 1)
      await Recipe.findByIdAndUpdate(req.params.id, { userRating: rating });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🍳 Leftover Chef → http://localhost:${PORT}`);
  console.log(`🌐 Provider: OpenRouter (free tier)`);
  console.log(`🤖 Models: ${MODELS.map(m => m.split('/')[1]).join(' → ')}\n`);
});