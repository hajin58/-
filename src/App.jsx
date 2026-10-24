import React, { useState, useEffect } from 'react';
import { 
  Building2, TrendingUp, Users, ShieldAlert, Camera, 
  CreditCard, RefreshCw, ChevronRight, CheckCircle2, 
  Clock, AlertTriangle, Play, LayoutGrid, Calendar, Plus,
  Lock, KeyRound
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 🔒 Master Password
  const MASTER_PASSWORD = "dearspoon1234!";

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
              <label className="block text-xs text-slate-400 mb-1 font-medium">관리자 비밀번호</label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 pl-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  autoFocus
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

  const stores = [
    { id: 'solsot_gfc', name: '솔솥 GFC점', status: '영업중', posConnected: true, cctvCount: 4 },
    { id: 'solsot_yeoksam', name: '솔솥 역삼점', status: '영업중', posConnected: true, cctvCount: 3 },
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
            <button className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>동기화</span>
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
                <div className="text-2xl font-black text-white tracking-tight">7,670,000원</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  ▲ 전주 대비 +14.2%
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">총 결제 건수</span>
                  <CreditCard className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">206건</div>
                <div className="text-xs text-slate-400 mt-1">객단가 약 37,200원</div>
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
                <div className="text-lg font-bold text-emerald-400">유니온소프트 정상</div>
                <div className="text-xs text-slate-400 mt-1">GFC점, 역삼점 동기화됨</div>
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
