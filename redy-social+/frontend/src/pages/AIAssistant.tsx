import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { 
  Sparkles, 
  RefreshCw, 
  Translate, 
  Hash, 
  Copy, 
  Check,
  Wand2,
  Languages,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📷' },
  { id: 'twitter', label: 'Twitter', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { id: 'facebook', label: 'Facebook', emoji: '📘' },
];

const TONES = [
  { id: 'professional', label: 'Professional', icon: '💼' },
  { id: 'casual', label: 'Casual', icon: '😊' },
  { id: 'friendly', label: 'Friendly', icon: '👋' },
  { id: 'bold', label: 'Bold', icon: '⚡' },
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 
  'Portuguese', 'Arabic', 'Hindi', 'Chinese', 'Japanese'
];

const IMPROVEMENT_TYPES = [
  { id: 'engaging', label: 'More Engaging' },
  { id: 'shorter', label: 'Shorter' },
  { id: 'longer', label: 'Longer' },
  { id: 'professional', label: 'More Professional' },
  { id: 'casual', label: 'More Casual' },
  { id: 'seo', label: 'SEO Optimized' },
];

export default function AIContentAssistant() {
  const [content, setContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [translateLanguage, setTranslateLanguage] = useState('');
  const [improvementType, setImprovementType] = useState('engaging');

  const generateMutation = useMutation({
    mutationFn: aiApi.generate,
    onSuccess: (data) => {
      setGeneratedContent(data.data.content);
    }
  });

  const improveMutation = useMutation({
    mutationFn: aiApi.improve,
    onSuccess: (data) => {
      setGeneratedContent(data.data.improved);
    }
  });

  const translateMutation = useMutation({
    mutationFn: aiApi.translate,
    onSuccess: (data) => {
      setGeneratedContent(data.data.translated);
    }
  });

  const hashtagsMutation = useMutation({
    mutationFn: aiApi.getHashtags,
    onSuccess: (data) => {
      if (generatedContent) {
        setGeneratedContent(generatedContent + '\n\n' + data.data.hashtags.join(' '));
      } else {
        setGeneratedContent(data.data.hashtags.join(' '));
      }
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      platform: selectedPlatform,
      tone: selectedTone,
      url: url || undefined,
      prompt: content || undefined
    });
  };

  const handleImprove = () => {
    if (!generatedContent) return;
    improveMutation.mutate({
      content: generatedContent,
      improvementType: improvementType as any
    });
  };

  const handleTranslate = () => {
    if (!generatedContent || !translateLanguage) return;
    translateMutation.mutate({
      content: generatedContent,
      targetLanguage: translateLanguage
    });
  };

  const handleGetHashtags = () => {
    hashtagsMutation.mutate({
      content: generatedContent || content,
      platform: selectedPlatform
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI Content Assistant
          </h1>
          <p className="text-text-secondary">Generate and improve your social media content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-4">
          {/* Platform & Tone Selection */}
          <div className="card">
            <h3 className="font-semibold mb-4">Configuration</h3>
            
            <div className="space-y-4">
              {/* Platform */}
              <div>
                <label className="block text-sm font-medium mb-2">Target Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={clsx(
                        'px-4 py-2 rounded-lg border transition-colors',
                        selectedPlatform === platform.id
                          ? 'border-primary bg-primary/20 text-white'
                          : 'border-surface-light text-text-secondary hover:border-primary'
                      )}
                    >
                      {platform.emoji} {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(tone => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={clsx(
                        'px-4 py-2 rounded-lg border transition-colors',
                        selectedTone === tone.id
                          ? 'border-primary bg-primary/20 text-white'
                          : 'border-surface-light text-text-secondary hover:border-primary'
                      )}
                    >
                      {tone.icon} {tone.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Generate from URL (Optional)
            </h3>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="input w-full"
            />
          </div>

          {/* Content Input */}
          <div className="card">
            <h3 className="font-semibold mb-4">Or describe what you want</h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a post about your latest product launch..."
              className="input w-full h-40 resize-none"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-text-secondary">
                {content.length} characters
              </span>
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || (!content && !url)}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Wand2 size={18} />
                )}
                Generate Content
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="space-y-4">
          {/* Generated Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Generated Content</h3>
              {generatedContent && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-white"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div className="bg-background rounded-lg p-4 min-h-[200px]">
              {generatedContent ? (
                <p className="whitespace-pre-wrap">{generatedContent}</p>
              ) : (
                <p className="text-text-secondary text-center py-8">
                  Generated content will appear here
                </p>
              )}
            </div>
          </div>

          {/* AI Tools */}
          {generatedContent && (
            <div className="card">
              <h3 className="font-semibold mb-4">AI Tools</h3>
              
              <div className="space-y-4">
                {/* Improve */}
                <div className="flex items-center gap-4">
                  <select
                    value={improvementType}
                    onChange={(e) => setImprovementType(e.target.value)}
                    className="input flex-1"
                  >
                    {IMPROVEMENT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleImprove}
                    disabled={improveMutation.isPending}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <RefreshCw size={16} className={improveMutation.isPending ? 'animate-spin' : ''} />
                    Improve
                  </button>
                </div>

                {/* Translate */}
                <div className="flex items-center gap-4">
                  <select
                    value={translateLanguage}
                    onChange={(e) => setTranslateLanguage(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="">Select language</option>
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleTranslate}
                    disabled={translateMutation.isPending || !translateLanguage}
                    className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                  >
                    <Languages size={16} />
                    Translate
                  </button>
                </div>

                {/* Hashtags */}
                <button
                  onClick={handleGetHashtags}
                  disabled={hashtagsMutation.isPending}
                  className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Hash size={16} />
                  {hashtagsMutation.isPending ? 'Generating...' : 'Get Hashtag Suggestions'}
                </button>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2">💡 Tips</h3>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>• Be specific in your prompt for better results</li>
              <li>• The AI optimizes content for each platform</li>
              <li>• Use translate to reach global audiences</li>
              <li>• Add relevant hashtags to increase visibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
