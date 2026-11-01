import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from '../lib/firebase';

export interface CityStreetPhoto {
  id: string;
  city: 'brasilia' | 'recife';
  cityName: string;
  landmarkId: string;
  landmarkName: string;
  title: string;
  date: string;
  dateFormatted: string;
  monthLabel: string;
  periodOfDay: 'Manhã' | 'Tarde' | 'Pôr do Sol' | 'Noite';
  weather: string;
  photographer: string;
  imageUrl: string;
  caption: string;
  coordinates: string;
  tags: string[];
}

const CITY_PHOTOS_COLLECTION = 'city_photos';

export const INITIAL_CITY_PHOTOS: CityStreetPhoto[] = [
  // BRASÍLIA
  {
    id: 'bsb-congresso-esplanada',
    city: 'brasilia',
    cityName: 'Brasília (DF)',
    landmarkId: 'congresso',
    landmarkName: 'Congresso Nacional & Esplanada dos Ministérios',
    title: 'Esplanada dos Ministérios e Cúpulas no Espelho d\'Água',
    date: '2026-10-30',
    dateFormatted: '30 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Manhã',
    weather: '29°C • Céu Aberto de Primavera',
    photographer: 'Marcelo Camargo / Agência Brasil',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1600&q=85',
    caption: 'Manhã ensolarada no coração político do país. O espelho d\'água reflete as icônicas cúpulas da Câmara dos Deputados e do Senado Federal concebidas por Oscar Niemeyer.',
    coordinates: '-15.7998, -47.8645',
    tags: ['Brasília', 'Esplanada', 'Congresso', 'Niemeyer']
  },
  {
    id: 'bsb-ponte-jk',
    city: 'brasilia',
    cityName: 'Brasília (DF)',
    landmarkId: 'ponte_jk',
    landmarkName: 'Ponte Juscelino Kubitschek (Ponte JK)',
    title: 'Pôr do Sol Dourado sobre os Arcos da Ponte JK',
    date: '2026-10-29',
    dateFormatted: '29 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Pôr do Sol',
    weather: '28°C • Pôr do sol avermelhado no Lago Paranoá',
    photographer: 'Acervo INFINITY / Turismo DF',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1600&q=85',
    caption: 'Crepúsculo sobre as águas do Lago Paranoá. Os três arcos assimétricos da Ponte JK criam um dos cartões-postais mais celebrados da arquitetura moderna mundial.',
    coordinates: '-15.8242, -47.8294',
    tags: ['Brasília', 'Ponte JK', 'Lago Paranoá', 'Pôr do Sol']
  },
  {
    id: 'bsb-catedral',
    city: 'brasilia',
    cityName: 'Brasília (DF)',
    landmarkId: 'catedral',
    landmarkName: 'Catedral Metropolitana Nossa Senhora Aparecida',
    title: 'Pilares Hiperboloides e Vitrais Azuis da Catedral',
    date: '2026-10-28',
    dateFormatted: '28 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Tarde',
    weather: '30°C • Céu Limpo',
    photographer: 'Agência Brasil',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1600&q=85',
    caption: 'Com 16 pilares de concreto curvos convergindo ao céu, a Catedral Metropolitana de Brasília é uma obra-prima de Oscar Niemeyer e Marianne Peretti.',
    coordinates: '-15.7983, -47.8756',
    tags: ['Brasília', 'Catedral', 'Niemeyer', 'Vitrais']
  },
  {
    id: 'bsb-praca-tres-poderes',
    city: 'brasilia',
    cityName: 'Brasília (DF)',
    landmarkId: 'praca_tres_poderes',
    landmarkName: 'Praça dos Três Poderes & Palácio do Planalto',
    title: 'Vista da Praça dos Três Poderes e Mastro da Bandeira',
    date: '2026-10-25',
    dateFormatted: '25 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Manhã',
    weather: '27°C • Vento suave do Planalto Central',
    photographer: 'Arquivo INFINITY',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=85',
    caption: 'O ponto de encontro dos três poderes da República: Palácio do Planalto (Executivo), Congresso Nacional (Legislativo) e Supremo Tribunal Federal (Judiciário).',
    coordinates: '-15.8005, -47.8617',
    tags: ['Brasília', 'Praça dos Três Poderes', 'Planalto', 'STF']
  },

  // RECIFE (PERNAMBUCO)
  {
    id: 'rec-marco-zero',
    city: 'recife',
    cityName: 'Recife (PE)',
    landmarkId: 'marco_zero',
    landmarkName: 'Praça do Marco Zero & Porto do Recife',
    title: 'Praça do Marco Zero e Rosa dos Ventos de Cícero Dias',
    date: '2026-10-30',
    dateFormatted: '30 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Tarde',
    weather: '29°C • Brisa marítima no Porto Novo',
    photographer: 'Prefeitura do Recife / Acervo Cultural',
    imageUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=1600&q=85',
    caption: 'O coração histórico de Pernambuco. A praça que dá origem a todas as distâncias rodoviárias do estado, de frente para o Parque de Esculturas de Francisco Brennand no mar.',
    coordinates: '-8.0631, -34.8711',
    tags: ['Recife', 'Marco Zero', 'Recife Antigo', 'Pernambuco']
  },
  {
    id: 'rec-rua-bom-jesus',
    city: 'recife',
    cityName: 'Recife (PE)',
    landmarkId: 'bom_jesus',
    landmarkName: 'Rua do Bom Jesus (Recife Antigo)',
    title: 'Casario Histórico Colorido da Rua do Bom Jesus',
    date: '2026-10-29',
    dateFormatted: '29 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Manhã',
    weather: '28°C • Céu azul com nuvens tropicais',
    photographer: 'Embratur / Divulgação Pernambuco',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85',
    caption: 'Eleita uma das ruas mais bonitas do mundo pela revista Architectural Digest, abriga casarios holandeses e a Sinagoga Kahal Zur Israel, a primeira das Américas.',
    coordinates: '-8.0622, -34.8717',
    tags: ['Recife', 'Rua do Bom Jesus', 'Recife Antigo', 'História']
  },
  {
    id: 'rec-pontes-capibaribe',
    city: 'recife',
    cityName: 'Recife (PE)',
    landmarkId: 'pontes_recife',
    landmarkName: 'Pontes do Rio Capibaribe & Cais da Aurora',
    title: 'Veneza Brasileira: Pontes Históricas sobre o Rio Capibaribe',
    date: '2026-10-28',
    dateFormatted: '28 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Pôr do Sol',
    weather: '27°C • Crepúsculo dourado sobre as águas',
    photographer: 'Acervo INFINITY Recife',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85',
    caption: 'As pontes Mauricio de Nassau e Buarque de Macedo conectam as ilhas do centro histórico sobre o caudaloso Rio Capibaribe, conferindo a Recife o título de Veneza Brasileira.',
    coordinates: '-8.0605, -34.8765',
    tags: ['Recife', 'Pontes', 'Capibaribe', 'Veneza Brasileira']
  },
  {
    id: 'rec-boa-viagem',
    city: 'recife',
    cityName: 'Recife (PE)',
    landmarkId: 'boa_viagem',
    landmarkName: 'Orla da Praia de Boa Viagem & Piscinas Naturais',
    title: 'Praia de Boa Viagem com Seus Recifes Naturais',
    date: '2026-10-27',
    dateFormatted: '27 de Outubro de 2026',
    monthLabel: 'Outubro 2026',
    periodOfDay: 'Manhã',
    weather: '31°C • Maré baixa revelando os arrecifes',
    photographer: 'Secretaria de Turismo de Pernambuco',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    caption: 'Com seus famosos recifes de arenito que deram nome à cidade, a Praia de Boa Viagem tem calçadão arborizado, coqueiros e águas mornas de tom esmeralda.',
    coordinates: '-8.1259, -34.9017',
    tags: ['Recife', 'Boa Viagem', 'Praia', 'Recifes']
  }
];

