export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    try {
      if (!cookieValue) return { connected: false, todaySales: 0, totalCount: 0, rawData: "쿠키 없음" };

      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Cookie": `JSESSIONID=${cookieValue}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://asp.unionpos.co.kr/",
          "Accept": "application/json, text/javascript, */*; q=0.01"
        }
      });

      const textData = await salesRes.text();
      
      if (textData.trim().startsWith("<!DOCTYPE") || textData.includes("<html")) {
        return { connected: false, todaySales: 0, totalCount: 0, rawData: "방화벽 차단됨" };
      }

      let data = {};
      try {
        data = JSON.parse(textData);
      } catch (e) {
        return { connected: false, todaySales: 0, totalCount: 0, rawData: "JSON 파싱 실패", text: textData };
      }

      // 화면에 유니온 원본 데이터를 통째로 띄우기 위해 debug_raw_data에 할당
      return {
        connected: true,
        todaySales: 0, 
        totalCount: 0,
        debug_raw_data: data 
      };

    } catch (err) {
      return { connected: false, todaySales: 0, totalCount: 0, error: err.message };
    }
  }

  const yeoksamCookie = process.env.YEOKSAM_COOKIE;

  try {
    const yeoksamData = await fetchStoreDataWithCookie("솔솥 역삼점", yeoksamCookie);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "success",
      stores: {
        solsot_yeoksam: { name: "솔솥 역삼점", ...yeoksamData }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
