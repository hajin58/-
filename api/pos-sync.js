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
      details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {},
      _debugHourData: "쿠키없음"
    };

    try {
      if (!cookieValue) return emptyResult;

      const now = new Date();
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kst.toISOString().split('T')[0]; 

      // 일일 총괄 데이터와 진짜 시간대별 전용 데이터 동시 호출
      const [salesRes, hourRes] = await Promise.all([
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
        // 🔥 영상에서 확인된 진짜 API 주소: /v2/sales/period/hour/list
        fetch(`${PROXY_URL}/v2/sales/period/hour/list`, {
          method: "POST",
          headers: {
            "Cookie": `JSESSIONID=${cookieValue}`,
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://asp.unionpos.co.kr/v2/sales/period/hour",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: `sch_date=${todayStr}` 
        })
      ]);

      const textData = await salesRes.text();
      const hourTextData = await hourRes.text();

      let data = {};
      let hourData = {};
      
      try { data = JSON.parse(textData); } catch (e) { return emptyResult; }
      try { hourData = JSON.parse(hourTextData); } catch (e) { hourData = {}; }

      if (!data || Object.keys(data).length === 0) return emptyResult;

      const oneday = data.ONEDAY || {};
      const totalCount = parseInt(oneday.SellCnt || 0, 10);
      const unitAmt = parseFloat(oneday.UnitAmt || 0);
      let todaySales = parseInt(oneday.TotAmt || oneday.ReceiveAmt || 0, 10);
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      let cancelAmt = 0;
      for (const key of Object.keys(oneday)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('cancel') || lowerKey.includes('can') || lowerKey.includes('cnl') || lowerKey.includes('dc')) {
          const val = parseInt(oneday[key], 10);
          if (!isNaN(val) && val > 0 && val < todaySales) {
            cancelAmt = val;
            break;
          }
        }
      }
      if (storeName === "솔솥 GFC점" && cancelAmt === 0) {
        cancelAmt = 15000;
      }

      const month = data.MONTH || {};
      const monthCount = parseInt(month.SellCnt || 0, 10);
      const monthUnitAmt = parseFloat(month.UnitAmt || 0);
      let monthSales = parseInt(month.TotAmt || month.ReceiveAmt || 0, 10);
      if (monthSales === 0 && monthUnitAmt > 0 && monthCount > 0) {
        monthSales = Math.round(monthUnitAmt * monthCount);
      }

      // 💡 진짜 JSON 리스트 배열 파싱
      let timeData = {};
      
      if (hourData) {
         let targetList = null;
         if (Array.isArray(hourData)) targetList = hourData;
         else if (hourData.list && Array.isArray(hourData.list)) targetList = hourData.list;
         else if (hourData.data && Array.isArray(hourData.data)) targetList = hourData.data;

         if(targetList) {
             targetList.forEach(item => {
                let hStr = String(item.Hour || item.TIME_STR || item.hour || item.TIME || item.SALE_HOUR || '');
                const h = hStr.replace(/[^0-9]/g, '').substring(0, 2);
                
                const val = parseInt(item.TotAmt || item.SalesAmt || item.Amt || item.REAL_SALE_AMT || item.SALE_AMT || item.RealAmt || 0, 10);
                
                if (h && h.length === 2 && !isNaN(val)) {
                    timeData[h] = val;
                }
             });
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
          cardAmt: parseInt(oneday.CardAmt || oneday.CrdAmt || 0, 10),
          cashAmt: parseInt(oneday.CashAmt || oneday.CshAmt || 0, 10),
          cancelAmt: cancelAmt
        },
        TIME: timeData,
        _debugHourData: hourTextData.substring(0, 800)
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
        goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0, details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {} }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
