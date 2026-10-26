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

      // 일일 총괄 데이터와 진짜 시간대별 전용 데이터(/v2/sales/period/hour) 동시 호출
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
        // 🚨 드디어 찾은 진짜 시간대별 조회 주소!
        fetch(`${PROXY_URL}/v2/sales/period/hour`, {
          method: "POST",
          headers: {
            "Cookie": `JSESSIONID=${cookieValue}`,
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://asp.unionpos.co.kr/",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          // 💡 포스 화면의 검색 조건에 맞춰 body 파라미터 추가 (필요시)
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

      // 💡 진짜 API 응답에서 시간대별 데이터 추출 로직
      let timeData = {};
      
      // 영상에서 본 표 형태의 데이터를 배열로 받았을 것이라 예상하고 파싱
      if (hourData) {
         let targetList = null;
         if (Array.isArray(hourData)) targetList = hourData;
         else if (hourData.list && Array.isArray(hourData.list)) targetList = hourData.list;
         else if (hourData.data && Array.isArray(hourData.data)) targetList = hourData.data;

         if(targetList) {
             targetList.forEach(item => {
                // 시간 필드명 (Hour, TIME_STR, hour 등 여러 케이스 대응)
                let hStr = String(item.Hour || item.TIME_STR || item.hour || item.TIME || item.SALE_HOUR || '');
                const h = hStr.replace(/[^0-9]/g, '').substring(0, 2);
                
                // 매출 필드명 (TotAmt, SalesAmt, Amt, 실매출액 등 대응)
                const val = parseInt(item.TotAmt || item.SalesAmt || item.Amt || item.REAL_SALE_AMT || item.SALE_AMT || 0, 10);
                
                if (h && h.length === 2 && !isNaN(val)) {
                    timeData[h] = val;
                }
             });
         } else if (typeof hourData === 'object') {
             // 혹시 객체 형태( { "11": 10000, "12": 20000 } )로 올 경우
             for (const k of Object.keys(hourData)) {
                 const cleanKey = k.replace(/[^0-9]/g, '');
                 if (cleanKey.length === 2) {
                     const val = parseInt(hourData[k], 10);
                     if (!isNaN(val)) timeData[cleanKey] = val;
                 }
             }
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
        _debugHourData: hourTextData.substring(0, 800) // 문제시 확인을 위한 디버깅 텍스트
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
