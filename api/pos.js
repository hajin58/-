export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  // Vercel 환경변수가 지정되어 있으면 우선 사용하고, 없으면 현재 활성화된 브라우저 쿠키 사용
  const gfcCookie = process.env.GFC_COOKIE || "JSESSIONID=BEB1063E48E03FA7EAF89D5DAEBE5FE0";
  const yeoksamCookie = process.env.YEOKSAM_COOKIE || "JSESSIONID=BEB1063E48E03FA7EAF89D5DAEBE5FE0";

  async function fetchUnionV2WithCookie(cookieValue, storeName) {
    try {
      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Cookie": cookieValue,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      const textData = await salesRes.text();
      let data = {};
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error(`${storeName} 응답 파싱 실패:`, textData);
      }

      const todaySales = parseInt(data.tot_amt || data.today_sales || data.tot_sale_amt || data.sale_amt || 0, 10);
      const totalCount = parseInt(data.tot_cnt || data.today_cnt || data.sale_cnt || data.cnt || 0, 10);
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      return {
        connected: true,
        todaySales: todaySales,
        totalCount: totalCount,
        avgPrice: avgPrice,
        statusMsg: "실시간 동기화됨"
      };

    } catch (err) {
      console.error(`${storeName} v2 연동 오류:`, err);
      return { connected: true, todaySales: 0, totalCount: 0, avgPrice: 0, statusMsg: "통신 오류" };
    }
  }

  try {
    const [gfcData, yeoksamData] = await Promise.all([
      fetchUnionV2WithCookie(gfcCookie, "솔솥 GFC점"),
      fetchUnionV2WithCookie(yeoksamCookie, "솔솥 역삼점")
    ]);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "success",
      stores: {
        solsot_gfc: { name: "솔솥 GFC점", ...gfcData },
        solsot_yeoksam: { name: "솔솥 역삼점", ...yeoksamData },
        goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, note: "12월 오픈 예정" }
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
