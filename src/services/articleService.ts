import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from '../lib/firebase';
import { NewsArticle } from '../types/news';

const ARTICLES_COLLECTION = 'articles';

// Initial fallback seed articles to populate Firestore on first run
const INITIAL_ARTICLES: NewsArticle[] = [
  {
    id: 'pib-brasil-cresce-acima-esperado-2026',
    title: 'PIB do Brasil surpreende e cresce 2,9% com impulso do setor de serviços e investimentos em inovação',
    subtitle: 'Resultado supera projeções do mercado financeiro; agronegócio e tecnologia lideram criação de novos postos de trabalho no trimestre.',
    chapeu: 'ECONOMIA',
    category: 'economia',
    author: 'Mariana Vasconcelos',
    authorRole: 'Analista de Economia — Infinite News, Brasília',
    publishedAt: '2026-10-30T11:30:00.000Z',
    updatedAt: '2026-10-30T12:15:00.000Z',
    readTime: '4 min de leitura',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Movimentação financeira e expansão de infraestrutura aceleram índices de confiança econômica no país.',
    imageCredit: 'Foto: Agência Brasil / Divulgação',
    paragraphs: [
      'O Produto Interno Bruto (PIB) brasileiro avançou 2,9% no último ciclo consolidado, superando com folga o consenso de analistas de mercado, que projetavam expansão em torno de 1,8%. Os dados divulgados confirmam a resiliência da atividade produtiva nacional.',
      'O grande motor do desempenho foi o setor terciário, especialmente os segmentos de tecnologia da informação, serviços financeiros e logística de comércio eletrônico, que registraram crescimento acumulado superior a 4,2% no mesmo intervalo.',
      'Segundo economistas consultados, o ciclo de corte nas taxas básicas e a expansão do crédito para pequenas e médias empresas estimularam uma retomada consistente das contratações formais nas capitais e polos regionais.',
      'Outro destaque relevante foi a balança comercial, com superávit histórico impulsionado pela exportação de produtos de valor agregado e energias renováveis, consolidando o Brasil como um dos principais destinos de investimentos sustentáveis no hemisfério sul.',
      'Para os próximos trimestres, o Ministério da Fazenda estima que o controle inflacionário somado ao crescimento da renda média real das famílias deve manter a trajetória de expansão sustentada.'
    ],
    keyQuotes: [
      'O setor de serviços e a digitalização foram determinantes para superar todas as previsões mais céticas do mercado.'
    ],
    tags: ['Economia', 'PIB', 'Mercado', 'Emprego', 'Finanças'],
    views: 1420,
    likes: 88,
    featured: true,
    breakingNews: false,
    comments: [],
    sourceGrounding: [
      {
        title: 'IBGE - Contas Nacionais Trimestrais',
        url: 'https://www.ibge.gov.br'
      }
    ],
    newspaperEdition: 'Edição Nacional',
    newspaperYear: 'Ano XXXIV (2026)',
    newspaperIssue: 'N° 14.280',
    newspaperPrice: 'R$ 4,50',
    newspaperSection: 'CADERNO ECONOMIA'
  },
  {
    id: 'inteligencia-artificial-redacoes-comunicacao-2026',
    title: 'Nova diretriz de Inteligência Artificial impulsiona produtividade e transparência em redações e agências',
    subtitle: 'Ferramentas que estruturam artigos e geram análises em tempo real passam a contar com selo de verificação humana e ética editorial.',
    chapeu: 'TECNOLOGIA',
    category: 'tecnologia',
    author: 'Felipe Nogueira',
    authorRole: 'Editor de Tecnologia — Infinite News, São Paulo',
    publishedAt: '2026-10-30T10:45:00.000Z',
    updatedAt: '2026-10-30T11:00:00.000Z',
    readTime: '3 min de leitura',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Sistemas neurais e modelos multimodais transformam o fluxo de trabalho jornalístico sem substituir o crivo investigativo.',
    imageCredit: 'Foto: Unsplash / Tech Journal',
    paragraphs: [
      'A integração de sistemas de Inteligência Artificial generativa atingiu um novo patamar de maturidade no ecossistema de comunicação brasileira. Portais, emissoras e equipes de marketing digital adotaram fluxos híbridos capazes de transformar notas brutas em pautas estruturadas em questão de segundos.',
      'A principal evolução está na capacidade dos modelos de identificar hierarquia de texto — separando automaticamente manchetes concisas, linhas finas de contexto, declarações de fontes e sugestões visuais — permitindo que repórteres concentrem energia na apuração e checagem de fatos.',
      'Representantes das principais entidades de imprensa destacaram que a transparência com o leitor é a regra de ouro: "A inteligência artificial organiza a informação com velocidade prodigiosa, mas o compromisso com a verdade e o olhar ético pertencem integralmente ao ser humano".'
    ],
    keyQuotes: [
      'A inteligência artificial organiza o dado com velocidade impressionante; o crivo da verdade continua sendo 100% humano.'
    ],
    tags: ['Tecnologia', 'Inteligência Artificial', 'Jornalismo', 'Futuro', 'Inovação'],
    views: 980,
    likes: 64,
    featured: false,
    breakingNews: true,
    comments: [],
    newspaperEdition: 'Edição Nacional',
    newspaperYear: 'Ano XXXIV (2026)',
    newspaperIssue: 'N° 14.280',
    newspaperPrice: 'R$ 4,50',
    newspaperSection: 'CADERNO TECNOLOGIA'
  },
  {
    id: 'satelite-brasileiro-dados-climaticos-amazonia',
    title: 'Satélite nacional bate recorde de monitoramento e envia dados em tempo real sobre a Amazônia',
    subtitle: 'Tecnologia de sensoriamento óptico desenvolvida no Brasil permite flagrar alterações na cobertura vegetal em intervalo de minutos.',
    chapeu: 'CIÊNCIA & MEIO AMBIENTE',
    category: 'ciencia',
    author: 'Beatriz Alencar',
    authorRole: 'Repórter de Ciência — Infinite News, Manaus',
    publishedAt: '2026-10-30T09:15:00.000Z',
    updatedAt: '2026-10-30T09:40:00.000Z',
    readTime: '5 min de leitura',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Órbita polar sincronizada com o sol permite varredura detalhada de biomas brasileiros com resolução submétrica.',
    imageCredit: 'Foto: INPE / Divulgação Científica',
    paragraphs: [
      'O Instituto Nacional de Pesquisas Espaciais (INPE) celebrou a marca de mais de 100 mil imagens de alta resolução transmitidas pelo mais recente satélite de observação terrestre construído por engenheiros brasileiros.',
      'Equipado com câmeras multiespectrais e algoritmos de detecção de anomalias térmicas, o equipamento consegue perfurar densas camadas de nuvens e identificar focos de calor ou desmatamento incipiente com precisão quase cirúrgica.'
    ],
    keyQuotes: [
      'Temos agora a capacidade de agir antes que o dano ambiental se consolide, graças ao tempo de resposta de minutos.'
    ],
    tags: ['Ciência', 'Amazônia', 'Satélite', 'Sustentabilidade', 'Meio Ambiente'],
    views: 845,
    likes: 112,
    featured: false,
    breakingNews: false,
    comments: [],
    newspaperEdition: 'Edição Nacional',
    newspaperYear: 'Ano XXXIV (2026)',
    newspaperIssue: 'N° 14.280',
    newspaperPrice: 'R$ 4,50',
    newspaperSection: 'CADERNO CIÊNCIA'
  },
  {
    id: 'startups-design-automacao-brasil-2026',
    title: 'Polo de inovação visual brasileiro atrai US$ 120 milhões para soluções de design e comunicação ágil',
    subtitle: 'Ecossistema impulsionado pela "Jornada Canva" e ferramentas de autopublicação gera milhares de negócios criativos independentes.',
    chapeu: 'NEGÓCIOS & DESIGN',
    category: 'negocios',
    author: 'Rodrigo Mendes',
    authorRole: 'Colunista de Negócios e Startups',
    publishedAt: '2026-10-30T08:00:00.000Z',
    updatedAt: '2026-10-30T08:30:00.000Z',
    readTime: '3 min de leitura',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Empreendedores e designers utilizam plataformas integradas para produzir jornais, catálogos e marcas em escala.',
    imageCredit: 'Foto: Divulgação / Inova Brasil',
    paragraphs: [
      'O mercado de economia criativa e design automatizado atingiu cifras recordes no Brasil. Rodadas de aporte recentes somaram mais de US$ 120 milhões direcionadas a empreendedores focados em democratizar a produção gráfica de alto nível.',
      'Iniciativas educacionais como a "Jornada Canva" prepararam uma nova geração de profissionais autônomos que combinam estética editorial com facilidade de publicação e impressão sob demanda.'
    ],
    keyQuotes: [
      'A união entre design acessível e IA editorial permitiu que qualquer comunidade crie seu próprio jornal com qualidade de diário nacional.'
    ],
    tags: ['Negócios', 'Design', 'Jornada Canva', 'Startups', 'Criatividade'],
    views: 630,
    likes: 53,
    featured: false,
    breakingNews: false,
    comments: [],
    newspaperEdition: 'Edição Nacional',
    newspaperYear: 'Ano XXXIV (2026)',
    newspaperIssue: 'N° 14.280',
    newspaperPrice: 'R$ 4,50',
    newspaperSection: 'CADERNO NEGÓCIOS'
  }
];

