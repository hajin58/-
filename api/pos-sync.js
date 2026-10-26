export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";
  const LOGIN_URL = "https://asp.unionpos.co.kr/loginCheck.do";

  // 💡 1. 자동 로그인 및 진단 로직 추가
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

      // Node.js 최신 환경에서의 안전한 쿠키 추출
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
      
      return { cookie: null, error: `발급 거부됨 (응답코드: ${loginRes.status}, 계정정보 재확인 필요)` };
    } catch (err) {
      return { cookie: null, error: `로그인 통신 에러: ${err.message}` };
    }
  }

  // 💡 2. 데이터 수집 메인 함수
  async function fetchStoreData(storeName, credentials) {
    const emptyResult = { 
      connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, 
      monthSales: 0, monthCount: 0, prevWeekSales: 0, 
      details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {}, debug_msg: ""
    };

    try {
      const { cookie: freshCookie, error: cookieError } = await getNewCookie(credentials.id, credentials.pw);
      
      if (!freshCookie) {
        emptyResult.debug_msg = cookieError; // 실패 원인 기록
        return emptyResult;
      }

      const now = new Date();
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kst.toISOString().split('T')[0]; 
      const prevWeekDate = new Date(kst);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      const prevWeekStr = prevWeekDate.toISOString().split('T')[0];

      const [salesRes, prevRes] = await Promise.all([
        fetch(`${PROXY_URL}/v2/onday`, {
          method: "POST",
          headers: { "Cookie": `JSESSIONID=${freshCookie}`, "User-Agent": "Mozilla/5.0", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body: `sch_date=${todayStr}`
        }),
        fetch(`${PROXY_URL}/v2/onday`, {
          method: "POST",
          headers: { "Cookie": `JSESSIONID=${freshCookie}`, "User-Agent": "Mozilla/5.0", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body: `sch_date=${prevWeekStr}`
        })
      ]);

      const textData = await salesRes.text();
      const prevTextData = await prevRes.text();

      let data = {};
      let prevData = {};
      
      try { data = JSON.parse(textData); } catch (e) { emptyResult.debug_msg = "응답 파싱 실패"; return emptyResult; }
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
