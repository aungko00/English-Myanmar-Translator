'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Languages, Trash2, Copy, Check, CheckCircle2, Info, Settings, X, Moon, Zap, Volume2, VolumeX, ChevronDown, Keyboard, Mic, MicOff, PlusCircle, AlertTriangle, Menu, MessageSquare, Eye, ClipboardPaste, Shield, Sparkles, User, Lock, Cpu, ExternalLink, Star, Search, History, ArrowLeftRight, RefreshCw, Download, Smartphone, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { encryptSensitiveData, decryptSensitiveData } from '@/lib/crypto'
import AppUpdateDialog from '@/components/AppUpdateDialog'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import {
  APP_VERSION,
  AppUpdateInfo,
  checkForGitHubUpdate,
  getConfiguredGithubRepo,
  getSkippedUpdateVersion,
  isRunningInsideCapacitor,
  setConfiguredGithubRepo,
} from '@/lib/app-update'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type AIProvider = 'gemini' | 'groq'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sourceLang: string
  targetLang: string
  provider?: AIProvider
  model?: string
  isPending?: boolean
}

type Theme = 'default' | 'cyberpunk' | 'soft-minimal' | 'light' | 'dark' | 'midnight' | 'glass-modern' | 'brutalist'
type FontStyle = 'sans' | 'mono' | 'display' | 'roboto' | 'open-sans' | 'lato' | 'montserrat' | 'playfair' | 'merriweather' | 'ubuntu' | 'poppins'
type MyanmarFontStyle = 'serif-elegant' | 'headline-gothic' | 'square-modern' | 'ultra-light' | 'padauk-bold' | 'novel-serif' | 'sans-clean'
type AppLang = 'en' | 'my'
type AnimationType = 'typing' | 'typewriter' | 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'rotate' | 'blur' | 'glitch' | 'elastic'
type SoundType = 'Typing_1' | 'Typing_2'

const TypewriterText = ({ text, speed = 25, onChar, onComplete }: { text: string, speed?: number, onChar?: () => void, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const hasCompleted = useRef(false)

  useEffect(() => {
    if (currentIndex < text.length) {
      // More dynamic variation: occasional "bursts" of speed
      const isBurst = Math.random() > 0.8
      const baseVariation = Math.random() * 0.5 + 0.75 // 0.75 to 1.25
      const variation = isBurst ? baseVariation * 0.4 : baseVariation
      
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
        if (onChar) onChar()
      }, speed * variation)
      return () => clearTimeout(timeout)
    } else if (onComplete && !hasCompleted.current) {
      hasCompleted.current = true
      setTimeout(() => setIsTyping(false), 0)
      onComplete()
    }
  }, [currentIndex, text, speed, onChar, onComplete])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative inline-block w-full"
    >
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      {isTyping && (
        <motion.span
          animate={{ 
            opacity: [1, 0, 1],
            scaleY: [1, 1.2, 1]
          }}
          transition={{ duration: 0.6, repeat: Infinity }}
          className="inline-block w-1.5 h-4 ml-1 bg-current align-middle shadow-[0_0_8px_currentColor]"
        />
      )}
    </motion.div>
  )
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  timestamp: Date
  isFavorite?: boolean
}

const THEME_CONFIG = {
  default: {
    name: 'Default Theme',
    bg: 'bg-[#212121]',
    sidebar: 'bg-[#171717]',
    header: 'bg-[#212121]/80',
    text: 'text-white',
    textMuted: 'text-gray-400',
    accent: 'bg-emerald-600',
    accentText: 'text-white',
    accentHover: 'hover:bg-emerald-700',
    border: 'border-white/10',
    input: 'bg-[#2f2f2f]',
    userMsg: 'bg-[#2f2f2f]',
    aiMsg: 'bg-transparent',
    icon: 'text-emerald-500',
    shadow: 'shadow-none',
    isDark: true
  },
  cyberpunk: {
    name: 'Cyberpunk',
    bg: 'bg-black',
    sidebar: 'bg-black',
    header: 'bg-black/80',
    text: 'text-[#00f2ff]',
    textMuted: 'text-[#00f2ff]/60',
    accent: 'bg-[#00f2ff]',
    accentText: 'text-black',
    accentHover: 'hover:bg-[#00f2ff]/80',
    border: 'border-[#00f2ff]/30',
    input: 'bg-black',
    userMsg: 'bg-[#00f2ff]/10',
    aiMsg: 'bg-transparent',
    icon: 'text-[#00f2ff]',
    shadow: 'shadow-[0_0_15px_rgba(0,242,255,0.3)]',
    isDark: true
  },
  'soft-minimal': {
    name: 'Soft Minimal',
    bg: 'bg-[#f5f5f0]',
    sidebar: 'bg-[#ffffff]',
    header: 'bg-[#f5f5f0]/80',
    text: 'text-[#333333]',
    textMuted: 'text-[#888888]',
    accent: 'bg-[#5A5A40]',
    accentText: 'text-white',
    accentHover: 'hover:bg-[#4A4A30]',
    border: 'border-[#e0e0d5]',
    input: 'bg-white',
    userMsg: 'bg-white shadow-sm',
    aiMsg: 'bg-transparent',
    icon: 'text-[#5A5A40]',
    shadow: 'shadow-sm',
    isDark: false
  },
  light: {
    name: 'Light Theme',
    bg: 'bg-white',
    sidebar: 'bg-gray-50',
    header: 'bg-white/80',
    text: 'text-black',
    textMuted: 'text-gray-500',
    accent: 'bg-blue-600',
    accentText: 'text-white',
    accentHover: 'hover:bg-blue-700',
    border: 'border-gray-200',
    input: 'bg-gray-100',
    userMsg: 'bg-gray-100',
    aiMsg: 'bg-transparent',
    icon: 'text-blue-500',
    shadow: 'shadow-sm',
    isDark: false
  },
  dark: {
    name: 'True Black',
    bg: 'bg-black',
    sidebar: 'bg-[#0a0a0a]',
    header: 'bg-black/80',
    text: 'text-white',
    textMuted: 'text-gray-400',
    accent: 'bg-white',
    accentText: 'text-black',
    accentHover: 'hover:bg-gray-200',
    border: 'border-white/20',
    input: 'bg-[#1a1a1a]',
    userMsg: 'bg-[#1a1a1a]',
    aiMsg: 'bg-transparent',
    icon: 'text-white',
    shadow: 'shadow-none',
    isDark: true
  },
  midnight: {
    name: 'Midnight Grey',
    bg: 'bg-[#1a1c1e]',
    sidebar: 'bg-[#111214]',
    header: 'bg-[#1a1c1e]/80',
    text: 'text-[#e2e2e2]',
    textMuted: 'text-[#8e9297]',
    accent: 'bg-[#5865f2]',
    accentText: 'text-white',
    accentHover: 'hover:bg-[#4752c4]',
    border: 'border-[#ffffff]/10',
    input: 'bg-[#2b2d31]',
    userMsg: 'bg-[#2b2d31]',
    aiMsg: 'bg-transparent',
    icon: 'text-[#5865f2]',
    shadow: 'shadow-lg',
    isDark: true
  },
  'glass-modern': {
    name: 'Glass Modern',
    bg: 'bg-gradient-to-br from-[#1a1c1e] via-[#2b2d31] to-[#1a1c1e]',
    sidebar: 'bg-white/5 backdrop-blur-xl',
    header: 'bg-white/5 backdrop-blur-md',
    text: 'text-white',
    textMuted: 'text-white/60',
    accent: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    accentText: 'text-white',
    accentHover: 'hover:from-indigo-600 hover:to-purple-600',
    border: 'border-white/10',
    input: 'bg-white/5 backdrop-blur-sm',
    userMsg: 'bg-white/10 backdrop-blur-md border border-white/10',
    aiMsg: 'bg-transparent',
    icon: 'text-indigo-400',
    shadow: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]',
    isDark: true
  },
  brutalist: {
    name: 'Neo Brutalist',
    bg: 'bg-[#f0f0f0]',
    sidebar: 'bg-white border-r-4 border-black',
    header: 'bg-white border-b-4 border-black',
    text: 'text-black',
    textMuted: 'text-black/60',
    accent: 'bg-[#ff3e00]',
    accentText: 'text-white',
    accentHover: 'hover:bg-[#e63700]',
    border: 'border-4 border-black',
    input: 'bg-white border-4 border-black',
    userMsg: 'bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
    aiMsg: 'bg-transparent',
    icon: 'text-[#ff3e00]',
    shadow: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    isDark: false
  }
}

const ENGLISH_FONT_OPTIONS = [
  { id: 'sans', name: 'Inter (Sans)', class: 'font-sans' },
  { id: 'mono', name: 'JetBrains Mono', class: 'font-mono' },
  { id: 'display', name: 'Orbitron (Display)', class: 'font-display' },
  { id: 'roboto', name: 'Roboto', class: 'font-roboto' },
  { id: 'open-sans', name: 'Open Sans', class: 'font-open-sans' },
  { id: 'lato', name: 'Lato', class: 'font-lato' },
  { id: 'montserrat', name: 'Montserrat', class: 'font-montserrat' },
  { id: 'playfair', name: 'Playfair Display', class: 'font-playfair' },
  { id: 'merriweather', name: 'Merriweather', class: 'font-merriweather' },
  { id: 'ubuntu', name: 'Ubuntu', class: 'font-ubuntu' },
  { id: 'poppins', name: 'Poppins', class: 'font-poppins' },
]

export interface MyanmarFontOption {
  id: MyanmarFontStyle
  name: string
  subtext: string
  subtextEn: string
  class: string
}

const MYANMAR_FONT_OPTIONS: MyanmarFontOption[] = [
  { 
    id: 'serif-elegant', 
    name: 'Noto Serif Classical', 
    subtext: 'မဂ္ဂဇင်း မင်္ဂလာစာလုံးပုံစံ (ကျက်သရေရှိ မင်္ဂလာ)', 
    subtextEn: 'Formal magazine ceremonial serif (Classic & Elegant)', 
    class: 'font-mm-serif-elegant' 
  },
  { 
    id: 'headline-gothic', 
    name: 'Heavy Ink Gothic', 
    subtext: 'မင်ထူ သတင်းစာခေါင်းကြီး (လေးလံထူထဲ ပေါ်လွင်စတိုင်)', 
    subtextEn: 'Bold newspaper headline (Strong & Heavy typography)', 
    class: 'font-mm-headline-gothic' 
  },
  { 
    id: 'square-modern', 
    name: 'Square Modernist', 
    subtext: 'စတုရန်း ခေတ်ဆန်း မျဉ်းဖြောင့် (ခေတ်သစ် အဆန်းစတိုင်)', 
    subtextEn: 'Modern geometric square lines (Clean & Sharp)', 
    class: 'font-mm-square-modern' 
  },
  { 
    id: 'ultra-light', 
    name: 'Minimalist Ultra-Light', 
    subtext: 'ခေတ်သစ် အပါးလိုင်းစတိုင် (သွယ်လျ နုနယ်စတိုင်)', 
    subtextEn: 'Contemporary thin line (Slender & Minimalist)', 
    class: 'font-mm-ultra-light' 
  },
  { 
    id: 'padauk-bold', 
    name: 'Padauk Inscription', 
    subtext: 'ဂန္ထဝင် ပိတောက် ကျောက်ထွင်းစံ (သမိုင်းဝင် ရိုးရာစတိုင်)', 
    subtextEn: 'Classic stone inscription heritage (Traditional OpenType)', 
    class: 'font-mm-padauk-bold' 
  },
  { 
    id: 'novel-serif', 
    name: 'Literary Novel Serif', 
    subtext: 'ရသဝတ္ထု စာအုပ်စတိုင် (ဖတ်ရှုရ အေးချမ်းစတိုင်)', 
    subtextEn: 'Comfortable novel reading serif (Literary book typography)', 
    class: 'font-mm-novel-serif' 
  },
  { 
    id: 'sans-clean', 
    name: 'Modern Clean Sans', 
    subtext: 'ခေတ်မီ ရှင်းသန့် ယူနီကုဒ် (ခေတ်ပေါ် စံသတ်မှတ်ချက်)', 
    subtextEn: 'Modern clean Unicode standard (Universal default)', 
    class: 'font-mm-sans-clean' 
  },
]

// Backward-compatible alias for any remaining references
const FONT_OPTIONS = ENGLISH_FONT_OPTIONS

export interface ModelOption {
  id: string
  name: string
  badge: string
  description: string
  descriptionEn: string
}

export const GEMINI_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Recommended',
    description: 'အလွန်မြန်ဆန်ပြီး ဘာသာပြန်တိကျမှု အကောင်းဆုံး Google AI model (Default)',
    descriptionEn: 'High-speed flagship Google AI translation model with optimal accuracy (Default)',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Ultra Fast',
    description: 'Latency အနည်းဆုံးနှင့် အမြန်ဆုံး အခြေခံဘာသာပြန် model',
    descriptionEn: 'Ultra-low latency lightweight translation model',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    badge: 'Pro Reasoning',
    description: 'ရှုပ်ထွေးသော စာကြောင်းများနှင့် စာပေဆန်သော ဘာသာပြန်များအတွက်',
    descriptionEn: 'Advanced linguistic reasoning for literary and complex translations',
  },
  {
    id: 'gemini-4-carbon',
    name: 'Gemini 4 Carbon',
    badge: 'Deep Reasoning',
    description: 'အနက်နဲဆုံး အဓိပ္ပာယ်ဖော်ထုတ်မှုနှင့် အဆင့်မြင့် ဘာသာပြန်ဆိုမှု',
    descriptionEn: 'Deep contextual comprehension and nuanced multi-lingual translation',
  },
]

export const GROQ_MODELS: ModelOption[] = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS 120B (MoE)',
    badge: 'Recommended',
    description: 'OpenAI ၏ 120B open-weight reasoning model, Groq LPU ပေါ်တွင် အလွန်မြန်ဆန်စွာ အလုပ်လုပ်ခြင်း (Default)',
    descriptionEn: 'OpenAI 120B flagship open reasoning model running with blazing speed on Groq LPUs (Default)',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    badge: 'Flagship 70B',
    description: 'Meta ၏ 70B flagship model, ဘာသာစကားစွမ်းရည်နှင့် တိကျမှု အထူးကောင်းမွန်',
    descriptionEn: 'Meta 70B flagship model with high-precision translation quality',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    badge: 'Ultra Fast',
    description: 'Groq LPU ပေါ်တွင် မိုက်ခရိုစက္ကန့်ပိုင်းအတွင်း အလွန်မြန်ဆန်စွာ ဘာသာပြန်ပေးခြင်း',
    descriptionEn: 'Ultra-fast inference in micro-seconds on Groq LPUs',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (MoE)',
    badge: 'High Context',
    description: 'Mistral AI ၏ Mixture-of-Experts architecture ဖြင့် ရှည်လျားသောစာသားများအတွက်',
    descriptionEn: 'Mistral AI Mixture-of-Experts architecture for long document translations',
  },
  {
    id: 'gemma2-9b-it',
    name: 'Google Gemma 2 9B',
    badge: 'Google Open',
    description: 'Google ၏ ပေါ့ပါးသွက်လက်သော Gemma 2 instruction model',
    descriptionEn: 'Google lightweight Gemma 2 open instruction model',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill 70B',
    badge: 'Reasoning',
    description: 'DeepSeek R1 ၏ အဆင့်မြင့်တွေးခေါ်မှု စွမ်းရည်ထည့်သွင်းထားသော Llama 70B model',
    descriptionEn: 'DeepSeek R1 advanced reasoning distilled into Llama 70B',
  },
]

