import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, useGLTF } from "@react-three/drei";

const Scene = ({ modelUrl }) => {
    const { scene } = useGLTF(modelUrl); 

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (scene) {
          setLoaded(true);
        }
    }, [scene]);

    if (!loaded) return <div>Loading model...</div>;

    return (
        <Canvas
            shadows 
            camera={{ position: [0, 1, 2], fov: 65 }} 
            style={{ width: "100%", height: "100vh" }}
        >
            <ambientLight intensity={0.5} />
            <directionalLight 
                position={[5, 5, 5]} 
                intensity={1.5} 
                castShadow 
                shadow-mapSize-width={1024} 
                shadow-mapSize-height={1024} 
            />
            <pointLight position={[-3, -3, -3]} intensity={0.7} />
            <Center>
                <primitive object={scene} scale={[1, 1, 1]} castShadow receiveShadow />
            </Center>
            <OrbitControls enableDamping />
        </Canvas>
    );
};

export default Scene;
