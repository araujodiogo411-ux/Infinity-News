import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from '../lib/firebase';
import { FinancialQuotes } from '../types/news';

const QUOTES_COLLECTION = 'quotes';
const QUOTES_DOC_ID = 'financial_quotes';

export const DEFAULT_QUOTES: FinancialQuotes = {
  dolar: {
    code: 'USD',
    name: 'Dólar Comercial',
    valueFormatted: 'R$ 5,68',
    pctFormatted: '+0,32%',
    isPositive: true,
  },
  euro: {
    code: 'EUR',
    name: 'Euro',
    valueFormatted: 'R$ 6,14',
    pctFormatted: '+0,18%',
    isPositive: true,
  },
  pib: {
    code: 'PIB',
    name: 'PIB Brasil',
    valueFormatted: 'R$ 10,9 tri',
    pointsFormatted: 'R$ 10,9 tri',
    pctFormatted: '+2,9% a.a.',
    isPositive: true,
    description: 'Produto Interno Bruto consolidado'
  },
  ibovespa: {
    code: 'PIB',
    name: 'PIB',
    pointsFormatted: 'R$ 10,9 tri',
    pctFormatted: '+2,9% a.a.',
    isPositive: true,
  },
  bitcoin: {
    code: 'BTC',
    name: 'Bitcoin',
    valueFormatted: 'R$ 585.000',
    pctFormatted: '+1,45%',
    isPositive: true,
  },
  cryptoGlobal: {
    totalCryptocurrencies: 17482,
    totalCryptosFormatted: '17.482 criptos',
    btcDominance: '56.4%',
    marketCapUsd: 'US$ 2,84 trilhões',
    source: 'Mercado Cripto Global'
  },
  updatedAt: 'Atualizado em tempo real',
  source: 'Banco de Dados Firestore'
};

// Fetch quotes from Firestore
export async function getQuotesFromFirestore(): Promise<FinancialQuotes> {
  try {
    const docRef = doc(db, QUOTES_COLLECTION, QUOTES_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as FinancialQuotes;
    } else {
      // Seed initial quotes
      await setDoc(docRef, DEFAULT_QUOTES);
      return DEFAULT_QUOTES;
    }
  } catch (err) {
    console.warn('[Firestore] Aviso ao buscar cotações no Firestore:', err);
    return DEFAULT_QUOTES;
  }
}

// Save quotes to Firestore
export async function saveQuotesToFirestore(quotes: FinancialQuotes): Promise<void> {
  try {
    const docRef = doc(db, QUOTES_COLLECTION, QUOTES_DOC_ID);
    const payload = {
      ...quotes,
      updatedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      source: 'Salvo pelo Administrador no Firestore Real'
    };
    await setDoc(docRef, payload, { merge: true });

    // Sync to backend proxy as fallback
    fetch('/api/financial-quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (err) {
    console.error('[Firestore] Erro ao salvar cotações no Firestore:', err);
    throw err;
  }
}

// Real-time listener for quotes
export function subscribeToQuotes(onUpdate: (quotes: FinancialQuotes) => void) {
  const docRef = doc(db, QUOTES_COLLECTION, QUOTES_DOC_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as FinancialQuotes);
    }
  }, (err) => {
    console.warn('[Firestore] Erro no listener de cotações:', err);
  });
}