const TRANSLATIONS = {
  en: {
    appTitle: 'ME Translator',
    newChat: 'New Chat',
    searchHistory: 'Search conversations...',
    chatHistory: 'Chat History',
    clearHistory: 'Clear History',
    clearConfirmTitle: 'Clear Chat History?',
    clearConfirmDesc: 'Are you sure you want to delete all saved conversations? This cannot be undone.',
    clearConfirmBtn: 'Clear All',
    cancel: 'Cancel',
    confirm: 'Confirm',
    settings: 'Settings',
    tabs: {
      appearance: 'Appearance',
      audio: 'Audio',
      api: 'API',
      permissions: 'Permissions',
      updates: 'Updates'
    },
    appLanguage: 'App Language',
    appLangDesc: 'Interface display language',
    themeOption: 'Theme Option',
    englishFont: 'English Font Style',
    englishFontDesc: 'Applied to English output & chat messages',
    myanmarFont: 'Myanmar Font Style',
    myanmarFontDesc: 'Applied to Myanmar translation output',
    outputAnimation: 'Output Animation',
    animationSound: 'Animation Sound',
    soundType: 'Sound Type',
    soundDesc: 'Animations and sounds will trigger when a new translation arrives. Select a sound to preview.',
    saveAppearance: 'Save Appearance & Fonts',
    saveAudio: 'Save Audio Settings',
    saveApi: 'Save API Configuration',
    close: 'Close',
    aiProviderModel: 'AI Provider & Model',
    activeProvider: 'Active AI Provider',
    activeModel: 'Model Selection',
    selectAiEngine: 'Select AI Engine',
    apiKeyField: 'API Key',
    apiKeyPlaceholder: 'Paste your API key here...',
    apiKeyEncrypted: 'E2E Encrypted (AES-GCM-256)',
    inputPlaceholder: 'Type in English or Myanmar...',
    copy: 'Copy',
    copied: 'Copied!',
    delete: 'Delete',
    understood: 'Understood',
    warningTitle: 'API Key Required',
    warningMissingKey: (provider: string) => `No API Key has been provided for ${provider}.`,
    warningRequirement: 'An API Key is strictly required to save and use this AI configuration.',
    micAllowed: 'Allowed',
    micBlocked: 'Blocked',
    micPrompt: 'Trigger Permission Prompt',
    disclaimer: (provider: string) => `${provider} AI models can make mistakes. Check important info.`,
    
    // API Tab Specific Translations
    e2eSecurityBadge: 'E2E Encrypted (AES-GCM-256)',
    activeKeyReady: '🔒 Encrypted & Ready',
    defaultFreeQuota: '✨ Default Free Quota',
    pasteKeyPlaceholder: (provider: string) => `Paste ${provider} API Key...`,
    hideKey: 'Hide Key',
    showKey: 'Show Key',
    pasteTooltip: 'Paste from clipboard',
    clearKeyTooltip: 'Clear Key',
    pasteBlockedAlert: '⚠️ Direct clipboard paste was blocked by browser. Please use keyboard shortcut Ctrl+V or long-press on mobile.',
    storageEncryptionNote: 'Stored and protected locally on your device with Web Crypto (AES-GCM).',
    
    // Gemini Guide Card
    geminiGuideTitle: 'Google Gemini Free API Guide',
    geminiGuideText: 'You can easily obtain a free Gemini API key with any Google account at Google AI Studio.',
    geminiLinkText: 'Get Gemini Free API Key:',
    geminiQuotaTitle: '📊 Free Quota Usage',
    geminiQuotaText: 'Using your own Gemini key gives you dedicated quotas and faster response speeds.',
    
    // Groq Guide Card
    groqGuideTitle: 'Groq Cloud Free API Guide (How to get free key)',
    groqGuideText: 'Groq provides blazing speeds (~500+ tokens/sec) on LPU hardware. OpenAI GPT-OSS 120B (MoE) is recommended and available for free testing.',
    groqLinkText: 'Get Groq Free API Key:',
    groqStepsTitle: '📝 Step-by-Step Instructions:',
    groqStep1: '1. Visit the link and sign up / log in with Google or GitHub for free.',
    groqStep2: '2. Click "Create API Key" and enter any key name.',
    groqStep3: '3. Copy the generated gsk_... key and paste it into the field above.',
    
    // Permissions Tab Translations
    permissionsTitle: 'Device & System Permissions',
    micTitle: 'Microphone',
    clipTitle: 'Clipboard Paste',
    triggerButtonText: 'Trigger Permission Prompt',
    faqTitle: '💡 How to avoid repeated permission prompts in AI Studio?',
    faqDesc: 'Due to security policies in Google AI Studio preview iframes, access requests for Microphone and Clipboard may be prompted on each page reload.',
    solutionsTitle: 'Solutions:',
    solution1: '1. Open in New Tab: Click the browser icon at top right to run the app in a standalone browser window without iframe restrictions.',
    solution2: '2. In browser URL bar, click the 🔒 settings icon and set Microphone and Clipboard to "Always Allow".',
    
    // Chat & Empty State Translations
    readyHeading: 'How can I help you translate?',
    readySubheading: 'Translate between English and Myanmar with high accuracy. Type your text below to get started.',
    tapToAsk: 'Tap to Ask',
    you: 'You',
    pasteTooltipMain: 'Paste from clipboard',
    voiceTooltip: 'Voice input',
    copyTooltip: 'Copy text',
    deleteChatTooltip: 'Delete chat session',
    geminiModelLabel: 'Gemini AI Model',
    groqModelLabel: 'Groq AI Model',
    defaultBadge: 'Default',
    fastLpuBadge: 'Fast LPU',
    applyChangesTitle: 'Apply Changes?',
    applyChangesDesc: 'Do you want to save and apply your new settings?',
    soundOn: 'On',
    soundOff: 'Off',
    historyTab: 'History',
    favoritesTab: 'Favorites',
    emptyHistory: 'No translation history matches your search.',
    emptyFavorites: 'No favorite chats yet. Tap the star icon on any chat to save it here.',
    addFavorite: 'Add to Favorites',
    removeFavorite: 'Remove from Favorites',
    msgsCount: (n: number) => `${n} ${n === 1 ? 'msg' : 'msgs'}`,
    replaceKey: 'Replace',
    keepExistingKey: 'Keep Saved Key',
    lockedKeyNote: 'Write-only vault: full key cannot be viewed after encryption.',
    swapDirection: 'Switch Translation Direction',
    autoDirectionHint: 'Auto-detects English ↔ Myanmar',
    appUpdatesTitle: 'Android App & GitHub Updates',
    currentVersionLabel: 'Installed Version',
    githubRepoLabel: 'GitHub Repository (owner/repo)',
    githubRepoHint: 'Checks GitHub Releases automatically on startup whenever you push an update.',
    checkForUpdates: 'Check for Updates',
    checkingUpdates: 'Checking GitHub...',
    upToDateMsg: (ver: string) => `You are running the latest version (v${ver}).`,
    noReleasesMsg: 'No GitHub Releases published yet for this repository.',
    updateCheckFailed: (err: string) => `Could not check updates (${err}).`,
    updateAvailableBanner: (ver: string) => `Update Ready: v${ver}`,
    installAndroidApp: 'Install App on Device',
    installPwaDesc: 'Install ME Translator to your home screen for a native full-screen experience.',
    iosInstallTitle: 'Install on iPhone / iPad',
    iosInstallSteps: '1. Tap the Share button in Safari.\n2. Scroll down and tap "Add to Home Screen".',
    offlineBanner: 'Offline Mode — History & saved chats remain available.',
    saveRepoBtn: 'Save Repo',
    repoSavedMsg: 'Repository saved.',
    exportZipTitle: 'GitHub & Android APK Source Bundle',
    exportZipDesc: 'Download the clean source ZIP (with GitHub Actions APK workflow, Capacitor config, and zero secrets) to upload to GitHub via Cue AI or Git.',
    exportZipBtn: 'Download Project ZIP (For GitHub / APK)'
  },
  my: {
    appTitle: 'ME ဘာသာပြန်စနစ်',
    newChat: 'စကားပြောအသစ်',
    searchHistory: 'ယခင်ပြောဆိုမှုများ ရှာဖွေပါ...',
    chatHistory: 'ပြောဆိုမှု မှတ်တမ်းများ',
    clearHistory: 'မှတ်တမ်းဖျက်မည်',
    clearConfirmTitle: 'မှတ်တမ်းအားလုံး ဖျက်ပစ်မည်လား?',
    clearConfirmDesc: 'သိမ်းဆည်းထားသော ပြောဆိုမှုမှတ်တမ်းအားလုံးကို ဖျက်ပစ်မည်မှာ သေချာပါသလား? ပြန်လည်ရယူ၍ မရနိုင်ပါ။',
    clearConfirmBtn: 'အားလုံးဖျက်မည်',
    cancel: 'ပယ်ဖျက်မည်',
    confirm: 'အတည်ပြုမည်',
    settings: 'ဆက်တင်များ',
    tabs: {
      appearance: 'အသွင်အပြင်',
      audio: 'အသံနှင့် လှုပ်ရှားမှု',
      api: 'API စနစ်',
      permissions: 'ခွင့်ပြုချက်များ',
      updates: 'အပ်ဒိတ်'
    },
    appLanguage: 'အက်ပ် စနစ်ဘာသာစကား',
    appLangDesc: 'မျက်နှာပြင်ပြသမှု ဘာသာစကား ရွေးချယ်ပါ',
    themeOption: 'အပြင်အဆင် ဒီဇိုင်း (Theme)',
    englishFont: 'အင်္ဂလိပ်စာ ဖောင့်ဒီဇိုင်း (English Font)',
    englishFontDesc: 'အင်္ဂလိပ်စာ Output Box တွင်သာ သီးသန့် သက်ရောက်ပါမည်',
    myanmarFont: 'မြန်မာဖောင့် ဒီဇိုင်း (Myanmar Font)',
    myanmarFontDesc: 'မြန်မာဘာသာပြန် Output Box တွင်သာ သီးသန့် သက်ရောက်ပါမည်',
    outputAnimation: 'စာသားပေါ်ထွက်ပုံ လှုပ်ရှားမှု (Animation)',
    animationSound: 'စာရိုက်သံ အသံထွက် (Sound)',
    soundType: 'အသံအမျိုးအစား',
    soundDesc: 'ဘာသာပြန်ချက်အသစ် ရောက်ရှိလာချိန်တွင် လှုပ်ရှားမှုနှင့် အသံများ ထွက်ပေါ်မည်ဖြစ်ပါသည်။ နမူနာအသံကို ရွေးချယ်နားဆင်နိုင်ပါသည်။',
    saveAppearance: 'အသွင်အပြင်နှင့် ဖောင့်များ သိမ်းဆည်းမည်',
    saveAudio: 'အသံဆက်တင် သိမ်းဆည်းမည်',
    saveApi: 'API ပြင်ဆင်မှု သိမ်းဆည်းမည်',
    close: 'ပိတ်မည်',
    aiProviderModel: 'AI အမျိုးအစားနှင့် မော်ဒယ် ရွေးချယ်မှု',
    activeProvider: 'အသုံးပြုမည့် AI Provider',
    activeModel: 'AI မော်ဒယ် ရွေးချယ်မှု',
    selectAiEngine: 'အသုံးပြုမည့် AI Engine ရွေးချယ်ပါ',
    apiKeyField: 'API Key',
    apiKeyPlaceholder: 'သင်၏ API Key ကို ဤနေရာတွင် ထည့်ပါ...',
    apiKeyEncrypted: 'Web Crypto API ဖြင့် စက်တွင်း၌ လျှို့ဝှက်ကုဒ်စနစ် (E2E Encrypted) ပြုလုပ်ထားပါသည်',
    inputPlaceholder: 'အင်္ဂလိပ် သို့မဟုတ် မြန်မာလို ရိုက်ထည့်ပါ...',
    copy: 'ကူးယူမည်',
    copied: 'ကူးယူပြီး!',
    delete: 'ဖျက်မည်',
    understood: 'နားလည်ပါပြီ',
    warningTitle: 'API Key ထည့်သွင်းရန် လိုအပ်ပါသည်',
    warningMissingKey: (provider: string) => `သင်ရွေးချယ်ထားသော "${provider}" အတွက် ကိုယ်ပိုင် API Key ထည့်သွင်းထားခြင်း မရှိသေးပါ။`,
    warningRequirement: '⚠️ API Configuration ကို သိမ်းဆည်းအသုံးပြုရန်အတွက် API Key ထည့်သွင်းပေးရန် မဖြစ်မနေ လိုအပ်ပါသည်။',
    micAllowed: 'ခွင့်ပြုထားသည်',
    micBlocked: 'ပိတ်ထားသည်',
    micPrompt: 'ခွင့်ပြုချက် တောင်းခံမည်',
    disclaimer: (provider: string) => `${provider} AI မော်ဒယ်များသည် အမှားအယွင်းရှိနိုင်ပါသည်။ အရေးကြီးသောအချက်အလက်များကို ပြန်လည်စစ်ဆေးပါ။`,
    
    // API Tab Specific Translations
    e2eSecurityBadge: 'E2E လျှို့ဝှက်စနစ် (AES-GCM-256)',
    activeKeyReady: '🔒 စက်တွင်း၌ လုံခြုံစွာ သိမ်းဆည်းထားပြီး',
    defaultFreeQuota: '✨ မူရင်း အခမဲ့ Quota',
    pasteKeyPlaceholder: (provider: string) => `${provider} API Key ကို ဤနေရာတွင် ထည့်ပါ...`,
    hideKey: 'Key ဖျောက်မည်',
    showKey: 'Key ပြသမည်',
    pasteTooltip: 'Clipboard မှ ကူးယူထည့်သွင်းမည်',
    clearKeyTooltip: 'Key ဖျက်ပစ်မည်',
    pasteBlockedAlert: '⚠️ Browser က direct paste လုပ်ခွင့် မပေးထားပါ။ Keyboard က Ctrl+V (သို့မဟုတ်) ဖုန်းတွင် Long Press လုပ်ပြီး Paste လုပ်ပေးပါ။',
    storageEncryptionNote: 'Web Crypto (AES-GCM) ဖြင့် စက်တွင်း၌ လုံခြုံစွာ Encrypt ပြုလုပ်ထားပါသည်။',
    
    // Gemini Guide Card
    geminiGuideTitle: 'Google Gemini Free API လမ်းညွှန်',
    geminiGuideText: 'Google AI Studio တွင် Create API key ဖြင့် Google အကောင့်ရှိရုံဖြင့် Free Gemini API Key ကို အလွယ်တကူ ရယူအသုံးပြုနိုင်ပါသည်။',
    geminiLinkText: 'Gemini Free API Key ယူရန်:',
    geminiQuotaTitle: '📊 Free Quota အသုံးပြုခွင့်',
    geminiQuotaText: 'ကိုယ်ပိုင် Gemini Key ထည့်သွင်းပါက မိမိ၏ သီးသန့် Quota ဖြင့် ပိုမိုမြန်ဆန်စွာ သုံးနိုင်မည်ဖြစ်ပါသည်။',
    
    // Groq Guide Card
    groqGuideTitle: 'Groq Cloud Free API လမ်းညွှန် (အခမဲ့ Key ယူနည်း)',
    groqGuideText: 'Groq သည် LPU Hardware ဖြင့် အလွန်လျင်မြန်သော Speed (~500+ tokens/sec) ပေးစွမ်းပြီး OpenAI GPT-OSS 120B (MoE) ကို အခမဲ့ စမ်းသပ်အသုံးပြုနိုင်ပါသည်။',
    groqLinkText: 'Groq Free API Key ယူရန် Link:',
    groqStepsTitle: '📝 အဆင့်ဆင့် ပြုလုပ်နည်း:',
    groqStep1: '၁။ Link သို့ သွား၍ Google / GitHub အကောင့်ဖြင့် အခမဲ့ Sign Up / Log In လုပ်ပါ။',
    groqStep2: '၂။ "Create API Key" ခလုတ်ကို နှိပ်ပြီး နာမည်တစ်ခု ပေးပါ။',
    groqStep3: '၃။ ထွက်ပေါ်လာသော gsk_... Key ကို ကူးယူပြီး အပေါ်ရှိ Groq API Key အကွက်တွင် ထည့်ပေးပါ။',
    
    // Permissions Tab Translations
    permissionsTitle: 'စက်တွင်းနှင့် စနစ်ခွင့်ပြုချက်များ',
    micTitle: 'မိုက်ခရိုဖုန်း အသံသွင်းခွင့်ပြုချက်',
    clipTitle: 'ကူးယူစာသား ဖတ်ရှုခွင့်ပြုချက်',
    triggerButtonText: 'ခွင့်ပြုချက် တောင်းခံမည်',
    faqTitle: '💡 Permission Modal အမြဲတမ်း ပေါ်မနေအောင် ဘယ်လိုလုပ်ရမလဲ?',
    faqDesc: 'Google AI Studio Preview (iframe) ၏ လုံခြုံရေးမူဝါဒအရ page load လုပ်တိုင်း သို့မဟုတ် reload လုပ်တိုင်း Microphone နှင့် Clipboard သုံးစွဲခွင့်ကို အတည်ပြုရန် ခွင့်ပြုချက်တောင်းခံလွှာ ထပ်ကာထပ်ကာ တောင်းလေ့ရှိသည်။',
    solutionsTitle: 'ဖြေရှင်းနည်းများ:',
    solution1: '၁။ Open in New Tab (ညာဘက်အပေါ်ထောင့်ရှိ Browser icon သို့မဟုတ် tab အသစ်) ဖြင့် ဖွင့်သုံးပါ။ (ဤသို့သုံးစွဲပါက ၎င်း modal ပေါ်တော့မည်မဟုတ်ဘဲ browser ၏ ပုံမှန်ခွင့်ပြုချက်ဖြင့် အလုပ်လုပ်မည်ဖြစ်သည်)',
    solution2: '၂။ Browser ၏ URL bar ဘယ်ဘက်ခြမ်းရှိ 🔒 (Lock key / settings) ကိုနှိပ်ပြီး Microphone နှင့် Clipboard ကို Allow (အမြဲတမ်းခွင့်ပြုသည်) ဟု သတ်မှတ်ပေးထားပါ။',
    
    // Chat & Empty State Translations
    readyHeading: 'ဘာသာပြန်ရာတွင် မည်သို့ ကူညီပေးရမလဲ?',
    readySubheading: 'အင်္ဂလိပ် နှင့် မြန်မာ နှစ်ဘာသာကို အထူးတိကျစွာ ဘာသာပြန်ပေးပါသည်။ စတင်ရန် အောက်တွင် စာရိုက်ထည့်ပါ။',
    tapToAsk: 'ခွင့်ပြုချက် တောင်းမည်',
    you: 'သင်',
    pasteTooltipMain: 'Clipboard မှ ကူးထည့်မည်',
    voiceTooltip: 'အသံဖြင့် စာရိုက်မည်',
    copyTooltip: 'စာသားကူးယူမည်',
    deleteChatTooltip: 'စကားပြောမှတ်တမ်း ဖျက်မည်',
    geminiModelLabel: 'Gemini AI Model (ဗားရှင်း)',
    groqModelLabel: 'Groq AI Model (ဗားရှင်း)',
    defaultBadge: 'မူရင်း',
    fastLpuBadge: 'အမြန် LPU',
    applyChangesTitle: 'ပြင်ဆင်မှုများ သိမ်းဆည်းမည်လား?',
    applyChangesDesc: 'သင်ပြင်ဆင်ထားသော ဆက်တင်အသစ်များကို သိမ်းဆည်းအသုံးပြုလိုပါသလား?',
    soundOn: 'ဖွင့်ထားသည်',
    soundOff: 'ပိတ်ထားသည်',
    historyTab: 'မှတ်တမ်း',
    favoritesTab: 'အကြိုက်ဆုံး',
    emptyHistory: 'ရှာဖွေမှုနှင့် ကိုက်ညီသော မှတ်တမ်း မရှိပါ။',
    emptyFavorites: 'အကြိုက်ဆုံး စကားပြောခန်း မရှိသေးပါ။ ကြယ်ပွင့်ပုံစံကို နှိပ်ပြီး သိမ်းဆည်းနိုင်ပါသည်။',
    addFavorite: 'အကြိုက်ဆုံးထဲ ထည့်မည်',
    removeFavorite: 'အကြိုက်ဆုံးမှ ဖယ်ရှားမည်',
    msgsCount: (n: number) => `စာ ${n} ကြောင်း`,
    replaceKey: 'အသစ်လဲမည်',
    keepExistingKey: 'မူလ Key ပြန်ထားမည်',
    lockedKeyNote: 'လုံခြုံရေးအရ သိမ်းပြီးသော Key ကို ပြန်ကြည့်၍ မရပါ (နောက်ဆုံး ၄ လုံးသာ ပြသမည်)။',
    swapDirection: 'ဘာသာစကား ဦးတည်ချက် ပြောင်းမည်',
    autoDirectionHint: 'English ↔ Myanmar အလိုအလျောက် စစ်ဆေးပေးသည်',
    appUpdatesTitle: 'Android App နှင့် GitHub Update စနစ်',
    currentVersionLabel: 'လက်ရှိ App ဗားရှင်း',
    githubRepoLabel: 'GitHub Repository (owner/repo)',
    githubRepoHint: 'သင် GitHub Repo သို့ Code အသစ် Push တင်ပြီး Release ထုတ်တိုင်း App ထဲတွင် အလိုအလျောက် စစ်ဆေးပြသပေးပါမည်။',
    checkForUpdates: 'Update အသစ် စစ်ဆေးမည်',
    checkingUpdates: 'GitHub တွင် စစ်ဆေးနေသည်...',
    upToDateMsg: (ver: string) => `နောက်ဆုံးထွက် ဗားရှင်း (v${ver}) ကို အသုံးပြုနေပါသည်။`,
    noReleasesMsg: 'ဤ Repository တွင် Release အသစ် မထုတ်ရသေးပါ။',
    updateCheckFailed: (err: string) => `Update စစ်ဆေး၍ မရပါ (${err})။`,
    updateAvailableBanner: (ver: string) => `Update အသစ်ရှိသည်: v${ver}`,
    installAndroidApp: 'ဖုန်းတွင် App အဖြစ် Install လုပ်မည်',
    installPwaDesc: 'ME Translator ကို ဖုန်း Home Screen ပေါ်တွင် App အဖြစ် Install လုပ်၍ အသုံးပြုနိုင်ပါသည်။',
    iosInstallTitle: 'iPhone / iPad တွင် Install လုပ်နည်း',
    iosInstallSteps: '၁။ Safari ရှိ Share ခလုတ်ကို နှိပ်ပါ။\n၂။ အောက်သို့ဆွဲပြီး "Add to Home Screen" ကို ရွေးပါ။',
    offlineBanner: 'အင်တာနက် ချိတ်ဆက်မှု မရှိပါ — မှတ်တမ်းဟောင်းများကို ဆက်လက်ကြည့်ရှုနိုင်ပါသည်။',
    saveRepoBtn: 'Repo သိမ်းမည်',
    repoSavedMsg: 'Repository သိမ်းဆည်းပြီးပါပြီ။',
    exportZipTitle: 'GitHub & Android APK Project ZIP',
    exportZipDesc: 'Cue AI Agent သို့မဟုတ် Git ဖြင့် GitHub သို့ တင်နိုင်ရန် API Key / Secret များ မပါဝင်သော Project Code ZIP ဖိုင်ကို တိုက်ရိုက် Download ဆွဲယူနိုင်ပါသည်။',
    exportZipBtn: 'GitHub / APK Project ZIP Download ဆွဲမည်'
  }
}

