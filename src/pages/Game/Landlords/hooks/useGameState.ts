/**
 * 斗地主游戏 Hooks - 状态管理和业务逻辑
 * 使用统一消息格式: TURN_NOTIFY (回合通知) 和 ACTION_RESULT (操作结果)
 *
 * 本文件只做编排：
 * - 状态默认值/玩家数据标准化 → ./state
 * - WebSocket 收发 → ./websocket
 * - 消息处理器 → ./handlers/*
 * - 玩家查询 → ./queries
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { message as antMessage } from 'antd';
import { wsService } from '@/services/websocket';
import { useModel } from '@umijs/max';
import {
  GameState,
  ChatMessage,
  GameResult,
  TempLeaveInfo,
  MSG_TYPE,
} from '../types';
import { isPlayingPhase, isRobbingPhase } from '../types/phase';
import { defaultGameState } from './state';
import { useSendGameMessage } from './websocket';
import { createPlayerQueries } from './queries';
import {
  createGameStateUpdateHandler,
  createGameStartHandler,
  createGameChatHandler,
  createErrorHandler,
} from './handlers/state';
import {
  createTurnNotifyHandler,
  createActionResultHandler,
} from './handlers/turn';
import {
  createRoomStateHandler,
  createReadyHandler,
  createLeaveRoomHandler,
} from './handlers/room';
import {
  PlayableCombination,
  getPlayableCombinations,
  sortCombinations,
} from '../utils/pokerHint';

const TIMER_INTERVAL = 100; // ms

/**
 * 斗地主游戏状态管理 Hook
 */
