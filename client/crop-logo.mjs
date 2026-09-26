import sharp from 'sharp';
import path from 'path';

const src = path.join(process.cwd(), 'client', 'public', 'logo.png');
const outFull = path.join(process.cwd(), 'client', 'public', 'logo-full.png');
const outIcon = path.join(process.cwd(), 'client', 'public', 'logo-icon.png');
const outFavicon = path.join(process.cwd(), 'client', 'public', 'favicon.png');
const outApple = path.join(process.cwd(), 'client', 'public', 'apple-touch-icon.png');

async function processLogo() {
  console.log('Processing logo...');
  
  // 1. Trim the original to get logo-full.png
  await sharp(src)
    .trim()
    .toFile(outFull);
    
  // Get metadata of the trimmed logo to extract the icon part (which is a square on the left)
  const meta = await sharp(outFull).metadata();
  console.log('Trimmed full logo size:', meta.width, 'x', meta.height);
  
  // The icon is roughly square, so extract a square region based on height
  const iconSize = meta.height;
  await sharp(outFull)
    .extract({ left: 0, top: 0, width: iconSize, height: iconSize })
    .toFile(outIcon);
    
  // Favicon (32x32)
  await sharp(outIcon)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFile(outFavicon);
    
  // Apple touch icon (180x180)
  await sharp(outIcon)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile(outApple);
    
  console.log('Done generating logo variations!');
}

processLogo().catch(console.error);
