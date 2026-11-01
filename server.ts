import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'articles.json');
const BRASILIA_PHOTOS_FILE = path.resolve(DATA_DIR, 'brasilia-photos.json');
const QUOTES_FILE = path.resolve(DATA_DIR, 'quotes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readCustomQuotes(): Record<string, any> | null {
  try {
    if (fs.existsSync(QUOTES_FILE)) {
      const data = fs.readFileSync(QUOTES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading custom quotes DB:', err);
  }
  return null;
}

function writeCustomQuotes(quotes: Record<string, any>) {
  try {
    fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing custom quotes DB:', err);
  }
}

function readArticles(): any[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading articles DB:', err);
  }
  return [];
}

function writeArticles(articles: any[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(articles, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing articles DB:', err);
  }
}

// Initial Curated Real High-Resolution Photos of Brasília (Updating Day by Day & Month by Month)
const INITIAL_BRASILIA_PHOTOS = [
  {
    id: 'bsb-2026-10-30-01',
    landmarkId: 'congresso',
    landmarkName: 'Congresso Nacional & Esplanada',
    title: 'Esplanada dos Ministérios e Cúpulas no Espelho d\'Água',
    date: '2026-10-30',
    dateFormatted: '30 de Outubro de 2026 (Hoje)',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Manhã',
    weather: '29°C • Céu Aberto de Primavera',
    photographer: 'Marcelo Camargo / Agência Brasil',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1600&q=85',
    caption: 'Manhã ensolarada no coração político do país. O espelho d\'água reflete as icônicas cúpulas da Câmara dos Deputados e do Senado Federal concebidas por Oscar Niemeyer.',
    coordinates: '-15.7998, -47.8645',
    tags: ['Esplanada', 'Congresso', 'Niemeyer', 'Poder Legislativo']
  },
  {
    id: 'bsb-2026-10-29-01',
    landmarkId: 'ponte_jk',
    landmarkName: 'Ponte Juscelino Kubitschek (Ponte JK)',
    title: 'Pôr do Sol Dourado sobre os Arcos da Ponte JK',
    date: '2026-10-29',
    dateFormatted: '29 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Pôr do Sol',
    weather: '28°C • Pôr do sol avermelhado no Lago Paranoá',
    photographer: 'Beto Barata / Acervo INFINITY',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1600&q=85',
    caption: 'Crepúsculo sobre as águas do Lago Paranoá. Os três arcos assimétricos da Ponte JK criam um dos cartões-postais mais celebrados do mundo moderno.',
    coordinates: '-15.8242, -47.8294',
    tags: ['Lago Paranoá', 'Ponte JK', 'Entardecer', 'Arquitetura']
  },
  {
    id: 'bsb-2026-10-27-01',
    landmarkId: 'catedral',
    landmarkName: 'Catedral Metropolitana de Brasília',
    title: 'Pilares Esculturais e Vitrais da Catedral Nossa Senhora Aparecida',
    date: '2026-10-27',
    dateFormatted: '27 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Tarde',
    weather: '30°C • Típico calor brasiliense com brisa',
    photographer: 'José Cruz / Agência Brasil',
    imageUrl: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=1600&q=85',
    caption: 'Os 16 pilares hiperbólicos de concreto pesando 90 toneladas cada representam mãos que se erguem em direção ao céu. No interior, vitrais de Marianne Peretti colorem a luz natural.',
    coordinates: '-15.7983, -47.8756',
    tags: ['Catedral', 'Patrimônio Mundial', 'Vitrais', 'Oscar Niemeyer']
  },
  {
    id: 'bsb-2026-10-24-01',
    landmarkId: 'congresso',
    landmarkName: 'Congresso Nacional & Esplanada',
    title: 'Noite Iluminada no Eixo Monumental',
    date: '2026-10-24',
    dateFormatted: '24 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Noite',
    weather: '21°C • Noite amena e estrelada',
    photographer: 'Pedro França / Agência Senado',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Congresso_Nacional_-_Brasilia_-_DF_-_Brasil.jpg/1600px-Congresso_Nacional_-_Brasilia_-_DF_-_Brasil.jpg',
    caption: 'Iluminação cênica noturna do complexo do Congresso Nacional ao final da jornada de deliberações parlamentares no Planalto Central.',
    coordinates: '-15.7998, -47.8645',
    tags: ['Noturna', 'Iluminação Cênica', 'Senado', 'Câmara']
  },
  {
    id: 'bsb-2026-10-18-01',
    landmarkId: 'praca_tres_poderes',
    landmarkName: 'Praça dos Três Poderes & Palácio do Planalto',
    title: 'Palácio do Planalto e Escultura Os Candangos',
    date: '2026-10-18',
    dateFormatted: '18 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Manhã',
    weather: '26°C • Manhã ensolarada',
    photographer: 'Valter Campanato / Agência Brasil',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Palacio_do_planalto_-_Brasilia_-_DF_-_Brasil.jpg/1600px-Palacio_do_planalto_-_Brasilia_-_DF_-_Brasil.jpg',
    caption: 'Fachada monumental do Palácio do Planalto, sede do Poder Executivo, com suas colunas onduladas de mármore branco em contraste com a Praça dos Três Poderes.',
    coordinates: '-15.7991, -47.8609',
    tags: ['Executivo', 'Planalto', 'Os Candangos', 'Três Poderes']
  },
  {
    id: 'bsb-2026-10-12-01',
    landmarkId: 'palacio_alvorada',
    landmarkName: 'Palácio da Alvorada',
    title: 'Alvorada e os Pilares de Mármore às Margens do Paranoá',
    date: '2026-10-12',
    dateFormatted: '12 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Manhã',
    weather: '27°C • Brisa matutina do lago',
    photographer: 'Ricardo Stuckert / Presidência',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Pal%C3%A1cio_da_Alvorada_-_Fachada.jpg/1600px-Pal%C3%A1cio_da_Alvorada_-_Fachada.jpg',
    caption: 'Primeiro edifício de alvenaria inaugurado em Brasília (1958). A forma característica das colunas deu origem ao brasão e símbolo da capital federal.',
    coordinates: '-15.7925, -47.8222',
    tags: ['Alvorada', 'Residência Presidencial', 'Lago Paranoá']
  },
  {
    id: 'bsb-2026-09-22-01',
    landmarkId: 'torre_tv',
    landmarkName: 'Torre de TV de Brasília & Eixo Monumental',
    title: 'Vista Panorâmica do Eixo a Partir da Torre de TV',
    date: '2026-09-22',
    dateFormatted: '22 de Setembro de 2026',
    monthLabel: 'Setembro 2026',
    periodOfDay: 'Tarde',
    weather: '31°C • Céu anil sem nuvens',
    photographer: 'Elza Fiúza / Agência Brasil',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Torre_de_TV_de_Bras%C3%ADlia_2012.jpg/1600px-Torre_de_TV_de_Bras%C3%ADlia_2012.jpg',
    caption: 'Com 224 metros de altura metálica, o mirante da Torre de TV oferece o ângulo definitivo do traçado em formato de avião concebido pelo urbanista Lúcio Costa.',
    coordinates: '-15.7904, -47.8929',
    tags: ['Mirante', 'Eixo Central', 'Lúcio Costa', 'Feira da Torre']
  },
  {
    id: 'bsb-2026-09-15-01',
    landmarkId: 'memorial_jk',
    landmarkName: 'Memorial JK & Praça do Cruzeiro',
    title: 'Homenagem a Juscelino Kubitschek no Ponto Mais Alto',
    date: '2026-09-15',
    dateFormatted: '15 de Setembro de 2026',
    monthLabel: 'Setembro 2026',
    periodOfDay: 'Pôr do Sol',
    weather: '29°C • Crepúsculo no Planalto Central',
    photographer: 'Wilson Dias / Agência Brasil',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Memorial_JK_-_Bras%C3%ADlia.jpg/1600px-Memorial_JK_-_Bras%C3%ADlia.jpg',
    caption: 'Monumento projetado por Oscar Niemeyer no Eixo Monumental Oeste em homenagem ao fundador de Brasília, o presidente Juscelino Kubitschek.',
    coordinates: '-15.7844, -47.9136',
    tags: ['Memorial JK', 'História', 'Juscelino', 'Cruzeiro']
  },
  {
    id: 'bsb-2026-08-20-01',
    landmarkId: 'museu_nacional',
    landmarkName: 'Museu Nacional da República',
    title: 'Cúpula Semiesférica e Espelho D\'água Cultural',
    date: '2026-08-20',
    dateFormatted: '20 de Agosto de 2026',
    monthLabel: 'Agosto 2026',
    periodOfDay: 'Tarde',
    weather: '28°C • Umidade baixa característica de agosto',
    photographer: 'Antonio Cruz / Agência Brasil',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Museu_Nacional_do_Conjunto_Cultural_da_Rep%C3%BAblica.jpg/1600px-Museu_Nacional_do_Conjunto_Cultural_da_Rep%C3%BAblica.jpg',
    caption: 'O Museu Honestino Guimarães compõe o Complexo Cultural da República com sua impressionante cúpula branca de 80 metros de diâmetro e rampa escultural.',
    coordinates: '-15.7975, -47.8785',
    tags: ['Museu Nacional', 'Arte Contemporânea', 'Complexo Cultural']
  },
  {
    id: 'bsb-2026-07-14-01',
    landmarkId: 'pontao_lago_sul',
    landmarkName: 'Pontão do Lago Sul & Orla do Paranoá',
    title: 'Lazer e Gastronomia na Orla do Lago Paranoá',
    date: '2026-07-14',
    dateFormatted: '14 de Julho de 2026',
    monthLabel: 'Julho 2026',
    periodOfDay: 'Tarde',
    weather: '25°C • Inverno brasiliense de céu azul límpido',
    photographer: 'Acervo INFINITY Turismo',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
    caption: 'A orla do Lago Sul é o refúgio à beira do Paranoá com restaurantes, pistas de caminhada e vista privilegiada para os monumentos centrais.',
    coordinates: '-15.8286, -47.8689',
    tags: ['Pontão', 'Lago Sul', 'Paranoá', 'Lazer']
  }
];

function readBrasiliaPhotos(): any[] {
  try {
    if (fs.existsSync(BRASILIA_PHOTOS_FILE)) {
      const data = fs.readFileSync(BRASILIA_PHOTOS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading Brasilia photos DB:', err);
  }
  // Initialize default seed photos if file does not exist
  writeBrasiliaPhotos(INITIAL_BRASILIA_PHOTOS);
  return INITIAL_BRASILIA_PHOTOS;
}

function writeBrasiliaPhotos(photos: any[]) {
  try {
    fs.writeFileSync(BRASILIA_PHOTOS_FILE, JSON.stringify(photos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing Brasilia photos DB:', err);
  }
}

// Server-side Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const TOPIC_PHOTOS: Record<string, string[]> = {
  economia: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
  ],
  tecnologia: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80'
  ],
  negocios: [
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80'
  ],
  brasil: [
    'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=1200&q=80'
  ],
  ciencia: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80'
  ]
};

// Fallback smart parser
function parseTextLocally(rawText: string) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let author = 'Redação Infinite News';
  let authorRole = 'Reportagem Especial — Infinite News';
  let title = '';
  let subtitle = '';
  const blocks: any[] = [];
  const paragraphs: string[] = [];
  const quotes: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^(por|reportagem de)\s+/i.test(line)) {
      const match = line.replace(/^(por|reportagem de)\s+/i, '');
      const parts = match.split(/[,—\-]/);
      author = parts[0].trim();
      if (parts[1]) authorRole = parts.slice(1).join(',').trim();
      continue;
    }

    if (!title) {
      title = line.replace(/^[#*-\s]+/, '');
      continue;
    }

    if (!subtitle && line.length > 25 && line.length < 240) {
      subtitle = line;
      continue;
    }

    // Check for quote
    if (line.includes('"') || line.includes("'")) {
      const qm = line.match(/["'](.*?)["']/);
      if (qm && qm[1].length > 15 && quotes.length === 0) {
        quotes.push(qm[1]);
      }
    }

    // Check if line looks like a subheader
    if (line.length < 65 && !line.endsWith('.') && (line.endsWith(':') || line === line.toUpperCase() || line.startsWith('##'))) {
      blocks.push({
        id: `blk-${Date.now()}-${i}`,
        type: 'heading',
        content: line.replace(/^[#*-\s]+/, '')
      });
    } else {
      paragraphs.push(line);
      blocks.push({
        id: `blk-${Date.now()}-${i}`,
        type: 'paragraph',
        content: line
      });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ id: `blk-1`, type: 'paragraph', content: rawText });
    paragraphs.push(rawText);
  }

  // Extract tags based on keywords in title and body
  const tagCandidates = ['Brasil', 'Economia', 'Tecnologia', 'Ciência', 'El Niño', 'Amazônia', 'Saúde', 'Inovação', 'Mercado'];
  const matchedTags: string[] = [];
  const fullContent = (title + ' ' + rawText).toLowerCase();

  tagCandidates.forEach(tag => {
    if (fullContent.includes(tag.toLowerCase())) {
      matchedTags.push(tag);
    }
  });

  if (matchedTags.length === 0) {
    matchedTags.push('Brasil', 'Destaque', 'Infinite News');
  }

  return {
    title: title || 'Novo Acontecimento de Destaque no Brasil',
    subtitle: subtitle || (paragraphs[0]?.slice(0, 160) || ''),
    chapeu: 'NOTÍCIA',
    category: 'tecnologia',
    author,
    authorRole,
    paragraphs,
    blocks,
    keyQuotes: quotes.length > 0 ? quotes : [paragraphs[0]?.slice(0, 100) + '...'],
    tags: matchedTags,
    readTime: '3 min de leitura',
    suggestedImageKeyword: 'news brasil',
    suggestedImageCaption: 'Registro fotográfico da reportagem do Infinite News.',
    imagePrompt: `Editorial photojournalism press photo of ${title}`,
    newspaperEdition: 'Edição Nacional',
    newspaperYear: 'Ano XXXIV (2026)',
    newspaperIssue: 'N° 14.280',
    newspaperPrice: 'R$ 4,50'
  };
}

// ----------------- API ROUTES -----------------

// Admin authentication
app.post('/api/auth/verify-admin', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Senha é obrigatória' });
  }

  const normalized = String(password).trim().toLowerCase();
  if (normalized === 'jornada canva') {
    return res.json({ success: true, message: 'Acesso autorizado à Redação Infinite News' });
  }

  return res.status(401).json({ success: false, message: 'Senha incorreta. Acesso restrito.' });
});

// Get all articles (Only returns non-deleted articles to public)
app.get('/api/articles', (req: Request, res: Response) => {
  const { category, search, includeDeleted } = req.query;
  let articles = readArticles();

  // Public visitors never see deleted articles
  if (includeDeleted !== 'true') {
    articles = articles.filter(a => !a.isDeleted);
  }

  if (category && category !== 'todos') {
    const catLower = String(category).toLowerCase();
    articles = articles.filter(a => 
      a.category?.toLowerCase() === catLower ||
      a.customCategory?.toLowerCase() === catLower
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    articles = articles.filter(a => 
      a.title?.toLowerCase().includes(q) || 
      a.subtitle?.toLowerCase().includes(q) ||
      a.author?.toLowerCase().includes(q) ||
      a.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }

  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  res.json({ success: true, articles });
});

// Get trashed articles (Only accessible for admin)
app.get('/api/articles/trash', (req: Request, res: Response) => {
  const { search } = req.query;
  let articles = readArticles().filter(a => a.isDeleted === true);

  if (search) {
    const q = String(search).toLowerCase();
    articles = articles.filter(a => 
      a.title?.toLowerCase().includes(q) || 
      a.subtitle?.toLowerCase().includes(q) ||
      a.author?.toLowerCase().includes(q) ||
      a.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }

  articles.sort((a, b) => new Date(b.deletedAt || b.updatedAt).getTime() - new Date(a.deletedAt || a.updatedAt).getTime());
  res.json({ success: true, articles });
});

// Get single article by ID
app.get('/api/articles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { allowDeleted } = req.query;
  const articles = readArticles();
  const article = articles.find(a => a.id === id);

  if (!article || (article.isDeleted && allowDeleted !== 'true')) {
    return res.status(404).json({ success: false, message: 'Notícia não encontrada' });
  }

  article.views = (article.views || 0) + 1;
  writeArticles(articles);
  res.json({ success: true, article });
});

// Create & Publish new article
app.post('/api/articles', (req: Request, res: Response) => {
  const {
    title,
    subtitle,
    chapeu,
    category,
    customCategory,
    author,
    authorRole,
    paragraphs,
    blocks,
    keyQuotes,
    tags,
    imageUrl,
    imageCaption,
    imageCredit,
    breakingNews,
    featured,
    sourceGrounding,
    newspaperEdition,
    newspaperYear,
    newspaperIssue,
    newspaperPrice,
    newspaperSection
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'O título da notícia é obrigatório.' });
  }

  const articles = readArticles();

  if (featured) {
    articles.forEach(a => { a.featured = false; });
  }

  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60);

  const uniqueId = `${slug}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  // If blocks are provided, generate simple paragraphs fallback
  const finalBlocks = Array.isArray(blocks) && blocks.length > 0 
    ? blocks 
    : (Array.isArray(paragraphs) ? paragraphs.map((p: string, i: number) => ({ id: `blk-${i}`, type: 'paragraph', content: p })) : []);

  const derivedParagraphs = Array.isArray(paragraphs) && paragraphs.length > 0
    ? paragraphs
    : finalBlocks.filter((b: any) => b.type === 'paragraph').map((b: any) => b.content);

  const totalWords = derivedParagraphs.join(' ').split(/\s+/).length;
  const readMins = Math.max(1, Math.ceil(totalWords / 180));

  const newArticle = {
    id: uniqueId,
    title: title.trim(),
    subtitle: (subtitle || '').trim(),
    chapeu: (chapeu || 'DESTAQUE').trim().toUpperCase(),
    category: (category || 'geral').toLowerCase(),
    customCategory: customCategory ? customCategory.trim() : undefined,
    author: (author || 'Redação Infinite News').trim(),
    authorRole: (authorRole || 'Infinite News').trim(),
    publishedAt: now,
    updatedAt: now,
    readTime: `${readMins} min de leitura`,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    imageCaption: imageCaption || 'Registro fotográfico da reportagem especial.',
    imageCredit: imageCredit || 'Foto: Redação Infinite News',
    paragraphs: derivedParagraphs,
    blocks: finalBlocks,
    keyQuotes: keyQuotes || [],
    tags: tags || [],
    views: 1,
    likes: 0,
    featured: Boolean(featured),
    breakingNews: Boolean(breakingNews),
    comments: [],
    sourceGrounding: sourceGrounding || [],
    newspaperEdition: newspaperEdition || 'Edição Nacional',
    newspaperYear: newspaperYear || 'Ano XXXIV (2026)',
    newspaperIssue: newspaperIssue || 'N° 14.280',
    newspaperPrice: newspaperPrice || 'R$ 4,50',
    newspaperSection: newspaperSection || `CADERNO ${(customCategory || category || 'ESPECIAL').toUpperCase()}`
  };

  articles.unshift(newArticle);
  writeArticles(articles);

  res.status(201).json({ success: true, article: newArticle });
});

// Update article
app.put('/api/articles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const articles = readArticles();
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Notícia não encontrada' });
  }

  const current = articles[index];
  const updatedData = { ...req.body };

  // If blocks are provided, synchronize paragraphs
  if (Array.isArray(updatedData.blocks)) {
    updatedData.paragraphs = updatedData.blocks
      .filter((b: any) => b.type === 'paragraph')
      .map((b: any) => b.content);
  }

  const updated = {
    ...current,
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  articles[index] = updated;
  writeArticles(articles);

  res.json({ success: true, article: updated });
});

// Delete article (Moves to trash by default, or permanent delete)
app.delete('/api/articles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { permanent } = req.query;
  let articles = readArticles();
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Notícia não encontrada' });
  }

  if (permanent === 'true') {
    articles = articles.filter(a => a.id !== id);
    writeArticles(articles);
    return res.json({ success: true, message: 'Reportagem excluída permanentemente do sistema.' });
  }

  // Move to trash (Soft delete)
  articles[index].isDeleted = true;
  articles[index].deletedAt = new Date().toISOString();
  writeArticles(articles);

  res.json({ 
    success: true, 
    message: 'Reportagem enviada para a Lixeira do Administrador com sucesso.',
    article: articles[index]
  });
});

// Restore article from trash
app.post('/api/articles/:id/restore', (req: Request, res: Response) => {
  const { id } = req.params;
  let articles = readArticles();
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Notícia não encontrada' });
  }

  articles[index].isDeleted = false;
  delete articles[index].deletedAt;
  writeArticles(articles);

  res.json({ 
    success: true, 
    message: 'Reportagem restaurada com sucesso para o portal!',
    article: articles[index]
  });
});

// Empty trash (Admin only)
app.delete('/api/articles-trash/empty', (req: Request, res: Response) => {
  let articles = readArticles();
  const countBefore = articles.length;
  articles = articles.filter(a => !a.isDeleted);
  const removedCount = countBefore - articles.length;
  writeArticles(articles);

  res.json({ 
    success: true, 
    message: `${removedCount} matéria(s) foram excluídas permanentemente da lixeira.`
  });
});

// Like article
app.post('/api/articles/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const articles = readArticles();
  const article = articles.find(a => a.id === id);

  if (!article) {
    return res.status(404).json({ success: false, message: 'Notícia não encontrada' });
  }

  article.likes = (article.likes || 0) + 1;
  writeArticles(articles);
  res.json({ success: true, likes: article.likes });
});

// Add comment to article
app.post('/api/articles/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const { author, content } = req.body;

  if (!content) {
    return res.status(400).json({ success: false, message: 'O conteúdo do comentário é obrigatório' });
  }

  const articles = readArticles();
  const article = articles.find(a => a.id === id);

  if (!article) {
    return res.status(404).json({ success: false, message: 'Notícia não encontrada' });
  }

  if (!article.comments) {
    article.comments = [];
  }

  const newComment = {
    id: `c-${Date.now().toString(36)}`,
    author: author?.trim() || 'Leitor do Infinite News',
    avatar: `https://images.unsplash.com/photo-${1534528741775 + (article.comments.length % 5)}?auto=format&fit=crop&w=100&q=80`,
    createdAt: 'Agora mesmo',
    content: content.trim(),
    likes: 0
  };

  article.comments.push(newComment);
  writeArticles(articles);
  res.status(201).json({ success: true, comment: newComment });
});

