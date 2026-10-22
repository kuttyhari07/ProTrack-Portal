import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/layout/ThemeToggle';
import Button from '../../components/common/Button';
import FeedbackModal from '../../components/common/FeedbackModal';
import InteractiveAIDemo from '../../components/home/InteractiveAIDemo';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Clock,
  ShieldCheck,
  CreditCard,
  Users,
  FileText,
  AlertTriangle,
  FolderKanban,
  ChevronRight,
  Bot,
  Zap,
  BarChart3,
  ShieldAlert,
  Calendar,
  CheckSquare,
  Lock,
  ExternalLink,
  MessageSquareHeart,
  Shield,
  Menu,
  X
} from 'lucide-react';

const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B1120] text-[#172033] dark:text-[#F3F4F6] transition-colors duration-200 flex flex-col font-sans">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#0B1120]/90 border-b border-[#E4E7EC] dark:border-[#1F2937] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo - Fixed & Protected from shrinking */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 select-none group">
            <img 
              src="/logo.png" 
              alt="ProTrack Logo" 
              className="w-9 h-9 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform" 
            />
            <span className="font-extrabold text-2xl tracking-tight text-[#172033] dark:text-white flex items-center">
              Pro<span className="text-[#0284c7] dark:text-[#38bdf8]">Track</span>
            </span>
          </Link>

          {/* Desktop Navigation Links (Hidden on small screens to prevent overlap) */}
          <nav className="hidden xl:flex items-center gap-8 text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">
            <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              About ProTrack
            </a>
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Pricing
            </a>
            <a href="#ai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              AI Assistant
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Feedback Button (Desktop) */}
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800"
            >
              <MessageSquareHeart className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </button>

            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {(user?.role === 'system_admin' || user?.email?.toLowerCase() === 'protrack24@gmail.com') && (
                  <Link to="/admin" className="hidden md:inline-flex">
                    <Button variant="secondary" size="sm" icon={Shield} className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs">
                      Admin Console
                    </Button>
                  </Link>
                )}
                <span className="hidden lg:inline-block text-xs font-semibold text-[#667085] dark:text-[#9CA3AF] max-w-[120px] truncate">
                  Hi, {user?.name?.split(' ')[0]}
                </span>
                <Link to="/dashboard">
                  <Button variant="primary" size="sm" icon={ArrowRight} className="text-xs px-3 sm:px-4">
                    <span className="hidden xs:inline">Go to </span>Workspace
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button variant="outline" size="sm" className="text-xs px-3">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/register" className="hidden sm:inline-flex">
                  <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 text-xs">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-[#E4E7EC] dark:border-[#1F2937] bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-xl px-4 py-5 space-y-4 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-[#667085] dark:text-[#9CA3AF]">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 text-[#172033] dark:text-[#F3F4F6] transition-colors"
              >
                About ProTrack
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 text-[#172033] dark:text-[#F3F4F6] transition-colors"
              >
                Features & Modules
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 text-[#172033] dark:text-[#F3F4F6] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 text-[#172033] dark:text-[#F3F4F6] transition-colors"
              >
                Pricing Plans
              </a>
              <a
                href="#ai"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 text-indigo-600 dark:text-indigo-400 flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Assistant
              </a>
            </nav>

            <div className="pt-3 border-t border-[#E4E7EC] dark:border-[#1F2937] flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setFeedbackModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800"
              >
                <MessageSquareHeart className="w-4 h-4" />
                Share Feedback
              </button>

              {isAuthenticated ? (
                <>
                  {(user?.role === 'system_admin' || user?.email?.toLowerCase() === 'protrack24@gmail.com') && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" className="w-full justify-center bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs py-2.5" icon={Shield}>
                        Master Admin Console
                      </Button>
                    </Link>
                  )}
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full justify-center text-xs py-2.5" icon={ArrowRight}>
                      Go to Workspace Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center text-xs py-2.5">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full justify-center text-xs py-2.5">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#111827] border border-indigo-200 dark:border-indigo-900/60 shadow-xs mb-6 animate-in fade-in slide-in-from-top-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Next-Gen Team Execution & Intelligent Telemetry
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#172033] dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Plan Smarter. Track Progress.{' '}
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
              Deliver Better.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base lg:text-lg text-[#667085] dark:text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed">
            The modern SaaS project management platform built for engineering teams, agile leads, and high-velocity startups. Streamline task deliverables, automate due date alerts, report blocker issues, and launch initiatives securely with Razorpay.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/auth/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/25 px-7 py-3 text-sm"
              >
                Create Free Workspace
              </Button>
            </Link>

            <Link to="/auth/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-6 py-3 text-sm"
              >
                Member & Lead Sign In
              </Button>
            </Link>
          </div>

          {/* Live Feature Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#667085] dark:text-[#9CA3AF]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Tailored Member Dashboard</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Smart Due Date Reminders</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs">
              <CreditCard className="w-4 h-4 text-teal-500" />
              <span>Razorpay Project Checkout</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs">
              <Bot className="w-4 h-4 text-purple-500" />
              <span>Built-in AI Assistant</span>
            </div>
          </div>

          {/* Realistic Dashboard UI Mockup Preview */}
          <div className="mt-12 max-w-5xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] shadow-2xl overflow-hidden text-left">
            {/* Window bar */}
            <div className="h-10 px-4 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                app.protrack.dev/dashboard
              </span>
              <div className="w-12" />
            </div>

            {/* Inner Preview Content */}
            <div className="p-5 sm:p-7 space-y-5 bg-[#F8FAFC]/80 dark:bg-[#0B1120]/80">
              {/* Header preview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-md">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                    ProTrack Active Workspace
                  </span>
                  <h3 className="text-base font-bold">Acme Cloud Platform</h3>
                  <p className="text-xs text-indigo-200">
                    3 Active Initiatives • 14 Milestone Tasks On Schedule
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                    Health: 94% On Track
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/50 text-indigo-100 border border-indigo-400/30">
                    Razorpay Verified
                  </span>
                </div>
              </div>

              {/* Grid Cards Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs">
                  <span className="text-gray-400 block font-medium">Deliverables Due in 48h</span>
                  <span className="text-lg font-bold text-amber-500 mt-1 block">2 Approaching</span>
                  <span className="text-[11px] text-gray-500">Automated emails dispatched</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs">
                  <span className="text-gray-400 block font-medium">Active Blockers / Issues</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">0 Critical</span>
                  <span className="text-[11px] text-gray-500">All teams remediated</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs">
                  <span className="text-gray-400 block font-medium">AI Intelligence Status</span>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">Online & Ready</span>
                  <span className="text-[11px] text-gray-500">Contextual assistant active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT THIS WEBSITE & PLATFORM (#about) */}
      <section id="about" className="py-20 bg-white dark:bg-[#0E1526] border-y border-[#E4E7EC] dark:border-[#1F2937] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              About This Website
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#172033] dark:text-white">
              Why We Created ProTrack
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
              Software engineering teams and startup founders struggle with legacy tools that are either too complicated or lack clear accountability. ProTrack eliminates the noise and bridges the gap between project managers and contributors.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Story & Philosophy */}
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Role-Tailored Productivity
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
                  Unlike traditional tools where every user is bombarded with overwhelming financial charts and executive settings, ProTrack provides <strong>dedicated views</strong>: Project Managers get high-level telemetry and quota allocation, while Members get an uncluttered task dashboard focused purely on execution, deadlines, status updates, and issue reporting.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Automated Deadline Protection
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
                  Tasks don't slip through the cracks. ProTrack continuously monitors target due dates, highlights items due within 48 hours in bold urgency banners, and automatically dispatches due date reminder emails to assigned contributors.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Integrated Razorpay Commercial Licensing
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
                  Initiative quotas and project launch licenses are handled seamlessly via <strong>Razorpay</strong>. Every project is backed by verified transaction records, receipts, and 256-bit secure gateway verification.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Full-Site AI Copilot
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
                  Never wonder what task you need to work on next. Our floating <strong>ProTrack AI Assistant</strong> is present on every single page of the website, knowing your exact workspace context, active deliverables, and blockers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE PLATFORM FEATURES (#features) */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              Powerful Capabilities
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#172033] dark:text-white">
              Everything Your Engineering Team Needs
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#667085] dark:text-[#9CA3AF]">
              Designed with precision to keep projects on track from kickoff to final release.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Member Task Portal
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Dedicated personal view showing assigned deliverables, deadline badges, and direct one-click status transitions (<code className="text-indigo-500 font-mono text-[11px]">To Do ➔ In Progress ➔ Completed</code>).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Due Date Email Automation
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Proactive email alerts sent 48 hours prior to milestone deadlines. Contributors can also trigger on-demand deadline summaries to their registered inbox.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Blocker & Risk Triage
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Empower team members to report bugs and dependency blockers with severity levels (<code className="text-rose-500 font-mono text-[11px]">Critical / High / Medium</code>) directly to their managers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Razorpay Project Checkout
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Seamless project activation fee of ₹499 with Razorpay modal checkout, signature verification, invoice receipts, and workspace transaction logs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Website-Wide AI Assistant
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Floating AI companion accessible across every page that answers questions about deadlines, active projects, deliverables, and role guides in English or Tanglish.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Cloud Asset Collaboration
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Centralized storage for design tokens, specifications, architecture blueprints, and code archives with instant download and upload capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (#how-it-works) */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-[#0E1526] border-y border-[#E4E7EC] dark:border-[#1F2937]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              Workflow
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#172033] dark:text-white">
              Get Started in 3 Simple Steps
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto text-lg font-extrabold shadow-md">
                1
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-4">
                Create Your Account
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Sign up as a Workspace Owner or join an existing organization via invitation. Set up your team profile in seconds.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mx-auto text-lg font-extrabold shadow-md">
                2
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-4">
                Launch Projects with Razorpay
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Pay the ₹499 activation fee via Razorpay to allocate project resources. Assign tasks, set deadlines, and attach milestone targets.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto text-lg font-extrabold shadow-md">
                3
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-4">
                Deliver On Schedule with AI
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] mt-2 leading-relaxed">
                Members update task progress directly, receive automated deadline emails, report blockers, and consult the AI assistant 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRAINED AI ASSISTANT SHOWCASE & PLAYGROUND (#ai) */}
      <InteractiveAIDemo />

      {/* 7. TRANSPARENT PRICING SECTION (#pricing) */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Pricing Model
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#172033] dark:text-white">
              Simple, Transparent Project Licensing
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#667085] dark:text-[#9CA3AF]">
              Pay only when you launch a project. No monthly subscription traps.
            </p>
          </div>

          <div className="mt-12 max-w-lg mx-auto p-8 rounded-3xl bg-white dark:bg-[#111827] border-2 border-indigo-500 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              Pay As You Launch
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Project Activation License
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Powered by Razorpay Secure Gateway
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹499</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">INR / project (One-time)</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Unlimited tasks, subtasks, and order management</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Automated due date reminder emails & banners</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Milestones schedule & blocker issue tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>24/7 Contextual ProTrack AI Assistant</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Official Razorpay payment receipts & invoice records</span>
              </li>
            </ul>

            <div className="mt-8">
              <Link to="/auth/register">
                <Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm shadow-md">
                  Get Started & Launch Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CALL TO ACTION BANNER */}
      <section className="py-16 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Ready to Take Control of Your Team's Deliverables?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-xl mx-auto">
            Join modern product engineering teams that plan, execute, and deliver on time with ProTrack.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/auth/register">
              <Button variant="secondary" size="lg" className="bg-white text-indigo-900 hover:bg-gray-100 font-bold px-6 py-2.5 text-sm">
                Register Free Workspace
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="outline" size="lg" className="border-indigo-300 text-white hover:bg-white/10 px-6 py-2.5 text-sm">
                Sign In to Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-8 bg-[#0B1120] border-t border-gray-800 text-gray-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="ProTrack Logo" 
              className="w-7 h-7 object-contain rounded-lg" 
            />
            <span className="font-bold text-white text-sm">ProTrack</span>
            <span className="text-gray-500 text-xs">© 2026 ProTrack Inc. Plan • Track • Achieve.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(true)}
              className="hover:text-indigo-400 text-indigo-400 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <MessageSquareHeart className="w-3.5 h-3.5" />
              Give Feedback
            </button>
            <Link to="/auth/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/auth/register" className="hover:text-white transition-colors">
              Create Account
            </Link>
            <Link to="/auth/forgot-password" className="hover:text-white transition-colors">
              Forgot Password
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating Feedback Action Button (Fixed Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => setFeedbackModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xl shadow-indigo-500/35 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-400/30 group"
          title="Share your feedback with the ProTrack team"
        >
          <MessageSquareHeart className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
          <span>Feedback</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Feedback Submission Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
