import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TossAds } from '@apps-in-toss/web-framework';

// Toss SDK 초기화를 앱 마운트 전에 백그라운드에서 실행
// - 기존 React 루트 렌더링 흐름을 막지 않도록 try/catch로 안전 감싸기
// - 토스 앱 인애드 브리지 핸드셰이크가 early-stage에서 완료되도록 함
try {
  // Toss SDK 초기화를 앱 마운트 전에 백그라운드에서 실행
  // - 기존 React 루트 렌더링 흐름을 막지 않도록 try/catch로 안전 감싸기
  // - 토스 앱 인애드 브리지 핸드셰이크가 early-stage에서 완료되도록 함
  TossAds.initialize({});
} catch (error) {
  // initialize 시도는 실패해도 앱 구동은 계속됨
  // (토스 앱 인애드 외부 환경에서는 정상 동작하지 않을 수 있음)
  console.info('Toss SDK initialization skipped or failed (expected in non-toss environment)');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
