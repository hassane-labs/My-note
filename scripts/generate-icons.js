#!/usr/bin/env node
/* ==========================================================================
   My Note - Génération icônes PWA (nécessite sharp: npm install sharp)
   ========================================================================== */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputSvg = path.join(__dirname, '../assets/logo.svg');
const outputDir = path.join(__dirname, '../assets/icons');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-maskable-512.png', size: 512, maskable: true }
];

async function generateIcons() {
  try {
    const sharp = (await import('sharp')).default;
    
    // Crée le dossier de sortie
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const svgBuffer = fs.readFileSync(inputSvg);
    
    for (const { name, size, maskable } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      let pipeline = sharp(svgBuffer, { density: 300 })
        .resize(size, size, { fit: 'contain', background: { r: 10, g: 10, b: 11, alpha: 1 } })
        .png({ compressionLevel: 9 });
      
      if (maskable) {
        // Pour maskable, ajoute du padding (zone de sécurité 40%)
        const safeZone = Math.floor(size * 0.4);
        pipeline = pipeline.extend({
          top: safeZone,
          bottom: safeZone,
          left: safeZone,
          right: safeZone,
          background: { r: 10, g: 10, b: 11, alpha: 1 }
        });
      }
      
      await pipeline.toFile(outputPath);
      console.log(`✓ Généré: ${name} (${size}x${size}${maskable ? ' maskable' : ''})`);
    }
    
    console.log('\n✓ Toutes les icônes générées dans assets/icons/');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND' || e.message.includes('Cannot find module')) {
      console.error('Erreur: sharp non installé. Exécutez: npm install sharp');
      console.log('\nAlternative: utilisez ImageMagick ou rsvg-convert:');
      console.log('  rsvg-convert -w 192 -h 192 assets/logo.svg -o assets/icons/icon-192.png');
      console.log('  rsvg-convert -w 512 -h 512 assets/logo.svg -o assets/icons/icon-512.png');
      console.log('  rsvg-convert -w 512 -h 512 -a -b "#0A0A0B" assets/logo.svg -o assets/icons/icon-maskable-512.png');
    } else {
      console.error('Erreur:', e.message);
    }
    process.exit(1);
  }
}

generateIcons();