// Seed initial articles into Firestore if collection is empty
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    const articlesCol = collection(db, ARTICLES_COLLECTION);
    const snap = await getDocs(articlesCol);
    if (snap.empty) {
      console.log('[Firestore] Inicializando banco de dados em nuvem com notícias curadas...');
      for (const article of INITIAL_ARTICLES) {
        await setDoc(doc(db, ARTICLES_COLLECTION, article.id), article);
      }
      console.log('[Firestore] Banco de dados em nuvem inicializado com sucesso.');
    }
  } catch (err) {
    console.warn('[Firestore] Aviso ao verificar/semear dados no Firestore:', err);
  }
}

// Fetch all active articles (not in trash)
export async function getActiveArticles(): Promise<NewsArticle[]> {
  try {
    const articlesCol = collection(db, ARTICLES_COLLECTION);
    const snap = await getDocs(articlesCol);
    if (snap.empty) {
      await seedFirestoreIfEmpty();
      return INITIAL_ARTICLES;
    }
    const list: NewsArticle[] = [];
    snap.forEach((d) => {
      const data = d.data() as NewsArticle;
      if (!data.isDeleted) {
        list.push({ ...data, id: d.id });
      }
    });
    list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return list;
  } catch (err) {
    console.error('[Firestore] Erro ao buscar artigos ativos no Firestore:', err);
    // Fallback to local API
    const res = await fetch('/api/articles');
    const data = await res.json();
    return data.articles || INITIAL_ARTICLES;
  }
}

