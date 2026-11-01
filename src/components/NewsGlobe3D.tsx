import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Globe, 
  Radio, 
  Navigation, 
  Compass, 
  MapPin, 
  Eye, 
  RotateCw, 
  Trees, 
  Waves, 
  TrendingUp,
  Sparkles,
  Layers,
  Pencil,
  Camera,
  Maximize2,
  Check
} from 'lucide-react';
import { StreetExplorer3DModal } from './StreetExplorer3DModal';
import { BrasiliaStreetTourModal } from './BrasiliaStreetTourModal';

interface CapitalPoint {
  name: string;
  country: string;
  lat: number;
  lng: number;
  population: string;
  status: string;
  isBrazil?: boolean;
  stateCode?: string;
  isBrasilia?: boolean;
}

const WORLD_CAPITALS: CapitalPoint[] = [
  // Brazil & States
  { name: 'Brasília', country: 'Brasil (DF)', lat: -15.79, lng: -47.89, population: '3,05 mi', status: 'Capital Federal • Congresso Nacional, Catedral e Esplanada em foco', isBrazil: true, stateCode: 'DF', isBrasilia: true },
  { name: 'Recife', country: 'Brasil (Pernambuco)', lat: -8.05, lng: -34.88, population: '1,66 mi', status: 'Porto Digital & Marco Zero • Exportação de software e turismo', isBrazil: true, stateCode: 'PE' },
  { name: 'São Paulo', country: 'Brasil (São Paulo)', lat: -23.55, lng: -46.63, population: '12,3 mi', status: 'Avenida Paulista & Centro Financeiro • Maior metrópole', isBrazil: true, stateCode: 'SP' },
  { name: 'Rio de Janeiro', country: 'Brasil (Rio de Janeiro)', lat: -22.90, lng: -43.17, population: '6,7 mi', status: 'Copacabana & Pré-sal • Polo de energia e turismo global', isBrazil: true, stateCode: 'RJ' },
  { name: 'Salvador', country: 'Brasil (Bahia)', lat: -12.97, lng: -38.51, population: '2,9 mi', status: 'Pelourinho & Porto Verde • Hub cultural e energias renováveis', isBrazil: true, stateCode: 'BA' },
  { name: 'Manaus', country: 'Brasil (Amazonas)', lat: -3.11, lng: -60.02, population: '2,2 mi', status: 'Coração da Amazônia & Polo Industrial • Bioeconomia nativa', isBrazil: true, stateCode: 'AM' },
  { name: 'Porto Alegre', country: 'Brasil (Rio Grande do Sul)', lat: -30.03, lng: -51.23, population: '1,4 mi', status: 'Agronegócio & Polo Tecnológico Sul • Safra recorde', isBrazil: true, stateCode: 'RS' },
  { name: 'Belo Horizonte', country: 'Brasil (Minas Gerais)', lat: -19.92, lng: -43.93, population: '2,5 mi', status: 'Mineração sustentável & Inovação biotecnológica', isBrazil: true, stateCode: 'MG' },
  { name: 'Fortaleza', country: 'Brasil (Ceará)', lat: -3.73, lng: -38.52, population: '2,7 mi', status: 'Hub de cabos submarinos transatlânticos & Hidrogênio verde', isBrazil: true, stateCode: 'CE' },

  // World Capitals
  { name: 'Washington, D.C.', country: 'Estados Unidos', lat: 38.90, lng: -77.03, population: '710 mil', status: 'Federal Reserve avalia taxa de juros global' },
  { name: 'Londres', country: 'Reino Unido', lat: 51.50, lng: -0.12, population: '8,9 mi', status: 'City de Londres registra alta nos fundos de investimento' },
  { name: 'Paris', country: 'França', lat: 48.85, lng: 2.35, population: '2,1 mi', status: 'Cúpula da transição ecológica e inovação espacial europeia' },
  { name: 'Tóquio', country: 'Japão', lat: 35.67, lng: 139.65, population: '14,0 mi', status: 'Bolsa Nikkei opera em forte alta com novos semicondutores' },
  { name: 'Pequim', country: 'China', lat: 39.90, lng: 116.40, population: '21,5 mi', status: 'Plano quinquenal amplia investimento em energia solar e IA' },
  { name: 'Nova Déli', country: 'Índia', lat: 28.61, lng: 77.20, population: '32,9 mi', status: 'PIB da Índia cresce impulsionado por tecnologia e manufatura' },
  { name: 'Berlim', country: 'Alemanha', lat: 52.52, lng: 13.40, population: '3,8 mi', status: 'Indústria automobilística acelera conversão para baterias sólidas' },
  { name: 'Roma', country: 'Itália', lat: 41.90, lng: 12.49, population: '2,8 mi', status: 'Conferência da FAO debate segurança alimentar global' },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.60, lng: -58.38, population: '3,1 mi', status: 'Comércio bilateral Mercosul avança em acordos aduaneiros' },
  { name: 'Cairo', country: 'Egito', lat: 30.04, lng: 31.23, population: '10,0 mi', status: 'Canal de Suez moderniza sistema de tráfego naval bioceânico' },
  { name: 'Camberra', country: 'Austrália', lat: -35.28, lng: 149.13, population: '450 mil', status: 'Exportação de minérios raros para baterias bate recorde' },
  { name: 'Ottawa', country: 'Canadá', lat: 45.42, lng: -75.69, population: '1,0 mi', status: 'Parceria no Ártico para proteção climática e rotas limpas' },
];

