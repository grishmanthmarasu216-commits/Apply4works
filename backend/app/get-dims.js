import sharp from 'sharp';

async function run() {
    const metadata = await sharp('src/assets/logo.jpg').metadata();
    console.log(`Dimensions: ${metadata.width}x${metadata.height}`);
}
run();
