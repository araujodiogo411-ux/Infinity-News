import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  X, 
  Navigation, 
  MapPin, 
  Compass, 
  Eye, 
  Sun, 
  CloudSun, 
  Radio, 
  ChevronRight, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';

export interface StreetLocation {
  id: string;
  state: string;
  stateCode: string;
  city: string;
  famousStreet: string;
  theme: 'colonial' | 'modern' | 'beachfront';
  headline: string;
  newsSummary: string;
  temperature: string;
  weatherDesc: string;
  cameraInitPos: [number, number, number];
  highlights: string[];
}

export const BRAZIL_STREET_LOCATIONS: StreetLocation[] = [
  {
    id: 'pe',
    state: 'Pernambuco',
    stateCode: 'PE',
    city: 'Recife',
    famousStreet: 'Rua do Bom Jesus & Av. Boa Viagem',
    theme: 'colonial',
    headline: 'Porto Digital e turismo histórico em Olinda e Recife Antigo registram alta histórica',
    newsSummary: 'Polo tecnológico de Pernambuco amplia exportação de software e preservação do patrimônio arquitetônico colonial dos séculos XVII e XVIII.',
    temperature: '29°C',
    weatherDesc: 'Ensolarado com brisa marítima tropical',
    cameraInitPos: [0, 1.8, 18],
    highlights: ['Marco Zero do Recife', 'Porto Digital', 'Casario Colonial Holandês', 'Orla de Boa Viagem']
  },
  {
    id: 'sp',
    state: 'São Paulo',
    stateCode: 'SP',
    city: 'São Paulo',
    famousStreet: 'Avenida Paulista',
    theme: 'modern',
    headline: 'Avenida Paulista consolida centro financeiro da América Latina e agenda de inovação',
    newsSummary: 'Com fluxo de 1,5 milhão de pessoas por dia, a principal artéria econômica do país bate recorde de transações no centro financeiro.',
    temperature: '24°C',
    weatherDesc: 'Parcialmente nublado com clima urbano dinâmico',
    cameraInitPos: [0, 1.8, 18],
    highlights: ['MASP', 'Edifícios Financeiros', 'Ciclovia Central', 'Parque Trianon']
  },
  {
    id: 'rj',
    state: 'Rio de Janeiro',
    stateCode: 'RJ',
    city: 'Rio de Janeiro',
    famousStreet: 'Avenida Atlântica (Copacabana) & Lapa',
    theme: 'beachfront',
    headline: 'Setor de energia, óleo & gás e turismo de eventos impulsionam economia fluminense',
    newsSummary: 'Orla marítima carioca recebe feira internacional de bioeconomia e atrai investimentos de R$ 12 bilhões no pré-sal.',
    temperature: '31°C',
    weatherDesc: 'Céu aberto com sol radiante',
    cameraInitPos: [0, 1.8, 18],
    highlights: ['Calçadão de Copacabana', 'Orla do Atlântico', 'Arcos da Lapa', 'Corcovado ao fundo']
  },
  {
    id: 'ba',
    state: 'Bahia',
    stateCode: 'BA',
    city: 'Salvador',
    famousStreet: 'Largo do Pelourinho & Orla da Barra',
    theme: 'colonial',
    headline: 'Polo industrial verde de Camaçari e economia criativa fortalecem a capital baiana',
    newsSummary: 'Salvador lidera geração de energia eólica e solar no Nordeste e celebra fluxo turístico recorde no centro histórico.',
    temperature: '28°C',
    weatherDesc: 'Sol entre nuvens com vento alísio',
    cameraInitPos: [0, 1.8, 18],
    highlights: ['Pelourinho', 'Farol da Barra', 'Elevador Lacerda', 'Casarios Barrocos']
  },
  {
    id: 'df',
    state: 'Distrito Federal',
    stateCode: 'DF',
    city: 'Brasília',
    famousStreet: 'Esplanada dos Ministérios & Eixo Monumental',
    theme: 'modern',
    headline: 'Congresso e ministérios votam pacto fiscal e transição tecnológica nacional',
    newsSummary: 'Arquitetura modernista de Niemeyer abriga debates decisivos sobre sustentabilidade e soberania alimentar do país.',
    temperature: '26°C',
    weatherDesc: 'Céu azul característico do cerrado',
    cameraInitPos: [0, 1.8, 18],
    highlights: ['Congresso Nacional', 'Catedral Metropolitana', 'Praça dos Três Poderes', 'Palácio do Itamaraty']
  },
  {
    id: 'am',
    state: 'Amazonas',
    stateCode: 'AM',
    city: 'Manaus',
    famousStreet: 'Avenida Eduardo Ribeiro & Teatro Amazonas',
    theme: 'colonial',
    headline: 'Zona Franca de Manaus investe em bioeconomia sustentável e preservação da floresta',
    newsSummary: 'Polo industrial bate metas ecológicas com rastreabilidade de insumos nativos da Amazônia e proteção das bacias hidrográficas.',
    temperature: '32°C',
    weatherDesc: 'Quente e úmido com pancadas de chuva',
    cameraInitPos: [0, 1.8, 18],
    highlights: ['Teatro Amazonas', 'Encontro das Águas', 'Porto Fluvial', 'Cúpula da Floresta']
  }
];

