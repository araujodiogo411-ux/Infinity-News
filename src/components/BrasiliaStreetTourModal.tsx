import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Camera, 
  Pencil, 
  Upload, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Sun, 
  Compass, 
  Maximize2,
  Building2,
  Database
} from 'lucide-react';
import { 
  CityStreetPhoto, 
  getCityPhotosFromFirestore, 
  saveCityPhotoToFirestore, 
  deleteCityPhotoFromFirestore, 
  subscribeToCityPhotos,
  INITIAL_CITY_PHOTOS 
} from '../services/cityPhotosService';

interface BrasiliaStreetTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

const BRASILIA_LANDMARKS = [
  { id: 'all', name: 'Todos os Pontos de Brasília' },
  { id: 'congresso', name: 'Congresso Nacional & Esplanada' },
  { id: 'catedral', name: 'Catedral Metropolitana' },
  { id: 'ponte_jk', name: 'Ponte Juscelino Kubitschek (Ponte JK)' },
  { id: 'praca_tres_poderes', name: 'Praça dos Três Poderes & Planalto' },
  { id: 'torre_tv', name: 'Torre de TV & Eixo Monumental' },
  { id: 'memorial_jk', name: 'Memorial JK' },
  { id: 'pontao_lago_sul', name: 'Pontão do Lago Sul & Orla' },
];

const RECIFE_LANDMARKS = [
  { id: 'all', name: 'Todos os Pontos de Recife' },
  { id: 'marco_zero', name: 'Praça do Marco Zero' },
  { id: 'bom_jesus', name: 'Rua do Bom Jesus (Recife Antigo)' },
  { id: 'pontes_recife', name: 'Pontes do Rio Capibaribe & Aurora' },
  { id: 'boa_viagem', name: 'Praia de Boa Viagem & Recifes' },
  { id: 'brennand', name: 'Instituto Ricardo Brennand' },
  { id: 'porto_digital', name: 'Porto Digital & Bairro do Recife' },
];

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1600&q=85';

