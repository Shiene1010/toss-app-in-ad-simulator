import React, { useEffect, useRef } from 'react';
import { Play, PlayCircle, ShieldAlert, Sparkles, Trash2, CheckCircle2, Info, ArrowDownCircle, Settings } from 'lucide-react';
import { AdParams, BridgeLog } from '../types';
import { playClickSound } from '../utils/audio';

interface HostSimulatorProps {
  params: AdParams;
  setParams: React.Dispatch<React.SetStateAction<AdParams>>;
  logs: BridgeLog[];
  setLogs: React.Dispatch<React.SetStateAction<BridgeLog[]>>;
}

export default function HostSimulator({ params, setParams, logs, setLogs }: HostSimulatorProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Setup window-level message listener to capture real frame postMessages as well
  useEffect(() => {
    const handlePostMessage = (e: MessageEvent) => {
      if (e.data && e.data.source === 'toss-app-in-ad-sdk') {
        const { event, payload } = e.data;
        
        // Avoid adding duplicates of custom events we already added
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

    window.addEventListener('message', handlePostMessage);
    return () => window.removeEventListener('message', handlePostMessage);
  }, [setLogs]);

  const handleClearLogs = () => {
    playClickSound();
    setLogs([]);
  };

  const handleParamChange = (key: keyof AdParams, value: any) => {
    playClickSound();
    setParams(prev => {
      // If changing hasQuiz, also configure standard dummy questions
      if (key === 'hasQuiz' && value === true) {
        return {
          ...prev,
          hasQuiz: true,
          quizQuestion: '토스(Toss)에서 매주 행운의 포인트를 받는 만보기 미션의 하루 목표 걸음수는?',
          quizAnswer: '10,000걸음',
          quizOptions: ['2,000걸음', '5,000걸음', '10,000걸음']
        };
      }
      return {
        ...prev,
        [key]: value
      };
    });

    // Notify of parameter update
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        event: 'MOCK_URL_PARAMS_CHANGED',
        payload: { [key]: value }
      }
    ]);
  };

  const getEventBadgeColor = (event: string) => {
    switch (event) {
      case 'APP_READY':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MISSION_STARTED':
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'TAP_ACTION':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'QUIZ_ANSWER_SUBMITTED':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'INTERACTION_COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'MISSION_COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold ring-2 ring-emerald-100';
      case 'AD_CLOSED':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'MOCK_URL_PARAMS_CHANGED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full font-sans">
      
      {/* Settings Section */}
      <div className="border-b border-slate-150 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4.5 h-4.5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800">1. URL Query 파라미터 시뮬레이션 설정</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* User ID input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">사용자 고유식별ID (User ID)</label>
            <input
              type="text"
              value={params.userId}
              onChange={(e) => handleParamChange('userId', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Ad Campaign ID */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">광고 캠페인 고유ID (Ad ID)</label>
            <input
              type="text"
              value={params.adId}
              onChange={(e) => handleParamChange('adId', e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Reward Points */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">지급될 포인트 금액 (Reward)</label>
            <select
              value={params.rewardPoints}
              onChange={(e) => handleParamChange('rewardPoints', Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value={10}>10 Toss 머니</option>
              <option value={20}>20 Toss 머니</option>
              <option value={50}>50 Toss 머니</option>
              <option value={100}>100 Toss 머니</option>
            </select>
          </div>

          {/* Ad Type Gimmick */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">앱인애드 세부 형태 (Type)</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleParamChange('hasQuiz', false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                  !params.hasQuiz
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                상자클릭형
              </button>
              <button
                type="button"
                onClick={() => handleParamChange('hasQuiz', true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                  params.hasQuiz
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                퀴즈 정답형
              </button>
            </div>
          </div>
        </div>

        {/* Live URL Tracker Preview */}
        <div className="mt-4 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="truncate max-w-[280px] sm:max-w-md">
            ?userId={params.userId}&adId={params.adId}&reward={params.rewardPoints}&hasQuiz={params.hasQuiz ? 'true' : 'false'}
          </span>
          <span className="shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-bold">LIVE QUERY</span>
        </div>
      </div>

      {/* Bridge Monitor Console */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <div className="bg-slate-50/70 border-b border-slate-150 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">2. 브리지 postMessage 실시간 모니터</h2>
          </div>
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>로그 비우기</span>
            </button>
          )}
        </div>

        {/* Log stream window */}
        <div 
          ref={logContainerRef}
          className="flex-1 bg-slate-950 p-5 overflow-y-auto space-y-4 font-mono text-[11px] min-h-[220px]"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
              <ArrowDownCircle className="w-8 h-8 text-slate-600 mb-2.5 animate-bounce" />
              <p className="font-semibold text-slate-400">대기 중 : 앱인애드 브리지 신호 수신</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[250px]">왼쪽 모바일 화면에서 시작 단추를 클릭해 이벤트를 시작하면, 상위 Toss 컨테이너 수신 규격 로그가 여기에 로깅됩니다.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border-b border-slate-900 pb-3">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-bold ">[{log.timestamp}]</span>
                    
                    {log.type === 'sent' && (
                      <span className="px-1 py-0.5 bg-blue-900/40 text-blue-300 font-bold rounded text-[9px] uppercase">
                        webapp → host
                      </span>
                    )}
                    {log.type === 'received' && (
                      <span className="px-1 py-0.5 bg-emerald-950 text-emerald-300 font-black rounded text-[9px] uppercase border border-emerald-900/60 animate-pulse">
                        host received
                      </span>
                    )}
                    {log.type === 'info' && (
                      <span className="px-1 py-0.5 bg-slate-800 text-slate-400 font-semibold rounded text-[9px] uppercase">
                        internal
                      </span>
                    )}

                    <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-lg ${getEventBadgeColor(log.event)}`}>
                      {log.event}
                    </span>
                  </div>
                  
                  <span className="text-[9px] text-slate-600">ID: {log.id}</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg text-slate-300 overflow-x-auto whitespace-pre">
                  {JSON.stringify(log.payload, null, 2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
