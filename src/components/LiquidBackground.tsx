import { Canvas } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';

export const LiquidBackground = () => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <color attach="background" args={['#151514']} />

                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#21EA7C" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#3BB44A" />

                {/* Add particles or stars for depth */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <Environment preset="city" />
            </Canvas>
        </div>
    );
};
