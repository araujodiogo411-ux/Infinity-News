import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Share2, 
  Heart, 
  MessageSquare, 
  Volume2, 
  Play, 
  Pause, 
  Printer, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Send, 
  Quote, 
  Radio,
  Edit,
  Trash2,
  Video
} from 'lucide-react';
import { NewsArticle, CATEGORIES } from '../types/news';

interface ArticleDetailViewProps {
  article: NewsArticle;
  onBack: () => void;
  onOpenPrintModal: (article: NewsArticle) => void;
  onArticleUpdated: (updated: NewsArticle) => void;
  onOpenVirtualReporter: (article: NewsArticle) => void;
  isAdmin?: boolean;
  onEditArticle?: (article: NewsArticle) => void;
  onDeleteArticle?: (articleId: string) => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  onBack,
  onOpenPrintModal,
  onArticleUpdated,
  onOpenVirtualReporter,
  isAdmin = false,
  onEditArticle,
  onDeleteArticle
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(article.audioUrl || null);
  const [audioError, setAudioError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(article.likes || 0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Comments state
  const [comments, setComments] = useState(article.comments || []);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const categoryObj = CATEGORIES.find(c => c.id === article.category) || CATEGORIES[0];

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(-1);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Scroll to headline immediately on load
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [article.id]);

  // Clean speech synthesis on unmount
  React.useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const fullArticleParagraphs = React.useMemo(() => {
    if (article.blocks && article.blocks.length > 0) {
      return article.blocks
        .filter(b => b.type === 'paragraph' || b.type === 'heading')
        .map(b => b.content);
    }
    return article.paragraphs || [];
  }, [article]);

  const handleToggleAudio = async () => {
    if (isPlayingAudio) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    // Full Reading using Web Speech API with dedicated Brazilian Voice
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(true);
      setAudioError('');

      // Build full speech script: Title + Subtitle + Author + ALL paragraphs sequentially
      const fullSpeechText = `Reportagem do portal INFINITY: ${article.title}. ${article.subtitle || ''}. Reportagem de ${article.author}. ${fullArticleParagraphs.join('. ')}`;

      const cleanText = fullSpeechText.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = speechRate;
      utterance.pitch = 1.02;

      const voices = window.speechSynthesis.getVoices();
      const ptBrVoice = voices.find(v => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Felipe') || v.name.includes('Brazil')))
        || voices.find(v => v.lang.startsWith('pt'));

      if (ptBrVoice) {
        utterance.voice = ptBrVoice;
      }

      utterance.onend = () => {
        setIsPlayingAudio(false);
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // Fallback to server TTS if Web Speech API unavailable
    setIsLoadingAudio(true);
    setAudioError('');
    try {
      const fullText = `${article.title}. ${article.subtitle || ''}. ${fullArticleParagraphs.slice(0, 5).join(' ')}`;
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          text: fullText,
        }),
      });

      const data = await res.json();
      if (data.success && data.audioData) {
        setAudioUrl(data.audioData);
        setIsPlayingAudio(true);
      } else {
        throw new Error(data.message || 'Falha ao sintetizar áudio');
      }
    } catch (err: any) {
      console.error(err);
      setAudioError('Não foi possível reproduzir a narração completa no momento.');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikesCount(prev => prev + 1);

    try {
      await fetch(`/api/articles/${article.id}/like`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToast, setShareToast] = useState('');

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = article.title;
  const shareSummary = article.subtitle || article.paragraphs?.[0]?.slice(0, 140) || '';

  const handleShareWhatsApp = () => {
    const text = `*${shareTitle}*\n\n${shareSummary}\n\nLeia a cobertura completa no portal INFINITY:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareInstagram = () => {
    const storyText = `📰 INFINITY NOTÍCIAS:\n\n${shareTitle}\n\n${shareSummary}\n\nLeia mais no portal INFINITY: ${shareUrl}\n\n#INFINITY #Plantao #Brasil #Jornalismo`;
    navigator.clipboard.writeText(storyText);
    setShareToast('Texto pronto para o Instagram copiado! Abra o app e cole nos Stories ou Bio.');
    setTimeout(() => setShareToast(''), 4500);
    if (navigator.share) {
      try {
        navigator.share({ title: shareTitle, text: storyText, url: shareUrl });
      } catch (e) {
        // user cancelled
      }
    }
  };

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setShareToast('Link copiado para a área de transferência!');
    setTimeout(() => {
      setCopiedLink(false);
      setShareToast('');
    }, 2500);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/articles/${article.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: authorName.trim() || 'Leitor do Infinite News',
          content: commentText.trim()
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDeleteArticle?.(article.id);
    setShowDeleteConfirm(false);
    onBack();
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay={isPlayingAudio}
          onEnded={() => setIsPlayingAudio(false)}
          onPause={() => setIsPlayingAudio(false)}
          onPlay={() => setIsPlayingAudio(true)}
        />
      )}

      {/* Top back navigation & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-[#C4170C] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Capa</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Início</span>
          <span>›</span>
          <span className="font-semibold capitalize text-gray-800">
            {article.customCategory || categoryObj.name}
          </span>
        </div>
      </div>

      {/* Header section: Chapeu, Title, Subtitle */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg text-white ${categoryObj.badgeColor}`}>
            {article.customCategory || article.chapeu || categoryObj.name.toUpperCase()}
          </span>
          {article.breakingNews && (
            <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg animate-pulse">
              Plantão
            </span>
          )}
        </div>

        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 leading-tight tracking-tight">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-base sm:text-xl text-gray-700 leading-snug font-serif-news italic">
            {article.subtitle}
          </p>
        )}
      </div>

      {/* Author & Publication Byline Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-y border-gray-200 py-3.5 my-5 gap-3 text-xs text-gray-600">
        <div>
          <p className="font-bold text-gray-900 text-sm">
            Por {article.author}
          </p>
          <p className="text-gray-500">
            {article.authorRole} • Publicado em {formattedDate}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-gray-500">
          {isAdmin && (
            <div className="flex items-center space-x-2 mr-2">
              <button
                onClick={() => onEditArticle?.(article)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-bold bg-red-50 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Apagar</span>
              </button>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{article.readTime || '3 min'}</span>
          </div>
          <span>•</span>
          <span>{article.views || 1} leitores</span>
        </div>
      </div>

      {/* AUDIO READER BAR (Fifine Voice) */}
      <div className="bg-gradient-to-r from-red-50 via-amber-50 to-red-50 border border-red-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#C4170C] text-white flex items-center justify-center shrink-0 shadow font-black text-sm">
            F
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <span>Ouvir com Repórter IA Fifine</span>
              <span className="bg-red-600/10 text-[#C4170C] text-[10px] font-bold px-1.5 py-0.2 rounded">
                Voz Neural
              </span>
            </h4>
            <p className="text-[11px] text-gray-600">
              {isPlayingAudio 
                ? 'Reproduzindo locução do portal INFINITY...'
                : 'Narração jornalística sintetizada pela inteligência artificial.'}
            </p>
            {audioError && <p className="text-[11px] text-red-600 font-semibold">{audioError}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleAudio}
            disabled={isLoadingAudio}
            className="flex items-center space-x-2 bg-[#C4170C] hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition cursor-pointer disabled:opacity-50"
          >
            {isLoadingAudio ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gerando voz...</span>
              </>
            ) : isPlayingAudio ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Ouvir Matéria</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Image Banner */}
      {article.imageUrl && (
        <div className="mb-8">
          <div className="rounded-3xl overflow-hidden shadow-md border border-gray-200">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-80 sm:h-[460px] object-cover"
            />
          </div>
          <div className="pt-2 px-1 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-1">
            <p className="italic text-gray-700">{article.imageCaption}</p>
            <span className="font-semibold text-gray-500 shrink-0">{article.imageCredit}</span>
          </div>
        </div>
      )}

      {/* Floating Action Sharing Bar */}
      <div className="flex flex-wrap items-center justify-between border-y border-gray-200 py-3 mb-8 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              liked
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-600 text-red-600' : ''}`} />
            <span>{likesCount} Curtidas</span>
          </button>

          {/* WhatsApp Direct Share */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-xs"
            title="Compartilhar no WhatsApp"
          >
            <span>WhatsApp</span>
          </button>

          {/* Instagram Share / Stories */}
          <button
            onClick={handleShareInstagram}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-xs"
            title="Compartilhar no Instagram"
          >
            <span>Instagram</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Mais Redes</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenVirtualReporter(article)}
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer"
            title="Debater ou perguntar detalhes sobre esta matéria com Fifine"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Perguntar ao Fifine</span>
          </button>

          {/* ADMIN ONLY: Newspaper Print PDF */}
          {isAdmin && (
            <button
              onClick={() => onOpenPrintModal(article)}
              className="flex items-center space-x-1.5 bg-gray-900 hover:bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm transition cursor-pointer"
              title="Baixar em formato de jornal impresso em PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir como Jornal</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Article Body Text & Story Blocks */}
      <div className="prose prose-lg max-w-none text-gray-900 leading-relaxed font-serif-news text-base sm:text-lg space-y-6">
        {article.blocks && article.blocks.length > 0 ? (
          article.blocks.map((block, idx) => {
            if (block.type === 'heading') {
              return (
                <div key={block.id || idx} className="pt-4 pb-1 border-t border-gray-200 my-4">
                  <h2 className="font-headline font-bold text-xl sm:text-2xl text-gray-950 tracking-tight">
                    {block.content}
                  </h2>
                </div>
              );
            }
            if (block.type === 'image') {
              return (
                <div key={block.id || idx} className="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm not-prose">
                  <img src={block.content} alt="Imagem no texto" className="w-full h-72 sm:h-96 object-cover" />
                  {(block.caption || block.credit) && (
                    <div className="p-3 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-600 gap-1 border-t border-gray-200">
                      <p className="italic">{block.caption}</p>
                      <span className="font-bold text-gray-500 shrink-0">{block.credit}</span>
                    </div>
                  )}
                </div>
              );
            }
            if (block.type === 'video') {
              const ytMatch = block.content.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
              const vimeoMatch = block.content.match(/vimeo\.com\/(\d+)/);

              return (
                <div key={block.id || idx} className="my-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm not-prose bg-black">
                  {ytMatch ? (
                    <div className="relative w-full aspect-video">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}`}
                        title="Vídeo da reportagem"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : vimeoMatch ? (
                    <div className="relative w-full aspect-video">
                      <iframe
                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                        title="Vídeo da reportagem"
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video
                      src={block.content}
                      controls
                      className="w-full max-h-[460px] object-contain mx-auto"
                    />
                  )}
                  {(block.caption || block.credit) && (
                    <div className="p-3 bg-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-300 gap-1 border-t border-gray-800">
                      <p className="italic">{block.caption}</p>
                      <span className="font-bold text-red-400 shrink-0">{block.credit}</span>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <p key={block.id || idx} className={idx === 0 ? 'dropcap' : ''}>
                {block.content}
              </p>
            );
          })
        ) : (
          article.paragraphs?.map((para, idx) => (
            <p key={idx} className={idx === 0 ? 'dropcap' : ''}>
              {para}
            </p>
          ))
        )}
      </div>

      {/* Highlighted Pull Quote */}
      {article.keyQuotes && article.keyQuotes.length > 0 && (
        <div className="my-8 border-l-4 border-[#C4170C] pl-6 py-2 bg-red-50/50 rounded-r-2xl">
          <Quote className="w-8 h-8 text-[#C4170C]/40 mb-1" />
          <blockquote className="font-headline text-xl sm:text-2xl font-bold text-gray-950 italic leading-snug">
            "{article.keyQuotes[0]}"
          </blockquote>
        </div>
      )}

      {/* Tags section */}
      {article.tags && article.tags.length > 0 && (
        <div className="my-6 pt-4 border-t border-gray-200">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
            Palavras-Chave da Matéria:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* READERS COMMENTS SECTION */}
      <section className="mt-12 pt-8 border-t-2 border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#C4170C]" />
            <span>Comentários dos Leitores ({comments.length})</span>
          </h3>
          <span className="text-xs text-gray-500">Espaço aberto para debate</span>
        </div>

        <form onSubmit={handleCommentSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 mb-8">
          <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Deixe seu comentário</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Seu nome (opcional)..."
              className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800"
            />
          </div>
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="O que você achou desta reportagem? Escreva sua opinião..."
            className="w-full p-3 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-800 focus:ring-1 focus:ring-[#C4170C] mb-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="flex items-center space-x-1.5 bg-[#C4170C] hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publicar Comentário</span>
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center py-4">
              Nenhum comentário registrado ainda. Seja o primeiro a comentar!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <img
                      src={c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                      alt={c.author}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="font-bold text-xs text-gray-900">{c.author}</span>
                  </div>
                  <span className="text-[11px] text-gray-400">{c.createdAt}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed pl-8">
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Share Toast Feedback */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center space-x-2 border border-gray-700 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Social Share Modal Popup */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base text-gray-900">Compartilhar Matéria</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 line-clamp-2">
              {article.title}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  handleShareWhatsApp();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold transition"
              >
                <span>WhatsApp</span>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">Enviar</span>
              </button>

              <button
                onClick={() => {
                  handleShareInstagram();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-pink-50 hover:bg-pink-100 text-pink-900 rounded-xl text-xs font-bold transition"
              >
                <span>Instagram (Stories / Feed)</span>
                <span className="text-[10px] bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded">Copiar</span>
              </button>

              <button
                onClick={() => {
                  handleShareTelegram();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded-xl text-xs font-bold transition"
              >
                <span>Telegram</span>
                <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded">Abrir</span>
              </button>

              <button
                onClick={() => {
                  handleShareTwitter();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl text-xs font-bold transition"
              >
                <span>Twitter / X</span>
                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded">Postar</span>
              </button>

              <button
                onClick={() => {
                  handleCopyLink();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
              >
                <span>Copiar Link da Notícia</span>
                <span className="text-[10px] text-gray-500 font-mono">URL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#C4170C] flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-gray-900">Mover para a Lixeira?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                A matéria <strong>"{article.title}"</strong> sairá do portal imediatamente e irá para a sua <strong>Lixeira do Administrador</strong>.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 text-left font-medium">
                🔒 <strong>Privacidade Total:</strong> Nenhum visitante verá esta matéria. Você pode restaurá-la quando quiser na lixeira.
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-[#C4170C] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Mover para Lixeira</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </article>
  );
};
