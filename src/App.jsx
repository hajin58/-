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
          <p className="text-xs text-slate-400 tracking-wider font-medium">보안 네트워크 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">
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
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3.5 pl-11 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all tracking-widest text-lg font-mono shadow-inner"
                  autoFocus
                  maxLength={6}
                />
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-4" />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3.5 rounded-2xl border border-rose-500/20 animate-shake">
                <span className="shrink-0">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-3.5 rounded-2xl transition-all duration-200 shadow-xl shadow-amber-500/20 active:scale-[0.99]"
            >
              안전 접속 승인
            </button>
          </form>
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
    solsot_gfc: { name: "솔솥 GFC점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0, TIME: {} },
    solsot_yeoksam: { name: "솔솥 역삼점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0, TIME: {} },
    goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0, prevWeekSales: 0, TIME: {} }
  });

  const fetchPosData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos-sync');
      if (res.ok) {
        const data = await res.json();
        if (data.stores) {
          setPosData(data.stores);
          
          // 💡 여기에 디버깅 코드를 심었습니다! F12 콘솔창에서 확인할 수 있습니다.
          console.log("🚨 [역삼점 시간대 원본 데이터]:", data.stores.solsot_yeoksam._debugHourData);
          console.log("🚨 [GFC점 시간대 원본 데이터]:", data.stores.solsot_gfc._debugHourData);
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

    return {
      name: "전체 매장 합산",
      connected: posData.solsot_gfc?.connected && posData.solsot_yeoksam?.connected,
      todaySales: totalSales,
      totalCount: totalCount,
      avgPrice: avgPrice,
      prevWeekSales: totalPrevWeekSales,
      monthSales: totalMonthSales,
      monthCount: totalMonthCount
    };
  };

  const currentDisplay = getCalculatedData();
  const accumulatedAvgPrice = currentDisplay?.monthCount > 0 
    ? Math.round(currentDisplay.monthSales / currentDisplay.monthCount) 
    : 0;

  const getGrowthRate = (current, prev) => {
    if (!prev || prev === 0) return null;
    const diff = ((current - prev) / prev) * 100;
    return { percent: diff.toFixed(1), isUp: diff > 0, isZero: diff === 0 };
  };

  const growth = getGrowthRate(currentDisplay?.todaySales, currentDisplay?.prevWeekSales);
  const currentMonthName = `${new Date().getMonth() + 1}월`;

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

    // 그래프 높이(Y축) 최댓값 설정 로직 변경
    let maxSales = 100000;
    if (selectedStore === 'all') {
      const maxYeoksam = Math.max(...chartArray.map(d => d.solsot_yeoksam));
      const maxGfc = Math.max(...chartArray.map(d => d.solsot_gfc));
      maxSales = Math.max(maxYeoksam, maxGfc, 100000);
    } else {
      maxSales = Math.max(...chartArray.map(d => d.total), 100000); 
    }

    return { chartArray, maxSales };
  }, [posData, selectedStore]);

  const stores = [
    { id: 'solsot_gfc', name: '솔솥 GFC점', status: '영업중', posConnected: posData.solsot_gfc?.connected },
    { id: 'solsot_yeoksam', name: '솔솥 역삼점', status: '영업중', posConnected: posData.solsot_yeoksam?.connected },
    { id: 'goteat_seolleung', name: '갓잇 선릉점', status: '12월 오픈', posConnected: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-amber-500 selection:text-slate-950">
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-8 py-4 shadow-2xl shadow-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 rounded-2xl flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">디어스푼</h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-wider shadow-inner">LIVE</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight mt-0.5">Made by 안하진</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onLogout}
              className="px-4 py-2.5 text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700/60 transition-all shadow-sm active:scale-95"
            >
              잠금
            </button>
            <button 
              onClick={fetchPosData}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-slate-800 to-slate-800/80 hover:from-slate-700 hover:to-slate-700 text-slate-200 px-4 py-2.5 rounded-2xl border border-slate-700/60 transition-all disabled:opacity-50 shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? '동기화 중...' : '새로고침'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 relative space-y-6">
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedStore('all')}
            className={`px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedStore === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/25 scale-[1.02]'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <span>전체 매장 합산</span>
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap flex items-center gap-3 transition-all ${
                selectedStore === store.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/25 scale-[1.02]'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <span>{store.name}</span>
              <span className={`w-2.5 h-2.5 rounded-full ring-4 ring-slate-950/40 ${store.posConnected ? 'bg-emerald-400 shadow-md shadow-emerald-400/60 animate-pulse' : 'bg-rose-500'}`} />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative group flex flex-col justify-between shadow-2xl hover:border-slate-700/80 transition-all backdrop-blur-xl">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs sm:text-sm font-bold text-slate-400">오늘 총 매출</span>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {(currentDisplay?.todaySales || 0).toLocaleString()}원
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold">
                {lastUpdated ? `동기화: ${lastUpdated}` : '연동 대기 중...'}
              </span>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-extrabold transition-all bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/25 shadow-sm active:scale-95"
              >
                상세 현황 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          {/* 다른 지표 카드 생략 (공간 절약) */}
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs sm:text-sm font-bold text-slate-400">오늘 결제 건수</span>
                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{currentDisplay?.totalCount || 0}건</div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
             <div className="flex justify-between items-start mb-3">
                <span className="text-xs sm:text-sm font-bold text-slate-400">테이블 점유율</span>
                <div className="w-10 h-10 bg-slate-800/80 rounded-2xl flex items-center justify-center border border-slate-700/80 shadow-inner">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-400 tracking-tight">- %</div>
          </div>

          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs sm:text-sm font-bold text-slate-400">POS 연동 상태</span>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner ${currentDisplay?.connected ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-rose-500/10 border-rose-500/25'}`}>
                <CheckCircle2 className={`w-5 h-5 ${currentDisplay?.connected ? 'text-emerald-400' : 'text-rose-500'}`} />
              </div>
            </div>
            <div className={`text-lg sm:text-xl font-black ${currentDisplay?.connected ? 'text-emerald-400' : 'text-rose-500'}`}>
              {currentDisplay?.connected ? '유니온소프트 정상' : '연결 안 됨'}
            </div>
          </div>
        </div>

        {/* 🔥 시간대별 매출 추이 꺾은선 그래프 (다중 라인 완벽 적용) */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950 border border-slate-800/80 rounded-3xl p-7 shadow-2xl backdrop-blur-xl mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black text-slate-200 flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                시간대별 매출 추이
              </h3>
              {selectedStore === 'all' && (
                <div className="flex gap-3 ml-2 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>역삼점</span>
                  <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>GFC점</span>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 font-bold bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-inner">
              11:00 ~ 21:00
            </span>
          </div>

          <div className="relative h-64 w-full mt-8 pt-4 border-t border-slate-800/60">
            {/* SVG Line Chart */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />

              {(() => {
                const getLinePoints = (dataKey) => {
                  return timeChartData.chartArray.map((d, i) => {
                    const x = (i / (timeChartData.chartArray.length - 1)) * 100;
                    const y = 100 - (d[dataKey] / timeChartData.maxSales) * 100; 
                    return `${x},${isNaN(y) ? 100 : y}`;
                  }).join(' ');
                };

                if (selectedStore === 'all') {
                  const yeoksamPoints = getLinePoints('solsot_yeoksam');
                  const gfcPoints = getLinePoints('solsot_gfc');
                  return (
                    <>
                      <polyline points={yeoksamPoints} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points={gfcPoints} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  );
                } else {
                  const singlePoints = getLinePoints('total');
                  const areaPoints = `0,100 ${singlePoints} 100,100`;
                  const color = selectedStore === 'solsot_yeoksam' ? '#fbbf24' : selectedStore === 'solsot_gfc' ? '#34d399' : '#60a5fa';
                  return (
                    <>
                      <polygon points={areaPoints} fill="url(#lineGradient)" />
                      <polyline points={singlePoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  );
                }
              })()}
            </svg>

            {/* Interactive Overlay & Tooltips */}
            <div className="absolute inset-0 w-full h-full flex justify-between items-end">
              {timeChartData.chartArray.map((item, idx) => {
                if (selectedStore === 'all') {
                  const hY = (item.solsot_yeoksam / timeChartData.maxSales) * 100;
                  const hG = (item.solsot_gfc / timeChartData.maxSales) * 100;
                  const showTooltip = item.solsot_yeoksam > 0 || item.solsot_gfc > 0;
                  
                  return (
                    <div key={idx} className="h-full flex flex-col justify-end items-center relative group w-full">
                      {item.solsot_yeoksam > 0 && <div className="absolute w-2.5 h-2.5 bg-slate-900 border-2 border-amber-400 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-all" style={{ bottom: `calc(${hY}% - 5px)` }}></div>}
                      {item.solsot_gfc > 0 && <div className="absolute w-2.5 h-2.5 bg-slate-900 border-2 border-emerald-400 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-all" style={{ bottom: `calc(${hG}% - 5px)` }}></div>}
                      
                      {showTooltip && (
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 text-white text-xs px-3.5 py-2.5 rounded-2xl pointer-events-none whitespace-nowrap z-20 shadow-2xl border border-slate-700 flex flex-col gap-1.5 backdrop-blur-xl -translate-y-4" style={{ bottom: `${Math.max(hY, hG)}%` }}>
                          <span className="font-bold flex justify-between gap-4 text-slate-300">역삼 <span className="text-amber-400 font-black">{item.solsot_yeoksam.toLocaleString()}</span></span>
                          <span className="font-bold flex justify-between gap-4 text-slate-300">GFC <span className="text-emerald-400 font-black">{item.solsot_gfc.toLocaleString()}</span></span>
                        </div>
                      )}
                      <span className="absolute -bottom-6 text-[10px] text-slate-400 font-bold tracking-tighter">{item.hour.replace('시', '')}</span>
                    </div>
                  );
                } else {
                  const heightPercent = (item.total / timeChartData.maxSales) * 100;
                  const dotColor = selectedStore === 'solsot_yeoksam' ? 'border-amber-400' : selectedStore === 'solsot_gfc' ? 'border-emerald-400' : 'border-blue-400';
                  const textColor = selectedStore === 'solsot_yeoksam' ? 'text-amber-400' : selectedStore === 'solsot_gfc' ? 'text-emerald-400' : 'text-blue-400';

                  return (
                    <div key={idx} className="h-full flex flex-col justify-end items-center relative group w-full">
                      <div className={`absolute w-3 h-3 bg-slate-900 border-2 ${dotColor} rounded-full z-10 opacity-0 group-hover:opacity-100 transition-all`} style={{ bottom: `calc(${heightPercent}% - 6px)` }}></div>
                      {item.total > 0 && (
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 text-xs px-3.5 py-2.5 rounded-2xl pointer-events-none whitespace-nowrap z-20 shadow-2xl border border-slate-700 flex flex-col gap-1 backdrop-blur-xl -translate-y-4" style={{ bottom: `${heightPercent}%` }}>
                          <span className={`font-black ${textColor}`}>{item.total.toLocaleString()}원</span>
                        </div>
                      )}
                      <span className="absolute -bottom-6 text-[10px] text-slate-400 font-bold tracking-tighter">{item.hour.replace('시', '')}</span>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-800/50">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                {currentDisplay?.name} {currentMonthName} 매출 리포트
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
