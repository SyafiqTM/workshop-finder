import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');

// Source: the revHaus logo PNG sitting in public/
const logoPath = path.join(publicDir, 'revHaus_logo.png');

/**
 * Build a plain square icon: logo resized to fill the canvas with a white bg.
 */
async function buildRegular(size, outputPath) {
  const logoResized = await sharp(logoPath)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{ input: logoResized, gravity: 'center' }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}

/**
 * Build a maskable icon: logo placed inside the 80 % safe-area circle,
 * i.e. the image occupies 60 % of the canvas, centred on white.
 * The remaining padding is the safe zone required by the maskable spec.
 */
async function buildMaskable(size, outputPath) {
  const logoSize = Math.round(size * 0.6);

  const logoResized = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([{ input: logoResized, gravity: 'center' }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}

const regularOutputs = [
  { out: 'pwa-192x192.png',        size: 192 },
  { out: 'pwa-512x512.png',        size: 512 },
  { out: 'apple-touch-icon-120.png', size: 120 },
  { out: 'apple-touch-icon-152.png', size: 152 },
  { out: 'apple-touch-icon-167.png', size: 167 },
  { out: 'apple-touch-icon-180.png', size: 180 },
];

const maskableOutputs = [
  { out: 'pwa-maskable-192x192.png', size: 192 },
  { out: 'pwa-maskable-512x512.png', size: 512 },
];

async function main() {
  try {
    await fs.access(logoPath);
  } catch {
    throw new Error(`Missing logo source: ${path.relative(projectRoot, logoPath)}`);
  }

  await fs.mkdir(publicDir, { recursive: true });

  await Promise.all([
    ...regularOutputs.map(({ out, size }) =>
      buildRegular(size, path.join(publicDir, out))
    ),
    ...maskableOutputs.map(({ out, size }) =>
      buildMaskable(size, path.join(publicDir, out))
    ),
  ]);

  console.log('PWA icons generated successfully from revHaus_logo.png');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