// Fetch all trashed articles (for admin only)
export async function getTrashArticles(): Promise<NewsArticle[]> {
  try {
    const articlesCol = collection(db, ARTICLES_COLLECTION);
    const snap = await getDocs(articlesCol);
    const list: NewsArticle[] = [];
    snap.forEach((d) => {
      const data = d.data() as NewsArticle;
      if (data.isDeleted === true) {
        list.push({ ...data, id: d.id });
      }
    });
    list.sort((a, b) => new Date(b.deletedAt || b.updatedAt).getTime() - new Date(a.deletedAt || a.updatedAt).getTime());
    return list;
  } catch (err) {
    console.error('[Firestore] Erro ao buscar lixeira no Firestore:', err);
    const res = await fetch('/api/articles/trash');
    const data = await res.json();
    return data.articles || [];
  }
}

// Save or publish new article to cloud Firestore
export async function saveArticleToFirestore(article: NewsArticle): Promise<NewsArticle> {
  const docRef = doc(db, ARTICLES_COLLECTION, article.id);
  await setDoc(docRef, article, { merge: true });

  // Sync to backend proxy as well
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
  } catch (e) {
    // Non-fatal
  }

  return article;
}

// Move article to trash in cloud Firestore
export async function moveArticleToTrashInFirestore(articleId: string): Promise<void> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  const deletedAt = new Date().toISOString();
  await updateDoc(docRef, {
    isDeleted: true,
    deletedAt
  });

  try {
    await fetch(`/api/articles/${articleId}`, { method: 'DELETE' });
  } catch (e) {
    // Non-fatal
  }
}

// Restore article from trash in cloud Firestore
export async function restoreArticleInFirestore(articleId: string): Promise<void> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  await updateDoc(docRef, {
    isDeleted: false,
    deletedAt: null as any
  });

  try {
    await fetch(`/api/articles/${articleId}/restore`, { method: 'POST' });
  } catch (e) {
    // Non-fatal
  }
}

// Permanently delete article from cloud Firestore
export async function permanentDeleteInFirestore(articleId: string): Promise<void> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  await deleteDoc(docRef);

  try {
    await fetch(`/api/articles/${articleId}?permanent=true`, { method: 'DELETE' });
  } catch (e) {
    // Non-fatal
  }
}

// Real-time listener for articles across all clients
export function subscribeToArticles(
  onActiveArticles: (articles: NewsArticle[]) => void,
  onTrashArticles?: (trash: NewsArticle[]) => void
) {
  const articlesCol = collection(db, ARTICLES_COLLECTION);
  return onSnapshot(articlesCol, (snapshot) => {
    const active: NewsArticle[] = [];
    const trash: NewsArticle[] = [];

    snapshot.forEach((d) => {
      const data = d.data() as NewsArticle;
      const item = { ...data, id: d.id };
      if (item.isDeleted) {
        trash.push(item);
      } else {
        active.push(item);
      }
    });

    active.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    trash.sort((a, b) => new Date(b.deletedAt || b.updatedAt).getTime() - new Date(a.deletedAt || a.updatedAt).getTime());

    if (active.length > 0) {
      onActiveArticles(active);
    }
    if (onTrashArticles) {
      onTrashArticles(trash);
    }
  }, (err) => {
    console.warn('[Firestore] Listener error, using static fetch:', err);
  });
}
