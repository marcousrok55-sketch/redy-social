import axios from 'axios';
import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Generate content using AI
export const generateContent = async (req, res) => {
  try {
    const { prompt, url, platform, tone } = req.body;
    
    let content = prompt || '';
    
    // If URL provided, fetch content from URL
    if (url) {
      try {
        const webpage = await axios.get(url, { timeout: 10000 });
        // Extract text content (simplified)
        const text = webpage.data.replace(/<[^>]*>/g, '').slice(0, 2000);
        content = `Create a social media post based on this content:\n\n${text}`;
      } catch (err) {
        logger.warn('Failed to fetch URL content:', err.message);
      }
    }

    // Platform-specific optimizations
    const platformLimits = {
      twitter: { max: 280, name: 'Twitter/X' },
      instagram: { max: 2200, name: 'Instagram' },
      linkedin: { max: 3000, name: 'LinkedIn' },
      facebook: { max: 63206, name: 'Facebook' },
      tiktok: { max: 2200, name: 'TikTok' },
      youtube: { max: 5000, name: 'YouTube' }
    };

    const limit = platformLimits[platform]?.max || 500;
    const platformName = platformLimits[platform]?.name || 'social media';

    const toneInstructions = {
      professional: 'Use a professional, business-like tone',
      casual: 'Use a casual, friendly tone',
      friendly: 'Use a warm, friendly tone',
      bold: 'Use an bold, attention-grabbing tone'
    };

    const systemPrompt = `You are a social media content expert. Create engaging ${platformName} content that is ${toneInstructions[tone] || 'engaging and professional'}. Keep it under ${limit} characters. Include relevant emojis where appropriate.`;

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content || 'Generate engaging social media content' }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const generatedContent = response.data.choices[0].message.content;

    res.json({ 
      content: generatedContent,
      platform,
      tone,
      characterCount: generatedContent.length
    });
  } catch (error) {
    logger.error('Generate content error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
};

// Improve existing content
export const improveContent = async (req, res) => {
  try {
    const { content, improvementType } = req.body;

    const improvementPrompts = {
      engaging: 'Make this content more engaging and attention-grabbing',
      shorter: 'Make this content more concise and shorter',
      longer: 'Expand this content with more details',
      professional: 'Make this content more professional',
      casual: 'Make this content more casual and friendly',
     seo: 'Optimize this content for better SEO and hashtags'
    };

    const instruction = improvementPrompts[improvementType] || 'Improve this content';

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a social media expert. Improve the given content based on the instruction.' },
          { role: 'user', content: `${instruction}:\n\n${content}` }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const improvedContent = response.data.choices[0].message.content;

    res.json({ 
      original: content,
      improved: improvedContent,
      improvementType
    });
  } catch (error) {
    logger.error('Improve content error:', error);
    res.status(500).json({ error: 'Failed to improve content' });
  }
};

// Translate content
export const translateContent = async (req, res) => {
  try {
    const { content, targetLanguage } = req.body;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: `Translate the following content to ${targetLanguage}. Maintain the tone and meaning.` },
          { role: 'user', content }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const translated = response.data.choices[0].message.content;

    res.json({ 
      original: content,
      translated,
      targetLanguage
    });
  } catch (error) {
    logger.error('Translate content error:', error);
    res.status(500).json({ error: 'Failed to translate content' });
  }
};

// Get hashtag suggestions
export const getHashtagSuggestions = async (req, res) => {
  try {
    const { content, platform, niche } = req.query;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Suggest relevant, popular hashtags for social media content. Return only the hashtags separated by spaces, no explanation.' },
          { role: 'user', content: `Content: ${content || ''}\nPlatform: ${platform || 'general'}\nNiche: ${niche || 'general'}` }
        ],
        temperature: 0.7,
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const hashtags = response.data.choices[0].message.content
      .split(' ')
      .filter(h => h.startsWith('#'))
      .slice(0, 30);

    res.json({ hashtags });
  } catch (error) {
    logger.error('Get hashtags error:', error);
    res.status(500).json({ error: 'Failed to get hashtag suggestions' });
  }
};

// Analyze sentiment
export const analyzeSentiment = async (req, res) => {
  try {
    const { content } = req.body;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Analyze the sentiment of this text. Return a JSON with: sentiment (positive/negative/neutral), confidence (0-1), and key_emotions (array of emotions).' },
          { role: 'user', content }
        ],
        temperature: 0.3,
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content;
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(result);
      res.json(parsed);
    } catch {
      res.json({ 
        sentiment: 'neutral', 
        confidence: 0.5, 
        raw: result 
      });
    }
  } catch (error) {
    logger.error('Analyze sentiment error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
};
