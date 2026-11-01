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
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Sun, 
  Moon, 
  Compass, 
  Navigation, 
  Filter,
  Plus,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { BrasiliaPhoto } from '../types/news';

interface BrasiliaStreetTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

const BRASILIA_LANDMARKS = [
  { id: 'all', name: 'Todos os Pontos da Capital' },
  { id: 'congresso', name: 'Congresso Nacional & Esplanada' },
  { id: 'catedral', name: 'Catedral Metropolitana' },
  { id: 'ponte_jk', name: 'Ponte Juscelino Kubitschek (Ponte JK)' },
  { id: 'praca_tres_poderes', name: 'Praça dos Três Poderes & Planalto' },
  { id: 'palacio_alvorada', name: 'Palácio da Alvorada' },
  { id: 'torre_tv', name: 'Torre de TV & Eixo Monumental' },
  { id: 'memorial_jk', name: 'Memorial JK' },
  { id: 'pontao_lago_sul', name: 'Pontão do Lago Sul & Orla' },
  { id: 'museu_nacional', name: 'Museu Nacional da República' },
];

export const BrasiliaStreetTourModal: React.FC<BrasiliaStreetTourModalProps> = ({
  isOpen,
  onClose,
  isAdmin
}) => {
  const [photos, setPhotos] = useState<BrasiliaPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLandmark, setSelectedLandmark] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [shareToast, setShareToast] = useState('');

  // Admin Upload Modal / Mode
  const [adminModeOpen, setAdminModeOpen] = useState(false);
  const [uploadLandmark, setUploadLandmark] = useState('congresso');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadPeriod, setUploadPeriod] = useState('Manhã');
  const [uploadWeather, setUploadWeather] = useState('29°C • Céu Aberto');
  const [uploadPhotographer, setUploadPhotographer] = useState('Admin INFINITY');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadImagePreview, setUploadImagePreview] = useState<string | null>(null);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch photos from server
  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/brasilia-photos');
      const data = await res.json();
      if (data.success && Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
    } catch (err) {
      console.warn('Error fetching Brasilia photos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered photos
  const filteredPhotos = photos.filter(p => {
    const matchLandmark = selectedLandmark === 'all' || p.landmarkId === selectedLandmark;
    const matchMonth = selectedMonth === 'all' || (p.monthLabel && p.monthLabel.toLowerCase().includes(selectedMonth.toLowerCase()));
    return matchLandmark && matchMonth;
  });

  const currentPhoto = filteredPhotos[activePhotoIndex] || filteredPhotos[0] || photos[0];

  // Distinct months available in photos
  const availableMonths = Array.from(new Set(photos.map(p => p.monthLabel).filter(Boolean)));

  // Handle image upload from mobile storage / PC
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  // Submit new photo to server
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadImagePreview) {
      setAdminFeedback('Por favor, selecione uma foto do armazenamento do seu aparelho.');
      return;
    }

    setIsSubmittingPhoto(true);
    setAdminFeedback('');

    const landmarkObj = BRASILIA_LANDMARKS.find(l => l.id === uploadLandmark) || BRASILIA_LANDMARKS[1];
    const dateObj = new Date(uploadDate + 'T12:00:00');
    const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    const newPhotoPayload = {
      landmarkId: uploadLandmark,
      landmarkName: landmarkObj.name,
      title: uploadTitle.trim() || `Vista de ${landmarkObj.name}`,
      date: uploadDate,
      dateFormatted: formattedDate,
      monthLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      periodOfDay: uploadPeriod,
      weather: uploadWeather,
      photographer: uploadPhotographer.trim() || 'Admin INFINITY',
      imageUrl: uploadImagePreview,
      caption: uploadCaption.trim() || `Registro fotográfico de ${landmarkObj.name} em Brasília.`,
      coordinates: '-15.7998, -47.8645',
      tags: ['Brasília', 'DF', landmarkObj.name, uploadPeriod]
    };

    try {
      const res = await fetch('/api/brasilia-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhotoPayload)
      });
      const data = await res.json();
      if (data.success && data.photo) {
        setPhotos(prev => [data.photo, ...prev]);
        setAdminFeedback('Foto adicionada com sucesso ao passeio de Brasília!');
        setUploadImagePreview(null);
        setUploadTitle('');
        setUploadCaption('');
        setTimeout(() => {
          setAdminModeOpen(false);
          setAdminFeedback('');
          setActivePhotoIndex(0);
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setAdminFeedback('Erro ao enviar foto: ' + err.message);
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar esta foto do acervo de Brasília?')) return;
    try {
      await fetch(`/api/brasilia-photos/${id}`, { method: 'DELETE' });
      setPhotos(prev => prev.filter(p => p.id !== id));
      setActivePhotoIndex(0);
    } catch (e) {
      console.error(e);
    }
  };

  // Social sharing for Brasília tour
  const handleShareWhatsApp = (photo: BrasiliaPhoto) => {
    const text = `Confira esta foto de Brasília no INFINITY: ${photo.title} (${photo.landmarkName}) - ${photo.dateFormatted}`;
    const url = window.location.href;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const handleShareInstagram = (photo: BrasiliaPhoto) => {
    const text = `Brasília em Foco no INFINITY:\n📍 ${photo.landmarkName}\n📸 ${photo.title}\n🗓️ ${photo.dateFormatted} • ${photo.periodOfDay}\n${photo.caption}\n\n#Brasilia #INFINITY #Arquitetura #Brasil`;
    navigator.clipboard.writeText(text);
    setShareToast('Texto formatado copiado! Abra o Instagram e cole nos seus Stories ou publicação.');
    setTimeout(() => setShareToast(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-[#0f1115] text-white rounded-2xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden border border-gray-800">
        
        {/* Top Header Bar with Landmarks, Timeline & Admin Pencil (`lápis lá em cima`) */}
        <div className="bg-[#181a20] border-b border-gray-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#C4170C] flex items-center justify-center text-white shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Passear pelas Ruas de Brasília
                </h2>
                <span className="bg-red-950 text-red-400 border border-red-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Explore a capital federal dia a dia e mês a mês em alta resolução fotográfica.
              </p>
            </div>
          </div>

          {/* Right Action Buttons: Admin Pencil & Close */}
          <div className="flex items-center space-x-2">
            
            {/* ADMIN PENCIL BUTTON AT TOP (`LÁPIS LÁ EM CIMA`) */}
            {isAdmin ? (
              <button
                onClick={() => setAdminModeOpen(!adminModeOpen)}
                className="bg-amber-400 hover:bg-amber-300 text-black px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg transition cursor-pointer"
                title="Mudar fotos enviando pelo armazenamento do celular"
              >
                <Pencil className="w-4 h-4 text-black" />
                <span>{adminModeOpen ? 'Fechar Editor' : 'Gerenciar Fotos (Lápis)'}</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center space-x-1 text-[11px] text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Distrito Federal • Brasil</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar: Landmarks & Month by Month */}
        <div className="bg-[#12141a] px-4 py-2 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          
          {/* Landmark Selector Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
            {BRASILIA_LANDMARKS.map(lm => (
              <button
                key={lm.id}
                onClick={() => {
                  setSelectedLandmark(lm.id);
                  setActivePhotoIndex(0);
                }}
                className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedLandmark === lm.id
                    ? 'bg-[#C4170C] text-white shadow-sm'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {lm.name}
              </button>
            ))}
          </div>

          {/* Month by Month Filter ("Mês após Mês") */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Mês a Mês:
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setActivePhotoIndex(0);
              }}
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-red-500"
            >
              <option value="all">Todos os Meses</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ADMIN UPLOAD FORM OVERLAY (WHEN CLICKED ON PENCIL AT TOP) */}
        {adminModeOpen && isAdmin && (
          <div className="bg-amber-950/40 border-b border-amber-600/40 p-4 shrink-0 transition animate-fadeIn">
            <form onSubmit={handleSavePhoto} className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-black text-sm">
                  <Pencil className="w-4 h-4" />
                  <span>Painel do Administrador: Enviar Nova Foto de Brasília do Celular / Computador</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminModeOpen(false)}
                  className="text-amber-400 hover:text-white text-xs underline"
                >
                  Cancelar
                </button>
              </div>

              {adminFeedback && (
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{adminFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* File input (Camera or Storage) */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                    Foto do Armazenamento do Celular
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-500/60 hover:border-amber-400 bg-black/40 rounded-xl p-3 text-center cursor-pointer flex flex-col items-center justify-center min-h-[90px] transition"
                  >
                    {uploadImagePreview ? (
                      <div className="relative w-full h-20 rounded overflow-hidden">
                        <img src={uploadImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-amber-300 px-1.5 py-0.5 rounded">
                          Alterar foto
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-amber-400 mb-1" />
                        <span className="text-xs font-bold text-amber-300">Toque para escolher foto</span>
                        <span className="text-[10px] text-gray-400">Galeria ou Câmera do Celular</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta details */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Ponto / Monumento</label>
                    <select
                      value={uploadLandmark}
                      onChange={(e) => setUploadLandmark(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-amber-400"
                    >
                      {BRASILIA_LANDMARKS.filter(l => l.id !== 'all').map(lm => (
                        <option key={lm.id} value={lm.id}>{lm.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Título da Foto</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Ex: Cúpula do Congresso ao entardecer"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Data da Foto</label>
                    <input
                      type="date"
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Período do Dia & Clima</label>
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        value={uploadPeriod}
                        onChange={(e) => setUploadPeriod(e.target.value)}
                        className="bg-gray-900 border border-gray-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Pôr do Sol">Pôr do Sol</option>
                        <option value="Noite">Noite</option>
                      </select>
                      <input
                        type="text"
                        value={uploadWeather}
                        onChange={(e) => setUploadWeather(e.target.value)}
                        placeholder="28°C Céu Azul"
                        className="bg-gray-900 border border-gray-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Legenda Explicativa da Foto</label>
                    <input
                      type="text"
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                      placeholder="Descreva o ponto de vista, acontecimento ou detalhes arquitetônicos..."
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingPhoto || !uploadImagePreview}
                  className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black uppercase text-xs px-5 py-2 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSubmittingPhoto ? 'Publicando...' : 'Publicar Foto no Passeio'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Share Feedback Toast */}
        {shareToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center shrink-0 animate-fadeIn flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>{shareToast}</span>
          </div>
        )}

        {/* Main Content Area: Large Stage & Photo Timeline */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Visualizer Stage */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {currentPhoto ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={currentPhoto.imageUrl}
                  alt={currentPhoto.title}
                  className="w-full h-full object-contain select-none"
                />

                {/* Overlay Badge - Day, Period, Weather */}
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="bg-black/75 backdrop-blur-md text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-400/30">
                    <Calendar className="w-3.5 h-3.5" />
                    {currentPhoto.dateFormatted}
                  </span>
                  <span className="bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {currentPhoto.periodOfDay}
                  </span>
                  <span className="bg-black/75 backdrop-blur-md text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-emerald-500/30">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    {currentPhoto.weather}
                  </span>
                </div>

                {/* Landmark Name & Photo Caption Footer Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 sm:p-6 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="bg-[#C4170C] text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded">
                        {currentPhoto.landmarkName}
                      </span>
                      <span className="text-gray-400 text-xs hidden sm:inline">
                        Foto {activePhotoIndex + 1} de {filteredPhotos.length}
                      </span>
                    </div>

                    {/* Action buttons: Share WhatsApp / Instagram / Delete if Admin */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShareWhatsApp(currentPhoto)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title="Compartilhar no WhatsApp"
                      >
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleShareInstagram(currentPhoto)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title="Compartilhar no Instagram"
                      >
                        <span>Instagram</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeletePhoto(currentPhoto.id)}
                          className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 p-1 rounded-lg text-xs transition"
                          title="Excluir foto do acervo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-1">
                    {currentPhoto.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 max-w-3xl">
                    {currentPhoto.caption}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Fotógrafo: <span className="text-gray-200 font-medium">{currentPhoto.photographer}</span> • Coordenadas: <span className="text-gray-300 font-mono">{currentPhoto.coordinates}</span>
                  </p>
                </div>

                {/* Left & Right navigation arrows */}
                {filteredPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() => setActivePhotoIndex(prev => (prev === 0 ? filteredPhotos.length - 1 : prev - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full backdrop-blur-sm border border-white/20 transition cursor-pointer"
                      title="Foto anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActivePhotoIndex(prev => (prev === filteredPhotos.length - 1 ? 0 : prev + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full backdrop-blur-sm border border-white/20 transition cursor-pointer"
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
                <p className="font-bold">Nenhuma foto encontrada para este filtro.</p>
                {isAdmin && (
                  <button
                    onClick={() => setAdminModeOpen(true)}
                    className="mt-3 bg-amber-400 text-black px-4 py-1.5 rounded-full text-xs font-bold"
                  >
                    Adicionar Primeira Foto com o Lápis
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Timeline Chronology Day-by-Day ("Dia após Dia, Mês após Mês") */}
          <div className="w-full md:w-80 lg:w-96 bg-[#14161c] border-t md:border-t-0 md:border-l border-gray-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Linha do Tempo (Dia a Dia)
              </span>
              <span className="text-[11px] text-gray-400 font-semibold">
                {filteredPhotos.length} registros
              </span>
            </div>

            {/* Scrollable list of chronological photos */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredPhotos.map((photo, idx) => {
                const isActive = idx === activePhotoIndex;
                return (
                  <div
                    key={photo.id}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center space-x-3 ${
                      isActive
                        ? 'bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500/50'
                        : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-black">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-amber-400 mb-0.5 font-bold">
                        <span>{photo.dateFormatted}</span>
                        <span className="text-gray-400 font-normal">{photo.periodOfDay}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {photo.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate">
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
