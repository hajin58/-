export default async function handler(req, res) {
  // Vercel 표준 CORS 처리
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchStoreDataWithCookie(cookieValue) {
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

      const response = await fetch(`${PROXY_URL}/v2/onday`, {
        method: "POST",
        headers: {
          "Cookie": `JSESSIONID=${cookieValue}`,
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://asp.unionpos.co.kr/",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: `sch_date=${todayStr}`
      });

      const textData = await response.text();
      let data = {};
      try { 
        data = JSON.parse(textData); 
      } catch (e) { 
        return emptyResult; 
      }

      if (!data || Object.keys(data).length === 0) return emptyResult;

      const oneday = data.ONEDAY || {};
      const totalCount = parseInt(oneday.SellCnt || 0, 10);
      const unitAmt = parseFloat(oneday.UnitAmt || 0);
      let todaySales = parseInt(oneday.TotAmt || oneday.ReceiveAmt || 0, 10);
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

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
        if (key.toLowerCase().includes('time') && typeof data[key] === 'object' && data[key] !== null) {
          timeData = data[key];
          break;
        }
      }

      return {
        connected: true,
        todaySales, 
        totalCount, 
        avgPrice, 
        prevWeekSales: 0, 
        monthSales, 
        monthCount,
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

  const yeoksamCookie = process.env.YEOKSAM_COOKIE;
  const gfcCookie = process.env.GFC_COOKIE;

  try {
    const [yeoksamData, gfcData] = await Promise.all([
      fetchStoreDataWithCookie(yeoksamCookie),
      fetchStoreDataWithCookie(gfcCookie)
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
