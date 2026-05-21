import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Info, Terminal, Settings, FileCode, Sparkles, Smartphone, Eye, Lightbulb } from 'lucide-react';
import { AdParams, BridgeLog, AdStep } from './types';
import AdContent from './components/AdContent';
import HostSimulator from './components/HostSimulator';
import CodeExporter from './components/CodeExporter';
import { playClickSound } from './utils/audio';

export default function App() {
  // Mobile vs Simulator tab toggle for smaller displays
  const [activeTab, setActiveTab] = useState<'preview' | 'simulator' | 'guide'>('preview');

  // URL Parameters / Query Parameters state
  const [params, setParams] = useState<AdParams>({
    userId: 'toss_user_7b82f9d_alpha',
    adId: 'campaign_lucky_box_1042',
    rewardPoints: 20,
    environment: 'development',
    hasQuiz: false,
    quizQuestion: '',
    quizAnswer: '',
    quizOptions: []
  });

  // Current client state inside the iframe/webview preview
  const [clientStep, setClientStep] = useState<AdStep>('intro');

  // Log events stream capture
  const [logs, setLogs] = useState<BridgeLog[]>([]);

  // Hook to handle local Event triggers
  useEffect(() => {
    const handleBridgeMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.source === 'toss-app-in-ad-sdk') {
        const { event, payload } = customEvent.detail;
        
        // Add log if not duplicated
        setLogs((prev) => {
          const isDup = prev.some(l => l.event === event && JSON.stringify(l.payload) === JSON.stringify(payload) && (Date.now() - new Date(l.timestamp).getTime()) < 300);
          if (isDup) return prev;

          return [
            ...prev,
            {
              id: Math.random().toString(36).slice(2, 9),
              timestamp: new Date().toLocaleTimeString(),
              type: event === 'MISSION_COMPLETED' ? 'received' : 'sent',
              event,
              payload
            }
          ];
        });
      }
    };

    window.addEventListener('toss-bridge-event', handleBridgeMessage);
    return () => window.removeEventListener('toss-bridge-event', handleBridgeMessage);
  }, []);

  const triggerManualLog = (event: string, payload: any) => {
    // Add local log manually when dispatched by child
    setLogs((prev) => {
      const isDup = prev.some(l => l.event === event && JSON.stringify(l.payload) === JSON.stringify(payload) && (Date.now() - new Date(l.timestamp).getTime()) < 300);
      if (isDup) return prev;

      return [
        ...prev,
        {
          id: Math.random().toString(36).slice(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          type: event === 'MISSION_COMPLETED' ? 'received' : 'sent',
          event,
          payload
        }
      ];
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none antialiased selection:bg-blue-600/30">
      
      {/* Top Professional Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <h1 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-1.5 font-sans">
              Toss App-in-Ad SDK 
              <span className="text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">TEST SANDBOX</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            토스(Apps-in-Toss)에 업로드할 웹앱 형태의 미션 부가광고(앱인애드) 동작을 미리 시뮬레이션하고 테스트하는 환경입니다.
          </p>
        </div>
        
        {/* Help Badge / Target Information */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 border border-slate-700/60 rounded-xl text-xs font-medium text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>표준 postMessage 통신 브리지 v1.2</span>
          </div>
        </div>
      </header>

      {/* Mobile-only Top Tab Selector */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-950/40 shrink-0">
        <button
          onClick={() => { playClickSound(); setActiveTab('preview'); }}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'preview' ? 'border-blue-500 text-white bg-slate-800/20' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>📱 웹앱 미션뷰</span>
        </button>
        <button
          onClick={() => { playClickSound(); setActiveTab('simulator'); }}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'simulator' ? 'border-blue-500 text-white bg-slate-800/20' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>⚙️ 테스터 콘솔</span>
        </button>
        <button
          onClick={() => { playClickSound(); setActiveTab('guide'); }}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 ${
            activeTab === 'guide' ? 'border-blue-500 text-white bg-slate-800/20' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>📄 개발 가이드</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 max-w-[1700px] w-full mx-auto">
        
        {/* LEFT COMPONENT / SCREEN 1: Mobile App Frame Preview */}
        <div className={`col-span-12 lg:col-span-4 flex flex-col items-center justify-start ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="w-full max-w-[360px] flex flex-col shrink-0">
            
            {/* Title above mobile */}
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-bold px-1.5">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>모바일 웹뷰 시안 (이벤트 렌더러)</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                Port: 3000
              </span>
            </div>

            {/* Simulated Smartphone Container with rich shadows & bezel */}
            <div className="w-full aspect-[9/19.5] min-h-[640px] bg-slate-950 rounded-[40px] p-3.5 border-4 border-slate-700 shadow-2xl relative flex flex-col ring-12 ring-slate-900 shrink-0">
              
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-40 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center">
                {/* Simulated Speaker and Camera lens */}
                <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 ml-4 mb-1"></div>
              </div>

              {/* Status Bar */}
              <div className="h-6 flex items-center justify-between px-6 text-[10px] text-slate-700 font-bold select-none pt-1 shrink-0 z-40 bg-slate-50 rounded-t-[28px] border-b border-slate-100">
                <span>09:41</span>
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-slate-700 rounded-sm p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-700 rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {/* WebView Client content */}
              <div className="flex-1 rounded-b-[28px] overflow-hidden bg-white relative">
                <AdContent
                  params={params}
                  step={clientStep}
                  setStep={setClientStep}
                  onSendLog={triggerManualLog}
                />
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* Quick Testing Instructions Helper widget */}
            <div className="mt-5 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex gap-3 text-xs leading-relaxed text-slate-300">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-0.5">🚀 헬로우월드 시안 검증 단계</p>
                <ol className="list-decimal pl-4.5 space-y-1 text-slate-400 mt-1">
                  <li><strong className="text-blue-400">오른쪽 콘솔</strong>에서 원하는 유저ID나 미션 형식을 고릅니다.</li>
                  <li>스마트폰 화면 속 <strong className="text-white">"미션 시작"</strong>을 터치해 상자깡 또는 퀴즈를 해결하세요.</li>
                  <li>성공하면 사운드음과 함께 <strong className="text-emerald-400">MISSION_COMPLETED</strong> 신호가 수신되는 것을 확인하세요.</li>
                </ol>
              </div>
            </div>

          </div>
        </div>

        {/* MID/RIGHT COMPONENTS / SCREEN 2 & 3 */}
        
        {/* Host Simulator Control and Logs */}
        <div className={`col-span-12 lg:col-span-8 flex flex-col gap-6 ${activeTab === 'simulator' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex-1 flex flex-col">
            <HostSimulator
              params={params}
              setParams={setParams}
              logs={logs}
              setLogs={setLogs}
            />
          </div>
        </div>

        {/* Developer Integration Code Exporter guide */}
        <div className={`col-span-12 ${activeTab === 'guide' ? 'flex' : 'hidden lg:flex lg:col-span-12'}`}>
          <div className="w-full mt-2 lg:mt-0">
            <CodeExporter />
          </div>
        </div>

      </main>

      {/* Footer System Credits */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-3 mt-auto">
        <span>TOSS APPS IN-APP AD SIMULATION TOOLSET</span>
        <span className="text-[10px]">CURRENT TIME: 2026-05-21 03:51:44 UTC</span>
      </footer>

    </div>
  );
}
