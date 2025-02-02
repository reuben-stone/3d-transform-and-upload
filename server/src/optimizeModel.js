const obj2gltf = require("obj2gltf");
const gltfPipeline = require("gltf-pipeline");
const fs = require("fs");
const path = require("path");
const { MeshoptSimplifier } = require("meshoptimizer");

async function processOBJ(objBuffer) {
    console.log("In optimizer");

    try {
        if (!objBuffer) {
            throw new Error("No buffer provided for .obj file.");
        }

        // Save OBJ to a temporary file
        const tempFilePath = path.join(__dirname, "temp.obj");
        fs.writeFileSync(tempFilePath, objBuffer);

        console.log("Converting OBJ to GLTF...");
        let gltf = await obj2gltf(tempFilePath);

        // Clean up temporary file
        fs.unlinkSync(tempFilePath);

        // Apply random colors
        if (gltf && gltf.nodes) {
            console.log("Applying random colors...");
            const colorPalette = [
                [1, 0, 0], 
                [0, 1, 0], 
                [0, 0, 1], 
                [1, 1, 0], 
                [1, 0, 1], 
                [0, 1, 1]
            ];
            gltf.nodes.forEach((node) => {
                if (node.mesh !== undefined && gltf.meshes[node.mesh]) {
                    gltf.meshes[node.mesh].primitives.forEach((primitive) => {
                        if (!gltf.materials) gltf.materials = [];

                        const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                        const materialIndex = gltf.materials.length;
                        gltf.materials.push({
                            pbrMetallicRoughness: {
                                baseColorFactor: [...randomColor, 1], // RGB + Alpha
                                metallicFactor: 0.1,
                                roughnessFactor: 0.9,
                            },
                        });

                        primitive.material = materialIndex;
                    });
                }
            });
        }

        // console.log("Reducing polygon count...");
        // if (gltf.meshes) {
        //     for (const mesh of Object.values(gltf.meshes)) {
        //         mesh.primitives.forEach((primitive) => {
        //             if (primitive.attributes.POSITION) {
        //                 const vertices = new Float32Array(primitive.attributes.POSITION.array);
        //                 const indices = primitive.indices ? new Uint16Array(primitive.indices.array) : null;

        //                 if (indices) {
        //                     const targetRatio = 0.5; // Reduce to 50% of original polygons
        //                     const targetCount = Math.floor(indices.length * targetRatio);
        //                     const simplifiedIndices = new Uint16Array(targetCount);

        //                     MeshoptSimplifier.simplify(indices, vertices, 3, simplifiedIndices, targetCount, 0.01);
        //                     primitive.indices = { array: simplifiedIndices, type: 5123 }; // Update GLTF indices
        //                 }
        //             }
        //         });
        //     }
        // }

        console.log("Optimizing GLTF with gltf-pipeline...");
        const gltfBuffer = Buffer.from(JSON.stringify(gltf));

        const optimized = await gltfPipeline.processGltf(gltfBuffer, {
            dracoOptions: { compressionLevel: 10 },
        });

        console.log("Optimization complete");

        return optimized.gltf;
    } catch (error) {
        console.error("Error processing OBJ:", error);
        throw new Error(`Failed to process OBJ: ${error.message}`);
    }
}

module.exports = { processOBJ };