// Proxy external image with permissive CORS for html2canvas PDF rendering
app.get('/api/proxy-image', async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL is required');
  }

  try {
    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send('Failed to fetch image');
    }
    const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await fetchRes.arrayBuffer();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(500).send('Error proxying image: ' + err.message);
  }
});

// Convert image to base64 data URI to eliminate any canvas taint in jsPDF / html2canvas
app.get('/api/image-base64', async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  try {
    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ success: false, message: 'Failed to fetch image' });
    }
    const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await fetchRes.arrayBuffer();
    const base64 = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ success: true, base64 });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Real-time financial quotes endpoint (Real Dólar, Euro, PIB, Bitcoin, Criptomoedas)
let cachedQuotes: any = null;
let lastQuotesFetch = 0;

app.get('/api/financial-quotes', async (_req: Request, res: Response) => {
  const now = Date.now();
  const custom = readCustomQuotes();

  if (cachedQuotes && now - lastQuotesFetch < 30000) {
    const merged = custom ? { ...cachedQuotes, ...custom } : cachedQuotes;
    return res.json({ success: true, quotes: merged, cached: true });
  }

  try {
    const awesomeRes = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL');
    const awesomeData = awesomeRes.ok ? await awesomeRes.json() : null;

    let ibovPoints = 131450;
    let ibovChange = 0.58;

    try {
      const ibovRes = await fetch('https://brapi.dev/api/quote/%5EBVSP');
      if (ibovRes.ok) {
        const j = await ibovRes.json();
        if (j.results && j.results[0]) {
          if (j.results[0].regularMarketPrice) ibovPoints = j.results[0].regularMarketPrice;
          if (j.results[0].regularMarketChangePercent !== undefined) ibovChange = j.results[0].regularMarketChangePercent;
        }
      }
    } catch (e) {
      // Brapi fallback
    }

    // CoinGecko Global stats: Total number of active cryptocurrencies in the world!
    let totalCryptos = 17482;
    let btcDominance = 56.4;
    let totalCryptoMarketCapUsd = '2,84 trilhões';

    try {
      const cgRes = await fetch('https://api.coingecko.com/api/v3/global', {
        headers: { 'Accept': 'application/json' },
      });
      if (cgRes.ok) {
        const cgData = await cgRes.json();
        if (cgData?.data?.active_cryptocurrencies) {
          totalCryptos = cgData.data.active_cryptocurrencies;
        }
        if (cgData?.data?.market_cap_percentage?.btc) {
          btcDominance = Number(cgData.data.market_cap_percentage.btc.toFixed(1));
        }
        if (cgData?.data?.total_market_cap?.usd) {
          const capTrillions = (cgData.data.total_market_cap.usd / 1e12).toFixed(2);
          totalCryptoMarketCapUsd = `${capTrillions.replace('.', ',')} trilhões`;
        }
      }
    } catch (cgErr) {
      // CoinGecko rate limit fallback
    }

    const usdBrl = awesomeData?.USDBRL;
    const eurBrl = awesomeData?.EURBRL;
    const btcBrl = awesomeData?.BTCBRL;

    const dollarValue = usdBrl ? parseFloat(usdBrl.bid) : 5.68;
    const dollarChange = usdBrl ? parseFloat(usdBrl.pctChange) : 0.32;
    const euroValue = eurBrl ? parseFloat(eurBrl.bid) : 6.14;
    const euroChange = eurBrl ? parseFloat(eurBrl.pctChange) : 0.18;
    const btcValue = btcBrl ? parseFloat(btcBrl.bid) : 585000;
    const btcChange = btcBrl ? parseFloat(btcBrl.pctChange) : 1.45;

    cachedQuotes = {
      dolar: {
        code: 'USD',
        name: 'Dólar Comercial',
        valueFormatted: `R$ ${dollarValue.toFixed(2).replace('.', ',')}`,
        pctFormatted: `${dollarChange >= 0 ? '+' : ''}${dollarChange.toFixed(2).replace('.', ',')}%`,
        isPositive: dollarChange >= 0,
      },
      euro: {
        code: 'EUR',
        name: 'Euro',
        valueFormatted: `R$ ${euroValue.toFixed(2).replace('.', ',')}`,
        pctFormatted: `${euroChange >= 0 ? '+' : ''}${euroChange.toFixed(2).replace('.', ',')}%`,
        isPositive: euroChange >= 0,
      },
      pib: {
        code: 'PIB',
        name: 'PIB Brasil',
        valueFormatted: 'R$ 10,9 tri',
        pointsFormatted: 'R$ 10,9 tri',
        pctFormatted: '+2,9% a.a.',
        isPositive: true,
        description: 'Produto Interno Bruto em crescimento'
      },
      // Backward compatibility alias for Ibovespa
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
        valueFormatted: `R$ ${Math.round(btcValue).toLocaleString('pt-BR')}`,
        pctFormatted: `${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2).replace('.', ',')}%`,
        isPositive: btcChange >= 0,
      },
      cryptoGlobal: {
        totalCryptocurrencies: totalCryptos,
        totalCryptosFormatted: `${totalCryptos.toLocaleString('pt-BR')} criptos`,
        btcDominance: `${btcDominance}%`,
        marketCapUsd: `US$ ${totalCryptoMarketCapUsd}`,
        source: 'CoinGecko Global Analytics'
      },
      updatedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      source: 'Tempo Real (AwesomeAPI, B3, IBGE & CoinGecko)'
    };

    if (custom) {
      cachedQuotes = { ...cachedQuotes, ...custom };
    }

    lastQuotesFetch = now;
    res.json({ success: true, quotes: cachedQuotes, cached: false });
  } catch (err: any) {
    console.error('Error fetching quotes:', err);
    let base = {
      dolar: { valueFormatted: 'R$ 5,68', pctFormatted: '+0,32%', isPositive: true },
      euro: { valueFormatted: 'R$ 6,14', pctFormatted: '+0,18%', isPositive: true },
      pib: { valueFormatted: 'R$ 10,9 tri', pointsFormatted: 'R$ 10,9 tri', pctFormatted: '+2,9% a.a.', isPositive: true },
      ibovespa: { pointsFormatted: 'R$ 10,9 tri', pctFormatted: '+2,9% a.a.', isPositive: true },
      bitcoin: { valueFormatted: 'R$ 585.000', pctFormatted: '+1,45%', isPositive: true },
      cryptoGlobal: {
        totalCryptocurrencies: 17482,
        totalCryptosFormatted: '17.482 criptos',
        btcDominance: '56.4%',
        marketCapUsd: 'US$ 2,84 trilhões',
        source: 'CoinGecko'
      },
      updatedAt: new Date().toLocaleTimeString('pt-BR'),
      source: 'Tempo Real'
    };
    if (custom) base = { ...base, ...custom };
    res.json({ success: true, quotes: base });
  }
});

