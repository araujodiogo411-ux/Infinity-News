import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Radio, 
  LogOut,
  Sparkles,
  Bot,
  Pencil,
  Camera,
  MapPin,
  Check,
  Trash2
} from 'lucide-react';
import { CATEGORIES, FinancialQuotes } from '../types/news';
import { subscribeToQuotes, getQuotesFromFirestore } from '../services/quotesService';

interface HeaderProps {
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onOpenAdminStudio: () => void;
  onLogoutAdmin: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateHome: () => void;
  onOpenVirtualReporter: () => void;
  onOpenAdminQuotes?: () => void;
  onOpenBrasiliaTour?: () => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  currentQuotes?: any;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onOpenAdminLogin,
  onOpenAdminStudio,
  onLogoutAdmin,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onNavigateHome,
  onOpenVirtualReporter,
  onOpenAdminQuotes,
  onOpenBrasiliaTour,
  onOpenTrash,
  trashCount = 0,
  currentQuotes
}) => {
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quotes, setQuotes] = useState<any>(currentQuotes || {
    dolar: { valueFormatted: 'R$ 5,68', pctFormatted: '+0,32%', isPositive: true },
    euro: { valueFormatted: 'R$ 6,14', pctFormatted: '+0,18%', isPositive: true },
    pib: { pointsFormatted: 'R$ 10,9 tri', pctFormatted: '+2,9% a.a.', isPositive: true },
    ibovespa: { pointsFormatted: 'R$ 10,9 tri', pctFormatted: '+2,9% a.a.', isPositive: true },
    bitcoin: { valueFormatted: 'R$ 585.000', pctFormatted: '+1,45%', isPositive: true },
    cryptoGlobal: { totalCryptosFormatted: '17.482 criptos' },
    updatedAt: '',
  });

  // Sync prop changes
  useEffect(() => {
    if (currentQuotes) {
      setQuotes(currentQuotes);
    }
  }, [currentQuotes]);

  // Fetch and subscribe to real-time live quotes (Firestore + API)
  useEffect(() => {
    // 1. Initial from Firestore
    getQuotesFromFirestore().then(q => {
      if (q) setQuotes(q);
    }).catch(() => {});

    // 2. Real-time Firestore subscription
    const unsubscribe = subscribeToQuotes((liveQuotes) => {
      if (liveQuotes) {
        setQuotes(liveQuotes);
      }
    });

    // 3. Fallback poll to API
    const fetchLiveQuotes = async () => {
      try {
        const res = await fetch('/api/financial-quotes');
        const data = await res.json();
        if (data.success && data.quotes) {
          setQuotes((prev: any) => ({ ...prev, ...data.quotes }));
        }
      } catch (err) {
        console.warn('Error fetching live quotes:', err);
      }
    };

    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 45000);

    return () => {
      clearInterval(interval);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    const formatted = now.toLocaleDateString('pt-BR', options);
    setCurrentDateStr(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Top utility ticker - Real-Time Financial & Breaking Status */}
      <div className="bg-[#121212] text-xs text-gray-300 py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Left: Live plantao indicator & Date */}
          <div className="flex items-center space-x-3 text-gray-300">
            <span className="flex items-center text-red-500 font-black uppercase tracking-wider text-[10px]">
              <Radio className="w-3.5 h-3.5 mr-1 animate-pulse" />
              Plantão em Tempo Real
            </span>
            <span className="hidden sm:inline text-gray-600">•</span>
            <span className="hidden sm:inline text-gray-400 font-medium">{currentDateStr}</span>
          </div>

          {/* Center: REAL LIVE QUOTES (Dólar, Euro, PIB, Bitcoin) */}
          <div className="hidden md:flex items-center space-x-4 text-[11px]">
            <span className="text-gray-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Mercados (Ao Vivo):
            </span>
            
            {/* Dólar Real */}
            <span className="font-medium text-gray-200">
              Dólar <strong className="font-bold text-white">{quotes.dolar?.valueFormatted}</strong>{' '}
              <span className={quotes.dolar?.isPositive ? 'text-emerald-400 text-[10px]' : 'text-red-400 text-[10px]'}>
                {quotes.dolar?.isPositive ? '▲' : '▼'} {quotes.dolar?.pctFormatted}
              </span>
            </span>

            {/* Euro Real */}
            <span className="font-medium text-gray-200">
              Euro <strong className="font-bold text-white">{quotes.euro?.valueFormatted}</strong>{' '}
              <span className={quotes.euro?.isPositive ? 'text-emerald-400 text-[10px]' : 'text-red-400 text-[10px]'}>
                {quotes.euro?.isPositive ? '▲' : '▼'} {quotes.euro?.pctFormatted}
              </span>
            </span>

            {/* PIB Real (Renamed from Ibovespa as requested) com botão Salvar e Sair ao lado */}
            <div className="flex items-center space-x-1.5">
              <span className="font-medium text-gray-200 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                PIB <strong className="font-bold text-emerald-300">{quotes.pib?.pointsFormatted || quotes.pib?.valueFormatted || quotes.ibovespa?.pointsFormatted || 'R$ 10,9 tri'}</strong>{' '}
                <span className="text-emerald-400 text-[10px] font-bold">
                  {quotes.pib?.pctFormatted || '+2,9% a.a.'}
                </span>
              </span>

              {/* Botão de Salvar e Sair do lado do PIB */}
              <button
                onClick={isAdmin ? onOpenAdminQuotes : onOpenAdminLogin}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded text-[10px] uppercase flex items-center gap-1 transition shadow cursor-pointer border border-emerald-400 active:scale-95"
                title="Salvar e Sair / Editar cotações de Dólar, Euro, PIB e Criptomoeda"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Salvar e Sair</span>
              </button>
            </div>

            {/* Bitcoin Real */}
            <span className="font-medium text-gray-200 hidden lg:inline">
              Bitcoin <strong className="font-bold text-white">{quotes.bitcoin?.valueFormatted}</strong>{' '}
              <span className={quotes.bitcoin?.isPositive ? 'text-amber-400 text-[10px]' : 'text-red-400 text-[10px]'}>
                {quotes.bitcoin?.isPositive ? '▲' : '▼'} {quotes.bitcoin?.pctFormatted}
              </span>
            </span>

            {/* Total Cryptocurrencies in the World (CoinGecko Real Data) */}
            <span className="font-medium text-amber-300 hidden xl:inline border-l border-gray-700 pl-3">
              Total Criptos no Mundo: <strong className="font-black text-amber-400">{quotes.cryptoGlobal?.totalCryptosFormatted || '17.482 criptos'}</strong>
            </span>

            {/* ADMIN PENCIL BUTTON TO EDIT QUOTES */}
            {isAdmin && onOpenAdminQuotes && (
              <button
                onClick={onOpenAdminQuotes}
                className="bg-amber-400 hover:bg-amber-300 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="Editar Dólar, Euro, PIB e Criptomoeda como Administrador"
              >
                <Pencil className="w-3 h-3 text-black" />
                <span>Editar Cotações</span>
              </button>
            )}
          </div>

          {/* Right: Brasilia Tour, Fifine Mascot Button & Authenticated Admin status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Brasilia Tour Button */}
            {onOpenBrasiliaTour && (
              <button
                onClick={onOpenBrasiliaTour}
                className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer shadow-sm"
                title="Passear pelas fotos de Brasília dia a dia e mês a mês"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
                <span>Ruas de Brasília</span>
              </button>
            )}

            {/* Mascot Fifine Button */}
            <button
              onClick={onOpenVirtualReporter}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-950 to-gray-900 hover:from-red-900 hover:to-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border border-red-500/40 shadow-sm"
              title="Conversar com o Repórter IA Fifine (3D)"
            >
              <div className="w-5 h-5 rounded-full bg-[#C4170C] flex items-center justify-center text-[10px] font-black border border-white/50 text-white shadow-xs">
                F
              </div>
              <span className="text-amber-300">Repórter IA Fifine</span>
            </button>

            {isAdmin && (
              <div className="flex items-center space-x-2 bg-emerald-950/90 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Admin</span>
                <button
                  onClick={onOpenAdminStudio}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer"
                >
                  Criar Matéria
                </button>
                <button
                  onClick={onLogoutAdmin}
                  className="text-gray-400 hover:text-red-400 transition ml-1"
                  title="Sair do modo administrador"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main G1-style red branding header */}
      <div className="bg-[#C4170C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          
          {/* LOGOMARCA DO NEGÓCIO - i1 / INFINITY (SECRET ADMIN CLICK TRIGGER) */}
          <div className="flex items-center space-x-4">
            <div
              onClick={isAdmin ? onOpenAdminStudio : onOpenAdminLogin}
              className="group flex items-center space-x-3 cursor-pointer select-none transition-transform hover:scale-[1.01] active:scale-[0.98]"
              title={isAdmin ? "Acessar Redação Administrativa" : "INFINITY"}
            >
              <div className="relative bg-white text-[#C4170C] font-black text-2xl sm:text-3xl px-3 py-1 rounded shadow-md tracking-tighter flex items-center justify-center border-2 border-white group-hover:bg-red-50 transition">
                <span>i1</span>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                    INFINITY
                  </span>
                  {isAdmin && (
                    <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-red-100 font-medium tracking-wide">
                  O portal de notícias em tempo real • Redação IA
                </p>
              </div>
            </div>
          </div>

          {/* Search bar & Admin Action if logged in */}
          <div className="flex items-center space-x-3">
            <div className="relative hidden md:block w-56 lg:w-64">
              <input
                type="text"
                placeholder="Buscar por nome no portal..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-red-900/40 text-white placeholder-red-200 text-xs sm:text-sm rounded-full pl-9 pr-4 py-1.5 border border-red-500/50 focus:outline-none focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 transition"
              />
              <Search className="w-4 h-4 text-red-200 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2 text-xs text-red-200 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 rounded-full hover:bg-red-800 transition"
              aria-label="Abrir busca"
            >
              <Search className="w-5 h-5 text-white" />
            </button>

            {/* BOTÕES DO ADMIN: NOVA MATÉRIA E LIXEIRA (CONFORME SOLICITADO) */}
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAdminStudio}
                  className="flex items-center space-x-1.5 bg-white text-[#C4170C] hover:bg-red-50 px-3 py-1.5 rounded-full text-xs font-bold shadow transition cursor-pointer shrink-0"
                  title="Criar nova matéria"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C4170C]" />
                  <span>Nova Matéria</span>
                </button>

                {/* BOTÃO DA LIXEIRA DO LADO DO BOTÃO NOVA MATÉRIA */}
                {onOpenTrash && (
                  <button
                    onClick={onOpenTrash}
                    className="flex items-center space-x-1.5 bg-red-950/90 hover:bg-black text-amber-300 border border-red-500/50 hover:border-amber-400/60 px-3 py-1.5 rounded-full text-xs font-bold shadow transition cursor-pointer shrink-0"
                    title="Lixeira do Administrador (Apenas o Admin vê e pode restaurar)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lixeira</span>
                    {trashCount > 0 && (
                      <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                        {trashCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {searchOpen && (
          <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar notícias no Infinite News..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white text-gray-900 placeholder-gray-500 text-sm rounded-lg pl-9 pr-8 py-2 focus:outline-none"
                autoFocus
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2.5 text-sm text-gray-500"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Categories Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center space-x-1 sm:space-x-2 py-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onNavigateHome();
                }}
                className={`whitespace-nowrap px-3 py-1 text-xs sm:text-sm font-semibold rounded transition cursor-pointer ${
                  isActive
                    ? 'bg-[#C4170C] text-white shadow-sm'
                    : 'text-gray-700 hover:text-[#C4170C] hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
