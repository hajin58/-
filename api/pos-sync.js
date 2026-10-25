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

  // 🔒 자동 로그인 대신, 브라우저에서 추출한 인증 쿠키를 직접 주입하는 방식
  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    try {
      if (!cookieValue) {
        console.error(`🚨 [${storeName}] 쿠키(JSESSIONID)가 등록되지 않았습니다.`);
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
      }

      console.log(`\n⏳ [${storeName}] 고정 쿠키로 데이터 조회 시도...`);

      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Cookie": `JSESSIONID=${cookieValue}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      const textData = await salesRes.text();
      console.log(`📦 [${storeName}] 유니온 응답 데이터(앞부분):`, textData.substring(0, 100));

      let data = {};
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error(`🚨 [${storeName}] JSON 파싱 실패! 쿠키가 만료되었거나 응답이 이상합니다.`);
      }

      const todaySales = parseInt(data.tot_amt || data.today_sales || data.tot_sale_amt || data.sale_amt || 0, 10);
      const totalCount = parseInt(data.tot_cnt || data.today_cnt || data.sale_cnt || data.cnt || 0, 10);
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      console.log(`✅ [${storeName}] 최종 매출: ${todaySales}원 / ${totalCount}건`);

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

  // Vercel 환경변수에서 지점별 'JSESSIONID 쿠키 값' 가져오기
  const gfcCookie = process.env.GFC_COOKIE;
  const yeoksamCookie = process.env.YEOKSAM_COOKIE;

  try {
    const [gfcData, yeoksamData] = await Promise.all([
      fetchStoreDataWithCookie("솔솥 GFC점", gfcCookie),
      fetchStoreDataWithCookie("솔솥 역삼점", yeoksamCookie)
    ]);

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