// Admin endpoint to edit financial quotes & PIB
app.post('/api/financial-quotes', (req: Request, res: Response) => {
  const current = readCustomQuotes() || {};
  const updated = {
    ...current,
    ...req.body,
    updatedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
  writeCustomQuotes(updated);
  if (cachedQuotes) {
    cachedQuotes = { ...cachedQuotes, ...updated };
  }
  res.json({ success: true, quotes: updated, message: 'Cotações e PIB atualizados pelo Administrador!' });
});

// Brasília Photos Endpoints (Timeline Day-by-Day & Month-by-Month)
app.get('/api/brasilia-photos', (_req: Request, res: Response) => {
  const photos = readBrasiliaPhotos();
  res.json({ success: true, photos });
});

app.post('/api/brasilia-photos', (req: Request, res: Response) => {
  const photos = readBrasiliaPhotos();
  const {
    landmarkId,
    landmarkName,
    title,
    date,
    dateFormatted,
    monthLabel,
    periodOfDay,
    weather,
    photographer,
    imageUrl,
    caption,
    coordinates,
    tags
  } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'A imagem da foto é obrigatória (URL ou upload do celular)' });
  }

  const newPhoto = {
    id: `bsb-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    landmarkId: landmarkId || 'congresso',
    landmarkName: landmarkName || 'Congresso Nacional & Esplanada',
    title: (title || 'Novo Registro de Brasília').trim(),
    date: date || new Date().toISOString().split('T')[0],
    dateFormatted: dateFormatted || new Date().toLocaleDateString('pt-BR'),
    monthLabel: monthLabel || 'Outubro 2026',
    periodOfDay: periodOfDay || 'Manhã',
    weather: weather || '28°C • Céu Aberto',
    photographer: photographer || 'Admin INFINITY',
    imageUrl, // Can be base64 data URI uploaded from mobile device or URL
    caption: caption || 'Registro fotográfico em Brasília.',
    coordinates: coordinates || '-15.7998, -47.8645',
    tags: Array.isArray(tags) && tags.length > 0 ? tags : ['Brasília', 'DF', landmarkName || 'Monumento']
  };

  photos.unshift(newPhoto);
  writeBrasiliaPhotos(photos);
  res.status(201).json({ success: true, photo: newPhoto });
});

app.put('/api/brasilia-photos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const photos = readBrasiliaPhotos();
  const index = photos.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Foto não encontrada' });
  }
  photos[index] = { ...photos[index], ...req.body };
  writeBrasiliaPhotos(photos);
  res.json({ success: true, photo: photos[index] });
});

app.delete('/api/brasilia-photos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let photos = readBrasiliaPhotos();
  const initialLen = photos.length;
  photos = photos.filter(p => p.id !== id);
  if (photos.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Foto não encontrada' });
  }
  writeBrasiliaPhotos(photos);
  res.json({ success: true, message: 'Foto excluída com sucesso do acervo de Brasília.' });
});

// ----------------- GEMINI AI WORKFLOWS -----------------

// 1. AI Text Parser
app.post('/api/gemini/parse-news', async (req: Request, res: Response) => {
  const { rawText } = req.body;

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Por favor, insira o texto da notícia para a IA analisar.'
    });
  }

  try {
    const prompt = `Você é o editor sênior de jornalismo investigativo do Infinite News.
Analise o texto bruto fornecido abaixo e desmembre-o em todas as partes jornalísticas fundamentais com padrão de excelência de redação:

TEXTO BRUTO:
"""
${rawText}
"""

Retorne OBRIGATORIAMENTE um JSON puro com:
{
  "title": "Manchete impactante, clara e direta estilo G1 (sem ponto final, verbo no presente)",
  "subtitle": "Linha fina explicativa com 1 ou 2 frases densas de contexto",
  "chapeu": "Palavra-chave da editoria em caixa alta (ex: ECONOMIA, TECNOLOGIA, NEGÓCIOS, BRASIL, CIÊNCIA, POLÍTICA, MEIO AMBIENTE, SAÚDE)",
  "category": "brasil, economia, tecnologia, negocios, politica, ciencia, mundo, entretenimento ou esportes",
  "author": "Nome do autor ou repórter identificado no texto. Se nenhum for citado, use 'Redação Infinite News'",
  "authorRole": "Função jornalística (ex: 'Repórter Especial em Brasília', 'Editor de Tecnologia')",
  "paragraphs": [
    "Primeiro parágrafo (Lead jornalístico)",
    "Segundo parágrafo desenvolvendo dados e contexto...",
    "Terceiro parágrafo..."
  ],
  "keyQuotes": [
    "Frase ou declaração marcante para destaque em caixa de citação retirada diretamente do texto"
  ],
  "tags": ["Palavra-chave 1", "Palavra-chave 2", "Palavra-chave 3", "Palavra-chave 4"],
  "readTime": "3 min de leitura",
  "suggestedImageKeyword": "Termo de busca em inglês para foto editorial correspondente",
  "suggestedImageCaption": "Legenda descritiva e formal para a fotografia da matéria.",
  "imagePrompt": "Professional editorial press photography of [theme], 4k photojournalism",
  "newspaperEdition": "Edição Nacional",
  "newspaperYear": "Ano XXXIV (2026)",
  "newspaperIssue": "N° 14.280",
  "newspaperPrice": "R$ 4,50"
}`;

    let parsedData: any = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      try {
        parsedData = JSON.parse(text);
      } catch (jsonErr) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsedData = JSON.parse(match[0]);
      }
    } catch (apiErr: any) {
      console.warn('Gemini generateContent parse warning:', apiErr?.message);
    }

    if (!parsedData || !parsedData.title || !parsedData.paragraphs) {
      parsedData = parseTextLocally(rawText);
    }

    // Convert paragraphs into StoryBlocks
    if (parsedData.paragraphs && Array.isArray(parsedData.paragraphs)) {
      parsedData.blocks = parsedData.paragraphs.map((p: string, i: number) => ({
        id: `blk-${Date.now()}-${i}`,
        type: 'paragraph',
        content: p
      }));
    }

    const categoryKey = (parsedData.category || 'tecnologia').toLowerCase();
    const suggestedImages = TOPIC_PHOTOS[categoryKey] || TOPIC_PHOTOS['tecnologia'];

    return res.json({
      success: true,
      data: {
        ...parsedData,
        suggestedImages,
      },
    });
  } catch (err: any) {
    console.error('Critical error in parse-news:', err);
    const fallbackData = parseTextLocally(rawText);
    const categoryKey = (fallbackData.category || 'tecnologia').toLowerCase();
    const suggestedImages = TOPIC_PHOTOS[categoryKey] || TOPIC_PHOTOS['tecnologia'];

    return res.json({
      success: true,
      data: {
        ...fallbackData,
        suggestedImages,
      },
    });
  }
});

// 2. Text-to-Speech (TTS)
app.post('/api/gemini/tts', async (req: Request, res: Response) => {
  const { text, title } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: 'Texto para narração é obrigatório' });
  }

  try {
    const spokenText = title 
      ? `Você está ouvindo o Infinite News com o repórter Fifine: ${title}. ${text.slice(0, 450)}` 
      : text.slice(0, 500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: spokenText,
              speechMetadata: {
                style: 'Locutor profissional do Infinite News, voz amigável, clara e de dicção exemplar em português do Brasil.',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('Nenhum dado de áudio foi retornado.');
    }

    return res.json({
      success: true,
      audioData: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (err: any) {
    console.error('Error in TTS:', err);
    return res.status(500).json({
      success: false,
      message: 'Não foi possível gerar áudio no momento: ' + (err.message || 'Erro no TTS'),
    });
  }
});

// 3. AI Image Generation
app.post('/api/gemini/generate-image', async (req: Request, res: Response) => {
  const { prompt, category } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, message: 'Prompt de imagem é obrigatório' });
  }

  try {
    const fullPrompt = `Award-winning Brazilian photojournalism news photography, high-resolution editorial press photo, realistic lighting, documentary style: ${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '16:9',
        },
      },
    });

    let generatedImageUrl: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (generatedImageUrl) {
      return res.json({ success: true, imageUrl: generatedImageUrl, generatedByAI: true });
    }

    const fallbackCategory = (category || 'tecnologia').toLowerCase();
    const fallbackList = TOPIC_PHOTOS[fallbackCategory] || TOPIC_PHOTOS['tecnologia'];
    const fallback = fallbackList[Math.floor(Math.random() * fallbackList.length)];

    return res.json({
      success: true,
      imageUrl: fallback,
      generatedByAI: false,
      message: 'Foto editorial selecionada do acervo Infinite News.',
    });
  } catch (err: any) {
    console.warn('AI Image Generation exception (falling back):', err?.message);
    const fallbackCategory = (category || 'tecnologia').toLowerCase();
    const fallbackList = TOPIC_PHOTOS[fallbackCategory] || TOPIC_PHOTOS['tecnologia'];
    const fallback = fallbackList[Math.floor(Math.random() * fallbackList.length)];

    return res.json({
      success: true,
      imageUrl: fallback,
      generatedByAI: false,
      message: 'Foto temática selecionada do acervo editorial.',
    });
  }
});

