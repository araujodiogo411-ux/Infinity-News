import React, { useState } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Eye, 
  Printer, 
  Radio, 
  Sparkles, 
  ArrowRight,
  Edit,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { NewsArticle, CATEGORIES } from '../types/news';
import { NewsGlobe3D } from './NewsGlobe3D';

interface HomeNewsFeedProps {
  articles: NewsArticle[];
  selectedCategory: string;
  onSelectArticle: (article: NewsArticle) => void;
  onOpenPrintModal: (article: NewsArticle) => void;
  onOpenAdminStudio: () => void;
  isAdmin: boolean;
  onOpenVirtualReporter: () => void;
  onEditArticle?: (article: NewsArticle) => void;
  onDeleteArticle?: (articleId: string) => void;
  onOpenAdminQuotes?: () => void;
  onOpenBrasiliaTour?: () => void;
  onOpenTrash?: () => void;
  trashCount?: number;
}

export const HomeNewsFeed: React.FC<HomeNewsFeedProps> = ({
  articles,
  selectedCategory,
  onSelectArticle,
  onOpenPrintModal,
  onOpenAdminStudio,
  isAdmin,
  onOpenVirtualReporter,
  onEditArticle,
  onDeleteArticle,
  onOpenAdminQuotes,
  onOpenBrasiliaTour,
  onOpenTrash,
  trashCount = 0
}) => {
  if (articles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 text-[#C4170C] rounded-full flex items-center justify-center mx-auto mb-4">
          <Radio className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma notícia encontrada</h3>
        <p className="text-sm text-gray-600 mb-6">
          Não há matérias registradas nesta categoria no momento.
        </p>
        {isAdmin && (
          <button
            onClick={onOpenAdminStudio}
            className="bg-[#C4170C] text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow hover:bg-red-700 transition"
          >
            Publicar Matéria com IA
          </button>
        )}
      </div>
    );
  }

  // Find breaking news
  const breakingArticle = articles.find(a => a.breakingNews);

  // Main featured article (either marked featured or latest)
  const featuredArticle = articles.find(a => a.featured) || articles[0];

  // Secondary articles (next 2-3 items)
  const secondaryArticles = articles.filter(a => a.id !== featuredArticle.id).slice(0, 3);

  // Remaining articles for the lower grid
  const remainingArticles = articles.filter(
    a => a.id !== featuredArticle.id && !secondaryArticles.some(s => s.id === a.id)
  );

  // Most read articles (sorted by views)
  const mostRead = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `Há ${Math.max(1, diffMins)} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getCategoryBadge = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId)?.badgeColor || 'bg-red-600';
  };

  const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);
  const [deleteToast, setDeleteToast] = useState('');

  const handleDeleteClick = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    setArticleToDelete(article);
  };

  const handleConfirmDelete = () => {
    if (articleToDelete) {
      const title = articleToDelete.title;
      onDeleteArticle?.(articleToDelete.id);
      setArticleToDelete(null);
      setDeleteToast(`A matéria "${title}" foi movida para a Lixeira do Administrador.`);
      setTimeout(() => setDeleteToast(''), 4500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-8 animate-fadeIn">
      
      {/* Breaking News Ticker Banner */}
      {breakingArticle && (
        <div 
          onClick={() => onSelectArticle(breakingArticle)}
          className="bg-gradient-to-r from-red-700 via-[#C4170C] to-red-800 text-white p-3 sm:p-4 rounded-2xl shadow-md flex items-center justify-between cursor-pointer hover:brightness-105 transition group"
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className="bg-white text-[#C4170C] font-black text-[11px] uppercase tracking-wider px-2 py-0.5 rounded shadow shrink-0 animate-pulse">
              Plantão
            </span>
            <p className="text-xs sm:text-sm font-bold truncate group-hover:underline">
              {breakingArticle.title}
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-3 text-xs font-semibold text-red-100">
            <span className="hidden sm:inline">Ver cobertura</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
          </div>
        </div>
      )}

      {/* 3D REALISTIC PLANET EARTH GLOBE WITH GEOID TOPOGRAPHY & CONTINENTS */}
      <section className="mb-2">
        <NewsGlobe3D
          isAdmin={isAdmin}
          onOpenAdminQuotes={onOpenAdminQuotes}
          onOpenBrasiliaTourExternal={onOpenBrasiliaTour}
        />
      </section>

      {/* HERO SECTION: G1-STYLE EDITORIAL GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Super Headline + Secondary Grid (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Hero Card (Super Destaque de Capa) */}
          <div 
            onClick={() => onSelectArticle(featuredArticle)}
            className="group bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col"
          >
            <div className="relative overflow-hidden h-72 sm:h-96">
              <img
                src={featuredArticle.imageUrl}
                alt={featuredArticle.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              
              {/* Category tag */}
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded text-white shadow ${getCategoryBadge(featuredArticle.category)}`}>
                  {featuredArticle.customCategory || featuredArticle.chapeu || featuredArticle.category.toUpperCase()}
                </span>
                <span className="bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-300" />
                  {formatTimeAgo(featuredArticle.publishedAt)}
                </span>
              </div>

              {/* Title and subtitle */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-2">
                <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-black leading-tight group-hover:text-amber-200 transition drop-shadow">
                  {featuredArticle.title}
                </h2>
                {featuredArticle.subtitle && (
                  <p className="hidden sm:block text-xs sm:text-sm text-gray-200 font-serif-news italic line-clamp-2 drop-shadow">
                    {featuredArticle.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom metadata bar with Admin Controls if Admin */}
            <div className="p-4 bg-white flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2 border-t border-gray-100">
              <div className="flex items-center space-x-2 font-medium">
                <span className="font-bold text-gray-900">{featuredArticle.author}</span>
                <span>•</span>
                <span>{featuredArticle.readTime || '3 min'}</span>
              </div>

              <div className="flex items-center space-x-3">
                {/* ADMIN ONLY CONTROLS */}
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditArticle?.(featuredArticle);
                      }}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg"
                      title="Editar esta reportagem"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, featuredArticle)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-bold cursor-pointer bg-red-50 px-2.5 py-1 rounded-lg"
                      title="Apagar esta reportagem"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Apagar</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPrintModal(featuredArticle);
                      }}
                      className="flex items-center space-x-1 text-gray-800 hover:text-black font-bold cursor-pointer bg-amber-100 px-2.5 py-1 rounded-lg"
                      title="Imprimir formato jornal em PDF (Admin)"
                    >
                      <Printer className="w-3.5 h-3.5 text-gray-700" />
                      <span>Jornal PDF</span>
                    </button>
                  </>
                )}

                <div className="flex items-center space-x-1 text-gray-500">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{featuredArticle.views || 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Sub-Headlines (2-col grid) */}
          {secondaryArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {secondaryArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => onSelectArticle(article)}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className={`absolute top-2.5 left-2.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${getCategoryBadge(article.category)}`}>
                        {article.customCategory || article.chapeu || article.category.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-headline text-base sm:text-lg font-bold text-gray-950 leading-snug group-hover:text-[#C4170C] transition line-clamp-2">
                        {article.title}
                      </h3>
                      {article.subtitle && (
                        <p className="text-xs text-gray-600 line-clamp-2 font-serif-news italic">
                          {article.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-50 mt-2">
                    <span>{formatTimeAgo(article.publishedAt)}</span>

                    {/* Admin Only Actions */}
                    {isAdmin ? (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditArticle?.(article);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, article)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                          title="Apagar matéria"
                        >
                          Apagar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPrintModal(article);
                          }}
                          className="text-gray-800 hover:text-black flex items-center gap-1 font-bold"
                        >
                          <Printer className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Rail */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Authentic Newspaper Mockup Callout Card (Visible to Admin or Read-only info) */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black text-white rounded-3xl p-5 shadow-lg border border-gray-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-400" />
                Edição Impressa • Diário
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {isAdmin ? 'Acesso Liberado (Admin)' : 'Exclusivo Admin'}
              </span>
            </div>

            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              O Infinite News possui diagramação de jornal de papel clássico em PDF com colunas e tipografia editorial de chumbo.
            </p>

            {isAdmin ? (
              <button
                onClick={() => onOpenPrintModal(featuredArticle)}
                className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black py-2.5 px-4 rounded-2xl text-xs shadow transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Baixar Edição em PDF</span>
              </button>
            ) : (
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-center text-xs text-gray-400">
                Apenas administradores podem baixar em PDF ou imprimir.
              </div>
            )}
          </div>

          {/* AI Reporter Banner (Fifine) */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#C4170C] text-white flex items-center justify-center shadow font-black text-sm">
                F
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">Repórter IA Fifine</h4>
                <p className="text-[11px] text-gray-500">Mascote 3D e inteligência jornalística</p>
              </div>
            </div>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Tire dúvidas por voz ou texto, debata fatos e peça resumos em áudio com o Repórter Fifine ao vivo.
            </p>
            <button
              onClick={onOpenVirtualReporter}
              className="w-full bg-[#C4170C] hover:bg-red-700 text-white font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer shadow-xs"
            >
              Falar com Repórter IA Fifine
            </button>
          </div>

          {/* Mais Lidas (Ranked 1 to 5) */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3 mb-4">
              <TrendingUp className="w-4 h-4 text-[#C4170C]" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900">
                Mais Lidas no Infinite News
              </h3>
            </div>

            <div className="space-y-4">
              {mostRead.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => onSelectArticle(item)}
                  className="group flex items-start space-x-3 cursor-pointer"
                >
                  <span className="font-black text-2xl text-gray-300 group-hover:text-[#C4170C] transition leading-none shrink-0 w-6">
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#C4170C]">
                      {item.customCategory || item.chapeu || item.category}
                    </span>
                    <h4 className="font-headline text-xs font-bold text-gray-900 group-hover:text-[#C4170C] transition line-clamp-2 leading-tight">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 block">
                      {formatTimeAgo(item.publishedAt)} • {item.views || 1} leitores
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>

      {/* LOWER SECTION: REMAINING ARTICLES FEED */}
      {remainingArticles.length > 0 && (
        <section className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-headline text-xl sm:text-2xl font-black text-gray-900">
              Mais Notícias & Destaques
            </h3>
            <span className="text-xs text-gray-500">Atualizado a cada instante</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {remainingArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => onSelectArticle(article)}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white ${getCategoryBadge(article.category)}`}>
                      {article.customCategory || article.chapeu || article.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-headline text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-[#C4170C] transition line-clamp-2">
                      {article.title}
                    </h4>
                    {article.subtitle && (
                      <p className="text-xs text-gray-600 line-clamp-2 font-serif-news italic">
                        {article.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-50 mt-2">
                  <span>{formatTimeAgo(article.publishedAt)}</span>

                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditArticle?.(article);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, article)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Apagar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPrintModal(article);
                        }}
                        className="text-gray-800 hover:text-black font-bold flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Delete Confirmation Modal (Reliable in-app confirmation) */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-[#C4170C] flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-gray-900">Mover para a Lixeira?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                A reportagem <strong>"{articleToDelete.title}"</strong> será retirada do ar e movida para a <strong>Lixeira do Administrador</strong>.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 text-left font-medium">
                🔒 <strong>Privacidade Garantida:</strong> A matéria não fica disponível para nenhum leitor ou visitante. Fica guardada na sua lixeira até você clicar em restaurar.
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
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

      {/* Delete Feedback Toast */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-700 flex items-center space-x-3 animate-fadeIn">
          <Trash2 className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-white">{deleteToast}</p>
            {onOpenTrash && (
              <button
                onClick={onOpenTrash}
                className="text-amber-300 hover:text-amber-200 font-bold underline mt-0.5 cursor-pointer block"
              >
                Abrir Lixeira para ver ou restaurar
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

