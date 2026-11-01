export interface CommentItem {
  id: string;
  author: string;
  avatar?: string;
  createdAt: string;
  content: string;
  likes: number;
}

export type StoryBlockType = 'paragraph' | 'heading' | 'image' | 'video';

export interface StoryBlock {
  id: string;
  type: StoryBlockType;
  content: string;
  caption?: string;
  credit?: string;
  videoType?: 'youtube' | 'vimeo' | 'mp4' | 'device';
}

export interface NewsArticle {
  id: string;
  title: string;
  subtitle: string;
  chapeu: string;
  category: string;
  customCategory?: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  imageUrl: string;
  imageCaption: string;
  imageCredit: string;
  paragraphs: string[]; // for backwards compatibility
  blocks?: StoryBlock[]; // structured rich content: paragraphs, headings, inline images
  keyQuotes: string[];
  tags: string[];
  views: number;
  likes: number;
  featured: boolean;
  breakingNews: boolean;
  comments: CommentItem[];
  sourceGrounding?: { title: string; url: string }[];
  audioUrl?: string;

  // Customizable newspaper print metadata
  newspaperEdition?: string; // e.g. "Edição Nacional"
  newspaperYear?: string;    // e.g. "Ano XXXIV (2026)"
  newspaperIssue?: string;   // e.g. "N° 14.280"
  newspaperPrice?: string;   // e.g. "R$ 4,50"
  newspaperSection?: string; // e.g. "CADERNO CIÊNCIA"
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface NewsDraft {
  id: string;
  title: string;
  subtitle: string;
  chapeu: string;
  category: string;
  customCategory?: string;
  author: string;
  authorRole: string;
  rawText?: string;
  blocks: StoryBlock[];
  paragraphs: string[];
  keyQuotes: string[];
  tags: string[];
  imageUrl: string;
  imageCaption: string;
  imageCredit: string;
  lastModified: string;
  newspaperEdition?: string;
  newspaperYear?: string;
  newspaperIssue?: string;
  newspaperPrice?: string;
  newspaperSection?: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  badgeColor: string;
}

export const CATEGORIES: NewsCategory[] = [
  { id: 'todos', name: 'Todos', color: '#c4170c', bgColor: 'bg-red-50', textColor: 'text-red-700', badgeColor: 'bg-red-600' },
  { id: 'brasil', name: 'Brasil', color: '#00843d', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', badgeColor: 'bg-emerald-600' },
  { id: 'economia', name: 'Economia', color: '#005a9c', bgColor: 'bg-blue-50', textColor: 'text-blue-700', badgeColor: 'bg-blue-700' },
  { id: 'tecnologia', name: 'Tecnologia', color: '#6b21a8', bgColor: 'bg-purple-50', textColor: 'text-purple-700', badgeColor: 'bg-purple-700' },
  { id: 'negocios', name: 'Negócios', color: '#b45309', bgColor: 'bg-amber-50', textColor: 'text-amber-800', badgeColor: 'bg-amber-700' },
  { id: 'politica', name: 'Política', color: '#374151', bgColor: 'bg-gray-100', textColor: 'text-gray-800', badgeColor: 'bg-gray-700' },
  { id: 'ciencia', name: 'Ciência & Saúde', color: '#0d9488', bgColor: 'bg-teal-50', textColor: 'text-teal-700', badgeColor: 'bg-teal-700' },
  { id: 'mundo', name: 'Mundo', color: '#1d4ed8', bgColor: 'bg-sky-50', textColor: 'text-sky-700', badgeColor: 'bg-sky-700' },
  { id: 'entretenimento', name: 'Pop & Arte', color: '#be185d', bgColor: 'bg-pink-50', textColor: 'text-pink-700', badgeColor: 'bg-pink-700' },
  { id: 'esportes', name: 'Esportes', color: '#15803d', bgColor: 'bg-green-50', textColor: 'text-green-700', badgeColor: 'bg-green-700' },
];

export interface ParsedNewsResult {
  title: string;
  subtitle: string;
  chapeu: string;
  category: string;
  author: string;
  authorRole: string;
  paragraphs: string[];
  blocks?: StoryBlock[];
  keyQuotes: string[];
  tags: string[];
  readTime: string;
  suggestedImageKeyword: string;
  suggestedImageCaption: string;
  imagePrompt: string;
  groundingSources?: { title: string; url: string }[];
  suggestedImages?: string[];
  newspaperEdition?: string;
  newspaperYear?: string;
  newspaperIssue?: string;
  newspaperPrice?: string;
}

export interface BrasiliaPhoto {
  id: string;
  landmarkId: string;
  landmarkName: string;
  title: string;
  date: string;
  dateFormatted: string;
  monthLabel: string;
  periodOfDay: 'Manhã' | 'Tarde' | 'Pôr do Sol' | 'Noite' | string;
  weather: string;
  photographer: string;
  imageUrl: string;
  caption: string;
  coordinates: string;
  tags: string[];
}

export interface FinancialQuotes {
  dolar: {
    code?: string;
    name?: string;
    valueFormatted: string;
    pctFormatted: string;
    isPositive: boolean;
  };
  euro: {
    code?: string;
    name?: string;
    valueFormatted: string;
    pctFormatted: string;
    isPositive: boolean;
  };
  pib: {
    code?: string;
    name?: string;
    valueFormatted?: string;
    pointsFormatted: string;
    pctFormatted: string;
    isPositive: boolean;
    description?: string;
  };
  ibovespa?: {
    code?: string;
    name?: string;
    pointsFormatted: string;
    pctFormatted: string;
    isPositive: boolean;
  };
  bitcoin: {
    code?: string;
    name?: string;
    valueFormatted: string;
    pctFormatted: string;
    isPositive: boolean;
  };
  cryptoGlobal?: {
    totalCryptocurrencies?: number;
    totalCryptosFormatted?: string;
    btcDominance?: string;
    marketCapUsd?: string;
    source?: string;
  };
  updatedAt?: string;
  source?: string;
}
