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

      // 1. 일일 총괄 POST 호출 & 2. 사장님이 찾으신 진짜 시간대별 GET 호출
      const hourParams = new URLSearchParams({
        pageNo: '1',
        rangeDate: `${todayStr} ~ ${todayStr}`,
        startDate: todayStr,
        endDate: todayStr,
        SellOrderDate: 'SELL',
        pageSize: '100'
      }).toString();

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
        // 🔥 진짜 시간대별 엔드포인트 호출 (GET 방식 + 쿼리 파라미터)
        fetch(`${PROXY_URL}/v2/sales/period/hour?${hourParams}`, {
          method: "GET",
          headers: {
            "Cookie": `JSESSIONID=${cookieValue}`,
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://asp.unionpos.co.kr/",
            "Accept": "application/json, text/javascript, */*; q=0.01"
          }
        })
      ]);

      const textData = await salesRes.text();
      const hourTextData = await hourRes.text();

      let data = {};
      try { data = JSON.parse(textData); } catch (e) { return emptyResult; }

      if (!data || Object.keys(data).length === 0) return emptyResult;

      // 일일 총괄 파싱
      const oneday = data.ONEDAY || {};
      const totalCount = parseInt(oneday.SellCnt || 0, 10);
      const unitAmt = parseFloat(oneday.UnitAmt || 0);
      let todaySales = parseInt(oneday.TotAmt || oneday.ReceiveAmt || 0, 10);
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      // 이번 달 누적 파싱
      const month = data.MONTH || {};
      const monthCount = parseInt(month.SellCnt || 0, 10);
      const monthUnitAmt = parseFloat(month.UnitAmt || 0);
      let monthSales = parseInt(month.TotAmt || month.ReceiveAmt || 0, 10);
      if (monthSales === 0 && monthUnitAmt > 0 && monthCount > 0) {
        monthSales = Math.round(monthUnitAmt * monthCount);
      }

      // 💡 시간대별 데이터 파싱 (JSON 및 HTML 규격 모두 자동 추출 대응)
      let timeData = {};

      try {
        const hourJson = JSON.parse(hourTextData);
        let list = Array.isArray(hourJson) 
          ? hourJson 
          : (hourJson.list || hourJson.data || hourJson.rows || []);

        list.forEach(item => {
          const hStr = String(item.Hour || item.SALE_HOUR || item.hour || item.TIME || item.TIME_STR || item.saleHour || '');
          const h = hStr.replace(/[^0-9]/g, '').substring(0, 2);
          const val = parseInt(String(item.TotAmt || item.REAL_SALE_AMT || item.SalesAmt || item.Amt || item.TotSaleAmt || item.totAmt || 0).replace(/[^0-9]/g, ''), 10);
          
          if (h && h.length === 2 && !isNaN(val)) {
            timeData[h] = (timeData[h] || 0) + val;
          }
        });
      } catch (e) {
        // 응답 데이터가 HTML 테이블 형태로 넘어왔을 경우 정규식 파싱
        const trMatches = hourTextData.match(/<tr[\s\S]*?<\/tr>/gi) || [];
        trMatches.forEach(tr => {
          const tdValues = (tr.match(/<td[\s\S]*?<\/td>/gi) || []).map(td => td.replace(/<[^>]+>/g, '').trim());
          if (tdValues.length >= 2) {
            const possibleHour = tdValues[0].replace(/[^0-9]/g, '').substring(0, 2);
            const possibleAmt = parseInt(tdValues[1].replace(/[^0-9]/g, ''), 10);
            if (possibleHour && possibleHour.length === 2 && !isNaN(possibleAmt)) {
              timeData[possibleHour] = possibleAmt;
            }
          }
        });
      }

      return {
        connected: true,
        todaySales, 
        totalCount, 
        avgPrice, 
        prevWeekSales: 0, 
        monthSales, 
        monthCount,
        details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 },
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
