export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { store, token, endpoint } = req.query;
  if (!store || !token || !endpoint) return res.status(400).json({ error: 'Paramètres manquants' });
  const allowed = ['orders', 'products'];
  if (!allowed.includes(endpoint)) return res.status(403).json({ error: 'Non autorisé' });
  let storeDomain = store.replace(/https?:\/\//, '').replace(/\/+$/, '');
  if (!storeDomain.includes('.myshopify.com')) storeDomain += '.myshopify.com';
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const url = `https://${storeDomain}/admin/api/2024-01/${endpoint}.json?status=any&limit=100&created_at_min=${since}`;
  try {
    const response = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!response.ok) return res.status(response.status).json({ error: 'Shopify error ' + response.status });
    return res.status(200).json(await response.json());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
