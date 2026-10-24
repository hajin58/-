export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const gfcId = process.env.GFC_POS_ID;
  const gfcPw = process.env.GFC_POS_PW;
  const yeoksamId = process.env.YEOKSAM_POS_ID;
  const yeoksamPw = process.env.YEOKSAM_POS_PW;

  // Cloudflare 한국 우회 프록시 서버 주소
  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchUnionStoreData(userId, userPw, storeName) {
    if (!userId || !userPw) {
      return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, statusMsg: "계정미설정" };
    }

    try {
      // 1. Cloudflare 중계 서버를 통해 유니온소프트 로그인 진행
      const loginRes = await fetch(`${PROXY_URL}/login_check.asp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
        },
        body: new URLSearchParams({
          user_id: userId,
          user_pw: userPw
        })
      });

      const cookie = loginRes.headers.get("set-cookie");

      // 2. 당일 매출 데이터 요청
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const salesRes = await fetch(`${PROXY_URL}/sales/today_sales.asp?sale_date=${today}`, {
        headers: {
          "Cookie": cookie || "",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
        }
      });

      const htmlText = await salesRes.text();

      // HTML 내 매출 정규식 파싱
      const salesMatch = htmlText.match(/총매출액?\s*:\s*([\d,]+)/) || htmlText.match(/([\d,]+)원/);
      const countMatch = htmlText.match(/건수?\s*:\s*([\d,]+)/) || htmlText.match(/([\d,]+)건/);

      const todaySales = salesMatch ? parseInt(salesMatch[1].replace(/,/g, ''), 10) : 0;
      const totalCount = countMatch ? parseInt(countMatch[1].replace(/,/g, ''), 10) : 0;
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      return {
        connected: true,
        todaySales: todaySales,
        totalCount: totalCount,
        avgPrice: avgPrice,
        statusMsg: "실시간 동기화됨"
      };

    } catch (err) {
      console.error(`${storeName} 우회 연동 오류:`, err);
      return { 
        connected: true, 
        todaySales: 0, 
        totalCount: 0, 
        avgPrice: 0, 
        statusMsg: "통신 오류" 
      };
    }
  }

  try {
    const [gfcData, yeoksamData] = await Promise.all([
      fetchUnionStoreData(gfcId, gfcPw, "솔솥 GFC점"),
      fetchUnionStoreData(yeoksamId, yeoksamPw, "솔솥 역삼점")
    ]);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "success",
      stores: {
        solsot_gfc: {
          name: "솔솥 GFC점",
          ...gfcData
        },
        solsot_yeoksam: {
          name: "솔솥 역삼점",
          ...yeoksamData
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
