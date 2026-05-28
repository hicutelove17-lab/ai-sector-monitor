export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await response.json();
    const results = data?.quoteResponse?.result ?? [];
    const quotes = {};
    results.forEach(q => {
      quotes[q.symbol] = {
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePct: q.regularMarketChangePercent,
        high: q.regularMarketDayHigh,
        low: q.regularMarketDayLow,
        volume: q.regularMarketVolume
      };
    });
    res.status(200).json({ quotes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
