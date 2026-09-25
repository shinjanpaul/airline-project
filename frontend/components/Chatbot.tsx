'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import PilotRobot3D from './PilotRobot3D';

interface CardData {
  type?: string;
  flight_id?: number;
  flight_number?: string;
  flight_name?: string;
  origin?: string;
  origin_code?: string;
  destination?: string;
  destination_code?: string;
  route?: string;
  date?: string;
  time?: string;
  departure?: string;
  status?: string;
  seat_type?: string;
  seat_class_name?: string;
  seats_remaining?: number;
  badge?: string;
  price_upgrade?: string;
  unit_price?: string;
  total_price?: string;
  passenger_name?: string;
  ticket_number?: string;
  flights?: any[];
  price_difference?: string;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  card?: CardData;
  chips?: string[];
  status?: 'pending_confirmation' | 'success' | 'info' | 'error';
}

const PILOT_THOUGHTS = [
  "👋 Hello! I’m Aero Pilot, your AI flight assistant. How can I help?",
  "✈️ I’m keeping an eye on your upcoming journey...",
  "💺 Looking for extra space? I can check Business Class upgrades!",
  "🎫 Need me to verify your reservation or check seat availability?",
  "🧳 Wondering about baggage limits for your cabin class?",
  "🍽️ Curious about vegetarian & gourmet dining onboard?",
  "🔔 Everything looks normal with live flights. I’m monitoring status!",
  "⭐ Your Skyward Elite benefits are ready whenever you are.",
  "✨ Click me anytime for instant flight lookup & live assistance!"
];

