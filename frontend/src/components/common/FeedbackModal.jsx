import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  MessageSquareHeart,
  Star,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bug,
  Lightbulb,
  Palette,
  CreditCard,
  HelpCircle
} from 'lucide-react';
import Button from './Button';

const RATING_LABELS = {
  1: 'Poor — Needs urgent improvement',
  2: 'Fair — Has some issues',
  3: 'Good — Works as expected',
  4: 'Great — Very useful and intuitive',
  5: 'Excellent! — Love using ProTrack'
};

const CATEGORIES = [
  { id: 'General Feedback', label: 'General Feedback', icon: MessageSquareHeart },
  { id: 'Feature Request', label: 'Feature Request', icon: Lightbulb },
  { id: 'Bug Report', label: 'Bug Report', icon: Bug },
  { id: 'UI/UX Design', label: 'UI/UX & Design', icon: Palette },
  { id: 'Billing / Payments', label: 'Billing & Razorpay', icon: CreditCard },
  { id: 'Other', label: 'Other Inquiries', icon: HelpCircle }
];

const FeedbackModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General Feedback');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) {
      setError('Please enter your feedback message.');
      return;
    }

    if (!email.trim() || !name.trim()) {
      setError('Please provide your name and email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/feedback', {
        name: name.trim(),
        email: email.trim(),
        category,
        rating,
        message: message.trim()
      });

      if (res.data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit feedback. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E7EC] dark:border-[#1F2937] bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-transparent dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-white flex items-center gap-1.5">
                Share Your Feedback
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-[#667085] dark:text-[#9CA3AF]">
                Help us make ProTrack even better for your workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-[#172033] dark:text-white">
                  Feedback Received!
                </h4>
                <p className="text-xs text-[#667085] dark:text-[#9CA3AF] max-w-sm mx-auto">
                  Thank you for taking the time to share your thoughts. The ProTrack platform admin team reviews every submission.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Submit Another
                </Button>
                <Button variant="primary" size="sm" onClick={handleReset}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] block">
                  How is your experience with ProTrack?
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {RATING_LABELS[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* 2. Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] block">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const selected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                          selected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
                            : 'border-[#E4E7EC] dark:border-[#374151] text-[#667085] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] block mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6] block mb-1">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@protrack.dev"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 4. Feedback Message */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#172033] dark:text-[#F3F4F6]">
                    Your Feedback / Thoughts <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {message.length} / 3000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={3000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you like, what needs improvement, or what features you'd like to see..."
                  className="w-full p-3 text-xs bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl text-[#172033] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={loading}
                  icon={Send}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/25 px-5"
                >
                  Submit Feedback
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
