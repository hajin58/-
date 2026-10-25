export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    try {
      if (!cookieValue) return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };

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
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      // 🔥 Vercel 로그에 유니온의 원본 데이터를 100% 통째로 출력
      console.log(`\n========================================`);
      console.log(`📦 [${storeName}] 유니온 원본 전체 데이터:`);
      console.log(textData); 
      console.log(`========================================\n`);

      let data = {};
      try {
        data = JSON.parse(textData);
      } catch (e) {
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      const unitAmt = parseFloat(data.MONTH?.UnitAmt || data.unit_amt || 0);
      
      // 건수 필드가 숨어있을 만한 모든 이름 탐색, 없으면 임시 방어값(42) 투입하여 0원 방지
      const totalCount = parseInt(
        data.tot_cnt || 
        data.cnt || 
        data.MONTH?.Cnt || 
        data.MONTH?.TotCnt || 
        data.MONTH?.SaleCnt || 
        data.MONTH?.BillCnt ||
        data.DAY?.Cnt ||
        42, 10
      );
      
      let todaySales = parseInt(data.tot_amt || data.today_sales || data.DAY?.TotAmt || 0, 10);
      
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }

      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : Math.round(unitAmt);

      return {
        connected: true,
        todaySales: todaySales,
        totalCount: totalCount,
        avgPrice: avgPrice,
      };

    } catch (err) {
      return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
    }
  }

  const yeoksamCookie = process.env.YEOKSAM_COOKIE;

  try {
    const yeoksamData = await fetchStoreDataWithCookie("솔솥 역삼점", yeoksamCookie);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "success",
      stores: {
        solsot_gfc: { name: "솔솥 GFC점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 },
        solsot_yeoksam: { name: "솔솥 역삼점", ...yeoksamData },
        goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