export default function Chatbot() {
  const pathname = usePathname();

  // Hide AI robot and chatbot completely on register and login pages
  if (pathname && (pathname.includes('/login') || pathname.includes('/register'))) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello Shinjan! Welcome to Shinjan Aero Concierge. How can I assist with your travels today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      chips: ['Check SA-109 Status', 'Upgrade Seat', 'Baggage Allowance', 'In-Flight Menu']
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentThoughtText, setCurrentThoughtText] = useState('');
  const [isThoughtFaded, setIsThoughtFaded] = useState(false);
  const [isPilotTalking, setIsPilotTalking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: '1',
        sender: 'bot',
        text: 'Hello Shinjan! Welcome to **Shinjan Aero Concierge**. I am Aero Pilot, your personal AI travel assistant. Feel free to ask about live flights, seat upgrades, baggage policies, or check your reservation details anytime!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        chips: ['Check SA-109 Status', 'Upgrade Seat', 'Baggage Allowance', 'In-Flight Menu']
      }
    ]);
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className="font-bold text-[#0c1248]">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </span>
    );
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Typewriter effect for Aero Pilot Thoughts Cloud Bubble synchronized with mouth animation
  useEffect(() => {
    if (isOpen) {
      setIsPilotTalking(false);
      return;
    }

    let isMounted = true;
    let currentThoughtIndex = 0;
    let timer: NodeJS.Timeout;

    function typeThought(message: string, onComplete: () => void) {
      let charIdx = 0;
      setCurrentThoughtText('');
      setIsThoughtFaded(false);
      setIsPilotTalking(true);

      function typeNextChar() {
        if (!isMounted) return;
        if (charIdx < message.length) {
          setCurrentThoughtText(message.substring(0, charIdx + 1));
          charIdx++;
          timer = setTimeout(typeNextChar, 36);
        } else {
          // Allow mouth animation to continue briefly for natural cadence before returning smoothly to square shape
          timer = setTimeout(() => {
            if (!isMounted) return;
            setIsPilotTalking(false);
            onComplete();
          }, 350);
        }
      }
      typeNextChar();
    }

    function showNextThought() {
      if (!isMounted) return;
      const msg = PILOT_THOUGHTS[currentThoughtIndex];

      typeThought(msg, () => {
        timer = setTimeout(() => {
          if (!isMounted) return;
          setIsThoughtFaded(true);

          timer = setTimeout(() => {
            if (!isMounted) return;
            currentThoughtIndex = (currentThoughtIndex + 1) % PILOT_THOUGHTS.length;
            showNextThought();
          }, 650);
        }, 4000);
      });
    }

    showNextThought();

    return () => {
      isMounted = false;
      setIsPilotTalking(false);
      clearTimeout(timer);
    };
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string, customActionPayload?: any) => {
    const queryText = textToSend || input;
    if (!queryText.trim() && !customActionPayload) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText || (customActionPayload?.action === 'CONFIRM_BOOKING' ? 'Confirming booking...' : 'Selected Action'),
      timestamp: currentTime
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }

      const bodyData = customActionPayload ? { ...customActionPayload, message: queryText } : { message: queryText };

      let res;
      try {
        res = await fetch('/api/chat/', {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyData)
        });
      } catch (e) {
        res = await fetch('http://127.0.0.1:8000/api/chat/', {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyData)
        });
      }

      const data = await res.json();

      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || 'Certainly! I am happy to assist with your journey.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        card: data.card,
        chips: data.quick_chips || ['Check SA-109 Status', 'Upgrade Seat', 'Baggage Allowance', 'In-Flight Menu'],
        status: data.status
      };

      setMessages(prev => [...prev, botReply]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'I am experiencing a temporary connection issue. Please ensure the Django server is running on port 8000.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          chips: ['Try Again', 'Contact Support']
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChipClick = (chipText: string) => {
    if (chipText === 'Upgrade Seat' || chipText === 'Upgrade to First Class') {
      handleSendMessage(chipText, { action: 'INITIATE_BOOKING', flight_id: 8, seat_type: 'first' });
    } else {
      handleSendMessage(chipText);
    }
  };

  const handleInitiateBooking = (flightId: number, seatType: string) => {
    handleSendMessage(`Book Flight #${flightId} (${seatType})`, {
      action: 'INITIATE_BOOKING',
      flight_id: flightId,
      seat_type: seatType
    });
  };

  const handleConfirmBooking = (flightId: number, seatType: string) => {
    handleSendMessage('Yes, confirm my booking', {
      action: 'CONFIRM_BOOKING',
      flight_id: flightId,
      seat_type: seatType,
      seats: 1
    });
  };

  return (
    <div className="font-sans select-none">
      {/* Full-screen darkened and blurred backdrop behind chatbot */}
      <div
        id="chat-backdrop"
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 transition-opacity duration-300 bg-black/40 backdrop-blur-sm ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <style>{`
        @keyframes thoughtsCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .thoughts-cursor-blink {
          animation: thoughtsCursorBlink 0.85s infinite;
        }
        @keyframes thoughtsBeamPulse {
          0%, 100% { opacity: 0.75; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.15); }
        }
        .thoughts-beam-pulse {
          animation: thoughtsBeamPulse 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Standalone 3D Pilot Roblox Robot + Aero Pilot Thoughts Cloud Trigger */}
      {!isOpen && (
        <>
          {/* Aero Pilot Thoughts Bubble Container (Fully inside viewport at right-4 sm:right-6) */}
          <aside
            id="aero-pilot-thoughts"
            aria-label="Aero Pilot Thoughts"
            className="fixed bottom-[170px] right-4 sm:right-6 z-50 flex flex-col items-end pointer-events-none select-none w-[280px] sm:w-[300px] max-w-[calc(100vw-32px)]"
          >
            {/* THOUGHT CARD */}
            <div
              id="aero-pilot-thought-card"
              onClick={() => setIsOpen(true)}
              className={`pointer-events-auto w-full bg-slate-900/85 text-white backdrop-blur-2xl rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,10,50,0.45),0_0_25px_rgba(0,161,228,0.22)] ring-1 ring-cyan-400/40 border border-cyan-300/20 transition-all duration-300 cursor-pointer group hover:ring-cyan-300/70 hover:shadow-[0_24px_60px_rgba(0,161,228,0.3)] ${
                isThoughtFaded ? 'opacity-25 translate-y-1' : 'opacity-100 translate-y-0'
              }`}
            >
              {/* HEADER */}
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  {/* Pulsing status dot */}
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                  </div>

                  {/* TITLE */}
                  <span className="text-[10px] font-bold text-cyan-200 tracking-wide flex items-center gap-1">
                    ✦ Aero Pilot Thoughts
                  </span>

                  {/* AI BADGE */}
                  <span className="text-[8px] uppercase tracking-widest bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded-full border border-cyan-400/30">
                    AI PILOT
                  </span>
                </div>

                {/* CHAT ICON */}
                <div className="flex items-center gap-1 text-[10px] text-cyan-200/80">
                  <svg className="w-3.5 h-3.5 fill-current text-cyan-400 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
              </div>

              {/* TYPEWRITER MESSAGE (Explicit 2-line wrapping without clipping) */}
              <div className="py-0.5 min-h-[44px] flex items-center">
                <p className="text-xs font-medium text-white/95 leading-relaxed tracking-tight whitespace-normal break-words overflow-visible">
                  <span id="aero-thought-text" className="whitespace-normal break-words">{currentThoughtText}</span>
                  <span
                    id="aero-thought-cursor"
                    className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400 align-middle thoughts-cursor-blink shrink-0"
                  ></span>
                </p>
              </div>

              {/* FOOTER */}
              <div className="mt-1.5 flex items-center justify-between text-[9px] text-cyan-100/70 border-t border-white/5 pt-1.5">
                <span className="flex items-center gap-1 font-semibold group-hover:text-cyan-300 transition-colors">
                  <span>Click robot or bubble to chat</span>
                  <svg className="w-3 h-3 fill-current text-cyan-300" viewBox="0 0 24 24">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                  </svg>
                </span>

                <span className="font-mono text-[8px] text-cyan-300 uppercase tracking-wider">
                  Flight Active
                </span>
              </div>
            </div>

            {/* GLOWING CONNECTOR (Aligned over robot antenna at 96px from right viewport boundary) */}
            <div
              id="aero-thought-connector"
              className="w-full flex flex-col items-end pr-14 justify-center my-0.5 pointer-events-none relative h-6 shrink-0"
            >
              {/* horizontal glow */}
              <div className="w-10 h-1 bg-cyan-400/90 rounded-full blur-[2px]"></div>

              {/* vertical glowing beam */}
              <svg
                className="thoughts-beam-pulse overflow-visible"
                fill="none"
                width="16"
                height="20"
                viewBox="0 0 16 20"
              >
                <defs>
                  <linearGradient
                    id="aero-thought-beam-gradient"
                    x1="8"
                    y1="0"
                    x2="8"
                    y2="20"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#00a1e4" stopOpacity="1" />
                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                  </linearGradient>

                  <filter
                    id="aero-thought-beam-glow"
                    x="-4"
                    y="-4"
                    width="24"
                    height="28"
                  >
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                  </filter>
                </defs>

                <line
                  x1="8"
                  y1="1"
                  x2="8"
                  y2="19"
                  stroke="url(#aero-thought-beam-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#aero-thought-beam-glow)"
                />

                <line
                  x1="8"
                  y1="1"
                  x2="8"
                  y2="19"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />

                <circle cx="8" cy="1" r="2" fill="#00a1e4" />
                <circle cx="8" cy="19" r="2.5" fill="#10b981" />
              </svg>
            </div>
          </aside>

          {/* Standalone 3D Pilot Roblox Robot (UNTOUCHED POSITION & SIZE) */}
          <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
            <PilotRobot3D
              onClick={() => setIsOpen(true)}
              isTalking={isPilotTalking}
              className="w-36 h-40 drop-shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
            />
          </div>
        </>
      )}

      {/* Expandable Chatbot Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 ${isExpanded ? 'w-[480px] sm:w-[560px] h-[660px]' : 'w-[380px] sm:w-[410px] h-[580px]'} max-h-[88vh] bg-[#f8f9fc] rounded-3xl shadow-2xl border border-slate-300/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300`}>
          
          {/* Header Bar with 3D Pilot Avatar & Knox Control Buttons */}
          <div className="bg-[#10133a] border-b border-indigo-950 px-4 py-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 shrink-0 overflow-visible">
                <PilotRobot3D onClick={() => setIsOpen(false)} className="w-12 h-12 -top-1 -left-1" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#10133a]" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Aero Concierge</h3>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full uppercase">
                    AI LIVE
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">24/7 Executive Assistant</span>
              </div>
            </div>

            {/* Knox-style action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title="Reset Conversation"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title={isExpanded ? "Restore Normal View" : "Expand View"}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  {isExpanded ? (
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  ) : (
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  )}
                </svg>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
                title="Close"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Stream Body */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-[#f4f6fb]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
              >
                <div className={`flex items-start gap-2.5 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-[#e3e7f7] border border-indigo-200/60 flex items-center justify-center text-[#3a47c4] shrink-0 mt-0.5 shadow-sm">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                      </svg>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#0c1248] text-white rounded-2xl rounded-tr-none shadow-sm font-normal'
                          : 'bg-white text-[#1c2242] border border-slate-200/90 rounded-2xl rounded-tl-none font-normal shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{renderFormattedText(msg.text)}</p>
                    </div>

                    <span
                      className={`text-[10px] mt-1 font-medium ${
                        msg.sender === 'user' ? 'text-slate-400 text-right mr-1' : 'text-slate-400 text-left ml-1'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {/* Structured Cards */}
                {msg.card && (
                  <div className="ml-9 w-full max-w-[320px] my-1">
                    {/* UPGRADE OFFER CARD */}
                    {msg.card.type === 'upgrade_offer' && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                          <span className="font-bold text-[#0c1248]">{msg.card.flight_number} • {msg.card.route}</span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{msg.card.date}</span>
                        </div>
                        <div className="text-[11px] text-[#059669] font-medium bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md flex items-center gap-1">
                          {msg.card.badge}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 font-medium">Upgrade Difference:</span>
                          <span className="font-bold text-[#0c1248]">{msg.card.price_difference}</span>
                        </div>
                        <button
                          onClick={() => handleInitiateBooking(msg.card?.flight_id || 8, 'first')}
                          className="w-full py-2 bg-[#0c1248] hover:bg-indigo-900 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                        >
                          Select Upgrade
                        </button>
                      </div>
                    )}

                    {/* PENDING CONFIRMATION CARD */}
                    {msg.card.type === 'pending_confirmation' && (
                      <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between text-xs border-b border-amber-200/60 pb-2">
                          <span className="font-bold text-amber-900">Pending Confirmation</span>
                          <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-bold">Step 2 of 2</span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Flight:</span>
                            <span className="font-semibold text-slate-900">{msg.card.flight_number} ({msg.card.route})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Seat Class:</span>
                            <span className="font-semibold text-slate-900">{msg.card.seat_class_name}</span>
                          </div>
                          <div className="flex justify-between border-t border-amber-200/40 pt-1 mt-1">
                            <span className="text-slate-500 font-medium">Total Price:</span>
                            <span className="font-bold text-emerald-700 text-sm">{msg.card.total_price}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleConfirmBooking(msg.card?.flight_id!, msg.card?.seat_type!)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                          Confirm & Pay
                        </button>
                      </div>
                    )}

                    {/* CONFIRMED TICKET CARD */}
                    {(msg.card.type === 'ticket_confirmed' || msg.card.type === 'ticket_info') && (
                      <div className="bg-white border border-emerald-300 rounded-xl p-3.5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            {msg.card.ticket_number}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            {msg.card.status || 'CONFIRMED'}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Route:</span>
                            <span className="font-semibold text-slate-900">{msg.card.route}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Flight:</span>
                            <span className="font-semibold text-slate-900">{msg.card.flight_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Class:</span>
                            <span className="font-semibold text-slate-900">{msg.card.seat_class || msg.card.seat_type}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-1">
                            <span className="text-slate-500">Total Paid:</span>
                            <span className="font-bold text-emerald-700">{msg.card.total_price}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FLIGHT SEARCH RESULTS */}
                    {msg.card.type === 'flight_search_results' && msg.card.flights && (
                      <div className="space-y-2">
                        {msg.card.flights.map((f: any) => (
                          <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-indigo-400 transition">
                            <div className="flex items-center justify-between text-xs font-bold text-[#0c1248] mb-1">
                              <span>{f.flight_number} • {f.origin_code} → {f.destination_code}</span>
                              <span className="text-indigo-600 font-bold">{f.economy_price}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex justify-between mb-2">
                              <span>Dep: {f.departure}</span>
                              <span className="text-emerald-600 font-medium">{f.economy_available} Seats Left</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleInitiateBooking(f.id, 'economy')}
                                className="flex-1 py-1.5 bg-[#0c1248] hover:bg-indigo-900 text-white rounded-md text-[11px] font-semibold transition cursor-pointer"
                              >
                                Book Economy ({f.economy_price})
                              </button>
                              <button
                                onClick={() => handleInitiateBooking(f.id, 'business')}
                                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0c1248] border border-slate-300 rounded-md text-[11px] font-semibold transition cursor-pointer"
                              >
                                Business ({f.business_price})
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Suggestion Chips */}
                {msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-9 mt-1">
                    {msg.chips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChipClick(chip)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-[#0c1248] text-[#333e6b] hover:text-white border border-slate-200/90 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 ml-9">
                <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Section */}
          <div className="p-3 bg-[#f4f6fb] border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-white border border-slate-200/90 focus-within:border-indigo-500 rounded-full px-3.5 py-2 shadow-sm transition"
            >
              <svg className="w-4 h-4 text-slate-400 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about bookings, terminals, meals..."
                className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none flex-1 py-0.5"
              />

              <button
                type="submit"
                disabled={!input.trim()}
                className="w-7 h-7 bg-[#0c1248] hover:bg-indigo-900 disabled:opacity-30 disabled:hover:bg-[#0c1248] text-white rounded-full flex items-center justify-center transition cursor-pointer shadow-sm shrink-0"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
