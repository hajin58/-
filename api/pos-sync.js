export default async function handler(req, res) {
  // CORS 설정 (프론트엔드와 통신 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 요청 외에는 차단
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";
  const UNION_LOGIN_URL = "https://asp.unionpos.co.kr/로그인_실제_주소"; // 🚨 나중에 네트워크 탭에서 확인한 주소로 변경

  // [핵심 로직] 유니온 ASP 자동 로그인 후 데이터 긁어오기
  async function fetchStoreData(storeName, userId, userPw) {
    try {
      // 1. 직접 유니온 로그인해서 새로운 쿠키(JSESSIONID) 발급받기
      const loginRes = await fetch(UNION_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id: userId, password: userPw }) 
      });

      // 발급받은 쿠키 빼오기
      const cookieHeader = loginRes.headers.get('set-cookie') || '';

      // 2. 하진님이 만든 프록시를 통해 '새 쿠키'로 매출 데이터 조회
      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Cookie": cookieHeader,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      const textData = await salesRes.text();
      let data = {};
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error(`${storeName} 파싱 실패:`, textData);
      }

      const todaySales = parseInt(data.tot_amt || data.today_sales || data.tot_sale_amt || data.sale_amt || 0, 10);
      const totalCount = parseInt(data.tot_cnt || data.today_cnt || data.sale_cnt || data.cnt || 0, 10);
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      return {
        connected: true,
        todaySales: todaySales,
        totalCount: totalCount,
        avgPrice: avgPrice,
      };

    } catch (err) {
      console.error(`${storeName} 연동 오류:`, err);
      return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
    }
  }

  // 환경변수에서 구글 드라이브 엑셀에 있던 아이디/비번 가져오기
  const gfcId = process.env.UNION_GFC_ID;
  const gfcPw = process.env.UNION_GFC_PW;
  const yeoksamId = process.env.UNION_YEOKSAM_ID;
  const yeoksamPw = process.env.UNION_YEOKSAM_PW;

  try {
    // 3. GFC점, 역삼점 데이터를 동시에(병렬) 긁어와서 로딩 속도 단축
    const [gfcData, yeoksamData] = await Promise.all([
      fetchStoreData("솔솥 GFC점", gfcId, gfcPw),
      fetchStoreData("솔솥 역삼점", yeoksamId, yeoksamPw)
    ]);

    // 4. App.jsx 프론트엔드가 정확히 원하는 형태로 조립해서 보내기 (CCTV 정보 포함)
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
          note: "12월 오픈 예정" 
        }
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
