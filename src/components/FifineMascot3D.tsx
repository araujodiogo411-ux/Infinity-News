import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface FifineMascot3DProps {
  isTalking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const FifineMascot3D: React.FC<FifineMascot3DProps> = ({ 
  isTalking = false, 
  size = 'md' 
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 180;
    const height = container.clientHeight || 180;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Fifine Robot Character Group
    const mascotGroup = new THREE.Group();
    scene.add(mascotGroup);

    // Head Group (for mouse tracking and nodding)
    const headGroup = new THREE.Group();
    mascotGroup.add(headGroup);

    // Head Shell (glossy rounded helmet)
    const headGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.25,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headGroup.add(headMesh);

    // Red Infinite News Journalist Visor / Cap Accent
    const capGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.15, 32);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xc4170c,
      roughness: 0.2,
      metalness: 0.4,
    });
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 0.38;
    headGroup.add(capMesh);

    // Visor Face Plate (dark glossy screen)
    const visorGeo = new THREE.SphereGeometry(0.5, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.rotation.x = Math.PI / 2;
    visorMesh.position.set(0, 0.05, 0.12);
    visorMesh.scale.set(0.9, 0.9, 0.7);
    headGroup.add(visorMesh);

    // Glowing Eyes (Expressive cyan LED ovals)
    const eyeGeo = new THREE.CapsuleGeometry(0.065, 0.08, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.16, 0.05, 0.52);
    leftEye.rotation.z = 0.1;
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.16, 0.05, 0.52);
    rightEye.rotation.z = -0.1;
    headGroup.add(rightEye);

    // Animated mouth wave bar (lights up when talking)
    const mouthGeo = new THREE.BoxGeometry(0.18, 0.03, 0.02);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.position.set(0, -0.15, 0.52);
    headGroup.add(mouthMesh);

    // Press Antenna with glowing news beacon
    const antennaStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 16);
    const antennaStemMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const antennaStem = new THREE.Mesh(antennaStemGeo, antennaStemMat);
    antennaStem.position.set(0.35, 0.65, 0);
    antennaStem.rotation.z = -0.35;
    headGroup.add(antennaStem);

    const beaconGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0.43, 0.82, 0);
    headGroup.add(beaconMesh);

    // Journalist Press Headset Microphone Boom
    const micStemGeo = new THREE.TorusGeometry(0.48, 0.02, 16, 32, Math.PI / 1.7);
    const micStemMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const micStem = new THREE.Mesh(micStemGeo, micStemMat);
    micStem.rotation.x = 1.3;
    micStem.rotation.z = -0.6;
    micStem.position.set(-0.25, -0.05, 0.2);
    headGroup.add(micStem);

    const micTipGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 16);
    const micTipMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    const micTip = new THREE.Mesh(micTipGeo, micTipMat);
    micTip.position.set(-0.18, -0.18, 0.54);
    micTip.rotation.z = 0.5;
    headGroup.add(micTip);

    // Torso / Executive Anchor Suit (dark navy tuxedo)
    const bodyGeo = new THREE.CylinderGeometry(0.38, 0.3, 0.6, 32);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.5,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = -0.6;
    mascotGroup.add(bodyMesh);

    // Executive White Dress Shirt V-Neck
    const shirtGeo = new THREE.BoxGeometry(0.18, 0.25, 0.02);
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const shirtMesh = new THREE.Mesh(shirtGeo, shirtMat);
    shirtMesh.position.set(0, -0.42, 0.36);
    mascotGroup.add(shirtMesh);

    // Executive Red Anchor Silk Tie
    const tieGeo = new THREE.ConeGeometry(0.065, 0.28, 4);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xc4170c, roughness: 0.3, metalness: 0.5 });
    const tieMesh = new THREE.Mesh(tieGeo, tieMat);
    tieMesh.rotation.z = Math.PI;
    tieMesh.position.set(0, -0.48, 0.38);
    mascotGroup.add(tieMesh);

    // Golden "PRESS / INFINITY" Badge on chest
    const badgeGeo = new THREE.BoxGeometry(0.2, 0.12, 0.02);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.2,
      metalness: 0.7,
    });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0.18, -0.56, 0.34);
    badgeMesh.rotation.z = -0.05;
    mascotGroup.add(badgeMesh);

    // Journalist Hand holding Reporter Microphone
    const micHandGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const micHandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const rightHand = new THREE.Mesh(micHandGeo, micHandMat);
    rightHand.position.set(0.48, -0.38, 0.4);
    mascotGroup.add(rightHand);

    // Handheld News Microphone with "i1" cube flag
    const handMicStemGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.35, 16);
    const handMicStem = new THREE.Mesh(handMicStemGeo, micStemMat);
    handMicStem.position.set(0.48, -0.28, 0.4);
    mascotGroup.add(handMicStem);

    const flagCubeGeo = new THREE.BoxGeometry(0.12, 0.1, 0.12);
    const flagCubeMat = new THREE.MeshStandardMaterial({ color: 0xc4170c, roughness: 0.3 });
    const flagCube = new THREE.Mesh(flagCubeGeo, flagCubeMat);
    flagCube.position.set(0.48, -0.16, 0.4);
    mascotGroup.add(flagCube);

    const grillGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const grillMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.1 });
    const grillMesh = new THREE.Mesh(grillGeo, grillMat);
    grillMesh.position.set(0.48, -0.06, 0.4);
    mascotGroup.add(grillMesh);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xef4444, 2.5, 6);
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-2, -1, 3);
    scene.add(fillLight);

    // 4. Mouse Tracking
    let targetRotY = 0;
    let targetRotX = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.7;
      targetRotX = y * 0.45;
    };

    window.addEventListener('mousemove', onMouseMove);

    // 5. Animation loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth head rotation toward mouse
      headGroup.rotation.y += (targetRotY - headGroup.rotation.y) * 0.08;
      headGroup.rotation.x += (targetRotX - headGroup.rotation.x) * 0.08;

      // Gentle floating bob
      mascotGroup.position.y = Math.sin(elapsed * 2) * 0.06;
      mascotGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.02;

      // Antenna beacon pulse
      const pulse = 1 + Math.sin(elapsed * 6) * 0.3;
      beaconMesh.scale.set(pulse, pulse, pulse);

      // Speaking animation
      if (isTalking) {
        const mouthScale = 1 + Math.sin(elapsed * 18) * 0.8;
        mouthMesh.scale.set(mouthScale, 1.5, 1);
        headGroup.position.y = Math.sin(elapsed * 8) * 0.03;
      } else {
        mouthMesh.scale.set(1, 1, 1);
        headGroup.position.y = 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 180;
      const newH = container.clientHeight || 180;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isTalking]);

  return (
    <div 
      ref={mountRef} 
      className={`relative select-none pointer-events-auto flex items-center justify-center ${
        size === 'sm' 
          ? 'w-16 h-16' 
          : size === 'lg' 
          ? 'w-48 h-48 sm:w-56 sm:h-56' 
          : size === 'xl'
          ? 'w-64 h-80 sm:w-72 sm:h-96'
          : 'w-28 h-28 sm:w-36 sm:h-36'
      }`}
    />
  );
};
