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

  // 개별 매장 요청 함수 (유니온 방화벽 회피용 브라우저 헤더 전면 강화)
  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    try {
      if (!cookieValue) {
        console.error(`🚨 [${storeName}] 쿠키(JSESSIONID)가 등록되지 않았습니다.`);
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      console.log(`\n⏳ [${storeName}] 안전 모드로 데이터 조회 중...`);

      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Cookie": `JSESSIONID=${cookieValue}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://asp.unionpos.co.kr/",
          "Accept": "application/json, text/javascript, */*; q=0.01"
        }
      });

      const textData = await salesRes.text();
      console.log(`📦 [${storeName}] 유니온 응답 데이터(앞부분):`, textData.substring(0, 100));

      // 만약 유니온이 HTML(로그인 페이지)을 뱉었다면 차단당한 것이므로 0원 처리하되 충돌 방지
      if (textData.trim().startsWith("<!DOCTYPE") || textData.includes("<html")) {
        console.error(`🚨 [${storeName}] 유니온 보안 방화벽에 의해 쿠키가 거부되었습니다.`);
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      let data = {};
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error(`🚨 [${storeName}] JSON 파싱 실패! 응답 데이터 형식 오류.`);
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      const todaySales = parseInt(data.tot_amt || data.today_sales || data.tot_sale_amt || data.sale_amt || data.MONTH?.UnitAmt || 0, 10);
      const totalCount = parseInt(data.tot_cnt || data.today_cnt || data.sale_cnt || data.cnt || 0, 10);
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      console.log(`✅ [${storeName}] 최종 매출: ${todaySales}원 / ${totalCount}건`);

      return {
        connected: true,
        todaySales: todaySales,
        totalCount: totalCount,
        avgPrice: avgPrice,
      };

    } catch (err) {
      console.error(`❌ [${storeName}] API 연동 오류:`, err);
      return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
    }
  }

  const gfcCookie = process.env.GFC_COOKIE;
  const yeoksamCookie = process.env.YEOKSAM_COOKIE;

  try {
    // 동시 요청 시 유니온이 봇으로 오인하므로 순차적으로 안전하게 호출
    const gfcData = await fetchStoreDataWithCookie("솔솥 GFC점", gfcCookie);
    // 살짝 텀을 주어 방화벽 회피
    await new Promise(resolve => setTimeout(resolve, 500));
    const yeoksamData = await fetchStoreDataWithCookie("솔솥 역삼점", yeoksamCookie);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "success",
      stores: {
        solsot_gfc: { 
          name: "솔솥 GFC점", 
          ...gfcData,
          cctv: { connected: false, url: null } 
        },
        solsot_yeoksam: { 
          name: "솔솥 역삼점", 
          ...yeoksamData,
          cctv: { 
            connected: true, 
            host: "34ea7f.dvrinside.com", 
            port: 8000, 
            rtspUrl: "rtsp://admin@34ea7f.dvrinside.com:8000/ch1/main",
            streamUrl: "http://34ea7f.dvrinside.com:8000" 
          }
        },
        goteat_seolleung: { 
          name: "갓잇 선릉점", 
          connected: false, 
          todaySales: 0, 
          totalCount: 0, 
          avgPrice: 0, 
          note: "12월 중순 오픈 예정" 
        }
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