const Translator = () => {
  const [input, setInput] = useState('')
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: 'initial', title: 'New Chat', messages: [], timestamp: new Date(), isFavorite: false }
  ])
  const [activeSessionId, setActiveSessionId] = useState('initial')
  const [sidebarTab, setSidebarTab] = useState<'history' | 'favorites'>('history')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [loadingSessionIds, setLoadingSessionIds] = useState<Set<string>>(new Set())
  const [sourceLang, setSourceLang] = useState('English')
  const [targetLang, setTargetLang] = useState('Myanmar')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = useState(false)
  const [isMissingKeyWarningOpen, setIsMissingKeyWarningOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(new Set())
  const [theme, setTheme] = useState<Theme>('default')
  const [fontStyle, setFontStyle] = useState<FontStyle>('sans')
  const [myanmarFont, setMyanmarFont] = useState<MyanmarFontStyle>('serif-elegant')
  const [appLang, setAppLang] = useState<AppLang>('my')
  const [animation, setAnimation] = useState<AnimationType>('typing')
  const [soundType, setSoundType] = useState<SoundType>('Typing_1')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini')
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash')
  const [groqModel, setGroqModel] = useState('openai/gpt-oss-120b')
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [groqApiKey, setGroqApiKey] = useState('')

  const t = TRANSLATIONS[appLang]

  const updateStaged = (key: string, value: any) => {
    setStagedSettings(prev => ({ ...prev, [key]: value }))
  }

  // Isolated Tab Save: 1. Appearance & Fonts & App Language (Never blocked by API keys)
  const applyAppearanceSettings = () => {
    setTheme(stagedSettings.theme)
    setFontStyle(stagedSettings.fontStyle)
    setMyanmarFont(stagedSettings.myanmarFont)
    setAppLang(stagedSettings.appLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('me_translator_theme', stagedSettings.theme)
      localStorage.setItem('me_translator_font_style', stagedSettings.fontStyle)
      localStorage.setItem('me_translator_myanmar_font', stagedSettings.myanmarFont)
      localStorage.setItem('me_translator_app_language', stagedSettings.appLang)
    }
    setIsSettingsOpen(false)
  }

  // Isolated Tab Save: 2. Audio & Effects (Never blocked by API keys)
  const applyAudioSettings = () => {
    setAnimation(stagedSettings.animation)
    setSoundType(stagedSettings.soundType)
    setSoundEnabled(stagedSettings.soundEnabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('me_translator_animation', stagedSettings.animation)
      localStorage.setItem('me_translator_sound_type', stagedSettings.soundType)
      localStorage.setItem('me_translator_sound_enabled', String(stagedSettings.soundEnabled))
    }
    setIsSettingsOpen(false)
  }

  // Isolated Tab Save: 3. API Configuration (Strictly enforces API key for active provider)
  const applyApiSettings = async () => {
    const effectiveGeminiKey = stagedSettings.geminiApiKey.trim()
      ? stagedSettings.geminiApiKey.trim()
      : (stagedSettings.geminiKeyCleared ? '' : geminiApiKey.trim())

    const effectiveGroqKey = stagedSettings.groqApiKey.trim()
      ? stagedSettings.groqApiKey.trim()
      : (stagedSettings.groqKeyCleared ? '' : groqApiKey.trim())

    const hasActiveKey = stagedSettings.aiProvider === 'gemini'
      ? !!effectiveGeminiKey
      : !!effectiveGroqKey

    if (!hasActiveKey) {
      setIsMissingKeyWarningOpen(true)
      return
    }

    setAiProvider(stagedSettings.aiProvider)
    setGeminiModel(stagedSettings.geminiModel)
    setGroqModel(stagedSettings.groqModel)
    setGeminiApiKey(effectiveGeminiKey)
    setGroqApiKey(effectiveGroqKey)

    if (typeof window !== 'undefined') {
      localStorage.setItem('me_translator_ai_provider', stagedSettings.aiProvider)
      localStorage.setItem('me_translator_gemini_model', stagedSettings.geminiModel)
      localStorage.setItem('me_translator_groq_model', stagedSettings.groqModel)

      if (effectiveGeminiKey) {
        if (stagedSettings.geminiApiKey.trim()) {
          const enc = await encryptSensitiveData(effectiveGeminiKey)
          if (enc) {
            localStorage.setItem('me_translator_e2e_gemini_key', JSON.stringify(enc))
          }
        }
      } else {
        localStorage.removeItem('me_translator_e2e_gemini_key')
        localStorage.removeItem('me_translator_user_api_key')
      }

      if (effectiveGroqKey) {
        if (stagedSettings.groqApiKey.trim()) {
          const enc = await encryptSensitiveData(effectiveGroqKey)
          if (enc) {
            localStorage.setItem('me_translator_e2e_groq_key', JSON.stringify(enc))
          }
        }
      } else {
        localStorage.removeItem('me_translator_e2e_groq_key')
      }
    }

    setIsReplacingGeminiKey(false)
    setIsReplacingGroqKey(false)
    setIsSettingsOpen(false)
  }

  const applyStagedSettings = async () => {
    applyAppearanceSettings()
    applyAudioSettings()
    await applyApiSettings()
  }

  const [stagedSettings, setStagedSettings] = useState({
    theme: 'default' as Theme,
    fontStyle: 'sans' as FontStyle,
    myanmarFont: 'serif-elegant' as MyanmarFontStyle,
    appLang: 'my' as AppLang,
    animation: 'typing' as AnimationType,
    soundType: 'Typing_1' as SoundType,
    soundEnabled: true,
    aiProvider: 'gemini' as AIProvider,
    geminiModel: 'gemini-3.8-flash',
    groqModel: 'openai/gpt-oss-120b',
    geminiApiKey: '',
    groqApiKey: '',
    geminiKeyCleared: false,
    groqKeyCleared: false,
  })
  const tSettings = TRANSLATIONS[stagedSettings.appLang]
  const [isReplacingGeminiKey, setIsReplacingGeminiKey] = useState(false)
  const [isReplacingGroqKey, setIsReplacingGroqKey] = useState(false)
  const [pasteError, setPasteError] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  
  const [activeSettingsTab, setActiveSettingsTab] = useState<'appearance' | 'audio' | 'api' | 'permissions' | 'updates'>('appearance')
  const [activeDropdown, setActiveDropdown] = useState<'animation' | 'sound' | 'theme' | 'font' | 'mm-font' | 'model' | null>(null)
  
  const { isInstallable, isInstalled, isIOS, install: triggerPwaInstall } = usePWAInstall()
  const isOnline = useOnlineStatus()
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [updateStatusMsg, setUpdateStatusMsg] = useState<string | null>(null)
  const [githubRepoInput, setGithubRepoInput] = useState('')
  const [showIosInstallGuide, setShowIosInstallGuide] = useState(false)

  const [micPermission, setMicPermission] = useState<PermissionState | 'unknown'>('unknown')
  const [clipboardPermission, setClipboardPermission] = useState<PermissionState | 'unknown'>('unknown')

  const checkPermissions = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    try {
      const mic = await navigator.permissions.query({ name: 'microphone' as any })
      setMicPermission(mic.state)
      mic.onchange = () => setMicPermission(mic.state)
    } catch (e) {
      console.warn('Microphone permission query not supported', e)
    }
    try {
      const clip = await navigator.permissions.query({ name: 'clipboard-read' as any })
      setClipboardPermission(clip.state)
      clip.onchange = () => setClipboardPermission(clip.state)
    } catch (e) {
      console.warn('Clipboard permission query not supported', e)
    }
  }, [])

  useEffect(() => {
    checkPermissions()
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', checkPermissions)
      return () => window.removeEventListener('focus', checkPermissions)
    }
  }, [checkPermissions])

  // Auto-dismiss micError after 8 seconds
  useEffect(() => {
    if (!micError) return
    const timer = setTimeout(() => setMicError(null), 8000)
    return () => clearTimeout(timer)
  }, [micError])

  // Stop speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const recognitionRef = useRef<any>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0]
  const messages = activeSession.messages

  // Mark messages as completed when switching sessions to prevent re-typing
  useEffect(() => {
    const session = sessions.find(s => s.id === activeSessionId)
    if (session) {
      setCompletedMessages(prev => {
        const next = new Set(prev)
        session.messages.forEach(m => {
          if (m.role === 'assistant') next.add(m.id)
        })
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const scrollToBottomQuick = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loadingSessionIds, scrollToBottom, activeSessionId])

  useEffect(() => {
    if (isSettingsOpen) {
      setIsReplacingGeminiKey(false)
      setIsReplacingGroqKey(false)
      setStagedSettings({
        theme,
        fontStyle,
        myanmarFont,
        appLang,
        animation,
        soundType,
        soundEnabled,
        aiProvider,
        geminiModel,
        groqModel,
        geminiApiKey: '',
        groqApiKey: '',
        geminiKeyCleared: false,
        groqKeyCleared: false,
      })
    }
  }, [isSettingsOpen, theme, fontStyle, myanmarFont, appLang, animation, soundType, soundEnabled, aiProvider, geminiModel, groqModel])

  // Load initial state from localStorage
  useEffect(() => {
    setMounted(true)
    const savedSessions = localStorage.getItem('me_translator_sessions')
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions)
        // Convert string timestamps back to Date objects
        const formatted = parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }))
        if (formatted.length > 0) {
          setSessions(formatted)
          
          // Mark all loaded assistant messages as completed to prevent re-typing on load
          const completed = new Set<string>()
          formatted.forEach((s: any) => {
            s.messages.forEach((m: any) => {
              if (m.role === 'assistant') completed.add(m.id)
            })
          })
          setCompletedMessages(completed)
        }
      } catch (e) {
        console.error('Failed to load sessions', e)
      }
    }

    const savedActiveId = localStorage.getItem('me_translator_active_id')
    if (savedActiveId) setActiveSessionId(savedActiveId)

    const savedTheme = localStorage.getItem('me_translator_theme')
    if (savedTheme) setTheme(savedTheme as Theme)

    const savedFontStyle = localStorage.getItem('me_translator_font_style')
    if (savedFontStyle) {
      if (savedFontStyle === 'noto-myanmar') {
        setFontStyle('sans')
        setMyanmarFont('serif-elegant')
      } else {
        setFontStyle(savedFontStyle as FontStyle)
      }
    }

    const savedMyanmarFont = localStorage.getItem('me_translator_myanmar_font')
    if (savedMyanmarFont) {
      const valid = MYANMAR_FONT_OPTIONS.some(f => f.id === savedMyanmarFont)
      setMyanmarFont(valid ? (savedMyanmarFont as MyanmarFontStyle) : 'serif-elegant')
    }

    const savedAppLang = localStorage.getItem('me_translator_app_language')
    if (savedAppLang === 'en' || savedAppLang === 'my') {
      setAppLang(savedAppLang)
    }

    const savedAnimation = localStorage.getItem('me_translator_animation')
    if (savedAnimation) setAnimation(savedAnimation as AnimationType)

    const savedSoundType = localStorage.getItem('me_translator_sound_type')
    if (savedSoundType) setSoundType(savedSoundType as SoundType)

    const savedSoundEnabled = localStorage.getItem('me_translator_sound_enabled')
    if (savedSoundEnabled !== null) setSoundEnabled(savedSoundEnabled === 'true')

    const savedSourceLang = localStorage.getItem('me_translator_source_lang')
    if (savedSourceLang) setSourceLang(savedSourceLang)

    const savedTargetLang = localStorage.getItem('me_translator_target_lang')
    if (savedTargetLang) setTargetLang(savedTargetLang)

    const savedProvider = localStorage.getItem('me_translator_ai_provider') as AIProvider | null
    if (savedProvider === 'gemini' || savedProvider === 'groq') {
      setAiProvider(savedProvider)
    }

    const savedGeminiModel = localStorage.getItem('me_translator_gemini_model')
    if (savedGeminiModel) setGeminiModel(savedGeminiModel)

    const savedGroqModel = localStorage.getItem('me_translator_groq_model')
    if (savedGroqModel) setGroqModel(savedGroqModel)

    // Transparent Web Crypto End-to-End Decryption
    ;(async () => {
      // 1. Gemini Key (from encrypted payload or legacy migration)
      const storedGeminiEnc = localStorage.getItem('me_translator_e2e_gemini_key')
      if (storedGeminiEnc) {
        try {
          const parsed = JSON.parse(storedGeminiEnc)
          const dec = await decryptSensitiveData(parsed)
          if (dec) setGeminiApiKey(dec)
        } catch {
          setGeminiApiKey(storedGeminiEnc)
        }
      } else {
        const oldKey = localStorage.getItem('me_translator_user_api_key')
        if (oldKey) {
          setGeminiApiKey(oldKey)
          encryptSensitiveData(oldKey).then((enc) => {
            if (enc) localStorage.setItem('me_translator_e2e_gemini_key', JSON.stringify(enc))
            localStorage.removeItem('me_translator_user_api_key')
            localStorage.removeItem('me_translator_user_password')
          })
        }
      }

      // 2. Groq Key (from encrypted payload)
      const storedGroqEnc = localStorage.getItem('me_translator_e2e_groq_key')
      if (storedGroqEnc) {
        try {
          const parsed = JSON.parse(storedGroqEnc)
          const dec = await decryptSensitiveData(parsed)
          if (dec) setGroqApiKey(dec)
        } catch {
          setGroqApiKey(storedGroqEnc)
        }
      }
    })()

    // Check GitHub Releases automatically on launch for in-app updates
    const configuredRepo = getConfiguredGithubRepo()
    setGithubRepoInput(configuredRepo)
    const updateTimer = setTimeout(async () => {
      const info = await checkForGitHubUpdate(configuredRepo)
      setUpdateInfo(info)
      if (info.hasUpdate) {
        const skipped = getSkippedUpdateVersion()
        if (skipped !== info.latestVersion) {
          setIsUpdateDialogOpen(true)
        }
      }
    }, 1200)

    return () => clearTimeout(updateTimer)
  }, [])

  // Save state to localStorage (strip transient pending message placeholders)
  useEffect(() => {
    const cleanSessions = sessions.map(s => ({
      ...s,
      messages: s.messages.filter(m => !m.isPending),
    }))
    localStorage.setItem('me_translator_sessions', JSON.stringify(cleanSessions))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem('me_translator_active_id', activeSessionId)
  }, [activeSessionId])

  useEffect(() => {
    localStorage.setItem('me_translator_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('me_translator_font_style', fontStyle)
  }, [fontStyle])

  useEffect(() => {
    localStorage.setItem('me_translator_animation', animation)
  }, [animation])

  useEffect(() => {
    localStorage.setItem('me_translator_sound_type', soundType)
  }, [soundType])

  useEffect(() => {
    localStorage.setItem('me_translator_sound_enabled', String(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem('me_translator_source_lang', sourceLang)
  }, [sourceLang])

  useEffect(() => {
    localStorage.setItem('me_translator_target_lang', targetLang)
  }, [targetLang])

  const playTypingSound = useCallback((type: SoundType = soundType) => {
    if (!soundEnabled) return
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    if (type === 'Typing_1') {
      // Realistic mechanical typing sound (current)
      const bufferSize = ctx.sampleRate * 0.05
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1000 + Math.random() * 500
      filter.Q.value = 2

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      noise.start()
    } else if (type === 'Typing_2') {
      // Simple typewriter click
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'square'
      osc.frequency.setValueAtTime(150 + Math.random() * 50, ctx.currentTime)
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.03)
    }
  }, [soundEnabled, soundType])

  const startListening = async () => {
    setMicError(null)

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
      }
      setIsListening(false)
      return
    }

    const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser. Please use Google Chrome or a Chromium-based browser.")
      return
    }

    // Proactively request microphone access via getUserMedia first.
    // In Chromium and sandboxed iframes, calling SpeechRecognition.start() without
    // prior getUserMedia permission triggers an immediate 'not-allowed' error.
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Immediately stop all tracks so the audio hardware is freed for SpeechRecognition
        stream.getTracks().forEach(track => track.stop())
        setMicPermission('granted')
      } catch (err: any) {
        console.warn("Microphone access permission not granted:", err?.name || err)
        setMicPermission('denied')
        setMicError("Microphone access was denied. Please allow microphone permissions in your browser or open the app in a new tab.")
        setIsListening(false)
        return
      }
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = sourceLang === 'English' ? 'en-US' : 'my-MM'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setMicError(null)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        if (transcript) {
          setInput(prev => prev + (prev ? ' ' : '') + transcript)
          if (textareaRef.current) {
            textareaRef.current.focus()
            const inputEvent = new Event('input', { bubbles: true })
            textareaRef.current.dispatchEvent(inputEvent)
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error)
        setIsListening(false)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermission('denied')
          setMicError("Microphone access was blocked. Click Settings > Permissions or tap the lock icon in your address bar to allow microphone.")
        } else if (event.error === 'no-speech') {
          // Harmless timeout when user did not speak
        } else if (event.error !== 'aborted') {
          setMicError(`Voice input issue (${event.error}). Please try again.`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
      }

      recognition.start()
    } catch (err) {
      console.warn("Speech recognition initialization notice:", err)
      setIsListening(false)
      setMicError("Unable to start voice input. Please ensure microphone access is permitted.")
    }
  }

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const targetSessionId = activeSessionId
    if (!input.trim()) return

    const currentInput = input
    const containsBurmese = /[\u1000-\u109F\uAA60-\uAA7F]/.test(currentInput)
    const msgSourceLang = containsBurmese ? 'Myanmar' : 'English'
    const msgTargetLang = containsBurmese ? 'English' : 'Myanmar'

    const uniqueToken = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const userMsgId = `user-${uniqueToken}`
    const pendingAssistantId = `assistant-${uniqueToken}`

    const activeProvider = aiProvider
    const activeKey = activeProvider === 'groq' ? groqApiKey : geminiApiKey
    const activeModel = activeProvider === 'groq' ? groqModel : geminiModel

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
      sourceLang: msgSourceLang,
      targetLang: msgTargetLang
    }

    const pendingAssistantMessage: Message = {
      id: pendingAssistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      sourceLang: msgSourceLang,
      targetLang: msgTargetLang,
      provider: activeProvider,
      model: activeModel,
      isPending: true,
    }

    const updateSessionMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          const updatedMessages = typeof newMessages === 'function' ? newMessages(s.messages) : newMessages
          
          // Update title based on first user message if it's still "New Chat"
          let newTitle = s.title
          if (s.title === 'New Chat' && updatedMessages.length > 0) {
            const firstUserMsg = updatedMessages.find(m => m.role === 'user')
            if (firstUserMsg) {
              newTitle = firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
            }
          }

          return { ...s, messages: updatedMessages, title: newTitle }
        }
        return s
      }))
    }

    updateSessionMessages(prev => [...prev, userMessage, pendingAssistantMessage])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setLoadingSessionIds(prev => {
      const next = new Set(prev)
      next.add(targetSessionId)
      return next
    })

    const MAX_RETRIES = 2
    let retryCount = 0

    const translateDirectFromClient = async (): Promise<{ text?: string; error?: string; rawDetails?: string; status?: number; code?: string }> => {
      const trimmedKey = activeKey.trim()
      if (!trimmedKey) {
        return {
          error: 'api_key_missing',
          rawDetails: appLang === 'en'
            ? 'Please enter your Gemini or Groq API Key in Settings > API to translate inside the Android app.'
            : 'Android App ထဲမှ ဘာသာပြန်နိုင်ရန် Settings > API တွင် သင်၏ Gemini သို့မဟုတ် Groq API Key ထည့်သွင်းပေးပါ။',
          status: 401,
        }
      }

      if (activeProvider === 'groq') {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${trimmedKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: activeModel || 'openai/gpt-oss-120b',
            messages: [
              {
                role: 'system',
                content: `You are a master professional translator specializing in ${msgSourceLang} and ${msgTargetLang}. Provide accurate, natural-sounding, and culturally appropriate translations. If the input is English, translate to Myanmar. If the input is Myanmar, translate to English. Ensure the Myanmar translation uses standard, polite, modern Burmese writing. Output ONLY the translated text, with no introductory remarks, quotes, or explanations.`,
              },
              {
                role: 'user',
                content: `Translate the following text from ${msgSourceLang} to ${msgTargetLang}:\n\n${currentInput}`,
              },
            ],
            temperature: 0.2,
          }),
        })
        const groqData = await groqRes.json().catch(() => ({}))
        if (!groqRes.ok) {
          const msg = groqData?.error?.message || `Groq API error ${groqRes.status}`
          return { error: String(msg).toLowerCase(), rawDetails: String(msg), status: groqRes.status }
        }
        const out = groqData?.choices?.[0]?.message?.content?.trim()
        return out ? { text: out } : { error: 'empty_response', rawDetails: 'Empty response from Groq', status: 502 }
      }

      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(activeModel || 'gemini-3.8-flash')}:generateContent?key=${encodeURIComponent(trimmedKey)}`
      const geminiRes = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `You are a professional translator specializing in ${msgSourceLang} and ${msgTargetLang}. Provide accurate, natural-sounding translations. If the input is English, translate to Myanmar. If the input is Myanmar, translate to English. Ensure the Myanmar translation uses standard, polite language.`
            }]
          },
          contents: [{
            role: 'user',
            parts: [{
              text: `Translate the following text from ${msgSourceLang} to ${msgTargetLang}. Only provide the translation, no extra explanations.\n\nText: ${currentInput}`
            }]
          }]
        })
      })
      const geminiData = await geminiRes.json().catch(() => ({}))
      if (!geminiRes.ok) {
        const msg = geminiData?.error?.message || `Gemini API error ${geminiRes.status}`
        return { error: String(msg).toLowerCase(), rawDetails: String(msg), status: geminiRes.status }
      }
      const out = geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('').trim()
      return out ? { text: out } : { error: 'empty_response', rawDetails: 'Empty response from Gemini', status: 502 }
    }

    const performTranslation = async (): Promise<{ text?: string; error?: string; rawDetails?: string; status?: number; code?: string }> => {
      try {
        if (isRunningInsideCapacitor()) {
          const directRes = await translateDirectFromClient()
          const isRateLimit = directRes.status === 429
          if (isRateLimit && retryCount < MAX_RETRIES) {
            retryCount++
            const delay = Math.pow(2, retryCount) * 800 + Math.random() * 500
            await new Promise(resolve => setTimeout(resolve, delay))
            return performTranslation()
          }
          return directRes
        }

        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: currentInput,
            sourceLang: msgSourceLang,
            targetLang: msgTargetLang,
            apiKey: activeKey.trim() || undefined,
            provider: activeProvider,
            model: activeModel,
          }),
        })

        // Fallback to direct client call if running from static export without /api/translate
        if (res.status === 404) {
          return translateDirectFromClient()
        }

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          const rawMsg = String(data?.error || data?.message || `HTTP ${res.status} Error`)
          const errCode = String(data?.code || '')
          const detailsStr = typeof data?.details === 'string'
            ? data.details
            : data?.details?.message
              ? String(data.details.message)
              : rawMsg

          const isRateLimit = res.status === 429 || rawMsg.toLowerCase().includes('rate_limit') || rawMsg.toLowerCase().includes('resource_exhausted')
          if (isRateLimit && retryCount < MAX_RETRIES) {
            retryCount++
            const delay = Math.pow(2, retryCount) * 800 + Math.random() * 500
            await new Promise(resolve => setTimeout(resolve, delay))
            return performTranslation()
          }

          return {
            error: rawMsg.toLowerCase(),
            rawDetails: detailsStr,
            status: res.status,
            code: errCode
          }
        }

        if (!data.text) {
          return { error: "empty_response", rawDetails: "Model returned an empty translation response.", status: 502 }
        }
        return { text: data.text }
      } catch (error: any) {
        const errorStr = String(error?.message || error || 'Network connection error')
        return { error: errorStr.toLowerCase(), rawDetails: errorStr }
      }
    }

    try {
      const result = await performTranslation()

      if (result.error) {
        const isUsingCustomKey = !!activeKey.trim()
        const providerName = activeProvider === 'groq' ? 'Groq Cloud' : 'Google Gemini'
        const errorStr = result.error
        const statusCode = result.status || 0
        const rawDetails = result.rawDetails || result.error
        const isEn = appLang === 'en'

        const isQuotaError = statusCode === 429 || errorStr.includes("429") || errorStr.includes("resource_exhausted") || errorStr.includes("quota") || errorStr.includes("rate_limit") || errorStr.includes("limit")
        const isAuthError = statusCode === 401 || statusCode === 403 || errorStr.includes("401") || errorStr.includes("403") || errorStr.includes("api_key_invalid") || errorStr.includes("invalid_api_key") || errorStr.includes("invalid api key") || errorStr.includes("unauthorized") || errorStr.includes("api_key_missing") || errorStr.includes("groq_key_missing")
        const isModelError = statusCode === 404 || errorStr.includes("decommissioned") || errorStr.includes("model_not_found") || errorStr.includes("does not exist") || errorStr.includes("not found")
        const isContextError = statusCode === 413 || errorStr.includes("too large") || errorStr.includes("context_length") || errorStr.includes("max_tokens") || errorStr.includes("token")

        let errorMessage = ''

        if (isQuotaError) {
          if (isUsingCustomKey) {
            errorMessage = isEn
              ? `⚠️ **Quota / Rate Limit Exceeded (${providerName})**\n\nYour custom ${providerName} API Key has reached its request or token limit.\n\n**What you can do:** Wait a few moments before retrying, or switch to another API Key or Model in Settings > API.\n\n\`[Provider Error]: ${rawDetails}\``
              : `⚠️ **API Quota / Rate Limit ပြည့်သွားပါပြီ (${providerName})**\n\nသင်ထည့်သွင်းထားသော ${providerName} API Key ၏ အသုံးပြုခွင့် (Limit) ပြည့်သွားပါပြီ။\n\n**ဖြေရှင်းနည်း:** ခဏစောင့်ဆိုင်းပြီး ပြန်လည်သုံးစွဲပါ (သို့မဟုတ်) Settings > API တွင် အခြား Key သို့မဟုတ် Model တစ်ခု ပြောင်းလဲအသုံးပြုပါ။\n\n\`[Provider Error Details]: ${rawDetails}\``
          } else {
            errorMessage = isEn
              ? `⚠️ **Shared Free Quota Exceeded (${providerName})**\n\nThe shared free quota is currently exhausted. Please enter your own ${providerName} API Key in Settings > API to continue translating.\n\n\`[Provider Error]: ${rawDetails}\``
              : `⚠️ **မျှဝေ Free Quota ပြည့်သွားပါပြီ (${providerName})**\n\nApp ၏ မျှဝေ Free Quota ပြည့်သွားပါပြီ။ ဆက်လက်အသုံးပြုနိုင်ရန် Settings > API တွင် သင်၏ ကိုယ်ပိုင် ${providerName} API Key ကို ထည့်သွင်းပေးပါ။\n\n\`[Provider Error Details]: ${rawDetails}\``
          }
        } else if (isAuthError) {
          errorMessage = isEn
            ? `⚠️ **Invalid or Missing API Key (${providerName})**\n\nYour ${providerName} API Key is missing, expired, or incorrect. Please double-check and update your key in Settings > API.\n\n\`[Provider Error]: ${rawDetails}\``
            : `⚠️ **API Key မှားယွင်းနေပါသည် သို့မဟုတ် မရှိသေးပါ (${providerName})**\n\nသင်၏ ${providerName} API Key သည် မှားယွင်းနေခြင်း (သို့မဟုတ်) သက်တမ်းကုန်နေခြင်း ဖြစ်နိုင်ပါသည်။ Settings > API တွင် Key ကို ပြန်လည်စစ်ဆေး ထည့်သွင်းပေးပါ။\n\n\`[Provider Error Details]: ${rawDetails}\``
        } else if (isModelError) {
          errorMessage = isEn
            ? `⚠️ **Model Unavailable or Decommissioned (${activeModel})**\n\nThis model is currently unavailable or unsupported on ${providerName}. Please select another model (e.g., OpenAI GPT-OSS 120B for Groq or Gemini 3.8 Flash) in Settings > API.\n\n\`[Provider Error]: ${rawDetails}\``
            : `⚠️ **Model အသုံးပြု၍မရနိုင်ပါ (${activeModel})**\n\nရွေးချယ်ထားသော AI Model သည် လက်ရှိတွင် ပိတ်သိမ်းထားခြင်း သို့မဟုတ် ${providerName} တွင် အသုံးပြုမရခြင်း ဖြစ်နိုင်ပါသည်။ Settings > API တွင် အခြား Model (ဥပမာ- Groq အတွက် OpenAI GPT-OSS 120B) သို့ ပြောင်းလဲရွေးချယ်ပေးပါ။\n\n\`[Provider Error Details]: ${rawDetails}\``
        } else if (isContextError) {
          errorMessage = isEn
            ? `⚠️ **Text Length Limit Exceeded (${providerName})**\n\nThe text you entered exceeds the maximum token limit for ${activeModel}. Please split your text into smaller parts and try again.\n\n\`[Provider Error]: ${rawDetails}\``
            : `⚠️ **စာသားပမာဏ သတ်မှတ်ချက်ထက် ကျော်လွန်နေပါသည် (${providerName})**\n\nရိုက်ထည့်ထားသော စာသားသည် ${activeModel} ၏ Token limit ထက် ကျော်လွန်နေပါသည်။ စာသားကို အပိုင်းခွဲ၍ ပြန်လည်ဘာသာပြန်ပေးပါ။\n\n\`[Provider Error Details]: ${rawDetails}\``
        } else {
          errorMessage = isEn
            ? `⚠️ **Translation Request Failed (${providerName})**\n\nAn error occurred while communicating with the AI provider. Please check your connection or API settings.\n\n\`[Provider Error]: ${rawDetails}\``
            : `⚠️ **ဘာသာပြန်ရာတွင် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည် (${providerName})**\n\nAI စနစ်နှင့် ချိတ်ဆက်ရာတွင် အခက်အခဲရှိနေပါသည်။ အင်တာနက်လိုင်း သို့မဟုတ် API Settings ကို စစ်ဆေးပြီး ထပ်မံကြိုးစားကြည့်ပါ။\n\n\`[Provider Error Details]: ${rawDetails}\``
        }

        updateSessionMessages(prev => prev.map(m =>
          m.id === pendingAssistantId
            ? { ...m, content: errorMessage, isPending: false, timestamp: new Date() }
            : m
        ))
        return;
      }

      const translation = result.text || ""
      updateSessionMessages(prev => prev.map(m =>
        m.id === pendingAssistantId
          ? { ...m, content: translation, isPending: false, timestamp: new Date() }
          : m
      ))
      
      // For non-typing animations, play a single sound at the start
      if (soundEnabled && animation !== 'typing' && animation !== 'typewriter') {
        playTypingSound()
      }
    } catch (error: any) {
      // This block should rarely be hit now as performTranslation returns errors
      console.warn("Outer translation error caught:", error)
      updateSessionMessages(prev => prev.filter(m => m.id !== pendingAssistantId))
    } finally {
      setLoadingSessionIds(prev => {
        const next = new Set(prev)
        // Check asynchronously in next tick via sessions or keep clean indicator
        next.delete(targetSessionId)
        return next
      })
    }
  }

  const toggleSessionFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
  }

  const createNewSession = () => {
    setSessions(prev => {
      // Check if there's already an empty session named "New Chat"
      const emptySession = prev.find(s => s.title === 'New Chat' && s.messages.length === 0)
      if (emptySession) {
        setActiveSessionId(emptySession.id)
        setIsSidebarOpen(false)
        return prev
      }

      const newId = `session-${Date.now()}`
      const newSession: ChatSession = { id: newId, title: 'New Chat', messages: [], timestamp: new Date(), isFavorite: false }
      setActiveSessionId(newId)
      setIsSidebarOpen(false)
      return [newSession, ...prev]
    })
  }

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== id)
      
      if (newSessions.length === 0) {
        const newId = `session-${Date.now()}`
        const defaultSession: ChatSession = { id: newId, title: 'New Chat', messages: [], timestamp: new Date(), isFavorite: false }
        setTimeout(() => setActiveSessionId(newId), 0)
        return [defaultSession]
      }
      
      if (activeSessionId === id) {
        // Find the next session to activate
        const currentIndex = prev.findIndex(s => s.id === id)
        const nextSession = newSessions[currentIndex] || newSessions[currentIndex - 1] || newSessions[0]
        setTimeout(() => setActiveSessionId(nextSession.id), 0)
      }
      
      return newSessions
    })
  }

  const clearChat = () => {
    const newId = `session-${Date.now()}`
    const defaultSession: ChatSession = { id: newId, title: 'New Chat', messages: [], timestamp: new Date(), isFavorite: false }
    setSessions([defaultSession])
    setActiveSessionId(newId)
    setHistorySearchQuery('')
    setIsConfirmOpen(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTranslate()
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-[#212121]" />
  }

  const isCyber = theme === 'cyberpunk'
  const isGlass = theme === 'glass-modern'
  const isBrutal = theme === 'brutalist'
  const currentTheme = THEME_CONFIG[theme]
  const currentFont = ENGLISH_FONT_OPTIONS.find(f => f.id === fontStyle) || ENGLISH_FONT_OPTIONS[0]
  const currentMyanmarFont = MYANMAR_FONT_OPTIONS.find(f => f.id === myanmarFont) || MYANMAR_FONT_OPTIONS[0]

  const getAnimationVariants = (type: AnimationType) => {
    const transitions: Record<string, any> = {
      bounce: { type: 'spring' as const, stiffness: 300, damping: 10 },
      elastic: { type: 'spring' as const, stiffness: 200, damping: 10 },
      glitch: { duration: 0.2 }
    }

    switch (type) {
      case 'fade': return { initial: { opacity: 0 }, animate: { opacity: 1 } }
      case 'slide': return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
      case 'zoom': return { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } }
      case 'bounce': return { initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0, transition: transitions.bounce } }
      case 'flip': return { initial: { opacity: 0, rotateX: 90 }, animate: { opacity: 1, rotateX: 0 } }
      case 'rotate': return { initial: { opacity: 0, rotate: -180, scale: 0.5 }, animate: { opacity: 1, rotate: 0, scale: 1 } }
      case 'blur': return { initial: { opacity: 0, filter: 'blur(10px)' }, animate: { opacity: 1, filter: 'blur(0px)' } }
      case 'glitch': return { 
        initial: { opacity: 0, x: -10, skewX: 20 }, 
        animate: { 
          opacity: 1, 
          x: [0, -4, 4, -4, 4, 0],
          skewX: [0, -10, 10, -10, 10, 0],
          transition: {
            duration: 0.3,
            times: [0, 0.2, 0.4, 0.6, 0.8, 1]
          }
        } 
      }
      case 'elastic': return { initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1, transition: transitions.elastic } }
      case 'typing':
      case 'typewriter':
      default: return { initial: { opacity: 0 }, animate: { opacity: 1 } }
    }
  }

  const animations: AnimationType[] = ['typing', 'typewriter', 'fade', 'slide', 'zoom', 'bounce', 'flip', 'rotate', 'blur', 'glitch', 'elastic']
  const sounds: SoundType[] = ['Typing_1', 'Typing_2']

  return (
    <div className={cn(
      "flex flex-col h-screen transition-all duration-500 relative overflow-hidden font-sans",
      currentTheme.bg,
      currentTheme.text
    )}>
      {/* Cyberpunk Scanline & Grid Overlay */}
      {isCyber && (
        <>
          <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          <div className="absolute inset-0 pointer-events-none z-0 opacity-5 bg-[linear-gradient(to_right,#00f2ff_1px,transparent_1px),linear-gradient(to_bottom,#00f2ff_1px,transparent_1px)] bg-[size:40px_40px]" />
          <motion.div 
            animate={{ y: ["0%", "100%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-gradient-to-b from-transparent via-[#00f2ff] to-transparent h-20 w-full"
          />
        </>
      )}

      {/* Header */}
      <header className={cn(
        "flex items-center justify-between px-4 py-3 sticky top-0 z-30 backdrop-blur-md transition-all duration-500",
        currentTheme.header,
        "border-b",
        currentTheme.border,
        currentTheme.shadow
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={cn(
              "p-2 rounded-lg transition-all",
              isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-400 hover:bg-black/5"
            )}
          >
            <Menu className="w-5 h-5" />
          </button>
          <motion.div 
            animate={isCyber ? { opacity: [1, 0.8, 1, 0.9, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2"
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500",
              currentTheme.accent,
              currentTheme.shadow
            )}>
              <Languages className={cn("w-4 h-4", currentTheme.accentText)} />
            </div>
            <h1 className={cn(
              "font-bold tracking-widest uppercase transition-all duration-500",
              isCyber ? "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.8)] text-base md:text-lg" : (currentTheme.isDark ? "text-white" : "text-black"),
              "hidden sm:block"
            )}>
              ME <span className={isCyber ? "animate-pulse" : ""}>Translator</span>
            </h1>
          </motion.div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              const nextSrc = sourceLang === 'English' ? 'Myanmar' : 'English'
              const nextTgt = nextSrc === 'English' ? 'Myanmar' : 'English'
              setSourceLang(nextSrc)
              setTargetLang(nextTgt)
              if (typeof window !== 'undefined') {
                localStorage.setItem('me_translator_source_lang', nextSrc)
                localStorage.setItem('me_translator_target_lang', nextTgt)
              }
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-all border whitespace-nowrap shrink-0",
              isCyber
                ? "border-[#00f2ff]/40 text-[#00f2ff] hover:bg-[#00f2ff]/10"
                : currentTheme.isDark
                  ? "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                  : "border-black/10 bg-black/5 text-gray-800 hover:bg-black/10"
            )}
            title={t.swapDirection}
          >
            <span>{sourceLang === 'English' ? 'EN' : 'MM'}</span>
            <ArrowLeftRight className="w-3.5 h-3.5 opacity-80" />
            <span>{targetLang === 'English' ? 'EN' : 'MM'}</span>
          </button>

          <button
            type="button"
            onClick={(e) => toggleSessionFavorite(activeSession.id, e)}
            className={cn(
              "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all",
              activeSession.isFavorite
                ? (isCyber ? "text-amber-400 bg-amber-400/10" : "text-amber-500 hover:bg-amber-500/10")
                : (isCyber ? "text-[#00f2ff]/70 hover:bg-[#00f2ff]/10" : "text-gray-400 hover:bg-black/5")
            )}
            title={activeSession.isFavorite ? t.removeFavorite : t.addFavorite}
            aria-label={activeSession.isFavorite ? t.removeFavorite : t.addFavorite}
          >
            <Star className={cn("w-5 h-5", activeSession.isFavorite && "fill-current")} />
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all",
              isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-400 hover:bg-black/5"
            )}
            title={t.settings}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                isCyber ? "bg-black border-2 border-[#00f2ff] shadow-[0_0_30px_rgba(0,242,255,0.4)] animate-pulse" : (currentTheme.isDark ? "bg-emerald-500/10" : "bg-emerald-500/5")
              )}>
                <Languages className={cn("w-10 h-10", currentTheme.icon)} />
              </div>
              <h2 className={cn(
                "text-3xl font-bold transition-all duration-500 tracking-tighter",
                isCyber ? "text-[#00f2ff] drop-shadow-[0_0_15px_#00f2ff]" : (currentTheme.isDark ? "text-white" : "text-black")
              )}>
                {isCyber ? "TERMINAL_READY" : t.readyHeading}
              </h2>
              <p className={cn(
                "max-w-md transition-all duration-500",
                isCyber ? "text-[#00f2ff]/70 font-mono text-xs" : currentTheme.textMuted
              )}>
                {isCyber 
                  ? ">> SECURE_TRANSLATION_PROTOCOL_V2.0_ACTIVE\n>> WAITING_FOR_INPUT..." 
                  : t.readySubheading}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-xl">
                {[
                  "Hello, how are you today?",
                  "နေကောင်းလား?",
                  "What is the weather like?",
                  "ဒီနေ့ ရာသီဥတု ဘယ်လိုရှိလဲ?"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className={cn(
                      "p-3 sm:p-4 text-left text-xs sm:text-sm rounded-xl transition-all border",
                      isCyber 
                        ? "bg-black hover:bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff] hover:border-[#00f2ff]" 
                        : (currentTheme.isDark ? "bg-[#2f2f2f] hover:bg-[#383838] border-white/10 text-gray-300" : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700")
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 group",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 transition-all duration-500 hidden xs:flex",
                      currentTheme.accent,
                      currentTheme.shadow,
                      (animation === 'typing' && !completedMessages.has(msg.id)) ? "opacity-0 scale-0" : "opacity-100 scale-100"
                    )}>
                      <Languages className={cn("w-4 h-4 sm:w-5 sm:h-5", currentTheme.accentText)} />
                    </div>
                  )}
                  
                  <motion.div 
                    {...getAnimationVariants(msg.role === 'assistant' ? animation : 'slide')}
                    className={cn(
                      "max-w-[92%] sm:max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 relative border transition-all duration-500",
                      msg.role === 'user' 
                        ? (isCyber ? "bg-black/80 backdrop-blur-sm border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)] text-[#00f2ff]" : isGlass ? "bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-xl" : isBrutal ? "bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-black" : (currentTheme.isDark ? "bg-[#2f2f2f] text-white border-white/5" : "bg-white text-black border-gray-200 shadow-sm")) 
                        : (isCyber ? "bg-black/40 backdrop-blur-sm border-[#00f2ff]/30 text-[#00f2ff] shadow-[inset_0_0_10px_rgba(0,242,255,0.05)]" : isGlass ? "bg-white/5 backdrop-blur-md border-white/10 text-white/90" : isBrutal ? "bg-transparent border-transparent text-black" : (currentTheme.isDark ? "bg-transparent text-[#ececec] border-transparent" : "bg-transparent text-gray-800 border-transparent"))
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-xs font-black uppercase tracking-wider flex items-center gap-1.5",
                          isCyber 
                            ? "text-[#00f2ff] drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" 
                            : isGlass 
                              ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
                              : isBrutal 
                                ? "text-black border-b-2 border-black pb-0.5" 
                                : currentTheme.isDark 
                                  ? "text-white" 
                                  : "text-gray-900"
                        )}>
                          {msg.role === 'user' ? (
                            <>
                              <User className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{t.you}</span>
                            </>
                          ) : msg.provider === 'groq' ? (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span className="text-amber-400">Groq</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span className="text-emerald-400">Gemini</span>
                            </>
                          )}
                        </span>
                        <span className={cn(
                          "text-xs px-2.5 py-0.5 rounded-md font-black uppercase tracking-wider border transition-all duration-300",
                          isCyber 
                            ? "bg-[#00f2ff]/20 border-[#00f2ff]/50 text-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.15)]" 
                            : isGlass 
                              ? "bg-white/20 border-white/35 text-white shadow-sm" 
                              : isBrutal 
                                ? "bg-yellow-400 text-black border-2 border-black font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                : currentTheme.isDark 
                                  ? "bg-white/15 border-white/30 text-white font-extrabold shadow-sm" 
                                  : "bg-black/10 border-black/25 text-gray-950 font-extrabold shadow-sm"
                        )}>
                          {msg.sourceLang} → {msg.targetLang}
                        </span>
                      </div>
                      
                      {/* Copy button - Hidden while message is still pending */}
                      {!msg.isPending && (msg.role === 'user' || animation !== 'typing' || completedMessages.has(msg.id)) && (
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all flex items-center justify-center",
                            isCyber 
                              ? "text-[#00f2ff] bg-black border border-[#00f2ff] hover:shadow-[0_0_15px_#00f2ff] hover:bg-[#00f2ff] hover:text-black" 
                              : (currentTheme.isDark ? "text-gray-400 bg-white/5 hover:bg-white/10 border border-white/5" : "text-gray-500 bg-black/5 hover:bg-black/10 border border-black/5")
                          )}
                          title={t.copyTooltip}
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {msg.isPending ? (
                      <div className="space-y-2.5 min-w-[200px] sm:min-w-[260px] py-1">
                        <div className={cn("h-3.5 rounded w-28 animate-pulse", currentTheme.isDark ? "bg-white/15" : "bg-black/10")} />
                        <div className={cn("h-3.5 rounded w-56 sm:w-72 animate-pulse", currentTheme.isDark ? "bg-white/10" : "bg-black/10")} />
                        {isCyber && (
                          <div className="text-[10px] text-[#00f2ff] animate-pulse font-mono pt-1">
                            SYSTEM_PROCESSING_DATA...
                          </div>
                        )}
                      </div>
                    ) : (() => {
                      const isBurmeseOutput = (msg.role === 'assistant' && msg.targetLang === 'Myanmar') || /[\u1000-\u109F\uAA60-\uAA7F]/.test(msg.content);
                      return (
                        <div className={cn(
                          "prose prose-invert max-w-none text-base leading-relaxed",
                          isBurmeseOutput ? currentMyanmarFont.class : currentFont.class,
                          isCyber && "prose-p:text-[#00f2ff] prose-strong:text-[#00f2ff] prose-headings:text-[#00f2ff]",
                          isGlass && "prose-p:text-white prose-strong:text-white prose-headings:text-white",
                          isBrutal && "prose-p:text-black prose-strong:text-black prose-headings:text-black",
                          !currentTheme.isDark && !isBrutal && "prose-p:text-gray-800 prose-strong:text-black prose-headings:text-black"
                        )}>
                          {msg.role === 'assistant' && (animation === 'typing' || animation === 'typewriter') && !completedMessages.has(msg.id) ? (
                            <TypewriterText 
                              text={msg.content} 
                              onChar={() => { 
                                if (soundEnabled) playTypingSound()
                                scrollToBottomQuick()
                              }}
                              onComplete={() => {
                                setCompletedMessages(prev => new Set(prev).add(msg.id))
                                scrollToBottom()
                              }}
                            />
                          ) : (
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          )}
                        </div>
                      )
                    })()}
                  </motion.div>

                  {msg.role === 'user' && (
                    <div className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 transition-all duration-500 hidden xs:flex",
                      isCyber ? "bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]" : (currentTheme.isDark ? "bg-indigo-600" : "bg-indigo-500")
                    )}>
                      <span className={cn("text-[10px] sm:text-xs font-bold", isCyber ? "text-black" : "text-white")}>U</span>
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className={cn(
        "p-2 sm:p-4 bg-gradient-to-t to-transparent transition-all duration-500",
        currentTheme.isDark ? "from-black via-black" : "from-white via-white"
      )}>
        <div className="max-w-3xl mx-auto relative">
          <AnimatePresence>
            {micError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className={cn(
                  "mb-2 p-2.5 px-3 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-sm backdrop-blur-md",
                  isCyber 
                    ? "bg-red-950/80 border-red-500/50 text-red-200" 
                    : (currentTheme.isDark ? "bg-red-950/60 border-red-500/30 text-red-200" : "bg-red-50 border-red-200 text-red-700")
                )}
              >
                <div className="flex items-center gap-2">
                  <MicOff className="w-4 h-4 shrink-0 text-red-400" />
                  <span className="leading-tight">{micError}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSettingsTab('permissions');
                      setIsSettingsOpen(true);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors",
                      isCyber 
                        ? "border-[#00f2ff]/40 text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                        : (currentTheme.isDark ? "border-white/20 text-white hover:bg-white/10" : "border-red-300 text-red-700 hover:bg-red-100")
                    )}
                  >
                    {t.settings}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMicError(null)}
                    className="p-1 hover:opacity-75 transition-opacity"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleTranslate} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={appLang === 'en' ? `Type in English or Myanmar...` : (sourceLang === 'English' ? 'အင်္ဂလိပ် သို့မဟုတ် မြန်မာလို ရိုက်ထည့်ပါ...' : 'မြန်မာ သို့မဟုတ် အင်္ဂလိပ်လို ရိုက်ထည့်ပါ...')}
              rows={1}
              className={cn(
                "w-full border rounded-2xl py-3 sm:py-4 pl-4 pr-24 sm:pr-28 focus:outline-none transition-all duration-500 resize-none min-h-[48px] sm:min-h-[56px] max-h-32 overflow-y-auto z-10 text-sm sm:text-base",
                currentTheme.input,
                currentTheme.text,
                currentTheme.border,
                isCyber 
                  ? "placeholder-[#00f2ff]/30 focus:ring-2 focus:ring-[#00f2ff]/50 shadow-[0_0_20px_rgba(0,242,255,0.15)]" 
                  : (currentTheme.isDark ? "placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50" : "placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30")
              )}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = `${target.scrollHeight}px`
              }}
            />
            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText()
                    setInput(prev => prev + text)
                    if (textareaRef.current) {
                      textareaRef.current.focus()
                      // Trigger height adjustment
                      const event = new Event('input', { bubbles: true })
                      textareaRef.current.dispatchEvent(event)
                    }
                  } catch (err) {
                    console.error('Failed to paste:', err)
                    setPasteError(true)
                    setTimeout(() => setPasteError(false), 2000)
                  }
                }}
                className={cn(
                  "p-1.5 sm:p-2 rounded-xl transition-all duration-500 border",
                  isCyber ? "bg-black text-[#00f2ff] border-[#00f2ff] hover:bg-[#00f2ff] hover:text-black" : (currentTheme.isDark ? "bg-white/5 text-gray-400 hover:bg-white/10 border-transparent" : "bg-black/5 text-gray-500 hover:bg-black/10 border-transparent")
                )}
                title={t.pasteTooltipMain}
              >
                <ClipboardPaste className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={startListening}
                className={cn(
                  "p-2 sm:p-3 rounded-xl transition-all duration-500 border",
                  isListening
                    ? (isCyber ? "bg-red-500 text-black animate-pulse shadow-[0_0_20px_#ef4444] border-red-500" : "bg-red-500 text-white animate-pulse")
                    : (isCyber ? "bg-black text-[#00f2ff] border-[#00f2ff] hover:shadow-[0_0_15px_#00f2ff] hover:bg-[#00f2ff] hover:text-black" : (currentTheme.isDark ? "bg-white/5 text-gray-400 hover:bg-white/10 border-transparent" : "bg-black/5 text-gray-500 hover:bg-black/10 border-transparent"))
                )}
                title={t.voiceTooltip}
              >
                {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim()}
                className={cn(
                  "p-2 sm:p-3 rounded-xl transition-all duration-500 border",
                  input.trim()
                    ? (isCyber ? "bg-[#00f2ff] text-black shadow-[0_0_15px_#00f2ff] border-[#00f2ff]" : currentTheme.accent + " " + currentTheme.accentText + " border-transparent") 
                    : (isCyber ? "bg-black text-[#00f2ff]/30 border-[#00f2ff]/30 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed border-transparent")
                )}
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </form>
          <p className={cn(
            "text-[10px] text-center mt-3 flex items-center justify-center gap-1 transition-all duration-500",
            currentTheme.textMuted
          )}>
            <Info className="w-3 h-3" /> {t.disclaimer(aiProvider === 'groq' ? 'Groq' : 'Gemini')}
          </p>
        </div>
      </footer>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className={cn(
                "fixed top-0 left-0 bottom-0 z-50 w-80 sm:w-96 max-w-[90vw] flex flex-col shadow-2xl border-r transition-colors duration-500",
                currentTheme.sidebar,
                currentTheme.border
              )}
            >
              <div className={cn(
                "p-4 border-b flex items-center justify-between transition-all duration-500",
                currentTheme.border
              )}>
                <h2 className={cn(
                  "text-lg font-bold uppercase tracking-widest transition-all duration-500",
                  isCyber ? "text-[#00f2ff]" : isGlass ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" : isBrutal ? "text-black font-black" : currentTheme.text
                )}>
                  {isCyber ? "SESSION_LOGS" : (sidebarTab === 'favorites' ? t.favoritesTab : t.chatHistory)}
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all",
                    isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-400 hover:bg-black/5"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 pb-3 space-y-3">
                <button 
                  onClick={createNewSession}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl font-bold uppercase tracking-wider transition-all duration-500",
                    currentTheme.accent,
                    currentTheme.accentText,
                    currentTheme.accentHover,
                    isCyber && "shadow-[0_0_15px_#00f2ff] hover:shadow-[0_0_25px_#00f2ff]"
                  )}
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>{t.newChat}</span>
                </button>

                {/* Search History / Favorites */}
                <div className="relative">
                  <Search className={cn(
                    "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
                    isCyber ? "text-[#00f2ff]/60" : currentTheme.textMuted
                  )} />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder={t.searchHistory}
                    className={cn(
                      "w-full pl-9 pr-8 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all",
                      isCyber
                        ? "bg-black border-[#00f2ff]/40 text-[#00f2ff] placeholder-[#00f2ff]/40 focus:border-[#00f2ff]"
                        : currentTheme.isDark
                          ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/60"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400"
                    )}
                  />
                  {historySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* History & Favorites Segmented Tabs */}
                <div className={cn(
                  "grid grid-cols-2 gap-1 p-1 rounded-xl border",
                  isCyber
                    ? "bg-black border-[#00f2ff]/30"
                    : currentTheme.isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-stone-100 border-stone-200"
                )}>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('history')}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-2 min-h-[40px] rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                      sidebarTab === 'history'
                        ? (isCyber ? "bg-[#00f2ff] text-black shadow-[0_0_12px_#00f2ff]" : cn(currentTheme.accent, currentTheme.accentText, "shadow-sm"))
                        : (isCyber ? "text-[#00f2ff]/60 hover:text-[#00f2ff]" : currentTheme.isDark ? "text-gray-400 hover:text-white" : "text-stone-600 hover:text-stone-900")
                    )}
                  >
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.historyTab}</span>
                    <span className="opacity-75 text-[11px] tabular-nums">({sessions.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidebarTab('favorites')}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-2 min-h-[40px] rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                      sidebarTab === 'favorites'
                        ? (isCyber ? "bg-[#00f2ff] text-black shadow-[0_0_12px_#00f2ff]" : cn(currentTheme.accent, currentTheme.accentText, "shadow-sm"))
                        : (isCyber ? "text-[#00f2ff]/60 hover:text-[#00f2ff]" : currentTheme.isDark ? "text-gray-400 hover:text-white" : "text-stone-600 hover:text-stone-900")
                    )}
                  >
                    <Star className={cn("w-3.5 h-3.5 shrink-0", sidebarTab === 'favorites' && "fill-current")} />
                    <span>{t.favoritesTab}</span>
                    <span className="opacity-75 text-[11px] tabular-nums">({sessions.filter(s => s.isFavorite).length})</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                {(() => {
                  const query = historySearchQuery.trim().toLowerCase()
                  const filteredSessions = sessions.filter((session) => {
                    if (sidebarTab === 'favorites' && !session.isFavorite) return false
                    if (!query) return true
                    const titleMatch = session.title.toLowerCase().includes(query)
                    const contentMatch = session.messages.some(m => m.content.toLowerCase().includes(query))
                    return titleMatch || contentMatch
                  })

                  if (filteredSessions.length === 0) {
                    return (
                      <div className={cn(
                        "py-12 px-4 text-center rounded-xl border border-dashed text-xs leading-relaxed",
                        isCyber ? "border-[#00f2ff]/25 text-[#00f2ff]/60" : currentTheme.isDark ? "border-white/10 text-gray-400" : "border-black/10 text-gray-500"
                      )}>
                        {sidebarTab === 'favorites' ? (
                          <div className="flex flex-col items-center gap-2">
                            <Star className="w-6 h-6 opacity-40" />
                            <p>{t.emptyFavorites}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-6 h-6 opacity-40" />
                            <p>{t.emptyHistory}</p>
                          </div>
                        )}
                      </div>
                    )
                  }

                  return filteredSessions.map((session) => {
                    const visibleMsgCount = session.messages.filter(m => !m.isPending).length
                    const formattedDate = new Date(session.timestamp).toLocaleDateString(appLang === 'my' ? 'my-MM' : 'en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                    const isActive = activeSessionId === session.id

                    return (
                      <div 
                        key={session.id}
                        onClick={() => {
                          setActiveSessionId(session.id)
                          setIsSidebarOpen(false)
                        }}
                        className={cn(
                          "group flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-300",
                          isActive
                            ? (isCyber ? "bg-[#00f2ff]/10 border-[#00f2ff] text-[#00f2ff]" : cn(currentTheme.accent, currentTheme.accentText, "border-transparent"))
                            : (isCyber ? "bg-transparent border-transparent text-gray-400 hover:bg-[#00f2ff]/5 hover:text-[#00f2ff]" : cn("bg-transparent border-transparent", currentTheme.textMuted, "hover:bg-black/5 hover:text-current"))
                        )}
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {session.title}
                          </div>
                          <div className={cn(
                            "text-[11px] truncate flex items-center gap-1.5 mt-0.5 tabular-nums",
                            isActive ? "opacity-85" : "opacity-65"
                          )}>
                            <span>{t.msgsCount(visibleMsgCount)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleSessionFavorite(session.id, e)}
                          title={session.isFavorite ? t.removeFavorite : t.addFavorite}
                          aria-label={session.isFavorite ? t.removeFavorite : t.addFavorite}
                          className={cn(
                            "p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-all duration-200 shrink-0",
                            session.isFavorite
                              ? (isActive && !isCyber ? "text-amber-300 hover:bg-black/15" : "text-amber-400 hover:bg-amber-400/10")
                              : (isActive ? "opacity-70 hover:opacity-100 hover:bg-black/15" : "opacity-60 group-hover:opacity-100 hover:bg-black/10")
                          )}
                        >
                          <Star className={cn("w-4 h-4", session.isFavorite && "fill-current")} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => deleteSession(session.id, e)}
                          title={t.deleteChatTooltip}
                          aria-label={t.deleteChatTooltip}
                          className={cn(
                            "p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-all duration-200 shrink-0 border",
                            "opacity-80 group-hover:opacity-100 focus:opacity-100",
                            isActive
                              ? isCyber
                                ? "bg-[#ff0055]/20 text-[#ff0055] border-[#ff0055]/40 hover:bg-[#ff0055] hover:text-black shadow-[0_0_10px_rgba(255,0,85,0.4)]"
                                : isBrutal
                                  ? "bg-black text-white border-black hover:bg-red-600 hover:border-black"
                                  : theme === 'dark'
                                    ? "bg-black/10 text-red-600 border border-black/30 hover:bg-red-600 hover:text-white"
                                    : currentTheme.isDark
                                      ? "bg-white/10 text-white hover:bg-red-500/30 hover:text-red-300 border-white/20"
                                      : "bg-black/10 text-white hover:bg-red-600 hover:text-white border-black/10"
                              : isCyber
                                ? "bg-black/60 text-[#ff0055] border-[#ff0055]/30 hover:bg-[#ff0055] hover:text-black hover:shadow-[0_0_10px_#ff0055]"
                                : isBrutal
                                  ? "bg-white text-black border-2 border-black hover:bg-red-500 hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                  : theme === 'dark'
                                    ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white shadow-[0_0_8px_rgba(239,68,68,0.35)]"
                                    : currentTheme.isDark
                                      ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/25 hover:text-red-300 hover:border-red-500/40"
                                      : "bg-white text-stone-700 border-stone-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm"
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })
                })()}
              </div>

              <div className={cn(
                "p-4 border-t space-y-2.5 transition-all duration-500",
                currentTheme.border
              )}>
                {updateInfo?.hasUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false)
                      setIsUpdateDialogOpen(true)
                    }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-xl text-xs font-bold border transition-all",
                      isCyber
                        ? "bg-[#00f2ff]/15 border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff] hover:text-black"
                        : "bg-emerald-600/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                    )}
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.updateAvailableBanner(updateInfo.latestVersion)}</span>
                  </button>
                )}

                {!isInstalled && (isInstallable || isIOS) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isInstallable) {
                        await triggerPwaInstall()
                      } else if (isIOS) {
                        setShowIosInstallGuide(true)
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-xl text-xs font-bold border transition-all",
                      isCyber
                        ? "border-[#00f2ff]/40 text-[#00f2ff] hover:bg-[#00f2ff]/10"
                        : currentTheme.isDark
                          ? "border-white/15 bg-white/5 text-gray-200 hover:bg-white/10"
                          : "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
                    )}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{t.installAndroidApp}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider border transition-all",
                    isCyber
                      ? "border-[#ff0055]/40 text-[#ff0055] hover:bg-[#ff0055]/10"
                      : currentTheme.isDark
                        ? "border-red-500/25 text-red-400 hover:bg-red-500/10"
                        : "border-red-200 text-red-600 hover:bg-red-50"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.clearHistory}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-sm p-6 rounded-2xl shadow-2xl overflow-hidden",
                isCyber 
                  ? "bg-black border-2 border-[#00f2ff] shadow-[0_0_30px_rgba(0,242,255,0.3)]" 
                  : isGlass
                    ? "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
                    : isBrutal
                      ? "bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-[#2f2f2f] border border-white/10"
              )}
            >
              {isCyber && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent animate-pulse" />
              )}
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isCyber ? "bg-[#00f2ff]/10 text-[#00f2ff]" : "bg-red-500/10 text-red-500"
                )}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <div className="space-y-2">
                  <h3 className={cn(
                    "text-lg font-bold uppercase tracking-widest",
                    isCyber ? "text-[#00f2ff]" : isGlass ? "text-white" : isBrutal ? "text-black" : "text-white"
                  )}>
                    {isCyber ? "SYSTEM_CLEAR_CONFIRM" : t.clearConfirmTitle}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    isCyber ? "text-[#00f2ff]/70" : isGlass ? "text-white/70" : isBrutal ? "text-black/70" : "text-gray-400"
                  )}>
                    {t.clearConfirmDesc}
                  </p>
                </div>

                <div className="flex w-full gap-3 pt-2">
                  <button
                    onClick={() => setIsConfirmOpen(false)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all",
                      isCyber 
                        ? "border border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                        : isGlass
                          ? "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                          : isBrutal
                            ? "border-4 border-black text-black hover:bg-black/5"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => {
                      clearChat();
                      setIsConfirmOpen(false);
                    }}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all",
                      isCyber 
                        ? "bg-[#ff4b4b] text-black shadow-[0_0_15px_#ff4b4b] hover:shadow-[0_0_25px_#ff4b4b]" 
                        : isGlass
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                          : isBrutal
                            ? "bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                            : "bg-red-600 text-white hover:bg-red-700"
                    )}
                  >
                    {t.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-lg flex flex-col rounded-2xl border shadow-2xl z-10 transition-all duration-500 max-h-[90vh] overflow-hidden",
                isCyber 
                  ? "bg-black border-[#00f2ff] shadow-[0_0_50px_rgba(0,242,255,0.4)] font-mono" 
                  : isGlass
                    ? "bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl"
                    : isBrutal
                      ? "bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]"
                      : cn(currentTheme.sidebar, currentTheme.border, currentTheme.text)
              )}
            >
              {/* Fixed Header */}
              <div className={cn(
                "p-4 sm:p-6 pb-0 border-b transition-all duration-500",
                isCyber ? "border-[#00f2ff]/30" : currentTheme.border
              )}>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className={cn(
                    "text-lg sm:text-xl font-bold uppercase tracking-widest transition-all duration-500",
                    isCyber ? "text-[#00f2ff] drop-shadow-[0_0_10px_#00f2ff]" : currentTheme.text
                  )}>
                    {isCyber ? "SYSTEM_OVERRIDE" : tSettings.settings}
                  </h3>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className={cn(
                      "p-1 rounded-full transition-colors",
                      isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : cn(currentTheme.textMuted, "hover:bg-black/5")
                    )}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Settings Tabs - Fixed */}
                <div className={cn(
                  "flex items-center gap-1 p-1 rounded-xl mb-6 border transition-all duration-500",
                  isCyber ? "bg-black border-[#00f2ff]/30" : isGlass ? "bg-white/5 border-white/10" : isBrutal ? "bg-white border-4 border-black" : cn(currentTheme.bg, currentTheme.border)
                )}>
                  {[
                    { id: 'appearance', label: tSettings.tabs.appearance, icon: Eye },
                    { id: 'audio', label: tSettings.tabs.audio, icon: Volume2 },
                    { id: 'api', label: tSettings.tabs.api, icon: Zap },
                    { id: 'permissions', label: tSettings.tabs.permissions, icon: Shield },
                    { id: 'updates', label: tSettings.tabs.updates, icon: Download }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSettingsTab(tab.id as any)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 relative",
                        activeSettingsTab === tab.id
                          ? (isCyber ? "bg-[#00f2ff] text-black shadow-[0_0_15px_#00f2ff]" : isGlass ? "bg-white/20 text-white shadow-lg" : isBrutal ? "bg-black text-white" : cn(currentTheme.accent, currentTheme.accentText))
                          : (isCyber ? "text-[#00f2ff]/50 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10" : isGlass ? "text-white/40 hover:text-white hover:bg-white/5" : isBrutal ? "text-black/40 hover:text-black hover:bg-black/5" : cn(currentTheme.textMuted, "hover:bg-black/5"))
                      )}
                    >
                      {tab.id === 'api' ? (
                        <span className="text-[10px] font-black">API</span>
                      ) : (
                        <tab.icon className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden xs:inline">{tab.label}</span>
                      {tab.id === 'updates' && updateInfo?.hasUpdate && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-0 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
                <div className="min-h-[350px]">
                  {activeSettingsTab === 'appearance' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* App Language Selector */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={cn(
                          "text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                          isCyber ? "text-[#00f2ff]" : cn(currentTheme.text, "opacity-90")
                        )}>
                          {tSettings.appLanguage}
                        </label>
                        <span className="text-[10px] opacity-60 font-medium">{tSettings.appLangDesc}</span>
                      </div>
                      <div className={cn(
                        "grid grid-cols-2 gap-2 p-1.5 rounded-xl border transition-all",
                        isCyber 
                          ? "bg-black border-[#00f2ff]/30" 
                          : currentTheme.isDark 
                            ? "bg-white/5 border-white/10" 
                            : "bg-stone-100 border-stone-200"
                      )}>
                        <button
                          type="button"
                          onClick={() => updateStaged('appLang', 'my')}
                          className={cn(
                            "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all",
                            stagedSettings.appLang === 'my'
                              ? isCyber 
                                ? "bg-[#00f2ff] text-black shadow-[0_0_12px_#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "bg-emerald-600 text-white shadow-md" 
                                  : cn(currentTheme.accent, currentTheme.accentText, "shadow-sm")
                              : isCyber 
                                ? "text-[#00f2ff]/60 hover:text-[#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "text-gray-400 hover:text-white" 
                                  : "text-stone-600 hover:text-stone-900"
                          )}
                        >
                          <span className="text-sm">🇲🇲</span>
                          <span>မြန်မာစာ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStaged('appLang', 'en')}
                          className={cn(
                            "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all",
                            stagedSettings.appLang === 'en'
                              ? isCyber 
                                ? "bg-[#00f2ff] text-black shadow-[0_0_12px_#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "bg-emerald-600 text-white shadow-md" 
                                  : cn(currentTheme.accent, currentTheme.accentText, "shadow-sm")
                              : isCyber 
                                ? "text-[#00f2ff]/60 hover:text-[#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "text-gray-400 hover:text-white" 
                                  : "text-stone-600 hover:text-stone-900"
                          )}
                        >
                          <span className="text-sm">🇬🇧</span>
                          <span>English</span>
                        </button>
                      </div>
                    </div>

                    {/* Theme Section */}
                    <div className="space-y-2 relative">
                      <label className={cn(
                        "text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                        isCyber ? "text-[#00f2ff]" : cn(currentTheme.text, "opacity-90")
                      )}>
                        {tSettings.themeOption}
                      </label>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === 'theme' ? null : 'theme')}
                        className={cn(
                          "w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all",
                          isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]" : cn(currentTheme.bg, currentTheme.border, currentTheme.text)
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          <span className="text-sm sm:text-base">{THEME_CONFIG[stagedSettings.theme].name}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === 'theme' && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === 'theme' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                              "absolute top-full left-0 right-0 mt-2 z-30 rounded-xl border shadow-2xl overflow-hidden",
                              isCyber 
                                ? "bg-black border-[#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "bg-[#282828] border-white/10" 
                                  : "bg-white border-gray-200 text-gray-800 shadow-xl"
                            )}
                          >
                            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                              {(Object.keys(THEME_CONFIG) as Theme[]).map((thm) => (
                                <button
                                  key={thm}
                                  onClick={() => {
                                    updateStaged('theme', thm)
                                    setActiveDropdown(null)
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                                    stagedSettings.theme === thm 
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : currentTheme.isDark ? "bg-emerald-600 text-white font-medium" : cn(currentTheme.accent, currentTheme.accentText, "font-semibold"))
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : currentTheme.isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-100")
                                  )}
                                >
                                  <span>{THEME_CONFIG[thm].name}</span>
                                  {stagedSettings.theme === thm && <Check className="w-4 h-4" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* English Font Style Section */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className={cn(
                          "text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                          isCyber ? "text-[#00f2ff]" : cn(currentTheme.text, "opacity-90")
                        )}>
                          {tSettings.englishFont}
                        </label>
                        <span className="text-[10px] opacity-60 font-medium">{tSettings.englishFontDesc}</span>
                      </div>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === 'font' ? null : 'font')}
                        className={cn(
                          "w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all",
                          isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]" : cn(currentTheme.bg, currentTheme.border, currentTheme.text)
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm sm:text-base", (ENGLISH_FONT_OPTIONS.find(f => f.id === stagedSettings.fontStyle) || ENGLISH_FONT_OPTIONS[0]).class)}>
                            {(ENGLISH_FONT_OPTIONS.find(f => f.id === stagedSettings.fontStyle) || ENGLISH_FONT_OPTIONS[0]).name}
                          </span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === 'font' && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === 'font' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                              "absolute top-full left-0 right-0 mt-2 z-30 rounded-xl border shadow-2xl overflow-hidden",
                              isCyber 
                                ? "bg-black border-[#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "bg-[#282828] border-white/10" 
                                  : "bg-white border-gray-200 text-gray-800 shadow-xl"
                            )}
                          >
                            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                              {ENGLISH_FONT_OPTIONS.map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => {
                                    updateStaged('fontStyle', f.id as FontStyle)
                                    setActiveDropdown(null)
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                                    stagedSettings.fontStyle === f.id 
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : currentTheme.isDark ? "bg-emerald-600 text-white font-medium" : cn(currentTheme.accent, currentTheme.accentText, "font-semibold"))
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : currentTheme.isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-100")
                                  )}
                                >
                                  <span className={f.class}>{f.name}</span>
                                  {stagedSettings.fontStyle === f.id && <Check className="w-4 h-4" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Myanmar Font Style Section */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className={cn(
                          "text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                          isCyber ? "text-[#00f2ff]" : cn(currentTheme.text, "opacity-90")
                        )}>
                          {tSettings.myanmarFont}
                        </label>
                        <span className="text-[10px] opacity-60 font-medium">{tSettings.myanmarFontDesc}</span>
                      </div>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === 'mm-font' ? null : 'mm-font')}
                        className={cn(
                          "w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all text-left",
                          isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]" : cn(currentTheme.bg, currentTheme.border, currentTheme.text)
                        )}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                          {(() => {
                            const selectedMmFont = MYANMAR_FONT_OPTIONS.find(f => f.id === stagedSettings.myanmarFont) || MYANMAR_FONT_OPTIONS[0];
                            return (
                              <>
                                <span className="text-sm sm:text-base font-semibold truncate">
                                  {selectedMmFont.name}
                                </span>
                                <span className={cn("text-sm sm:text-base leading-snug", selectedMmFont.class)}>
                                  မင်္ဂလာပါ ကမ္ဘာလောက
                                </span>
                                <span className="text-[11px] opacity-70 truncate">
                                  {stagedSettings.appLang === 'en' ? selectedMmFont.subtextEn : selectedMmFont.subtext}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", activeDropdown === 'mm-font' && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === 'mm-font' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                              "absolute top-full left-0 right-0 mt-2 z-30 rounded-xl border shadow-2xl overflow-hidden",
                              isCyber 
                                ? "bg-black border-[#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "bg-[#282828] border-white/10" 
                                  : "bg-white border-gray-200 text-gray-800 shadow-xl"
                            )}
                          >
                            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                              {MYANMAR_FONT_OPTIONS.map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => {
                                    updateStaged('myanmarFont', f.id)
                                    setActiveDropdown(null)
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between border-b last:border-b-0",
                                    currentTheme.isDark ? "border-white/5" : "border-black/5",
                                    stagedSettings.myanmarFont === f.id 
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : currentTheme.isDark ? "bg-emerald-600 text-white font-medium" : cn(currentTheme.accent, currentTheme.accentText, "font-semibold"))
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : currentTheme.isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-100")
                                  )}
                                >
                                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-85">{f.name}</span>
                                    <div className={cn("text-base sm:text-lg leading-snug py-0.5", f.class)}>
                                      မင်္ဂလာပါ ကမ္ဘာလောက
                                    </div>
                                    <span className={cn("text-[11px]", stagedSettings.myanmarFont === f.id ? "opacity-90" : "opacity-65")}>
                                      {stagedSettings.appLang === 'en' ? f.subtextEn : f.subtext}
                                    </span>
                                  </div>
                                  {stagedSettings.myanmarFont === f.id && <Check className="w-4 h-4 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Isolated Tab Save: Appearance & Fonts */}
                    <div className="pt-4 border-t border-black/10 dark:border-white/10">
                      <button
                        onClick={applyAppearanceSettings}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 border text-xs sm:text-sm",
                          isCyber 
                            ? "bg-[#00f2ff] text-black shadow-[0_0_20px_rgba(0,242,255,0.5)] border-[#00f2ff] hover:bg-black hover:text-[#00f2ff]" 
                            : isBrutal
                              ? "bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                              : currentTheme.isDark
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-lg"
                                : "bg-[#5A5A40] text-white hover:bg-[#474732] border-transparent shadow-md"
                        )}
                      >
                        {tSettings.saveAppearance}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'audio' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Animation Dropdown */}
                    <div className="space-y-2 relative">
                      <label className={cn(
                        "text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                        isCyber ? "text-[#00f2ff]" : cn(currentTheme.text, "opacity-90")
                      )}>
                        {tSettings.outputAnimation}
                      </label>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === 'animation' ? null : 'animation')}
                        className={cn(
                          "w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all",
                          isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]" : cn(currentTheme.bg, currentTheme.border, currentTheme.text)
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {stagedSettings.animation === 'typing' && <Keyboard className="w-4 h-4" />}
                          <span className="capitalize text-sm sm:text-base">{stagedSettings.animation}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === 'animation' && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === 'animation' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                              "absolute top-full left-0 right-0 mt-2 z-20 rounded-xl border shadow-xl overflow-hidden",
                              isCyber 
                                ? "bg-black border-[#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "bg-[#282828] border-white/10" 
                                  : "bg-white border-gray-200 text-gray-800 shadow-xl"
                            )}
                          >
                            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                              {animations.map((anim) => (
                                <button
                                  key={anim}
                                  onClick={() => {
                                    updateStaged('animation', anim)
                                    setActiveDropdown(null)
                                    // Play sound once for non-typing animations
                                    if (anim !== 'typing' && stagedSettings.soundEnabled) playTypingSound()
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm transition-colors capitalize flex items-center gap-2",
                                    stagedSettings.animation === anim 
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : currentTheme.isDark ? "bg-emerald-600 text-white font-medium" : cn(currentTheme.accent, currentTheme.accentText, "font-semibold"))
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : currentTheme.isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-100")
                                  )}
                                >
                                  {anim === 'typing' && <Keyboard className="w-4 h-4" />}
                                  {anim}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Sound Dropdown */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <label className={cn(
                          "text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                          isCyber ? "text-[#00f2ff]" : cn(currentTheme.text, "opacity-90")
                        )}>
                          {tSettings.animationSound}
                        </label>
                        <button 
                          onClick={() => updateStaged('soundEnabled', !stagedSettings.soundEnabled)}
                          className={cn(
                            "flex items-center gap-1 text-[10px] font-bold uppercase transition-all",
                            stagedSettings.soundEnabled 
                              ? (isCyber ? "text-[#00f2ff]" : cn(currentTheme.icon)) 
                              : "text-gray-500"
                          )}
                        >
                          {stagedSettings.soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                          {stagedSettings.soundEnabled ? tSettings.soundOn : tSettings.soundOff}
                        </button>
                      </div>
                      
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === 'sound' ? null : 'sound')}
                        disabled={!stagedSettings.soundEnabled}
                        className={cn(
                          "w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all",
                          !stagedSettings.soundEnabled && "opacity-50 cursor-not-allowed",
                          isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]" : cn(currentTheme.bg, currentTheme.border, currentTheme.text)
                        )}
                      >
                        <span className="capitalize text-sm sm:text-base">{stagedSettings.soundType}</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === 'sound' && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === 'sound' && stagedSettings.soundEnabled && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={cn(
                              "absolute top-full left-0 right-0 mt-2 z-20 rounded-xl border shadow-xl overflow-hidden",
                              isCyber 
                                ? "bg-black border-[#00f2ff]" 
                                : currentTheme.isDark 
                                  ? "bg-[#282828] border-white/10" 
                                  : "bg-white border-gray-200 text-gray-800 shadow-xl"
                            )}
                          >
                            <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                              {sounds.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => {
                                    updateStaged('soundType', s)
                                    setActiveDropdown(null)
                                    playTypingSound()
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm transition-colors capitalize",
                                    stagedSettings.soundType === s 
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : currentTheme.isDark ? "bg-emerald-600 text-white font-medium" : cn(currentTheme.accent, currentTheme.accentText, "font-semibold"))
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : currentTheme.isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-100")
                                  )}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className={cn(
                      "p-4 rounded-xl border flex items-center gap-3 transition-all duration-500",
                      isCyber 
                        ? "bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]/70" 
                        : currentTheme.isDark 
                          ? "bg-white/5 border-white/10 text-gray-300" 
                          : "bg-[#f5f5f0] border-[#d8d8cc] text-[#333333] shadow-sm"
                    )}>
                      <Info className="w-5 h-5 flex-shrink-0" />
                      <p className="text-xs leading-relaxed">
                        {tSettings.soundDesc}
                      </p>
                    </div>

                    {/* Isolated Tab Save: Audio & Effects */}
                    <div className="pt-4 border-t border-black/10 dark:border-white/10">
                      <button
                        onClick={applyAudioSettings}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 border text-xs sm:text-sm",
                          isCyber 
                            ? "bg-[#00f2ff] text-black shadow-[0_0_20px_rgba(0,242,255,0.5)] border-[#00f2ff] hover:bg-black hover:text-[#00f2ff]" 
                            : isBrutal
                              ? "bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                              : currentTheme.isDark
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-lg"
                                : "bg-[#5A5A40] text-white hover:bg-[#474732] border-transparent shadow-md"
                        )}
                      >
                        {tSettings.saveAudio}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'api' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* API Provider & Model Configuration Section */}
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <Zap className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : "text-amber-500")} />
                          <h4 className={cn(
                            "text-sm font-bold uppercase tracking-widest",
                            isCyber ? "text-[#00f2ff]" : currentTheme.isDark ? "text-white" : "text-gray-900"
                          )}>
                            {tSettings.aiProviderModel}
                          </h4>
                        </div>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border self-start sm:self-auto",
                          currentTheme.isDark 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                            : "bg-emerald-50 text-emerald-800 border-emerald-300"
                        )}>
                          <Lock className="w-3 h-3" />
                          <span>{tSettings.e2eSecurityBadge}</span>
                        </div>
                      </div>

                      {/* 1. AI Provider Switcher (Gemini vs Groq) */}
                      <div className="space-y-2">
                        <label className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          isCyber ? "text-[#00f2ff]/60" : currentTheme.isDark ? "text-gray-400" : "text-gray-700 font-semibold"
                        )}>
                          {tSettings.selectAiEngine}
                        </label>
                        <div className={cn(
                          "grid grid-cols-2 gap-2 p-1.5 rounded-xl border transition-all",
                          isCyber 
                            ? "bg-black border-[#00f2ff]/30" 
                            : currentTheme.isDark 
                              ? "bg-white/5 border-white/10" 
                              : "bg-stone-100 border-stone-200"
                        )}>
                          <button
                            type="button"
                            onClick={() => {
                              updateStaged('aiProvider', 'gemini')
                              setActiveDropdown(null)
                            }}
                            className={cn(
                              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all",
                              stagedSettings.aiProvider === 'gemini'
                                ? isCyber 
                                  ? "bg-[#00f2ff] text-black shadow-[0_0_12px_#00f2ff]" 
                                  : currentTheme.isDark 
                                    ? "bg-emerald-600 text-white shadow-md" 
                                    : cn(currentTheme.accent, currentTheme.accentText, "shadow-sm")
                                : isCyber 
                                  ? "text-[#00f2ff]/60 hover:text-[#00f2ff]" 
                                  : currentTheme.isDark 
                                    ? "text-gray-400 hover:text-white" 
                                    : "text-stone-600 hover:text-stone-900"
                            )}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Google Gemini</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded opacity-80 font-normal uppercase hidden sm:inline">{tSettings.defaultBadge}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateStaged('aiProvider', 'groq')
                              setActiveDropdown(null)
                            }}
                            className={cn(
                              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all",
                              stagedSettings.aiProvider === 'groq'
                                ? isCyber 
                                  ? "bg-[#00f2ff] text-black shadow-[0_0_12px_#00f2ff]" 
                                  : currentTheme.isDark 
                                    ? "bg-amber-600 text-white shadow-md" 
                                    : cn(currentTheme.accent, currentTheme.accentText, "shadow-sm")
                                : isCyber 
                                  ? "text-[#00f2ff]/60 hover:text-[#00f2ff]" 
                                  : currentTheme.isDark 
                                    ? "text-gray-400 hover:text-white" 
                                    : "text-stone-600 hover:text-stone-900"
                            )}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Groq Cloud</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded opacity-80 font-normal uppercase hidden sm:inline">{tSettings.fastLpuBadge}</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. AI Model Selection Dropdown */}
                      <div className="space-y-2 relative">
                        <div className="flex items-center justify-between">
                          <label className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isCyber ? "text-[#00f2ff]/60" : currentTheme.isDark ? "text-gray-400" : "text-gray-700 font-semibold"
                          )}>
                            {stagedSettings.aiProvider === 'gemini' ? tSettings.geminiModelLabel : tSettings.groqModelLabel}
                          </label>
                          <span className={cn(
                            "text-[10px] font-mono",
                            currentTheme.isDark ? "text-gray-400" : "text-stone-500"
                          )}>
                            {stagedSettings.aiProvider === 'gemini' ? stagedSettings.geminiModel : stagedSettings.groqModel}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === 'model' ? null : 'model')}
                          className={cn(
                            "w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all text-left",
                            isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff]" : cn(currentTheme.bg, currentTheme.border, currentTheme.text)
                          )}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Cpu className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-semibold truncate">
                              {(stagedSettings.aiProvider === 'gemini' ? GEMINI_MODELS : GROQ_MODELS).find(m => m.id === (stagedSettings.aiProvider === 'gemini' ? stagedSettings.geminiModel : stagedSettings.groqModel))?.name || (stagedSettings.aiProvider === 'gemini' ? stagedSettings.geminiModel : stagedSettings.groqModel)}
                            </span>
                            <span className={cn(
                              "text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold shrink-0 border",
                              currentTheme.isDark
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            )}>
                              {(stagedSettings.aiProvider === 'gemini' ? GEMINI_MODELS : GROQ_MODELS).find(m => m.id === (stagedSettings.aiProvider === 'gemini' ? stagedSettings.geminiModel : stagedSettings.groqModel))?.badge || 'Active'}
                            </span>
                          </div>
                          <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", activeDropdown === 'model' && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                          {activeDropdown === 'model' && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={cn(
                                "absolute top-full left-0 right-0 mt-2 z-30 rounded-xl border shadow-2xl overflow-hidden",
                                isCyber 
                                  ? "bg-black border-[#00f2ff]" 
                                  : currentTheme.isDark 
                                    ? "bg-[#282828] border-white/10" 
                                    : "bg-white border-gray-200 text-gray-800 shadow-xl"
                              )}
                            >
                              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                {(stagedSettings.aiProvider === 'gemini' ? GEMINI_MODELS : GROQ_MODELS).map((m) => {
                                  const isSelected = (stagedSettings.aiProvider === 'gemini' ? stagedSettings.geminiModel : stagedSettings.groqModel) === m.id
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        if (stagedSettings.aiProvider === 'gemini') {
                                          updateStaged('geminiModel', m.id)
                                        } else {
                                          updateStaged('groqModel', m.id)
                                        }
                                        setActiveDropdown(null)
                                      }}
                                      className={cn(
                                        "w-full text-left px-4 py-3 text-sm transition-colors border-b last:border-b-0",
                                        currentTheme.isDark ? "border-white/5" : "border-stone-100",
                                        isSelected
                                          ? isCyber 
                                            ? "bg-[#00f2ff] text-black" 
                                            : currentTheme.isDark 
                                              ? "bg-emerald-600/30 text-white font-medium" 
                                              : "bg-stone-100 text-stone-900 font-semibold"
                                          : isCyber 
                                            ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                                            : currentTheme.isDark 
                                              ? "text-gray-300 hover:bg-white/5" 
                                              : "text-gray-700 hover:bg-gray-50"
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold flex items-center gap-2 flex-wrap">
                                          <span>{m.name}</span>
                                          <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold border",
                                            isSelected && isCyber
                                              ? "bg-emerald-700 text-white border-emerald-900"
                                              : currentTheme.isDark
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                          )}>
                                            {m.badge}
                                          </span>
                                        </span>
                                        {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                                      </div>
                                      <p className={cn(
                                        "text-xs mt-1 leading-snug",
                                        isSelected 
                                          ? isCyber ? "text-black/80" : currentTheme.isDark ? "text-gray-200" : "text-stone-700"
                                          : isCyber ? "text-[#00f2ff]/70" : currentTheme.isDark ? "text-gray-400" : "text-stone-500"
                                      )}>
                                        {stagedSettings.appLang === 'en' ? m.descriptionEn : m.description}
                                      </p>
                                    </button>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 3. API Key Input (Write-Only Web Crypto E2E Vault: shows only last 4 chars once saved) */}
                      {(() => {
                        const isGemini = stagedSettings.aiProvider === 'gemini'
                        const savedRawKey = isGemini ? geminiApiKey.trim() : groqApiKey.trim()
                        const isCleared = isGemini ? stagedSettings.geminiKeyCleared : stagedSettings.groqKeyCleared
                        const isReplacing = isGemini ? isReplacingGeminiKey : isReplacingGroqKey
                        const stagedNewKey = isGemini ? stagedSettings.geminiApiKey : stagedSettings.groqApiKey
                        const hasSavedKey = !!savedRawKey && !isCleared
                        const hasAnyKey = !!stagedNewKey.trim() || hasSavedKey
                        const maskedLastFour = savedRawKey.length >= 4
                          ? `••••••••••••${savedRawKey.slice(-4)}`
                          : '••••••••'

                        return (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                isCyber ? "text-[#00f2ff]/60" : currentTheme.isDark ? "text-gray-400" : "text-gray-700 font-semibold"
                              )}>
                                {isGemini ? `Gemini ${tSettings.apiKeyField}` : `Groq ${tSettings.apiKeyField}`}
                              </label>
                              <span className={cn(
                                "text-[10px] font-mono flex items-center gap-1",
                                hasAnyKey
                                  ? "text-emerald-500 font-bold"
                                  : currentTheme.isDark ? "text-gray-400" : "text-stone-500"
                              )}>
                                {hasAnyKey ? tSettings.activeKeyReady : tSettings.defaultFreeQuota}
                              </span>
                            </div>

                            {hasSavedKey && !isReplacing ? (
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-mono select-none",
                                  isCyber
                                    ? "bg-black border-[#00f2ff]/60 text-[#00f2ff]"
                                    : currentTheme.isDark
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                      : "bg-emerald-50 border-emerald-300 text-emerald-900"
                                )}>
                                  <span className="flex items-center gap-2 tracking-wider">
                                    <Lock className="w-3.5 h-3.5 shrink-0" />
                                    <span>{maskedLastFour}</span>
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isGemini) {
                                      setIsReplacingGeminiKey(true)
                                      updateStaged('geminiApiKey', '')
                                    } else {
                                      setIsReplacingGroqKey(true)
                                      updateStaged('groqApiKey', '')
                                    }
                                  }}
                                  className={cn(
                                    "px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0",
                                    isCyber
                                      ? "bg-black border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff]/10"
                                      : currentTheme.isDark
                                        ? "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
                                        : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100 shadow-sm"
                                  )}
                                  title={tSettings.replaceKey}
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>{tSettings.replaceKey}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isGemini) {
                                      updateStaged('geminiKeyCleared', true)
                                      updateStaged('geminiApiKey', '')
                                      setIsReplacingGeminiKey(false)
                                    } else {
                                      updateStaged('groqKeyCleared', true)
                                      updateStaged('groqApiKey', '')
                                      setIsReplacingGroqKey(false)
                                    }
                                  }}
                                  className={cn(
                                    "p-2.5 rounded-xl border transition-all shrink-0",
                                    isCyber
                                      ? "bg-black border-red-500 text-red-500 hover:bg-red-500/10"
                                      : currentTheme.isDark
                                        ? "bg-white/5 border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                        : "bg-white border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 shadow-sm"
                                  )}
                                  title={tSettings.clearKeyTooltip}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="relative flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <input
                                      type="password"
                                      autoComplete="new-password"
                                      value={stagedNewKey}
                                      onChange={(e) => {
                                        if (isGemini) {
                                          updateStaged('geminiApiKey', e.target.value)
                                        } else {
                                          updateStaged('groqApiKey', e.target.value)
                                        }
                                      }}
                                      placeholder={isGemini ? tSettings.pasteKeyPlaceholder('Gemini (AIzaSy...)') : tSettings.pasteKeyPlaceholder('Groq (gsk_...)')}
                                      className={cn(
                                        "w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none",
                                        isCyber 
                                          ? "bg-black border-[#00f2ff] text-[#00f2ff] placeholder-[#00f2ff]/40 focus:ring-1 focus:ring-[#00f2ff]" 
                                          : currentTheme.isDark
                                            ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:ring-1 focus:ring-emerald-500"
                                            : "bg-white border-[#d5d5c8] text-gray-900 placeholder-gray-400 focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/30 shadow-sm"
                                      )}
                                    />
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const text = await navigator.clipboard.readText();
                                          if (text) {
                                            if (isGemini) {
                                              updateStaged('geminiApiKey', text);
                                            } else {
                                              updateStaged('groqApiKey', text);
                                            }
                                            setPasteError(false);
                                          }
                                        } catch (err) {
                                          console.warn("Failed to paste:", err);
                                          setPasteError(true);
                                          setTimeout(() => setPasteError(false), 5000);
                                        }
                                      }}
                                      className={cn(
                                        "p-2.5 rounded-xl border transition-all",
                                        isCyber 
                                          ? "bg-black border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                                          : currentTheme.isDark
                                            ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                                            : "bg-white border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-100 shadow-sm"
                                      )}
                                      title={tSettings.pasteTooltip}
                                    >
                                      <ClipboardPaste className="w-4 h-4" />
                                    </button>
                                    {(isReplacing || stagedNewKey) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isGemini) {
                                            updateStaged('geminiApiKey', '')
                                            if (savedRawKey && !isCleared) {
                                              setIsReplacingGeminiKey(false)
                                            }
                                          } else {
                                            updateStaged('groqApiKey', '')
                                            if (savedRawKey && !isCleared) {
                                              setIsReplacingGroqKey(false)
                                            }
                                          }
                                        }}
                                        className={cn(
                                          "p-2.5 rounded-xl border transition-all",
                                          isCyber 
                                            ? "bg-black border-[#00f2ff]/40 text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                                            : currentTheme.isDark
                                              ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                                              : "bg-white border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100 shadow-sm"
                                        )}
                                        title={isReplacing && hasSavedKey ? tSettings.keepExistingKey : tSettings.clearKeyTooltip}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {pasteError && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10px] text-amber-500 font-medium mt-1"
                              >
                                {tSettings.pasteBlockedAlert}
                              </motion.p>
                            )}
                            <p className={cn(
                              "text-[10px] flex items-center gap-1 mt-1",
                              currentTheme.isDark ? "text-gray-400" : "text-stone-500"
                            )}>
                              <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{tSettings.storageEncryptionNote} {hasSavedKey ? tSettings.lockedKeyNote : ''}</span>
                            </p>
                          </div>
                        )
                      })()}

                      {/* 4. Provider-Specific Free Tier API Guide Card */}
                      {stagedSettings.aiProvider === 'gemini' ? (
                        <div className={cn(
                          "p-3.5 rounded-xl border text-[11px] leading-relaxed transition-all",
                          isCyber 
                            ? "bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]/70" 
                            : currentTheme.isDark
                              ? "bg-black/20 border-white/5 text-gray-400"
                              : "bg-[#f5f5f0] border-[#d8d8cc] text-[#2c2c2c] shadow-sm"
                        )}>
                          <p className={cn("font-bold mb-1 flex items-center gap-1.5", currentTheme.isDark ? "text-amber-400" : "text-amber-800")}>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{tSettings.geminiGuideTitle}</span>
                          </p>
                          <p className="mb-2">
                            {tSettings.geminiGuideText}
                          </p>
                          <p className="mb-2">
                            🔗 <strong>{tSettings.geminiLinkText}</strong>{" "}
                            <a 
                              href="https://aistudio.google.com/app/apikey" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={cn("inline-flex items-center gap-1 hover:underline font-bold", currentTheme.isDark ? "text-blue-400" : "text-blue-600")}
                            >
                              <span>aistudio.google.com/app/apikey</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </p>
                          <div className={cn("pt-2 border-t", currentTheme.isDark ? "border-white/5" : "border-black/10")}>
                            <p className={cn("font-bold mb-1", currentTheme.isDark ? "text-emerald-400" : "text-emerald-800")}>{tSettings.geminiQuotaTitle}</p>
                            <p>
                              {tSettings.geminiQuotaText}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className={cn(
                          "p-3.5 rounded-xl border text-[11px] leading-relaxed transition-all",
                          isCyber 
                            ? "bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]/70" 
                            : currentTheme.isDark
                              ? "bg-black/20 border-white/5 text-gray-400"
                              : "bg-[#f5f5f0] border-[#d8d8cc] text-[#2c2c2c] shadow-sm"
                        )}>
                          <p className={cn("font-bold mb-1 flex items-center gap-1.5", currentTheme.isDark ? "text-amber-400" : "text-amber-800")}>
                            <Zap className="w-3.5 h-3.5" />
                            <span>{tSettings.groqGuideTitle}</span>
                          </p>
                          <p className="mb-2">
                            {tSettings.groqGuideText}
                          </p>
                          <p className="mb-2">
                            🔗 <strong>{tSettings.groqLinkText}</strong>{" "}
                            <a 
                              href="https://console.groq.com/keys" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={cn("inline-flex items-center gap-1 hover:underline font-bold", currentTheme.isDark ? "text-amber-400" : "text-blue-600")}
                            >
                              <span>console.groq.com/keys</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </p>
                          <div className={cn("pt-2 border-t space-y-1", currentTheme.isDark ? "border-white/5" : "border-black/10")}>
                            <p className={cn("font-bold", currentTheme.isDark ? "text-emerald-400" : "text-emerald-800")}>{tSettings.groqStepsTitle}</p>
                            <p>{tSettings.groqStep1}</p>
                            <p>{tSettings.groqStep2}</p>
                            <p>{tSettings.groqStep3}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Isolated Tab Save: API Configuration */}
                    <div className="pt-4 border-t border-black/10 dark:border-white/10">
                      <button
                        onClick={applyApiSettings}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 border text-xs sm:text-sm",
                          isCyber 
                            ? "bg-[#00f2ff] text-black shadow-[0_0_20px_rgba(0,242,255,0.5)] border-[#00f2ff] hover:bg-black hover:text-[#00f2ff]" 
                            : isBrutal
                              ? "bg-black text-white hover:bg-gray-800 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                              : currentTheme.isDark
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-lg"
                                : "bg-[#5A5A40] text-white hover:bg-[#474732] border-transparent shadow-md"
                        )}
                      >
                        {tSettings.saveApi}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'permissions' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : currentTheme.isDark ? "text-emerald-500" : "text-[#5A5A40]")} />
                        <h4 className={cn(
                          "text-sm font-bold uppercase tracking-widest",
                          isCyber ? "text-[#00f2ff]" : currentTheme.isDark ? "text-white" : "text-gray-900"
                        )}>
                          {tSettings.permissionsTitle}
                        </h4>
                      </div>

                      {/* Current Status List */}
                      <div className="space-y-3">
                        <div className={cn(
                          "p-4 rounded-xl border flex flex-col gap-3 transition-all",
                          isCyber ? "bg-black border-[#00f2ff]/30" : currentTheme.isDark ? "bg-white/5 border-white/10" : "bg-white border-[#dcdcd0] shadow-sm"
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mic className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : currentTheme.isDark ? "text-indigo-400" : "text-[#5A5A40]")} />
                              <span className={cn("text-sm font-bold", currentTheme.isDark ? "text-gray-200" : "text-gray-900")}>{tSettings.micTitle}</span>
                            </div>
                            <span className={cn(
                              "text-xs px-2.5 py-1 rounded-full font-bold uppercase border",
                              micPermission === 'granted'
                                ? currentTheme.isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : micPermission === 'denied'
                                  ? currentTheme.isDark ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-red-50 text-red-700 border-red-300"
                                  : currentTheme.isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-300"
                            )}>
                              {micPermission === 'granted' ? tSettings.micAllowed : micPermission === 'denied' ? tSettings.micBlocked : tSettings.tapToAsk}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ClipboardPaste className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : currentTheme.isDark ? "text-indigo-400" : "text-[#5A5A40]")} />
                              <span className={cn("text-sm font-bold", currentTheme.isDark ? "text-gray-200" : "text-gray-900")}>{tSettings.clipTitle}</span>
                            </div>
                            <span className={cn(
                              "text-xs px-2.5 py-1 rounded-full font-bold uppercase border",
                              clipboardPermission === 'granted'
                                ? currentTheme.isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : clipboardPermission === 'denied'
                                  ? currentTheme.isDark ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-red-50 text-red-700 border-red-300"
                                  : currentTheme.isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-300"
                            )}>
                              {clipboardPermission === 'granted' ? tSettings.micAllowed : clipboardPermission === 'denied' ? tSettings.micBlocked : tSettings.tapToAsk}
                            </span>
                          </div>
                        </div>

                        {/* Ask Permission Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                stream.getTracks().forEach(track => track.stop());
                              }
                              await checkPermissions();
                            } catch (e) {
                              console.warn('Microphone permission request not granted or unsupported:', e);
                              await checkPermissions();
                            }
                          }}
                          className={cn(
                            "w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                            isCyber
                              ? "bg-black border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff] hover:text-black shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                              : currentTheme.isDark
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-sm"
                                : "bg-[#5A5A40] text-white hover:bg-[#474732] border-transparent shadow-sm"
                          )}
                        >
                          {tSettings.triggerButtonText}
                        </button>
                      </div>

                      {/* Explanation Details */}
                      <div className={cn(
                        "p-4 rounded-xl border text-xs leading-relaxed space-y-4",
                        isCyber 
                          ? "bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]/80" 
                          : currentTheme.isDark 
                            ? "bg-black/20 border-white/5 text-gray-300" 
                            : "bg-[#f5f5f0] border-[#d8d8cc] text-[#2c2c2c] shadow-sm"
                      )}>
                        <div>
                          <p className={cn("font-bold mb-1 text-sm", currentTheme.isDark ? "text-amber-400" : "text-amber-800")}>
                            {tSettings.faqTitle}
                          </p>
                          <p className={cn("mb-2", currentTheme.isDark ? "text-gray-400" : "text-gray-700")}>
                            {tSettings.faqDesc}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className={cn("font-bold", currentTheme.isDark ? "text-gray-200" : "text-gray-900")}>{tSettings.solutionsTitle}</p>
                          <p className={cn("pl-3", currentTheme.isDark ? "text-gray-400" : "text-gray-700")}>
                            {tSettings.solution1}
                          </p>
                          <p className={cn("pl-3", currentTheme.isDark ? "text-gray-400" : "text-gray-700")}>
                            {tSettings.solution2}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tab Close: Permissions */}
                    <div className="pt-4 border-t border-black/10 dark:border-white/10">
                      <button
                        onClick={() => setIsSettingsOpen(false)}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 border text-xs sm:text-sm",
                          isCyber 
                            ? "border border-[#00f2ff]/40 text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                            : isBrutal
                              ? "border-2 border-black bg-white text-black font-bold hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              : currentTheme.isDark
                                ? "bg-white/10 text-white hover:bg-white/20 border-white/10"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
                        )}
                      >
                        {tSettings.close}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'updates' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <Download className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : "text-emerald-500")} />
                          <h4 className={cn(
                            "text-sm font-bold uppercase tracking-widest",
                            isCyber ? "text-[#00f2ff]" : currentTheme.isDark ? "text-white" : "text-gray-900"
                          )}>
                            {tSettings.appUpdatesTitle}
                          </h4>
                        </div>
                        <span className={cn(
                          "text-xs font-mono font-bold tabular-nums",
                          currentTheme.isDark ? "text-emerald-400" : "text-emerald-700"
                        )}>
                          v{APP_VERSION}
                        </span>
                      </div>

                      <div className={cn(
                        "p-4 rounded-xl border flex items-center justify-between gap-3",
                        isCyber ? "bg-black border-[#00f2ff]/30" : currentTheme.isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"
                      )}>
                        <div>
                          <div className="text-xs opacity-70">{tSettings.currentVersionLabel}</div>
                          <div className="text-base font-mono font-bold mt-0.5 tabular-nums">v{APP_VERSION}</div>
                        </div>
                        <button
                          type="button"
                          disabled={isCheckingUpdate}
                          onClick={async () => {
                            const savedRepo = setConfiguredGithubRepo(githubRepoInput)
                            setGithubRepoInput(savedRepo)
                            setIsCheckingUpdate(true)
                            setUpdateStatusMsg(null)
                            const info = await checkForGitHubUpdate(savedRepo)
                            setUpdateInfo(info)
                            setIsCheckingUpdate(false)
                            if (info.hasUpdate) {
                              setIsUpdateDialogOpen(true)
                            } else if (info.noReleasesYet) {
                              setUpdateStatusMsg(tSettings.noReleasesMsg)
                            } else if (info.error) {
                              setUpdateStatusMsg(tSettings.updateCheckFailed(info.error))
                            } else {
                              setUpdateStatusMsg(tSettings.upToDateMsg(APP_VERSION))
                            }
                          }}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 disabled:opacity-60",
                            isCyber
                              ? "bg-[#00f2ff] text-black hover:bg-[#00d8e6]"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          )}
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", isCheckingUpdate && "animate-spin")} />
                          <span>{isCheckingUpdate ? tSettings.checkingUpdates : tSettings.checkForUpdates}</span>
                        </button>
                      </div>

                      {updateStatusMsg && (
                        <div className={cn(
                          "p-3 rounded-xl border text-xs leading-relaxed",
                          currentTheme.isDark
                            ? "bg-white/5 border-white/10 text-gray-200"
                            : "bg-gray-50 border-gray-200 text-gray-800"
                        )}>
                          {updateStatusMsg}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className={cn(
                          "text-[10px] font-bold uppercase tracking-wider block",
                          isCyber ? "text-[#00f2ff]/60" : currentTheme.isDark ? "text-gray-400" : "text-gray-700 font-semibold"
                        )}>
                          {tSettings.githubRepoLabel}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={githubRepoInput}
                            onChange={(e) => setGithubRepoInput(e.target.value)}
                            placeholder="aungko00/me-translator"
                            className={cn(
                              "flex-1 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono focus:outline-none",
                              isCyber
                                ? "bg-black border-[#00f2ff]/50 text-[#00f2ff]"
                                : currentTheme.isDark
                                  ? "bg-white/5 border-white/10 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const saved = setConfiguredGithubRepo(githubRepoInput)
                              setGithubRepoInput(saved)
                              setUpdateStatusMsg(tSettings.repoSavedMsg)
                            }}
                            className={cn(
                              "px-3.5 py-2.5 rounded-xl border text-xs font-bold shrink-0 transition-colors",
                              isCyber
                                ? "border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff]/10"
                                : currentTheme.isDark
                                  ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                                  : "border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
                            )}
                          >
                            {tSettings.saveRepoBtn}
                          </button>
                        </div>
                        <p className="text-[11px] opacity-70 leading-relaxed">
                          {tSettings.githubRepoHint}
                        </p>
                      </div>

                      {!isRunningInsideCapacitor() && (
                        <div className={cn(
                          "p-4 rounded-xl border space-y-3",
                          isCyber ? "bg-[#00f2ff]/5 border-[#00f2ff]/25" : currentTheme.isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                        )}>
                          <div className="text-xs font-bold">{tSettings.exportZipTitle}</div>
                          <p className="text-[11px] leading-relaxed opacity-80">
                            {tSettings.exportZipDesc}
                          </p>
                          <a
                            href="/api/export-project"
                            download="ME-Translator-Android-GitHub.zip"
                            className={cn(
                              "w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                              isCyber
                                ? "bg-[#00f2ff] text-black hover:bg-[#00d8e6]"
                                : currentTheme.isDark
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-[#5A5A40] text-white hover:bg-[#474732]"
                            )}
                          >
                            <Download className="w-4 h-4" />
                            <span>{tSettings.exportZipBtn}</span>
                          </a>
                        </div>
                      )}

                      {!isInstalled && (isInstallable || isIOS) && (
                        <div className={cn(
                          "p-4 rounded-xl border space-y-3",
                          isCyber ? "bg-[#00f2ff]/5 border-[#00f2ff]/25" : currentTheme.isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                        )}>
                          <p className="text-xs leading-relaxed opacity-85">
                            {tSettings.installPwaDesc}
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              if (isInstallable) {
                                await triggerPwaInstall()
                              } else if (isIOS) {
                                setShowIosInstallGuide(true)
                              }
                            }}
                            className={cn(
                              "w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                              isCyber
                                ? "bg-[#00f2ff] text-black"
                                : currentTheme.isDark
                                  ? "bg-white/10 text-white hover:bg-white/20"
                                  : "bg-gray-900 text-white hover:bg-gray-800"
                            )}
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>{tSettings.installAndroidApp}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-black/10 dark:border-white/10">
                      <button
                        onClick={() => setIsSettingsOpen(false)}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 border text-xs sm:text-sm",
                          isCyber 
                            ? "border border-[#00f2ff]/40 text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                            : isBrutal
                              ? "border-2 border-black bg-white text-black font-bold hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              : currentTheme.isDark
                                ? "bg-white/10 text-white hover:bg-white/20 border-white/10"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
                        )}
                      >
                        {tSettings.close}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Missing API Key Warning Modal (Theme-Adaptive) */}
      <AnimatePresence>
        {isMissingKeyWarningOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMissingKeyWarningOpen(false)}
              className={cn(
                "absolute inset-0 backdrop-blur-md",
                isCyber ? "bg-black/85" : "bg-black/75"
              )}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-md p-6 rounded-2xl shadow-2xl overflow-hidden z-10",
                isCyber 
                  ? "bg-black border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.35)]" 
                  : isBrutal
                    ? "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none"
                    : isGlass
                      ? "bg-[#1a1c1e]/85 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.4)] text-white"
                      : theme === 'soft-minimal'
                        ? "bg-white border border-[#dcdcd0] text-[#333333] shadow-2xl"
                        : theme === 'dark'
                          ? "bg-[#0a0a0a] border border-white/20 text-white shadow-2xl"
                          : currentTheme.isDark
                            ? "bg-[#282828] border border-white/10 text-white shadow-2xl"
                            : "bg-white border-gray-200 text-gray-900 shadow-2xl"
              )}
            >
              {isCyber && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
              )}
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border",
                  isCyber 
                    ? "bg-amber-400/10 text-amber-400 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.3)]" 
                    : isBrutal
                      ? "bg-yellow-300 text-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : isGlass
                        ? "bg-amber-500/20 text-amber-400 border-amber-400/30"
                        : theme === 'soft-minimal'
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : theme === 'dark'
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : currentTheme.isDark
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                )}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <div className="space-y-2.5 w-full">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn(
                      "text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border",
                      isCyber
                        ? "bg-amber-400/10 text-amber-300 border-amber-400/30"
                        : isBrutal
                          ? "bg-black text-white border-black rounded-none"
                          : isGlass
                            ? "bg-white/10 text-amber-300 border-white/20"
                            : currentTheme.isDark
                              ? "bg-white/10 text-gray-300 border-white/10"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                    )}>
                      {stagedSettings.aiProvider === 'gemini' ? 'Google Gemini API' : 'Groq Cloud API'}
                    </span>
                  </div>

                  <h3 className={cn(
                    "text-base md:text-lg font-bold tracking-tight",
                    isCyber 
                      ? "text-amber-400 font-mono tracking-widest uppercase" 
                      : isBrutal
                        ? "text-black font-black uppercase text-base"
                        : isGlass
                          ? "text-white"
                          : theme === 'soft-minimal'
                            ? "text-[#333333]"
                            : theme === 'dark'
                              ? "text-white"
                              : currentTheme.isDark 
                                ? "text-white" 
                                : "text-gray-900"
                  )}>
                    {isCyber ? "ERROR: API_KEY_REQUIRED" : tSettings.warningTitle}
                  </h3>

                  <div className={cn(
                    "text-xs md:text-sm text-left p-3.5 rounded-xl border leading-relaxed space-y-2.5",
                    isCyber
                      ? "bg-black/60 border-amber-400/20 text-[#00f2ff]/90 font-mono"
                      : isBrutal
                        ? "bg-yellow-50 border-2 border-black text-black font-medium rounded-none"
                        : isGlass
                          ? "bg-white/5 border-white/10 text-white/80"
                          : theme === 'soft-minimal'
                            ? "bg-[#fafaf7] border-[#e0e0d5] text-[#444444]"
                            : theme === 'dark'
                              ? "bg-white/5 border-white/10 text-gray-300"
                              : currentTheme.isDark
                                ? "bg-white/5 border-white/10 text-gray-300"
                                : "bg-gray-50 border-gray-200 text-gray-700"
                  )}>
                    <p>
                      {tSettings.warningMissingKey(stagedSettings.aiProvider === 'gemini' ? 'Google Gemini' : 'Groq Cloud')}
                    </p>
                    <p className={cn(
                      "text-[11px] md:text-xs pt-1.5 border-t font-semibold",
                      isCyber ? "border-amber-400/20 text-amber-300" : isBrutal ? "border-black/20 text-red-600" : isGlass ? "border-white/10 text-amber-300" : "border-current/10 opacity-90"
                    )}>
                      {tSettings.warningRequirement}
                    </p>
                  </div>
                </div>

                <div className="w-full pt-2">
                  <button
                    onClick={() => setIsMissingKeyWarningOpen(false)}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm transition-all shadow-md",
                      isCyber 
                        ? "bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)] hover:bg-amber-300 font-mono" 
                        : isBrutal
                          ? "bg-[#ff3e00] text-white font-black border-2 border-black hover:bg-[#e63700] rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                          : isGlass
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 font-semibold"
                            : theme === 'soft-minimal'
                              ? "bg-[#5A5A40] text-white hover:bg-[#474732]"
                              : theme === 'dark'
                                ? "bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)] font-bold"
                                : currentTheme.isDark
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
                                  : "bg-[#5A5A40] text-white hover:bg-[#474732]"
                    )}
                  >
                    {tSettings.understood}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Apply Settings Confirmation Modal */}
      <AnimatePresence>
        {isApplyConfirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsApplyConfirmOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-sm p-6 rounded-2xl shadow-2xl overflow-hidden",
                isCyber 
                  ? "bg-black border-2 border-[#00f2ff] shadow-[0_0_30px_rgba(0,242,255,0.3)]" 
                  : isBrutal
                    ? "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none"
                    : isGlass
                      ? "bg-[#1a1c1e]/85 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.4)] text-white"
                      : theme === 'soft-minimal'
                        ? "bg-white border border-[#dcdcd0] text-[#333333] shadow-2xl"
                        : theme === 'dark'
                          ? "bg-[#0a0a0a] border border-white/20 text-white shadow-2xl"
                          : currentTheme.isDark
                            ? "bg-[#2f2f2f] border border-white/10"
                            : "bg-white border-[#dcdcd0] text-[#333333] shadow-2xl"
              )}
            >
              {isCyber && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent animate-pulse" />
              )}
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isCyber 
                    ? "bg-[#00f2ff]/10 text-[#00f2ff]" 
                    : isBrutal
                      ? "bg-[#00f2ff]/20 text-black border-2 border-black rounded-none"
                      : isGlass
                        ? "bg-indigo-500/20 text-indigo-400 border border-white/10"
                        : theme === 'dark'
                          ? "bg-white/10 text-white"
                          : currentTheme.isDark
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-[#5A5A40]/10 text-[#5A5A40]"
                )}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                
                <div className="space-y-2">
                  <h3 className={cn(
                    "text-lg font-bold uppercase tracking-widest",
                    isCyber ? "text-[#00f2ff]" : isBrutal ? "text-black font-black" : currentTheme.isDark ? "text-white" : "text-gray-900"
                  )}>
                    {isCyber ? "CONFIRM_OVERRIDE" : tSettings.applyChangesTitle}
                  </h3>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    isCyber ? "text-[#00f2ff]/70" : isBrutal ? "text-black/80 font-medium" : currentTheme.isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    {isCyber 
                      ? "Are you sure you want to apply these system modifications?" 
                      : tSettings.applyChangesDesc}
                  </p>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setIsApplyConfirmOpen(false)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all",
                      isCyber 
                        ? "border border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                        : isBrutal
                          ? "border-2 border-black bg-white text-black font-bold hover:bg-gray-100 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          : isGlass
                            ? "bg-white/10 text-white/80 hover:bg-white/20 border border-white/20"
                            : theme === 'dark'
                              ? "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10"
                              : currentTheme.isDark
                                ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    )}
                  >
                    {tSettings.cancel}
                  </button>
                  <button
                    onClick={applyStagedSettings}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all",
                      isCyber 
                        ? "bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.4)] hover:shadow-[0_0_25px_rgba(0,242,255,0.6)]" 
                        : isBrutal
                          ? "bg-black text-white font-bold border-2 border-black hover:bg-gray-800 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          : isGlass
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md font-semibold"
                            : theme === 'dark'
                              ? "bg-white text-black font-bold hover:bg-gray-200 shadow-md"
                              : currentTheme.isDark
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
                                : "bg-[#5A5A40] text-white hover:bg-[#474732] shadow-md"
                    )}
                  >
                    {tSettings.confirm}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App GitHub Update Dialog */}
      <AppUpdateDialog
        isOpen={isUpdateDialogOpen}
        updateInfo={updateInfo}
        lang={appLang}
        themeProps={{
          isCyber,
          isBrutal,
          isGlass,
          isDark: currentTheme.isDark,
        }}
        onClose={() => setIsUpdateDialogOpen(false)}
      />

      {/* iOS Safari Install Guide Modal */}
      <AnimatePresence>
        {showIosInstallGuide && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIosInstallGuide(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className={cn(
                "relative w-full max-w-sm p-5 rounded-2xl border shadow-2xl z-10 space-y-3",
                currentTheme.isDark ? "bg-[#202124] border-white/15 text-white" : "bg-white border-gray-200 text-gray-900"
              )}
            >
              <h3 className="text-base font-bold">{t.iosInstallTitle}</h3>
              <p className="text-xs leading-relaxed whitespace-pre-line opacity-85">
                {t.iosInstallSteps}
              </p>
              <button
                type="button"
                onClick={() => setShowIosInstallGuide(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                {t.close}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offline Status Indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-600/95 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>{t.offlineBanner}</span>
        </div>
      )}
    </div>
  )
}

export default Translator
