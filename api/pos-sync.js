let storeDataCache = {
  solsot_gfc: { 
    name: "솔솥 GFC점", 
    todaySales: 0, 
    totalCount: 0, 
    avgPrice: 0, 
    lastUpdated: null, 
    statusMsg: "대기 중",
    cctv: { connected: false, url: null }
  },
  solsot_yeoksam: { 
    name: "솔솥 역삼점", 
    todaySales: 0, 
    totalCount: 0, 
    avgPrice: 0, 
    lastUpdated: null, 
    statusMsg: "대기 중",
    cctv: { 
      connected: true, 
      host: "34ea7f.dvrinside.com", 
      port: 8000, 
      channel: 1,
      rtspUrl: "rtsp://admin@34ea7f.dvrinside.com:8000/ch1/main",
      // 웹에서 직접 외부 뷰어로 보거나 HLS 연동용 URL
      streamUrl: "http://34ea7f.dvrinside.com:8000" 
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
