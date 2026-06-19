// Сканирует public/media и пишет api/_media-manifest.js со списком файлов.
// Запускается автоматически при сборке на Vercel (npm run build).
import fs from 'fs';
import path from 'path';

const IMAGE_EXT = ['jpg','jpeg','png','gif','webp','avif','bmp','svg'];
const VIDEO_EXT = ['mp4','webm','ogg','ogv','mov','m4v'];
const allow = new Set([...IMAGE_EXT, ...VIDEO_EXT]);
const extOf = (n) => { const i = n.lastIndexOf('.'); return i < 0 ? '' : n.slice(i + 1).toLowerCase(); };

const dir = path.join(process.cwd(), 'public', 'media');
let names = [];
try { names = fs.readdirSync(dir); } catch (e) {}

const items = names
  .filter((f) => !f.startsWith('.') && allow.has(extOf(f)))
  .map((f) => {
    let st = {};
    try { st = fs.statSync(path.join(dir, f)); } catch (e) {}
    return { name: f, size: st.size || 0, mtime: Math.round(st.mtimeMs || 0) };
  });

const out = path.join(process.cwd(), 'api', '_media-manifest.js');
fs.writeFileSync(out, 'export default ' + JSON.stringify(items, null, 2) + ';\n');
console.log(`[build] media manifest: ${items.length} файл(ов) -> api/_media-manifest.js`);
