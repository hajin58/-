import React, { useState, useEffect } from 'react';
import { 
  Building2, TrendingUp, Users, Camera, 
  CreditCard, RefreshCw, CheckCircle2, 
  Clock, AlertTriangle, Lock, KeyRound, ExternalLink, Video,
  X, ChevronRight, BarChart3, Sparkles
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isCheckingIp, setIsCheckingIp] = useState(true);

  const MASTER_PASSWORD = "821125";

  // 🔒 등록된 IP와 환영 메시지 매핑 테이블
  const ALLOWED_IPS = {
    '115.136.113.62': '사장님 환영합니다.',
    '106.101.78.34': '안하진님 환영합니다.',
    '39.7.28.242': '박지현 사장님 환영합니다.',
    '106.101.203.145': '박지현 사장님 환영합니다.',
    '106.101.211.245': '안민호 사장님 환영합니다.',
    '106.101.91.20': '안세영님 환영합니다.'
  };

  // 🔥 앱 실행 시 외부 API로 접속자 IP 실시간 확인 후 자동 인증
  useEffect(() => {
    const checkUserIp = async () => {
      // 이미 세션에 인증 정보가 있으면 패스
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
          // 화이트리스트에 있는 IP인 경우 비밀번호 생략 및 환영 메시지 세팅
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
    window.location.reload(); // 로그아웃 시 IP 재체크를 위해 새로고침
  };

  if (isCheckingIp) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

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
                <span className="shrink-0">⚠️</span>
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

  return <MainDashboardContent onLogout={handleLogout} welcomeMessage={welcomeMessage} />;
}

function MainDashboardContent({ onLogout, welcomeMessage }) {
  const [selectedStore, setSelectedStore] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [posData, setPosData] = useState({
    solsot_gfc: { name: "솔솥 GFC점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0 },
    solsot_yeoksam: { name: "솔솥 역삼점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0 },
    goteat_seolleung: { name: "갓잇 선릉점", connected: false, todaySales: 0, totalCount: 0, avgPrice: 0, monthSales: 0, monthCount: 0 }
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

    return {
      name: "전체 매장 합산",
      connected: posData.solsot_gfc?.connected && posData.solsot_yeoksam?.connected,
      todaySales: totalSales,
      totalCount: totalCount,
      avgPrice: avgPrice,
      monthSales: totalMonthSales,
      monthCount: totalMonthCount
    };
  };

  const currentDisplay = getCalculatedData();
  const accumulatedAvgPrice = currentDisplay?.monthCount > 0 
    ? Math.round(currentDisplay.monthSales / currentDisplay.monthCount) 
    : 0;

  const stores = [
    { id: 'solsot_gfc', name: '솔솥 GFC점', status: '영업중', posConnected: posData.solsot_gfc?.connected, cctvCount: 4 },
    { id: 'solsot_yeoksam', name: '솔솥 역삼점', status: '영업중', posConnected: posData.solsot_yeoksam?.connected, cctvCount: 3 },
    { id: 'goteat_seolleung', name: '갓잇 선릉점', status: '12월 중순 오픈예정', posConnected: false, cctvCount: 2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* 상단 헤더 */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-bold text-slate-950 text-lg shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">디어스푼 매장 현황</h1>
                {/* 🔥 IP 자동 인증 성공 시 환영 메시지 뱃지 출력 */}
                {welcomeMessage && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-medium">
                    <Sparkles className="w-3 h-3" /> {welcomeMessage}
                  </span>
                )}
              </div>
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
      <main className="max-w-7xl mx-auto px-4 mt-6 relative">
        {/* 모바일 화면용 환영 메시지 */}
        {welcomeMessage && (
          <div className="md:hidden mb-4 flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-400 px-3 py-2 rounded-xl border border-amber-500/20 font-medium">
            <Sparkles className="w-3.5 h-3.5 shrink-0" /> <span>{welcomeMessage}</span>
          </div>
        )}

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
              <span className={`w-2 h-2 rounded-full ${store.posConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            </button>
          ))}
        </div>

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

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">오늘 총 매출</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {(currentDisplay?.todaySales || 0).toLocaleString()}원
                </div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  {lastUpdated ? `마지막 동기화: ${lastUpdated}` : '연동 대기 중...'}
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="absolute bottom-4 right-4 flex items-center gap-1 text-xs text-amber-500/80 hover:text-amber-400 font-bold transition-colors"
                >
                  상세 현황 <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">오늘 결제 건수</span>
                  <CreditCard className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">{currentDisplay?.totalCount || 0}건</div>
                <div className="text-xs text-slate-400 mt-1">오늘 객단가 약 {(currentDisplay?.avgPrice || 0).toLocaleString()}원</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">테이블 점유율</span>
                  <Users className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-black text-slate-500 tracking-tight">- %</div>
                <div className="text-xs text-slate-500 mt-1">POS 연동 준비 중</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-400 font-medium">POS 연동 상태</span>
                  <CheckCircle2 className={`w-4 h-4 ${currentDisplay?.connected ? 'text-emerald-400' : 'text-rose-500'}`} />
                </div>
                <div className={`text-lg font-bold ${currentDisplay?.connected ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {currentDisplay?.connected ? '유니온소프트 정상' : '연결 안 됨'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {currentDisplay?.connected ? 'API 서버 연동 상태 양호' : '데이터를 불러오지 못함'}
                </div>
              </div>
            </div>
          </div>
        )}

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
              <div className="h-56 bg-slate-950 flex flex-col items-center justify-center text-slate-500 relative">
                <Camera className="w-10 h-10 mb-2 opacity-40" />
                <span className="text-xs font-medium">GFC점 IP/포트 연동 대기 중</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg border-emerald-500/30">
              <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  솔솥 역삼점 - 실시간 CCTV
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">WEB PORT</span>
              </div>
              
              <div className="h-56 bg-slate-950 p-4 flex flex-col items-center justify-center relative">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
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
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md active:scale-95"
                  >
                    <span>실시간 CCTV 뷰어 열기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
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
              <div className="h-56 bg-slate-950/50 flex flex-col items-center justify-center text-slate-500 relative">
                <AlertTriangle className="w-8 h-8 mb-2 text-amber-500/60" />
                <span className="text-xs text-slate-400 font-medium">12월 중순 장비 설치 예정</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-800/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                {currentDisplay?.name} 누적 현황
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" /> 오픈 후 누적 현황
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 col-span-2 shadow-inner">
                    <p className="text-xs text-slate-400 mb-1">총 누적 매출</p>
                    <p className="text-3xl font-black text-amber-400">{(currentDisplay?.monthSales || 0).toLocaleString()}원</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                    <p className="text-xs text-slate-400 mb-1">총 결제 건수</p>
                    <p className="text-xl font-bold text-white">{(currentDisplay?.monthCount || 0).toLocaleString()}건</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                    <p className="text-xs text-slate-400 mb-1">평균 객단가</p>
                    <p className="text-xl font-bold text-emerald-400">{(accumulatedAvgPrice || 0).toLocaleString()}원</p>
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
