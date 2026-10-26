export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  // 🔥 프록시 제거! 유니온소프트 서버와 직접 안전하게 다이렉트 통신
  const BASE_URL = "https://asp.unionpos.co.kr";
  const LOGIN_URL = `${BASE_URL}/loginCheck.do`;
  const DATA_URL = `${BASE_URL}/v2/onday`;

  async function getNewCookie(id, pw) {
    if (!id || !pw) return { cookie: null, error: "환경변수 누락 (Vercel 재배포 필요)" };
    
    try {
      const bodyData = new URLSearchParams({ emp_no: id, emp_pwd: pw, LEVEL: "0" }).toString();
      const loginRes = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0"
        },
        body: bodyData,
        redirect: "manual"
      });

      let cookies = [];
      if (typeof loginRes.headers.getSetCookie === 'function') {
        cookies = loginRes.headers.getSetCookie();
      } else {
        const raw = loginRes.headers.get("set-cookie");
        if (raw) cookies = [raw];
      }

      const combinedCookies = cookies.join("; ");
      const match = combinedCookies.match(/JSESSIONID=([^;]+)/);
      
      if (match) return { cookie: match[1], error: null };
      
      return { cookie: null, error: `쿠키 발급 거부됨 (응답코드: ${loginRes.status})` };
    } catch (err) {
      return { cookie: null, error: `로그인 통신 에러: ${err.message}` };
    }
  }

  async function fetchStoreData(storeName, credentials) {
    const emptyResult = { 
      connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, 
      monthSales: 0, monthCount: 0, prevWeekSales: 0, 
      details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {}, debug_msg: ""
    };

    try {
      // 1. 매번 Vercel 서버 IP로 새로운 쿠키 발급
      const { cookie: freshCookie, error: cookieError } = await getNewCookie(credentials.id, credentials.pw);
      
      if (!freshCookie) {
        emptyResult.debug_msg = cookieError;
        return emptyResult;
      }

      const now = new Date();
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kst.toISOString().split('T')[0]; 
      const prevWeekDate = new Date(kst);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      const prevWeekStr = prevWeekDate.toISOString().split('T')[0];

      // 2. 발급받은 IP 그대로 다이렉트 매출 데이터 요청
      const [salesRes, prevRes] = await Promise.all([
        fetch(DATA_URL, {
          method: "POST",
          headers: { 
            "Cookie": `JSESSIONID=${freshCookie}`, 
            "User-Agent": "Mozilla/5.0", 
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Referer": "https://asp.unionpos.co.kr/"
          },
          body: `sch_date=${todayStr}`
        }),
        fetch(DATA_URL, {
          method: "POST",
          headers: { 
            "Cookie": `JSESSIONID=${freshCookie}`, 
            "User-Agent": "Mozilla/5.0", 
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Referer": "https://asp.unionpos.co.kr/"
          },
          body: `sch_date=${prevWeekStr}`
        })
      ]);

      const textData = await salesRes.text();
      const prevTextData = await prevRes.text();

      let data = {};
      let prevData = {};
      
      try { data = JSON.parse(textData); } catch (e) { emptyResult.debug_msg = "응답 파싱 실패 (세션 끊김)"; return emptyResult; }
      try { prevData = JSON.parse(prevTextData); } catch (e) { prevData = {}; }

      if (!data || Object.keys(data).length === 0) {
        emptyResult.debug_msg = "포스 서버가 빈 데이터를 줌";
        return emptyResult;
      }

      const oneday = data.ONEDAY || {};
      const totalCount = parseInt(oneday.SellCnt || 0, 10);
      const unitAmt = parseFloat(oneday.UnitAmt || 0);
      let todaySales = parseInt(oneday.TotAmt || oneday.ReceiveAmt || 0, 10);
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) todaySales = Math.round(unitAmt * totalCount);
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      const prevOneday = prevData.ONEDAY || {};
      let prevWeekSales = parseInt(prevOneday.TotAmt || prevOneday.ReceiveAmt || 0, 10);
      const prevUnitAmt = parseFloat(prevOneday.UnitAmt || 0);
      const prevCount = parseInt(prevOneday.SellCnt || 0, 10);
      if (prevWeekSales === 0 && prevUnitAmt > 0 && prevCount > 0) prevWeekSales = Math.round(prevUnitAmt * prevCount);

      const month = data.MONTH || {};
      const monthCount = parseInt(month.SellCnt || 0, 10);
      const monthUnitAmt = parseFloat(month.UnitAmt || 0);
      let monthSales = parseInt(month.TotAmt || month.ReceiveAmt || 0, 10);
      if (monthSales === 0 && monthUnitAmt > 0 && monthCount > 0) monthSales = Math.round(monthUnitAmt * monthCount);

      let timeData = {};
      const possibleKeys = Object.keys(data);
      for (const key of possibleKeys) {
        if (key.toLowerCase() === 'time' && typeof data[key] === 'object' && data[key] !== null) {
          timeData = data[key];
          break;
        }
      }

      return {
        connected: true,
        todaySales, totalCount, avgPrice, prevWeekSales, monthSales, monthCount,
        details: {
          cardAmt: parseInt(oneday.CardAmt || 0, 10),
          cashAmt: parseInt(oneday.CashAmt || 0, 10),
          cancelAmt: parseInt(oneday.CancelAmt || 0, 10)
        },
        TIME: timeData,
        debug_msg: "성공"
      };

    } catch (err) {
      emptyResult.debug_msg = `서버 통신 에러: ${err.message}`;
      return emptyResult;
    }
  }

  const credentials = {
    yeoksam: { id: process.env.YEOKSAM_POS_ID, pw: process.env.YEOKSAM_POS_PW },
    gfc: { id: process.env.GFC_POS_ID, pw: process.env.GFC_POS_PW }
  };

  try {
    const [yeoksamData, gfcData] = await Promise.all([
      fetchStoreData("솔솥 역삼점", credentials.yeoksam),
      fetchStoreData("솔솥 GFC점", credentials.gfc)
    ]);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "success",
      stores: {
        solsot_gfc: { name: "솔솥 GFC점", ...gfcData },
        solsot_yeoksam: { name: "솔솥 역삼점", ...yeoksamData },
        goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0, details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {} }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
