import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputImagePath = 'src/assets/logo.jpg';
const publicDir = 'public';

const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
];

async function generate() {
    try {
        console.log('Extracting A4 icon...');
        const metadata = await sharp(inputImagePath).metadata();
        const width = metadata.width;
        const height = metadata.height;
        const cropWidth = Math.floor(width * 0.35); // Left 35%
        
        // Extract the region and trim white space around it
        const iconBuffer = await sharp(inputImagePath)
            .extract({ left: 10, top: 10, width: cropWidth, height: height - 20 })
            .trim({ threshold: 240 }) // Remove white space
            .toBuffer();

        console.log('Generating PNG favicons from A4 icon...');
        for (const s of sizes) {
            await sharp(iconBuffer)
                .resize(s.size, s.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
                .toFile(path.join(publicDir, s.name));
            console.log(`Created ${s.name}`);
        }

        fs.copyFileSync(path.join(publicDir, 'favicon-32x32.png'), path.join(publicDir, 'favicon.ico'));
        console.log('Created favicon.ico (as PNG copy)');

        // Keep the original full image for Open Graph
        await sharp(inputImagePath)
            .resize(1200, 630, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .toFile(path.join(publicDir, 'og-image.jpg'));
        console.log('Created og-image.jpg');

        console.log('All favicons generated successfully!');
    } catch (err) {
        console.error('Error generating favicons:', err);
    }
}

generate();
