const fs = require("fs");
const path = require("path");
const obj2gltf = require("obj2gltf");
const gltfPipeline = require("gltf-pipeline");
const { MeshoptSimplifier } = require("meshoptimizer");

/**
 * Extracts binary buffer data for a GLTF accessor.
 */
function getBufferData(gltf, accessor) {
    if (!accessor?.bufferView) return null;

    const bufferView = gltf.bufferViews[accessor.bufferView];
    const buffer = gltf.buffers[bufferView.buffer];
    if (!buffer?.uri) return null;

    const base64Data = buffer.uri.split(",")[1];
    const binaryData = Buffer.from(base64Data, "base64");

    return new Uint8Array(binaryData.buffer, bufferView.byteOffset, bufferView.byteLength);
}

/**
 * Applies random colors from a palette to all meshes in a GLTF.
 */
function applyRandomColors(gltf) {
    if (!gltf?.nodes) return;

    const palette = [
        [1, 0, 0], [0, 1, 0], [0, 0, 1],
        [1, 1, 0], [1, 0, 1], [0, 1, 1],
    ];

    gltf.nodes.forEach((node) => {
        if (node.mesh === undefined) return;
        const mesh = gltf.meshes?.[node.mesh];
        if (!mesh) return;

        mesh.primitives.forEach((primitive) => {
            if (!gltf.materials) gltf.materials = [];

            const color = palette[Math.floor(Math.random() * palette.length)];
            const materialIndex = gltf.materials.length;

            gltf.materials.push({
                pbrMetallicRoughness: {
                    baseColorFactor: [...color, 1],
                    metallicFactor: 0.1,
                    roughnessFactor: 0.9,
                },
            });

            primitive.material = materialIndex;
        });
    });
}

/**
 * Attempts to simplify all mesh primitives using MeshoptSimplifier.
 */
function simplifyMeshes(gltf, targetRatio = 0.1) {
    if (!gltf.meshes) return;

    Object.values(gltf.meshes).forEach((mesh) => {
        mesh.primitives.forEach((primitive, i) => {
            const posAccessor = gltf.accessors?.[primitive.attributes.POSITION];
            const idxAccessor = gltf.accessors?.[primitive.indices];

            if (!posAccessor || !idxAccessor) return;

            const vertexData = getBufferData(gltf, posAccessor);
            const indexData = getBufferData(gltf, idxAccessor);

            if (!vertexData || !indexData) return;

            const vertices = new Float32Array(vertexData.buffer, vertexData.byteOffset, posAccessor.count * 3);
            const indices = new Uint32Array(indexData.buffer, indexData.byteOffset, idxAccessor.count);

            if (vertices.length / 3 !== posAccessor.count || indices.length !== idxAccessor.count) return;
            if (indices.length < 6) return;

            const targetCount = Math.floor(indices.length * targetRatio);
            if (targetCount < 12 || targetCount % 3 !== 0) return;

            const simplified = new Uint32Array(targetCount);

            try {
                MeshoptSimplifier.simplify(
                    indices,
                    vertices,
                    vertices.length / 3,
                    simplified,
                    targetCount,
                    0.1
                );

                primitive.indices = {
                    bufferView: idxAccessor.bufferView,
                    count: targetCount,
                    componentType: 5125, // UNSIGNED_INT
                    type: "SCALAR",
                };
            } catch (err) {
                console.error(`Primitive ${i}: Simplification failed — ${err.message}`);
            }
        });
    });
}

/**
 * Converts and optimizes an OBJ buffer into GLTF.
 */
async function processOBJ(objBuffer) {
    if (!objBuffer) {
        throw new Error("No buffer provided for .obj file.");
    }

    // Save OBJ temporarily
    const tempFile = path.join(__dirname, "temp.obj");
    fs.writeFileSync(tempFile, objBuffer);

    try {
        // Convert OBJ → GLTF
        let gltf = await obj2gltf(tempFile);

        // Remove temp file
        fs.unlinkSync(tempFile);

        // Apply custom steps
        applyRandomColors(gltf);
        simplifyMeshes(gltf);

        // Optimize with gltf-pipeline
        const gltfBuffer = Buffer.from(JSON.stringify(gltf));
        const { gltf: optimized } = await gltfPipeline.processGltf(gltfBuffer, {
            dracoOptions: { compressionLevel: 10 },
        });

        return optimized;
    } catch (err) {
        throw new Error(`Failed to process OBJ: ${err.message}`);
    }
}

module.exports = { processOBJ };