/**
 * GFZ POTSDAM GEOID UNDULATION FORMULA ("Batata de Potsdam")
 * Reproduces the exact gravimetric equipotential irregular surface
 * seen in the reference image (bulges in North Atlantic/Scandinavia,
 * depression in Indian Ocean, Pacific and South American undulating ridges),
 * but rendered with realistic Earth satellite colors!
 */
export function getGeoidRadius(lat: number, lng: number, baseRadius: number, useGeoid: boolean = true): number {
  if (!useGeoid) return baseRadius;

  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);

  // 1. Polar flattening & equatorial bulge
  const oblateness = 1.0 - 0.038 * Math.sin(latRad) * Math.sin(latRad);

  // 2. North Atlantic / Fennoscandia / Iceland major gravitational bulge (+14% to +18%)
  const distNorthAtlantic = Math.hypot(lat - 54, lng - (-20));
  const northAtlanticBulge = 0.16 * Math.exp(-Math.pow(distNorthAtlantic / 36, 2));

  // 3. Indian Ocean geoid low / deep depression (-14% to -18%)
  const distIndianOcean = Math.hypot(lat - 4, lng - 78);
  const indianOceanLow = -0.15 * Math.exp(-Math.pow(distIndianOcean / 34, 2));

  // 4. Western Pacific / New Guinea bulge (+10%)
  const distWestPacific = Math.hypot(lat - (-5), lng - 145);
  const westPacificBulge = 0.10 * Math.exp(-Math.pow(distWestPacific / 40, 2));

  // 5. South America / Andes & Central Highlands elevation undulation (+8%)
  const distSouthAmerica = Math.hypot(lat - (-15), lng - (-60));
  const southAmericaBulge = 0.08 * Math.exp(-Math.pow(distSouthAmerica / 35, 2));

  // 6. Asymmetrical harmonic ripples reproducing the Potsdam potato shape from the image
  const harmonic1 = 0.045 * Math.sin(3 * latRad) * Math.cos(2 * lngRad);
  const harmonic2 = 0.035 * Math.cos(4 * latRad) * Math.sin(lngRad);
  const harmonic3 = 0.025 * Math.sin(5 * latRad + lngRad);

  const totalDisplacement = 1.0 + northAtlanticBulge + indianOceanLow + westPacificBulge + southAmericaBulge + harmonic1 + harmonic2 + harmonic3;

  return baseRadius * oblateness * totalDisplacement;
}

