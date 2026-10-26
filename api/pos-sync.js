export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    const emptyResult = { 
      connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, 
      monthSales: 0, monthCount: 0, prevWeekSales: 0 
    };

    try {
      if (!cookieValue) return emptyResult;

      // 한국 시간 KST 기준 오늘 날짜 계산 (YYYY-MM-DD)
      const now = new Date();
      const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kstTime.toISOString().split('T')[0]; 

      const salesRes = await fetch(`${PROXY_URL}/v2/onday`, {
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

      const textData = await salesRes.text();
      let data = {};
      try { data = JSON.parse(textData); } catch (e) { return emptyResult; }

      if (!data || Object.keys(data).length === 0) return emptyResult;

      // 1. 오늘 매출 파싱
      const oneday = data.ONEDAY || {};
      const totalCount = parseInt(oneday.SellCnt || oneday.sell_cnt || 0, 10);
      const unitAmt = parseFloat(oneday.UnitAmt || oneday.unit_amt || 0);
      let todaySales = parseInt(oneday.TotAmt || oneday.TotSaleAmt || oneday.ReceiveAmt || 0, 10);
      
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      // 2. 이번 달 누적 매출 파싱
      const month = data.MONTH || {};
      const monthCount = parseInt(month.SellCnt || month.sell_cnt || 0, 10);
      const monthUnitAmt = parseFloat(month.UnitAmt || month.unit_amt || 0);
      let monthSales = parseInt(month.TotAmt || month.TotSaleAmt || month.ReceiveAmt || 0, 10);
      
      if (monthSales === 0 && monthUnitAmt > 0 && monthCount > 0) {
        monthSales = Math.round(monthUnitAmt * monthCount);
      }

      return {
        connected: true,
        todaySales, 
        totalCount, 
        avgPrice, 
        prevWeekSales: 0, 
        monthSales, 
        monthCount
      };

    } catch (err) {
      return emptyResult;
    }
  }

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
        goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0 }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
