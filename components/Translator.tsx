'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Languages, Trash2, Copy, Check, Info, Settings, X, Moon, Zap, Volume2, VolumeX, ChevronDown, Keyboard, Mic, MicOff, PlusCircle, AlertTriangle, Menu, MessageSquare, Eye, EyeOff, ClipboardPaste, XCircle, CheckCircle2, Shield, Sparkles, User } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sourceLang: string
  targetLang: string
}

type Theme = 'default' | 'cyberpunk' | 'soft-minimal' | 'light' | 'dark' | 'midnight' | 'glass-modern' | 'brutalist'
type FontStyle = 'sans' | 'mono' | 'display' | 'roboto' | 'open-sans' | 'lato' | 'montserrat' | 'playfair' | 'merriweather' | 'ubuntu' | 'poppins' | 'noto-myanmar'
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

const FONT_OPTIONS = [
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
  { id: 'noto-myanmar', name: 'Noto Sans Myanmar', class: 'font-noto-myanmar' },
]

const Translator = () => {
  const [input, setInput] = useState('')
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: 'initial', title: 'New Chat', messages: [], timestamp: new Date() }
  ])
  const [activeSessionId, setActiveSessionId] = useState('initial')
  const [isLoading, setIsLoading] = useState(false)
  const [sourceLang, setSourceLang] = useState('English')
  const [targetLang, setTargetLang] = useState('Myanmar')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [completedMessages, setCompletedMessages] = useState<Set<string>>(new Set())
  const [theme, setTheme] = useState<Theme>('default')
  const [fontStyle, setFontStyle] = useState<FontStyle>('sans')
  const [animation, setAnimation] = useState<AnimationType>('typing')
  const [soundType, setSoundType] = useState<SoundType>('Typing_1')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const [userApiKey, setUserApiKey] = useState('')
  const [userPassword, setUserPassword] = useState('')

  const updateStaged = (key: string, value: any) => {
    setStagedSettings(prev => ({ ...prev, [key]: value }))
  }

  const applyStagedSettings = () => {
    setTheme(stagedSettings.theme)
    setFontStyle(stagedSettings.fontStyle)
    setAnimation(stagedSettings.animation)
    setSoundType(stagedSettings.soundType)
    setSoundEnabled(stagedSettings.soundEnabled)
    setUserApiKey(stagedSettings.userApiKey)
    setUserPassword(stagedSettings.userPassword)
    
    setIsApplyConfirmOpen(false)
    setIsSettingsOpen(false)
  }

  const [stagedSettings, setStagedSettings] = useState({
    theme: 'default' as Theme,
    fontStyle: 'sans' as FontStyle,
    animation: 'typing' as AnimationType,
    soundType: 'Typing_1' as SoundType,
    soundEnabled: true,
    userApiKey: '',
    userPassword: ''
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [pasteError, setPasteError] = useState(false)
  
  const [activeSettingsTab, setActiveSettingsTab] = useState<'appearance' | 'audio' | 'api' | 'permissions'>('appearance')
  const [activeDropdown, setActiveDropdown] = useState<'animation' | 'sound' | 'theme' | 'font' | null>(null)
  
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
  }, [messages, isLoading, scrollToBottom, activeSessionId])

  useEffect(() => {
    if (isSettingsOpen) {
      setStagedSettings({
        theme,
        fontStyle,
        animation,
        soundType,
        soundEnabled,
        userApiKey,
        userPassword
      })
    }
  }, [isSettingsOpen, theme, fontStyle, animation, soundType, soundEnabled, userApiKey, userPassword])

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
    if (savedFontStyle) setFontStyle(savedFontStyle as FontStyle)

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

    const savedApiKey = localStorage.getItem('me_translator_user_api_key')
    if (savedApiKey) setUserApiKey(savedApiKey)

    const savedPassword = localStorage.getItem('me_translator_user_password')
    if (savedPassword) setUserPassword(savedPassword)
  }, [])

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('me_translator_sessions', JSON.stringify(sessions))
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

  useEffect(() => {
    localStorage.setItem('me_translator_user_api_key', userApiKey)
  }, [userApiKey])

  useEffect(() => {
    localStorage.setItem('me_translator_user_password', userPassword)
  }, [userPassword])

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

  const startListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.")
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = sourceLang === 'English' ? 'en-US' : 'my-MM'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please ensure you have allowed microphone access in your browser settings and that you are using a secure (HTTPS) connection.")
      } else if (event.error !== 'aborted') {
        alert(`Speech recognition error: ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
    } catch (err) {
      console.error("Failed to start recognition:", err)
      setIsListening(false)
    }
  }

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      sourceLang,
      targetLang
    }

    const updateSessionMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
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

    updateSessionMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setIsLoading(true)

    const MAX_RETRIES = 3
    let retryCount = 0
    let lastError: any = null

    const performTranslation = async (): Promise<{ text?: string; error?: string; type?: string }> => {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: currentInput,
            sourceLang,
            targetLang,
            apiKey: userApiKey.trim() || undefined,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          const errMessage = String(data?.error || data?.message || 'Translation failed').toLowerCase()
          return { error: errMessage, type: 'API_ERROR' }
        }

        if (!data.text) {
          return { error: "EMPTY_RESPONSE" }
        }
        return { text: data.text }
      } catch (error: any) {
        const errorStr = String(error?.message || error).toLowerCase()
        const isQuotaError = errorStr.includes("429") || errorStr.includes("resource_exhausted") || errorStr.includes("quota")
        
        if (isQuotaError && retryCount < MAX_RETRIES) {
          retryCount++
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return performTranslation()
        }
        return { error: errorStr }
      }
    }

    try {
      const result = await performTranslation()

      if (result.error) {
        const isUsingCustomKey = !!userApiKey.trim()
        const errorStr = result.error
        const isQuotaError = errorStr.includes("429") || errorStr.includes("resource_exhausted") || errorStr.includes("quota")
        const isAuthError = errorStr.includes("401") || errorStr.includes("403") || errorStr.includes("api_key_invalid") || errorStr.includes("invalid") || errorStr.includes("400") || errorStr.includes("api_key_missing")

        let errorMessage = "An error occurred during translation. Please check your connection and try again."

        if (isQuotaError) {
          if (isUsingCustomKey) {
            errorMessage = "⚠️ သင်ထည့်ထားတဲ့ API Key ရဲ့ Daily Quota (တစ်ရက်စာ ကန့်သတ်ချက်) ပြည့်သွားပါပြီ။ ခဏစောင့်ပြီးမှ ပြန်သုံးပေးပါ သို့မဟုတ် တခြား Key တစ်ခု ပြောင်းထည့်ပေးပါ။"
          } else {
            errorMessage = "⚠️ App ရဲ့ အခမဲ့ Quota ပြည့်သွားပါပြီ။ ဆက်လက်အသုံးပြုနိုင်ဖို့ Settings ထဲမှာ သင့်ရဲ့ ကိုယ်ပိုင် Gemini API Key ကို ထည့်သွင်းပေးပါ။"
          }
        } else if (isAuthError) {
          errorMessage = "⚠️ API Key မရှိသေးပါ (သို့မဟုတ်) မှားယွင်းနေပါသည်။ Settings ထဲတွင် သင့်ရဲ့ API Key ကို သေချာစွာ ပြန်လည်စစ်ဆေးပြီး ထည့်သွင်းပေးပါ။"
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          sourceLang,
          targetLang
        }
        updateSessionMessages(prev => [...prev, assistantMessage])
        return;
      }

      const translation = result.text || ""
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: translation,
        timestamp: new Date(),
        sourceLang,
        targetLang
      }

      updateSessionMessages(prev => [...prev, assistantMessage])
      
      // For non-typing animations, play a single sound at the start
      if (soundEnabled && animation !== 'typing' && animation !== 'typewriter') {
        playTypingSound()
      }
    } catch (error: any) {
      // This block should rarely be hit now as performTranslation returns errors
      console.warn("Outer translation error caught:", error)
    } finally {
      setIsLoading(false)
    }
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
      const newSession = { id: newId, title: 'New Chat', messages: [], timestamp: new Date() }
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
        const defaultSession = { id: newId, title: 'New Chat', messages: [], timestamp: new Date() }
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
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [], title: 'New Chat' } : s))
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
  const currentFont = FONT_OPTIONS.find(f => f.id === fontStyle) || FONT_OPTIONS[0]

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
      "flex flex-col h-screen transition-all duration-500 relative overflow-hidden",
      currentTheme.bg,
      currentTheme.text,
      currentFont.class
    )}>
      {/* Custom Scrollbar Styles for Webkit */}
      {currentTheme.isDark && (
        <style dangerouslySetInnerHTML={{ __html: `
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${isCyber ? '#00f2ff' : '#444'}; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: ${isCyber ? '#00f2ff' : '#666'}; }
        `}} />
      )}
      {!currentTheme.isDark && (
        <style dangerouslySetInnerHTML={{ __html: `
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #aaa; }
        `}} />
      )}
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
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "p-2 rounded-lg transition-all",
              isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-400 hover:bg-black/5"
            )}
            title="Settings"
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
                {isCyber ? "TERMINAL_READY" : "How can I help you translate?"}
              </h2>
              <p className={cn(
                "max-w-md transition-all duration-500",
                isCyber ? "text-[#00f2ff]/70 font-mono text-xs" : currentTheme.textMuted
              )}>
                {isCyber 
                  ? ">> SECURE_TRANSLATION_PROTOCOL_V2.0_ACTIVE\n>> WAITING_FOR_INPUT..." 
                  : "Translate between English and Myanmar with high accuracy. Type your text below to get started."}
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
                              <span>You</span>
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
                      
                      {/* Copy button - Always visible and more prominent */}
                      {(msg.role === 'user' || animation !== 'typing' || completedMessages.has(msg.id)) && (
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all flex items-center justify-center",
                            isCyber 
                              ? "text-[#00f2ff] bg-black border border-[#00f2ff] hover:shadow-[0_0_15px_#00f2ff] hover:bg-[#00f2ff] hover:text-black" 
                              : (currentTheme.isDark ? "text-gray-400 bg-white/5 hover:bg-white/10 border border-white/5" : "text-gray-500 bg-black/5 hover:bg-black/10 border border-black/5")
                          )}
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    <div className={cn(
                      "prose prose-invert max-w-none text-base leading-relaxed",
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
              {isLoading && (
                <div className="flex gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex-shrink-0 animate-pulse",
                    currentTheme.accent,
                    currentTheme.shadow
                  )} />
                  <div className="space-y-2 flex-1">
                    <div className={cn("h-4 rounded w-1/4 animate-pulse", currentTheme.input)} />
                    <div className={cn("h-4 rounded w-3/4 animate-pulse", currentTheme.input)} />
                    {isCyber && (
                      <div className="text-[10px] text-[#00f2ff] animate-pulse font-mono mt-2">
                        SYSTEM_PROCESSING_DATA...
                      </div>
                    )}
                  </div>
                </div>
              )}
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
          <form onSubmit={handleTranslate} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type in ${sourceLang}...`}
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
                title="Paste from clipboard"
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
                title="Voice input"
              >
                {isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-2 sm:p-3 rounded-xl transition-all duration-500 border",
                  input.trim() && !isLoading 
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
            <Info className="w-3 h-3" /> Gemini can make mistakes. Check important info.
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
                "fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 flex flex-col shadow-2xl border-r transition-colors duration-500",
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
                  {isCyber ? "SESSION_LOGS" : isGlass ? "CHATS" : isBrutal ? "LOGS" : "Chats"}
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-400 hover:bg-black/5"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <button 
                  onClick={createNewSession}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-500",
                    currentTheme.accent,
                    currentTheme.accentText,
                    currentTheme.accentHover,
                    isCyber && "shadow-[0_0_15px_#00f2ff] hover:shadow-[0_0_25px_#00f2ff]"
                  )}
                >
                  <PlusCircle className="w-5 h-5" />
                  New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                {sessions.map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => {
                      setActiveSessionId(session.id)
                      setIsSidebarOpen(false)
                    }}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300",
                      activeSessionId === session.id
                        ? (isCyber ? "bg-[#00f2ff]/10 border-[#00f2ff] text-[#00f2ff]" : cn(currentTheme.accent, currentTheme.accentText, "border-transparent"))
                        : (isCyber ? "bg-transparent border-transparent text-gray-400 hover:bg-[#00f2ff]/5 hover:text-[#00f2ff]" : cn("bg-transparent border-transparent", currentTheme.textMuted, "hover:bg-black/5 hover:text-current"))
                    )}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium truncate">
                      {session.title}
                    </span>
                    <button 
                      onClick={(e) => deleteSession(session.id, e)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all",
                        activeSessionId === session.id ? "text-white/70 hover:text-white hover:bg-white/10" : "text-red-500 hover:bg-red-500/10"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className={cn(
                "p-4 border-t text-[11px] font-mono text-center transition-all duration-500",
                currentTheme.border,
                isCyber ? "text-[#00f2ff] opacity-80" : cn(currentTheme.textMuted, "opacity-70")
              )}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold tracking-tighter">
                    {isCyber ? "SYSTEM_READY_V2.0" : isGlass ? "GLASS_OS_V2" : isBrutal ? "BRUTAL_V2" : "VERSION 2.0.0"}
                  </span>
                  <span className="text-[9px] opacity-60">
                    {isCyber ? "SECURE_PROTOCOL_ACTIVE" : isGlass ? "ATMOSPHERIC_SYNC_ON" : isBrutal ? "RAW_DATA_STREAM" : "SECURE_PROTOCOL_ACTIVE"}
                  </span>
                </div>
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
                    {isCyber ? "SYSTEM_CLEAR_CONFIRM" : "Clear History?"}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    isCyber ? "text-[#00f2ff]/70" : isGlass ? "text-white/70" : isBrutal ? "text-black/70" : "text-gray-400"
                  )}>
                    This will clear all current messages and reset your translation history. This action cannot be undone.
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
                    Cancel
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
                    Confirm
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
                    {isCyber ? "SYSTEM_OVERRIDE" : "Settings"}
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
                    { id: 'appearance', label: 'Appearance', icon: Eye },
                    { id: 'audio', label: 'Audio', icon: Volume2 },
                    { id: 'api', label: 'API', icon: Zap },
                    { id: 'permissions', label: 'Permissions', icon: Shield }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSettingsTab(tab.id as any)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300",
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
                    {/* Theme Section */}
                    <div className="space-y-2 relative">
                      <label className={cn(
                        "text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                        isCyber ? "text-[#00f2ff]" : cn(currentTheme.text, "opacity-90")
                      )}>
                        Theme Option
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
                              isCyber ? "bg-black border-[#00f2ff]" : "bg-[#383838] border-white/10"
                            )}
                          >
                            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                              {(Object.keys(THEME_CONFIG) as Theme[]).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => {
                                    updateStaged('theme', t)
                                    setActiveDropdown(null)
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                                    stagedSettings.theme === t 
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : "bg-emerald-500 text-white")
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-300 hover:bg-white/5")
                                  )}
                                >
                                  <span>{THEME_CONFIG[t].name}</span>
                                  {stagedSettings.theme === t && <Check className="w-4 h-4" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Font Style Section */}
                    <div className="space-y-2 relative">
                      <label className={cn(
                        "text-xs font-black uppercase tracking-[0.2em] transition-all duration-500",
                        isCyber ? "text-[#00f2ff]" : cn(currentTheme.text, "opacity-90")
                      )}>
                        Font Style
                      </label>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === 'font' ? null : 'font')}
                        className={cn(
                          "w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all",
                          isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] shadow-[inset_0_0_10px_rgba(0,242,255,0.1)]" : cn(currentTheme.bg, currentTheme.border, currentTheme.text)
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm sm:text-base", (FONT_OPTIONS.find(f => f.id === stagedSettings.fontStyle) || FONT_OPTIONS[0]).class)}>
                            {(FONT_OPTIONS.find(f => f.id === stagedSettings.fontStyle) || FONT_OPTIONS[0]).name}
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
                              isCyber ? "bg-black border-[#00f2ff]" : "bg-[#383838] border-white/10"
                            )}
                          >
                            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                              {FONT_OPTIONS.map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => {
                                    updateStaged('fontStyle', f.id as FontStyle)
                                    setActiveDropdown(null)
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                                    stagedSettings.fontStyle === f.id 
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : "bg-emerald-500 text-white")
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-300 hover:bg-white/5")
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
                        Output Animation
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
                              isCyber ? "bg-black border-[#00f2ff]" : "bg-[#383838] border-white/10"
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
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : "bg-emerald-500 text-white")
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-300 hover:bg-white/5")
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
                          Animation Sound
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
                          {stagedSettings.soundEnabled ? "On" : "Off"}
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
                              isCyber ? "bg-black border-[#00f2ff]" : "bg-[#383838] border-white/10"
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
                                      ? (isCyber ? "bg-[#00f2ff] text-black" : "bg-emerald-500 text-white")
                                      : (isCyber ? "text-[#00f2ff] hover:bg-[#00f2ff]/10" : "text-gray-300 hover:bg-white/5")
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
                      isCyber ? "bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]/70" : "bg-white/5 border-white/10 text-gray-400"
                    )}>
                      <Info className="w-5 h-5 flex-shrink-0" />
                      <p className="text-xs leading-relaxed">
                        Animations and sounds will trigger when a new translation arrives. Select a sound to hear a preview.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'api' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* API Key Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : "text-amber-500")} />
                        <h4 className={cn(
                          "text-sm font-bold uppercase tracking-widest",
                          isCyber ? "text-[#00f2ff]" : "text-white"
                        )}>
                          Custom Gemini API Key
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isCyber ? "text-[#00f2ff]/60" : "text-gray-500"
                          )}>
                            Gemini API Key
                          </label>
                          <div className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type={showApiKey ? "text" : "password"}
                                value={stagedSettings.userApiKey}
                                onChange={(e) => updateStaged('userApiKey', e.target.value)}
                                placeholder="Paste your API key here..."
                                className={cn(
                                  "w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-all focus:outline-none",
                                  isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]" : "bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-emerald-500"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                title={showApiKey ? "Hide Key" : "Show Key"}
                              >
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const text = await navigator.clipboard.readText();
                                    if (text) {
                                      updateStaged('userApiKey', text);
                                      setPasteError(false);
                                    }
                                  } catch (err) {
                                    console.error("Failed to paste:", err);
                                    setPasteError(true);
                                    setTimeout(() => setPasteError(false), 5000);
                                  }
                                }}
                                className={cn(
                                  "p-2.5 rounded-xl border transition-all",
                                  isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff]/10" : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                                )}
                                title="Paste from clipboard"
                              >
                                <ClipboardPaste className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStaged('userApiKey', "")}
                                className={cn(
                                  "p-2.5 rounded-xl border transition-all",
                                  isCyber ? "bg-black border-red-500 text-red-500 hover:bg-red-500/10" : "bg-white/5 border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                )}
                                title="Clear Key"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {pasteError && (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[10px] text-amber-500 font-medium mt-1"
                            >
                              ⚠️ Browser က direct paste လုပ်ခွင့် မပေးထားပါ။ Keyboard က Ctrl+V (သို့မဟုတ်) ဖုန်းမှာဆိုရင် Long Press လုပ်ပြီး Paste လုပ်ပေးပါ။
                            </motion.p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isCyber ? "text-[#00f2ff]/60" : "text-gray-500"
                          )}>
                            Security Password (Optional)
                          </label>
                          <div className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={stagedSettings.userPassword}
                                onChange={(e) => updateStaged('userPassword', e.target.value)}
                                placeholder="Enter a password..."
                                className={cn(
                                  "w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-all focus:outline-none",
                                  isCyber ? "bg-black border-[#00f2ff] text-[#00f2ff] focus:ring-1 focus:ring-[#00f2ff]" : "bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-emerald-500"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                title={showPassword ? "Hide Password" : "Show Password"}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateStaged('userPassword', "")}
                              className={cn(
                                "p-2.5 rounded-xl border transition-all",
                                isCyber ? "bg-black border-red-500 text-red-500 hover:bg-red-500/10" : "bg-white/5 border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                              )}
                              title="Clear Password"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className={cn(
                          "p-3 rounded-xl border text-[11px] leading-relaxed",
                          isCyber ? "bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]/70" : "bg-black/20 border-white/5 text-gray-400"
                        )}>
                          <p className="font-bold mb-1 text-amber-500">💡 API Key လမ်းညွှန် - ဘယ် Key ကို ယူရမလဲ?</p>
                          <p className="mb-2">
                            Google AI Studio မှာ Key ယူတဲ့အခါ <strong>&quot;Gemini 1.5 Flash&quot;</strong> (သို့မဟုတ်) <strong>&quot;Gemini 1.5 Pro&quot;</strong> ဆိုတဲ့ နာမည်နဲ့ Key ကို ယူပါ။ 
                            အဲဒါက အခု App မှာ သုံးထားတဲ့ Free Tier Key အစစ်အမှန် ဖြစ်ပါတယ်။ တခြား နာမည်တွေနဲ့ Key တွေက အလုပ်မလုပ်တာမျိုး ဖြစ်နိုင်ပါတယ်။
                          </p>
                          <p className="mb-2">
                            🔗 <strong>API Key ယူရန် Link:</strong> <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">aistudio.google.com/app/apikey</a>
                          </p>
                          <div className="pt-2 border-t border-white/5">
                            <p className="font-bold text-emerald-500 mb-1">📊 Daily Limit အကြောင်း</p>
                            <p>
                              API Key မထည့်ဘဲ အသုံးပြုပါက တစ်ရက်လျှင် <strong>မေးခွန်း ၁,၅၀၀ (1,500 requests per day)</strong> အထိသာ အသုံးပြုနိုင်ပါသည်။ 
                              တစ်မိနစ်လျှင် ၁၅ ကြိမ် (15 RPM) ထက် ပိုမေးပါကလည်း ခေတ္တစောင့်ဆိုင်းရနိုင်ပါသည်။
                            </p>
                          </div>
                        </div>
                      </div>
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
                        <Shield className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : "text-emerald-500")} />
                        <h4 className={cn(
                          "text-sm font-bold uppercase tracking-widest",
                          isCyber ? "text-[#00f2ff]" : "text-white"
                        )}>
                          Device & System Permissions
                        </h4>
                      </div>

                      {/* Current Status List */}
                      <div className="space-y-3">
                        <div className={cn(
                          "p-4 rounded-xl border flex flex-col gap-3 transition-all",
                          isCyber ? "bg-black border-[#00f2ff]/30" : "bg-white/5 border-white/10"
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mic className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : "text-indigo-400")} />
                              <span className="text-sm font-bold text-gray-200">Microphone (အသံသွင်းခွင့်ပြုချက်)</span>
                            </div>
                            <span className={cn(
                              "text-xs px-2.5 py-1 rounded-full font-bold uppercase border",
                              micPermission === 'granted'
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : micPermission === 'denied'
                                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            )}>
                              {micPermission === 'granted' ? 'Allowed' : micPermission === 'denied' ? 'Blocked' : 'Tap to Ask'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ClipboardPaste className={cn("w-4 h-4", isCyber ? "text-[#00f2ff]" : "text-indigo-400")} />
                              <span className="text-sm font-bold text-gray-200">Clipboard Paste (ကူးယူစာသားဖတ်ခွင့်)</span>
                            </div>
                            <span className={cn(
                              "text-xs px-2.5 py-1 rounded-full font-bold uppercase border",
                              clipboardPermission === 'granted'
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : clipboardPermission === 'denied'
                                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            )}>
                              {clipboardPermission === 'granted' ? 'Allowed' : clipboardPermission === 'denied' ? 'Blocked' : 'Tap to Ask'}
                            </span>
                          </div>
                        </div>

                        {/* Ask Permission Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.mediaDevices.getUserMedia({ audio: true });
                              checkPermissions();
                            } catch (e) {
                              console.error('Failed to trigger micro permission prompt', e);
                            }
                          }}
                          className={cn(
                            "w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                            isCyber
                              ? "bg-black border-[#00f2ff] text-[#00f2ff] hover:bg-[#00f2ff] hover:text-black shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                              : "bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-sm"
                          )}
                        >
                          Trigger Permission Prompt (ခွင့်ပြုချက် တောင်းခံမည်)
                        </button>
                      </div>

                      {/* Explanation Details */}
                      <div className={cn(
                        "p-4 rounded-xl border text-xs leading-relaxed space-y-4",
                        isCyber ? "bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]/80" : "bg-black/20 border-white/5 text-gray-300"
                      )}>
                        <div>
                          <p className="font-bold mb-1 text-amber-500 text-sm">💡 Permission Modal အမြဲတမ်း ပေါ်မနေအောင် ဘယ်လိုလုပ်ရမလဲ?</p>
                          <p className="mb-2 text-gray-400">
                            Google AI Studio Preview (iframe) ၏ လုံခြုံရေးမူဝါဒအရ page load လုပ်တိုင်း သို့မဟုတ် reload လုပ်တိုင်း Microphone နှင့် Clipboard သုံးစွဲခွင့်ကို အတည်ပြုရန် &quot;Access request&quot; (ခွင့်ပြုချက်တောင်းခံလွှာ) ထပ်ကာထပ်ကာ တောင်းလေ့ရှိသည်။
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-gray-200">ဖြေရှင်းနည်း (Solutions):</p>
                          <p className="text-gray-400 pl-3">
                            ၁။ <strong>Open in New Tab</strong> (ညာဘက်အပေါ်ထောင့်ရှိ Browser icon သို့မဟုတ် tab အသစ်) ဖြင့် ဖွင့်သုံးပါ။ (ဤသို့သုံးစွဲပါက ၎င်း modal ပေါ်တော့မည်မဟုတ်ဘဲ browser ၏ ပုံမှန်ခွင့်ပြုချက်ဖြင့် အလုပ်လုပ်မည်ဖြစ်သည်)
                          </p>
                          <p className="text-gray-400 pl-3">
                            ၂။ Browser ၏ URL bar ဘယ်ဘက်ခြမ်းရှိ 🔒 (Lock key / settings) ကိုနှိပ်ပြီး Microphone နှင့် Clipboard ကို <strong>Allow (အမြဲတမ်းခွင့်ပြုသည်)</strong> ဟု သတ်မှတ်ပေးထားပါ။
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="mt-8">
                <button
                  onClick={() => setIsApplyConfirmOpen(true)}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold uppercase tracking-widest transition-all duration-500 border",
                    isCyber 
                      ? "bg-[#00f2ff] text-black shadow-[0_0_25px_rgba(0,242,255,0.6)] border-[#00f2ff] hover:bg-black hover:text-[#00f2ff]" 
                      : "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-lg"
                  )}
                >
                  Apply Changes
                </button>
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
                  : "bg-[#2f2f2f] border border-white/10"
              )}
            >
              {isCyber && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent animate-pulse" />
              )}
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isCyber ? "bg-[#00f2ff]/10 text-[#00f2ff]" : "bg-emerald-500/10 text-emerald-500"
                )}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                
                <div className="space-y-2">
                  <h3 className={cn(
                    "text-lg font-bold uppercase tracking-widest",
                    isCyber ? "text-[#00f2ff]" : "text-white"
                  )}>
                    {isCyber ? "CONFIRM_OVERRIDE" : "Apply Changes?"}
                  </h3>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    isCyber ? "text-[#00f2ff]/70" : "text-gray-400"
                  )}>
                    {isCyber 
                      ? "Are you sure you want to apply these system modifications?" 
                      : "Do you want to save and apply your new settings?"}
                  </p>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setIsApplyConfirmOpen(false)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all",
                      isCyber 
                        ? "border border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff]/10" 
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyStagedSettings}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all",
                      isCyber 
                        ? "bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.4)] hover:shadow-[0_0_25px_rgba(0,242,255,0.6)]" 
                        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg"
                    )}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Translator
