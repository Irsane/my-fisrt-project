// Текущее время сервера — общий источник для синхронизации всех экранов.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ now: Date.now() });
}
