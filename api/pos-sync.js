export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  async function fetchStoreDataWithCookie(storeName, cookieValue) {
    const result = { 
      connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, 
      monthSales: 0, monthCount: 0, prevWeekSales: 0, 
      details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {},
      _debugHourInfo: ""
    };

    if (!cookieValue) return result;

    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const todayStr = kst.toISOString().split('T')[0];

    // 1. 일일 총괄 매출 데이터 독립 조회 (메인 매출 0원 방지)
    try {
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
      const data = JSON.parse(textData);

      if (data && Object.keys(data).length > 0) {
        result.connected = true;
        const oneday = data.ONEDAY || {};
        result.totalCount = parseInt(oneday.SellCnt || 0, 10);
        const unitAmt = parseFloat(oneday.UnitAmt || 0);
        let todaySales = parseInt(oneday.TotAmt || oneday.ReceiveAmt || 0, 10);
        if (todaySales === 0 && unitAmt > 0 && result.totalCount > 0) {
          todaySales = Math.round(unitAmt * result.totalCount);
        }
        result.todaySales = todaySales;
        result.avgPrice = result.totalCount > 0 ? Math.round(todaySales / result.totalCount) : 0;

        const month = data.MONTH || {};
        result.monthCount = parseInt(month.SellCnt || 0, 10);
        const monthUnitAmt = parseFloat(month.UnitAmt || 0);
        let monthSales = parseInt(month.TotAmt || month.ReceiveAmt || 0, 10);
        if (monthSales === 0 && monthUnitAmt > 0 && result.monthCount > 0) {
          monthSales = Math.round(monthUnitAmt * result.monthCount);
        }
        result.monthSales = monthSales;
      }
    } catch (err) {
      console.error(`${storeName} 일일 매출 수집 실패:`, err);
    }

    // 2. 사장님이 찾으신 진짜 시간대별 GET URL (독립 예외 처리)
    try {
      const hourUrl = `${PROXY_URL}/v2/sales/period/hour?pageNo=1&rangeDate=${todayStr}+%7E+${todayStr}&startDate=${todayStr}&endDate=${todayStr}&SellOrderDate=SELL&pageSize=100`;
      
      const hourRes = await fetch(hourUrl, {
        method: "GET",
        headers: {
          "Cookie": `JSESSIONID=${cookieValue}`,
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://asp.unionpos.co.kr/",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      const hourTextData = await hourRes.text();
      result._debugHourInfo = `길이: ${hourTextData.length}자`;

      let timeData = {};

      // A. JSON 데이터 구조인 경우
      let isJson = false;
      try {
        const hourJson = JSON.parse(hourTextData);
        isJson = true;
        let list = Array.isArray(hourJson) ? hourJson : (hourJson.list || hourJson.data || hourJson.rows || []);
        list.forEach(item => {
          const hStr = String(item.Hour || item.SALE_HOUR || item.hour || item.TIME || item.TIME_STR || item.saleHour || '');
          const h = hStr.replace(/[^0-9]/g, '').substring(0, 2);
          const val = parseInt(String(item.TotAmt || item.REAL_SALE_AMT || item.SalesAmt || item.Amt || item.TotSaleAmt || item.totAmt || 0).replace(/[^0-9]/g, ''), 10);
          if (h && h.length === 2 && !isNaN(val)) {
            timeData[h] = val;
          }
        });
      } catch (e) {
        // JSON이 아닌 HTML 문서인 경우
      }

      // B. 5,000줄짜리 HTML 테이블 구조인 경우 (HTML 태그 직접 파싱)
      if (!isJson && hourTextData) {
        const cleanHtml = hourTextData.replace(/<!--[\s\S]*?-->/g, '');
        const trMatches = cleanHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

        trMatches.forEach(tr => {
          const tdMatches = tr.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi) || [];
          const cells = tdMatches.map(td => td.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim());

          if (cells.length >= 2) {
            let hourFound = null;
            let amountFound = 0;

            for (let i = 0; i < cells.length; i++) {
              const cellStr = cells[i];
              const numMatch = cellStr.match(/^(\d{1,2})(시|:00)?$/);
              if (numMatch && !hourFound) {
                const hNum = parseInt(numMatch[1], 10);
                if (hNum >= 0 && hNum <= 24) {
                  hourFound = String(hNum).padStart(2, '0');
                }
              } else {
                const cleanAmt = cellStr.replace(/,/g, '');
                if (/^\d{4,10}$/.test(cleanAmt) && amountFound === 0) {
                  amountFound = parseInt(cleanAmt, 10);
                }
              }
            }

            if (hourFound && amountFound > 0) {
              timeData[hourFound] = amountFound;
            }
          }
        });
      }

      result.TIME = timeData;

    } catch (err) {
      console.error(`${storeName} 시간대 수집 실패:`, err);
    }

    return result;
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
