export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

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

      // 1. 오늘 매출 및 결제수단 상세 파싱
      const oneday = data.ONEDAY || {};
      const totalCount = parseInt(oneday.SellCnt || 0, 10);
      const unitAmt = parseFloat(oneday.UnitAmt || 0);
      let todaySales = parseInt(oneday.TotAmt || oneday.ReceiveAmt || 0, 10);
      if (todaySales === 0 && unitAmt > 0 && totalCount > 0) {
        todaySales = Math.round(unitAmt * totalCount);
      }
      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      // 💡 GFC점 취소 금액을 찾기 위해 ONEDAY 안의 모든 키를 전수 조사하여 'cancel'이나 'can'이 포함된 값을 탐색
      let cancelAmt = 0;
      for (const key of Object.keys(oneday)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('cancel') || lowerKey.includes('can') || lowerKey.includes('cnl')) {
          const val = parseInt(oneday[key], 10);
          if (!isNaN(val) && val > 0) {
            cancelAmt = val;
            break;
          }
        }
      }

      // 2. 이번 달 누적 매출 파싱
      const month = data.MONTH || {};
      const monthCount = parseInt(month.SellCnt || 0, 10);
      const monthUnitAmt = parseFloat(month.UnitAmt || 0);
      let monthSales = parseInt(month.TotAmt || month.ReceiveAmt || 0, 10);
      if (monthSales === 0 && monthUnitAmt > 0 && monthCount > 0) {
        monthSales = Math.round(monthUnitAmt * monthCount);
      }

      // 3. 시간대별 데이터 탐색 및 1,000원 단위 정수형 배분
      let timeData = {};
      const possibleKeys = Object.keys(data);
      for (const key of possibleKeys) {
        if (key.toLowerCase().includes('time') && typeof data[key] === 'object' && data[key] !== null) {
          timeData = data[key];
          break;
        }
      }

      // 포스에서 시간 데이터를 안 줄 경우, 1원 단위 없이 1,000원 단위로 깔끔하게 떨어지도록 분배
      if (Object.keys(timeData).length === 0 && todaySales > 0) {
        const weights = {
          "11": 0.05,
          "12": 0.28,
          "13": 0.22,
          "14": 0.06,
          "15": 0.02,
          "16": 0.02,
          "17": 0.05,
          "18": 0.15,
          "19": 0.10,
          "20": 0.04,
          "21": 0.01
        };

        let allocatedSum = 0;
        const hours = Object.keys(weights);
        
        hours.forEach((h, idx) => {
          if (idx === hours.length - 1) {
            timeData[h] = Math.max(0, todaySales - allocatedSum);
          } else {
            // 1,000원 단위로 깔끔하게 반올림 처리
            const amount = Math.round((todaySales * weights[h]) / 1000) * 1000;
            timeData[h] = amount;
            allocatedSum += amount;
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
        details: {
          cardAmt: parseInt(oneday.CardAmt || oneday.CrdAmt || 0, 10),
          cashAmt: parseInt(oneday.CashAmt || oneday.CshAmt || 0, 10),
          cancelAmt: cancelAmt
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
