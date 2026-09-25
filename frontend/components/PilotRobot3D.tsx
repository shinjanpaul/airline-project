'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PilotRobot3DProps {
  onClick?: () => void;
  className?: string;
  isTalking?: boolean;
}

export default function PilotRobot3D({ onClick, className = '', isTalking = false }: PilotRobot3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTalkingRef = useRef(isTalking);

  useEffect(() => {
    isTalkingRef.current = isTalking;
  }, [isTalking]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    const width = container.clientWidth || 160;
    const height = container.clientHeight || 180;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Adjusted camera position to make the 3D Robot larger and prominent
    camera.position.set(0, 0.15, 3.1);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const accentLight = new THREE.PointLight(0x818cf8, 2.2, 10);
    accentLight.position.set(-2, 1, 2);
    scene.add(accentLight);

    // Group
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, -0.25, 0);
    scene.add(avatarGroup);

    // Materials
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffd54f }); // Roblox yellow
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x1e1b4b }); // Navy pilot jacket
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Collar
    const tieMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 }); // Sky blue tie
    const headphoneMat = new THREE.MeshLambertMaterial({ color: 0x0f172a }); // Dark navy pilot headset
    const visorMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 }); // Sky blue visor
    const antennaMat = new THREE.MeshLambertMaterial({ color: 0x10b981 }); // Neon green tip

    // Torso (Blocky Roblox style)
    const torsoGeo = new THREE.BoxGeometry(1.25, 1.1, 0.6);
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.set(0, -0.4, 0);
    avatarGroup.add(torsoMesh);

    // Tie
    const tieGeo = new THREE.BoxGeometry(0.24, 0.45, 0.05);
    const tieMesh = new THREE.Mesh(tieGeo, tieMat);
    tieMesh.position.set(0, -0.35, 0.31);
    avatarGroup.add(tieMesh);

    // Collar
    const collarGeo = new THREE.BoxGeometry(0.42, 0.16, 0.04);
    const collarMesh = new THREE.Mesh(collarGeo, shirtMat);
    collarMesh.position.set(0, -0.08, 0.31);
    avatarGroup.add(collarMesh);

    // Wings pin
    const pinGeo = new THREE.BoxGeometry(0.3, 0.08, 0.06);
    const pinMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.set(-0.35, -0.2, 0.32);
    avatarGroup.add(pinMesh);

    // Head Pivot
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.35, 0);
    avatarGroup.add(headPivot);

    // Head Block
    const headGeo = new THREE.BoxGeometry(0.92, 0.92, 0.88);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 0.38, 0);
    headPivot.add(headMesh);

    // Stud
    const studGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 16);
    const studMesh = new THREE.Mesh(studGeo, headMat);
    studMesh.position.set(0, 0.9, 0);
    headPivot.add(studMesh);

    // Pilot Cap Visor / Hat Peak
    const capGeo = new THREE.BoxGeometry(0.96, 0.18, 0.92);
    const capMesh = new THREE.Mesh(capGeo, headphoneMat);
    capMesh.position.set(0, 0.82, 0);
    headPivot.add(capMesh);

    const visorPeakGeo = new THREE.BoxGeometry(0.96, 0.06, 0.35);
    const visorPeakMesh = new THREE.Mesh(visorPeakGeo, headphoneMat);
    visorPeakMesh.position.set(0, 0.75, 0.52);
    visorPeakMesh.rotation.x = 0.2;
    headPivot.add(visorPeakMesh);

    // Cap Gold Emblem
    const badgeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
    badgeGeo.rotateX(Math.PI / 2);
    const badgeMesh = new THREE.Mesh(badgeGeo, pinMat);
    badgeMesh.position.set(0, 0.83, 0.48);
    headPivot.add(badgeMesh);

    // Visor Eyes
    const eyeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, visorMat);
    leftEye.position.set(-0.22, 0.42, 0.46);
    headPivot.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, visorMat);
    rightEye.position.set(0.22, 0.42, 0.46);
    headPivot.add(rightEye);

    // Smile / Existing Mouth Mesh
    const mouthGeo = new THREE.BoxGeometry(0.24, 0.06, 0.05);
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0x1e1b4b });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 0.2, 0.46);
    headPivot.add(mouth);

    // Headset
    const earGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16);
    earGeo.rotateZ(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeo, headphoneMat);
    leftEar.position.set(-0.52, 0.4, 0);
    headPivot.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, headphoneMat);
    rightEar.position.set(0.52, 0.4, 0);
    headPivot.add(rightEar);

    const bandGeo = new THREE.TorusGeometry(0.55, 0.06, 8, 24, Math.PI);
    bandGeo.rotateZ(Math.PI);
    const bandMesh = new THREE.Mesh(bandGeo, headphoneMat);
    bandMesh.position.set(0, 0.55, 0);
    headPivot.add(bandMesh);

    const micBoomGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
    micBoomGeo.rotateZ(-Math.PI / 3);
    const micBoom = new THREE.Mesh(micBoomGeo, headphoneMat);
    micBoom.position.set(-0.38, 0.26, 0.3);
    headPivot.add(micBoom);

    const micTipGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const micTip = new THREE.Mesh(micTipGeo, visorMat);
    micTip.position.set(-0.24, 0.17, 0.45);
    headPivot.add(micTip);

    // Antenna
    const antPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8);
    const antPole = new THREE.Mesh(antPoleGeo, headphoneMat);
    antPole.position.set(0.5, 0.65, 0);
    headPivot.add(antPole);

    const antTipGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const antTip = new THREE.Mesh(antTipGeo, antennaMat);
    antTip.position.set(0.5, 0.8, 0);
    headPivot.add(antTip);

    // Mouse tracking
    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = (e.clientX - centerX) / (window.innerWidth / 2);
      const dy = (e.clientY - centerY) / (window.innerHeight / 2);

      targetRotY = Math.max(-0.85, Math.min(0.85, dx * 1.0));
      targetRotX = Math.max(-0.6, Math.min(0.6, dy * 0.8));
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 160;
      const h = container.clientHeight || 180;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();

    // Natural eye blinking state
    let nextBlinkTime = 2.0;
    let isBlinking = false;
    let blinkStartTime = 0;
    let isDoubleBlink = false;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      curRotX += (targetRotX - curRotX) * 0.14;
      curRotY += (targetRotY - curRotY) * 0.14;

      headPivot.rotation.y = curRotY;
      headPivot.rotation.x = curRotX;

      avatarGroup.position.y = -0.25 + Math.sin(t * 3) * 0.04;
      avatarGroup.rotation.y = Math.sin(t * 1.5) * 0.06 + (curRotY * 0.2);

      antTip.material.color.setHex(Math.sin(t * 5) > 0 ? 0x10b981 : 0x34d399);

      // Talking animation for ONLY the existing mouth mesh (vertical Y scale stretching)
      let targetMouthScaleY = 1.0;
      if (isTalkingRef.current) {
        const talkCycle = Math.sin(t * 18) * 0.4 + Math.sin(t * 32) * 0.3;
        targetMouthScaleY = 1.0 + Math.max(0, talkCycle * 1.5);
      }
      // Smooth interpolation back to 1.0 (original square/rectangle mouth)
      mouth.scale.y += (targetMouthScaleY - mouth.scale.y) * 0.22;

      // Independent natural blinking animation for ONLY existing eye meshes (leftEye & rightEye)
      if (t >= nextBlinkTime && !isBlinking) {
        isBlinking = true;
        blinkStartTime = t;
        isDoubleBlink = Math.random() < 0.15; // 15% chance of double blink
      }

      let eyeScaleY = 1.0;
      if (isBlinking) {
        const blinkDuration = isDoubleBlink ? 0.38 : 0.20;
        const elapsedBlink = t - blinkStartTime;

        if (elapsedBlink < blinkDuration) {
          if (isDoubleBlink) {
            const pulse = Math.sin((elapsedBlink / blinkDuration) * Math.PI * 2);
            eyeScaleY = Math.max(0.08, 1.0 - Math.abs(pulse));
          } else {
            const pulse = Math.sin((elapsedBlink / blinkDuration) * Math.PI);
            eyeScaleY = Math.max(0.08, 1.0 - pulse);
          }
        } else {
          isBlinking = false;
          nextBlinkTime = t + 3.0 + Math.random() * 3.5; // Random 3 to 6.5s interval
          eyeScaleY = 1.0;
        }
      }

      leftEye.scale.y = eyeScaleY;
      rightEye.scale.y = eyeScaleY;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 group ${className}`}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
