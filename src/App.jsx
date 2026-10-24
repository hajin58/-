import React, { useState } from 'react';
import { 
  Building2, TrendingUp, Users, ShieldAlert, Camera, 
  CreditCard, RefreshCw, ChevronRight, CheckCircle2, 
  Clock, AlertTriangle, Play, LayoutGrid, Calendar, Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [selectedStore, setSelectedStore] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  // 실제 매장 리스트 (솔솥 GFC, 솔솥 역삼, 갓잇 선릉)
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
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 text-orange-400 p-2 rounded-lg border border-orange-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">디어스푼 매장 현황</h1>
            <p className="text-xs text-slate-400">솔솥 · 갓잇 실시간 통합 관제 시스템</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition border border-slate-700">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>동기화</span>
        </button>
      </header>

      <main className="p-4 max-w-6xl mx-auto space-y-6">
        {/* 매장 선택 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1 items-center">
          <button 
            onClick={() => setSelectedStore('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedStore === 'all' 
                ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            전체 매장 합산
          </button>
          {stores.map(store => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 border ${
                selectedStore === store.id 
                  ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{store.name}</span>
              <span className={`w-2 h-2 rounded-full ${store.status === '영업중' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </button>
          ))}
        </div>

        {/* 메인 탭 메뉴 */}
        <div className="flex border-b border-slate-800 text-sm font-medium">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-4 border-b-2 transition ${activeTab === 'dashboard' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            매출 & 통합 현황
          </button>
          <button 
            onClick={() => setActiveTab('cctv')}
            className={`pb-3 px-4 border-b-2 transition ${activeTab === 'cctv' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            실시간 CCTV 통합 관제
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            {/* 핵심 지표 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>오늘 총 매출</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-slate-100">7,670,000원</div>
                <div className="text-[10px] text-emerald-400 mt-1">▲ 전주 대비 +14.2%</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>총 결제 건수</span>
                  <CreditCard className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-slate-100">206건</div>
                <div className="text-[10px] text-slate-400 mt-1">객단가 약 37,200원</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>테이블 점유율</span>
                  <Users className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-xl font-bold text-slate-100">82%</div>
                <div className="text-[10px] text-orange-400 mt-1">GFC 10개 / 역삼 8개 가동 중</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>POS 연동 상태</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">유니온소프트 정상</div>
                <div className="text-[10px] text-slate-400 mt-1">GFC점, 역삼점 동기화됨</div>
              </div>
            </div>

            {/* 시간대별 매출 그래프 */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <h3 className="font-semibold text-sm text-slate-200 mb-4 flex items-center justify-between">
                <span>시간대별 매출 추이 (만원)</span>
                <span className="text-xs text-slate-400">실시간 집계중</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Line type="monotone" dataKey="솔솥GFC점" stroke="#f97316" strokeWidth={2} />
                    <Line type="monotone" dataKey="솔솥역삼점" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          /* CCTV 통합 화면 */
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-semibold">통합 CCTV 그리드 관제</span>
              </div>
              <span className="text-xs text-slate-400">총 9개 채널 연동 지원</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-800/50 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-200">솔솥 GFC점 - 메인 홀</span>
                  <span className="text-emerald-400 flex items-center gap-1">● 라이브</span>
                </div>
                <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center text-slate-500 relative">
                  <Camera className="w-10 h-10 mb-2 opacity-40" />
                  <span className="text-xs">RTSP 실시간 영상 스트림</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-800/50 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-200">솔솥 역삼점 - 주문/주방</span>
                  <span className="text-emerald-400 flex items-center gap-1">● 라이브</span>
                </div>
                <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center text-slate-500 relative">
                  <Camera className="w-10 h-10 mb-2 opacity-40" />
                  <span className="text-xs">RTSP 실시간 영상 스트림</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-slate-800/50 flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-200">갓잇 선릉점 (12월 예정) - 카메라 01</span>
                  <span className="text-amber-400 flex items-center gap-1">○ 대기중</span>
                </div>
                <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center text-slate-500 relative">
                  <Clock className="w-10 h-10 mb-2 opacity-30" />
                  <span className="text-xs">매장 오픈 후 스트림이 연결됩니다</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}