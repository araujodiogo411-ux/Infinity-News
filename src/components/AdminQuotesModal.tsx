import React, { useState } from 'react';
import { X, DollarSign, TrendingUp, Sparkles, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { FinancialQuotes } from '../types/news';

interface AdminQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuotes: FinancialQuotes;
  onQuotesUpdated: (newQuotes: FinancialQuotes) => void;
}

export const AdminQuotesModal: React.FC<AdminQuotesModalProps> = ({
  isOpen,
  onClose,
  currentQuotes,
  onQuotesUpdated
}) => {
  const [dolarVal, setDolarVal] = useState(currentQuotes?.dolar?.valueFormatted || 'R$ 5,68');
  const [dolarPct, setDolarPct] = useState(currentQuotes?.dolar?.pctFormatted || '+0,32%');

  const [euroVal, setEuroVal] = useState(currentQuotes?.euro?.valueFormatted || 'R$ 6,14');
  const [euroPct, setEuroPct] = useState(currentQuotes?.euro?.pctFormatted || '+0,18%');

  const [pibVal, setPibVal] = useState(
    currentQuotes?.pib?.pointsFormatted || currentQuotes?.pib?.valueFormatted || currentQuotes?.ibovespa?.pointsFormatted || 'R$ 10,9 tri'
  );
  const [pibPct, setPibPct] = useState(
    currentQuotes?.pib?.pctFormatted || currentQuotes?.ibovespa?.pctFormatted || '+2,9% a.a.'
  );

  const [btcVal, setBtcVal] = useState(currentQuotes?.bitcoin?.valueFormatted || 'R$ 585.000');
  const [btcPct, setBtcPct] = useState(currentQuotes?.bitcoin?.pctFormatted || '+1,45%');

  const [totalCryptos, setTotalCryptos] = useState(
    currentQuotes?.cryptoGlobal?.totalCryptosFormatted || '17.482 criptos'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsSaving(true);
    setSuccessMsg('');

    const isDolarPos = !dolarPct.trim().startsWith('-');
    const isEuroPos = !euroPct.trim().startsWith('-');
    const isPibPos = !pibPct.trim().startsWith('-');
    const isBtcPos = !btcPct.trim().startsWith('-');

    const payload = {
      dolar: {
        code: 'USD',
        name: 'Dólar Comercial',
        valueFormatted: dolarVal.startsWith('R$') ? dolarVal : `R$ ${dolarVal}`,
        pctFormatted: dolarPct.includes('%') ? dolarPct : `${dolarPct}%`,
        isPositive: isDolarPos,
      },
      euro: {
        code: 'EUR',
        name: 'Euro',
        valueFormatted: euroVal.startsWith('R$') ? euroVal : `R$ ${euroVal}`,
        pctFormatted: euroPct.includes('%') ? euroPct : `${euroPct}%`,
        isPositive: isEuroPos,
      },
      pib: {
        code: 'PIB',
        name: 'PIB Brasil',
        valueFormatted: pibVal,
        pointsFormatted: pibVal,
        pctFormatted: pibPct,
        isPositive: isPibPos,
        description: 'Produto Interno Bruto atualizado pelo Administrador'
      },
      ibovespa: {
        code: 'PIB',
        name: 'PIB',
        pointsFormatted: pibVal,
        pctFormatted: pibPct,
        isPositive: isPibPos
      },
      bitcoin: {
        code: 'BTC',
        name: 'Bitcoin',
        valueFormatted: btcVal.startsWith('R$') ? btcVal : `R$ ${btcVal}`,
        pctFormatted: btcPct.includes('%') ? btcPct : `${btcPct}%`,
        isPositive: isBtcPos,
      },
      cryptoGlobal: {
        totalCryptocurrencies: parseInt(totalCryptos.replace(/\D/g, '')) || 17482,
        totalCryptosFormatted: totalCryptos.includes('cripto') ? totalCryptos : `${totalCryptos} criptos`,
        btcDominance: '56.4%',
        marketCapUsd: 'US$ 2,84 trilhões',
        source: 'Atualização do Administrador'
      }
    };

    try {
      const res = await fetch('/api/financial-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onQuotesUpdated({
          ...currentQuotes,
          ...payload,
          updatedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          source: 'Alterado pelo Administrador'
        } as FinancialQuotes);

        setSuccessMsg('Cotações de Dólar, Euro, PIB e Cripto salvas com sucesso em todo o portal!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error(err);
      setSuccessMsg('Erro ao salvar cotações: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToMarket = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/financial-quotes');
      const data = await res.json();
      if (data.success && data.quotes) {
        setDolarVal(data.quotes.dolar?.valueFormatted || 'R$ 5,68');
        setDolarPct(data.quotes.dolar?.pctFormatted || '+0,32%');
        setEuroVal(data.quotes.euro?.valueFormatted || 'R$ 6,14');
        setEuroPct(data.quotes.euro?.pctFormatted || '+0,18%');
        setPibVal(data.quotes.pib?.pointsFormatted || 'R$ 10,9 tri');
        setPibPct(data.quotes.pib?.pctFormatted || '+2,9% a.a.');
        setBtcVal(data.quotes.bitcoin?.valueFormatted || 'R$ 585.000');
        setBtcPct(data.quotes.bitcoin?.pctFormatted || '+1,45%');
        setTotalCryptos(data.quotes.cryptoGlobal?.totalCryptosFormatted || '17.482 criptos');
        setSuccessMsg('Dados sincronizados com o mercado oficial!');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* Modal Header com botão Salvar e Sair sempre visível */}
        <div className="bg-[#121212] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg text-white">Editar Cotações & Indicadores</h3>
                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Altere os valores de Dólar, Euro, PIB e Criptomoeda exibidos no portal.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quick Salvar e Sair button in header */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow cursor-pointer border border-emerald-400"
              title="Salvar todas as cotações e sair do modal"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span className="hidden xs:inline">Salvar e Sair</span>
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-gray-800 cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body - Scrollable so it never cuts off on any screen */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dólar Comercial */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Dólar Comercial (USD)
              </span>
              <span className="text-[11px] text-gray-500">Cotação do Dólar</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Valor</label>
                <input
                  type="text"
                  value={dolarVal}
                  onChange={(e) => setDolarVal(e.target.value)}
                  placeholder="R$ 5,68"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-[#C4170C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Variação (%)</label>
                <input
                  type="text"
                  value={dolarPct}
                  onChange={(e) => setDolarPct(e.target.value)}
                  placeholder="+0,32%"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-emerald-600 focus:ring-2 focus:ring-[#C4170C] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Euro */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Euro (EUR)
              </span>
              <span className="text-[11px] text-gray-500">Cotação do Euro</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Valor</label>
                <input
                  type="text"
                  value={euroVal}
                  onChange={(e) => setEuroVal(e.target.value)}
                  placeholder="R$ 6,14"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-[#C4170C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Variação (%)</label>
                <input
                  type="text"
                  value={euroPct}
                  onChange={(e) => setEuroPct(e.target.value)}
                  placeholder="+0,18%"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-emerald-600 focus:ring-2 focus:ring-[#C4170C] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* PIB Brasil (Renomeado de Ibovespa conforme pedido) COM BOTÃO SALVAR E SAIR DO LADO DO PIB */}
          <div className="bg-gradient-to-r from-amber-50 to-emerald-50/40 p-4 rounded-xl border-2 border-emerald-400/80 shadow-md relative">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-800">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-950 uppercase tracking-tight block">
                    PIB (Produto Interno Bruto)
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold">Substituiu o Ibovespa</span>
                </div>
              </div>

              {/* BOTÃO SALVAR E SAIR EXATAMENTE DO LADO DO PIB (SOLICITADO PELO USUÁRIO) */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer border-2 border-emerald-400 group"
                title="Salvar cotações do Dólar, Euro, PIB, Bitcoin e sair"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3] text-white group-hover:scale-110 transition-transform" />
                    <span className="tracking-wide">Salvar e Sair</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Volume / Pontos do PIB</label>
                <input
                  type="text"
                  value={pibVal}
                  onChange={(e) => setPibVal(e.target.value)}
                  placeholder="R$ 10,9 tri"
                  className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Crescimento Anual</label>
                <input
                  type="text"
                  value={pibPct}
                  onChange={(e) => setPibPct(e.target.value)}
                  placeholder="+2,9% a.a."
                  className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg font-bold text-emerald-700 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900">
              <span className="font-semibold text-gray-700">
                O botão verde <strong className="text-emerald-700">"Salvar e Sair"</strong> grava Dólar, Euro, PIB e Cripto de uma vez só.
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                Atualização Imediata
              </span>
            </div>
          </div>

          {/* Bitcoin & Total de Criptomoedas no Mundo */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Bitcoin & Criptomoedas Globais
              </span>
              <span className="text-[11px] text-gray-500">Mercado Cripto</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Valor Bitcoin</label>
                <input
                  type="text"
                  value={btcVal}
                  onChange={(e) => setBtcVal(e.target.value)}
                  placeholder="R$ 585.000"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-[#C4170C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Variação (%)</label>
                <input
                  type="text"
                  value={btcPct}
                  onChange={(e) => setBtcPct(e.target.value)}
                  placeholder="+1,45%"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-emerald-600 focus:ring-2 focus:ring-[#C4170C] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Total de Criptomoedas Ativas no Mundo</label>
              <input
                type="text"
                value={totalCryptos}
                onChange={(e) => setTotalCryptos(e.target.value)}
                placeholder="17.482 criptos"
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Action buttons - Sticky Footer fixo com Salvar e Sair sempre visível */}
        <div className="bg-gray-50 border-t border-gray-200 p-3.5 sm:p-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetToMarket}
            disabled={isSaving}
            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resetar Mercado Oficial</span>
            <span className="sm:hidden">Resetar</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-emerald-500 active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Salvar e Sair
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
