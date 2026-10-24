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

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchUnionV2StoreData(userId, userPw, storeName) {
    if (!userId || !userPw) {
      return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, statusMsg: "계정미설정" };
    }

    try {
      // 1. 유니온소프트 로그인 처리 (세션 쿠키 발급)
      const loginRes = await fetch(`${PROXY_URL}/login_check.asp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: new URLSearchParams({ user_id: userId, user_pw: userPw })
      });

      const rawCookie = loginRes.headers.get("set-cookie") || "";
      const jsessionidMatch = rawCookie.match(/JSESSIONID=([^;]+)/);
      const cookieHeader = jsessionidMatch ? `JSESSIONID=${jsessionidMatch[1]}` : rawCookie;

      // 2. v2/onday API 호출 (JSON 응답 수신)
      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": cookieHeader,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: JSON.stringify({ timing: "now" })
      });

      const data = await salesRes.json();

      // v2 API JSON 응답 데이터 매핑
      const todaySales = parseInt(data.tot_amt || data.today_sales || data.tot_sale_amt || 0, 10);
      const totalCount = parseInt(data.tot_cnt || data.today_cnt || data.sale_cnt || 0, 10);
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
      fetchUnionV2StoreData(gfcId, gfcPw, "솔솥 GFC점"),
      fetchUnionV2StoreData(yeoksamId, yeoksamPw, "솔솥 역삼점")
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
