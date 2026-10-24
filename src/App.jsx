import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert } from 'lucide-react';

// MainDashboard 컴포넌트는 기존에 작성하신 대시보드 코드를 그대로 유지합니다.
import MainDashboard from './components/MainDashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 🔒 사용할 비밀번호 설정 (원하시는 비밀번호로 변경하세요)
  const MASTER_PASSWORD = "821125";

  useEffect(() => {
    // 이전 로그인 세션이 남아있는지 확인
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

  // 1. 인증되지 않은 경우: 비밀번호 입력 화면 출력
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

  // 2. 인증된 경우: 메인 대시보드 출력 (로그아웃 버튼 전달 가능)
  return <MainDashboard onLogout={handleLogout} />;
}