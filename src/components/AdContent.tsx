import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Coins, Sparkles, AlertCircle, ArrowRight, HelpCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { AdParams, AdStep } from '../types';
import { playClickSound, playRewardSound, playSuccessSound } from '../utils/audio';

interface AdContentProps {
  params: AdParams;
  step: AdStep;
  setStep: (step: AdStep) => void;
  onSendLog: (event: string, payload: any) => void;
}

export default function AdContent({ params, step, setStep, onSendLog }: AdContentProps) {
  // Mini game state
  const [tapCount, setTapCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizStatus, setQuizStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  
  // Timer for watch mission
  const [timer, setTimer] = useState(3);
  const [timerActive, setTimerActive] = useState(false);

  // Send a postMessage bridge event
  const dispatchBridge = (event: string, payload: any) => {
    const rawPayload = {
      adId: params.adId,
      userId: params.userId,
      rewardPoints: params.rewardPoints,
      env: params.environment,
      ...payload
    };

    const message = {
      source: 'toss-app-in-ad-sdk',
      event,
      payload: rawPayload
    };

    // To local CustomEvent for host simulator preview
    window.dispatchEvent(new CustomEvent('toss-bridge-event', { detail: message }));
    
    // To outer systems
    window.parent.postMessage(message, '*');

    // Notify logs
    onSendLog(event, rawPayload);
  };

  // Trigger APP_READY on load
  useEffect(() => {
    dispatchBridge('APP_READY', {
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      initializedAt: new Date().toISOString()
    });
  }, [params.adId]);

  // Handle timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            playSuccessSound();
            dispatchBridge('TIMER_FINISHED', { durationSeconds: 3 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  const handleStartMission = () => {
    playClickSound();
    setStep('interaction');
    setTapCount(0);
    setSelectedOption(null);
    setQuizStatus('idle');
    setTimer(3);
    
    dispatchBridge('MISSION_STARTED', {
      startedAt: new Date().toISOString(),
      type: params.hasQuiz ? 'quiz' : 'tap_gimmick'
    });

    if (!params.hasQuiz) {
      // Start 3s secondary watching timer challenge along with click
      setTimerActive(true);
    }
  };

  const handleTapBox = () => {
    if (tapCount >= 5) return;
    
    playClickSound();
    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    dispatchBridge('TAP_ACTION', {
      currentTapCount: nextCount,
      targetTaps: 5
    });

    if (nextCount === 5) {
      playSuccessSound();
      dispatchBridge('INTERACTION_COMPLETED', {
        success: true,
        type: 'tap_gimmick'
      });
      
      // Auto-transition to complete after short delay for juice
      setTimeout(() => {
        handleCompleteMission();
      }, 700);
    }
  };

  const handleQuizAnswer = (option: string) => {
    if (quizStatus === 'correct') return;
    
    playClickSound();
    setSelectedOption(option);
    
    if (option === params.quizAnswer) {
      setQuizStatus('correct');
      playSuccessSound();
      
      dispatchBridge('QUIZ_ANSWER_SUBMITTED', {
        selected: option,
        correct: true
      });

      dispatchBridge('INTERACTION_COMPLETED', {
        success: true,
        type: 'quiz'
      });

      setTimeout(() => {
        handleCompleteMission();
      }, 1200);
    } else {
      setQuizStatus('wrong');
      dispatchBridge('QUIZ_ANSWER_SUBMITTED', {
        selected: option,
        correct: false
      });
      
      // Reset after brief hint
      setTimeout(() => {
        setQuizStatus('idle');
        setSelectedOption(null);
      }, 1500);
    }
  };

  const handleCompleteMission = () => {
    setStep('completed');
    playRewardSound();
    dispatchBridge('MISSION_COMPLETED', {
      completedAt: new Date().toISOString(),
      rewardEarned: params.rewardPoints
    });
  };

  const handleCloseAd = () => {
    playClickSound();
    dispatchBridge('AD_CLOSED', {
      reason: 'user_completed'
    });
  };

  const handleResetForTesting = () => {
    playClickSound();
    setStep('intro');
    setTapCount(0);
    setSelectedOption(null);
    setQuizStatus('idle');
    setTimer(3);
    setTimerActive(false);
    dispatchBridge('TEST_RESET', {});
  };

  return (
    <div id="ad-content-root" className="w-full h-full flex flex-col bg-slate-50 text-slate-900 select-none overflow-hidden relative font-sans">
      
      {/* Header Bar representing Toss embedded view */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-5 bg-white shrink-0">
        <div className="flex items-center gap-1.5 font-medium text-sm text-slate-800">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Toss WebApp Ad</span>
        </div>
        <button
          onClick={handleResetForTesting}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          title="테스트 초기화"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: INTRO */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="mt-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>오늘의 행운 미션</span>
                </div>
                
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                  간단한 미션 참여하고<br />
                  <span className="text-blue-600 font-extrabold">{params.rewardPoints}원</span> 받아가세요!
                </h1>

                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  토스 앱스인토스(Apps-in-Toss) 가이드라인을 완벽히 모방하는 고정밀 미니앱 미션입니다.
                </p>

                {/* Info Card */}
                <div className="mt-6 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">예상 리워드</h3>
                    <p className="text-base font-bold text-slate-800">{params.rewardPoints} Toss포인트 즉시 지급</p>
                    <p className="text-xs text-slate-400 mt-0.5">미션 완료 즉시 host postMessage 전달</p>
                  </div>
                </div>
              </div>

              {/* Bot Button */}
              <div className="mb-2">
                <button
                  id="btn-start-mission"
                  onClick={handleStartMission}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all flex items-center justify-center gap-2 text-base active:scale-98 cursor-pointer"
                >
                  <span>미션 시작하고 포인트 받기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3 text-slate-300" />
                  <span>참여 ID: {params.userId.slice(0, 12)}...</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: INTERACTION */}
          {step === 'interaction' && (
            <motion.div
              key="interaction"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-between"
            >
              {params.hasQuiz ? (
                /* QUIZ FLAVOR */
                <div className="flex-1 flex flex-col justify-between">
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold mb-4">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>퀴즈형 미션</span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-800 leading-snug">
                      {params.quizQuestion}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      정답을 맞추면 즉시 토스 포인트 보상을 수령할 수 있습니다.
                    </p>

                    {/* Quiz Choice Options */}
                    <div className="mt-6 flex flex-col gap-3">
                      {params.quizOptions.map((option, idx) => {
                        const isSelected = selectedOption === option;
                        let btnClass = "bg-white border text-left p-4 rounded-xl font-medium text-sm transition-all shadow-2xs cursor-pointer active:scale-[0.99] ";
                        
                        if (isSelected) {
                          if (quizStatus === 'correct') {
                            btnClass += "border-green-500 bg-green-50 text-green-700 shadow-sm";
                          } else if (quizStatus === 'wrong') {
                            btnClass += "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100";
                          } else {
                            btnClass += "border-blue-500 bg-blue-50 text-blue-700";
                          }
                        } else {
                          btnClass += "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleQuizAnswer(option)}
                            className={btnClass}
                            disabled={quizStatus === 'correct'}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {isSelected && quizStatus === 'correct' && (
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                              )}
                              {isSelected && quizStatus === 'wrong' && (
                                <span className="text-red-500 text-xs font-bold uppercase">wrong</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer status for quiz */}
                  <div className="mb-4 text-center">
                    {quizStatus === 'wrong' && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-semibold text-red-500 mt-2"
                      >
                        앗! 틀렸습니다. 다시 시도해 보세요.
                      </motion.p>
                    )}
                    {quizStatus === 'correct' && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-semibold text-green-600 mt-2 flex items-center justify-center gap-1.5"
                      >
                        <span>✓ 정답입니다! 포인트 수령하는 중...</span>
                      </motion.p>
                    )}
                  </div>
                </div>
              ) : (
                /* CLICK GIMMICK FLAVOR */
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold mb-4">
                      <Gift className="w-3.5 h-3.5" />
                      <span>클릭형 미션</span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-800">
                      행운의 선물상자 열기 🎁
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      선물 상자를 5번 빠르게 탭하여 행운 포인트를 획득해 보세요!
                    </p>

                    {/* Fun Interactive Game Board */}
                    <div className="mt-8 flex flex-col items-center justify-center py-6 bg-white border border-slate-100 rounded-2xl shadow-xs relative overflow-hidden">
                      {/* Interactive Box with motion scale */}
                      <motion.div
                        className="cursor-pointer relative z-10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleTapBox}
                      >
                        <div className={`w-28 h-28 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${tapCount >= 5 ? 'bg-green-500' : 'bg-blue-600'}`}>
                          <Gift className={`w-14 h-14 text-white ${tapCount > 0 && tapCount < 5 ? 'animate-bounce' : ''}`} />
                        </div>
                        {tapCount > 0 && tapCount < 5 && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                            {tapCount}
                          </div>
                        )}
                      </motion.div>

                      {/* Sparkle effects on tap */}
                      {tapCount > 0 && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="text-amber-500 w-full text-center text-xs font-bold animate-ping">
                            {tapCount === 5 ? '🎉 완성!' : 'TAP! 🚀'}
                          </div>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="w-4/5 mt-8">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-bold">
                          <span>탭 진척도</span>
                          <span>{tapCount} / 5회</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <motion.div
                            className="bg-blue-600 h-full rounded-full"
                            animate={{ width: `${(tapCount / 5) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 120 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Automatic 3s Watch challenge bar helper */}
                    <div className="mt-4 bg-slate-100 rounded-xl p-3 border border-slate-150 flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2">
                        {timer > 0 ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                          </>
                        ) : (
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        )}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {timer > 0 ? `체류 미션 : 광고 ${timer}초 동안 더 보기` : '체류 미션 완료! 추가 보상이 활성화되었습니다.'}
                      </span>
                    </div>

                  </div>

                  <div className="mb-2">
                    {/* Bypass option if they want to speed test */}
                    <button
                      onClick={handleCompleteMission}
                      disabled={tapCount < 5 && timer > 0}
                      className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        (tapCount >= 5 || timer === 0)
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-50'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>보상 획득하기</span>
                      <Coins className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* STEP 3: COMPLETED */}
          {step === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-between text-center"
            >
              <div className="mt-6 flex flex-col items-center">
                {/* Toss Style Golden Coin Bounce */}
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 360 }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  className="w-24 h-24 rounded-full bg-amber-400 hover:bg-amber-300 shadow-xl flex items-center justify-center border-4 border-amber-250 mb-6"
                >
                  <Coins className="w-12 h-12 text-white drop-shadow-sm" />
                </motion.div>

                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold mb-3">
                  <span>미션 완료 상태</span>
                </div>

                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  축하드려요!<br />리워드가 전달되었습니다
                </h1>

                <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[240px]">
                  Toss WebApp Console SDK 표준 `MISSION_COMPLETED` 이벤트가 트리거되었습니다.
                </p>

                {/* Simulated Point Badge */}
                <div className="mt-5 px-5 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl w-full max-w-xs">
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">TOSS WALLET BALANCE</span>
                  <div className="text-xl font-black text-blue-600 mt-0.5 flex items-center justify-center gap-1">
                    <span>+{params.rewardPoints}P</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    ID: {params.userId.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {/* Action Buttons representing App Closure or redirection */}
              <div className="mb-2 flex flex-col gap-2.5">
                <button
                  id="btn-close-ad"
                  onClick={handleCloseAd}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-md transition-all text-sm active:scale-98 cursor-pointer"
                >
                  미션 종료하고 돌아가기 (Close)
                </button>
                
                <button
                  onClick={handleResetForTesting}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>테스트 처음부터 다시하기</span>
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      
      {/* Footer Branding similar to Toss Applets */}
      <div className="h-10 border-t border-slate-50 bg-white flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-mono">
        SECURE IN-APP AD CONTAINER v1.0.4-TEST
      </div>
    </div>
  );
}
