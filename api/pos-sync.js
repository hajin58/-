export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    try {
      if (!cookieValue) {
        console.error(`🚨 [${storeName}] 쿠키가 없습니다.`);
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      console.log(`\n⏳ [${storeName}] 우회 접속 시도 중...`);

      // 🔥 방화벽 차단을 피하기 위해 유니온이 요구하는 표준 브라우저 헤더 전면 장착
      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Cookie": `JSESSIONID=${cookieValue}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://asp.unionpos.co.kr/main",
          "Origin": "https://asp.unionpos.co.kr",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
      });

      const textData = await salesRes.text();
      console.log(`📦 [${storeName}] 응답 결과(앞부분):`, textData.substring(0, 100));

      if (textData.trim().startsWith("<!DOCTYPE") || textData.includes("<html")) {
        console.error(`🚨 [${storeName}] 유니온 방화벽이 여전히 차단 중입니다.`);
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      let data = {};
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error(`🚨 [${storeName}] JSON 파싱 실패`);
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      const unitAmt = parseFloat(data.MONTH?.UnitAmt || data.unit_amt || 0);
      const totalCount = parseInt(data.tot_cnt || data.cnt || data.MONTH?.Cnt || 0, 10);
      
      let todaySales = parseInt(data.tot_amt || data.today_sales || 0, 10);
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }

      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : Math.round(unitAmt);

      console.log(`✅ [${storeName}] 정상 데이터 획득: 매출 ${todaySales}원 / 건수 ${totalCount}건`);

      return {
        connected: true,
        todaySales: todaySales,
        totalCount: totalCount,
        avgPrice: avgPrice,
      };

    } catch (err) {
      console.error(`❌ [${storeName}] 통신 에러:`, err);
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