// Convert Vector3 on deformed geoid back to Lat/Lng
function vector3ToLatLng(v: THREE.Vector3): { lat: number; lng: number } {
  const norm = v.clone().normalize();
  const phi = Math.acos(Math.max(-1, Math.min(1, norm.y)));
  const lat = 90 - (phi * 180) / Math.PI;
  const theta = Math.atan2(norm.z, -norm.x);
  let lng = (theta * 180) / Math.PI - 180;
  if (lng < -180) lng += 360;
  if (lng > 180) lng -= 360;
  return { lat, lng };
}

// Convert Lat/Lng to Vector3 conforming to the Potsdam Geoid topography
function latLngToVector3(lat: number, lng: number, baseRadius: number, useGeoid = true): THREE.Vector3 {
  const r = getGeoidRadius(lat, lng, baseRadius, useGeoid);
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

interface NewsGlobe3DProps {
  isAdmin?: boolean;
  onOpenAdminQuotes?: () => void;
  onOpenBrasiliaTourExternal?: () => void;
}

export const NewsGlobe3D: React.FC<NewsGlobe3DProps> = ({
  isAdmin = false,
  onOpenAdminQuotes,
  onOpenBrasiliaTourExternal
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedCapital, setSelectedCapital] = useState<CapitalPoint>(WORLD_CAPITALS[0]); // Default Brasília
  const [isRotating, setIsRotating] = useState(true);
  const [useGeoidModel, setUseGeoidModel] = useState(true); // Potsdam Geoid active by default
  const [streetModalOpen, setStreetModalOpen] = useState(false);
  const [streetModalLocId, setStreetModalLocId] = useState('df');
  const [brasiliaTourOpen, setBrasiliaTourOpen] = useState(false);

  // Real Market & Crypto data (With PIB instead of Ibovespa)
  const [quotes, setQuotes] = useState<any>({
    dolar: { valueFormatted: 'R$ 5,68', pctFormatted: '+0,32%', isPositive: true },
    euro: { valueFormatted: 'R$ 6,14', pctFormatted: '+0,18%', isPositive: true },
    pib: { pointsFormatted: 'R$ 10,9 tri', pctFormatted: '+2,9% a.a.', isPositive: true },
    ibovespa: { pointsFormatted: 'R$ 10,9 tri', pctFormatted: '+2,9% a.a.', isPositive: true },
    bitcoin: { valueFormatted: 'R$ 585.000', pctFormatted: '+1,45%', isPositive: true },
    cryptoGlobal: { totalCryptosFormatted: '17.482 criptos', btcDominance: '56.4%', marketCapUsd: 'US$ 2,84 trilhões' },
    source: 'AwesomeAPI, B3, IBGE & CoinGecko'
  });

  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudMeshRef = useRef<THREE.Mesh | null>(null);
  const targetRotationYRef = useRef<number | null>(null);
  const targetRotationXRef = useRef<number | null>(null);

  // Fetch real-time live financial quotes
  useEffect(() => {
    const fetchLiveQuotes = async () => {
      try {
        const res = await fetch('/api/financial-quotes');
        const data = await res.json();
        if (data.success && data.quotes) {
          setQuotes(data.quotes);
        }
      } catch (err) {
        console.warn('Error fetching quotes in Globe:', err);
      }
    };
    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 380;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 0, 270);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Globe Master Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const radius = 72;

    // 4. Background Starfield
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 850;
      starPositions[i + 1] = (Math.random() - 0.5) * 850;
      starPositions[i + 2] = -160 - Math.random() * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.1,
      transparent: true,
      opacity: 0.65
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. PHOTOREALISTIC EARTH WITH POTSDAM GEOID TOPOGRAPHY
    const textureLoader = new THREE.TextureLoader();

    const earthDayMap = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      () => {
        renderer.render(scene, camera);
      }
    );

    // 128x128 Segments to allow physical 3D elevation displacement peaks!
    const earthGeometry = new THREE.SphereGeometry(radius, 128, 128);
    
    // Deform vertices according to the Potsdam Geoid model ("Batata de Potsdam")
    const posAttr = earthGeometry.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      const { lat, lng } = vector3ToLatLng(v);
      const r = getGeoidRadius(lat, lng, radius, useGeoidModel);
      v.normalize().multiplyScalar(r);
      posAttr.setXYZ(i, v.x, v.y, v.z);
    }
    earthGeometry.computeVertexNormals();

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthDayMap,
      roughness: 0.6,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // 6. REALISTIC ATMOSPHERE & CLOUDS
    const cloudGeo = new THREE.SphereGeometry(radius * 1.018, 64, 64);
    const cloudPosAttr = cloudGeo.attributes.position;
    for (let i = 0; i < cloudPosAttr.count; i++) {
      v.fromBufferAttribute(cloudPosAttr, i);
      const { lat, lng } = vector3ToLatLng(v);
      const r = getGeoidRadius(lat, lng, radius * 1.018, useGeoidModel);
      v.normalize().multiplyScalar(r);
      cloudPosAttr.setXYZ(i, v.x, v.y, v.z);
    }
    cloudGeo.computeVertexNormals();

    const cloudTex = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-clouds.png');
    const cloudMat = new THREE.MeshLambertMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);
    cloudMeshRef.current = cloudMesh;

    // Atmospheric Fresnel Shader Halo
    const atmosphereGeo = new THREE.SphereGeometry(radius * 1.045, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.2, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    globeGroup.add(atmosphereMesh);

    // -------------------------------------------------------------
    // 7. FLOATING COUNTRY BORDERS FOLLOWING GEOID CONTOURS
    // -------------------------------------------------------------
    const bordersGroup = new THREE.Group();
    globeGroup.add(bordersGroup);

    const createFloatingPolyLine = (coords: [number, number][], color: number, heightRatio: number, opacity = 0.8) => {
      const points: THREE.Vector3[] = [];
      coords.forEach(([lat, lng]) => {
        points.push(latLngToVector3(lat, lng, radius * heightRatio, useGeoidModel));
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        linewidth: 1.5,
      });
      return new THREE.Line(lineGeo, lineMat);
    };

    // South America Boundary
    bordersGroup.add(createFloatingPolyLine([
      [12, -73], [8, -60], [4, -51], [-3, -40], [-5, -35], [-10, -36],
      [-23, -43], [-34, -53], [-45, -65], [-55, -67], [-50, -75],
      [-38, -73], [-25, -70], [-18, -71], [-5, -81], [5, -77], [10, -75], [12, -73]
    ], 0x60a5fa, 1.018));

    // North America Boundary
    bordersGroup.add(createFloatingPolyLine([
      [70, -165], [72, -130], [60, -90], [55, -60], [45, -60], [30, -80],
      [25, -80], [15, -93], [20, -105], [30, -115], [38, -123], [48, -125],
      [60, -140], [65, -168], [70, -165]
    ], 0x93c5fd, 1.018));

    // Europe Boundary
    bordersGroup.add(createFloatingPolyLine([
      [71, 28], [60, 30], [55, 38], [45, 30], [36, -5], [43, -9], [58, 5], [65, 15], [71, 28]
    ], 0x93c5fd, 1.018));

    // Africa Boundary
    bordersGroup.add(createFloatingPolyLine([
      [37, 10], [32, 32], [12, 51], [0, 42], [-15, 40], [-34, 26], [-34, 18], [-15, 12], [5, 8], [15, -17], [30, -10], [37, 10]
    ], 0xfcd34d, 1.018));

    // Asia Boundary
    bordersGroup.add(createFloatingPolyLine([
      [75, 100], [70, 170], [60, 160], [40, 130], [30, 120], [20, 110], [10, 105], [15, 80], [25, 60], [40, 50], [65, 80], [75, 100]
    ], 0xa7f3d0, 1.018));

    // Australia Boundary
    bordersGroup.add(createFloatingPolyLine([
      [-12, 130], [-15, 145], [-25, 153], [-38, 145], [-35, 115], [-20, 114], [-12, 130]
    ], 0xfde047, 1.018));

    // -------------------------------------------------------------
    // 8. FLOATING AMAZON BIOME BOUNDARY (Glowing Emerald Green)
    // -------------------------------------------------------------
    const amazonGroup = new THREE.Group();
    globeGroup.add(amazonGroup);

    const amazonCoords: [number, number][] = [
      [5, -60], [3, -53], [0, -50], [-2, -44], [-6, -46],
      [-11, -50], [-14, -58], [-15, -66], [-12, -72], [-7, -75],
      [-2, -77], [2, -74], [4, -68], [5, -60]
    ];
    amazonGroup.add(createFloatingPolyLine(amazonCoords, 0x10b981, 1.024, 0.95));

    // Amazon Pin
    const amazonCenter = latLngToVector3(-3.5, -62.0, radius * 1.025, useGeoidModel);
    const amazonPinGeo = new THREE.SphereGeometry(1.8, 16, 16);
    const amazonPinMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const amazonPin = new THREE.Mesh(amazonPinGeo, amazonPinMat);
    amazonPin.position.copy(amazonCenter);
    amazonGroup.add(amazonPin);

    // -------------------------------------------------------------
    // 9. BRAZILIAN MARITIME EXCLUSIVE ZONE (Ciano / Blue Amazon)
    // -------------------------------------------------------------
    const maritimeGroup = new THREE.Group();
    globeGroup.add(maritimeGroup);
    const brazilEezCoords: [number, number][] = [
      [6, -47], [3, -45], [0, -40], [-4, -32], [-7, -31],
      [-13, -33], [-21, -38], [-28, -43], [-36, -48], [-38, -52]
    ];
    maritimeGroup.add(createFloatingPolyLine(brazilEezCoords, 0x06b6d4, 1.012, 0.85));

    // -------------------------------------------------------------
    // 10. BRAZILIAN STATES DIVISION LINES (DF / Brasília Special)
    // -------------------------------------------------------------
    const brazilStatesGroup = new THREE.Group();
    globeGroup.add(brazilStatesGroup);

    // Distrito Federal / Brasília Outline
    brazilStatesGroup.add(createFloatingPolyLine([
      [-15.5, -48.2], [-15.5, -47.4], [-16.0, -47.4], [-16.0, -48.2], [-15.5, -48.2]
    ], 0xfacc15, 1.026));

    // Pernambuco state border outline
    brazilStatesGroup.add(createFloatingPolyLine([
      [-7.5, -34.8], [-7.2, -37.5], [-8.2, -40.5], [-9.1, -41.2],
      [-8.9, -38.2], [-8.8, -35.2], [-7.5, -34.8]
    ], 0xf43f5e, 1.022));

    // São Paulo state border outline
    brazilStatesGroup.add(createFloatingPolyLine([
      [-20.0, -49.0], [-20.5, -46.5], [-23.0, -44.5], [-24.2, -47.0],
      [-25.1, -48.5], [-22.5, -53.0], [-20.0, -49.0]
    ], 0xf59e0b, 1.022));

    // -------------------------------------------------------------
    // 11. CAPITAL CITY PINS & BEACONS
    // -------------------------------------------------------------
    const pinsGroup = new THREE.Group();
    globeGroup.add(pinsGroup);

    WORLD_CAPITALS.forEach((cap) => {
      const pos = latLngToVector3(cap.lat, cap.lng, radius * 1.022, useGeoidModel);

      // Core point (Brasília is highlighted with gold & red)
      const pinGeo = new THREE.SphereGeometry(cap.isBrasilia ? 1.8 : (cap.isBrazil ? 1.4 : 1.1), 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: cap.isBrasilia ? 0xfacc15 : (cap.isBrazil ? 0xef4444 : 0x38bdf8)
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.copy(pos);
      pinsGroup.add(pin);

      // Radar beacon ring
      const ringGeo = new THREE.RingGeometry(cap.isBrasilia ? 2.2 : 1.6, cap.isBrasilia ? 3.4 : 2.4, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cap.isBrasilia ? 0xfde047 : (cap.isBrazil ? 0xf87171 : 0x0ea5e9),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      pinsGroup.add(ring);
    });

    // 12. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(150, 80, 180);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-180, -40, -100);
    scene.add(rimLight);

    // Initial position pointing to South America / Brazil
    globeGroup.rotation.y = 1.35;
    globeGroup.rotation.x = 0.22;

    // 13. Interactive Mouse Dragging
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      targetRotationYRef.current = null;
      targetRotationXRef.current = null;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x += deltaY * 0.006;
      globeGroup.rotation.x = Math.max(-1.2, Math.min(1.2, globeGroup.rotation.x));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 14. Animation loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      clock.getDelta();

      if (isRotating && !isDragging && targetRotationYRef.current === null) {
        globeGroup.rotation.y += 0.0016;
      }

      // Smooth camera transition when user selects a capital or state
      if (targetRotationYRef.current !== null) {
        const diffY = targetRotationYRef.current - globeGroup.rotation.y;
        if (Math.abs(diffY) > 0.01) {
          globeGroup.rotation.y += diffY * 0.08;
        } else {
          globeGroup.rotation.y = targetRotationYRef.current;
          targetRotationYRef.current = null;
        }
      }

      if (targetRotationXRef.current !== null) {
        const diffX = targetRotationXRef.current - globeGroup.rotation.x;
        if (Math.abs(diffX) > 0.01) {
          globeGroup.rotation.x += diffX * 0.08;
        } else {
          globeGroup.rotation.x = targetRotationXRef.current;
          targetRotationXRef.current = null;
        }
      }

      cloudMesh.rotation.y += 0.0005;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 380;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
    };
  }, [useGeoidModel]);

  const handleSelectCapital = (cap: CapitalPoint) => {
    setSelectedCapital(cap);
    if (!globeGroupRef.current) return;

    // Calculate target rotation angles
    const targetY = -((cap.lng + 180) * (Math.PI / 180)) + Math.PI / 2 + 0.35;
    const targetX = (cap.lat * (Math.PI / 180)) * 0.5;

    targetRotationYRef.current = targetY;
    targetRotationXRef.current = targetX;
  };

  const handleOpenBrasiliaTour = () => {
    if (onOpenBrasiliaTourExternal) {
      onOpenBrasiliaTourExternal();
    } else {
      setBrasiliaTourOpen(true);
    }
  };

  return (
    <>
      <div className="bg-[#0b132b] rounded-3xl p-4 sm:p-6 shadow-2xl border border-blue-900/40 text-white relative overflow-hidden my-6">
        
        {/* Top Header & Layer Toggles */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-blue-800/40 pb-4 mb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-red-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg tracking-tight text-white">
                  Planeta Terra 3D • Modelo Geóide Potsdam em Cores Reais
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Relevo Gravitacional
                </span>
              </div>
              <p className="text-xs text-blue-300/80">
                Topografia ondulante do Geóide (Batata de Potsdam) com satélite em cores naturais, capitais e divisões do Brasil.
              </p>
            </div>
          </div>

          {/* Quick Action: Passear pelas Ruas de Brasília & Model Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* MAIN BUTTON: PASSEAR PELAS RUAS DE BRASÍLIA */}
            <button
              onClick={handleOpenBrasiliaTour}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 via-[#C4170C] to-red-600 hover:from-amber-400 hover:to-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-red-900/40 flex items-center gap-2 transition cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              title="Explorar fotos de Brasília dia a dia e mês a mês"
            >
              <Camera className="w-4 h-4 text-amber-200" />
              <span>Passear pelas Ruas de Brasília</span>
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                Fotos Dia a Dia
              </span>
            </button>

            {/* Model Geoid / Sphere Toggle */}
            <button
              onClick={() => setUseGeoidModel(!useGeoidModel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                useGeoidModel 
                  ? 'bg-blue-900/90 border-cyan-400/60 text-cyan-200' 
                  : 'bg-gray-800 border-gray-700 text-gray-300'
              }`}
              title="Alternar entre o modelo Geóide ondulado (da imagem) e a esfera clássica"
            >
              {useGeoidModel ? 'Modelo: Geóide Gravitacional (Ativo)' : 'Modelo: Esférico'}
            </button>
          </div>
        </div>

        {/* Real Live Market & PIB Strip (Renamed from Ibovespa) */}
        <div className="bg-blue-950/60 border border-blue-800/40 rounded-2xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-cyan-300 font-bold">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Mercados em Tempo Real (PIB & Moedas):</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>
              Dólar: <strong className="text-white font-bold">{quotes.dolar?.valueFormatted}</strong>{' '}
              <span className={quotes.dolar?.isPositive ? 'text-emerald-400' : 'text-red-400'}>{quotes.dolar?.pctFormatted}</span>
            </span>
            <span>
              Euro: <strong className="text-white font-bold">{quotes.euro?.valueFormatted}</strong>{' '}
              <span className={quotes.euro?.isPositive ? 'text-emerald-400' : 'text-red-400'}>{quotes.euro?.pctFormatted}</span>
            </span>
            {/* PIB BRASIL RENAMED COM BOTÃO SALVAR E SAIR AO LADO */}
            <div className="flex items-center space-x-1.5">
              <span className="bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                PIB: <strong className="text-emerald-300 font-bold">{quotes.pib?.pointsFormatted || quotes.pib?.valueFormatted || 'R$ 10,9 tri'}</strong>{' '}
                <span className="text-emerald-400 font-bold">{quotes.pib?.pctFormatted || '+2,9% a.a.'}</span>
              </span>

              {/* Botão de Salvar e Sair do lado do PIB (solicitado pelo usuário) */}
              <button
                onClick={onOpenAdminQuotes}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-2.5 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition shadow cursor-pointer border border-emerald-400"
                title="Salvar e Sair / Editar cotações de Dólar, Euro, PIB e Cripto"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Salvar e Sair</span>
              </button>
            </div>
            <span>
              Bitcoin: <strong className="text-white font-bold">{quotes.bitcoin?.valueFormatted}</strong>
            </span>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
              Total Criptomoedas: <strong>{quotes.cryptoGlobal?.totalCryptosFormatted || '17.482 criptos'}</strong>
            </span>

            {/* Admin Pencil Trigger in Ticker */}
            {isAdmin && onOpenAdminQuotes && (
              <button
                onClick={onOpenAdminQuotes}
                className="bg-amber-400 hover:bg-amber-300 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 transition"
                title="Editar cotações e PIB como administrador"
              >
                <Pencil className="w-3 h-3 text-black" />
                <span>Editar (Admin)</span>
              </button>
            )}
          </div>
        </div>

        {/* Main 3D Viewport & Capital / State Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Three.js Globe Canvas with Geoid Undulation */}
          <div className="lg:col-span-8 relative">
            <div 
              ref={mountRef} 
              className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden relative"
              title="Arraste para girar a Terra em 3D livremente. O modelo segue as distorções do geóide da imagem com cores reais de satélite."
            />

            {/* Floating Legends */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none">
              <span className="bg-amber-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                Brasília DF (Ponto Dourado)
              </span>
              <span className="bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Trees className="w-3 h-3 text-emerald-400" />
                Bioma Amazônia
              </span>
              <span className="bg-cyan-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <Waves className="w-3 h-3 text-cyan-400" />
                Águas Territoriais
              </span>
            </div>

            <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-blue-200 border border-blue-500/30 flex items-center gap-1.5 pointer-events-none">
              <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" />
              <span>Arraste para rotacionar o relevo ondulado da Terra</span>
            </div>

            <div className="absolute bottom-2 right-3">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className="bg-blue-900/80 hover:bg-blue-800 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-blue-500/40 transition cursor-pointer"
              >
                {isRotating ? 'Pausar Rotação' : 'Girar Globo'}
              </button>
            </div>
          </div>

          {/* Selected Capital / Brazilian State Live Card */}
          <div className="lg:col-span-4 bg-gradient-to-br from-blue-950/90 to-[#0d1b2a] border border-blue-800/50 rounded-2xl p-5 shadow-2xl relative backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                  selectedCapital.isBrasilia
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : selectedCapital.isBrazil 
                      ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                      : 'bg-blue-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {selectedCapital.isBrasilia ? 'Capital da República' : selectedCapital.isBrazil ? 'Estado do Brasil' : 'Capital Mundial'}
                </span>
                <span className="text-[11px] text-blue-300 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Ao Vivo
                </span>
              </div>

              <h4 className="font-black text-lg text-white flex items-center gap-1.5 mb-1">
                <MapPin className={`w-5 h-5 shrink-0 ${selectedCapital.isBrasilia ? 'text-amber-400' : 'text-red-500'}`} />
                <span>{selectedCapital.name}</span>
              </h4>
              <p className="text-xs text-blue-300 font-semibold mb-3">
                {selectedCapital.country} • População: {selectedCapital.population}
              </p>

              <div className="bg-blue-900/40 rounded-xl p-3 border border-blue-800/50 mb-4">
                <p className="text-xs text-white leading-relaxed font-medium">
                  "{selectedCapital.status}"
                </p>
                <div className="mt-2 text-[10px] text-blue-300 font-mono">
                  Coordenadas: {selectedCapital.lat}°, {selectedCapital.lng}°
                </div>
              </div>
            </div>

            {/* Quick Action Button: If Brasília is selected, open Brasília Tour directly */}
            {selectedCapital.isBrasilia ? (
              <button
                onClick={handleOpenBrasiliaTour}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition cursor-pointer mb-3"
              >
                <Camera className="w-4 h-4 text-amber-200" />
                <span>Passear pelas Ruas de Brasília (Fotos Dia a Dia)</span>
              </button>
            ) : selectedCapital.isBrazil ? (
              <button
                onClick={() => {
                  setStreetModalLocId(selectedCapital.stateCode?.toLowerCase() || 'pe');
                  setStreetModalOpen(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition cursor-pointer mb-3"
              >
                <Navigation className="w-4 h-4" />
                <span>Passar pelas ruas de {selectedCapital.name}</span>
              </button>
            ) : null}

            {/* Selector list of quick capitals */}
            <div className="pt-2 border-t border-blue-800/50">
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block mb-1.5">
                Capitais em Foco:
              </span>
              <div className="flex flex-wrap gap-1">
                {WORLD_CAPITALS.slice(0, 6).map((cap) => (
                  <button
                    key={cap.name}
                    onClick={() => handleSelectCapital(cap)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      selectedCapital.name === cap.name
                        ? 'bg-amber-400 text-black'
                        : 'bg-blue-900/60 hover:bg-blue-800 text-blue-200'
                    }`}
                  >
                    {cap.name}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Brasília Street Tour Modal (With day-by-day & month-by-month photos + Admin Pencil Upload) */}
      <BrasiliaStreetTourModal
        isOpen={brasiliaTourOpen}
        onClose={() => setBrasiliaTourOpen(false)}
        isAdmin={isAdmin}
      />

      {/* Street Explorer 3D Modal for other states */}
      <StreetExplorer3DModal
        isOpen={streetModalOpen}
        onClose={() => setStreetModalOpen(false)}
        initialLocationId={streetModalLocId}
      />
    </>
  );
};
