const RSS_SOURCES = [
  { name: 'Reuters Tech', url: 'https://feeds.reuters.com/reuters/technologyNews' },
  { name: 'SEC Filings',  url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=10&search_text=&output=atom' },
  { name: 'Benzinga',     url: 'https://www.benzinga.com/feed' },
];

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] || match[2];
    const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1] ?? '';
    const link  = (block.match(/<link[^>]*href="([^"]+)"/) || block.match(/<link[^>]*>(.*?)<\/link>/) || [])[1] ?? '';
    const date  = (block.match(/<pubDate>(.*?)<\/pubDate>/) || block.match(/<updated>(.*?)<\/updated>/) || [])[1] ?? '';
    if (title) items.push({ title: title.trim(), link: link.trim(), date: date.trim() });
  }
  return items.slice(0, 5);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async src => {
      const r = await fetch(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000)
      });
      const xml = await r.text();
      return { source: src.name, items: parseRSS(xml) };
    })
  );

  const news = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  res.status(200).json({ news });
}
