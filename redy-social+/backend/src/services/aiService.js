import axios from 'axios';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Generate content using AI
export async function generateContent(prompt, options = {}) {
  const { tone = 'professional', platform, maxLength = 280 } = options;

  try {
    if (OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a social media content generator. Generate engaging ${tone} content optimized for ${platform || 'general'} social media. Keep it under ${maxLength} characters.`
            },
            {
              role: 'user',
              content: prompt
            }
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

      return {
        content: response.data.choices[0].message.content,
        model: 'gpt-4',
        usage: response.data.usage
      };
    } else if (ANTHROPIC_API_KEY) {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 500,
          system: `You are a social media content generator. Generate engaging ${tone} content optimized for ${platform || 'general'} social media. Keep it under ${maxLength} characters.`,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.content[0].text,
        model: 'claude-3-sonnet',
        usage: response.data.usage
      };
    } else {
      throw new Error('No AI API key configured');
    }
  } catch (error) {
    logger.error('AI generation error:', error);
    throw new Error('Failed to generate content');
  }
}

// Improve existing content
export async function improveContent(content, improvementType = 'general') {
  const improvementPrompts = {
    general: `Improve this social media post to be more engaging:`,
    tone: `Rewrite this in a more engaging tone:`,
    seo: `Add relevant hashtags and optimize for reach:`,
    brevity: `Shorten this while keeping the key message:`
  };

  return generateContent(`${improvementPrompts[improvementType]}\n\n${content}`, {
    tone: 'engaging'
  });
}

// Translate content
export async function translateContent(content, targetLanguage) {
  const languageNames = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ar: 'Arabic',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean'
  };

  const targetLang = languageNames[targetLanguage] || targetLanguage;

  return generateContent(`Translate to ${targetLang}:\n\n${content}`, {
    tone: 'natural'
  });
}

// Generate hashtags
export async function generateHashtags(content, platform, count = 10) {
  const prompt = `Generate ${count} relevant hashtags for this ${platform || 'social media'} post. Return only hashtags separated by spaces, no explanation:\n\n${content}`;

  try {
    if (OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a hashtag generator. Return only relevant hashtags separated by spaces.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
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
        .filter(tag => tag.startsWith('#'))
        .slice(0, count);

      return hashtags;
    } else {
      // Fallback: extract words as hashtags
      const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, count)
        .map(word => `#${word}`);

      return words;
    }
  } catch (error) {
    logger.error('Hashtag generation error:', error);
    return [];
  }
}

// Extract content from URL
export async function extractFromUrl(url) {
  try {
    // Using a simple fetch - in production, use a proper HTML parser
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'RedySocial/1.0'
      }
    });

    // Extract title
    const titleMatch = response.data.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const descMatch = response.data.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract og:image
    const imageMatch = response.data.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    const image = imageMatch ? imageMatch[1].trim() : '';

    return {
      title,
      description,
      image,
      url
    };
  } catch (error) {
    logger.error('URL extraction error:', error);
    throw new Error('Failed to extract content from URL');
  }
}

// Generate post from URL
export async function generateFromUrl(url, platform) {
  const extracted = await extractFromUrl(url);
  
  return generateContent(`
Create an engaging social media post for ${platform || 'general'} from this content:

Title: ${extracted.title}
Description: ${extracted.description}
URL: ${extracted.url}

Make it engaging and include a call to action.
  `.trim(), {
    platform,
    maxLength: platform === 'twitter' ? 280 : 500
  });
}

// Get optimal posting times
export async function getOptimalTimes(platform, timezone = 'UTC') {
  // Default optimal times based on platform research
  const optimalTimes = {
    instagram: ['9:00', '12:00', '17:00', '20:00'],
    facebook: ['9:00', '13:00', '16:00'],
    twitter: ['8:00', '9:00', '12:00', '17:00', '20:00'],
    linkedin: ['7:00', '8:00', '9:00', '12:00', '17:00'],
    tiktok: ['6:00', '9:00', '12:00', '19:00', '21:00'],
    youtube: ['14:00', '17:00', '20:00']
  };

  const times = optimalTimes[platform] || optimalTimes.instagram;
  
  return times.map(time => ({
    time,
    timezone,
    day: 'any'
  }));
}

// Generate content variations (A/B testing)
export async function generateVariations(content, count = 3) {
  const variations = [];

  const styles = ['professional', 'casual', 'bold', 'friendly', 'humorous'];
  
  for (let i = 0; i < Math.min(count, styles.length); i++) {
    try {
      const result = await generateContent(content, {
        tone: styles[i]
      });
      variations.push({
        content: result.content,
        tone: styles[i],
        model: result.model
      });
    } catch (error) {
      logger.error(`Failed to generate ${styles[i]} variation:`, error);
    }
  }

  return variations;
}

// Analyze sentiment
export async function analyzeSentiment(content) {
  const prompt = `Analyze the sentiment of this social media post. Return a JSON object with:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": number from -1 to 1,
  "emotions": array of emotions detected
}

Post: ${content}`;

  try {
    if (OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a sentiment analyzer. Return ONLY valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    }
  } catch (error) {
    logger.error('Sentiment analysis error:', error);
    return { sentiment: 'neutral', score: 0, emotions: [] };
  }
}

export default {
  generateContent,
  improveContent,
  translateContent,
  generateHashtags,
  extractFromUrl,
  generateFromUrl,
  getOptimalTimes,
  generateVariations,
  analyzeSentiment
};
