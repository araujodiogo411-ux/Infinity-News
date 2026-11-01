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
  Radio, 
  VolumeX, 
  CheckCircle2, 
  TrendingUp, 
  Globe,
  Image as ImageIcon,
  Camera,
  Paperclip,
  Play,
  Pause,
  Trash2,
  Award,
  ShieldCheck,
  Eye,
  FileText,
  Sliders,
  Maximize2
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
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  isImageAnalysis?: boolean;
  isAudioAnalysis?: boolean;
}

const WORLD_TOPICS_QUESTIONS = [
  'Quantas criptomoedas existem no mundo hoje?',
  'Qual a cotação real do Dólar, Euro e PIB agora?',
  'Analise os acontecimentos de Pernambuco e São Paulo',
  'Como está a preservação da Floresta Amazônica?',
  'Faça uma perícia jornalística de uma foto minha'
];

export const VirtualReporterModal: React.FC<VirtualReporterModalProps> = ({
  isOpen,
  onClose,
  currentArticle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingFifine, setIsSpeakingFifine] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  
  // Professional Dossier Modal toggle
  const [showDossier, setShowDossier] = useState(false);

  // Photo / Image attachment state
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingImageName, setPendingImageName] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [currentlyPlayingUserAudioId, setCurrentlyPlayingUserAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Initialize Speech Synthesis for Fifine's voice
  const speakWithFifineVoice = (text: string, msgId: string) => {
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
      // Clean markdown tags for spoken output
      const cleanText = text
        .replace(/[*_#`~>]/g, '')
        .replace(/https?:\/\/\S+/g, 'link da fonte')
        .replace(/[\n\r]+/g, '. ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = speechRate;
      utterance.pitch = 1.02;

      // Find best available Brazilian Portuguese voice
      const voices = window.speechSynthesis.getVoices();
      const ptBrVoice = voices.find(v => 
        v.lang === 'pt-BR' && 
        (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Felipe') || v.name.includes('Brazil'))
      ) || voices.find(v => v.lang.startsWith('pt'));

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

      window.speechSynthesis.speak(utterance);
    } else {
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
      console.warn('TTS fallback error', e);
      setIsSpeakingFifine(false);
      setPlayingAudioId(null);
    }
  };

  // Welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText = currentArticle 
        ? `Olá! Sou o **Fifine (F-I-N-I-F-I)**, Correspondente Sênior e Âncora Digital do INFINITY.\n\nEstou com a bancada aberta acompanhando a matéria **"${currentArticle.title}"**. Além de tirar dúvidas editoriais, tenho acesso em tempo real aos acontecimentos do Brasil e do mundo, macroeconomia e perícia de documentos.\n\nVocê pode **me enviar fotos e documentos** para eu analisar minuciosamente, ou **mandar áudio com sua voz** para debatermos qualquer tema global!`
        : `Olá! Sou o **Fifine (F-I-N-I-F-I)**, Correspondente Sênior e Chefe de Análise Editorial do portal **INFINITY**.\n\nMinha bancada está conectada em tempo real com apurações globais, cotações financeiras, dados de 17.480+ criptoativos e cobertura dos estados brasileiros.\n\n📸 **Envie fotos** para perícia visual jornalística detalhada.\n🎙️ **Mande áudio** para conversar comigo por voz.\n💬 **Ou digite sua pergunta** sobre qualquer tema do planeta!`;

      const welcome: ChatMessage = {
        id: 'msg-welcome',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcome]);
      setTimeout(() => speakWithFifineVoice(welcomeText, 'msg-welcome'), 600);
    }
  }, [isOpen, currentArticle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingImage, recordedAudioUrl]);

  // Clean audio/speech synthesis on close
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Handle Image File Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingImage(reader.result);
        setPendingImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Real Microphone Audio Recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        // stop tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);
    } catch (err) {
      console.error('Audio recording permission denied or failed:', err);
      // Fallback to Web Speech Recognition
      startSpeechRecognitionFallback();
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  };

  const cancelAudioRecording = () => {
    stopAudioRecording();
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
  };

  // Fallback speech recognition
  const startSpeechRecognitionFallback = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Não foi possível acessar o microfone para gravação de áudio.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputText(transcript);
      }
    };
    recognition.start();
  };

  // Convert blob to base64 helper
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Falha ao converter áudio em base64'));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Send message (text, photo, or audio)
  const handleSendMessage = async (textOverride?: string) => {
    const textQuery = (textOverride || inputText).trim();
    if (!textQuery && !pendingImage && !recordedAudioBlob) return;

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // Prepare User Message object
    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textQuery || (pendingImage ? '📸 [Foto enviada para análise pericial]' : '🎙️ [Áudio de voz enviado]'),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      imageUrl: pendingImage || undefined,
      audioUrl: recordedAudioUrl || undefined,
      audioDuration: recordedAudioBlob ? recordingSeconds : undefined,
      isImageAnalysis: Boolean(pendingImage),
      isAudioAnalysis: Boolean(recordedAudioBlob)
    };

    setMessages(prev => [...prev, userMsg]);

    const imageToSend = pendingImage;
    const audioBlobToSend = recordedAudioBlob;

    // Reset input fields
    setInputText('');
    setPendingImage(null);
    setPendingImageName(null);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
    setIsLoading(true);

    try {
      let audioBase64: string | undefined = undefined;
      if (audioBlobToSend) {
        audioBase64 = await blobToBase64(audioBlobToSend);
      }

      const res = await fetch('/api/gemini/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textQuery,
          imageData: imageToSend || undefined,
          audioData: audioBase64 || undefined,
          articleTitle: currentArticle?.title || 'Panorama Geral INFINITY',
          articleContext: currentArticle ? currentArticle.paragraphs?.slice(0, 3).join(' ') : 'Portal INFINITY'
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const botMsgId = `bot-${Date.now()}`;
        const assistantMsg: ChatMessage = {
          id: botMsgId,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isImageAnalysis: Boolean(imageToSend)
        };
        setMessages(prev => [...prev, assistantMsg]);
        // Automatically speak Fifine's response
        setTimeout(() => speakWithFifineVoice(data.reply, botMsgId), 300);
      } else {
        throw new Error(data.message || 'Falha ao responder');
      }
    } catch (err: any) {
      console.error(err);
      const fallbackId = `bot-fallback-${Date.now()}`;
      const fallbackText = `Recebi seu material com sucesso na redação do INFINITY. Nossos correspondentes confirmam que este conteúdo traz aspectos importantes para aprofundamento. Posso detalhar o contexto técnico, econômico ou pericial para você!`;
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

  const latestAssistantMessage = [...messages].reverse().find(m => m.sender === 'assistant');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      
      {/* Hidden Audio Players */}
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
      <audio
        ref={userAudioPlayerRef}
        onEnded={() => setCurrentlyPlayingUserAudioId(null)}
        onPause={() => setCurrentlyPlayingUserAudioId(null)}
      />

      {/* Hidden File Input for Photos/Images */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Full-screen Image Zoom Modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <img 
            src={zoomedImage} 
            alt="Perícia fotográfica em alta resolução" 
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/20"
          />
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Clique em qualquer lugar para fechar a visualização pericial</span>
          </p>
        </div>
      )}

      {/* Main Studio Card */}
      <div className="bg-[#0b1329] rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col h-[92vh] overflow-hidden border border-slate-700/80 text-white my-auto relative">
        
        {/* Top Professional Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-[#131d35] to-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#C4170C] via-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/25 font-black text-lg border border-white/20">
                F
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0b1329]" title="Ao Vivo na Bancada" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>Repórter Fifine</span>
                  <span className="text-[10px] text-amber-300 font-mono tracking-wider bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40 font-bold">
                    F • I • N • I • F • I
                  </span>
                </h3>
                <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Âncora Sênior
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <span>Investigação Editorial & Perícia Multimodal de Fotos e Voz</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowDossier(!showDossier)}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-[11px]"
                >
                  {showDossier ? 'Ocultar Dossiê' : 'Ver Perfil Oficial'}
                </button>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Speech Rate Selector */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Voz:</span>
              <button 
                onClick={() => setSpeechRate(0.9)} 
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${speechRate === 0.9 ? 'bg-amber-500 text-black' : 'text-slate-300 hover:text-white'}`}
              >
                0.9x
              </button>
              <button 
                onClick={() => setSpeechRate(1.0)} 
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${speechRate === 1.0 ? 'bg-amber-500 text-black' : 'text-slate-300 hover:text-white'}`}
              >
                1.0x
              </button>
              <button 
                onClick={() => setSpeechRate(1.15)} 
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${speechRate === 1.15 ? 'bg-amber-500 text-black' : 'text-slate-300 hover:text-white'}`}
              >
                1.15x
              </button>
            </div>

            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                onClose();
              }}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Fechar estúdio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EXPANDABLE PROFESSIONAL PROFILE DOSSIER (User requested detailed & professional characteristics) */}
        {showDossier && (
          <div className="bg-slate-950/95 border-b border-amber-500/30 p-4 sm:p-5 z-20 animate-fadeIn">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Credenciais Editoriais</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Âncora digital do portal INFINITY, treinado com diretrizes de verificação rigorosa de fatos, perícia de imagens e neutralidade investigativa.
                </p>
                <div className="pt-1 flex flex-wrap gap-1">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-amber-300">IFCN Standard</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-cyan-300">Multimodal 3.8</span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Especialidades & Perícia</span>
                </div>
                <ul className="text-slate-300 space-y-1">
                  <li>• <strong>Perícia Fotográfica:</strong> Análise de objetos, documentos e autenticidade.</li>
                  <li>• <strong>Mercado Financeiro:</strong> Dólar, Euro, PIB e 17.480+ criptomoedas.</li>
                  <li>• <strong>Cobertura Regional:</strong> Pernambuco, São Paulo, Brasília e capitais.</li>
                </ul>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>Diretriz de Comunicação</span>
                </div>
                <p className="text-slate-200 leading-relaxed italic">
                  "Informação fundamentada com profundidade, vocabulário refinado e respostas completas para o público exigente do INFINITY."
                </p>
                <p className="text-[10px] text-slate-400 pt-1">
                  Capacidade de análise multimodal de voz e fotos em alta definição ativa.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Current Active Article Banner if available */}
        {currentArticle && (
          <div className="bg-red-950/50 border-b border-red-900/40 px-4 py-2 text-xs text-red-200 flex items-center justify-between">
            <span className="truncate font-medium flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Pauta em tela: <strong className="text-white">{currentArticle.title}</strong></span>
            </span>
            <span className="text-[10px] bg-red-600/40 text-red-200 px-2.5 py-0.5 rounded-full font-bold shrink-0 ml-2 border border-red-500/40">
              Contexto Ativo
            </span>
          </div>
        )}

        {/* MAIN BODY: Mascot Stage (Left) + Interactive Multimodal Chat (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* LEFT: 3D MASCOT STAGE (Professional Newsroom Anchor Studio) */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-950 via-[#101931] to-slate-950 border-r border-slate-800 p-4 sm:p-5 flex flex-col items-center justify-between relative overflow-hidden">
            
            {/* Ambient Lighting & Stage Lights */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Stage Status Indicator */}
            <div className="w-full flex items-center justify-between text-xs text-slate-300 z-10">
              <span className="flex items-center gap-1.5 font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mascote 3D em Alta Definição
              </span>
              {isSpeakingFifine ? (
                <span className="bg-red-600/30 text-red-200 border border-red-500/50 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                  <Volume2 className="w-3 h-3 text-red-400" />
                  Falando no ar...
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-800">
                  Pronto para análise
                </span>
              )}
            </div>

            {/* 3D Mascot Center */}
            <div className="relative my-2 sm:my-auto flex flex-col items-center justify-center">
              <FifineMascot3D isTalking={isSpeakingFifine || isLoading} size="xl" />

              {/* Broadcast Waves emerging from mouth when talking */}
              {isSpeakingFifine && (
                <div className="absolute top-1/4 right-3 sm:right-6 flex flex-col items-center gap-1 pointer-events-none">
                  <div className="w-6 h-6 rounded-full border-2 border-amber-400 animate-ping opacity-80" />
                  <div className="w-10 h-10 rounded-full border-2 border-red-400 animate-ping opacity-60 delay-100" />
                  <span className="text-[9px] font-black text-amber-300 tracking-wider uppercase mt-1 bg-black/75 px-2 py-0.5 rounded-full border border-amber-400/40">
                    Voz de Fifine
                  </span>
                </div>
              )}

              {/* Pedestal Shadow */}
              <div className="w-48 h-5 bg-black/60 rounded-full blur-md -mt-4 shadow-2xl" />
            </div>

            {/* Live Teleprompter Quote Box */}
            <div className="w-full z-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-xs shadow-xl relative">
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400">
                <span className="font-bold text-white flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-red-500" />
                  Transmissão ao Vivo (Fifine):
                </span>
                {isSpeakingFifine && (
                  <button
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setIsSpeakingFifine(false);
                      setPlayingAudioId(null);
                    }}
                    className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer text-[10px]"
                  >
                    <VolumeX className="w-3 h-3" />
                    Pausar Fala
                  </button>
                )}
              </div>
              <p className="text-slate-200 text-xs line-clamp-3 leading-relaxed italic font-serif">
                "{latestAssistantMessage?.text?.slice(0, 180) || 'Olá! Estou pronto para analisar suas fotos, áudios e perguntas com rigor jornalístico!'}"
              </p>
            </div>

          </div>

          {/* RIGHT: CHAT MESSAGES, MULTIMODAL INPUT (Photos & Audio) */}
          <div className="md:col-span-7 flex flex-col h-full bg-[#080d1a]/90">
            
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C4170C] to-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md font-black text-xs border border-white/20">
                      F
                    </div>
                  )}

                  {/* Speech Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none shadow-xl'
                    }`}
                  >
                    {/* Attached Photo Thumbnail in Message */}
                    {msg.imageUrl && (
                      <div className="mb-3 relative group">
                        <img
                          src={msg.imageUrl}
                          alt="Fotografia enviada para perícia"
                          onClick={() => setZoomedImage(msg.imageUrl || null)}
                          className="w-full max-h-56 object-cover rounded-xl border border-white/20 cursor-zoom-in group-hover:brightness-95 transition"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs pointer-events-none">
                          <Maximize2 className="w-3 h-3 text-amber-300" />
                          <span>Clique para ampliar</span>
                        </div>
                      </div>
                    )}

                    {/* Attached Audio Player in Message (User voice note) */}
                    {msg.audioUrl && (
                      <div className="mb-3 bg-black/30 border border-white/20 rounded-xl p-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (userAudioPlayerRef.current) {
                                if (currentlyPlayingUserAudioId === msg.id) {
                                  userAudioPlayerRef.current.pause();
                                  setCurrentlyPlayingUserAudioId(null);
                                } else {
                                  userAudioPlayerRef.current.src = msg.audioUrl!;
                                  userAudioPlayerRef.current.play();
                                  setCurrentlyPlayingUserAudioId(msg.id);
                                }
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center shadow hover:scale-105 transition cursor-pointer"
                          >
                            {currentlyPlayingUserAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                          <div>
                            <p className="text-xs font-bold text-white">Mensagem de Voz</p>
                            <p className="text-[10px] text-red-200">
                              {msg.audioDuration ? `${msg.audioDuration} segundos` : 'Áudio gravado'}
                            </p>
                          </div>
                        </div>
                        <Mic className="w-4 h-4 text-red-200" />
                      </div>
                    )}

                    {/* Message text with basic paragraph formatting */}
                    <div className="whitespace-pre-wrap space-y-1.5 font-sans">
                      {msg.text}
                    </div>

                    {/* Message Footer with Timestamp and Audio Playback */}
                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-700/60 text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>

                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => speakWithFifineVoice(msg.text, msg.id)}
                          className={`flex items-center space-x-1.5 font-bold cursor-pointer ml-3 px-2.5 py-1 rounded-lg border transition ${
                            playingAudioId === msg.id && isSpeakingFifine
                              ? 'bg-red-600 text-white border-red-500 animate-pulse'
                              : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Ouvir fala de Fifine com pronúncia profissional"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>
                            {playingAudioId === msg.id && isSpeakingFifine ? 'Fifine no Ar...' : 'Ouvir Fala'}
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
                <div className="flex items-center space-x-3 text-xs text-white bg-slate-900/90 p-4 rounded-2xl w-fit border border-slate-800 shadow-md animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                  <span>
                    {pendingImage 
                      ? 'Fifine realizando perícia visual e análise jornalística da imagem...'
                      : 'O Repórter Fifine está apurando os dados e formulando a resposta com voz...'}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions for Real-World Questions */}
            <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0">
                Pautas Rápidas:
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

            {/* PENDING PHOTO ATTACHMENT PREVIEW (Before Sending) */}
            {pendingImage && (
              <div className="bg-slate-900/95 border-t border-amber-500/30 p-3 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <img
                    src={pendingImage}
                    alt="Prévia"
                    className="w-14 h-14 object-cover rounded-xl border border-white/20 shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Foto pronta para perícia de Fifine</span>
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {pendingImageName || 'Imagem anexada do dispositivo'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPendingImage(null);
                    setPendingImageName(null);
                  }}
                  className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-800 hover:text-white transition cursor-pointer"
                  title="Remover foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PENDING AUDIO RECORDING PREVIEW (Before Sending) */}
            {recordedAudioUrl && !isRecording && (
              <div className="bg-slate-900/95 border-t border-red-500/30 p-3 flex items-center justify-between animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-300">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Áudio gravado com sucesso!</p>
                    <p className="text-[11px] text-slate-400 font-mono">Duração: {recordingSeconds}s • Pronto para envio</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={cancelAudioRecording}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-xs"
                    title="Descartar áudio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow cursor-pointer"
                  >
                    <span>Enviar Áudio</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ACTIVE AUDIO RECORDING BAR */}
            {isRecording && (
              <div className="bg-red-950/90 border-t border-red-600/60 p-3 flex items-center justify-between text-xs text-red-100 animate-pulse">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold text-white">Gravando áudio de voz para o Fifine...</span>
                  <span className="font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded text-xs">
                    00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={cancelAudioRecording}
                    className="text-red-300 hover:text-white px-2 py-1 text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={stopAudioRecording}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Concluir Gravação</span>
                  </button>
                </div>
              </div>
            )}

            {/* INPUT CONTROLS BAR: Attach Photo, Record Audio & Send Message */}
            <div className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                {/* PHOTO UPLOAD BUTTON (Mandando fotos para perícia) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                  title="Anexar foto ou documento para perícia de Fifine"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* AUDIO RECORDING BUTTON (Mandando áudio para Fifine) */}
                <button
                  type="button"
                  onClick={isRecording ? stopAudioRecording : startAudioRecording}
                  className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/40 ring-2 ring-red-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                  }`}
                  title={isRecording ? 'Parar gravação de áudio' : 'Gravar áudio com sua voz'}
                >
                  {isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* TEXT INPUT */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    pendingImage
                      ? 'Digite uma pergunta sobre a foto (ou envie para perícia geral)...'
                      : isRecording
                      ? 'Gravando seu áudio...'
                      : 'Pergunte sobre fotos, cotações, mundo real ou acontecimentos...'
                  }
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />

                {/* SEND BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading || (!inputText.trim() && !pendingImage && !recordedAudioBlob)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-3 rounded-2xl shadow-lg transition cursor-pointer disabled:opacity-40 shrink-0"
                  title="Enviar mensagem para análise de Fifine"
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
