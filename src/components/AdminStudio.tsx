import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Wand2, 
  Quote, 
  Tag, 
  User, 
  ArrowRight,
  Upload,
  Heading,
  Layers,
  Settings,
  HelpCircle,
  Sliders,
  Bookmark,
  Save,
  Clock,
  RotateCcw,
  ExternalLink,
  BookOpen,
  Video,
  Film,
  Search,
  ShieldAlert
} from 'lucide-react';
import { CATEGORIES, NewsArticle, ParsedNewsResult, StoryBlock, NewsDraft } from '../types/news';

interface AdminStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onArticlePublished: (article: NewsArticle) => void;
  onOpenPrintModal: (article: Partial<NewsArticle>) => void;
  editingArticle?: NewsArticle | null;
  trashArticles?: NewsArticle[];
  onRestoreArticle?: (articleId: string) => Promise<void>;
  onPermanentDeleteArticle?: (articleId: string) => Promise<void>;
  onEmptyTrash?: () => Promise<void>;
}

const SAMPLE_TEXTS = [
  {
    title: 'Exemplo: Clima, El Niño e Amazônia',
    text: `Por Beatriz Alencar, enviada especial em Manaus.
O monitoramento via satélite das bacias hidrográficas do Brasil apontou que os impactos climáticos derivados do fenômeno El Niño atingiram um ponto de inflexão na região amazônica.
Cientistas do Instituto Nacional de Pesquisas Espaciais registraram uma elevação de 1,4°C na temperatura média das águas fluviais ao longo do último trimestre.
Segundo os meteorologistas, novas frentes frias vindas do sul devem restabelecer o regime de chuvas nas cabeceiras dos rios até o final do mês.
A coordenadora do observatório ambiental afirmou: 'A capacidade de prever os desdobramentos do El Niño em tempo real permite que as comunidades ribeirinhas protejam suas safras e reservem água potável com antecedência'.
A recuperação da cobertura vegetal já é visível nas imagens de sensoriamento óptico submétrico.`
  },
  {
    title: 'Exemplo: Saúde & Novo Diagnóstico',
    text: `Reportagem de Camila Fontes, de São Paulo.
Pesquisadores da USP anunciaram o desenvolvimento de uma tecnologia médica pioneira para diagnóstico de doenças respiratórias em menos de 10 minutos.
O teste utiliza biossensores combinados a algoritmos neurais para processar amostras com 99% de acuidade clínica.
A diretoria do hospital universitário destacou: 'Este avanço democratiza a medicina de ponta para postos de saúde de todo o Brasil'.`
  }
];