export const BrasiliaStreetTourModal: React.FC<BrasiliaStreetTourModalProps> = ({
  isOpen,
  onClose,
  isAdmin
}) => {
  const [selectedCity, setSelectedCity] = useState<'brasilia' | 'recife'>('brasilia');
  const [photos, setPhotos] = useState<CityStreetPhoto[]>(INITIAL_CITY_PHOTOS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLandmark, setSelectedLandmark] = useState<string>('all');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [zoomedPhoto, setZoomedPhoto] = useState<CityStreetPhoto | null>(null);

  // Admin Upload Modal
  const [adminModeOpen, setAdminModeOpen] = useState(false);
  const [uploadCity, setUploadCity] = useState<'brasilia' | 'recife'>('brasilia');
  const [uploadLandmark, setUploadLandmark] = useState('congresso');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadPeriod, setUploadPeriod] = useState<'Manhã' | 'Tarde' | 'Pôr do Sol' | 'Noite'>('Manhã');
  const [uploadWeather, setUploadWeather] = useState('29°C • Céu Aberto');
  const [uploadPhotographer, setUploadPhotographer] = useState('Admin INFINITY');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadImagePreview, setUploadImagePreview] = useState<string | null>(null);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load photos from Firestore
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    getCityPhotosFromFirestore('all').then(data => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setPhotos(data);
        setIsLoading(false);
      }
    }).catch(err => {
      console.warn('Fallback city photos:', err);
      setIsLoading(false);
    });

    const unsubscribe = subscribeToCityPhotos((livePhotos) => {
      if (isMounted && Array.isArray(livePhotos) && livePhotos.length > 0) {
        setPhotos(livePhotos);
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered by selected city and landmark
  const cityFilteredPhotos = photos.filter(p => p.city === selectedCity);
  const displayedPhotos = cityFilteredPhotos.filter(p => selectedLandmark === 'all' || p.landmarkId === selectedLandmark);

  const currentPhoto = displayedPhotos[activePhotoIndex] || displayedPhotos[0];

  const currentLandmarkList = selectedCity === 'brasilia' ? BRASILIA_LANDMARKS : RECIFE_LANDMARKS;

  // Handle Photo File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit new photo to Cloud Firestore
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadImagePreview) {
      alert('Por favor, selecione uma foto do seu celular ou computador.');
      return;
    }

    setIsSubmittingPhoto(true);
    setAdminFeedback('');

    const targetList = uploadCity === 'brasilia' ? BRASILIA_LANDMARKS : RECIFE_LANDMARKS;
    const landmarkObj = targetList.find(l => l.id === uploadLandmark) || targetList[1];

    const newPhoto: CityStreetPhoto = {
      id: `${uploadCity}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      city: uploadCity,
      cityName: uploadCity === 'brasilia' ? 'Brasília (DF)' : 'Recife (PE)',
      landmarkId: landmarkObj.id,
      landmarkName: landmarkObj.name,
      title: uploadTitle.trim() || `Registro de ${landmarkObj.name}`,
      date: uploadDate,
      dateFormatted: new Date(uploadDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      monthLabel: new Date(uploadDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      periodOfDay: uploadPeriod,
      weather: uploadWeather,
      photographer: uploadPhotographer.trim() || 'Admin INFINITY',
      imageUrl: uploadImagePreview,
      caption: uploadCaption.trim() || `Fotografia real de ${landmarkObj.name}.`,
      coordinates: uploadCity === 'brasilia' ? '-15.7998, -47.8645' : '-8.0631, -34.8711',
      tags: [uploadCity === 'brasilia' ? 'Brasília' : 'Recife', landmarkObj.name]
    };

    try {
      await saveCityPhotoToFirestore(newPhoto);
      setPhotos(prev => [newPhoto, ...prev.filter(p => p.id !== newPhoto.id)]);
      setSelectedCity(uploadCity);
      setSelectedLandmark('all');
      setActivePhotoIndex(0);
      setAdminFeedback('Foto salva com sucesso no Banco Firestore!');
      setUploadImagePreview(null);
      setUploadTitle('');
      setUploadCaption('');
      setTimeout(() => {
        setAdminModeOpen(false);
        setAdminFeedback('');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setAdminFeedback('Erro ao salvar no Firestore: ' + err.message);
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar esta foto do banco de dados?')) return;
    try {
      await deleteCityPhotoFromFirestore(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
      setActivePhotoIndex(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      
      {/* Zoom Modal */}
      {zoomedPhoto && (
        <div 
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <img 
            src={zoomedPhoto.imageUrl} 
            alt={zoomedPhoto.title}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/20"
          />
          <p className="text-sm font-bold text-white mt-3">{zoomedPhoto.title} • {zoomedPhoto.cityName}</p>
        </div>
      )}

      <div className="relative bg-[#0d121f] text-white rounded-3xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden border border-slate-800">
        
        {/* Top Header Bar with City Selector & Admin Pencil */}
        <div className="bg-[#131a2e] border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C4170C] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 font-black">
              <Compass className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>Passeio Fotográfico Real</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Salvo no Firestore
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Fotos reais das ruas, praças e monumentos de Brasília e Recife que você pode atualizar.
              </p>
            </div>
          </div>

          {/* City Switcher Tabs: Brasília vs Recife */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={() => {
                setSelectedCity('brasilia');
                setSelectedLandmark('all');
                setActivePhotoIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                selectedCity === 'brasilia' 
                  ? 'bg-[#C4170C] text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Brasília (DF)</span>
            </button>

            <button
              onClick={() => {
                setSelectedCity('recife');
                setSelectedLandmark('all');
                setActivePhotoIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                selectedCity === 'recife' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Recife (PE)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Admin Upload Trigger (Pencil Icon) */}
            {isAdmin && (
              <button
                onClick={() => setAdminModeOpen(!adminModeOpen)}
                className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow cursor-pointer"
                title="Administrador: Adicionar ou Mudar Fotos pelo Celular"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Mudar Fotos</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Landmarks Sub-Bar */}
        <div className="bg-[#0b101d] px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-500" />
            Pontos:
          </span>
          {currentLandmarkList.map(lm => (
            <button
              key={lm.id}
              onClick={() => {
                setSelectedLandmark(lm.id);
                setActivePhotoIndex(0);
              }}
              className={`text-xs whitespace-nowrap px-3 py-1 rounded-full border transition cursor-pointer font-medium ${
                selectedLandmark === lm.id
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 font-bold'
                  : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {lm.name}
            </button>
          ))}
        </div>

        {/* ADMIN UPLOAD FORM OVERLAY */}
        {adminModeOpen && isAdmin && (
          <div className="bg-amber-950/40 border-b border-amber-500/40 p-4 shrink-0 transition animate-fadeIn">
            <form onSubmit={handleSavePhoto} className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                  <Pencil className="w-4 h-4" />
                  <span>Painel do Administrador: Enviar Foto do Celular / Computador para o Banco Real</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminModeOpen(false)}
                  className="text-amber-400 hover:text-white text-xs underline cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              {adminFeedback && (
                <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>{adminFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* File input (Camera or Storage) */}
                <div className="sm:col-span-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-500/60 hover:border-amber-400 bg-black/40 rounded-2xl p-3 text-center cursor-pointer flex flex-col items-center justify-center min-h-[90px] transition"
                  >
                    {uploadImagePreview ? (
                      <div className="relative w-full h-20 rounded-xl overflow-hidden">
                        <img src={uploadImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-amber-300 px-1.5 py-0.5 rounded font-bold">
                          Trocar foto
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-amber-400 mb-1" />
                        <span className="text-xs font-bold text-amber-300">Toque para escolher foto</span>
                        <span className="text-[10px] text-gray-400">Armazenamento do Celular</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta details */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Cidade de Destino</label>
                    <select
                      value={uploadCity}
                      onChange={(e) => {
                        const c = e.target.value as 'brasilia' | 'recife';
                        setUploadCity(c);
                        setUploadLandmark(c === 'brasilia' ? 'congresso' : 'marco_zero');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2 text-xs font-bold"
                    >
                      <option value="brasilia">Brasília (DF)</option>
                      <option value="recife">Recife (PE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Ponto / Monumento</label>
                    <select
                      value={uploadLandmark}
                      onChange={(e) => setUploadLandmark(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2 text-xs font-semibold"
                    >
                      {(uploadCity === 'brasilia' ? BRASILIA_LANDMARKS : RECIFE_LANDMARKS).filter(l => l.id !== 'all').map(lm => (
                        <option key={lm.id} value={lm.id}>{lm.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Título da Foto</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Ex: Pôr do Sol Dourado sobre a Esplanada / Marco Zero"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Legenda Explicativa</label>
                    <input
                      type="text"
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="Descreva a rua, avenida, contexto histórico ou detalhes..."
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingPhoto || !uploadImagePreview}
                  className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black uppercase text-xs px-5 py-2 rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSubmittingPhoto ? 'Salvando no Banco...' : 'Salvar Foto no Firestore Real'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Visualizer Stage */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {currentPhoto ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={currentPhoto.imageUrl}
                  alt={currentPhoto.title}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_PHOTO;
                  }}
                  className="w-full h-full object-contain select-none"
                />

                {/* Overlay Badge - Day, Period, Weather */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="bg-black/80 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-400/30">
                    <Calendar className="w-3.5 h-3.5" />
                    {currentPhoto.dateFormatted}
                  </span>
                  <span className="bg-black/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {currentPhoto.periodOfDay}
                  </span>
                  <span className="bg-black/80 backdrop-blur-md text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-emerald-500/30">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    {currentPhoto.weather}
                  </span>
                </div>

                {/* Bottom Information Card */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/85 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                      {currentPhoto.cityName} • {currentPhoto.landmarkName}
                    </span>
                    <button
                      onClick={() => setZoomedPhoto(currentPhoto)}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer bg-white/10 px-2.5 py-1 rounded-lg"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Ampliar</span>
                    </button>
                  </div>

                  <h2 className="text-base sm:text-xl font-black text-white">
                    {currentPhoto.title}
                  </h2>
                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                    {currentPhoto.caption}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-gray-400">
                    <span>Créditos: <strong>{currentPhoto.photographer}</strong></span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeletePhoto(currentPhoto.id)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Apagar Foto</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Left/Right Carousel Controls */}
                {displayedPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() => setActivePhotoIndex(prev => (prev === 0 ? displayedPhotos.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/95 text-white p-2.5 rounded-full border border-white/20 transition cursor-pointer"
                      title="Foto anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActivePhotoIndex(prev => (prev === displayedPhotos.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/95 text-white p-2.5 rounded-full border border-white/20 transition cursor-pointer"
                      title="Próxima foto"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-gray-400">
                <Camera className="w-12 h-12 mx-auto text-gray-600 mb-2" />
                <p className="font-bold">Nenhuma foto encontrada para este ponto.</p>
                {isAdmin && (
                  <button
                    onClick={() => setAdminModeOpen(true)}
                    className="mt-3 bg-amber-400 text-black px-4 py-1.5 rounded-full text-xs font-bold"
                  >
                    Adicionar Foto com o Lápis
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Timeline Chronology */}
          <div className="w-full md:w-80 lg:w-96 bg-[#101424] border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Galeria {selectedCity === 'brasilia' ? 'Brasília' : 'Recife'}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {displayedPhotos.length} fotos
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {displayedPhotos.map((photo, idx) => {
                const isActive = idx === activePhotoIndex;
                return (
                  <div
                    key={photo.id}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center space-x-3 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-16 h-14 rounded-xl overflow-hidden shrink-0 bg-black">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        onError={(e) => { e.currentTarget.src = FALLBACK_PHOTO; }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-amber-400 mb-0.5 font-bold">
                        <span>{photo.dateFormatted}</span>
                        <span className="text-slate-400 font-normal">{photo.periodOfDay}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {photo.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {photo.landmarkName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
