export default async function handler(req, res) {
  // 1. CORS 설정 (프론트엔드와 원활한 통신 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. GET 요청 외에는 차단 (Vercel 메모리 리셋 방지용 실시간 스크래핑 방식 채택)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";
  const UNION_LOGIN_URL = "https://asp.unionpos.co.kr/loginCheck"; // 영상에서 찾은 실제 로그인 주소 적용 완료

  // 3. [핵심] 유니온 ASP 실시간 자동 로그인 & 데이터 조회 로직
  async function fetchStoreData(storeName, id, pw) {
    try {
      // (1) 직접 유니온 로그인해서 신선한 쿠키(JSESSIONID) 발급받기
      const loginRes = await fetch(UNION_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
          userId: id,    // 영상에서 찾은 변수명 적용 완료
          userPw: pw     // 영상에서 찾은 변수명 적용 완료
        }) 
      });

      // 발급받은 쿠키 빼오기
      const cookieHeader = loginRes.headers.get('set-cookie') || '';

      // (2) 하진님이 만든 프록시 서버를 통해 '새 쿠키'로 매출 데이터 조회
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
        console.error(`${storeName} JSON 파싱 실패:`, textData);
      }

      // (3) 매출액, 결제건수, 객단가 정제
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
      console.error(`${storeName} API 연동 오류:`, err);
      return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 };
    }
  }

  // 4. Vercel 환경변수에서 지점별 아이디/비번 가져오기 (이름 매칭 완료)
  const gfcId = process.env.GFC_POS_ID;
  const gfcPw = process.env.GFC_POS_PW;
  const yeoksamId = process.env.YEOKSAM_POS_ID;
  const yeoksamPw = process.env.YEOKSAM_POS_PW;

  try {
    // 5. GFC점, 역삼점 데이터를 동시에 긁어와서 처리 속도 2배 향상
    const [gfcData, yeoksamData] = await Promise.all([
      fetchStoreData("솔솥 GFC점", gfcId, gfcPw),
      fetchStoreData("솔솥 역삼점", yeoksamId, yeoksamPw)
    ]);

    // 6. App.jsx 프론트엔드가 정확히 원하는 형태로 최종 조립해서 전송 (CCTV 정보 포함)
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