export function useGameState(roomId: string | undefined) {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const userId = currentUser?.id;
  const sendGameMessage = useSendGameMessage();

  // ===== 状态 =====
  const [gameState, setGameState] = useState<GameState>(defaultGameState);
  const [handCards, setHandCards] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playerHints, setPlayerHints] = useState<Record<string, string>>({});
  const [leftRoom, setLeftRoom] = useState(false);
  const [tempLeaveInfo, setTempLeaveInfo] = useState<TempLeaveInfo | null>(null);
  const [playerAction, setPlayerAction] = useState({
    canRob: false,
    canPlay: false,
    canPass: false,
    robOptions: [] as any[],
    timeout: 30,
    currentPlayerId: null as number | string | null,
    action: '',
  });

  // 提示状态管理
  const [hintCombinations, setHintCombinations] = useState<PlayableCombination[]>([]);
  const [hintCurrentIndex, setHintCurrentIndex] = useState(0);
  const hintCombinationsRef = useRef<PlayableCombination[]>([]);
  const hintCurrentIndexRef = useRef(0);

  useEffect(() => { hintCombinationsRef.current = hintCombinations; }, [hintCombinations]);
  useEffect(() => { hintCurrentIndexRef.current = hintCurrentIndex; }, [hintCurrentIndex]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const totalTimeRef = useRef<number>(30);
  const handlersRef = useRef<Record<string, (data: any) => void>>({});
  const isUnmountRef = useRef(false);

  // 用 ref 追踪最新值，避免依赖数组问题
  const userIdRef = useRef(userId);
  const roomIdRef = useRef(roomId);
  const gameStateRef = useRef(gameState);
  const leftRoomRef = useRef(leftRoom);

  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { leftRoomRef.current = leftRoom; }, [leftRoom]);

  // ===== 消息处理器（使用 useRef 存储，避免重新创建） =====
  // 这些 ref 在组件生命周期内保持稳定，不会导致 Hook 顺序变化
  const handleGameStateUpdateRef = useRef<ReturnType<typeof createGameStateUpdateHandler>>();
  const handleGameStartRef = useRef<ReturnType<typeof createGameStartHandler>>();
  const handleGameChatRef = useRef<ReturnType<typeof createGameChatHandler>>();
  const handleRoomStateRef = useRef<ReturnType<typeof createRoomStateHandler>>();
  const handleGameReadyRef = useRef<ReturnType<typeof createReadyHandler>>();
  const handleLeaveRoomRef = useRef<ReturnType<typeof createLeaveRoomHandler>>();
  const handleTurnNotifyRef = useRef<ReturnType<typeof createTurnNotifyHandler>>();
  const handleActionResultRef = useRef<ReturnType<typeof createActionResultHandler>>();
  const handleErrorRef = useRef<ReturnType<typeof createErrorHandler>>();

  // 初始化处理器（只在挂载时创建一次）
  useEffect(() => {
    handleGameStateUpdateRef.current = createGameStateUpdateHandler(
      userIdRef.current,
      setGameState,
      setHandCards,
      setLoading,
    );

    handleGameChatRef.current = createGameChatHandler(setChatMessages, () => userIdRef.current);
    handleGameReadyRef.current = createReadyHandler(setGameState);
    handleLeaveRoomRef.current = createLeaveRoomHandler(setTempLeaveInfo);
    handleTurnNotifyRef.current = createTurnNotifyHandler(
      setPlayerAction,
      setGameState,
      setPlayerHints,
      setTimeLeft,
    );
    handleErrorRef.current = createErrorHandler(setLoading);

    // 这些处理器依赖其他处理器，使用 current 访问最新引用
    handleGameStartRef.current = createGameStartHandler(
      (payload: any) => handleGameStateUpdateRef.current?.(payload),
      setGameState,
      setGameResult,
      setPlayerHints,
      setSelectedCards,
    );

    // 统一房间状态处理器（处理 CREATE, JOIN, RECONNECT）
    handleRoomStateRef.current = createRoomStateHandler(
      userIdRef.current,
      (payload: any) => handleGameStateUpdateRef.current?.(payload),
      setGameState,
      setLoading,
      setGameResult,
      roomIdRef.current,
    );

    handleActionResultRef.current = createActionResultHandler(
      userIdRef.current,
      setGameState,
      setPlayerHints,
      setSelectedCards,
      setGameResult,
    );
  }, []);

  // 清理定时器
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 注册 WebSocket 消息处理器
  useEffect(() => {
    if (!userId || leftRoom) return;

    const safeHandler = (fn: any) => (data: any) => {
      try {
        if (typeof fn === 'function') fn(data);
      } catch (e) {
        console.error('[landlords] handler error:', e);
      }
    };

    // turn notify 需要传入 refs
    const turnNotifyWithRefs = (data: any) => {
      handleTurnNotifyRef.current?.(data, totalTimeRef, startTimeRef);
    };

    const handlers: Record<string, (data: any) => void> = {
      [MSG_TYPE.GAME_STATE_UPDATE]: safeHandler(handleGameStateUpdateRef.current),
      [MSG_TYPE.GAME_START]: safeHandler(handleGameStartRef.current),
      [MSG_TYPE.GAME_CHAT]: safeHandler(handleGameChatRef.current),
      [MSG_TYPE.GAME_ROOM_STATE]: safeHandler(handleRoomStateRef.current),
      [MSG_TYPE.GAME_READY]: safeHandler(handleGameReadyRef.current),
      [MSG_TYPE.GAME_LEAVE_ROOM]: safeHandler(handleLeaveRoomRef.current),
      [MSG_TYPE.GAME_TURN_NOTIFY]: safeHandler(turnNotifyWithRefs),
      [MSG_TYPE.GAME_ACTION_RESULT]: safeHandler(handleActionResultRef.current),
      [MSG_TYPE.ERROR]: safeHandler(handleErrorRef.current),
    };

    handlersRef.current = handlers;
    Object.entries(handlers).forEach(([type, handler]) => {
      wsService.addMessageHandler(type, handler);
    });

    return () => {
      isUnmountRef.current = true;

      // 如果不是主动离开，则发送离开房间消息
      // leftRoomRef.current 为 true 表示用户主动点击返回按钮离开，此时 leaveRoom 已经处理过
      if (!leftRoomRef.current && roomIdRef.current) {
        console.debug('[landlords] 组件卸载，发送离开房间消息');
        sendGameMessage(MSG_TYPE.GAME_LEAVE_ROOM, { roomId: roomIdRef.current });
      }

      Object.entries(handlers).forEach(([type, handler]) => {
        wsService.removeMessageHandler(type, handler);
      });
      handlersRef.current = {};
    };
  }, [userId, leftRoom]);

  // 加入房间
  useEffect(() => {
    if (!roomId || !userId || leftRoom) return;
    setLoading(true);
    sendGameMessage(MSG_TYPE.GAME_JOIN_ROOM, { roomId });
  }, [roomId, userId, leftRoom, sendGameMessage]);

  // 倒计时
  useEffect(() => {
    if (leftRoom) {
      clearTimer();
      return;
    }
    const inGamePhase =
      isPlayingPhase(gameState.phase) || isRobbingPhase(gameState.phase);
    const hasCurrentPlayer = gameState.currentPlayerId || gameState.currentRobPlayerId;
    if (inGamePhase && hasCurrentPlayer) {
      clearTimer();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current && totalTimeRef.current > 0) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const remaining = Math.max(0, Math.ceil(totalTimeRef.current - elapsed));
          setTimeLeft(remaining);
          if (remaining <= 0) clearTimer();
        }
      }, TIMER_INTERVAL);
    }
    return clearTimer;
  }, [gameState.currentPlayerId, gameState.currentRobPlayerId, gameState.phase, leftRoom]);

  // 页面卸载/关闭时标记离开状态（用于重连判断）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const currentRoomId = roomIdRef.current;
        const currentUserId = userIdRef.current;
        if (currentRoomId && currentUserId && !leftRoomRef.current) {
          console.debug('[landlords] 页面隐藏，标记离开房间');
          localStorage?.setItem(
            'landlords_left_room',
            JSON.stringify({ roomId: currentRoomId, timestamp: Date.now(), hidden: true })
          );
        }
      }
    };

    const handleBeforeUnload = () => {
      const currentRoomId = roomIdRef.current;
      const currentUserId = userIdRef.current;
      if (currentRoomId && currentUserId && !leftRoomRef.current) {
        console.debug('[landlords] 页面关闭，发送离开房间消息');
        // 使用 sendBeacon 确保消息发送
        const data = JSON.stringify({
          type: 'GAME_LEAVE_ROOM',
          data: JSON.stringify({ roomId: currentRoomId }),
        });
        navigator.sendBeacon?.('/api/ws/message', data);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ===== 业务操作（暴露给组件） =====
  const leaveRoom = () => {
    setLeftRoom(true);
    clearTimer();
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) sendGameMessage(MSG_TYPE.GAME_LEAVE_ROOM, { roomId: currentRoomId });
    Object.entries(handlersRef.current).forEach(([type, handler]) => {
      wsService.removeMessageHandler(type, handler);
    });
    handlersRef.current = {};
  };

  const ready = () => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) sendGameMessage(MSG_TYPE.GAME_READY, { roomId: currentRoomId });
  };

  const startGame = () => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) {
      antMessage.loading('正在开始游戏...');
      sendGameMessage(MSG_TYPE.GAME_START, { roomId: currentRoomId });
    }
  };

  const playCards = (pokers: string[]) => {
    if (pokers.length === 0) {
      antMessage.warning('请选择要出的牌');
      return;
    }
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) sendGameMessage(MSG_TYPE.GAME_PLAY_CARDS, { roomId: currentRoomId, pokers });
  };

  const pass = () => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) sendGameMessage(MSG_TYPE.GAME_PASS, { roomId: currentRoomId });
  };

  const skipRob = () => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) sendGameMessage(MSG_TYPE.GAME_ROB_LANDLORD, { roomId: currentRoomId, action: 0 });
  };

  const robLandlord = (score: number) => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) sendGameMessage(MSG_TYPE.GAME_ROB_LANDLORD, { roomId: currentRoomId, action: score });
  };

  const sendChat = (content: string) => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId && currentUser) {
      sendGameMessage(MSG_TYPE.GAME_CHAT, {
        content,
        userName: currentUser.userName || '',
      });
    }
  };

  const cancelRobot = () => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) sendGameMessage(MSG_TYPE.GAME_CANCEL_ROBOT, { roomId: currentRoomId });
  };

  const setRobot = () => {
    const currentRoomId = roomIdRef.current;
    if (currentRoomId) sendGameMessage(MSG_TYPE.GAME_SET_ROBOT, { roomId: currentRoomId });
  };

  // ===== 提示功能 =====
  // 判断是否是首出牌（没人出过牌 = lastPlayed 为空）
  // 注意：lastPlayed 为空表示这一轮还没人出过牌，是首出
  const isFirstPlay = useCallback((lastPlayed: string[] | null): boolean => {
    // 如果上家没出过牌（或者就是自己），则是首出
    return !lastPlayed || lastPlayed.length === 0;
  }, []);

  // 更新提示组合列表（同步版本，返回计算结果）
  const calculateHintCombinations = useCallback((
    handCards: string[],
    lastPlayed: string[] | null,
    isFirst: boolean
  ): PlayableCombination[] => {
    // 关键修复：
    //   - 首出牌：仍然不包含"单/对/三"这种基础牌型（一般不会这样首出）
    //   - 压牌：必须包含基础牌型，否则上家出单/对/三时永远提示不出牌
    const includeBasic = isFirst ? false : true;
    const combos = getPlayableCombinations(handCards, lastPlayed, isFirst, includeBasic);
    const sorted = sortCombinations(combos, isFirst);
    // 同步更新 ref 和 state
    hintCombinationsRef.current = sorted;
    setHintCombinations(sorted);
    setHintCurrentIndex(0);
    return sorted;
  }, []);

  // 点击提示按钮：切换到下一个可出的组合
  const handleHint = useCallback((
    handCards: string[],
    lastPlayed: string[] | null,
    currentPlayerId: string | number | null
  ): PlayableCombination | null => {
    const isFirst = isFirstPlay(lastPlayed);

    // 同步计算组合（使用同步版本）
    let combos = calculateHintCombinations(handCards, lastPlayed, isFirst);

    if (combos.length === 0) {
      antMessage.warning('没有可出的牌');
      return null;
    }

    // 切换到下一个组合（从索引1开始，第一次点击显示第一个组合）
    const nextIndex = (hintCurrentIndexRef.current + 1) % combos.length;
    setHintCurrentIndex(nextIndex);

    return combos[nextIndex];
  }, [isFirstPlay, calculateHintCombinations]);

  // 重置提示状态（在新回合开始时调用）
  const resetHintState = useCallback(() => {
    hintCombinationsRef.current = [];
    setHintCombinations([]);
    setHintCurrentIndex(0);
  }, []);

  // ===== 派生查询 =====
  const {
    getMyPlayer,
    getOtherPlayers,
    getLeftPlayer,
    getRightPlayer,
    getPlayerNameById,
  } = useMemo(() => createPlayerQueries(gameState, userId), [gameState, userId]);

  const isMyTurn =
    !!userId &&
    (String(gameState.currentPlayerId) === String(userId) ||
      String(gameState.currentRobPlayerId) === String(userId));
  const isMyTurnToPlay = !!userId && String(gameState.currentPlayerId) === String(userId);
  const isMyTurnToRob = !!userId && String(gameState.currentRobPlayerId) === String(userId);

  return {
    // 状态
    gameState,
    handCards,
    setHandCards,
    selectedCards,
    setSelectedCards,
    clearSelected: () => setSelectedCards([]),
    chatMessages,
    loading,
    gameResult,
    setGameResult,
    timeLeft,
    playerAction,
    playerHints,
    tempLeaveInfo,

    // 玩家信息
    getMyPlayer,
    getOtherPlayers,
    getPlayerNameById,
    getLeftPlayer,
    getRightPlayer,
    isMyTurn,
    isMyTurnToPlay,
    isMyTurnToRob,

    leftRoom,

    // 操作
    leaveRoom,
    ready,
    startGame,
    playCards,
    pass,
    skipRob,
    robLandlord,
    sendChat,
    sendGameMessage,
    cancelRobot,
    setRobot,

    // 提示功能
    handleHint,
    resetHintState,
    hintCombinations,
    hintCurrentIndex,
    isFirstPlay,
  };
}
