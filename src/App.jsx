import React, { useState, useEffect } from 'react';
import { 
  Building2, TrendingUp, Users, ShieldAlert, Camera, 
  CreditCard, RefreshCw, CheckCircle2, 
  Clock, AlertTriangle, Lock, KeyRound
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 🔒 Master Password 설정 (821125)
  const MASTER_PASSWORD = "821125";

  useEffect(() => {
    const authStatus = sessionStorage.getItem('dearspoon_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
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
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">디어스푼 매장 현황</h1>
            <p className="text-sm text-slate-400 mt-1">보안 관리자 전용 인증 시스템</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">관리자 비밀번호 (숫자 6자리)</label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호 6자리 입력"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all tracking-widest text-lg font-mono"
                  autoFocus
                  maxLength={6}
                />
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-lg transition duration-200 shadow-lg shadow-amber-500/20 active:scale-[0.99]"
            >
              접속 승인
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              솔솥 GFC점 · 솔솥 역삼점 · 갓잇 선릉점 관제
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <MainDashboardContent onLogout={handleLogout} />;
}

function MainDashboardContent({ onLogout }) {
  const [selectedStore, setSelectedStore] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // POS 실시간 연동 데이터 상태
  const [posData, setPosData] = useState({
    solsot_gfc: { name: "솔솥 GFC점", connected: true, todaySales: 4250000, totalCount: 114, avgPrice: 37280 },
    solsot_yeoksam: { name: "솔솥 역삼점", connected: true, todaySales: 3420000, totalCount: 92, avgPrice: 37170 },
    goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0 }
  });

  // POS API 연동 데이터 동기화 함수
  const fetchPosData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos');
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
    // 5분마다 자동 동기화
    const interval = setInterval(fetchPosData, 300000);
    return () => clearInterval(interval);
  }, []);

  // 선택 필터에 따른 매출 계산
  const getCalculatedData = () => {
    if (selectedStore === 'solsot_gfc') {
      return posData.solsot_gfc;
    } else if (selectedStore === 'solsot_yeoksam') {
      return posData.solsot_yeoksam;
    } else if (selectedStore === 'goteat_seolleung') {
      return posData.goteat_seolleung;
    } else {
      // 전체 매장 합산
      const totalSales = (posData.solsot_gfc?.todaySales || 0) + (posData.solsot_yeoksam?.todaySales || 0);
      const totalCount = (posData.solsot_gfc?.totalCount || 0) + (posData.solsot_yeoksam?.totalCount || 0);
      const avgPrice = totalCount > 0 ? Math.round(totalSales / totalCount) : 0;
      return {
        name: "전체 매장 합산",
        connected: posData.solsot_gfc?.connected && posData.solsot_yeoksam?.connected,
        todaySales: totalSales,
        totalCount: totalCount,
        avgPrice: avgPrice
      };
    }
  };

  const currentDisplay = getCalculatedData();

  const stores = [
    { id: 'solsot_gfc', name: '솔솥 GFC점', status: '영업중', posConnected: posData.solsot_gfc?.connected, cctvCount: 4 },
    { id: 'solsot_yeoksam', name: '솔솥 역삼점', status: '영업중', posConnected: posData.solsot_yeoksam?.connected, cctvCount: 3 },
    { id: 'goteat_seolleung', name: '갓잇 선릉점', status: '12월 중순 오픈예정', posConnected: false, cctvCount: 2 },
  ];

  const hourlySales = [
    { time: '11시', 솔솥GFC점: 55, 솔솥역삼점: 42, 갓잇선릉점: 0 },
    { time: '12시', 솔솥GFC점: 140, 솔솥역삼점: 110, 갓잇선릉점: 0 },
    { time: '13시', 솔솥GFC점: 115, 솔솥역삼점: 90, 갓잇선릉점: 0 },
    { time: '14시', 솔솥GFC점: 60, 솔솥역삼점: 45, 갓잇선릉점: 0 },
    { time: '17시', 솔솥GFC점: 70, 솔솥역삼점: 55, 갓잇선릉점: 0 },
    { time: '18시', 솔솥GFC점: 155, 솔솥역삼점: 125, 갓잇선릉점: 0 },
    { time: '19시', 솔솥GFC점: 175, 솔솥역삼점: 140, 갓잇선릉점: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* 상단 헤더 */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-bold text-slate-950 text-lg shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">디어스푼 매장 현황</h1>
              <p className="text-xs text-slate-400">솔솥 · 갓잇 실시간 통합 관제 시스템</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onLogout}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            >
              잠금
            </button>
            <button 
              onClick={fetchPosData}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '동기화 중...' : '동기화'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {/* 매장 선택 필터 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedStore('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStore === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            전체 매장 합산
          </button>
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                selectedStore === store.id
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>{store.name}</span>
              <span className={`w-2 h-2 rounded-full ${store.posConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </button>
          ))}
        </div>

        {/* 탭 메인 메뉴 */}
        <div className="flex gap-4 border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === 'dashboard' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            매출 & 통합 현황
            {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab('cctv')}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === 'cctv' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            실시간 CCTV 통합 관제
            {activeTab === 'cctv' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />}
          </button>
        </div>

        {/* 탭 1: 대시보드 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">오늘 총 매출</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {currentDisplay.todaySales.toLocaleString()}원
                </div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  ▲ 실시간 수집중 ({lastUpdated ? `${lastUpdated} 기준` : '동기화됨'})
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">총 결제 건수</span>
                  <CreditCard className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">{currentDisplay.totalCount}건</div>
                <div className="text-xs text-slate-400 mt-1">객단가 약 {currentDisplay.avgPrice.toLocaleString()}원</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">테이블 점유율</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">82%</div>
                <div className="text-xs text-amber-400 mt-1">GFC 10개 / 역삼 8개 가동 중</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">POS 연동 상태</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  {currentDisplay.connected ? '유니온소프트 정상' : '설정 필요'}
                </div>
                <div className="text-xs text-slate-400 mt-1">API 서버 연동 상태 양호</div>
              </div>
            </div>

            {/* 매출 추이 그래프 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">시간대별 매출 추이 (만원)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">점심/저녁 피크타임 매출 현황 분석</p>
                </div>
                <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">실시간 집계중</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="솔솥GFC점" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="솔솥역삼점" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: CCTV 관제 */}
        {activeTab === 'cctv' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  솔솥 GFC점 - 홀 메인
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">RTSP 01</span>
              </div>
              <div className="h-48 bg-slate-950 flex flex-col items-center justify-center text-slate-500 relative">
                <Camera className="w-10 h-10 mb-2 opacity-40" />
                <span className="text-xs font-medium">실시간 스트림 연결 중...</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  솔솥 역삼점 - 홀 메인
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">RTSP 02</span>
              </div>
              <div className="h-48 bg-slate-950 flex flex-col items-center justify-center text-slate-500 relative">
                <Camera className="w-10 h-10 mb-2 opacity-40" />
                <span className="text-xs font-medium">실시간 스트림 연결 중...</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  갓잇 선릉점 (12월 오픈예정)
                </span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">준비중</span>
              </div>
              <div className="h-48 bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 relative">
                <AlertTriangle className="w-8 h-8 mb-2 text-amber-500/60" />
                <span className="text-xs text-slate-400 font-medium">12월 중순 장비 설치 예정</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
