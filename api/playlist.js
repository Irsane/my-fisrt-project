// Список медиа для экранов.
// Режим 1 (Blob): если подключено хранилище Vercel Blob — берём файлы оттуда
//                 (заливаешь через дашборд, пересборка не нужна).
// Режим 2 (репозиторий): иначе берём то, что лежит в public/media (манифест
//                 генерируется при сборке скриптом scripts/build-manifest.mjs).

import manifest from './_media-manifest.js';

const IMAGE_EXT = ['jpg','jpeg','png','gif','webp','avif','bmp','svg'];
const VIDEO_EXT = ['mp4','webm','ogg','ogv','mov','m4v'];
const extOf  = (n) => { const i = n.lastIndexOf('.'); return i < 0 ? '' : n.slice(i + 1).toLowerCase(); };
const typeOf = (n) => { const e = extOf(n); return IMAGE_EXT.includes(e) ? 'image' : VIDEO_EXT.includes(e) ? 'video' : null; };
const natKey = (s) => s.split(/(\d+)/).map(t => /^\d+$/.test(t) ? t.padStart(12, '0') : t.toLowerCase()).join('');

async function fromBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  let list;
  try { ({ list } = await import('@vercel/blob')); } catch (e) { return null; }
  try {
    const items = [];
    let cursor;
    do {
      const page = await list({ prefix: 'media/', cursor });
      for (const b of page.blobs) {
        const name = b.pathname.replace(/^media\//, '');
        const t = typeOf(name);
        if (!t || !name) continue;
        items.push({ name, type: t, url: b.url, size: b.size || 0, mtime: Date.parse(b.uploadedAt) || 0 });
      }
      cursor = page.cursor;
    } while (cursor);
    return items;
  } catch (e) { return null; }
}

function fromRepo() {
  return (manifest || [])
    .map((m) => {
      const name = typeof m === 'string' ? m : m.name;
      const t = typeOf(name);
      if (!t) return null;
      return {
        name, type: t,
        url: '/media/' + encodeURIComponent(name),
        size: (m && m.size) || 0,
        mtime: (m && m.mtime) || 0,
      };
    })
    .filter(Boolean);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  let items = await fromBlob();
  if (!items || items.length === 0) items = fromRepo();

  items.sort((a, b) => { const ka = natKey(a.name), kb = natKey(b.name); return ka < kb ? -1 : ka > kb ? 1 : 0; });

  const signature = items.map((i) => `${i.name}:${i.mtime}:${i.size}`).join('|');

  res.status(200).json({
    signature,
    config: { imageDuration: 10, muteVideo: true, showClock: true, showLogo: true, videoFallback: 15 },
    items,
  });
}
