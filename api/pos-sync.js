export default async function handler(req, res) {
  // CORS 설정 (프론트엔드와 원활한 통신 허용)
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
  const UNION_LOGIN_URL = "https://asp.unionpos.co.kr/loginCheck"; 

  // [핵심] 유니온 ASP 실시간 자동 로그인 & 데이터 조회 로직
  async function fetchStoreData(storeName, id, pw) {
    try {
      console.log(`\n⏳ [${storeName}] 로그인 시도 중... (ID: ${id})`);

      // (1) 직접 유니온 로그인해서 신선한 쿠키(JSESSIONID) 발급받기
      const loginRes = await fetch(UNION_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 
          userId: id,    
          userPw: pw     
        }),
        redirect: 'manual' // 🔥 강제 이동을 막고 로그인 인증 쿠키만 낚아채는 필수 옵션!
      });

      // 발급받은 쿠키 빼오기
      const cookieHeader = loginRes.headers.get('set-cookie') || '';
      console.log(`🍪 [${storeName}] 받아온 쿠키:`, cookieHeader ? "성공!" : "실패(쿠키 없음)");

      // (2) 프록시 서버를 통해 '새 쿠키'로 매출 데이터 조회
      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Cookie": cookieHeader,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      const textData = await salesRes.text();
      console.log(`📦 [${storeName}] 유니온 응답 데이터(앞부분):`, textData.substring(0, 100));

      let data = {};
      try {
        data = JSON.parse(textData);
      } catch (e) {
        console.error(`🚨 [${storeName}] JSON 파싱 실패! 응답이 이상합니다.`);
      }

      // (3) 매출액, 결제건수, 객단가 정제
      const todaySales = parseInt(data.tot_amt || data.today_sales || data.tot_sale_amt || data.sale_amt || 0, 10);
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

  // Vercel 환경변수에서 지점별 아이디/비번 가져오기
  const gfcId = process.env.GFC_POS_ID;
  const gfcPw = process.env.GFC_POS_PW;
  const yeoksamId = process.env.YEOKSAM_POS_ID;
  const yeoksamPw = process.env.YEOKSAM_POS_PW;

  try {
    // GFC점, 역삼점 데이터를 동시에 긁어와서 조립
    const [gfcData, yeoksamData] = await Promise.all([
      fetchStoreData("솔솥 GFC점", gfcId, gfcPw),
      fetchStoreData("솔솥 역삼점", yeoksamId, yeoksamPw)
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
