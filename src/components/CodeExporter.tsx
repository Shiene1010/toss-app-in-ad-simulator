import React, { useState } from 'react';
import { Terminal, Copy, Check, FileText, Bookmark, Compass } from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function CodeExporter() {
  const [activeTab, setActiveTab] = useState<'javascript' | 'react-hook' | 'console-guide'>('javascript');
  const [copied, setCopied] = useState(false);

  const jsSnippet = `// 1. Toss App-in-Ad 웹앱 연동 가이드 (Pure JavaScript)

// 미션 로드 완료 시점 호출
function notifyAppReady(userId, adId, reward) {
  const message = {
    source: 'toss-app-in-ad-sdk',
    event: 'APP_READY',
    payload: {
      userId: userId,
      adId: adId,
      rewardPoints: reward,
      timestamp: new Date().toISOString()
    }
  };
  window.parent.postMessage(message, '*');
}

// 탭/클릭 등 사용자 특정 액션 수행 시점 호출
function notifyUserTap(count) {
  window.parent.postMessage({
    source: 'toss-app-in-ad-sdk',
    event: 'TAP_ACTION',
    payload: { currentTapCount: count }
  }, '*');
}

// 미션 성공 완료하여 포인트를 즉시 적립해야 할 대 호출
function notifyMissionCompleted(userId, rewardPoints) {
  window.parent.postMessage({
    source: 'toss-app-in-ad-sdk',
    event: 'MISSION_COMPLETED',
    payload: {
      userId: userId,
      rewardPoints: rewardPoints,
      completedAt: new Date().toISOString()
    }
  }, '*');
}

// 유저가 X 단추를 클릭해 창을 끌 때 호출
function notifyAdClosed() {
  window.parent.postMessage({
    source: 'toss-app-in-ad-sdk',
    event: 'AD_CLOSED',
    payload: { reason: 'user_completed' }
  }, '*');
}`;

  const reactSnippet = `// 2. React useTossBridge.ts Custom Hook 구현

import { useEffect, useCallback } from 'react';

export function useTossBridge(userId: string, adId: string) {
  // 메인 이벤트 전송 유틸리티 함수
  const sendEvent = useCallback((event: string, payload: any) => {
    const message = {
      source: 'toss-app-in-ad-sdk',
      event,
      payload: {
        userId,
        adId,
        timestamp: new Date().toISOString(),
        ...payload,
      }
    };
    
    // 부모 프레임(Toss App Wrapper Webview)으로 전송
    if (window.parent) {
      window.parent.postMessage(message, '*');
    }
  }, [userId, adId]);

  // 마운트 후 초기화 신호 전송
  useEffect(() => {
    sendEvent('APP_READY', { sdkVersion: '1.2.0' });
  }, [sendEvent]);

  return { sendEvent };
}

// Usage in Component:
// const { sendEvent } = useTossBridge(userId, adId);
// <button onClick={() => sendEvent('MISSION_COMPLETED', { rewardPoints: 100 })}>완료</button>
`;

  const consoleSnippet = `{
  "name": "toss-app-in-ad-hello",
  "version": "1.0.0",
  "description": "토스 앱인애드(App-in-Ad) 웹 광고 규격 검증용 헬로우월드",
  "tossConfig": {
    "appId": "toss.ad.sample.helloworld",
    "hostPermissions": ["window.parent.postMessage"],
    "orientation": "portrait",
    "parameters": {
      "userId": { "required": true, "description": "참여 유저의 식별키" },
      "adId": { "required": true, "description": "광고 고유 캠페인 식별키" },
      "rewardPoints": { "required": false, "default": 20 }
    }
  }
}`;

  const getCodeString = () => {
    if (activeTab === 'javascript') return jsSnippet;
    if (activeTab === 'react-hook') return reactSnippet;
    return consoleSnippet;
  };

  const handleCopy = () => {
    playClickSound();
    navigator.clipboard.writeText(getCodeString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full font-sans">
      <div className="bg-slate-50 border-b border-slate-150 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4.5 h-4.5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800">앱스인토스 연동 가이드 & 소스코드</h2>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '복사 완료' : '코드 복사'}</span>
        </button>
      </div>

      <div className="flex border-b border-slate-150 bg-slate-50/50">
        <button
          onClick={() => { playClickSound(); setActiveTab('javascript'); }}
          className={`flex-1 py-3 text-xs font-semibold border-b-2 text-center transition-colors cursor-pointer ${
            activeTab === 'javascript'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          JavaScript SDK (Vanilla)
        </button>
        <button
          onClick={() => { playClickSound(); setActiveTab('react-hook'); }}
          className={`flex-1 py-3 text-xs font-semibold border-b-2 text-center transition-colors cursor-pointer ${
            activeTab === 'react-hook'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          React Custom Hook
        </button>
        <button
          onClick={() => { playClickSound(); setActiveTab('console-guide'); }}
          className={`flex-1 py-3 text-xs font-semibold border-b-2 text-center transition-colors cursor-pointer ${
            activeTab === 'console-guide'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Console JSON Draft (Manifest)
        </button>
      </div>

      <div className="flex-1 p-5 overflow-auto bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed max-h-[420px] lg:max-h-none">
        <pre className="whitespace-pre">{getCodeString()}</pre>
      </div>

      <div className="bg-slate-50 px-5 py-4.5 border-t border-slate-150 flex items-start gap-3">
        <FileText className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-500 leading-normal">
          <p className="font-bold text-slate-800 mb-0.5">💡 토스 앱인애드 콘솔 검증 팁</p>
          <p>토스 콘솔 업로드 시에 WebApp URL을 등록하고, 쿼리 매개변수로 테스트 환경을 시물레이트해볼 수 있습니다. 이 검사 툴은 브리지 가상 수신기를 이용해 `postMessage` 이벤트가 상위 컨테이너로 정상 전송되었는지를 콘솔 수준에서 실시간으로 시안 테스트해보게 돕습니다.</p>
        </div>
      </div>
    </div>
  );
}
