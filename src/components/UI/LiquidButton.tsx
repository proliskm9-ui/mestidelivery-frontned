import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { MeshTransmissionMaterial, Text } from '@react-three/drei';
import * as THREE from 'three';

interface LiquidButtonProps {
    onClick?: () => void;
    children: string;
}

const LiquidButtonMesh = ({ text, hovered }: { text: string; hovered: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<any>(null);

    // Load the background texture to use for refraction
    // This creates the "real transparency" effect by refracting the actual background image
    const bgTexture = useLoader(THREE.TextureLoader, '/Assets/mestia_3d_map_grey_1770421992583.png');

    useFrame((state) => {
        if (materialRef.current) {
            const time = state.clock.getElapsedTime();
            // Liquid distortion
            materialRef.current.distortion = 0.4 + Math.sin(time * 0.5) * 0.2;

            // Hover scale effect on distortion
            const targetScale = hovered ? 0.6 : 0.3;
            materialRef.current.distortionScale = THREE.MathUtils.lerp(materialRef.current.distortionScale, targetScale, 0.1);

            // Color tint: Greenish on hover, Clear/White otherwise
            const targetColor = hovered ? new THREE.Color("#4aff90") : new THREE.Color("#ffffff");
            materialRef.current.color.lerp(targetColor, 0.1);
        }
        if (meshRef.current) {
            // Float animation
            meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
        }
    });

    return (
        <group>
            <mesh ref={meshRef} rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[1.0, 4.5, 32, 64]} />
                <MeshTransmissionMaterial
                    ref={materialRef}
                    backside={false}
                    samples={6}
                    resolution={512}
                    transmission={1} // Full transmission
                    roughness={0.05} // Glossy
                    thickness={1.5} // Thicker for more refraction
                    ior={1.2} // Glass index
                    chromaticAberration={0.06} // Color fringe
                    anisotropy={0.1}
                    distortion={0.4}
                    distortionScale={0.4}
                    temporalDistortion={0.1}
                    clearcoat={1}
                    attenuationDistance={1}
                    attenuationColor="#ffffff"
                    color="#ffffff"
                    background={bgTexture} // Refract the map texture!
                    toneMapped={false}
                />
            </mesh>

            <Text
                position={[0, 0, 1.2]}
                fontSize={0.4}
                anchorX="center"
                anchorY="middle"
                color="white"
                letterSpacing={0.15}
                fontWeight={800}
            >
                {text.toUpperCase()}
            </Text>
        </group>
    );
};

export const LiquidButton: React.FC<LiquidButtonProps> = ({ onClick, children }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            style={{
                width: '400px',
                height: '150px',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 10,
                filter: 'drop-shadow(0 0 20px rgba(33, 234, 124, 0.3))'
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
        >
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ alpha: true, antialias: true }}>
                <ambientLight intensity={1.5} />
                <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={4} color="#ffffff" />
                <pointLight position={[-10, -5, -5]} intensity={2} color="#21EA7C" />
                <pointLight position={[5, 5, 5]} intensity={2} color="#ffffff" />

                {/* Wrap in Suspense is handled by parent, but useLoader requires it. 
                    Parent App.tsx already has Suspense. */}
                <LiquidButtonMesh text={children} hovered={hovered} />
            </Canvas>
        </div>
    );
};
