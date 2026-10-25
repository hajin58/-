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
        console.error(`🚨 [${storeName}] 쿠키(JSESSIONID)가 등록되지 않았습니다.`);
        return { connected: false, todaySales: 0, totalCount: 0, avgProcess: 0 };
      }

      console.log(`\n⏳ [${storeName}] 데이터 조회 중...`);

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
      console.log(`📦 [${storeName}] 유니온 응답 데이터(전체):`, textData);

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

      // 🔥 [일매출 / 월매출 분기 처리]
      // 유니온이 주는 응답 안에서 일일 매출 데이터 배열이나 오늘자 필드가 있는지 탐색
      let todaySales = 0;
      let totalCount = 0;

      // 만약 일별 상세 데이터(예: list, dayList, items 등)가 존재한다면 오늘 날짜 데이터를 매칭
      if (data.list && Array.isArray(data.list)) {
        // 오늘 날짜(YYYY-MM-DD 등)와 일치하는 항목 찾기 시도
        const todayStr = new Date().toISOString().split('T')[0];
        const todayItem = data.list.find(item => item.date === todayStr || item.day === todayStr);
        if (todayItem) {
          todaySales = parseInt(todayItem.tot_amt || todayItem.sale_amt || 0, 10);
          totalCount = parseInt(todayItem.tot_cnt || todayItem.cnt || 0, 10);
        }
      }

      // 만약 위에서 못 찾았거나 단일 필드로 오늘 매출이 온다면
      if (todaySales === 0) {
        todaySales = parseInt(
          data.tot_amt || 
          data.today_sales || 
          data.tot_sale_amt || 
          data.sale_amt || 
          0, 10
        );
      }

      // 여전히 0원이고 MONTH 데이터만 있다면, 월 매출을 보여주거나 그 안의 일별 데이터를 역추적
      if (todaySales === 0 && data.MONTH) {
        // 우선 월 매출 총액이라도 잡아서 확인 (UnitAmt 등)
        todaySales = parseInt(data.MONTH.UnitAmt || data.MONTH.tot_amt || 0, 10);
        totalCount = parseInt(data.MONTH.Cnt || data.MONTH.tot_cnt || 0, 10);
      }

      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      console.log(`✅ [${storeName}] 최종 매칭 매출: ${todaySales}원 / ${totalCount}건`);

      return {
        connected: todaySales > 0 || totalCount > 0,
        todaySales: todaySales,
        totalCount: totalCount,
        avgPrice: avgPrice,
      };

    } catch (err) {
      console.error(`❌ [${storeName}] API 연동 오류:`, err);
      return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
    }
  }

  // GFC점은 잠시 제외하고 역삼점(yeoksamCookie)에만 집중해서 테스트
  const yeoksamCookie = process.env.YEOKSAM_COOKIE;

  try {
    const yeoksamData = await fetchStoreDataWithCookie("솔솥 역삼점", yeoksamCookie);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "success",
      stores: {
        solsot_gfc: { 
          name: "솔솥 GFC점", 
          connected: false, 
          todaySales: 0, 
          totalCount: 0, 
          avgPrice: 0,
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