// 4. Repórter IA Fifine (Correspondente Sênior, Análise Multimodal & Investigação Editorial)
app.post('/api/gemini/assistant-chat', async (req: Request, res: Response) => {
  const { 
    message, 
    articleTitle, 
    articleContext,
    imageData,
    imageMimeType,
    audioData,
    audioMimeType
  } = req.body;

  if (!message && !imageData && !audioData) {
    return res.status(400).json({ success: false, message: 'Envie uma mensagem de texto, foto ou áudio para análise.' });
  }

  const systemInstruction = `Você é o "Repórter IA Fifine" (pronúncia F-I-N-I-F-I), o Correspondente Sênior, Perito Multimodal e Âncora Oficial de Investigação Editorial do portal INFINITY.
Suas características principais:

1. IDENTIDADE & POSTURA PROFISSIONAL:
- Você é culto, polido, detalhista, elegante e dono de uma oratória jornalística primorosa (padrão grandes âncoras da imprensa internacional e brasileira).
- Seus textos são belos, ricos, fluidos e primorosamente redigidos. Escreva com vocabulário refinado em português do Brasil, ritmo agradável de leitura e falas convincentes.
- Jamais seja monótono, superficial ou robótico. Apresente fatos apurados, dados concretos, percentuais e análises profundas.

2. ANÁLISE DE FOTOGRAFIAS, IMAGENS E DOCUMENTOS:
- Quando o usuário enviar uma FOTO ou IMAGEM: faça uma perícia visual jornalística completa, minuciosa e detalhada.
- Identifique elementos visuais centrais e periféricos, leia eventuais textos ou letreiros na cena, observe arquitetura, vestimentas, clima, expressões, objetos ou dados técnicos.
- Estruture a análise com títulos elegantes, por exemplo:
  * 🔎 **Análise Visual & Elementos Identificados**
  * 🏛️ **Contexto Noticioso & Detalhes Periciais**
  * 📰 **Avaliação Editorial do INFINITY**
- Se for uma imagem documental, documento ou gráfico, extraia e interprete todos os números e informações com máxima clareza.

3. ANÁLISE DE ÁUDIO E VOZ:
- Quando o usuário enviar um ÁUDIO ou MENSAGEM POR VOZ: ouça com atenção, capte nuances da dúvida ou relato e responda com a precisão de um editor executivo ao vivo no ar.

4. CONHECIMENTO UNIVERSAL & RESPOSTAS SEM RESTRIÇÃO:
- Você responde a QUALQUER pergunta do usuário imediatamente, com total presteza, carisma e autoridade intelectual, MESMO QUE NÃO TENHA NADA A VER COM NOTÍCIAS OU COM O PORTAL:
  * Curiosidades do mundo, história, ciência, cotidiano, conselhos, receitas, tecnologia, filosofia, línguas, etc.
  * Análise pericial da foto que o usuário mandou, do áudio que enviou ou do texto digitado.
  * Macroeconomia, cotações reais (Dólar, Euro, PIB, inflação e universo cripto: mais de 17.480 criptomoedas).
  * Brasil em profundidade: estados, cidades históricas, capitais (Pernambuco, São Paulo, Brasília, etc.), Floresta Amazônica e águas territoriais.
- Nunca recuse uma pergunta por 'não ser do portal' ou 'não ser notícia'. Você é um assistente e repórter ultra-culto, versátil e completo. Se houver matéria em tela (${articleTitle ? `"${articleTitle}"` : 'Geral'}), use como referência complementar se for pertinente, mas dê prioridade absoluta ao que o usuário perguntou.`;

  try {
    const parts: any[] = [];

    // Attach Image Part if provided
    if (imageData && typeof imageData === 'string') {
      let cleanData = imageData;
      let mime = imageMimeType || 'image/jpeg';
      if (imageData.startsWith('data:')) {
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mime = matches[1];
          cleanData = matches[2];
        }
      }
      parts.push({
        inlineData: {
          mimeType: mime,
          data: cleanData
        }
      });
    }

    // Attach Audio Part if provided
    if (audioData && typeof audioData === 'string') {
      let cleanData = audioData;
      let mime = audioMimeType || 'audio/webm';
      if (audioData.startsWith('data:')) {
        const matches = audioData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mime = matches[1];
          cleanData = matches[2];
        }
      }
      parts.push({
        inlineData: {
          mimeType: mime,
          data: cleanData
        }
      });
    }

    // Text prompt
    const promptText = (message && typeof message === 'string' && message.trim().length > 0)
      ? message.trim()
      : imageData
      ? 'Por favor, realize uma análise visual detalhada, profissional e pericial desta fotografia, explicando os elementos, contexto e o que ela representa com excelência jornalística.'
      : audioData
      ? 'Por favor, analise a mensagem deste áudio e formule uma resposta jornalística completa, profissional e fundamentada.'
      : 'Olá Fifine, apresente seu boletim editorial com os principais destaques do dia.';

    parts.push({ text: promptText });

    let reply = '';

    // If pure text without attachments, try with Google Search grounding
    if (!imageData && !audioData) {
      try {
        const searchResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
          },
        });
        reply = searchResponse.text || '';
      } catch (searchErr) {
        console.warn('Search tool attempt fallback in assistant-chat:', searchErr);
      }
    }

    // Direct generation if search was not used or did not produce reply
    if (!reply) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction,
        },
      });
      reply = response.text || '';
    }

    if (!reply) {
      reply = `Olá! Sou o Repórter IA Fifine. Registrei sua mensagem${imageData ? ' e a imagem anexada' : ''}. Nossa redação do INFINITY apurou os dados pertinentes sobre este assunto e estamos prontos para aprofundar qualquer detalhe.`;
    }

    return res.json({ success: true, reply });
  } catch (err: any) {
    console.error('Error in assistant-chat multimodal:', err);
    return res.json({
      success: true,
      reply: `Olá! Sou o Repórter IA Fifine. Recebi seu envio com sucesso. Em razão do alto volume de consultas na bancada do INFINITY, sintetizei as informações essenciais. Em qual aspecto você gostaria de aprofundar nossa apuração jornalística?`,
    });
  }
});

// ----------------- VITE MIDDLEWARE / STATIC FILES -----------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Infinite News Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
