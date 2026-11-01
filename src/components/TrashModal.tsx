import React, { useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  Plus, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { NewsArticle } from '../types/news';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashArticles: NewsArticle[];
  onRestoreArticle: (articleId: string) => Promise<void>;
  onPermanentDeleteArticle: (articleId: string) => Promise<void>;
  onEmptyTrash?: () => Promise<void>;
  onOpenNewArticle: () => void;
  isAdmin: boolean;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  trashArticles,
  onRestoreArticle,
  onPermanentDeleteArticle,
  onEmptyTrash,
  onOpenNewArticle,
  isAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  // Filter by search query
  const filteredTrash = trashArticles.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  const handleRestore = async (articleId: string, articleTitle: string) => {
    setLoadingActionId(articleId);
    setStatusMessage('');
    try {
      await onRestoreArticle(articleId);
      setStatusMessage(`"${articleTitle}" foi restaurada com sucesso para o portal!`);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Erro ao restaurar: ' + err.message);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handlePermanentDelete = async (articleId: string) => {
    setLoadingActionId(articleId);
    try {
      await onPermanentDeleteArticle(articleId);
      setConfirmDeleteId(null);
      setStatusMessage('Matéria excluída definitivamente do sistema.');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Erro ao excluir: ' + err.message);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleEmptyAll = async () => {
    if (!onEmptyTrash) return;
    try {
      await onEmptyTrash();
      setConfirmEmpty(false);
      setStatusMessage('Todas as matérias da lixeira foram removidas.');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const formatDeletedDate = (dateStr?: string) => {
    if (!dateStr) return 'Data recente';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Top Header */}
        <div className="bg-[#121212] text-white p-4 sm:p-6 flex items-center justify-between shrink-0 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg text-white">Lixeira do Administrador</h3>
                <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                  {trashArticles.length} {trashArticles.length === 1 ? 'matéria' : 'matérias'}
                </span>
                <span className="bg-red-600/30 text-red-300 border border-red-500/40 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full hidden sm:inline">
                  Privado • Só Admin Vê
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Matérias apagadas ficam guardadas aqui e não são visíveis para nenhum visitante. Você pode restaurar a qualquer momento.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewArticle();
              }}
              className="bg-[#C4170C] hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Criar nova matéria"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Nova Matéria</span>
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-gray-800 cursor-pointer"
              title="Fechar Lixeira"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search input right beside "Nova Matéria" and action buttons */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Search by Name */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome da matéria na lixeira..."
              className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C4170C]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 sm:top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {trashArticles.length > 0 && onEmptyTrash && (
              <>
                {confirmEmpty ? (
                  <div className="flex items-center space-x-2 bg-red-100 border border-red-300 p-1 rounded-xl">
                    <span className="text-[11px] font-bold text-red-800 px-2">Esvaziar tudo?</span>
                    <button
                      onClick={handleEmptyAll}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setConfirmEmpty(false)}
                      className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-lg cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmEmpty(true)}
                    className="text-xs text-red-600 hover:text-red-800 font-bold px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Esvaziar Lixeira</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenNewArticle();
              }}
              className="text-xs bg-gray-900 hover:bg-black text-amber-300 font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Matéria</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Security Warning Banner */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-2 flex items-center justify-between text-[11px] text-amber-900 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Lixeira Oculta:</strong> Nenhuma destas notícias aparece no portal para o público. Somente o administrador autenticado pode ver ou restaurar.
            </span>
          </span>
        </div>

        {/* Trashed Articles List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-gray-50/40">
          {filteredTrash.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-3xl flex items-center justify-center mx-auto border border-gray-200">
                <Trash2 className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-base font-bold text-gray-800">
                {searchQuery ? 'Nenhuma matéria encontrada com esse nome na lixeira' : 'A lixeira está vazia'}
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {searchQuery 
                  ? 'Verifique os termos digitados na busca por nome acima.' 
                  : 'Quando você clicar em "Apagar" em qualquer reportagem, ela virá para cá em vez de ser perdida para sempre, e você poderá restaurá-la a qualquer momento.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#C4170C] font-bold hover:underline"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrash.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shrink-0 border border-gray-200 grayscale-30"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0 border border-gray-200">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800">
                          {item.customCategory || item.category || 'Geral'}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Excluída em: {formatDeletedDate(item.deletedAt)}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-gray-900 leading-snug line-clamp-2">
                        {item.title}
                      </h4>

                      {item.subtitle && (
                        <p className="text-xs text-gray-500 line-clamp-1 italic font-serif">
                          {item.subtitle}
                        </p>
                      )}

                      <div className="text-[11px] text-gray-400 pt-0.5">
                        <span>Autor original: <strong>{item.author || 'Redação'}</strong></span>
                        {item.blocks && <span> • {item.blocks.length} blocos</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions (Restaurar & Excluir Definitivo) */}
                  <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    
                    {/* Botão Restaurar */}
                    <button
                      onClick={() => handleRestore(item.id, item.title)}
                      disabled={loadingActionId === item.id}
                      className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Restaurar esta matéria de volta para o portal"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 stroke-[2.5] ${loadingActionId === item.id ? 'animate-spin' : ''}`} />
                      <span>Restaurar</span>
                    </button>

                    {/* Botão Excluir Definitivamente */}
                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center space-x-1 bg-red-50 border border-red-300 p-1 rounded-xl">
                        <span className="text-[10px] font-bold text-red-800 px-1">Excluir permanente?</span>
                        <button
                          onClick={() => handlePermanentDelete(item.id)}
                          disabled={loadingActionId === item.id}
                          className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-gray-200 text-gray-700 text-[11px] font-bold px-1.5 py-1 rounded-lg cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer border border-transparent hover:border-red-200"
                        title="Excluir permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            Total na lixeira: <strong className="text-gray-800">{trashArticles.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-5 py-2 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
