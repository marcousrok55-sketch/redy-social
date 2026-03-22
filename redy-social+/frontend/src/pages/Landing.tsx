import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Instagram, Facebook, Twitter, Linkedin, Youtube, 
  Music, Pin, Globe, MessageCircle, ArrowRight,
  Check, Star, Zap, BarChart, Users, Shield, Rocket,
  ChevronRight, Play, Quote, Menu, X, Calendar
} from 'lucide-react';
import clsx from 'clsx';

const PLATFORMS = [
  { name: 'Instagram', icon: '📷', color: 'from-pink-500 to-purple-500' },
  { name: 'Facebook', icon: '📘', color: 'from-blue-600 to-blue-700' },
  { name: 'Twitter/X', icon: '🐦', color: 'from-sky-400 to-sky-500' },
  { name: 'LinkedIn', icon: '💼', color: 'from-blue-700 to-blue-800' },
  { name: 'TikTok', icon: '🎵', color: 'from-gray-800 to-black' },
  { name: 'YouTube', icon: '▶️', color: 'from-red-600 to-red-700' },
  { name: 'Pinterest', icon: '📌', color: 'from-red-500 to-pink-500' },
  { name: 'Threads', icon: '🧵', color: 'from-gray-700 to-gray-900' },
  { name: 'Reddit', icon: '🔴', color: 'from-orange-500 to-red-500' },
  { name: 'Website', icon: '🌐', color: 'from-blue-500 to-indigo-600' },
];

const FEATURES = [
  { icon: Calendar, title: 'Smart Scheduling', description: 'Schedule posts at optimal times with AI-powered recommendations' },
  { icon: BarChart, title: 'Advanced Analytics', description: 'Track performance across all platforms in real-time' },
  { icon: MessageCircle, title: 'Unified Inbox', description: 'Manage all comments and messages in one place' },
  { icon: Zap, title: 'AI Content Assistant', description: 'Generate engaging content with artificial intelligence' },
  { icon: Users, title: 'Team Collaboration', description: 'Work together with role-based access control' },
  { icon: Shield, title: 'Enterprise Security', description: 'Bank-level encryption and GDPR compliance' },
];

const PRICING = [
  { name: 'Starter', price: 'Free', period: '', description: 'Perfect for individuals', features: ['2 Social Accounts', '10 Posts/month', 'Basic Analytics'], cta: 'Get Started', popular: false },
  { name: 'Pro', price: '$29', period: '/month', description: 'For growing businesses', features: ['5 Social Accounts', 'Unlimited Posts', 'AI Assistant', 'Advanced Analytics'], cta: 'Start Free Trial', popular: true },
  { name: 'Agency', price: '$99', period: '/month', description: 'For large teams', features: ['Unlimited Accounts', 'White-label', 'API Access', 'Dedicated Support'], cta: 'Contact Sales', popular: false },
];

const TESTIMONIALS = [
  { name: 'Sarah Johnson', role: 'Marketing Director', avatar: '👩‍💼', content: 'Redy Social transformed how we manage social media. The AI content assistant alone saves us hours every week!' },
  { name: 'Michael Chen', role: 'CEO', avatar: '👨‍💻', content: 'The unified inbox is a game-changer. We respond to customers across all platforms from one dashboard.' },
  { name: 'Emma Williams', role: 'Social Media Manager', avatar: '👩‍🎨', content: 'Best investment for our social strategy. Analytics are incredibly detailed and actionable.' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-surface-light">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-xl font-bold text-white">Redy Social</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-secondary hover:text-white transition-colors">Features</a>
            <a href="#platforms" className="text-text-secondary hover:text-white transition-colors">Platforms</a>
            <a href="#pricing" className="text-text-secondary hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-text-secondary hover:text-white transition-colors">Testimonials</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-text-secondary hover:text-white">Sign In</Link>
            <Link to="/register" className="btn-primary">Get Started Free</Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
            <Star size={14} className="fill-primary" />
            <span>Trusted by 10,000+ businesses worldwide</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Manage All Your Social Media{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
              In One Place
            </span>
          </h1>
          
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Schedule posts, analyze performance, and engage with your audience across all platforms from a single, powerful dashboard.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <button className="btn-secondary text-lg px-8 py-4 flex items-center justify-center gap-2">
              <Play size={20} /> Watch Demo
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '50M+', label: 'Posts Scheduled' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section id="platforms" className="py-20 px-4 bg-surface/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Connect All Your Platforms</h2>
          <p className="text-text-secondary text-center mb-12">Support for all major social media platforms</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {PLATFORMS.map(platform => (
              <div key={platform.name} className="card text-center p-6 hover:scale-105 transition-transform">
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl`}>
                  {platform.icon}
                </div>
                <p className="font-medium">{platform.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need to Succeed</h2>
          <p className="text-text-secondary text-center mb-12">Powerful features for social media management</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feature => (
              <div key={feature.title} className="card group hover:border-primary/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-surface/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {PRICING.map(plan => (
              <div key={plan.name} className={clsx('card relative', plan.popular && 'border-primary ring-2 ring-primary/20')}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-sm">Most Popular</div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-text-secondary">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3">
                      <Check size={18} className="text-green-400" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={clsx('w-full py-3 rounded-lg font-medium', plan.popular ? 'btn-primary' : 'btn-secondary')}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Loved by Businesses</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card">
                <Quote size={32} className="text-primary/30 mb-4" />
                <p className="text-lg mb-6">{t.content}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center text-2xl">{t.avatar}</div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-text-secondary">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/30 text-center py-16">
            <Rocket size={48} className="mx-auto mb-6 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Social Media?</h2>
            <p className="text-xl text-text-secondary mb-8">Join thousands of businesses using Redy Social.</p>
            <Link to="/register" className="btn-primary text-lg px-8 py-4">Start Your Free Trial</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-surface-light">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="font-bold">Redy Social</span>
          </div>
          <p className="text-text-secondary text-sm">© 2026 Redy Social. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