interface StreetExplorer3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocationId?: string;
}

export const StreetExplorer3DModal: React.FC<StreetExplorer3DModalProps> = ({
  isOpen,
  onClose,
  initialLocationId = 'pe'
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<StreetLocation>(
    BRAZIL_STREET_LOCATIONS.find(l => l.id === initialLocationId) || BRAZIL_STREET_LOCATIONS[0]
  );
  const [walkSpeed, setWalkSpeed] = useState<number>(0);
  const [turnSpeed, setTurnSpeed] = useState<number>(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const streetGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const loc = BRAZIL_STREET_LOCATIONS.find(l => l.id === initialLocationId);
    if (loc) setSelectedLoc(loc);
  }, [initialLocationId]);

  useEffect(() => {
    if (!isOpen) return;
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x87ceeb); // Tropical Brazilian sky
    scene.fog = new THREE.FogExp2(0xb0d8f0, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(0, 1.8, 18);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Sunlight & Warm Studio Hemisphere Light
    const sun = new THREE.DirectionalLight(0xfff7e6, 2.8);
    sun.position.set(40, 80, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 250;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x475569, 1.1);
    scene.add(hemiLight);

    // 3. Street World Group
    const streetGroup = new THREE.Group();
    scene.add(streetGroup);
    streetGroupRef.current = streetGroup;

    // Procedural Textures for Asphalt & Sidewalk
    const createAsphaltCanvas = () => {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 256;
      const ctx = cv.getContext('2d')!;
      ctx.fillStyle = '#26292e';
      ctx.fillRect(0, 0, 256, 256);
      // Grain
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const c = 30 + Math.random() * 35;
        ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      return new THREE.CanvasTexture(cv);
    };

    const asphaltTex = createAsphaltCanvas();
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(4, 25);

    // Main Road (16m wide, 200m long)
    const roadGeo = new THREE.PlaneGeometry(16, 220);
    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.85,
      metalness: 0.1
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 0);
    road.receiveShadow = true;
    streetGroup.add(road);

    // Central Lane Markings (White dashed line)
    for (let z = -90; z <= 90; z += 6) {
      const dashGeo = new THREE.PlaneGeometry(0.25, 3.2);
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, z);
      streetGroup.add(dash);
    }

    // Pedestrian Zebra Crosswalk at z = 5
    for (let x = -6.5; x <= 6.5; x += 1.2) {
      const stripeGeo = new THREE.PlaneGeometry(0.65, 4.5);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.025, 5);
      streetGroup.add(stripe);
    }

    // Sidewalks (Portuguese paving / Granite curbs on left and right)
    const curbGeo = new THREE.BoxGeometry(0.3, 0.25, 220);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-8.15, 0.12, 0);
    streetGroup.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(8.15, 0.12, 0);
    streetGroup.add(rightCurb);

    const sidewalkGeo = new THREE.PlaneGeometry(7, 220);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.7 });

    const leftWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    leftWalk.rotation.x = -Math.PI / 2;
    leftWalk.position.set(-11.5, 0.22, 0);
    leftWalk.receiveShadow = true;
    streetGroup.add(leftWalk);

    const rightWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    rightWalk.rotation.x = -Math.PI / 2;
    rightWalk.position.set(11.5, 0.22, 0);
    rightWalk.receiveShadow = true;
    streetGroup.add(rightWalk);

    // 4. ARCHITECTURAL BUILDINGS & FAÇADES ALONG THE AVENUE
    // Different themes: colonial (Recife / Salvador) vs modern (São Paulo / Brasília) vs beachfront (Copacabana)
    const isColonial = selectedLoc.theme === 'colonial';
    const isModern = selectedLoc.theme === 'modern';
    const isBeachfront = selectedLoc.theme === 'beachfront';

    const colonialColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981, 0x8b5cf6, 0xec4899, 0xffffff, 0xfbbf24];
    const modernColors = [0x334155, 0x1e293b, 0x475569, 0x64748b, 0x0284c7, 0x0f172a];

    // Left and Right row of buildings
    for (let i = 0; i < 14; i++) {
      const z = -80 + i * 13;

      // Left Building
      const heightL = isModern ? 28 + (i % 5) * 8 : isColonial ? 8 + (i % 3) * 2.5 : 18 + (i % 4) * 4;
      const widthL = 10;
      const depthL = 14;
      const colL = isColonial ? colonialColors[i % colonialColors.length] : modernColors[i % modernColors.length];

      const bldgGeoL = new THREE.BoxGeometry(widthL, heightL, depthL);
      const bldgMatL = new THREE.MeshStandardMaterial({
        color: colL,
        roughness: isModern ? 0.2 : 0.6,
        metalness: isModern ? 0.5 : 0.1,
      });
      const bldgL = new THREE.Mesh(bldgGeoL, bldgMatL);
      bldgL.position.set(-20, heightL / 2 + 0.2, z);
      bldgL.castShadow = true;
      bldgL.receiveShadow = true;
      streetGroup.add(bldgL);

      // Windows / Architectural balconies on Left
      const winGeo = new THREE.BoxGeometry(0.2, 1.2, 1.6);
      const winMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        metalness: 0.8,
        roughness: 0.1,
        emissive: isModern ? 0x1e3a8a : 0x000000,
        emissiveIntensity: 0.2
      });

      for (let floor = 1; floor < heightL - 2; floor += 3) {
        for (let wz = -4; wz <= 4; wz += 2.8) {
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(-14.9, floor, z + wz);
          streetGroup.add(win);
        }
      }

      // Right Building (or Oceanfront promenade if beachfront)
      if (isBeachfront && i % 2 === 0) {
        // Beachfront sand & sea side on the right
        const sandGeo = new THREE.PlaneGeometry(35, 14);
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
        const sand = new THREE.Mesh(sandGeo, sandMat);
        sand.rotation.x = -Math.PI / 2;
        sand.position.set(28, 0.1, z);
        streetGroup.add(sand);

        // Ocean wave edge
        const oceanGeo = new THREE.PlaneGeometry(60, 14);
        const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.4 });
        const ocean = new THREE.Mesh(oceanGeo, oceanMat);
        ocean.rotation.x = -Math.PI / 2;
        ocean.position.set(70, 0.05, z);
        streetGroup.add(ocean);
      } else {
        const heightR = isModern ? 24 + (i % 4) * 9 : isColonial ? 9 + (i % 3) * 2 : 16 + (i % 3) * 5;
        const colR = isColonial ? colonialColors[(i + 3) % colonialColors.length] : modernColors[(i + 2) % modernColors.length];
        const bldgGeoR = new THREE.BoxGeometry(widthL, heightR, depthL);
        const bldgMatR = new THREE.MeshStandardMaterial({
          color: colR,
          roughness: isModern ? 0.2 : 0.6,
          metalness: isModern ? 0.5 : 0.1,
        });
        const bldgR = new THREE.Mesh(bldgGeoR, bldgMatR);
        bldgR.position.set(20, heightR / 2 + 0.2, z);
        bldgR.castShadow = true;
        bldgR.receiveShadow = true;
        streetGroup.add(bldgR);
      }
    }

    // 5. STREET FURNITURE: Street Lamps & Tropical Palm Trees
    for (let z = -75; z <= 75; z += 22) {
      // Left Street Lamp
      const lampStemGeo = new THREE.CylinderGeometry(0.08, 0.1, 5, 12);
      const lampStemMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const lampL = new THREE.Mesh(lampStemGeo, lampStemMat);
      lampL.position.set(-8.8, 2.5, z);
      lampL.castShadow = true;
      streetGroup.add(lampL);

      const lampArmGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
      const lampArm = new THREE.Mesh(lampArmGeo, lampStemMat);
      lampArm.rotation.z = Math.PI / 3;
      lampArm.position.set(-8.3, 4.8, z);
      streetGroup.add(lampArm);

      const bulbGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(-7.8, 4.7, z);
      streetGroup.add(bulb);

      // Tropical Palm Trees on Sidewalk
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 6, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(8.8, 3, z + 6);
      trunk.rotation.z = 0.08;
      trunk.castShadow = true;
      streetGroup.add(trunk);

      // Palm fronds canopy
      const palmGroup = new THREE.Group();
      palmGroup.position.set(8.8, 6, z + 6);
      for (let f = 0; f < 8; f++) {
        const frondGeo = new THREE.ConeGeometry(1.2, 3.5, 4);
        const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.rotation.z = Math.PI / 2.3;
        frond.rotation.y = (f * Math.PI) / 4;
        palmGroup.add(frond);
      }
      streetGroup.add(palmGroup);
    }

    // 6. Realistic Vehicles Passing Down the Street
    const createCar = (color: number, xPos: number, zPos: number, reverse = false) => {
      const carGroup = new THREE.Group();
      carGroup.position.set(xPos, 0, zPos);
      if (reverse) carGroup.rotation.y = Math.PI;

      // Body
      const bodyGeo = new THREE.BoxGeometry(2.1, 0.8, 4.4);
      const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.2 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.65;
      body.castShadow = true;
      carGroup.add(body);

      // Cabin / Glass
      const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.4);
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.set(0, 1.3, -0.2);
      carGroup.add(cabin);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      [-0.95, 0.95].forEach(wx => {
        [-1.3, 1.3].forEach(wz => {
          const w = new THREE.Mesh(wheelGeo, wheelMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.38, wz);
          carGroup.add(w);
        });
      });

      // Headlights & Taillights
      const headLGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const headLMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const head1 = new THREE.Mesh(headLGeo, headLMat);
      head1.position.set(-0.7, 0.65, -2.2);
      const head2 = new THREE.Mesh(headLGeo, headLMat);
      head2.position.set(0.7, 0.65, -2.2);
      carGroup.add(head1, head2);

      const tailGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const tail1 = new THREE.Mesh(tailGeo, tailMat);
      tail1.position.set(-0.7, 0.65, 2.2);
      const tail2 = new THREE.Mesh(tailGeo, tailMat);
      tail2.position.set(0.7, 0.65, 2.2);
      carGroup.add(tail1, tail2);

      return carGroup;
    };

    const cars = [
      createCar(0xef4444, -3.8, 8, false),
      createCar(0x3b82f6, -3.8, -35, false),
      createCar(0xf8fafc, 3.8, -12, true),
      createCar(0x10b981, 3.8, 30, true),
    ];
    cars.forEach(c => streetGroup.add(c));

    // 7. Street Name Overhead Plaque
    const plaqueGeo = new THREE.BoxGeometry(8, 0.9, 0.15);
    const plaqueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.position.set(0, 5.8, 6);
    streetGroup.add(plaque);

    const postLGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const postL = new THREE.Mesh(postLGeo, postMat);
    postL.position.set(-4, 3, 6);
    const postR = new THREE.Mesh(postLGeo, postMat);
    postR.position.set(4, 3, 6);
    streetGroup.add(postL, postR);

    // 8. KEYBOARD CONTROLS FOR WALKING
    let isMovingForward = false;
    let isMovingBackward = false;
    let isTurningLeft = false;
    let isTurningRight = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') isMovingForward = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') isMovingBackward = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') isTurningLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') isTurningRight = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') isMovingForward = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') isMovingBackward = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') isTurningLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') isTurningRight = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 9. ANIMATION LOOP
    let animationId: number;
    let cameraAngle = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Camera rotation
      if (isTurningLeft) cameraAngle += 0.03;
      if (isTurningRight) cameraAngle -= 0.03;

      camera.rotation.y = cameraAngle;

      // Camera walk movement
      const forwardDir = new THREE.Vector3(
        -Math.sin(cameraAngle),
        0,
        -Math.cos(cameraAngle)
      );

      if (isMovingForward) {
        camera.position.addScaledVector(forwardDir, 0.28);
      }
      if (isMovingBackward) {
        camera.position.addScaledVector(forwardDir, -0.22);
      }

      // Restrict walking boundaries to street & sidewalk zone
      camera.position.x = Math.max(-14, Math.min(14, camera.position.x));
      camera.position.z = Math.max(-85, Math.min(85, camera.position.z));
      camera.position.y = 1.8; // eye level height

      // Animate Vehicles driving smoothly along the street
      cars[0].position.z -= 0.35;
      if (cars[0].position.z < -85) cars[0].position.z = 85;

      cars[1].position.z -= 0.42;
      if (cars[1].position.z < -85) cars[1].position.z = 85;

      cars[2].position.z += 0.38;
      if (cars[2].position.z > 85) cars[2].position.z = -85;

      cars[3].position.z += 0.32;
      if (cars[3].position.z > 85) cars[3].position.z = -85;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      asphaltTex.dispose();
    };
  }, [isOpen, selectedLoc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-[#0f172a] rounded-3xl border border-blue-500/30 text-white w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 px-5 py-3.5 border-b border-blue-800/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>Exploração de Ruas 3D do Brasil</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-2 py-0.5 rounded-full">
                    {selectedLoc.state} ({selectedLoc.stateCode})
                  </span>
                </h3>
              </div>
              <p className="text-xs text-blue-300/80">
                Caminhe em tempo real pelas avenidas e ruas de Pernambuco, São Paulo, Rio e outros estados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Selector Tabs */}
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-gray-400 uppercase shrink-0 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            Estados Brasileiros:
          </span>
          {BRAZIL_STREET_LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => setSelectedLoc(loc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                selectedLoc.id === loc.id
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                  : 'bg-slate-900 text-blue-200 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <span>{loc.state}</span>
              <span className="text-[10px] opacity-75">({loc.city})</span>
            </button>
          ))}
        </div>

        {/* 3D Viewport with HUD Controls */}
        <div className="relative flex-1 bg-black min-h-[380px] sm:min-h-[460px]">
          <div 
            ref={mountRef} 
            className="w-full h-full cursor-move"
            title="Use as teclas W, A, S, D ou as setas do teclado para caminhar pela rua"
          />

          {/* Real-time Location & Weather Badge */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-blue-500/30 text-xs text-white max-w-xs shadow-lg pointer-events-none">
            <div className="font-black text-amber-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{selectedLoc.city} • {selectedLoc.famousStreet}</span>
            </div>
            <div className="text-[11px] text-blue-200 mt-1 flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedLoc.temperature} • {selectedLoc.weatherDesc}</span>
            </div>
          </div>

          {/* Navigation Keyboard / On-screen Walk Helpers */}
          <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md p-2 rounded-2xl border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2 shadow-xl">
            <span className="text-[11px] font-semibold text-slate-400 px-1 hidden sm:inline">
              Teclas W/S/A/D ou Setas para caminhar
            </span>
          </div>

          {/* Active News Context from State */}
          <div className="absolute bottom-3 right-3 max-w-sm bg-gradient-to-br from-slate-950/90 to-blue-950/90 backdrop-blur-md p-3.5 rounded-2xl border border-blue-500/40 text-xs text-white shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                Plantão Local • {selectedLoc.state}
              </span>
              <span className="text-[10px] text-blue-300">Tempo Real</span>
            </div>
            <h4 className="font-bold text-white text-xs leading-snug">
              {selectedLoc.headline}
            </h4>
            <p className="text-[11px] text-blue-200/80 mt-1 line-clamp-2">
              {selectedLoc.newsSummary}
            </p>
          </div>

          {/* Highlights pills */}
          <div className="absolute top-3 right-3 hidden md:flex items-center gap-1.5">
            {selectedLoc.highlights.map((h, i) => (
              <span key={i} className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-2.5 py-1 rounded-full text-[10px] font-medium text-emerald-300">
                ✓ {h}
              </span>
            ))}
          </div>
        </div>

        {/* Footer info strip */}
        <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Renderização 3D procedimental em alta fidelidade com física de iluminação ACES Filmic e sombras dinâmicas.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Voltar ao Globo 3D
          </button>
        </div>

      </div>
    </div>
  );
};
