export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const PROXY_URL = "https://tiny-sun-a01d.pastel7074.workers.dev";

  const cookies = {
    solsot_yeoksam: process.env.YEOKSAM_COOKIE || "",
    solsot_gfc: process.env.GFC_COOKIE || "",
    goteat_seolleung: process.env.SEOLLEUNG_COOKIE || ""
  };

  async function fetchStoreData(storeKey, cookieValue) {
    const emptyResult = {
      connected: false,
      todaySales: 0,
      totalCount: 0,
      avgPrice: 0,
      monthSales: 0,
      monthCount: 0,
      prevWeekSales: 0,
      details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 },
      TIME: {}
    };

    if (!cookieValue) return emptyResult;

    try {
      const now = new Date();
      const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const todayStr = kst.toISOString().split('T')[0];
      
      const year = kst.getFullYear();
      const month = String(kst.getMonth() + 1).padStart(2, '0');
      const monthStartStr = `${year}-${month}-01`;

      const prevWeekDate = new Date(kst);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      const prevWeekStr = prevWeekDate.toISOString().split('T')[0];

      const [salesRes, prevRes, monthRes] = await Promise.all([
        fetch(`${PROXY_URL}/v2/onday`, {
          method: "POST",
          headers: {
            "Cookie": `JSESSIONID=${cookieValue}`,
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://asp.unionpos.co.kr/",
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
        }),
        fetch(`${PROXY_URL}/v2/onmonth`, {
          method: "POST",
          headers: {
            "Cookie": `JSESSIONID=${cookieValue}`,
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          },
          body: `sch_sdate=${monthStartStr}&sch_edate=${todayStr}`
        })
      ]);

      if (!salesRes.ok) return emptyResult;

      const textData = await salesRes.text();
      const prevTextData = await prevRes.text();
      const monthTextData = await monthRes.text();

      let data = {}, prevData = {}, monthData = {};
      try { data = JSON.parse(textData); } catch (e) { data = {}; }
      try { prevData = JSON.parse(prevTextData); } catch (e) { prevData = {}; }
      try { monthData = JSON.parse(monthTextData); } catch (e) { monthData = {}; }

      // 1. 당일 데이터 파싱
      const oneday = data.ONEDAY || data.data || data;
      const totalCount = parseInt(oneday.SellCnt || oneday.cnt || oneday.SALE_CNT || 0, 10);
      let todaySales = parseInt(oneday.TotAmt || oneday.totAmt || oneday.saleAmt || oneday.TOT_AMT || 0, 10);
      if (!todaySales && oneday.NetAmt) todaySales = parseInt(oneday.NetAmt, 10);

      const avgPrice = totalCount > 0 ? Math.round(todaySales / totalCount) : 0;

      // 2. 전주 동요일 매출
      const prevOneday = prevData.ONEDAY || prevData.data || prevData;
      const prevWeekSales = parseInt(prevOneday.TotAmt || prevOneday.totAmt || prevOneday.saleAmt || prevOneday.TOT_AMT || 0, 10);

      // 3. 이번 달 누적 매출 파싱 보완 (다양한 키 이름 대응)
      const mObj = monthData.SUMMARY || monthData.ONEDAY || monthData.data || monthData;
      const monthSales = parseInt(mObj.TotAmt || mObj.totAmt || mObj.saleAmt || mObj.TOT_AMT || mObj.SUM_AMT || 0, 10);
      const monthCount = parseInt(mObj.SellCnt || mObj.cnt || mObj.SALE_CNT || mObj.SUM_CNT || 0, 10);

      // 4. 결제 수단별 상세 내역
      const cardAmt = parseInt(oneday.CardAmt || oneday.cardAmt || oneday.CARD_AMT || 0, 10);
      const cashAmt = parseInt(oneday.CashAmt || oneday.cashAmt || oneday.CASH_AMT || 0, 10);
      const cancelAmt = parseInt(oneday.CancelAmt || oneday.cancelAmt || oneday.CANCEL_AMT || 0, 10);

      // 5. 시간대별 데이터 파싱 보완 (다양한 구조 대응)
      let timeObj = data.TIME || data.time || data.TIME_LIST || data.hourList || {};
      if (Array.isArray(data.TIME)) {
        timeObj = {};
        data.TIME.forEach(item => {
          const hourKey = item.Hour || item.time || item.H || item.HOUR;
          const val = item.TotAmt || item.amt || item.Sales || item.TOT_AMT || 0;
          if (hourKey) timeObj[hourKey] = val;
        });
      }

      return {
        connected: true,
        todaySales,
        totalCount,
        avgPrice,
        monthSales,
        monthCount,
        prevWeekSales,
        details: { cardAmt, cashAmt, cancelAmt },
        TIME: timeObj
      };
    } catch (err) {
      console.error(`[${storeKey}] 데이터 동기화 에러:`, err);
      return emptyResult;
    }
  }

  const storesResult = {
    solsot_yeoksam: { name: "솔솥 역삼점", ...(await fetchStoreData('solsot_yeoksam', cookies.solsot_yeoksam)) },
    solsot_gfc: { name: "솔솥 GFC점", ...(await fetchStoreData('solsot_gfc', cookies.solsot_gfc)) },
    goteat_seolleung: { name: "갓잇 선릉점", ...(await fetchStoreData('goteat_seolleung', cookies.goteat_seolleung)) }
  };

  return res.status(200).json({ stores: storesResult });
}
