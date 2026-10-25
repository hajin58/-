export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    try {
      if (!cookieValue) return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0 };

      const now = new Date();
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kst.toISOString().split('T')[0]; 

      // 🔥 전주 동요일 날짜 계산 (7일 전)
      const prevWeekDate = new Date(kst);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      const prevWeekStr = prevWeekDate.toISOString().split('T')[0];

      // 오늘 매출과 전주 동요일 매출을 동시에 요청
      const [salesRes, prevRes] = await Promise.all([
        fetch(`${PROXY_URL}/v2/onday`, {
          method: "POST",
          headers: {
            "Cookie": `JSESSIONID=${cookieValue}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://asp.unionpos.co.kr/",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: `sch_date=${prevWeekStr}`
        })
      ]);

      const textData = await salesRes.text();
      const prevTextData = await prevRes.text();

      if (textData.trim().startsWith("<!DOCTYPE") || textData.includes("<html")) {
        return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0 };
      }

      let data = {};
      let prevData = {};
      try { data = JSON.parse(textData); } catch (e) { data = {}; }
      try { prevData = JSON.parse(prevTextData); } catch (e) { prevData = {}; }

      // 🔥 1. 오늘 매출 (ONEDAY)
      const oneday = data.ONEDAY || {};
      const totalCount = parseInt(oneday.SellCnt || 0, 10);
      const unitAmt = parseFloat(oneday.UnitAmt || 0);
      let todaySales = parseInt(oneday.TotAmt || oneday.ReceiveAmt || 0, 10);
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      // 🔥 2. 전주 동요일 매출
      const prevOneday = prevData.ONEDAY || {};
      let prevWeekSales = parseInt(prevOneday.TotAmt || prevOneday.ReceiveAmt || 0, 10);
      const prevUnitAmt = parseFloat(prevOneday.UnitAmt || 0);
      const prevCount = parseInt(prevOneday.SellCnt || 0, 10);
      if (prevWeekSales === 0 && prevUnitAmt > 0 && prevCount > 0) {
        prevWeekSales = Math.round(prevUnitAmt * prevCount);
      }

      // 🔥 3. 월간 매출 (MONTH)
      const month = data.MONTH || {};
      const monthCount = parseInt(month.SellCnt || 0, 10);
      const monthUnitAmt = parseFloat(month.UnitAmt || 0);
      let monthSales = parseInt(month.TotAmt || month.ReceiveAmt || 0, 10);
      if (monthSales === 0 && monthUnitAmt > 0 && monthCount > 0) {
        monthSales = Math.round(monthUnitAmt * monthCount);
      }

      return {
        connected: true,
        todaySales: todaySales,
        totalCount: totalCount,
        avgPrice: avgPrice,
        prevWeekSales: prevWeekSales, // 전주 동요일 매출 추가
        monthSales: monthSales,
        monthCount: monthCount,
        details: {
          cardAmt: parseInt(oneday.CardAmt || 0, 10),
          cashAmt: parseInt(oneday.CashAmt || 0, 10),
          cancelAmt: parseInt(oneday.CancelAmt || 0, 10)
        }
      };

    } catch (err) {
      return { connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0 };
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
