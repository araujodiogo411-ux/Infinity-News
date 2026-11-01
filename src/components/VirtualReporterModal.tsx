import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Volume2, 
  Mic, 
  MicOff, 
  User, 
  RefreshCw,
  MessageSquare,
  Bot,
  Radio,
  VolumeX,
  AudioWaveform,
  CheckCircle2,
  TrendingUp,
  Globe
} from 'lucide-react';
import { NewsArticle } from '../types/news';
import { FifineMascot3D } from './FifineMascot3D';

interface VirtualReporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArticle?: NewsArticle | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const WORLD_TOPICS_QUESTIONS = [
  'Quantas criptomoedas existem no mundo hoje?',
  'Qual a cotação real do Dólar e do Euro agora?',
  'O que está acontecendo em Pernambuco e em São Paulo?',
  'Como está a preservação da Floresta Amazônica?',
  'Quais as principais notícias globais de hoje?'
];

export const VirtualReporterModal: React.FC<VirtualReporterModalProps> = ({
  isOpen,
  onClose,
  currentArticle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isSpeakingFifine, setIsSpeakingFifine] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordIntervalRef = useRef<any>(null);

  // Initialize designated unique Brazilian voice
  const speakWithFifineVoice = (text: string, msgId: string) => {
    // If already playing audio, stop
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    if (playingAudioId === msgId && isSpeakingFifine) {
      setIsSpeakingFifine(false);
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(msgId);
    setIsSpeakingFifine(true);

    if ('speechSynthesis' in window) {
      const cleanText = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.04;
      utterance.pitch = 1.02;

      // Find best available Brazilian voice
      const voices = window.speechSynthesis.getVoices();
      const ptBrVoice = voices.find(v => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Felipe') || v.name.includes('Brazil')))
        || voices.find(v => v.lang.startsWith('pt'));

      if (ptBrVoice) {
        utterance.voice = ptBrVoice;
      }

      utterance.onend = () => {
        setIsSpeakingFifine(false);
        setPlayingAudioId(null);
      };

      utterance.onerror = () => {
        setIsSpeakingFifine(false);
        setPlayingAudioId(null);
      };

      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback to server-side TTS
      fetchServerTts(text, msgId);
    }
  };

  const fetchServerTts = async (text: string, msgId: string) => {
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 450) }),
      });
      const data = await res.json();
      if (data.success && data.audioData && audioPlayerRef.current) {
        audioPlayerRef.current.src = data.audioData;
        audioPlayerRef.current.play();
        setPlayingAudioId(msgId);
        setIsSpeakingFifine(true);
      }
    } catch (e) {
      console.warn('TTS error', e);
      setIsSpeakingFifine(false);
      setPlayingAudioId(null);
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText = currentArticle 
        ? `Olá! Sou o Fifine (F-I-N-I-F-I), seu repórter com inteligência artificial no INFINITY! Estou cobrindo a matéria "${currentArticle.title}". Além disso, você pode me perguntar qualquer assunto do mundo real: economia, quantidade de criptomoedas no planeta, notícias de Pernambuco, São Paulo, tecnologia ou geopolítica. Você pode falar comigo por voz no microfone ou digitar!`
        : 'Olá! Sou o Fifine (F-I-N-I-F-I), o repórter virtual e mascote oficial do portal INFINITY! Acompanho em tempo real todos os acontecimentos do Brasil e do mundo, cotações reais, criptomoedas e ciência. Pode me perguntar qualquer coisa por texto ou mandar áudio pelo microfone!';

      const welcome: ChatMessage = {
        id: 'msg-welcome',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcome]);
      // Speak greeting
      setTimeout(() => speakWithFifineVoice(welcomeText, 'msg-welcome'), 600);
    }
  }, [isOpen, currentArticle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean speech synthesis on close
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          articleTitle: currentArticle?.title || 'Notícias Gerais e Conhecimento do Mundo',
          articleContext: currentArticle 
            ? currentArticle.paragraphs?.slice(0, 3).join(' ') 
            : 'Portal INFINITY de notícias e dados em tempo real',
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const msgId = `bot-${Date.now()}`;
        const assistantMsg: ChatMessage = {
          id: msgId,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
        // Automatically speak Fifine's answer with designated voice
        setTimeout(() => speakWithFifineVoice(data.reply, msgId), 300);
      } else {
        throw new Error(data.message || 'Falha ao responder');
      }
    } catch (err: any) {
      console.error(err);
      const fallbackId = `bot-fallback-${Date.now()}`;
      const fallbackText = `Olá! Sou o Fifine. Sobre "${query}", nossa redação identificou dados importantes a respeito desse tema. Posso detalhar o panorama no Brasil e no cenário internacional!`;
      const fallbackMsg: ChatMessage = {
        id: fallbackId,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
      speakWithFifineVoice(fallbackText, fallbackId);
    } finally {
      setIsLoading(false);
    }
  };

  // User Voice Audio Recording
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não possui suporte ao microfone para reconhecimento de voz.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        setRecordingSeconds(0);
        recordIntervalRef.current = setInterval(() => {
          setRecordingSeconds(s => s + 1);
        }, 1000);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
        if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const latestAssistantMessage = [...messages].reverse().find(m => m.sender === 'assistant');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <audio
        ref={audioPlayerRef}
        onEnded={() => {
          setIsSpeakingFifine(false);
          setPlayingAudioId(null);
        }}
        onPause={() => {
          setIsSpeakingFifine(false);
          setPlayingAudioId(null);
        }}
      />

      <div className="bg-[#0f172a] rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col h-[90vh] overflow-hidden border border-blue-500/30 text-white my-auto">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 px-5 py-3.5 flex items-center justify-between border-b border-red-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C4170C] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 font-black">
              F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>Repórter IA Fifine</span>
                  <span className="text-[10px] text-amber-300 font-mono tracking-widest bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                    VOZ DEDICADA • F I N I F I
                  </span>
                </h3>
                <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Mascote 3D e correspondente oficial do INFINITY para fatos reais do Brasil e do mundo.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              onClose();
            }}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Article Banner if available */}
        {currentArticle && (
          <div className="bg-red-950/60 border-b border-red-900/40 px-4 py-2 text-xs text-red-200 flex items-center justify-between">
            <span className="truncate font-medium flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Matéria em pauta: <strong className="text-white">{currentArticle.title}</strong></span>
            </span>
            <span className="text-[10px] bg-red-600/40 text-red-200 px-2 py-0.5 rounded-full font-bold shrink-0 ml-2 border border-red-500/40">
              Contexto Ativo
            </span>
          </div>
        )}

        {/* MAIN BODY: Large Mascot Column + Chat Column (Side-by-side) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* LEFT: LARGE FIFINE 3D MASCOT STAGE (User requirement: Mascote grande do lado, não no quadradinho!) */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-900 via-[#131b2e] to-slate-950 border-r border-slate-800/80 p-4 sm:p-6 flex flex-col items-center justify-between relative overflow-hidden">
            
            {/* Ambient Stage Lights */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Mascot Status Badge */}
            <div className="w-full flex items-center justify-between text-xs text-slate-300 z-10">
              <span className="flex items-center gap-1.5 font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Mascote 3D em Tempo Real
              </span>
              {isSpeakingFifine ? (
                <span className="bg-red-500/30 text-red-300 border border-red-500/40 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                  <Volume2 className="w-3 h-3" />
                  Falando agora...
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Pronto para falar</span>
              )}
            </div>

            {/* LARGE 3D FIFINE MASCOT (xl size) */}
            <div className="relative my-2 sm:my-auto flex flex-col items-center justify-center">
              <FifineMascot3D isTalking={isSpeakingFifine || isLoading} size="xl" />

              {/* Speech waves physically emerging from mouth when talking */}
              {isSpeakingFifine && (
                <div className="absolute top-1/4 right-2 sm:right-6 flex flex-col items-center gap-1 pointer-events-none">
                  <div className="w-6 h-6 rounded-full border-2 border-cyan-400 animate-ping opacity-80" />
                  <div className="w-10 h-10 rounded-full border-2 border-red-400 animate-ping opacity-60 delay-100" />
                  <span className="text-[9px] font-black text-cyan-300 tracking-wider uppercase mt-1 bg-black/60 px-2 py-0.5 rounded-full">
                    Voz de Fifine
                  </span>
                </div>
              )}

              {/* Pedestal Shadow / Floor glow */}
              <div className="w-44 h-5 bg-black/50 rounded-full blur-md -mt-4 shadow-2xl" />
            </div>

            {/* Speech bubble tail pointer pointing straight to Fifine's mouth */}
            <div className="w-full z-10 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 text-xs shadow-xl relative">
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400">
                <span className="font-bold text-white flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-red-500" />
                  Fala de Fifine (Ao Vivo):
                </span>
                {isSpeakingFifine && (
                  <button
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setIsSpeakingFifine(false);
                      setPlayingAudioId(null);
                    }}
                    className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <VolumeX className="w-3 h-3" />
                    Pausar
                  </button>
                )}
              </div>
              <p className="text-white text-xs line-clamp-3 leading-relaxed italic">
                "{latestAssistantMessage?.text || 'Olá! Estou pronto para responder tudo sobre o mundo!'}"
              </p>
            </div>

          </div>

          {/* RIGHT: CHAT MESSAGES & REAL-TIME AUDIO CONTROLS */}
          <div className="md:col-span-7 flex flex-col h-full bg-[#0b132b]/80">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#C4170C] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md font-black text-xs border border-white/30">
                      F
                    </div>
                  )}

                  {/* SPEECH BUBBLE WITH PROPER TAIL EMERGING FROM FIFINE */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-900 text-slate-100 border border-slate-700/80 rounded-tl-none shadow-lg'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-700/50 text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>

                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => speakWithFifineVoice(msg.text, msg.id)}
                          className={`flex items-center space-x-1 font-bold cursor-pointer ml-3 px-2.5 py-1 rounded-lg border transition ${
                            playingAudioId === msg.id && isSpeakingFifine
                              ? 'bg-red-600 text-white border-red-500 animate-pulse'
                              : 'bg-slate-800 text-cyan-300 border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Ouvir Fifine falando com sua voz própria"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>
                            {playingAudioId === msg.id && isSpeakingFifine ? 'Fifine falando...' : 'Ouvir Voz'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center space-x-3 text-xs text-white bg-slate-900/90 p-4 rounded-2xl w-fit border border-slate-700 shadow-md animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                  <span>O Repórter Fifine está pesquisando e formulando a resposta com voz...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions for Real-World Questions */}
            <div className="bg-slate-950/80 px-4 py-2 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                Temas Reais:
              </span>
              {WORLD_TOPICS_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="text-[11px] whitespace-nowrap bg-slate-900 hover:bg-red-950/70 hover:text-white text-slate-300 px-3 py-1 rounded-full border border-slate-800 hover:border-red-500/40 transition cursor-pointer font-medium"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Audio Recording Bar & Input Bar */}
            <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4">
              
              {isListening && (
                <div className="mb-2 bg-red-950/80 border border-red-600/50 rounded-xl p-2.5 flex items-center justify-between text-xs text-red-200 animate-pulse">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-bold">Gravando áudio para o Fifine... ({recordingSeconds}s)</span>
                  </div>
                  <span className="text-[11px] text-red-300 font-mono">Fale agora no microfone</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                {/* Microfone para mandar áudio */}
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-center ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/40 ring-2 ring-red-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                  }`}
                  title={isListening ? 'Parar gravação' : 'Mandar áudio por voz'}
                >
                  {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening 
                      ? 'Escutando sua voz...' 
                      : 'Pergunte qualquer coisa do mundo para o Fifine...'
                  }
                  className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />

                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-3 rounded-2xl shadow-lg transition cursor-pointer disabled:opacity-40"
                  title="Enviar mensagem"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
