import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, TrendingUp, Users, Camera, 
  CreditCard, RefreshCw, CheckCircle2, 
  Clock, AlertTriangle, Lock, KeyRound, ExternalLink, Video,
  X, ChevronRight, BarChart3, Sparkles, ArrowUpRight, ArrowDownRight, Minus, Activity, ShieldCheck
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isCheckingIp, setIsCheckingIp] = useState(true);

  const MASTER_PASSWORD = "821125";

  const ALLOWED_IPS = {
    '115.136.113.62': '사장님 환영합니다.',
    '106.101.78.34': '안하진님 환영합니다.',
    '39.7.28.242': '박지현 사장님 환영합니다.',
    '106.101.202.102': '박지현 사장님 환영합니다.',
    '106.101.203.145': '박지현 사장님 환영합니다.',
    '106.101.196.115': '안민호 사장님 환영합니다.',
    '106.101.211.245': '안민호 사장님 환영합니다.',
    '106.101.91.20': '안세영님 환영합니다.'
  };

  useEffect(() => {
    const checkUserIp = async () => {
      if (sessionStorage.getItem('dearspoon_auth') === 'true') {
        setIsAuthenticated(true);
        setIsCheckingIp(false);
        return;
      }

      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        const clientIp = data.ip;

        if (ALLOWED_IPS[clientIp]) {
          setWelcomeMessage(ALLOWED_IPS[clientIp]);
          setIsAuthenticated(true);
          sessionStorage.setItem('dearspoon_auth', 'true');
        }
      } catch (err) {
        console.error("IP 확인 실패:", err);
      } finally {
        setIsCheckingIp(false);
      }
    };

    checkUserIp();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === MASTER_PASSWORD) {
      sessionStorage.setItem('dearspoon_auth', 'true');
      setIsAuthenticated(true);
      setErrorMessage('');
    } else {
      setErrorMessage('비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dearspoon_auth');
    setIsAuthenticated(false);
    setWelcomeMessage('');
    window.location.reload();
  };

  if (isCheckingIp) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
          <p className="text-xs text-slate-400 tracking-wider">보안 네트워크 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-amber-400/10 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">디어스푼 관제 시스템</h1>
            <p className="text-xs text-slate-400 mt-1">통합 매장 실시간 경영 관리 포털</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold">관리자 비밀번호 (6자리)</label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3.5 pl-11 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all tracking-widest text-lg font-mono shadow-inner"
                  autoFocus
                  maxLength={6}
                />
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-4" />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 animate-shake">
                <span className="shrink-0">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25 active:scale-[0.99]"
            >
              안전 접속 승인
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-800/80 pt-5">
            <p className="text-[11px] text-slate-500 font-medium">
              솔솥 GFC · 역삼 · 갓잇 선릉 통합 관제
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <MainDashboardContent onLogout={handleLogout} welcomeMessage={welcomeMessage} />;
}

