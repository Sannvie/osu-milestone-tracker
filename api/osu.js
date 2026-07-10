export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { endpoint, u, b, type, mods } = req.query;
  const OSU_API_KEY = process.env.OSU_API_KEY; 

  if (!OSU_API_KEY) {
    return res.status(500).json({ error: 'API Key belum dikonfigurasi di Vercel.' });
  }

  let targetUrl = '';
  if (endpoint === 'get_user') {
    targetUrl = `https://osu.ppy.sh/api/get_user?k=${OSU_API_KEY}&u=${encodeURIComponent(u)}&type=${type || 'string'}`;
  } else if (endpoint === 'get_beatmaps') {
    targetUrl = `https://osu.ppy.sh/api/get_beatmaps?k=${OSU_API_KEY}&b=${b}`;
  } else if (endpoint === 'get_scores') {
    targetUrl = `https://osu.ppy.sh/api/get_scores?k=${OSU_API_KEY}&b=${b}&u=${u}&type=${type || 'id'}&mods=${mods || ''}`;
  } else {
    return res.status(400).json({ error: 'Endpoint tidak valid.' });
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Gagal mengambil data dari API osu!.' });
  }
}
