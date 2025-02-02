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

        const getBufferData = (gltf, accessor) => {
            if (!accessor || accessor.bufferView === undefined) return null;
        
            const bufferView = gltf.bufferViews[accessor.bufferView];
            const buffer = gltf.buffers[bufferView.buffer];
        
            if (!buffer || !buffer.uri) return null;
        
            // Decode base64 GLB embedded buffer
            const base64Data = buffer.uri.split(",")[1];
            const binaryData = Buffer.from(base64Data, "base64");
        
            // Extract relevant slice
            return new Uint8Array(binaryData.buffer, bufferView.byteOffset, bufferView.byteLength);
        };

        console.log("Reducing polygon count...");
        if (gltf.meshes) {
            for (const mesh of Object.values(gltf.meshes)) {
                mesh.primitives.forEach((primitive, primitiveIndex) => {
                    if (!primitive.attributes.POSITION || !primitive.indices) {
                        console.warn(`Skipping primitive ${primitiveIndex}: No POSITION or INDICES.`);
                        return;
                    }

                    const positionAccessor = gltf.accessors[primitive.attributes.POSITION];
                    const indexAccessor = gltf.accessors[primitive.indices];

                    if (!positionAccessor || !indexAccessor) {
                        console.warn(`Skipping primitive ${primitiveIndex}: Invalid accessors.`);
                        return;
                    }

                    const vertexData = getBufferData(gltf, positionAccessor);
                    const indexData = getBufferData(gltf, indexAccessor);

                    if (!vertexData || !indexData) {
                        console.warn(`Skipping primitive ${primitiveIndex}: Could not extract buffer data.`);
                        return;
                    }

                    const vertices = new Float32Array(vertexData.buffer, vertexData.byteOffset, positionAccessor.count * 3);
                    const indices = new Uint32Array(indexData.buffer, indexData.byteOffset, indexAccessor.count);

                    if (vertices.length / 3 !== positionAccessor.count) {
                        console.warn(`Skipping primitive ${primitiveIndex}: Vertex buffer size mismatch.`);
                        return;
                    }

                    if (indices.length !== indexAccessor.count) {
                        console.warn(`Skipping primitive ${primitiveIndex}: Index buffer size mismatch.`);
                        return;
                    }

                    console.log(`Primitive ${primitiveIndex}: Extracted ${vertices.length / 3} vertices and ${indices.length / 3} triangles.`);

                    // Check if the primitive has enough data to simplify
                    if (indices.length < 6) {
                        console.warn(`Skipping primitive ${primitiveIndex}: Not enough indices for simplification.`);
                        return;
                    }

                    // Set a safe target polygon count (increased the target ratio)
                    const targetRatio = 0.1; // Less aggressive simplification
                    const targetCount = Math.floor(indices.length * targetRatio);

                    // Ensure the target count is reasonable (not too small)
                    if (targetCount < 12 || targetCount % 3 !== 0) {
                        console.warn(`Skipping primitive ${primitiveIndex}: Target count ${targetCount} is too small.`);
                        return;
                    }

                    console.log(`Primitive ${primitiveIndex}: Reducing from ${indices.length} to ${targetCount} indices...`);

                    const simplifiedIndices = new Uint32Array(targetCount);

                    try {
                        MeshoptSimplifier.simplify(
                            indices, // Must be Uint32Array
                            vertices, // Must be Float32Array
                            vertices.length / 3,
                            simplifiedIndices,
                            targetCount,
                            0.1 // Increased threshold for simplification
                        );

                        primitive.indices = {
                            bufferView: indexAccessor.bufferView,
                            count: targetCount,
                            componentType: 5125, // UNSIGNED_INT
                            type: "SCALAR",
                        };

                        console.log(`Primitive ${primitiveIndex}: Simplified successfully.`);
                    } catch (error) {
                        console.error(`Primitive ${primitiveIndex}: Error during simplification - ${error.message}`);
                    }
                });
            }
        }

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
