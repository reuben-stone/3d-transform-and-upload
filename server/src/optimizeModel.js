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

        // Convert .obj to GLTF from the temporary file
        console.log('Converting OBJ to GLTF...');
        const gltf = await obj2gltf(tempFilePath);
        const gltfBuffer = Buffer.from(JSON.stringify(gltf));

        console.log('Optimizing GLTF with gltf-pipeline...');
        const optimized = await gltfPipeline.processGltf(gltfBuffer, {
            dracoOptions: { compressionLevel: 10 },
        });

        console.log('OPTIMIZED', optimized);

        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);

        // Return the optimized GLB
        console.log('Optimization complete');
        return optimized.gltf;
    } catch (error) {
        console.error('Error processing OBJ:', error);
        throw new Error(`Failed to process OBJ: ${error.message}`);
    }
}

module.exports = { processOBJ };
