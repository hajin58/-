export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    const emptyResult = { 
      connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, 
      monthSales: 0, monthCount: 0, prevWeekSales: 0, 
      details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {} 
    };

    try {
      if (!cookieValue) return emptyResult;

      const now = new Date();
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kst.toISOString().split('T')[0]; 

      const prevWeekDate = new Date(kst);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      const prevWeekStr = prevWeekDate.toISOString().split('T')[0];

      const [salesRes, prevRes] = await Promise.all([
        fetch(`${PROXY_URL}/v2/onday`, {
          method: "POST",
          headers: {
            "Cookie": `JSESSIONID=${cookieValue}`,
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://asp.unionpos.co.kr/",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: `sch_date=${todayStr}`
        }),
        fetch(`${PROXY_URL}/v2/onday`, {
          method: "POST",
          headers: {
            "Cookie": `JSESSIONID=${cookieValue}`,
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: `sch_date=${prevWeekStr}`
        })
      ]);

      const textData = await salesRes.text();
      const prevTextData = await prevRes.text();

      let data = {};
      let prevData = {};
      
      try { data = JSON.parse(textData); } catch (e) { return emptyResult; }
      try { prevData = JSON.parse(prevTextData); } catch (e) { prevData = {}; }

      if (!data || Object.keys(data).length === 0) return emptyResult;

      const oneday = data.ONEDAY || {};
      const totalCount = parseInt(oneday.SellCnt || 0, 10);
      const unitAmt = parseFloat(oneday.UnitAmt || 0);
      let todaySales = parseInt(oneday.TotAmt || oneday.ReceiveAmt || 0, 10);
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      const prevOneday = prevData.ONEDAY || {};
      let prevWeekSales = parseInt(prevOneday.TotAmt || prevOneday.ReceiveAmt || 0, 10);
      const prevUnitAmt = parseFloat(prevOneday.UnitAmt || 0);
      const prevCount = parseInt(prevOneday.SellCnt || 0, 10);
      if (prevWeekSales === 0 && prevUnitAmt > 0 && prevCount > 0) {
        prevWeekSales = Math.round(prevUnitAmt * prevCount);
      }

      const month = data.MONTH || {};
      const monthCount = parseInt(month.SellCnt || 0, 10);
      const monthUnitAmt = parseFloat(month.UnitAmt || 0);
      let monthSales = parseInt(month.TotAmt || month.ReceiveAmt || 0, 10);
      if (monthSales === 0 && monthUnitAmt > 0 && monthCount > 0) {
        monthSales = Math.round(monthUnitAmt * monthCount);
      }

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
        TIME: timeData
      };

    } catch (err) {
      return emptyResult;
    }
  }

  // Vercel 환경 변수에서 쿠키 가져오기
  const yeoksamCookie = process.env.YEOKSAM_COOKIE;
  const gfcCookie = process.env.GFC_COOKIE;

  try {
    const [yeoksamData, gfcData] = await Promise.all([
      fetchStoreDataWithCookie("솔솥 역삼점", yeoksamCookie),
      fetchStoreDataWithCookie("솔솥 GFC점", gfcCookie)
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
