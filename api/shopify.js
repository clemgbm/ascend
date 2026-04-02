export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { store, token, endpoint, days } = req.query;

  if (!store || !token || !endpoint) {
    return res.status(400).json({ error: 'Paramètres manquants: store, token, endpoint' });
  }

  const allowed = ['orders', 'products', 'customers', 'orders_history'];
  if (!allowed.includes(endpoint)) {
    return res.status(403).json({ error: 'Endpoint non autorisé' });
  }

  let storeDomain = store.replace(/https?:\/\//, '').replace(/\/+$/, '');
  if (!storeDomain.includes('.myshopify.com')) storeDomain += '.myshopify.com';

  // Durée configurable : 30j par défaut, jusqu'à 365j
  const nbDays = Math.min(parseInt(days) || 30, 365);
  const since = new Date(Date.now() - nbDays * 24 * 60 * 60 * 1000).toISOString();

  // orders_history = orders avec plus de résultats (250 max) pour l'historique long
  const realEndpoint = endpoint === 'orders_history' ? 'orders' : endpoint;
  const limit = endpoint === 'orders_history' ? 250 : 100;

  const url = `https://${storeDomain}/admin/api/2024-01/${realEndpoint}.json?status=any&limit=${limit}&created_at_min=${since}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Shopify error ${response.status}`, detail: text });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
