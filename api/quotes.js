export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  try {
    // Try v8 chart endpoint per ticker (more reliable)
    const tickerList = symbols.split(',').map(s => s.trim()).filter(Boolean);
    const quotes = {};

    await Promise.allSettled(tickerList.map(async (ticker) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://finance.yahoo.com/',
            'Origin': 'https://finance.yahoo.com'
          }
        });
        const data = await response.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          quotes[ticker] = {
            price: meta.regularMarketPrice,
            change: meta.regularMarketPrice - meta.chartPreviousClose,
            changePct: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
            high: meta.regularMarketDayHigh,
            low: meta.regularMarketDayLow,
            volume: meta.regularMarketVolume
          };
        }
      } catch(e) {}
    }));

    res.status(200).json({ quotes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
