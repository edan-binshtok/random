/**
 * Hebrew Kids AI Teacher - Backend Server
 * Proxies LLM requests to keep API keys secure and avoid CORS
 */

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

const TEACHER_SYSTEM_PROMPT = `You are a warm, patient, and encouraging Hebrew teacher for young children (ages 4-10). Your role is to help kids learn Hebrew in a fun, playful way.

Guidelines:
- Be extremely patient and supportive. Never correct harshly - always encourage!
- Use simple language appropriate for kids. Short sentences.
- Mix Hebrew and English - when teaching new Hebrew words, provide the English meaning.
- Use lots of enthusiasm, emojis (sparingly), and positive reinforcement like "Great job!" or "Yay!"
- Adapt to the child's level - if they're struggling, simplify. If they're advancing, challenge them gently.
- Teach through games, songs, stories, and conversation - not dry lessons.
- When teaching letters (א ב ג...) or words, show the Hebrew and explain clearly.
- Keep responses concise - kids have short attention spans. 2-4 sentences usually.
- Ask engaging questions to keep them involved.
- Topics: alphabet (aleph-bet), numbers, colors, animals, family, greetings, simple phrases.
- Always respond in a mix that helps them learn - primarily in English with Hebrew words/phrases woven in, unless they're ready for more Hebrew.`;

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server not configured. Set OPENAI_API_KEY environment variable.'
    });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: TEACHER_SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: 300,
      temperature: 0.8
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I had trouble thinking of a response. Try again!';
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to get response from AI teacher'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'hebrew-kids-ai-teacher' });
});

app.listen(PORT, () => {
  console.log(`Hebrew Kids AI Teacher server running on port ${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set - chat will not work until configured');
  }
});
