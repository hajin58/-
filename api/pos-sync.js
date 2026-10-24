// 매장별 실시간 데이터를 메모리에 보관
let storeDataCache = {
  solsot_gfc: { name: "솔솥 GFC점", todaySales: 0, totalCount: 0, avgPrice: 0, lastUpdated: null, statusMsg: "대기 중" },
  solsot_yeoksam: { name: "솔솥 역삼점", todaySales: 0, totalCount: 0, avgPrice: 0, lastUpdated: null, statusMsg: "대기 중" }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. POS 단말기에서 데이터를 보내올 때 (POST)
  if (req.method === 'POST') {
    const { storeKey, todaySales, totalCount, avgPrice, timestamp } = req.body;

    if (storeKey && storeDataCache[storeKey]) {
      storeDataCache[storeKey] = {
        ...storeDataCache[storeKey],
        todaySales: parseInt(todaySales || 0, 10),
        totalCount: parseInt(totalCount || 0, 10),
        avgPrice: parseInt(avgPrice || 0, 10),
        lastUpdated: timestamp || new Date().toISOString(),
        statusMsg: "실시간 동기화됨"
      };
      return res.status(200).json({ status: "success", storeKey });
    }
    return res.status(400).json({ error: "Invalid storeKey" });
  }

  // 2. 대시보드 화면에서 조회를 요청할 때 (GET)
  if (req.method === 'GET') {
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      status: "success",
      stores: {
        ...storeDataCache,
        goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, note: "12월 오픈 예정" }
      }
    });
  }
}