// Seed initial city photos into Firestore if collection is empty
export async function seedCityPhotosIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, CITY_PHOTOS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log('[Firestore] Inicializando fotos reais de Brasília e Recife...');
      for (const photo of INITIAL_CITY_PHOTOS) {
        await setDoc(doc(db, CITY_PHOTOS_COLLECTION, photo.id), photo);
      }
    }
  } catch (err) {
    console.warn('[Firestore] Aviso ao semear fotos de cidades:', err);
  }
}

// Fetch city photos from Firestore
export async function getCityPhotosFromFirestore(city?: 'brasilia' | 'recife' | 'all'): Promise<CityStreetPhoto[]> {
  try {
    const colRef = collection(db, CITY_PHOTOS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      await seedCityPhotosIfEmpty();
      return INITIAL_CITY_PHOTOS.filter(p => !city || city === 'all' || p.city === city);
    }
    const photos: CityStreetPhoto[] = [];
    snap.forEach((d) => {
      const data = d.data() as CityStreetPhoto;
      photos.push({ ...data, id: d.id });
    });
    photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (city && city !== 'all') {
      return photos.filter(p => p.city === city);
    }
    return photos;
  } catch (err) {
    console.warn('[Firestore] Erro ao carregar fotos:', err);
    return INITIAL_CITY_PHOTOS.filter(p => !city || city === 'all' || p.city === city);
  }
}

// Save a new or edited photo to Firestore
export async function saveCityPhotoToFirestore(photo: CityStreetPhoto): Promise<CityStreetPhoto> {
  const docRef = doc(db, CITY_PHOTOS_COLLECTION, photo.id);
  await setDoc(docRef, photo, { merge: true });
  return photo;
}

// Delete photo from Firestore
export async function deleteCityPhotoFromFirestore(photoId: string): Promise<void> {
  const docRef = doc(db, CITY_PHOTOS_COLLECTION, photoId);
  await deleteDoc(docRef);
}

// Real-time listener for city photos
export function subscribeToCityPhotos(onUpdate: (photos: CityStreetPhoto[]) => void) {
  const colRef = collection(db, CITY_PHOTOS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const list: CityStreetPhoto[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as CityStreetPhoto), id: d.id });
    });
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (list.length > 0) {
      onUpdate(list);
    }
  }, (err) => {
    console.warn('[Firestore] Listener de fotos de cidades:', err);
  });
}
