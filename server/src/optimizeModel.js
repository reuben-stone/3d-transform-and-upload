const obj2gltf = require("obj2gltf");
const gltfPipeline = require("gltf-pipeline");
const fs = require("fs");
const path = require("path");

async function processOBJ(objBuffer) {
    console.log('In optimizer');

    try {
        // Ensure the buffer is valid
        if (!objBuffer) {
            throw new Error('No buffer provided for .obj file.');
        }

        // Save the buffer to a temporary file to avoid file name length issues
        const tempFilePath = path.join(__dirname, 'temp.obj');
        fs.writeFileSync(tempFilePath, objBuffer);

        // Convert .obj to GLTF 
        console.log('Converting OBJ to GLTF...');
        let gltf = await obj2gltf(tempFilePath);

        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);

        // Add random colors to the GLTF materials
        if (gltf && gltf.nodes) {
            console.log("Applying random colors...");

            const randomColorPalette = [
                [1, 0, 0], // Red
                [0, 1, 0], // Green
                [0, 0, 1], // Blue
                [1, 1, 0], // Yellow
                [1, 0, 1], // Magenta
                [0, 1, 1], // Cyan
            ];

            gltf.nodes.forEach((node) => {
                if (node.mesh !== undefined && gltf.meshes[node.mesh]) {
                    gltf.meshes[node.mesh].primitives.forEach((primitive) => {
                        if (!gltf.materials) gltf.materials = [];

                        const randomColor = randomColorPalette[Math.floor(Math.random() * randomColorPalette.length)];
                        const materialIndex = gltf.materials.length;
                        gltf.materials.push({
                                pbrMetallicRoughness: {
                                baseColorFactor: [...randomColor, 1], // RGB + Alpha
                                metallicFactor: 0.1, // Slightly metallic
                                roughnessFactor: 0.9, // High roughness
                            },
                        });

                        primitive.material = materialIndex;
                    });
                }
            });
        }

        console.log("Optimizing GLTF with gltf-pipeline...");
        const gltfBuffer = Buffer.from(JSON.stringify(gltf));

        const optimized = await gltfPipeline.processGltf(gltfBuffer, {
            dracoOptions: { compressionLevel: 10 },
        });

        // Return the optimized GLB
        console.log('Optimization complete');
        return optimized.gltf;
    } catch (error) {
        console.error('Error processing OBJ:', error);
        throw new Error(`Failed to process OBJ: ${error.message}`);
    }
}

module.exports = { processOBJ };
