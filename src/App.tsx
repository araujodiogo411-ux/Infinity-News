import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeNewsFeed } from './components/HomeNewsFeed';
import { ArticleDetailView } from './components/ArticleDetailView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminStudio } from './components/AdminStudio';
import { NewspaperPrintModal } from './components/NewspaperPrintModal';
import { VirtualReporterModal } from './components/VirtualReporterModal';
import { NewsArticle, FinancialQuotes } from './types/news';
import { Newspaper } from 'lucide-react';
import { AdminQuotesModal } from './components/AdminQuotesModal';
import { BrasiliaStreetTourModal } from './components/BrasiliaStreetTourModal';
import { TrashModal } from './components/TrashModal';
import { 
  subscribeToArticles, 
  getActiveArticles, 
  getTrashArticles, 
  saveArticleToFirestore, 
  moveArticleToTrashInFirestore, 
  restoreArticleInFirestore, 
  permanentDeleteInFirestore,
  seedFirestoreIfEmpty 
} from './services/articleService';
import { subscribeToQuotes, getQuotesFromFirestore } from './services/quotesService';

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [trashArticles, setTrashArticles] = useState<NewsArticle[]>([]);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentArticle, setCurrentArticle] = useState<NewsArticle | null>(null);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminStudio, setShowAdminStudio] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Admin Financial Quotes Modal
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [currentQuotes, setCurrentQuotes] = useState<any>({
    dolar: { valueFormatted: 'R$ 5,68', pctFormatted: '+0,32%', isPositive: true },
    euro: { valueFormatted: 'R$ 6,14', pctFormatted: '+0,18%', isPositive: true },
    pib: { pointsFormatted: 'R$ 10,9 tri', pctFormatted: '+2,9% a.a.', isPositive: true },
    ibovespa: { pointsFormatted: 'R$ 10,9 tri', pctFormatted: '+2,9% a.a.', isPositive: true },
    bitcoin: { valueFormatted: 'R$ 585.000', pctFormatted: '+1,45%', isPositive: true },
    cryptoGlobal: { totalCryptosFormatted: '17.482 criptos' }
  });

  // Brasília Street Tour Modal
  const [showBrasiliaTour, setShowBrasiliaTour] = useState(false);

  // Newspaper Print Modal state
  const [printArticle, setPrintArticle] = useState<Partial<NewsArticle> | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Virtual Reporter Fifine Modal state
  const [showVirtualReporter, setShowVirtualReporter] = useState(false);
  const [reporterContextArticle, setReporterContextArticle] = useState<NewsArticle | null>(null);

  // Check stored admin status
  useEffect(() => {
    const saved = localStorage.getItem('jornada_admin_auth');
    if (saved === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // Fetch articles from backend database
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'todos') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`/api/articles?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
        
        if (currentArticle) {
          const fresh = data.articles.find((a: NewsArticle) => a.id === currentArticle.id);
          if (fresh) setCurrentArticle(fresh);
        }
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trashed articles for admin
  const fetchTrashArticles = async () => {
    try {
      const res = await fetch('/api/articles/trash');
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setTrashArticles(data.articles);
      }
    } catch (err) {
      console.error('Error fetching trash articles:', err);
    }
  };

  useEffect(() => {
    // 1. Seed Cloud Firestore with initial curated articles if collection is fresh
    seedFirestoreIfEmpty().catch(err => console.warn('Firestore initial check:', err));

    // 2. Attach real-time Firestore listener for live cloud updates
    const unsubscribe = subscribeToArticles(
      (liveArticles) => {
        if (Array.isArray(liveArticles) && liveArticles.length > 0) {
          // If a category is selected or search query is typed, filter accordingly
          let filtered = liveArticles;
          if (selectedCategory && selectedCategory !== 'todos') {
            const catLower = selectedCategory.toLowerCase();
            filtered = filtered.filter(a => 
              a.category?.toLowerCase() === catLower ||
              a.customCategory?.toLowerCase() === catLower
            );
          }
          if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter(a => 
              a.title?.toLowerCase().includes(q) ||
              a.subtitle?.toLowerCase().includes(q) ||
              a.author?.toLowerCase().includes(q) ||
              a.tags?.some((t: string) => t.toLowerCase().includes(q))
            );
          }
          setArticles(filtered);
          setLoading(false);

          if (currentArticle) {
            const fresh = liveArticles.find((a: NewsArticle) => a.id === currentArticle.id);
            if (fresh) setCurrentArticle(fresh);
          }
        }
      },
      (liveTrash) => {
        if (Array.isArray(liveTrash)) {
          setTrashArticles(liveTrash);
        }
      }
    );

    // 3. Also fetch from backend as fallback sync
    fetchArticles();
    if (isAdmin) {
      fetchTrashArticles();
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedCategory, searchQuery, isAdmin]);

  // Real-time Firestore quotes synchronization
  useEffect(() => {
    getQuotesFromFirestore().then((initialQuotes) => {
      if (initialQuotes) setCurrentQuotes(initialQuotes);
    }).catch(err => console.warn('[App] Quotes firestore init error:', err));

    const unsubscribeQuotes = subscribeToQuotes((liveQuotes) => {
      if (liveQuotes) {
        setCurrentQuotes(liveQuotes);
      }
    });

    return () => {
      if (typeof unsubscribeQuotes === 'function') {
        unsubscribeQuotes();
      }
    };
  }, []);

  // Admin Handlers
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminStudio(true);
    fetchTrashArticles();
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('jornada_admin_auth');
    setIsAdmin(false);
    setShowAdminStudio(false);
    setShowTrashModal(false);
    setEditingArticle(null);
  };

  // When a new article is published or edited from Admin Studio
  const handleArticlePublished = async (articleData: NewsArticle) => {
    // 1. Save directly to Cloud Firestore Database
    try {
      await saveArticleToFirestore(articleData);
    } catch (fsErr) {
      console.warn('Sync to Firestore:', fsErr);
    }

    setArticles(prev => {
      const exists = prev.some(a => a.id === articleData.id);
      if (exists) {
        return prev.map(a => a.id === articleData.id ? articleData : a);
      }
      return [articleData, ...prev];
    });
    setCurrentArticle(articleData);
    setEditingArticle(null);
  };

  // Delete article handler (Moves to trash in Cloud Firestore)
  const handleDeleteArticle = async (articleId: string) => {
    try {
      // Move to trash in Cloud Firestore
      await moveArticleToTrashInFirestore(articleId);

      // Remove from published articles locally immediately
      setArticles(prev => {
        const target = prev.find(a => a.id === articleId);
        if (target) {
          const trashed: NewsArticle = { ...target, isDeleted: true, deletedAt: new Date().toISOString() };
          setTrashArticles(oldTrash => [trashed, ...oldTrash.filter(t => t.id !== articleId)]);
        }
        return prev.filter(a => a.id !== articleId);
      });

      if (currentArticle?.id === articleId) {
        setCurrentArticle(null);
      }
    } catch (e) {
      console.error('Error deleting article in Firestore:', e);
    }
  };

  // Restore article from trash back to portal in Cloud Firestore
  const handleRestoreArticle = async (articleId: string) => {
    try {
      // Restore in Cloud Firestore
      await restoreArticleInFirestore(articleId);

      setTrashArticles(prev => prev.filter(a => a.id !== articleId));
      fetchArticles();
    } catch (e) {
      console.error('Error restoring article in Firestore:', e);
    }
  };

  // Permanently delete article from trash in Cloud Firestore
  const handlePermanentDeleteArticle = async (articleId: string) => {
    try {
      // Permanently remove document from Cloud Firestore
      await permanentDeleteInFirestore(articleId);

      setTrashArticles(prev => prev.filter(a => a.id !== articleId));
    } catch (e) {
      console.error('Error permanently deleting article in Firestore:', e);
    }
  };

  // Empty all trash
  const handleEmptyTrash = async () => {
    try {
      for (const item of trashArticles) {
        await permanentDeleteInFirestore(item.id);
      }
      setTrashArticles([]);
      await fetch('/api/articles-trash/empty', { method: 'DELETE' });
    } catch (e) {
      console.error('Error emptying trash in Firestore:', e);
    }
  };

  // Edit existing article handler
  const handleEditArticle = (article: NewsArticle) => {
    setEditingArticle(article);
    setShowAdminStudio(true);
  };

  // Open Newspaper print modal (Only accessible to admin)
  const handleOpenPrintModal = (article: Partial<NewsArticle>) => {
    if (!isAdmin) {
      setShowAdminLogin(true);
      return;
    }
    setPrintArticle(article);
    setShowPrintModal(true);
  };

  // Open Virtual Reporter Fifine
  const handleOpenVirtualReporter = (article?: NewsArticle) => {
    setReporterContextArticle(article || currentArticle || null);
    setShowVirtualReporter(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8] text-[#1a1a1a]">
      
      {/* Top Header */}
      <Header
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setShowAdminLogin(true)}
        onOpenAdminStudio={() => {
          setEditingArticle(null);
          setShowAdminStudio(true);
        }}
        onLogoutAdmin={handleAdminLogout}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setCurrentArticle(null);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateHome={() => setCurrentArticle(null)}
        onOpenVirtualReporter={() => handleOpenVirtualReporter()}
        onOpenAdminQuotes={() => setShowQuotesModal(true)}
        onOpenBrasiliaTour={() => setShowBrasiliaTour(true)}
        onOpenTrash={() => setShowTrashModal(true)}
        trashCount={trashArticles.length}
        currentQuotes={currentQuotes}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {loading && articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-4 border-[#C4170C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-gray-500">Carregando notícias do INFINITY...</p>
          </div>
        ) : currentArticle ? (
          <ArticleDetailView
            article={currentArticle}
            onBack={() => setCurrentArticle(null)}
            onOpenPrintModal={(art) => handleOpenPrintModal(art)}
            onArticleUpdated={(updated) => setCurrentArticle(updated)}
            onOpenVirtualReporter={(art) => handleOpenVirtualReporter(art)}
            isAdmin={isAdmin}
            onEditArticle={handleEditArticle}
            onDeleteArticle={handleDeleteArticle}
          />
        ) : (
          <HomeNewsFeed
            articles={articles}
            selectedCategory={selectedCategory}
            onSelectArticle={(art) => setCurrentArticle(art)}
            onOpenPrintModal={(art) => handleOpenPrintModal(art)}
            onOpenAdminStudio={() => {
              setEditingArticle(null);
              setShowAdminStudio(true);
            }}
            isAdmin={isAdmin}
            onOpenVirtualReporter={() => handleOpenVirtualReporter()}
            onEditArticle={handleEditArticle}
            onDeleteArticle={handleDeleteArticle}
            onOpenAdminQuotes={() => setShowQuotesModal(true)}
            onOpenBrasiliaTour={() => setShowBrasiliaTour(true)}
            onOpenTrash={() => setShowTrashModal(true)}
            trashCount={trashArticles.length}
          />
        )}
      </main>

      {/* Portal Footer */}
      <footer className="bg-[#121212] text-gray-400 text-xs border-t border-gray-800 mt-16 pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div 
                onClick={isAdmin ? () => setShowAdminStudio(true) : () => setShowAdminLogin(true)}
                className="bg-white text-[#C4170C] font-black text-2xl px-2.5 py-0.5 rounded-xl cursor-pointer select-none"
                title="INFINITY"
              >
                i1
              </div>
              <div>
                <h3 className="text-white font-black text-lg tracking-tight">INFINITY</h3>
                <p className="text-[11px] text-gray-400">O portal de notícias em tempo real • Jornalismo Independente</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <button 
                onClick={() => { setSelectedCategory('todos'); setCurrentArticle(null); }}
                className="hover:text-white transition cursor-pointer"
              >
                Página Inicial
              </button>
              <button 
                onClick={() => handleOpenVirtualReporter()}
                className="hover:text-white transition cursor-pointer"
              >
                Repórter IA Fifine
              </button>
              
              {/* Only show newspaper A4 image / PDF action if Admin */}
              {isAdmin && (
                <>
                  <button 
                    onClick={() => {
                      if (articles[0]) handleOpenPrintModal(articles[0]);
                    }}
                    className="hover:text-white transition cursor-pointer flex items-center gap-1 text-amber-400 font-bold"
                  >
                    <Newspaper className="w-3.5 h-3.5" />
                    <span>Baixar Edição A4 em Imagem / PDF</span>
                  </button>
                  <button 
                    onClick={() => {
                      setEditingArticle(null);
                      setShowAdminStudio(true);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                  >
                    Painel da Redação
                  </button>
                  <button 
                    onClick={() => setShowTrashModal(true)}
                    className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
                  >
                    Lixeira ({trashArticles.length})
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-gray-500">
            <p>© {new Date().getFullYear()} INFINITY Comunicação S/A. Todos os direitos reservados.</p>
            <p>Redação Central: Brasília • São Paulo • Rio de Janeiro. Atualizado em tempo real.</p>
          </div>
        </div>
      </footer>

      {/* Secret Admin Login Modal (Triggered by Logo Click, Password: Jornada Canva) */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* AI Admin Studio (Supports Creating & Editing, Custom Categories, Image Upload, Story Blocks, Newspaper Metadata, Lixeira) */}
      <AdminStudio
        isOpen={showAdminStudio}
        onClose={() => {
          setShowAdminStudio(false);
          setEditingArticle(null);
        }}
        onArticlePublished={handleArticlePublished}
        onOpenPrintModal={handleOpenPrintModal}
        editingArticle={editingArticle}
        trashArticles={trashArticles}
        onRestoreArticle={handleRestoreArticle}
        onPermanentDeleteArticle={handlePermanentDeleteArticle}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* Admin Trash Modal (Lixeira do Administrador) */}
      <TrashModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        trashArticles={trashArticles}
        onRestoreArticle={handleRestoreArticle}
        onPermanentDeleteArticle={handlePermanentDeleteArticle}
        onEmptyTrash={handleEmptyTrash}
        onOpenNewArticle={() => {
          setEditingArticle(null);
          setShowAdminStudio(true);
        }}
        isAdmin={isAdmin}
      />

      {/* Newspaper Print Modal (PDF format for printing authentic broadsheet with 3D Preview) */}
      <NewspaperPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        article={printArticle}
        isAdmin={isAdmin}
      />

      {/* Virtual Reporter Fifine Modal with 3D Mascot */}
      <VirtualReporterModal
        isOpen={showVirtualReporter}
        onClose={() => setShowVirtualReporter(false)}
        currentArticle={reporterContextArticle}
      />

      {/* Admin Financial Quotes & PIB Modal */}
      <AdminQuotesModal
        isOpen={showQuotesModal}
        onClose={() => setShowQuotesModal(false)}
        currentQuotes={currentQuotes}
        onQuotesUpdated={(updated) => setCurrentQuotes(updated)}
      />

      {/* Brasília Street & Landmark Tour Modal */}
      <BrasiliaStreetTourModal
        isOpen={showBrasiliaTour}
        onClose={() => setShowBrasiliaTour(false)}
        isAdmin={isAdmin}
      />

    </div>
  );
}