function MainDashboardContent({ onLogout, welcomeMessage }) {
  const [selectedStore, setSelectedStore] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [posData, setPosData] = useState({
    solsot_gfc: { name: "솔솥 GFC점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0, details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {} },
    solsot_yeoksam: { name: "솔솥 역삼점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0, details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {} },
    goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0, details: { cardAmt: 0, cashAmt: 0, cancelAmt: 0 }, TIME: {} }
  });

  const fetchPosData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos-sync');
      if (res.ok) {
        const data = await res.json();
        if (data.stores) {
          setPosData(data.stores);
        }
      }
    } catch (err) {
      console.error("POS 데이터 수집 실패:", err);
    } finally {
      setLoading(false);
      const now = new Date();
      setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }
  };

  useEffect(() => {
    fetchPosData();
    const interval = setInterval(fetchPosData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getCalculatedData = () => {
    if (selectedStore === 'solsot_gfc') return posData.solsot_gfc;
    if (selectedStore === 'solsot_yeoksam') return posData.solsot_yeoksam;
    if (selectedStore === 'goteat_seolleung') return posData.goteat_seolleung;
    
    const totalSales = (posData.solsot_gfc?.todaySales || 0) + (posData.solsot_yeoksam?.todaySales || 0);
    const totalCount = (posData.solsot_gfc?.totalCount || 0) + (posData.solsot_yeoksam?.totalCount || 0);
    const avgPrice = totalCount > 0 ? Math.round(totalSales / totalCount) : 0;
    
    const totalMonthSales = (posData.solsot_gfc?.monthSales || 0) + (posData.solsot_yeoksam?.monthSales || 0);
    const totalMonthCount = (posData.solsot_gfc?.monthCount || 0) + (posData.solsot_yeoksam?.monthCount || 0);
    const totalPrevWeekSales = (posData.solsot_gfc?.prevWeekSales || 0) + (posData.solsot_yeoksam?.prevWeekSales || 0);

    const totalCardAmt = (posData.solsot_gfc?.details?.cardAmt || 0) + (posData.solsot_yeoksam?.details?.cardAmt || 0);
    const totalCashAmt = (posData.solsot_gfc?.details?.cashAmt || 0) + (posData.solsot_yeoksam?.details?.cashAmt || 0);
    const totalCancelAmt = (posData.solsot_gfc?.details?.cancelAmt || 0) + (posData.solsot_yeoksam?.details?.cancelAmt || 0);

    return {
      name: "전체 매장 합산",
      connected: posData.solsot_gfc?.connected && posData.solsot_yeoksam?.connected,
      todaySales: totalSales,
      totalCount: totalCount,
      avgPrice: avgPrice,
      prevWeekSales: totalPrevWeekSales,
      monthSales: totalMonthSales,
      monthCount: totalMonthCount,
      details: {
        cardAmt: totalCardAmt,
        cashAmt: totalCashAmt,
        cancelAmt: totalCancelAmt
      }
    };
  };

  const currentDisplay = getCalculatedData();
  const accumulatedAvgPrice = currentDisplay?.monthCount > 0 
    ? Math.round(currentDisplay.monthSales / currentDisplay.monthCount) 
    : 0;

  const getGrowthRate = (current, prev) => {
    if (!prev || prev === 0) return null;
    const diff = ((current - prev) / prev) * 100;
    return {
      percent: diff.toFixed(1),
      isUp: diff > 0,
      isZero: diff === 0
    };
  };

  const growth = getGrowthRate(currentDisplay?.todaySales, currentDisplay?.prevWeekSales);
  const currentMonthName = `${new Date().getMonth() + 1}월`;

  
  // 🔥 유연하게 시간대별 데이터를 파싱하는 로직
  const timeChartData = useMemo(() => {
    const defaultHours = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
    let hourData = {};

    defaultHours.forEach(h => {
      hourData[h] = { solsot_yeoksam: 0, solsot_gfc: 0, goteat_seolleung: 0, total: 0 };
    });

    const processTimeData = (storeId, storeData) => {
      const timeObj = storeData?.TIME || {}; 
      Object.keys(timeObj).forEach(key => {
        const hour = key.replace(/[^0-9]/g, '').substring(0, 2); 
        if (defaultHours.includes(hour)) {
          const amount = parseInt(timeObj[key] || 0, 10);
          hourData[hour][storeId] += amount;
          hourData[hour].total += amount;
        }
      });
    };

    if (selectedStore === 'all') {
      processTimeData('solsot_yeoksam', posData.solsot_yeoksam);
      processTimeData('solsot_gfc', posData.solsot_gfc);
      processTimeData('goteat_seolleung', posData.goteat_seolleung);
    } else {
      processTimeData(selectedStore, posData[selectedStore]);
    }

    const chartArray = defaultHours.map(hour => ({
      hour: `${hour}시`,
      ...hourData[hour]
    }));

    const maxSales = Math.max(...chartArray.map(d => d.total), 1);

    return { chartArray, maxSales };
  }, [posData, selectedStore]);

    if (selectedStore === 'all') {
      processTimeData('solsot_yeoksam', posData.solsot_yeoksam);
      processTimeData('solsot_gfc', posData.solsot_gfc);
      processTimeData('goteat_seolleung', posData.goteat_seolleung);
    } else {
      processTimeData(selectedStore, posData[selectedStore]);
    }

    const chartArray = defaultHours.map(hour => ({
      hour: `${hour}시`,
      ...hourData[hour]
    }));

    const maxSales = Math.max(...chartArray.map(d => d.total), 1);

    return { chartArray, maxSales };
  }, [posData, selectedStore]);

  const stores = [
    { id: 'solsot_gfc', name: '솔솥 GFC점', status: '영업중', posConnected: posData.solsot_gfc?.connected, cctvCount: 4 },
    { id: 'solsot_yeoksam', name: '솔솥 역삼점', status: '영업중', posConnected: posData.solsot_yeoksam?.connected, cctvCount: 3 },
    { id: 'goteat_seolleung', name: '갓잇 선릉점', status: '12월 오픈', posConnected: false, cctvCount: 2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 selection:bg-amber-500 selection:text-slate-950">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-6 py-3.5 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-2xl flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">디어스푼</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">LIVE</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">Made by 안하진</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onLogout}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60 transition shadow-sm"
            >
              잠금
            </button>
            <button 
              onClick={fetchPosData}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl border border-slate-700/60 transition disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? '동기화 중...' : '새로고침'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 relative space-y-6">
        
        {welcomeMessage && (
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/5 backdrop-blur-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/40 shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-amber-400 tracking-tight">{welcomeMessage}</h2>
                <p className="text-xs text-slate-300 mt-0.5">안전하게 보안 인증되었습니다. 오늘도 성공적인 하루되세요!</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedStore('all')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedStore === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]'
                : 'bg-slate-900/90 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>전체 매장 합산</span>
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2.5 transition-all ${
                selectedStore === store.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{store.name}</span>
              <span className={`w-2 h-2 rounded-full ring-2 ring-slate-950/30 ${store.posConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'}`} />
            </button>
          ))}
        </div>

        <div className="flex gap-6 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 text-sm sm:text-base font-bold transition relative flex items-center gap-2 ${
              activeTab === 'dashboard' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            매출 & 통합 현황
            {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('cctv')}
            className={`pb-3 text-sm sm:text-base font-bold transition relative flex items-center gap-2 ${
              activeTab === 'cctv' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            실시간 CCTV 통합 관제
            {activeTab === 'cctv' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />}
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800/90 rounded-3xl p-6 relative group flex flex-col justify-between shadow-xl hover:border-slate-700/80 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">오늘 총 매출</span>
                    <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {(currentDisplay?.todaySales || 0).toLocaleString()}원
                  </div>
                  
                  <div className="mt-3 flex items-center gap-1.5 text-xs">
                    {growth ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold ${
                        growth.isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        growth.isZero ? 'bg-slate-800 text-slate-300' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {growth.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : growth.isZero ? <Minus className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        전주 동요일 대비 {growth.percent}% {growth.isUp ? '증가' : growth.isZero ? '동일' : '감소'}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">전주 데이터 비교 대기 중</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {lastUpdated ? `동기화: ${lastUpdated}` : '연동 대기 중...'}
                  </span>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold transition-all bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20 shadow-sm active:scale-95"
                  >
                    상세 현황 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800/90 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">오늘 결제 건수</span>
                    <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{currentDisplay?.totalCount || 0}건</div>
                  <div className="text-xs text-slate-300 mt-3 font-semibold bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 inline-block">
                    객단가 약 <span className="text-amber-400 font-bold">{(currentDisplay?.avgPrice || 0).toLocaleString()}원</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  실시간 POS 트랜잭션 집계 중
                </div>
              </div>

              <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800/90 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">테이블 점유율</span>
                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-400 tracking-tight">- %</div>
                  <div className="text-xs text-slate-500 mt-3 font-medium bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 inline-block">
                    스마트 센서 연동 준비 중
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
                  홀 현황 모니터링 확장 예정
                </div>
              </div>

              <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800/90 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">POS 연동 상태</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${currentDisplay?.connected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                      <CheckCircle2 className={`w-4 h-4 ${currentDisplay?.connected ? 'text-emerald-400' : 'text-rose-500'}`} />
                    </div>
                  </div>
                  <div className={`text-lg sm:text-xl font-bold ${currentDisplay?.connected ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {currentDisplay?.connected ? '유니온소프트 정상' : '연결 안 됨'}
                  </div>
                  <div className="text-xs text-slate-400 mt-3 font-medium bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 inline-block">
                    {currentDisplay?.connected ? '역삼 · GFC 세션 안정적' : '세션 및 쿠키 확인 필요'}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  프록시 자동 세션 유지
                </div>
              </div>

            </div>

            {/* 매출 기여도 카드 (전체 탭일 때 + 매출이 0 이상일 때만 표시) */}
            {selectedStore === 'all' && (currentDisplay?.todaySales > 0) && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full blur-2xl"></div>
                
                <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  실시간 지점별 매출 기여도
                </h3>

                <div className="space-y-5 relative z-10">
                  {(() => {
                    const yeoksamSales = posData.solsot_yeoksam?.todaySales || 0;
                    const gfcSales = posData.solsot_gfc?.todaySales || 0;
                    const totalSales = yeoksamSales + gfcSales;
                    
                    const yeoksamPercent = totalSales > 0 ? ((yeoksamSales / totalSales) * 100).toFixed(1) : 0;
                    const gfcPercent = totalSales > 0 ? ((gfcSales / totalSales) * 100).toFixed(1) : 0;
                    
                    const isYeoksamFirst = yeoksamSales >= gfcSales;

                    const firstPlace = isYeoksamFirst 
                      ? { name: '솔솥 역삼점', sales: yeoksamSales, percent: yeoksamPercent } 
                      : { name: '솔솥 GFC점', sales: gfcSales, percent: gfcPercent };
                    const secondPlace = isYeoksamFirst 
                      ? { name: '솔솥 GFC점', sales: gfcSales, percent: gfcPercent } 
                      : { name: '솔솥 역삼점', sales: yeoksamSales, percent: yeoksamPercent };

                    return (
                      <>
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-amber-400 font-bold mb-1">🥇 1위 {firstPlace.name}</span>
                            <span className="text-xl font-black text-white">{firstPlace.sales.toLocaleString()}원 <span className="text-sm text-slate-400 font-medium">({firstPlace.percent}%)</span></span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-xs text-slate-400 font-bold mb-1">🥈 2위 {secondPlace.name}</span>
                            <span className="text-lg font-bold text-slate-300">{secondPlace.sales.toLocaleString()}원 <span className="text-xs text-slate-500">({secondPlace.percent}%)</span></span>
                          </div>
                        </div>
                        
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                          <div style={{ width: `${firstPlace.percent}%` }} className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000 relative">
                             <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                          <div style={{ width: `${secondPlace.percent}%` }} className="h-full bg-slate-600 transition-all duration-1000"></div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 🔥 시간대별 매출 추이 그래프 (조건 제거하여 무조건 렌더링) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    시간대별 매출 추이
                  </h3>
                  {/* 전체 탭일 때만 색상 범례 표시 */}
                  {selectedStore === 'all' && (
                    <div className="flex items-center gap-2.5 text-[10px] font-bold bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>역삼</span>
                      <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>GFC</span>
                      {/* 갓잇은 아직 데이터가 없으므로 주석처리. 필요시 주석 해제하세요 */}
                      {/* <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></span>갓잇</span> */}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  11:00 ~ 22:00
                </span>
              </div>

              <div className="flex items-end justify-between h-48 gap-1 sm:gap-2.5 mt-4">
                {timeChartData.chartArray.map((item, idx) => {
                  const isZero = item.total === 0;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center justify-end h-full w-full group relative">
                      {/* 툴팁: 0원이 아닐 때만 마우스 올리면 표시 */}
                      {!isZero && (
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[11px] px-3 py-2 rounded-xl pointer-events-none whitespace-nowrap z-10 shadow-xl border border-slate-700 flex flex-col gap-1.5">
                          <span className="font-black text-amber-400 border-b border-slate-700 pb-1.5 mb-0.5">{item.total.toLocaleString()}원</span>
                          {selectedStore === 'all' && (
                            <div className="flex flex-col gap-1 text-[10px] font-medium">
                              {item.solsot_yeoksam > 0 && <span className="text-slate-300 flex justify-between gap-3">역삼점 <span>{item.solsot_yeoksam.toLocaleString()}</span></span>}
                              {item.solsot_gfc > 0 && <span className="text-slate-300 flex justify-between gap-3">GFC점 <span>{item.solsot_gfc.toLocaleString()}</span></span>}
                              {item.goteat_seolleung > 0 && <span className="text-slate-300 flex justify-between gap-3">선릉점 <span>{item.goteat_seolleung.toLocaleString()}</span></span>}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 0원이면 아무것도 렌더링하지 않음. 데이터가 있을 때만 flex-col-reverse 로 층층이 쌓음 */}
                      <div className="w-full relative flex flex-col-reverse items-center justify-start h-full gap-[1px]">
                        {selectedStore === 'all' ? (
                          <>
                            {item.solsot_yeoksam > 0 && (
                              <div style={{ height: `${(item.solsot_yeoksam / timeChartData.maxSales) * 100}%` }} 
                                   className="w-full max-w-[2rem] bg-gradient-to-t from-amber-600 to-amber-400 hover:from-amber-400 hover:to-amber-300 rounded-sm transition-all duration-500 ease-out"></div>
                            )}
                            {item.solsot_gfc > 0 && (
                              <div style={{ height: `${(item.solsot_gfc / timeChartData.maxSales) * 100}%` }} 
                                   className="w-full max-w-[2rem] bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 rounded-sm transition-all duration-500 ease-out"></div>
                            )}
                            {item.goteat_seolleung > 0 && (
                              <div style={{ height: `${(item.goteat_seolleung / timeChartData.maxSales) * 100}%` }} 
                                   className="w-full max-w-[2rem] bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-400 hover:to-blue-300 rounded-sm transition-all duration-500 ease-out"></div>
                            )}
                          </>
                        ) : (
                          // 단일 매장 선택 시
                          !isZero && (
                            <div style={{ height: `${(item.total / timeChartData.maxSales) * 100}%` }} 
                                 className={`w-full max-w-[2rem] rounded-t-sm transition-all duration-500 ease-out bg-gradient-to-t ${
                                   selectedStore === 'solsot_yeoksam' ? 'from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]' :
                                   selectedStore === 'solsot_gfc' ? 'from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' :
                                   'from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.2)]'
                                 }`}></div>
                          )
                        )}
                      </div>
                      
                      <span className="text-[10px] text-slate-400 mt-2 font-medium">
                        {item.hour}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cctv' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-slate-800/90 px-5 py-3.5 flex justify-between items-center border-b border-slate-700/80">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  솔솥 GFC점 - 홀 메인
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-mono">RTSP 01</span>
              </div>
              <div className="h-60 bg-slate-950 flex flex-col items-center justify-center text-slate-500 relative">
                <Camera className="w-10 h-10 mb-2 opacity-30 text-amber-500" />
                <span className="text-xs font-medium">GFC점 IP/포트 연동 대기 중</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl border-emerald-500/30">
              <div className="bg-slate-800/90 px-5 py-3.5 flex justify-between items-center border-b border-slate-700/80">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  솔솥 역삼점 - 실시간 CCTV
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono">WEB PORT</span>
              </div>
              
              <div className="h-60 bg-slate-950 p-5 flex flex-col items-center justify-center relative">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                    <Video className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">34ea7f.dvrinside.com</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">계정: admin (비밀번호 없음)</p>
                  </div>
                  <a
                    href="http://34ea7f.dvrinside.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <span>실시간 CCTV 뷰어 열기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-slate-800/90 px-5 py-3.5 flex justify-between items-center border-b border-slate-700/80">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  갓잇 선릉점 (12월 오픈예정)
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">준비중</span>
              </div>
              <div className="h-60 bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 relative">
                <AlertTriangle className="w-8 h-8 mb-2 text-amber-500/60" />
                <span className="text-xs text-slate-400 font-medium">12월 중순 장비 설치 예정</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-800/40">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                {currentDisplay?.name} {currentMonthName} 매출 리포트
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" /> {currentMonthName} 경영 지표 요약
                </h3>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 col-span-2 shadow-inner">
                    <p className="text-xs text-slate-400 mb-1 font-medium">{currentMonthName} 총 누적 매출</p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-400">{(currentDisplay?.monthSales || 0).toLocaleString()}원</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                    <p className="text-xs text-slate-400 mb-1 font-medium">총 결제 건수</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{(currentDisplay?.monthCount || 0).toLocaleString()}건</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                    <p className="text-xs text-slate-400 mb-1 font-medium">평균 객단가</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-400">{(accumulatedAvgPrice || 0).toLocaleString()}원</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-400 mb-3">오늘 결제 수단별 상세 내역</h4>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 font-medium">카드 결제</p>
                    <p className="text-xs font-bold text-blue-400 mt-1">{(currentDisplay?.details?.cardAmt || 0).toLocaleString()}원</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 font-medium">현금 결제</p>
                    <p className="text-xs font-bold text-emerald-400 mt-1">{(currentDisplay?.details?.cashAmt || 0).toLocaleString()}원</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 font-medium">취소/환불</p>
                    <p className="text-xs font-bold text-rose-400 mt-1">{(currentDisplay?.details?.cancelAmt || 0).toLocaleString()}원</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