export const AdminStudio: React.FC<AdminStudioProps> = ({
  isOpen,
  onClose,
  onArticlePublished,
  onOpenPrintModal,
  editingArticle,
  trashArticles = [],
  onRestoreArticle,
  onPermanentDeleteArticle,
  onEmptyTrash
}) => {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successArticle, setSuccessArticle] = useState<NewsArticle | null>(null);

  // Editable fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [chapeu, setChapeu] = useState('DESTAQUE');
  const [category, setCategory] = useState('tecnologia');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [author, setAuthor] = useState('Redação Infinite News');
  const [authorRole, setAuthorRole] = useState('Repórter Especial — Infinite News');
  
  // Story Blocks: paragraphs, headings, inline images
  const [blocks, setBlocks] = useState<StoryBlock[]>([]);

  const [keyQuotes, setKeyQuotes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80');
  const [imageCaption, setImageCaption] = useState('Registro fotográfico da reportagem do Infinite News.');
  const [imageCredit, setImageCredit] = useState('Foto: Redação Infinite News');
  const [imagePrompt, setImagePrompt] = useState('');
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [breakingNews, setBreakingNews] = useState(false);

  // Newspaper print metadata customization
  const [newspaperEdition, setNewspaperEdition] = useState('Edição Nacional');
  const [newspaperYear, setNewspaperYear] = useState('Ano XXXIV (2026)');
  const [newspaperIssue, setNewspaperIssue] = useState('N° 14.280');
  const [newspaperPrice, setNewspaperPrice] = useState('R$ 4,50');
  const [newspaperSection, setNewspaperSection] = useState('CADERNO ESPECIAL');

  // Prototypes & Drafts State
  const [draftsList, setDraftsList] = useState<NewsDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string>(() => 'draft-' + Date.now());
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'editor' | 'prototypes' | 'trash'>('input');
  const [trashSearchQuery, setTrashSearchQuery] = useState('');
  const [trashActionId, setTrashActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const mainFileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved drafts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('infinite_news_drafts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDraftsList(parsed);
        }
      }
    } catch (e) {
      console.warn('Error loading drafts from localStorage:', e);
    }
  }, [isOpen]);

  // If editing an existing published article, pre-populate state
  useEffect(() => {
    if (editingArticle) {
      setTitle(editingArticle.title || '');
      setSubtitle(editingArticle.subtitle || '');
      setChapeu(editingArticle.chapeu || 'DESTAQUE');
      setCategory(editingArticle.category || 'tecnologia');
      if (editingArticle.customCategory) {
        setIsCustomCategory(true);
        setCustomCategory(editingArticle.customCategory);
      }
      setAuthor(editingArticle.author || 'Redação Infinite News');
      setAuthorRole(editingArticle.authorRole || 'Repórter Especial');
      
      if (editingArticle.blocks && editingArticle.blocks.length > 0) {
        setBlocks(editingArticle.blocks);
      } else if (editingArticle.paragraphs && editingArticle.paragraphs.length > 0) {
        setBlocks(editingArticle.paragraphs.map((p, i) => ({
          id: `blk-${Date.now()}-${i}`,
          type: 'paragraph',
          content: p
        })));
      }

      setKeyQuotes(editingArticle.keyQuotes || []);
      setTags(editingArticle.tags || []);
      setImageUrl(editingArticle.imageUrl || '');
      setImageCaption(editingArticle.imageCaption || '');
      setImageCredit(editingArticle.imageCredit || '');
      setFeatured(Boolean(editingArticle.featured));
      setBreakingNews(Boolean(editingArticle.breakingNews));
      setNewspaperEdition(editingArticle.newspaperEdition || 'Edição Nacional');
      setNewspaperYear(editingArticle.newspaperYear || 'Ano XXXIV (2026)');
      setNewspaperIssue(editingArticle.newspaperIssue || 'N° 14.280');
      setNewspaperPrice(editingArticle.newspaperPrice || 'R$ 4,50');
      setNewspaperSection(editingArticle.newspaperSection || `CADERNO ${(editingArticle.customCategory || editingArticle.category).toUpperCase()}`);
      setActiveTab('editor');
    }
  }, [editingArticle]);

  // Automated prototype autosave debouncer
  // Whenever user types or pastes, save silently to localStorage so nothing is ever lost
  useEffect(() => {
    if (editingArticle) return; // do not overwrite drafts when editing an already published article

    const hasContent = title.trim().length > 0 || rawText.trim().length > 5 || blocks.length > 0;
    if (!hasContent) return;

    const timer = setTimeout(() => {
      try {
        const draftObj: NewsDraft = {
          id: currentDraftId,
          title: title.trim() || 'Protótipo em andamento',
          subtitle: subtitle.trim(),
          chapeu: chapeu.trim() || 'DESTAQUE',
          category: isCustomCategory ? 'outros' : category,
          customCategory: isCustomCategory ? customCategory : undefined,
          author: author || 'Redação Infinite News',
          authorRole: authorRole || 'Repórter Especial — Infinite News',
          rawText: rawText || '',
          blocks,
          paragraphs: blocks.filter(b => b.type === 'paragraph').map(b => b.content),
          keyQuotes,
          tags,
          imageUrl,
          imageCaption,
          imageCredit,
          lastModified: new Date().toISOString(),
          newspaperEdition,
          newspaperYear,
          newspaperIssue,
          newspaperPrice,
          newspaperSection: newspaperSection || `CADERNO ${(isCustomCategory ? customCategory : category).toUpperCase()}`,
        };

        const existingRaw = localStorage.getItem('infinite_news_drafts');
        let currentList: NewsDraft[] = existingRaw ? JSON.parse(existingRaw) : [];
        if (!Array.isArray(currentList)) currentList = [];

        const index = currentList.findIndex(d => d.id === currentDraftId);
        if (index >= 0) {
          currentList[index] = draftObj;
        } else {
          currentList.unshift(draftObj);
        }

        // Keep maximum 20 drafts
        currentList = currentList.slice(0, 20);

        localStorage.setItem('infinite_news_drafts', JSON.stringify(currentList));
        setDraftsList(currentList);
        setLastSavedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.warn('Autosave error:', err);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [
    title,
    subtitle,
    chapeu,
    category,
    customCategory,
    isCustomCategory,
    author,
    authorRole,
    rawText,
    blocks,
    keyQuotes,
    tags,
    imageUrl,
    imageCaption,
    imageCredit,
    newspaperEdition,
    newspaperYear,
    newspaperIssue,
    newspaperPrice,
    newspaperSection,
    currentDraftId,
    editingArticle
  ]);

  if (!isOpen) return null;

  // Manual save prototype trigger
  const handleSavePrototypeManually = () => {
    const draftObj: NewsDraft = {
      id: currentDraftId,
      title: title.trim() || 'Protótipo em andamento',
      subtitle: subtitle.trim(),
      chapeu: chapeu.trim() || 'DESTAQUE',
      category: isCustomCategory ? 'outros' : category,
      customCategory: isCustomCategory ? customCategory : undefined,
      author: author || 'Redação Infinite News',
      authorRole: authorRole || 'Repórter Especial — Infinite News',
      rawText: rawText || '',
      blocks,
      paragraphs: blocks.filter(b => b.type === 'paragraph').map(b => b.content),
      keyQuotes,
      tags,
      imageUrl,
      imageCaption,
      imageCredit,
      lastModified: new Date().toISOString(),
      newspaperEdition,
      newspaperYear,
      newspaperIssue,
      newspaperPrice,
      newspaperSection: newspaperSection || `CADERNO ${(isCustomCategory ? customCategory : category).toUpperCase()}`,
    };

    let currentList: NewsDraft[] = [...draftsList];
    const index = currentList.findIndex(d => d.id === currentDraftId);
    if (index >= 0) {
      currentList[index] = draftObj;
    } else {
      currentList.unshift(draftObj);
    }
    currentList = currentList.slice(0, 20);

    localStorage.setItem('infinite_news_drafts', JSON.stringify(currentList));
    setDraftsList(currentList);
    setLastSavedTime(new Date().toLocaleTimeString('pt-BR'));
    setStatusMessage('Protótipo salvo com sucesso! Você pode fechar o navegador com segurança e continuar quando quiser.');
  };

  // Resume prototype editing
  const handleResumePrototype = (draft: NewsDraft) => {
    setCurrentDraftId(draft.id);
    setTitle(draft.title === 'Protótipo em andamento' ? '' : draft.title);
    setSubtitle(draft.subtitle || '');
    setChapeu(draft.chapeu || 'DESTAQUE');
    setCategory(draft.category || 'tecnologia');
    if (draft.customCategory) {
      setIsCustomCategory(true);
      setCustomCategory(draft.customCategory);
    } else {
      setIsCustomCategory(false);
      setCustomCategory('');
    }
    setAuthor(draft.author || 'Redação Infinite News');
    setAuthorRole(draft.authorRole || 'Repórter Especial — Infinite News');
    setRawText(draft.rawText || '');
    setBlocks(draft.blocks || []);
    setKeyQuotes(draft.keyQuotes || []);
    setTags(draft.tags || []);
    setImageUrl(draft.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80');
    setImageCaption(draft.imageCaption || 'Registro fotográfico da reportagem.');
    setImageCredit(draft.imageCredit || 'Foto: Infinite News');
    setNewspaperEdition(draft.newspaperEdition || 'Edição Nacional');
    setNewspaperYear(draft.newspaperYear || 'Ano XXXIV (2026)');
    setNewspaperIssue(draft.newspaperIssue || 'N° 14.280');
    setNewspaperPrice(draft.newspaperPrice || 'R$ 4,50');
    setNewspaperSection(draft.newspaperSection || `CADERNO ${(draft.customCategory || draft.category).toUpperCase()}`);
    
    setActiveTab('editor');
    setStatusMessage(`Protótipo "${draft.title}" restaurado com sucesso! Continue editando.`);
  };

  // Delete prototype
  const handleDeletePrototype = (draftId: string) => {
    const updated = draftsList.filter(d => d.id !== draftId);
    setDraftsList(updated);
    localStorage.setItem('infinite_news_drafts', JSON.stringify(updated));
    if (currentDraftId === draftId) {
      setCurrentDraftId('draft-' + Date.now());
    }
    setStatusMessage('Protótipo excluído com sucesso.');
  };

  // Reset form to start fresh
  const handleStartFresh = () => {
    setCurrentDraftId('draft-' + Date.now());
    setTitle('');
    setSubtitle('');
    setChapeu('DESTAQUE');
    setCategory('tecnologia');
    setIsCustomCategory(false);
    setCustomCategory('');
    setRawText('');
    setBlocks([]);
    setKeyQuotes([]);
    setTags([]);
    setImageUrl('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80');
    setImageCaption('Registro fotográfico da reportagem do Infinite News.');
    setImageCredit('Foto: Redação Infinite News');
    setActiveTab('input');
    setStatusMessage('Novo formulário em branco iniciado.');
  };

  // Handle Main photo file upload from device
  const handleMainPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setImageCredit('Foto: Arquivo Pessoal / Enviada pelo Autor');
        setStatusMessage('Foto importada com sucesso do seu dispositivo!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle block photo file upload from device
  const handleBlockPhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = [...blocks];
        updated[index].content = reader.result;
        if (!updated[index].credit) {
          updated[index].credit = 'Foto: Enviada do dispositivo';
        }
        setBlocks(updated);
        setStatusMessage('Imagem de bloco importada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Process raw text with Gemini
  const handleParseWithAI = async () => {
    if (!rawText.trim() || rawText.trim().length < 10) {
      setErrorMessage('Por favor, digite ou cole um texto para a IA analisar.');
      return;
    }

    setIsParsing(true);
    setErrorMessage('');
    setStatusMessage('Desmembrando notícia com IA e formatando blocos...');

    try {
      const res = await fetch('/api/gemini/parse-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();

      let p: ParsedNewsResult = data.data;

      setTitle(p.title || '');
      setSubtitle(p.subtitle || '');
      setChapeu(p.chapeu || 'DESTAQUE');
      setCategory(p.category || 'tecnologia');
      setAuthor(p.author || 'Redação Infinite News');
      setAuthorRole(p.authorRole || 'Correspondente Especial — Infinite News');

      if (p.blocks && p.blocks.length > 0) {
        setBlocks(p.blocks);
      } else if (p.paragraphs && p.paragraphs.length > 0) {
        setBlocks(p.paragraphs.map((para, i) => ({
          id: `blk-${Date.now()}-${i}`,
          type: 'paragraph',
          content: para
        })));
      } else {
        setBlocks([{ id: `blk-1`, type: 'paragraph', content: rawText }]);
      }

      setKeyQuotes(p.keyQuotes && p.keyQuotes.length > 0 ? p.keyQuotes : ['Destaque da reportagem do Infinite News']);
      setTags(p.tags || ['Brasil', 'Infinite News']);
      setImageCaption(p.suggestedImageCaption || 'Fotografia editorial da matéria.');
      setImagePrompt(p.imagePrompt || `Photojournalism of ${p.title}`);

      if (p.suggestedImages && p.suggestedImages.length > 0) {
        setSuggestedImages(p.suggestedImages);
        setImageUrl(p.suggestedImages[0]);
      }

      setNewspaperSection(`CADERNO ${(p.category || 'ESPECIAL').toUpperCase()}`);

      setActiveTab('editor');
      setStatusMessage('Notícia desmembrada com sucesso! Você pode editar, adicionar subtítulos e fotos entre os parágrafos.');
    } catch (err: any) {
      console.warn('Network parse error, creating instant blocks:', err);
      setActiveTab('editor');
    } finally {
      setIsParsing(false);
    }
  };

  // Generate Image with AI
  const handleGenerateAIImage = async () => {
    setIsGeneratingImage(true);
    setErrorMessage('');
    const promptToUse = imagePrompt || `${title}. ${subtitle}`;

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          category: isCustomCategory ? 'tecnologia' : category,
        }),
      });
      const data = await res.json();

      if (data.success && data.imageUrl) {
        setImageUrl(data.imageUrl);
        setImageCredit(data.generatedByAI ? 'Imagem gerada por Inteligência Artificial' : 'Foto: Acervo Infinite News');
        setStatusMessage(data.message || 'Nova imagem gerada com sucesso!');
      } else {
        throw new Error(data.message || 'Falha ao gerar imagem');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Não foi possível gerar imagem com IA: ' + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Publish or Update article
  const handlePublish = async () => {
    if (!title.trim()) {
      setErrorMessage('O título da matéria é obrigatório.');
      return;
    }
    if (blocks.length === 0) {
      setErrorMessage('A matéria precisa ter pelo menos um bloco de conteúdo (parágrafo ou subtítulo).');
      return;
    }

    setIsPublishing(true);
    setErrorMessage('');

    try {
      const payload = {
        title,
        subtitle,
        chapeu,
        category: isCustomCategory ? 'outros' : category,
        customCategory: isCustomCategory ? customCategory : undefined,
        author,
        authorRole,
        blocks,
        paragraphs: blocks.filter(b => b.type === 'paragraph').map(b => b.content),
        keyQuotes,
        tags,
        imageUrl,
        imageCaption,
        imageCredit,
        featured,
        breakingNews,
        newspaperEdition,
        newspaperYear,
        newspaperIssue,
        newspaperPrice,
        newspaperSection: newspaperSection || `CADERNO ${(isCustomCategory ? customCategory : category).toUpperCase()}`
      };

      const url = editingArticle ? `/api/articles/${editingArticle.id}` : '/api/articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessArticle(data.article);
        onArticlePublished(data.article);

        // Remove draft from prototypes after publishing
        try {
          const stored = localStorage.getItem('infinite_news_drafts');
          if (stored) {
            const list: NewsDraft[] = JSON.parse(stored);
            const remaining = list.filter(d => d.id !== currentDraftId);
            localStorage.setItem('infinite_news_drafts', JSON.stringify(remaining));
            setDraftsList(remaining);
          }
        } catch (e) {
          console.warn('Error clearing published draft:', e);
        }

        setStatusMessage(editingArticle ? 'Reportagem atualizada com sucesso!' : 'Notícia publicada com sucesso no banco de dados!');
      } else {
        throw new Error(data.message || 'Falha ao salvar notícia');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao salvar: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Block management functions
  const addBlock = (type: 'paragraph' | 'heading' | 'image' | 'video', insertIndex?: number) => {
    const newBlock: StoryBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      content: type === 'image' 
        ? 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80' 
        : type === 'video'
        ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        : '',
      caption: type === 'image' ? 'Imagem de apoio da matéria.' : type === 'video' ? 'Vídeo da reportagem.' : undefined,
      credit: type === 'image' ? 'Foto: INFINITY' : type === 'video' ? 'Vídeo: INFINITY' : undefined,
      videoType: type === 'video' ? 'youtube' : undefined,
    };

    if (insertIndex !== undefined && insertIndex >= 0) {
      const updated = [...blocks];
      updated.splice(insertIndex + 1, 0, newBlock);
      setBlocks(updated);
    } else {
      setBlocks([...blocks, newBlock]);
    }
  };

  const updateBlock = (
    index: number, 
    content: string, 
    caption?: string, 
    credit?: string, 
    videoType?: 'youtube' | 'vimeo' | 'mp4' | 'device'
  ) => {
    const updated = [...blocks];
    updated[index].content = content;
    if (caption !== undefined) updated[index].caption = caption;
    if (credit !== undefined) updated[index].credit = credit;
    if (videoType !== undefined) updated[index].videoType = videoType;
    setBlocks(updated);
  };

  const handleBlockVideoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = [...blocks];
        updated[index].content = reader.result;
        updated[index].videoType = 'device';
        if (!updated[index].credit) {
          updated[index].credit = 'Vídeo: Enviado do dispositivo';
        }
        setBlocks(updated);
        setStatusMessage('Arquivo de vídeo carregado com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setBlocks(updated);
  };

  const addTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex justify-center p-2 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[95vh] overflow-hidden border border-gray-200">
        
        {/* Studio Top Header */}
        <div className="bg-[#121212] text-white px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#C4170C] flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  {editingArticle ? 'Editar Reportagem • INFINITY' : 'Redação Inteligente IA • INFINITY'}
                </h2>
                {lastSavedTime ? (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Protótipo salvo às {lastSavedTime}
                  </span>
                ) : (
                  <span className="bg-gray-800 text-gray-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-gray-700">
                    Autosalvamento Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Protótipos não publicados ficam salvos automaticamente. Você pode continuar quando quiser.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('input')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'input' ? 'bg-[#C4170C] text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                1. Colar Texto
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'editor' ? 'bg-[#C4170C] text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                2. Blocos & Fotos ({blocks.length})
              </button>
              <button
                onClick={() => setActiveTab('prototypes')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'prototypes' ? 'bg-amber-400 text-black font-bold' : 'text-amber-300 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>3. Protótipos ({draftsList.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('trash')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'trash' ? 'bg-red-600 text-white font-bold' : 'text-red-400 hover:text-white'
                }`}
                title="Lixeira de matérias apagadas (Apenas Admin)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>4. Lixeira ({trashArticles.length})</span>
              </button>
            </div>

            <button
              onClick={handleSavePrototypeManually}
              title="Salvar como Protótipo Agora"
              className="hidden md:flex items-center space-x-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-2.5 py-1.5 rounded-xl border border-gray-700 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Salvar Protótipo</span>
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition cursor-pointer"
              title="Fechar Redação"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Toolbar: Buscar por nome, Nova Matéria e Lixeira (Conforme Solicitado pelo Usuário) */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 flex-1 max-w-sm sm:max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar por nome da matéria..."
                value={trashSearchQuery}
                onChange={(e) => setTrashSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-4 py-1.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-[#C4170C]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              {trashSearchQuery && (
                <button
                  onClick={() => setTrashSearchQuery('')}
                  className="absolute right-2 top-1.5 text-xs text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveTab('input');
                handleStartFresh();
              }}
              className="flex items-center space-x-1.5 text-xs bg-gray-900 hover:bg-black text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
              title="Criar nova matéria"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Nova Matéria</span>
            </button>

            {/* BOTÃOZINHO DE LIXEIRA DO LADO DO NEGÓCIO PARA BUSCAR POR NOME, DO LADO DO BOTÃO NOVA MATÉRIA */}
            <button
              onClick={() => setActiveTab('trash')}
              className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer border ${
                activeTab === 'trash'
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
              }`}
              title="Lixeira do Administrador"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Lixeira ({trashArticles.length})</span>
            </button>
          </div>
        </div>

        {/* Studio Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
          
          {errorMessage && (
            <div className="mb-4 flex items-center space-x-2 text-sm text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && !errorMessage && (
            <div className="mb-4 flex items-center space-x-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* SUCCESS MODAL CARD */}
          {successArticle && (
            <div className="mb-6 bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-xl text-center animate-fadeIn">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {editingArticle ? 'Matéria Atualizada com Sucesso!' : 'Matéria Publicada no Infinite News!'}
              </h3>
              <p className="text-sm text-gray-600 max-w-lg mx-auto mb-5">
                Gravada no banco de dados e visível imediatamente para todos os visitantes do portal.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onOpenPrintModal(successArticle)}
                  className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-amber-300 font-bold px-5 py-2.5 rounded-xl text-sm shadow transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Baixar em PDF / Imprimir em Folha A4</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex items-center space-x-2 bg-[#C4170C] hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow transition cursor-pointer"
                >
                  <span>Ver Matéria no Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSuccessArticle(null);
                    handleStartFresh();
                  }}
                  className="text-gray-600 hover:text-gray-900 text-sm font-semibold px-4 py-2 cursor-pointer"
                >
                  Criar Outra Notícia
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: RAW TEXT INPUT */}
          {activeTab === 'input' && !successArticle && (
            <div className="space-y-5 max-w-4xl mx-auto">
              
              {/* Draft Resume Banner if there are saved prototypes */}
              {draftsList.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
                      <Bookmark className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Você possui {draftsList.length} protótipo(s) não publicado(s) salvo(s)
                      </h4>
                      <p className="text-xs text-gray-600">
                        Seu trabalho em andamento não foi apagado. Clique em continuar para prosseguir de onde parou.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResumePrototype(draftsList[0])}
                      className="bg-[#C4170C] hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <span>Continuar Último</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('prototypes')}
                      className="bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs px-3 py-2 rounded-xl border border-gray-300 transition cursor-pointer"
                    >
                      Ver Todos ({draftsList.length})
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Exemplos Prontos para Testar:
                  </span>
                  <span className="text-xs text-gray-400">Clique para carregar</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_TEXTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRawText(sample.text)}
                      className="text-xs bg-gray-100 hover:bg-red-50 hover:text-[#C4170C] text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition font-medium cursor-pointer"
                    >
                      {sample.title}
                    </button>
                  ))}
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-xs text-gray-500 hover:text-red-600 px-2 py-1.5 font-medium ml-auto cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-800">
                    Cole o Texto da Matéria:
                  </label>
                  <span className="text-xs text-gray-500">
                    Salva automaticamente como protótipo
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  A IA desmembra o título, subtítulo, negócio/categoria, autor, frases de destaque, palavras-chave e organiza os parágrafos com liberdade total de edição.
                </p>

                <textarea
                  rows={10}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Cole aqui o texto da reportagem..."
                  className="w-full p-4 bg-gray-50 border border-gray-300 rounded-2xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#C4170C] focus:border-transparent transition leading-relaxed font-sans"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-gray-500">
                    {rawText.split(/\s+/).filter(Boolean).length} palavras inseridas
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleParseWithAI}
                      disabled={isParsing || !rawText.trim()}
                      className="flex items-center space-x-2 bg-gradient-to-r from-[#C4170C] to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 text-sm"
                    >
                      {isParsing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Desmembrando Notícia com IA...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 text-amber-300" />
                          <span>Desmembrar Notícia com Inteligência Artificial</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DETAILED EDITORIAL & BLOCK BUILDER */}
          {activeTab === 'editor' && !successArticle && (
            <div className="space-y-6">
              
              {/* SECTION 1: METADATA & CUSTOM CATEGORY */}
              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#C4170C]" />
                      1. Manchete, Subtítulo & Categoria
                    </span>
                    {lastSavedTime && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        Salvo às {lastSavedTime}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSavePrototypeManually}
                      className="text-xs text-gray-700 hover:text-black font-bold flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl border border-gray-300 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-gray-600" />
                      <span>Salvar Protótipo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPrintModal({
                        title,
                        subtitle,
                        chapeu,
                        category: isCustomCategory ? 'outros' : category,
                        customCategory: isCustomCategory ? customCategory : undefined,
                        author,
                        authorRole,
                        blocks,
                        paragraphs: blocks.filter(b => b.type === 'paragraph').map(b => b.content),
                        keyQuotes,
                        tags,
                        imageUrl,
                        imageCaption,
                        imageCredit,
                        newspaperEdition,
                        newspaperYear,
                        newspaperIssue,
                        newspaperPrice,
                        newspaperSection: newspaperSection || `CADERNO ${(isCustomCategory ? customCategory : category).toUpperCase()}`,
                        publishedAt: new Date().toISOString()
                      })}
                      className="text-xs text-gray-800 hover:text-black font-bold flex items-center gap-1 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 cursor-pointer shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-black" />
                      <span>Ver Prévia no Jornal A4 (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Category & Custom Category Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Chapéu / Editoria (Caixa Alta)
                    </label>
                    <input
                      type="text"
                      value={chapeu}
                      onChange={(e) => setChapeu(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-red-700 focus:bg-white"
                      placeholder="EX: ECONOMIA"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Negócio / Categoria
                    </label>
                    <select
                      value={isCustomCategory ? 'custom' : category}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomCategory(true);
                          setNewspaperSection(`CADERNO ${(customCategory || 'ESPECIAL').toUpperCase()}`);
                        } else {
                          setIsCustomCategory(false);
                          setCategory(e.target.value);
                          setNewspaperSection(`CADERNO ${e.target.value.toUpperCase()}`);
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white"
                    >
                      {CATEGORIES.filter(c => c.id !== 'todos').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="custom">+ Adicionar Categoria Personalizada...</option>
                    </select>
                  </div>

                  {/* Custom Category Input if active */}
                  {isCustomCategory ? (
                    <div>
                      <label className="block text-xs font-bold text-amber-900 uppercase mb-1">
                        Nome da Categoria Personalizada
                      </label>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => {
                          setCustomCategory(e.target.value);
                          setNewspaperSection(`CADERNO ${e.target.value.toUpperCase()}`);
                        }}
                        placeholder="Ex: Saúde, Meio Ambiente, Agronegócio..."
                        className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 focus:bg-white"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 pt-5">
                      <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featured}
                          onChange={(e) => setFeatured(e.target.checked)}
                          className="rounded text-[#C4170C] focus:ring-[#C4170C]"
                        />
                        <span>Manchete Principal</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-semibold text-red-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={breakingNews}
                          onChange={(e) => setBreakingNews(e.target.checked)}
                          className="rounded text-red-600 focus:ring-red-600"
                        />
                        <span>Plantão</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Title and Subtitle */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Título Principal da Matéria (Manchete)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Manchete jornalística..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-base font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#C4170C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Linha Fina / Subtítulo Explicativo
                  </label>
                  <textarea
                    rows={2}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Subtítulo fornecendo contexto e resumo..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-700 focus:bg-white"
                  />
                </div>

                {/* Author Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      Nome do Autor
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Nome do repórter..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Cargo / Credencial Editorial
                    </label>
                    <input
                      type="text"
                      value={authorRole}
                      onChange={(e) => setAuthorRole(e.target.value)}
                      placeholder="Ex: Editor de Economia — Brasília"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-700 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: MAIN PHOTO WITH UPLOAD FROM DEVICE */}
              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-2 gap-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    2. Fotografia Principal da Matéria
                  </span>

                  <div className="flex items-center space-x-2">
                    {/* Device Upload Button */}
                    <input
                      type="file"
                      ref={mainFileInputRef}
                      onChange={handleMainPhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => mainFileInputRef.current?.click()}
                      className="flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importar do Computador/Celular</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateAIImage}
                      disabled={isGeneratingImage}
                      className="flex items-center space-x-1 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Gerando com IA...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Gerar Imagem com IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-5 bg-gray-100 rounded-2xl overflow-hidden border border-gray-300 shadow-inner">
                    <img
                      src={imageUrl}
                      alt={title || 'Prévia'}
                      className="w-full h-48 object-cover"
                      onError={() => setImageUrl('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80')}
                    />
                    <div className="p-3 bg-white text-xs space-y-1">
                      <p className="font-medium text-gray-800 italic">{imageCaption}</p>
                      <p className="text-[11px] text-gray-500 font-semibold">{imageCredit}</p>
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        URL da Fotografia
                      </label>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://... ou importe do dispositivo"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-800 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Legenda da Fotografia
                        </label>
                        <input
                          type="text"
                          value={imageCaption}
                          onChange={(e) => setImageCaption(e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Crédito do Fotógrafo
                        </label>
                        <input
                          type="text"
                          value={imageCredit}
                          onChange={(e) => setImageCredit(e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:bg-white"
                        />
                      </div>
                    </div>

                    {suggestedImages && suggestedImages.length > 0 && (
                      <div className="pt-1">
                        <span className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">
                          Ou selecione do acervo:
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {suggestedImages.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setImageUrl(img)}
                              className={`relative rounded-xl overflow-hidden border-2 transition h-16 cursor-pointer ${
                                imageUrl === img ? 'border-[#C4170C] ring-2 ring-red-400' : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <img src={img} alt="Opção" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: STORY BLOCKS BUILDER (PARAGRAPHS, HEADINGS, INLINE IMAGES) */}
              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2">
                  <div>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      3. Blocos da Reportagem (Parágrafos, Subtítulos e Imagens)
                    </span>
                    <p className="text-[11px] text-gray-500">
                      Adicione parágrafos, subtítulos e imagens de apoio. Arraste ou use as setas para definir a ordem exata.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => addBlock('paragraph')}
                      className="flex items-center space-x-1 text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Parágrafo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('heading')}
                      className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer"
                    >
                      <Heading className="w-3.5 h-3.5" />
                      <span>+ Subtítulo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('image')}
                      className="flex items-center space-x-1 text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold px-3 py-1.5 rounded-xl border border-amber-200 transition cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>+ Imagem no Texto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('video')}
                      className="flex items-center space-x-1 text-xs bg-red-50 text-red-800 hover:bg-red-100 font-bold px-3 py-1.5 rounded-xl border border-red-200 transition cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5 text-red-600" />
                      <span>+ Vídeo</span>
                    </button>
                  </div>
                </div>

                {/* Blocks List */}
                <div className="space-y-4">
                  {blocks.map((block, idx) => (
                    <div 
                      key={block.id}
                      className={`rounded-2xl p-4 border transition ${
                        block.type === 'heading' 
                          ? 'bg-blue-50/50 border-blue-200' 
                          : block.type === 'image' 
                          ? 'bg-amber-50/50 border-amber-200' 
                          : block.type === 'video'
                          ? 'bg-red-50/40 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Block header & controls */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-700">
                          {block.type === 'heading' ? (
                            <span className="text-blue-700 flex items-center gap-1">
                              <Heading className="w-3.5 h-3.5" /> Subtítulo / Intertítulo #{idx + 1}
                            </span>
                          ) : block.type === 'image' ? (
                            <span className="text-amber-700 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5" /> Imagem de um canto a outro #{idx + 1}
                            </span>
                          ) : block.type === 'video' ? (
                            <span className="text-red-700 flex items-center gap-1">
                              <Video className="w-3.5 h-3.5 text-red-600" /> Vídeo da Matéria #{idx + 1}
                            </span>
                          ) : (
                            <span className="text-gray-700">
                              Parágrafo #{idx + 1}
                            </span>
                          )}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-gray-500 hover:text-black hover:bg-white rounded transition disabled:opacity-30 cursor-pointer"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 'down')}
                            disabled={idx === blocks.length - 1}
                            className="p-1 text-gray-500 hover:text-black hover:bg-white rounded transition disabled:opacity-30 cursor-pointer"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(idx)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Remover bloco"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Block Content Editor */}
                      {block.type === 'paragraph' && (
                        <textarea
                          rows={3}
                          value={block.content}
                          onChange={(e) => updateBlock(idx, e.target.value)}
                          placeholder="Digite ou edite o parágrafo..."
                          className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#C4170C] leading-relaxed"
                        />
                      )}

                      {block.type === 'heading' && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => updateBlock(idx, e.target.value)}
                          placeholder="Digite o subtítulo que antecede o parágrafo..."
                          className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {block.type === 'image' && (
                        <div className="space-y-3 bg-white p-3 rounded-xl border border-amber-200">
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <img
                              src={block.content}
                              alt="Bloco"
                              className="w-full sm:w-48 h-28 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';
                              }}
                            />
                            <div className="w-full space-y-2">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-0.5">
                                  URL da Imagem
                                </label>
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => updateBlock(idx, e.target.value, block.caption, block.credit)}
                                  placeholder="https://... ou importe do seu aparelho"
                                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <label className="text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Importar Imagem</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleBlockPhotoUpload(idx, e)}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase">
                                Legenda da Foto
                              </label>
                              <input
                                type="text"
                                value={block.caption || ''}
                                onChange={(e) => updateBlock(idx, block.content, e.target.value, block.credit)}
                                placeholder="Legenda..."
                                className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase">
                                Crédito do Fotógrafo
                              </label>
                              <input
                                type="text"
                                value={block.credit || ''}
                                onChange={(e) => updateBlock(idx, block.content, block.caption, e.target.value)}
                                placeholder="Foto: ..."
                                className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {block.type === 'video' && (
                        <div className="space-y-3 bg-white p-3.5 rounded-xl border border-red-200">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-red-900 uppercase mb-0.5">
                                Link do Vídeo (YouTube, Vimeo ou Link Direto MP4)
                              </label>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(idx, e.target.value, block.caption, block.credit, 'youtube')}
                                placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono"
                              />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="text-xs font-bold bg-red-50 text-red-800 hover:bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Importar Arquivo de Vídeo (.mp4)</span>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleBlockVideoUpload(idx, e)}
                                  className="hidden"
                                />
                              </label>

                              <span className="text-[10px] text-gray-500 italic bg-gray-100 px-2 py-0.5 rounded">
                                Ocultado automaticamente na versão impressa em PDF A4
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase">
                                Legenda do Vídeo
                              </label>
                              <input
                                type="text"
                                value={block.caption || ''}
                                onChange={(e) => updateBlock(idx, block.content, e.target.value, block.credit, block.videoType)}
                                placeholder="Ex: Reportagem especial em vídeo..."
                                className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase">
                                Crédito da Produção
                              </label>
                              <input
                                type="text"
                                value={block.credit || ''}
                                onChange={(e) => updateBlock(idx, block.content, block.caption, e.target.value, block.videoType)}
                                placeholder="Vídeo: INFINITY"
                                className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick insert buttons between blocks */}
                      <div className="flex items-center justify-end space-x-2 pt-2 text-[11px] text-gray-500">
                        <span>Inserir após este bloco:</span>
                        <button
                          type="button"
                          onClick={() => addBlock('paragraph', idx)}
                          className="hover:text-emerald-700 font-bold cursor-pointer"
                        >
                          + Parágrafo
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => addBlock('heading', idx)}
                          className="hover:text-blue-700 font-bold cursor-pointer"
                        >
                          + Subtítulo
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => addBlock('image', idx)}
                          className="hover:text-amber-700 font-bold cursor-pointer"
                        >
                          + Imagem
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => addBlock('video', idx)}
                          className="hover:text-red-700 font-bold cursor-pointer"
                        >
                          + Vídeo
                        </button>
                      </div>
                    </div>
                  ))}

                  {blocks.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-2xl bg-white space-y-3">
                      <p className="text-xs text-gray-500 font-medium">
                        Nenhum bloco de texto ainda. Cole um texto na aba 1 ou adicione manualmente abaixo:
                      </p>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => addBlock('paragraph')}
                          className="text-xs bg-[#C4170C] text-white font-bold px-4 py-2 rounded-xl cursor-pointer"
                        >
                          + Iniciar com Parágrafo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: KEY QUOTES & SEARCH TAGS */}
              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Quote className="w-4 h-4 text-purple-600" />
                  4. Frases em Destaque & Palavras-Chave
                </span>

                {/* Key Quotes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Frase de Destaque no Texto e no Jornal
                  </label>
                  <input
                    type="text"
                    value={keyQuotes[0] || ''}
                    onChange={(e) => setKeyQuotes([e.target.value])}
                    placeholder="Ex: 'A tecnologia revoluciona o diagnóstico...' "
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs italic font-serif text-gray-800 focus:bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Esta frase ganha destaque especial no layout da matéria e no quadro do jornal impresso A4.
                  </p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-gray-500" />
                    Palavras-Chave e Tags do Título e Texto
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((t, idx) => (
                      <span 
                        key={idx}
                        className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1 font-medium"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="hover:text-red-600 ml-1 font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Adicionar nova palavra-chave..."
                      className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs w-64"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="text-xs bg-gray-800 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 5: NEWSPAPER METADATA CUSTOMIZATION */}
              <div className="bg-amber-50/60 border border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-amber-800" />
                    5. Personalizar Cabeçalho do Jornal Impresso A4 (Edição 2026)
                  </span>
                  <span className="text-xs font-bold text-amber-800">Ano Atual: 2026</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Edição do Jornal</label>
                    <input
                      type="text"
                      value={newspaperEdition}
                      onChange={(e) => setNewspaperEdition(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold"
                      placeholder="Edição Nacional"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Ano do Jornal</label>
                    <input
                      type="text"
                      value={newspaperYear}
                      onChange={(e) => setNewspaperYear(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold"
                      placeholder="Ano XXXIV (2026)"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Número da Edição</label>
                    <input
                      type="text"
                      value={newspaperIssue}
                      onChange={(e) => setNewspaperIssue(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold"
                      placeholder="N° 14.280"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Preço de Banca</label>
                    <input
                      type="text"
                      value={newspaperPrice}
                      onChange={(e) => setNewspaperPrice(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold"
                      placeholder="R$ 4,50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-amber-900 mb-1 text-xs">
                    Nome do Caderno no Jornal Impresso
                  </label>
                  <input
                    type="text"
                    value={newspaperSection}
                    onChange={(e) => setNewspaperSection(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-950 uppercase"
                    placeholder="CADERNO CIÊNCIA / CADERNO SAÚDE / CADERNO ESPECIAL"
                  />
                  <p className="text-[11px] text-amber-800/80 mt-1">
                    Exibido no selo de abertura de página no jornal impresso (ex: CADERNO SAÚDE, CADERNO MEIO AMBIENTE).
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PROTOTYPES / DRAFTS MANAGEMENT */}
          {activeTab === 'prototypes' && !successArticle && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-[#C4170C]" />
                      <span>Meus Protótipos Salvos ({draftsList.length})</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Todas as notícias que você começou a fazer e não publicou ficam guardadas aqui. Elas não são apagadas.
                    </p>
                  </div>

                  <button
                    onClick={handleStartFresh}
                    className="flex items-center space-x-1.5 text-xs bg-gray-900 hover:bg-black text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Iniciar Novo Protótipo</span>
                  </button>
                </div>

                {draftsList.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-700">Nenhum protótipo salvo no momento</h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Conforme você digita ou cola um texto na redação, ele é gravado automaticamente aqui como protótipo para que você nunca perca o trabalho.
                    </p>
                    <button
                      onClick={() => setActiveTab('input')}
                      className="bg-[#C4170C] hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Começar a Escrever
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {draftsList.map((draft) => (
                      <div 
                        key={draft.id}
                        className={`border rounded-2xl p-4 bg-white hover:border-gray-400 transition shadow-xs flex flex-col justify-between ${
                          currentDraftId === draft.id ? 'ring-2 ring-[#C4170C] border-transparent' : 'border-gray-200'
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-center justify-between text-[11px] mb-2">
                            <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800">
                              {draft.customCategory || draft.category || 'Geral'}
                            </span>
                            <span className="text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(draft.lastModified).toLocaleDateString('pt-BR')} às {new Date(draft.lastModified).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Title & Subtitle */}
                          <h4 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2 mb-1">
                            {draft.title || 'Protótipo sem título'}
                          </h4>
                          {draft.subtitle && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2 italic">
                              {draft.subtitle}
                            </p>
                          )}

                          {/* Stats badge */}
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3 pt-1 border-t border-gray-100">
                            <span>{draft.blocks ? draft.blocks.length : (draft.paragraphs?.length || 0)} blocos</span>
                            <span>•</span>
                            <span>{draft.author || 'Redação'}</span>
                            {currentDraftId === draft.id && (
                              <span className="text-emerald-600 font-bold ml-auto">• Aberto agora</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenPrintModal(draft)}
                            className="flex items-center space-x-1 text-xs text-gray-700 hover:text-black font-semibold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            title="Visualizar e Imprimir A4 sem precisar publicar"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-700" />
                            <span>Imprimir A4</span>
                          </button>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeletePrototype(draft.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Excluir este protótipo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResumePrototype(draft)}
                              className="flex items-center space-x-1.5 text-xs bg-[#C4170C] hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                            >
                              <span>Continuar</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: LIXEIRA DO ADMINISTRADOR (RESTAURAR E EXCLUIR DEFINITIVO) */}
          {activeTab === 'trash' && !successArticle && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
              <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                
                {/* Header da Lixeira */}
                <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-600" />
                      <span>Lixeira do Administrador ({trashArticles.length})</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      As matérias apagadas não são visíveis para nenhum visitante do site. Ficam guardadas aqui até você restaurar.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {trashArticles.length > 0 && onEmptyTrash && (
                      <button
                        onClick={async () => {
                          if (window.confirm ? window.confirm('Deseja esvaziar permanentemente todas as matérias da lixeira?') : true) {
                            await onEmptyTrash();
                            setStatusMessage('Lixeira esvaziada com sucesso!');
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-bold px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 transition cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Esvaziar Tudo</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab('input');
                        handleStartFresh();
                      }}
                      className="flex items-center space-x-1.5 text-xs bg-gray-900 hover:bg-black text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nova Matéria</span>
                    </button>
                  </div>
                </div>

                {/* Privacy Guarantee Notice */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 my-4 flex items-center gap-2 text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Privacidade Total da Lixeira:</strong> Ninguém além do administrador tem acesso ou vê o que está na lixeira. Ao clicar em <strong>Restaurar</strong>, a notícia volta imediatamente para o portal.
                  </span>
                </div>

                {/* Filtered Trash List */}
                {(() => {
                  const filtered = trashArticles.filter((item) => {
                    if (!trashSearchQuery.trim()) return true;
                    const q = trashSearchQuery.toLowerCase().trim();
                    return (
                      item.title?.toLowerCase().includes(q) ||
                      item.subtitle?.toLowerCase().includes(q) ||
                      item.author?.toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 space-y-3">
                        <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto border border-gray-200">
                          <Trash2 className="w-7 h-7 text-gray-400" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-700">
                          {trashSearchQuery ? 'Nenhuma matéria encontrada com esse nome na lixeira' : 'A lixeira está vazia'}
                        </h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                          {trashSearchQuery 
                            ? 'Tente buscar por outras palavras-chave ou limpe a busca acima.' 
                            : 'Quando você clicar em "Apagar" em qualquer matéria no portal, ela virá para cá e você poderá restaurá-la a qualquer momento.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 pt-2">
                      {filtered.map((item) => (
                        <div
                          key={item.id}
                          className="border border-gray-200 hover:border-gray-300 rounded-2xl p-4 bg-white shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shrink-0 border border-gray-200 grayscale-30"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800">
                                  {item.customCategory || item.category || 'Geral'}
                                </span>
                                {item.deletedAt && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Excluída em: {new Date(item.deletedAt).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2">
                                {item.title}
                              </h4>

                              {item.subtitle && (
                                <p className="text-xs text-gray-500 line-clamp-1 italic font-serif">
                                  {item.subtitle}
                                </p>
                              )}

                              <div className="text-[11px] text-gray-400">
                                Autor original: <strong>{item.author || 'Redação'}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            {/* Botão Restaurar */}
                            <button
                              type="button"
                              onClick={async () => {
                                if (onRestoreArticle) {
                                  setTrashActionId(item.id);
                                  try {
                                    await onRestoreArticle(item.id);
                                    setStatusMessage(`"${item.title}" foi restaurada com sucesso para o portal!`);
                                    setTimeout(() => setStatusMessage(''), 4000);
                                  } finally {
                                    setTrashActionId(null);
                                  }
                                }
                              }}
                              disabled={trashActionId === item.id}
                              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Restaurar de volta para o portal"
                            >
                              <RotateCcw className={`w-3.5 h-3.5 stroke-[2.5] ${trashActionId === item.id ? 'animate-spin' : ''}`} />
                              <span>Restaurar</span>
                            </button>

                            {/* Botão Excluir Permanente */}
                            {confirmDeleteId === item.id ? (
                              <div className="flex items-center space-x-1 bg-red-50 border border-red-300 p-1 rounded-xl">
                                <span className="text-[10px] font-bold text-red-800 px-1">Excluir permanente?</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (onPermanentDeleteArticle) {
                                      setTrashActionId(item.id);
                                      try {
                                        await onPermanentDeleteArticle(item.id);
                                        setConfirmDeleteId(null);
                                        setStatusMessage('Matéria excluída permanentemente.');
                                        setTimeout(() => setStatusMessage(''), 4000);
                                      } finally {
                                        setTrashActionId(null);
                                      }
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                                >
                                  Sim
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="bg-gray-200 text-gray-700 text-[11px] font-bold px-1.5 py-1 rounded-lg cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer"
                                title="Excluir permanentemente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

        </div>

        {/* Studio Sticky Footer Actions */}
        <div className="bg-white border-t border-gray-200 px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenPrintModal({
                title,
                subtitle,
                chapeu,
                category: isCustomCategory ? 'outros' : category,
                customCategory: isCustomCategory ? customCategory : undefined,
                author,
                authorRole,
                blocks,
                paragraphs: blocks.filter(b => b.type === 'paragraph').map(b => b.content),
                keyQuotes,
                tags,
                imageUrl,
                imageCaption,
                imageCredit,
                newspaperEdition,
                newspaperYear,
                newspaperIssue,
                newspaperPrice,
                newspaperSection: newspaperSection || `CADERNO ${(isCustomCategory ? customCategory : category).toUpperCase()}`,
                publishedAt: new Date().toISOString()
              })}
              disabled={!title.trim() || blocks.length === 0}
              className="flex items-center space-x-2 bg-gray-900 hover:bg-black text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-gray-700 transition cursor-pointer disabled:opacity-40"
              title="Visualizar em formato de jornal impresso e baixar imagem tamanho A4"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Ver no Jornal Impresso A4 (Baixar Imagem)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              Fechar
            </button>

            <button
              onClick={handlePublish}
              disabled={isPublishing || !title.trim() || blocks.length === 0}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-2xl text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvando no Banco de Dados...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{editingArticle ? 'Salvar Alterações da Matéria' : 'Publicar Notícia no INFINITY'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
