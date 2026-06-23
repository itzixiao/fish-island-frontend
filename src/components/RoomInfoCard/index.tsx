import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Badge, Avatar, Button, Tooltip, Spin, Empty, List, message, Space, Modal, Form, Input, InputNumber, Radio, Popconfirm, Tabs } from 'antd';
import {
  TeamOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RightOutlined,
  UserOutlined,
  PlayCircleOutlined,
  StopOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  DragOutlined,
  PushpinOutlined,
  PushpinFilled,
  SendOutlined,
  CommentOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  BulbOutlined,
  ShareAltOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import {
  getRoomByIdUsingGet1,
  voteUsingPost,
  joinRoomUsingPost1,
  startGameUsingPost1,
  endGameUsingPost1,
  createRoomUsingPost1,
  removeActiveRoomUsingPost,
  quitRoomUsingPost1,
  guessWordUsingPost1,
  getAllRoomsUsingGet1
} from '@/services/backend/undercoverGameController';
import { history, useModel } from '@umijs/max';
import styles from './index.less';
import { wsService } from '@/services/websocket';
import eventBus from '@/utils/eventBus';

// 添加聊天消息接口
interface ChatMessage {
  content: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  id?: string; // 添加可选的id字段
  roomId?: string; // 添加房间ID字段
  sender?: {
    id: string;
    name: string;
    avatar: string;
    level: number;
    isAdmin: boolean;
  }; // 添加可选的sender字段
}

interface RoomInfoCardProps {
  visible: boolean;
  onClose: () => void;
}

interface CreateRoomFormValues {
  maxPlayers: number;
  civilianWord: string;
  undercoverWord: string;
  duration: number;
  roomType: 'god' | 'random';
  gameMode: number; // 修改为数字类型，1-常规模式，2-卧底猜词模式
}

// 辅助函数：安全调用ref.current函数
const safelyCallRef = <T extends unknown[], R>(
  ref: React.MutableRefObject<((...args: T) => R) | undefined>,
  ...args: T
): R | undefined => {
  if (ref.current) {
    return ref.current(...args);
  }
  return undefined;
};

const RoomInfoCard = ({ visible, onClose }: RoomInfoCardProps): React.ReactNode => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [roomInfo, setRoomInfo] = useState<API.UndercoverRoomVO | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [votingFor, setVotingFor] = useState<number | null>(null);
  const [votingLoading, setVotingLoading] = useState<boolean>(false);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);
  const [startingGame, setStartingGame] = useState<boolean>(false);
  const [endingGame, setEndingGame] = useState<boolean>(false);
  const [creatingRoom, setCreatingRoom] = useState<boolean>(false);
  const [removingRoom, setRemovingRoom] = useState<boolean>(false);
  const [quittingRoom, setQuittingRoom] = useState<boolean>(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState<boolean>(false);
  const [isRuleModalVisible, setIsRuleModalVisible] = useState<boolean>(false);
  const [isGuessModalVisible, setIsGuessModalVisible] = useState<boolean>(false);
  const [guessWord, setGuessWord] = useState<string>('');
  const [guessing, setGuessing] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [guessForm] = Form.useForm();

  // 添加房间列表相关状态
  const [activeTab, setActiveTab] = useState<string>('current');
  const [roomList, setRoomList] = useState<API.UndercoverRoomVO[]>([]);
  const [roomListLoading, setRoomListLoading] = useState<boolean>(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  // 添加当前活跃房间ID状态
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // 使用ref存储函数，避免循环依赖
  const fetchRoomInfoRef = useRef<(silent?: boolean) => Promise<void>>();
  const fetchRoomListRef = useRef<() => Promise<void>>();
  const handleJoinSpecificRoomRef = useRef<(roomId: string) => Promise<void>>();

  // 添加拖动相关状态
  const [position, setPosition] = useState({ x: 10, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // 添加置顶状态
  const [isPinned, setIsPinned] = useState(false);

  // 添加聊天相关状态
  const [showChat, setShowChat] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // 添加静默刷新状态
  const [silentRefresh, setSilentRefresh] = useState<boolean>(false);

  // 添加用户消息查看状态
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [isUserMessagesVisible, setIsUserMessagesVisible] = useState<boolean>(false);

  // 添加邀请冷却状态
  const [inviteCooldown, setInviteCooldown] = useState<number>(0);
  const inviteCooldownRef = useRef<NodeJS.Timeout | null>(null);

  // 添加倒计时相关状态
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 确保位置初始化在视窗内
  useEffect(() => {
    if (visible && cardRef.current) {
      const maxX = window.innerWidth - cardRef.current.offsetWidth;
      const maxY = window.innerHeight - 100; // 留出一些底部空间

      setPosition(prev => ({
        x: Math.min(prev.x, maxX),
        y: Math.min(prev.y, maxY)
      }));
    }
  }, [visible]);

  // 当房间ID变化时，清空聊天消息
  useEffect(() => {
    if (roomInfo?.roomId) {
      // 清空聊天消息，以便加载新房间的消息
      setChatMessages([]);
      console.log('房间ID变化，已清空聊天消息，新房间ID:', roomInfo.roomId);
    }
  }, [roomInfo?.roomId]);

  // 添加WebSocket消息处理
  useEffect(() => {
      // 添加undercover消息处理器
      const handleUndercoverMessage = (data: any) => {
        // 检查消息格式
        if (data?.type === 'undercover') {
          const messageData = data.data.message;

          // 检查消息是否属于当前房间
          if (messageData.roomId && roomInfo?.roomId && messageData.roomId !== roomInfo.roomId) {
            return; // 如果消息不属于当前房间，则不处理
          }

          const newMessage: ChatMessage = {
            content: messageData.content,
            userId: messageData.sender.id,
            userName: messageData.sender.name,
            userAvatar: messageData.sender.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor',
            timestamp: new Date(messageData.timestamp),
            roomId: messageData.roomId // 保存消息的房间ID
          };

          setChatMessages(prev => [...prev, newMessage]);

          // 确保聊天窗口滚动到最新消息
          setTimeout(() => {
            if (chatMessagesRef.current) {
              chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }
          }, 100);
        }
      };

      // 添加refreshRoom消息处理器
      const handleRefreshRoomMessage = (data: any) => {
        // 检查是否是刷新房间的消息
        if (data?.data?.content?.roomId) {
          // 如果消息包含房间ID，且与当前活跃房间ID匹配，则刷新房间信息
          if (activeRoomId === data.data.content.roomId) {
            safelyCallRef(fetchRoomInfoRef, true); // 静默刷新，不显示加载状态
          } else if (data.data.content.action === 'create') {
            // 如果是创建房间的消息，刷新房间列表
            safelyCallRef(fetchRoomListRef);
          }
        } else {
          // 如果消息不包含房间ID，刷新当前房间信息（兼容旧消息格式）
          safelyCallRef(fetchRoomInfoRef, true);

          // 同时也刷新房间列表
          if (activeTab === 'list') {
            safelyCallRef(fetchRoomListRef);
          }
        }
      };

      // 添加gamestart消息处理器
      const handleGameStartMessage = (data: any) => {
        // 检查消息是否与当前活跃房间相关
        if (data?.data?.content?.roomId && activeRoomId === data.data.content.roomId) {
          message.success('游戏已开始!');
          safelyCallRef(fetchRoomInfoRef);
        } else if (!data?.data?.content?.roomId) {
          // 兼容旧消息格式
          message.success('游戏已开始!');
          safelyCallRef(fetchRoomInfoRef);
        }
      };

      // 添加倒计时消息处理器
      const handleCountdownMessage = (data: any) => {
        // 检查消息是否为倒计时类型，且与当前活跃房间相关
        data = data.data;
        if (data?.roomId && activeRoomId === data.roomId) {
          // 清除之前的倒计时定时器
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }

          // 设置初始倒计时值
          setCountdown(data.time);

          // 启动倒计时
          countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev === null || prev <= 1) {
                // 倒计时结束，清除定时器
                if (countdownTimerRef.current) {
                  clearInterval(countdownTimerRef.current);
                  countdownTimerRef.current = null;
                }
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }
      };

      wsService.addMessageHandler('undercover', handleUndercoverMessage);
      wsService.addMessageHandler('refreshRoom', handleRefreshRoomMessage);
      wsService.addMessageHandler('gameStart', handleGameStartMessage);
      wsService.addMessageHandler('countdown', handleCountdownMessage);

      return () => {
        wsService.removeMessageHandler('undercover', handleUndercoverMessage);
        wsService.removeMessageHandler('refreshRoom', handleRefreshRoomMessage);
        wsService.removeMessageHandler('gameStart', handleGameStartMessage);
        wsService.removeMessageHandler('countdown', handleCountdownMessage);

        // 清除倒计时定时器
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };
  }, [visible, roomInfo?.roomId, activeRoomId, activeTab]);

  // 清理倒计时定时器
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  // 添加监听eventBus的事件，处理从聊天室点击加入游戏的事件
  useEffect(() => {
    // 监听加入谁是卧底房间事件
    const handleJoinUndercoverRoom = (roomIdStr: string) => {
      console.log('收到加入房间事件，房间ID:', roomIdStr);

      if (!visible) {
        // 如果卡片当前不可见，则显示卡片
        // 使用chat页面的事件来显示谁是卧底弹窗
        eventBus.emit('show_undercover_room');

        // 使用setTimeout延迟执行加入房间操作，确保弹窗已显示
        setTimeout(() => {
          try {
            // 清空聊天消息，以便加载新房间的消息
            setChatMessages([]);

            // 设置当前活跃房间ID并加入房间
            if (roomIdStr && roomIdStr.trim() !== '') {
              setActiveRoomId(roomIdStr);
              safelyCallRef(handleJoinSpecificRoomRef, roomIdStr);
            } else {
              message.error("无效的房间ID");
            }
          } catch (error) {
            console.error('加入房间失败:', error);
            message.error("加入失败，请手动加入");
          }
        }, 500); // 延迟500毫秒执行
      } else {
        // 如果弹窗已经显示，直接执行加入操作
        try {
          // 清空聊天消息，以便加载新房间的消息
          setChatMessages([]);

          // 设置当前活跃房间ID并加入房间
          if (roomIdStr && roomIdStr.trim() !== '') {
            setActiveRoomId(roomIdStr);
            safelyCallRef(handleJoinSpecificRoomRef, roomIdStr);
          } else {
            message.error("无效的房间ID");
          }
        } catch (error) {
          console.error('加入房间失败:', error);
          message.error("加入失败，请手动加入");
        }
      }
    };

    eventBus.on('join_undercover_room', handleJoinUndercoverRoom);

    return () => {
      eventBus.off('join_undercover_room', handleJoinUndercoverRoom);
    };
  }, [visible]);

  // 定义fetchRoomInfo函数
  fetchRoomInfoRef.current = async (silent: boolean = false) => {
    if (!visible) return;

    try {
      if (!silent) {
        setLoading(true);
      }
      setSilentRefresh(silent);
      setError(null);

      // 如果没有活跃房间ID，先从房间列表获取一个
      if (!activeRoomId) {
        try {
          const roomListResponse = await getAllRoomsUsingGet1();
          if (roomListResponse.code === 0 && roomListResponse.data && roomListResponse.data.length > 0) {
            // 找到一个当前用户参与的房间或者第一个等待中的房间
            const userRoom = roomListResponse.data.find(room =>
              room.participantIds?.includes(currentUser?.id || 0)
            );
            const waitingRoom = roomListResponse.data.find(room =>
              room.status === 'WAITING'
            );

            // 优先使用用户参与的房间，其次是等待中的房间，最后是第一个房间
            const targetRoom = userRoom || waitingRoom || roomListResponse.data[0];
            setActiveRoomId(targetRoom.roomId || null);

            if (targetRoom.roomId) {
              const response = await getRoomByIdUsingGet1({
                roomId: targetRoom.roomId
              });

              if (response.code === 0 && response.data) {
                setRoomInfo(response.data);
                setVotingFor(null);
                setVotingLoading(false);
              } else {
                setRoomInfo(null);
                setError('获取房间信息失败');
              }
            } else {
              setRoomInfo(null);
              setError('暂无活跃房间');
            }
          } else {
            setRoomInfo(null);
            setError('暂无活跃房间');
          }
        } catch (error) {
          console.error('获取房间列表失败:', error);
          setRoomInfo(null);
          setError('获取房间信息失败');
        } finally {
          setLoading(false);
        }
      } else {
        // 如果有活跃房间ID，直接获取该房间信息
        const response = await getRoomByIdUsingGet1({
          roomId: activeRoomId
        });

        if (response.code === 0 && response.data) {
          // 更新房间信息
          setRoomInfo(response.data);

          // 确保重置投票状态
          setVotingFor(null);
          setVotingLoading(false);

          // 如果房间状态发生变化，重置相关操作状态
          if (roomInfo?.status !== response.data.status) {
            setStartingGame(false);
            setEndingGame(false);
            setJoiningRoom(false);
          }
        } else {
          setRoomInfo(null);
          setError('获取房间信息失败');
          // 如果房间不存在，重置活跃房间ID
          setActiveRoomId(null);
        }
      }
    } catch (error) {
      console.error('获取房间信息失败:', error);
      setError('获取房间信息失败');
      setRoomInfo(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setSilentRefresh(false);
    }
  };

  // 添加获取房间列表的方法
  fetchRoomListRef.current = async () => {
    try {
      setRoomListLoading(true);
      const response = await getAllRoomsUsingGet1();
      if (response.code === 0 && response.data) {
        setRoomList(response.data);
      } else {
        message.error(response.message || '获取房间列表失败');
      }
    } catch (error) {
      console.error('获取房间列表失败:', error);
      message.error('获取房间列表失败');
    } finally {
      setRoomListLoading(false);
    }
  };

  // 处理加入特定房间
  handleJoinSpecificRoomRef.current = async (roomId: string) => {
    if (!roomId) return;

    try {
      setJoiningRoomId(roomId);
      setJoiningRoom(true);

      // 先设置当前活跃房间ID，确保后续操作使用正确的roomId
      setActiveRoomId(roomId);

      const response = await joinRoomUsingPost1({
        roomId: roomId
      });

      if (response.code === 0 && response.data) {
        message.success('加入房间成功');

        // 发送刷新房间信息的websocket消息
        wsService.send({
          type: 2,
          userId: currentUser?.id || -1,
          data: {
            type: 'refreshRoom',
            content: {
              roomId: roomId,
              action: 'join'
            },
          },
        });

        // 切换到当前房间标签
        setActiveTab('current');

        // 清空聊天消息，以便加载新房间的消息
        setChatMessages([]);

        // 直接获取房间信息，而不是使用fetchRoomInfoRef
        try {
          const roomResponse = await getRoomByIdUsingGet1({
            roomId: roomId
          });

          if (roomResponse.code === 0 && roomResponse.data) {
            setRoomInfo(roomResponse.data);
            setVotingFor(null);
            setVotingLoading(false);
          } else {
            setRoomInfo(null);
            setError('获取房间信息失败');
          }
        } catch (error) {
          console.error('获取房间信息失败:', error);
          message.error('获取房间信息失败');
        }
      } else {
        message.error(response.message || '加入房间失败');
        // 如果加入失败，恢复之前的房间ID
        if (activeRoomId && activeRoomId !== roomId) {
          setActiveRoomId(activeRoomId);
        }
      }
    } catch (error) {
      console.error('加入房间失败:', error);
      message.error('加入房间失败，请重试');
      // 如果出错，恢复之前的房间ID
      if (activeRoomId && activeRoomId !== roomId) {
        setActiveRoomId(activeRoomId);
      }
    } finally {
      setJoiningRoom(false);
      setJoiningRoomId(null);
    }
  };

  // 创建稳定的函数引用
  const fetchRoomInfo = useCallback((silent?: boolean) => {
    if (fetchRoomInfoRef.current) {
      return fetchRoomInfoRef.current(silent);
    }
    return Promise.resolve();
  }, []);

  const fetchRoomList = useCallback(() => {
    if (fetchRoomListRef.current) {
      return fetchRoomListRef.current();
    }
    return Promise.resolve();
  }, []);

  const handleJoinSpecificRoom = useCallback((roomId: string) => {
    if (handleJoinSpecificRoomRef.current) {
      return handleJoinSpecificRoomRef.current(roomId);
    }
    return Promise.resolve();
  }, []);

  // 当切换到房间列表标签时获取房间列表
  useEffect(() => {
    if (visible && activeTab === 'list') {
      fetchRoomList();
    }
  }, [visible, activeTab, fetchRoomList]);

  // 当组件可见时获取房间信息
  useEffect(() => {
    if (visible) {
      fetchRoomInfo();
    }
  }, [visible, fetchRoomInfo]);

  // 添加WebSocket消息处理器，当收到房间更新消息时刷新列表
  useEffect(() => {
    if (visible) {
      const handleRefreshRoomListMessage = () => {
        // 如果当前正在查看房间列表，则刷新列表
        if (activeTab === 'list') {
          fetchRoomList();
        }
      };

      wsService.addMessageHandler('refreshRoom', handleRefreshRoomListMessage);

      return () => {
        wsService.removeMessageHandler('refreshRoom', handleRefreshRoomListMessage);
      };
    }
  }, [visible, activeTab, fetchRoomList]);

  // 处理加入房间
  const handleJoinRoom = async (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    if (roomInfo?.roomId) {
      try {
        setJoiningRoom(true);

        // 保存当前房间ID
        const currentRoomId = roomInfo.roomId;

        const response = await joinRoomUsingPost1({
          roomId: currentRoomId
        });

        if (response.code === 0 && response.data) {
          message.success('加入房间成功');

          // 设置当前活跃房间ID
          setActiveRoomId(currentRoomId);

          // 发送刷新房间信息的websocket消息
          wsService.send({
            type: 2,
            userId: currentUser?.id || -1,
            data: {
              type: 'refreshRoom',
              content: {
                roomId: currentRoomId,
                action: 'join'
              },
            },
          });

          // 直接获取房间信息，而不是使用fetchRoomInfo
          try {
            const roomResponse = await getRoomByIdUsingGet1({
              roomId: currentRoomId
            });

            if (roomResponse.code === 0 && roomResponse.data) {
              setRoomInfo(roomResponse.data);
              setVotingFor(null);
              setVotingLoading(false);
            } else {
              message.error('获取房间信息失败');
            }
          } catch (error) {
            console.error('获取房间信息失败:', error);
            message.error('获取房间信息失败');
          }
        } else {
          message.error(response.message || '加入房间失败');
        }
      } catch (error) {
        console.error('加入房间失败:', error);
        message.error('加入房间失败，请重试');
      } finally {
        setJoiningRoom(false);
      }
    }
  };

  const handleRefresh = (e: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发文档点击事件
    e.stopPropagation();
    fetchRoomInfo(false); // 使用非静默模式刷新
  };

  // 添加拖动相关处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
      e.preventDefault(); // 阻止默认行为
      e.stopPropagation(); // 阻止事件冒泡

      // 记录鼠标起始位置和元素起始位置
      setDragStartPoint({
        mouseX: e.clientX,
        mouseY: e.clientY,
        elemX: position.x,
        elemY: position.y
      });
      setIsDragging(true);
    }
  };

  // 添加触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (cardRef.current && e.touches.length > 0) {
      e.stopPropagation(); // 阻止事件冒泡

      const touch = e.touches[0];

      // 记录触摸起始位置和元素起始位置
      setDragStartPoint({
        mouseX: touch.clientX,
        mouseY: touch.clientY,
        elemX: position.x,
        elemY: position.y
      });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      e.preventDefault(); // 阻止页面滚动
      const touch = e.touches[0];

      // 直接使用触摸当前位置减去起始触摸位置的差值，加上元素起始位置
      const newX = dragStartPoint.elemX + (touch.clientX - dragStartPoint.mouseX);
      const newY = dragStartPoint.elemY + (touch.clientY - dragStartPoint.mouseY);

      // 计算边界，允许部分超出屏幕以确保可访问性
      const minX = -50; // 允许左侧超出50px
      const minY = -10; // 允许顶部超出10px
      const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 300) + 100; // 允许右侧超出100px
      const maxY = window.innerHeight - 50; // 底部保留50px

      // 应用边界限制
      setPosition({
        x: Math.min(Math.max(minX, newX), maxX),
        y: Math.min(Math.max(minY, newY), maxY)
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();

      // 直接使用鼠标当前位置减去起始鼠标位置的差值，加上元素起始位置
      const newX = dragStartPoint.elemX + (e.clientX - dragStartPoint.mouseX);
      const newY = dragStartPoint.elemY + (e.clientY - dragStartPoint.mouseY);

      // 计算边界，允许部分超出屏幕以确保可访问性
      const minX = -50; // 允许左侧超出50px
      const minY = -10; // 允许顶部超出10px
      const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 300) + 100; // 允许右侧超出100px
      const maxY = window.innerHeight - 50; // 底部保留50px

      // 应用边界限制
      setPosition({
        x: Math.min(Math.max(minX, newX), maxX),
        y: Math.min(Math.max(minY, newY), maxY)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加点击空白处关闭功能
  const handleDocumentClick = useCallback((e: MouseEvent) => {
    // 如果卡片已置顶，则不关闭
    if (isPinned) return;

    // 如果当前模态框打开，不处理点击事件
    if (isCreateModalVisible || isRuleModalVisible || isUserMessagesVisible) return;

    // 如果点击的是卡片外部，则关闭卡片
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [isPinned, onClose, isCreateModalVisible, isRuleModalVisible, isUserMessagesVisible]);

  // 添加全局鼠标和触摸事件监听
  useEffect(() => {
    if (visible) {
      // 鼠标事件
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      // 触摸事件
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      // 添加点击空白处关闭的事件监听
      // 使用setTimeout确保事件在当前点击事件之后绑定，避免立即触发
      const timer = setTimeout(() => {
        document.addEventListener('click', handleDocumentClick);
      }, 0);

      return () => {
        // 清理鼠标事件
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        // 清理触摸事件
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);

        // 清理点击事件
        document.removeEventListener('click', handleDocumentClick);
        clearTimeout(timer);
      };
    }
  }, [visible, isDragging, dragStartPoint, position, handleDocumentClick]);

  // 处理投票
  const handleVote = async (targetUserId: number, e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    if (!roomInfo?.roomId) return;

    try {
      // 设置正在投票的目标和加载状态
      setVotingFor(targetUserId);
      setVotingLoading(true);

      const response = await voteUsingPost({
        roomId: roomInfo.roomId,
        targetId: targetUserId
      });

      if (response.code === 0 && response.data) {
        message.success('投票成功');
        // 在投票成功后先标记已完成投票（前端状态立即更新）
        const updatedVotes = [...(roomInfo.votes || []), {
          voterId: currentUser?.id || 0,
          targetId: targetUserId
        }];
        setRoomInfo({
          ...roomInfo,
          votes: updatedVotes
        });
        // 然后静默刷新房间信息（后端数据同步）
        safelyCallRef(fetchRoomInfoRef, true);
      } else {
        message.error(response.message || '投票失败');
      }
    } catch (error) {
      console.error('投票失败:', error);
      message.error('投票失败，请重试');
    } finally {
      setVotingLoading(false);
      setVotingFor(null);
    }
  };

  // 处理开始游戏
  const handleStartGame = async (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    if (!roomInfo?.roomId) return;

    try {
      setStartingGame(true);
      const response = await startGameUsingPost1({
        roomId: roomInfo.roomId
      });

      if (response.code === 0 && response.data) {
        message.success('游戏已开始');

        // 发送刷新房间信息的websocket消息
        wsService.send({
            type: 2,
            userId: currentUser?.id || -1,
            data: {
              type: 'refreshRoom',
              content: {
                roomId: roomInfo.roomId,
                action: 'start'
              },
            },
          });

        safelyCallRef(fetchRoomInfoRef, true); // 开始游戏后静默刷新房间信息
      } else {
        message.error(response.message || '开始游戏失败');
      }
    } catch (error) {
      console.error('开始游戏失败:', error);
      message.error('开始游戏失败，请重试');
    } finally {
      setStartingGame(false);
    }
  };

  // 处理结束游戏
  const handleEndGame = async (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    if (!roomInfo?.roomId) return;

    try {
      setEndingGame(true);
      const response = await endGameUsingPost1({
        roomId: roomInfo.roomId
      });

      if (response.code === 0 && response.data) {
        message.success('游戏已结束');

        // 发送刷新房间信息的websocket消息
        wsService.send({
            type: 2,
            userId: currentUser?.id || -1,
            data: {
              type: 'refreshRoom',
              content: {
                roomId: roomInfo.roomId,
                action: 'end'
              },
            },
          });

        safelyCallRef(fetchRoomInfoRef, true); // 结束游戏后静默刷新房间信息
      } else {
        message.error(response.message || '结束游戏失败');
      }
    } catch (error) {
      console.error('结束游戏失败:', error);
      message.error('结束游戏失败，请重试');
    } finally {
      setEndingGame(false);
    }
  };

  // 显示创建房间模态框
  const showCreateModal = (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    form.resetFields();
    form.setFieldsValue({
      maxPlayers: 8,
      civilianWord: '',
      undercoverWord: '',
      duration: 600,
      roomType: 'random',
      gameMode: 1 // 默认为常规模式(1)
    });
    setIsCreateModalVisible(true);
  };

  // 处理创建房间
  const handleCreateRoom = async (values: CreateRoomFormValues) => {
    try {
      setCreatingRoom(true);

      // 根据房间类型决定请求参数
      const requestParams = {
        maxPlayers: values.maxPlayers,
        duration: values.duration,
        gameMode: values.gameMode, // 已经是数字类型
        // 如果是上帝模式，提供自定义单词，如果是随机模式，不提供单词
        ...(values.roomType === 'god' ? {
          civilianWord: values.civilianWord,
          undercoverWord: values.undercoverWord
        } : {})
      };

      const response = await createRoomUsingPost1(requestParams);

      if (response.code === 0 && response.data) {
        message.success('创建房间成功');

        // 发送刷新房间信息的websocket消息，通知有新房间创建
        wsService.send({
          type: 2,
          userId: currentUser?.id || -1,
          data: {
            type: 'refreshRoom',
            content: {
              roomId: response.data,
              action: 'create'
            },
          },
        });

        setIsCreateModalVisible(false);

        // 不再设置当前活跃房间ID和切换到房间标签
        // 而是刷新房间列表并切换到列表标签
        setActiveTab('list');
        safelyCallRef(fetchRoomListRef); // 刷新房间列表
      } else {
        message.error(response.message || '创建房间失败');
      }
    } catch (error) {
      console.error('创建房间失败:', error);
      message.error('创建房间失败，请重试');
    } finally {
      setCreatingRoom(false);
    }
  };

  // 获取房间状态的文字和颜色
  const getRoomStatusInfo = (status?: string) => {
    switch (status) {
      case 'WAITING':
        return { text: '等待中', color: '#52c41a', badgeStatus: 'success' as const };
      case 'PLAYING':
        return { text: '游戏中', color: '#1890ff', badgeStatus: 'processing' as const };
      case 'ENDED':
        return { text: '已结束', color: '#d9d9d9', badgeStatus: 'default' as const };
      default:
        return { text: '未知状态', color: '#faad14', badgeStatus: 'warning' as const };
    }
  };

  const statusInfo = getRoomStatusInfo(roomInfo?.status);

  // 判断当前用户是否可以投票
  const canVote = useCallback(() => {
    // 必须是游戏进行中、用户已登录且不是投票中状态
    const basicConditions = roomInfo?.status === 'PLAYING' && currentUser?.id && !votingLoading;

    // 检查用户是否已被淘汰或已投票
    if (!basicConditions || !roomInfo?.participants) return false;

    // 获取当前用户信息
    const currentUserInGame = roomInfo.participants.find(p => p.userId === currentUser?.id);
    if (!currentUserInGame) return false; // 如果用户不在游戏中，不能投票

    // 如果用户已被淘汰，不能投票
    if (currentUserInGame.isEliminated) return false;

    // 检查用户是否已经投过票
    const hasVoted = roomInfo.votes?.some(vote => vote.voterId === currentUser?.id);
    return !hasVoted;
  }, [roomInfo, currentUser, votingLoading]);

  // 判断当前用户是否可以加入房间
  const canJoinRoom = useCallback(() => {
    if (!roomInfo || !currentUser?.id || roomInfo.status !== 'WAITING') return false;

    // 检查用户是否已经在房间中
    if (roomInfo.participants?.some(p => p.userId === currentUser.id)) return false;

    // 检查房间是否已满
    return (roomInfo.participants?.length || 0) < (roomInfo.maxPlayers || 8);
  }, [roomInfo, currentUser]);

  // 判断当前用户是否是管理员
  const isAdmin = currentUser?.userRole === 'admin';

  // 处理删除房间
  const handleRemoveRoom = async (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    if (!isAdmin) {
      message.error('只有管理员才能删除房间');
      return;
    }

    if (!roomInfo?.roomId) {
      message.error('房间ID不存在，无法删除');
      return;
    }

    try {
      setRemovingRoom(true);
      const response = await removeActiveRoomUsingPost(
        {
          roomId: roomInfo.roomId
        },
        {}
      );

      if (response.code === 0 && response.data) {
        message.success('房间已删除');

        // 清除当前活跃房间ID
        setActiveRoomId(null);

        // 发送刷新房间信息的websocket消息
        wsService.send({
            type: 2,
            userId: currentUser?.id || -1,
            data: {
              type: 'refreshRoom',
              content: {
                roomId: roomInfo.roomId, // 添加房间ID
                action: 'remove'
              },
            },
          });

        safelyCallRef(fetchRoomInfoRef, true); // 删除房间后静默刷新房间信息
      } else {
        message.error(response.message || '删除房间失败');
      }
    } catch (error) {
      console.error('删除房间失败:', error);
      message.error('删除房间失败，请重试');
    } finally {
      setRemovingRoom(false);
    }
  };

  // 处理退出房间
  const handleQuitRoom = async (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    if (!roomInfo?.roomId) return;

    try {
      setQuittingRoom(true);
      const response = await quitRoomUsingPost1({
        roomId: roomInfo.roomId
      });

      if (response.code === 0 && response.data) {
        message.success('已退出房间');

        // 清除当前活跃房间ID
        setActiveRoomId(null);

        // 发送刷新房间信息的websocket消息
        wsService.send({
            type: 2,
            userId: currentUser?.id || -1,
            data: {
              type: 'refreshRoom',
              content: {
                roomId: roomInfo.roomId,
                action: 'quit'
              },
            },
          });

        safelyCallRef(fetchRoomInfoRef, true); // 退出房间后静默刷新房间信息
      } else {
        message.error(response.message || '退出房间失败');
      }
    } catch (error) {
      console.error('退出房间失败:', error);
      message.error('退出房间失败，请重试');
    } finally {
      setQuittingRoom(false);
    }
  };

  // 渲染管理员操作按钮
  const renderAdminButtons = () => {
    if (!isAdmin) return null;

    // 如果没有房间，显示创建房间按钮
    if (!roomInfo) {
      return (
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            showCreateModal(e);
            // 切换到房间列表标签，这样创建完成后就会显示房间列表
            setActiveTab('list');
          }}
          loading={creatingRoom}
          disabled={creatingRoom}
          className={styles.adminButton}
        >
          创建房间
        </Button>
      );
    }

    // 根据房间状态显示不同的操作按钮
    switch (roomInfo.status) {
      case 'WAITING':
        return (
          <>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={(e) => handleStartGame(e)}
              loading={startingGame}
              disabled={startingGame}
              className={styles.adminButton}
            >
              开始游戏
            </Button>
            <Popconfirm
              title="确定要删除当前房间吗？"
              onConfirm={(e) => handleRemoveRoom(e)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                loading={removingRoom}
                disabled={removingRoom}
                className={styles.adminButton}
              >
                删除房间
              </Button>
            </Popconfirm>
          </>
        );
      case 'PLAYING':
        return (
          <>
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={(e) => handleEndGame(e)}
              loading={endingGame}
              disabled={endingGame}
              className={styles.adminButton}
            >
              结束游戏
            </Button>
            <Popconfirm
              title="游戏正在进行中，确定要删除当前房间吗？"
              onConfirm={(e) => handleRemoveRoom(e)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                loading={removingRoom}
                disabled={removingRoom}
                className={styles.adminButton}
              >
                删除房间
              </Button>
            </Popconfirm>
          </>
        );
      case 'ENDED':
        return (
          <>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                showCreateModal(e);
                // 切换到房间列表标签，这样创建完成后就会显示房间列表
                setActiveTab('list');
              }}
              loading={creatingRoom}
              disabled={creatingRoom}
              className={styles.adminButton}
            >
              创建新房间
            </Button>
            <Popconfirm
              title="确定要删除当前房间吗？"
              onConfirm={(e) => handleRemoveRoom(e)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                loading={removingRoom}
                disabled={removingRoom}
                className={styles.adminButton}
              >
                删除房间
              </Button>
            </Popconfirm>
          </>
        );
      default:
        return null;
    }
  };

  // 优化renderCreatorButtons函数，更好地响应房间状态变化
  const renderCreatorButtons = () => {
    // 如果用户不是房间创建者，返回null
    if (!roomInfo || !currentUser || roomInfo.creatorId !== currentUser.id || isAdmin) return null;

    // 根据房间状态显示不同的操作按钮
    switch (roomInfo.status) {
      case 'WAITING':
        const participantsCount = roomInfo.participants?.length || 0;
        return (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={(e) => handleStartGame(e)}
            loading={startingGame}
            disabled={startingGame || participantsCount < 3} // 至少需要3名玩家才能开始游戏
            className={styles.actionButton}
          >
            {participantsCount < 3 ? '至少需要3名玩家' : '开始游戏'}
          </Button>
        );
      case 'PLAYING':
        return (
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={(e) => handleEndGame(e)}
            loading={endingGame}
            disabled={endingGame}
            className={styles.actionButton}
          >
            结束游戏
          </Button>
        );
      default:
        return null;
    }
  };

  // 添加渲染创建房间按钮的函数
  const renderCreateRoomButton = () => {
    // 如果当前没有活跃房间或者房间已结束，显示创建房间按钮
    if (!roomInfo || roomInfo.status === 'ENDED') {
      return (
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            showCreateModal(e);
            // 切换到房间列表标签，这样创建完成后就会显示房间列表
            setActiveTab('list');
          }}
          loading={creatingRoom}
          disabled={creatingRoom}
          className={styles.actionButton}
        >
          创建房间
        </Button>
      );
    }
    return null;
  };

  // 滚动到最新消息
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 判断当前用户是否是房间参与者
  const isRoomParticipant = useCallback(() => {
    if (!roomInfo?.participants || !currentUser?.id) return false;
    return roomInfo.participants.some(p => p.userId === currentUser.id);
  }, [roomInfo?.participants, currentUser?.id]);

  // 处理发送消息
  const handleSendMessage = () => {
    if (!messageInput.trim() || !roomInfo?.roomId) {
      message.error('聊天室暂未开始，请等待');
      return;
    }

    // 检查用户是否是房间参与者
    if (!isRoomParticipant()) {
      message.info('请先加入房间才能发言');
      return;
    }

    // 创建消息对象
    const newMessage = {
      id: `${Date.now()}`,
      content: messageInput,
      roomId: roomInfo?.roomId || '', // 添加房间号
      sender: {
        id: currentUser?.id || 0,
        name: currentUser?.userName || '游客',
        avatar: currentUser?.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor',
        level: currentUser?.level || 1,
        points: currentUser?.points || 0,
        isAdmin: currentUser?.userRole === 'admin',
      },
      timestamp: new Date(),
    };

    // 使用WebSocket发送消息
    wsService.send({
      type: 2,
      userId: currentUser?.id || -1,
      data: {
        type: 'undercover', // 使用undercover作为消息类型
        content: {
          message: newMessage,
        },
      },
    });

    // 添加自己的消息到聊天窗口
    const myChatMessage: ChatMessage = {
      content: messageInput,
      userId: currentUser?.id || 0,
      userName: currentUser?.userName || '游客',
      userAvatar: currentUser?.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor',
      timestamp: new Date(),
      roomId: roomInfo?.roomId || '' // 添加房间ID
    };

    setChatMessages(prev => [...prev, myChatMessage]);

    // 确保聊天窗口滚动到最新消息
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 100);

    setMessageInput('');
  };

  // 处理按Enter发送消息
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 在玩家列表渲染中优化投票按钮逻辑
  const renderPlayerItem = (player: API.UndercoverPlayerDetailVO, index: number) => {
    // 判断当前用户是否可以对该玩家投票
    const canVoteForPlayer = () => {
      // 基本投票条件
      if (!canVote() || player.userId === undefined || currentUser?.id === undefined) return false;

      // 不能给自己投票
      if (player.userId === currentUser.id) return false;

      // 不能给已淘汰的玩家投票
      return !player.isEliminated;
    };

    return (
      <List.Item className={styles.playerItem}>
        <div
          className={styles.playerInfo}
          onClick={(e) => player.userId !== undefined && handleAvatarClick(player.userId, player.userName || '未知玩家', e)}
        >
          <Badge count={index + 1} style={{ backgroundColor: '#52c41a', marginRight: 8 }} />
          <Avatar
            size="small"
            src={player.userAvatar}
            icon={<UserOutlined />}
            className={styles.clickableAvatar}
          />
          <span className={styles.playerName}>{player.userName}</span>
          <Tooltip title="点击查看消息记录">
            <CommentOutlined className={styles.viewMessagesIcon} />
          </Tooltip>
        </div>
        <div className={styles.playerActions}>
          {player.voteCount !== undefined && (
            <div className={styles.voteCount}>
              <Tooltip title="获得的票数">
                <Badge
                  count={player.voteCount}
                  showZero={true}
                  style={{ backgroundColor: player.isEliminated ? '#ff4d4f' : '#1890ff' }}
                />
              </Tooltip>
            </div>
          )}
          {canVoteForPlayer() && (
            <Button
              size="small"
              type="primary"
              danger
              onClick={(e) => player.userId !== undefined && handleVote(player.userId, e)}
              loading={votingLoading && votingFor === player.userId}
            >
              投票
            </Button>
          )}
          {player.isEliminated && (
            <span className={styles.eliminatedTag}>已出局</span>
          )}
        </div>
      </List.Item>
    );
  };

  // 显示规则模态框
  const showRuleModal = (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }
    setIsRuleModalVisible(true);
  };

  // 处理点击用户头像或玩家列表项
  const handleAvatarClick = (userId: number, userName: string, e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }
    setViewingUserId(userId);
    setIsUserMessagesVisible(true);
  };

  // 获取特定用户的所有消息（当前房间）
  const getUserMessages = (userId: number) => {
    return chatMessages.filter(msg =>
      msg.userId === userId &&
      (!roomInfo?.roomId || !msg.roomId || msg.roomId === roomInfo.roomId)
    );
  };

  // 获取用户名称
  const getUserName = (userId: number) => {
    // 先从聊天消息中查找
    const userMessage = chatMessages.find(msg => msg.userId === userId);
    if (userMessage?.userName) {
      return userMessage.userName;
    }

    // 如果聊天消息中没有，从房间参与者中查找
    if (roomInfo?.participants) {
      const participant = roomInfo.participants.find(p => p.userId === userId);
      if (participant?.userName) {
        return participant.userName;
      }
    }

    return '未知用户';
  };

  // 判断用户是否有聊天记录（当前房间）
  const hasUserMessages = (userId: number) => {
    return chatMessages.some(msg =>
      msg.userId === userId &&
      (!roomInfo?.roomId || !msg.roomId || msg.roomId === roomInfo.roomId)
    );
  };

  // 判断当前用户是否是卧底
  const isUndercover = useCallback(() => {
    // 确保房间信息和用户信息存在
    if (!roomInfo || !currentUser?.id) return false;

    // 游戏必须处于进行中状态
    if (roomInfo.status !== 'PLAYING') return false;

    // 获取当前用户的角色信息
    const currentPlayerInfo = roomInfo.participants?.find(p => p.userId === currentUser.id);
    if (!currentPlayerInfo) return false;

    // 如果用户已被淘汰，不能猜词
    if (currentPlayerInfo.isEliminated) return false;

    // 必须是猜词模式(2)，且角色是卧底
    return roomInfo.gameMode === 2 && roomInfo.role === 'undercover';
  }, [roomInfo, currentUser]);

  // 显示猜词模态框
  const showGuessModal = (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    guessForm.resetFields();
    setIsGuessModalVisible(true);
  };

  // 处理卧底猜词
  const handleGuessWord = async (values: { guessWord: string }) => {
    if (!roomInfo?.roomId) return;

    try {
      setGuessing(true);
      const response = await guessWordUsingPost1({
        roomId: roomInfo.roomId,
        guessWord: values.guessWord
      });

      if (response.code === 0) {
        if (response.data) {
          message.success('恭喜你猜对了！游戏结束');

          // 发送刷新房间信息的websocket消息
          wsService.send({
            type: 2,
            userId: currentUser?.id || -1,
            data: {
              type: 'refreshRoom',
              content: {
                roomId: roomInfo.roomId,
                action: 'guess_success'
              },
            },
          });

          safelyCallRef(fetchRoomInfoRef, true); // 猜词成功后静默刷新房间信息
        } else {
          message.error('很遗憾，猜错了');
        }
        setIsGuessModalVisible(false);
      } else {
        message.error(response.message || '猜词失败');
      }
    } catch (error) {
      console.error('猜词失败:', error);
      message.error('猜词失败，请重试');
    } finally {
      setGuessing(false);
    }
  };

  // 处理发送邀请
  const handleSendInvite = (e?: React.MouseEvent) => {
    // 如果有事件对象，阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }

    // 检查冷却时间
    if (inviteCooldown > 0) {
      message.warning(`请等待 ${inviteCooldown} 秒后再发送邀请`);
      return;
    }

    if (!roomInfo?.roomId) {
      message.error('房间不存在，无法发送邀请');
      return;
    }

    // 创建邀请消息，将房间ID放在消息末尾，在UI中会被隐藏
    const inviteMessage = `<undercover>我邀请你加入谁是卧底游戏！房间ID: ${roomInfo.roomId}</undercover>`;

    // @ts-ignore
    const newMessage: ChatMessage = {
      id: `${Date.now()}`,
      content: inviteMessage,
      roomId: roomInfo.roomId, // 添加房间ID
      sender: {
        id: String(currentUser?.id),
        name: currentUser?.userName || '游客',
        avatar: currentUser?.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor',
        level: currentUser?.level || 1,
        isAdmin: currentUser?.userRole === 'admin',
      },
      timestamp: new Date(),
    };

    // 使用全局 WebSocket 服务发送消息
    wsService.send({
      type: 2,
      userId: -1,
      data: {
        type: 'chat',
        content: {
          message: newMessage,
        },
      },
    });

    // 设置冷却时间（60秒）
    setInviteCooldown(60);

    // 启动倒计时
    if (inviteCooldownRef.current) {
      clearInterval(inviteCooldownRef.current);
    }

    inviteCooldownRef.current = setInterval(() => {
      setInviteCooldown(prev => {
        if (prev <= 1) {
          if (inviteCooldownRef.current) {
            clearInterval(inviteCooldownRef.current);
            inviteCooldownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    message.success('邀请已发送到聊天室');
  };

  // 清理冷却计时器
  useEffect(() => {
    return () => {
      if (inviteCooldownRef.current) {
        clearInterval(inviteCooldownRef.current);
      }
    };
  }, []);

  // 渲染聊天消息，添加对邀请消息的特殊处理
  const renderChatMessage = (msg: ChatMessage, index: number) => {
    // 检查是否是邀请消息
    const isInviteMessage = msg.content.includes('<undercover>') && msg.content.includes('</undercover>');

    if (isInviteMessage) {
      // 提取邀请内容
      const inviteContent = msg.content.match(/<undercover>(.*?)<\/undercover>/)?.[1] || '邀请加入谁是卧底游戏';

      return (
        <div
          key={index}
          className={`${styles.chatMessage} ${msg.userId === currentUser?.id ? styles.myMessage : ''}`}
        >
          <div className={styles.messageHeader}>
            <Avatar
              size="small"
              src={msg.userAvatar}
              icon={<UserOutlined />}
              onClick={(e) => handleAvatarClick(msg.userId, msg.userName, e)}
              className={styles.clickableAvatar}
            />
            <span className={styles.messageSender}>{msg.userName}</span>
            {msg.timestamp && (
              <span className={styles.messageTime}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className={styles.inviteMessage}>
            {inviteContent}
            {msg.userId !== currentUser?.id && canJoinRoom() && (
              <div className={styles.inviteAction}>
                <Button
                  type="primary"
                  size="small"
                  onClick={(e) => handleJoinRoom(e)}
                >
                  加入游戏
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 普通消息的渲染
    return (
      <div
        key={index}
        className={`${styles.chatMessage} ${msg.userId === currentUser?.id ? styles.myMessage : ''}`}
      >
        <div className={styles.messageHeader}>
          <Avatar
            size="small"
            src={msg.userAvatar}
            icon={<UserOutlined />}
            onClick={(e) => handleAvatarClick(msg.userId, msg.userName, e)}
            className={styles.clickableAvatar}
          />
          <span className={styles.messageSender}>{msg.userName}</span>
          {msg.timestamp && (
            <span className={styles.messageTime}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className={styles.messageContent}>
          {msg.content}
        </div>
      </div>
    );
  };

  // 修改renderUserActions函数，添加发送邀请按钮
  const renderUserActions = () => {
    return (
      <div className={styles.userActions}>
        {canJoinRoom() && (
          <Button
            type="primary"
            onClick={(e) => handleJoinRoom(e)}
            disabled={joiningRoom}
            loading={joiningRoom}
            className={styles.actionButton}
          >
            {joiningRoom ? '加入中...' : '加入房间'}
          </Button>
        )}
        {/* 添加发送邀请按钮 - 不再限制只有房间参与者才能发送邀请 */}
        {roomInfo?.status !== 'ENDED' && (
          <Button
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={(e) => handleSendInvite(e)}
            disabled={inviteCooldown > 0}
            className={styles.actionButton}
          >
            邀请好友
            {inviteCooldown > 0 && (
              <span className={styles.cooldownTip}>({inviteCooldown}s)</span>
            )}
          </Button>
        )}
        {isRoomParticipant() && roomInfo?.status !== 'ENDED' && (
          <Popconfirm
            title={roomInfo?.status === 'PLAYING' ? "游戏正在进行中，确定要退出吗？" : "确定要退出房间吗？"}
            onConfirm={(e) => handleQuitRoom(e)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              disabled={quittingRoom}
              loading={quittingRoom}
              className={styles.actionButton}
            >
              退出房间
            </Button>
          </Popconfirm>
        )}
        {/* 添加卧底猜词按钮 */}
        {isRoomParticipant() && roomInfo?.status === 'PLAYING' && isUndercover() && (
          <Button
            type="primary"
            icon={<BulbOutlined />}
            onClick={(e) => showGuessModal(e)}
            className={styles.actionButton}
          >
            猜平民词
          </Button>
        )}
        {/* 添加创建房间按钮 */}
        {renderCreateRoomButton()}
        <Button
          onClick={(e) => handleRefresh(e)}
          icon={<ReloadOutlined />}
          className={styles.actionButton}
        >
          刷新
        </Button>
      </div>
    );
  };

  // 修改renderGameInfo函数，添加倒计时显示
  const renderGameInfo = () => {
    if (!roomInfo) return null;

    return (
      <>
        {/* 显示倒计时 */}
        {countdown !== null && (
          <div className={styles.countdownContainer}>
            <div className={styles.countdownTitle}>
              <ClockCircleOutlined className={styles.countdownIcon} /> 倒计时:
            </div>
            <div className={styles.countdownValue}>
              {countdown} 秒
            </div>
          </div>
        )}

        {/* 原有的游戏信息 */}
        {roomInfo.gameMode === 2 ? (
          roomInfo.role === 'undercover' ? (
            <>
              <div className={styles.infoItem}>
                <UserOutlined className={styles.infoIcon} />
                <span>你的身份: <strong style={{ color: '#ff4d4f' }}>卧底</strong></span>
              </div>
              <div className={styles.infoItem}>
                <TrophyOutlined className={styles.infoIcon} />
                <span>你需要猜出平民的词语才能获胜</span>
              </div>
            </>
          ) : (
            <div className={styles.infoItem}>
              <TrophyOutlined className={styles.infoIcon} />
              <span>你的词语: <strong>{roomInfo.word}</strong></span>
            </div>
          )
        ) : (
          <div className={styles.infoItem}>
            <TrophyOutlined className={styles.infoIcon} />
            <span>你的词语: <strong>{roomInfo.word}</strong></span>
          </div>
        )}
      </>
    );
  };

  // 渲染房间列表项
  const renderRoomListItem = (room: API.UndercoverRoomVO) => {
    const statusInfo = getRoomStatusInfo(room.status);
    const isCurrentUserInRoom = room.participantIds?.includes(currentUser?.id || 0);
    const isRoomFull = (room.participants?.length || 0) >= (room.maxPlayers || 8);
    const canJoin = !isCurrentUserInRoom && !isRoomFull && room.status === 'WAITING';

    return (
      <List.Item
        key={room.roomId}
        className={styles.roomListItem}
      >
        <div className={styles.roomListItemContent}>
          {/* 第一行：头像、名称和状态 */}
          <div className={styles.roomListItemHeader}>
            <Avatar
              src={room.creatorAvatar}
              icon={!room.creatorAvatar && <UserOutlined />}
              alt={`${room.creatorName || '未知用户'}的头像`}
            />
            <div className={styles.roomListItemTitle}>
              <span>{room.creatorName || '未知用户'}</span>
              <span className={styles.roomId}>#{room.roomId?.slice(-6)}</span>
            </div>
            <div className={styles.roomListItemStatus}>
              <Badge status={statusInfo.badgeStatus} text={statusInfo.text} />
            </div>
          </div>

          {/* 第二行：房间模式和人数 */}
          <div className={styles.roomListItemInfo}>
            <div className={styles.roomListItemMode}>
              <ClockCircleOutlined /> {room.gameMode === 1 ? '常规模式' : '猜词模式'}
            </div>
            <div className={styles.roomListItemPlayers}>
              <TeamOutlined /> {room.participants?.length || 0}/{room.maxPlayers || 8} 玩家
            </div>
          </div>

          {/* 第三行：操作按钮 */}
          <div className={styles.roomListItemActions}>
            <Button
              type="default"
              size="small"
              onClick={async () => {
                if (!room.roomId || room.roomId.trim() === '') {
                  message.error("无效的房间ID");
                  return;
                }

                // 先清空聊天消息，以便加载新房间的消息
                setChatMessages([]);

                // 保存当前房间ID
                const targetRoomId = room.roomId;

                // 设置当前活跃房间ID
                setActiveRoomId(targetRoomId);

                // 切换到当前房间标签
                setActiveTab('current');

                // 直接获取房间信息
                try {
                  setLoading(true);
                  const response = await getRoomByIdUsingGet1({
                    roomId: targetRoomId
                  });

                  if (response.code === 0 && response.data) {
                    setRoomInfo(response.data);
                    setVotingFor(null);
                    setVotingLoading(false);
                  } else {
                    setRoomInfo(null);
                    setError('获取房间信息失败');
                  }
                } catch (error) {
                  console.error('获取房间信息失败:', error);
                  setError('获取房间信息失败');
                } finally {
                  setLoading(false);
                }
              }}
            >
              查看详情
            </Button>
            {canJoin ? (
              <Button
                type="primary"
                size="small"
                loading={joiningRoom && joiningRoomId === room.roomId}
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                  if (room.roomId && room.roomId.trim() !== '') {
                    // 清空聊天消息，以便加载新房间的消息
                    setChatMessages([]);
                    handleJoinSpecificRoom(room.roomId);
                  } else {
                    message.error("无效的房间ID");
                  }
                }}
                disabled={joiningRoom}
              >
                加入房间
              </Button>
            ) : (
              !isCurrentUserInRoom && (
                <Button
                  type="default"
                  size="small"
                  disabled={true}
                >
                  {isRoomFull ? '房间已满' : '不可加入'}
                </Button>
              )
            )}
          </div>
        </div>
      </List.Item>
    );
  };

  if (!visible) return null;

  return (
    <div
      className={styles.roomInfoCardContainer}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
      ref={cardRef}
    >
      <div className={styles.cardLayout}>
        <Card
          title={
            <div
              className={styles.cardTitle}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <span>谁是卧底房间</span>
              <Badge
                status={roomInfo ? statusInfo.badgeStatus : 'default'}
                text={roomInfo ? statusInfo.text : '无活跃房间'}
                className={styles.statusBadge}
              />
              {countdown !== null && (
                <span className={styles.headerCountdown}>
                  <ClockCircleOutlined /> {countdown}s
                </span>
              )}
              <DragOutlined className={styles.dragIcon} />
            </div>
          }
          extra={
            <div className={styles.cardActions}>
              <Button
                type="text"
                onClick={(e) => showRuleModal(e)}
                icon={<QuestionCircleOutlined />}
                title="游戏规则"
              />
              <Button
                type="text"
                onClick={(e) => {
                  const newPinnedState = !isPinned;
                  setIsPinned(newPinnedState);
                  message.info(newPinnedState ? '已置顶，点击空白处不会关闭' : '已取消置顶');
                }}
                icon={isPinned ? <PushpinFilled className={styles.pinnedIcon} /> : <PushpinOutlined />}
                title={isPinned ? "取消置顶" : "置顶"}
              />
              <Button
                type="text"
                onClick={() => setShowChat(!showChat)}
                icon={<CommentOutlined className={showChat ? styles.activeIcon : ''} />}
                title={showChat ? "隐藏聊天" : "显示聊天"}
              />
              <Button type="text" onClick={onClose} icon={<RightOutlined />} />
            </div>
          }
          className={`${styles.roomInfoCard} ${isPinned ? styles.pinned : ''} ${silentRefresh ? styles.silentRefresh : ''}`}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className={styles.roomTabs}
            items={[
              {
                key: 'current',
                label: (
                  <span>
                    <TeamOutlined /> 当前房间
                  </span>
                ),
                children: (
                  loading && !silentRefresh ? (
                    <div className={styles.loadingContainer}>
                      <Spin tip="加载中..." />
                    </div>
                  ) : error ? (
                    <div>
                      <Empty
                        description={error}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                      {/* 在错误状态下，如果是管理员，也显示管理员操作按钮 */}
                      {isAdmin && (
                        <div className={styles.adminActionsCenter}>
                          {renderAdminButtons()}
                        </div>
                      )}
                      {/* 在错误状态下，如果不是管理员，显示创建房间按钮 */}
                      {!isAdmin && (
                        <div className={styles.adminActionsCenter}>
                          {renderCreateRoomButton()}
                        </div>
                      )}
                    </div>
                  ) : roomInfo ? (
                    <div className={styles.roomContent}>
                      <div className={styles.roomHeader}>
                        <h3 className={styles.roomName}>谁是卧底</h3>
                        {roomInfo.creatorId && (
                          <div className={styles.creatorInfo}>
                            <Avatar
                              size="small"
                              src={roomInfo.creatorAvatar}
                              icon={!roomInfo.creatorAvatar && <UserOutlined />}
                            />
                            <span className={styles.creatorName}>{roomInfo.creatorName || '未知用户'}</span>
                            <span className={styles.creatorLabel}>房主</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.infoSection}>
                        <div className={styles.infoItem}>
                          <TeamOutlined className={styles.infoIcon} />
                          <span>玩家数量: {roomInfo.participants?.length || 0}/{roomInfo.maxPlayers || 0}</span>
                        </div>

                        <div className={styles.infoItem}>
                          <ClockCircleOutlined className={styles.infoIcon} />
                          <span style={{ color: statusInfo.color }}>状态: {statusInfo.text}</span>
                        </div>

                        {/* 显示游戏模式 */}
                        {roomInfo.gameMode !== undefined && (
                          <div className={styles.infoItem}>
                            <BulbOutlined className={styles.infoIcon} />
                            <span>游戏模式: {roomInfo.gameMode === 1 ? '常规模式' : '猜词模式'}</span>
                          </div>
                        )}

                        {/* 显示当前玩家的词语和身份，根据游戏模式显示不同内容 */}
                        {roomInfo.status === 'PLAYING' && renderGameInfo()}
                      </div>

                      {/* 玩家列表 */}
                      {roomInfo.participants && roomInfo.participants.length > 0 && (
                        <div className={styles.playersListContainer}>
                          <h4 className={styles.playersTitle}>参与玩家</h4>
                          <div className={styles.playersList}>
                            <List
                              size="small"
                              dataSource={roomInfo.participants}
                              renderItem={(player, index) => renderPlayerItem(player, index)}
                            />
                          </div>
                        </div>
                      )}

                      {/* 底部操作区域，将管理员操作和普通操作分开布局 */}
                      <div className={styles.actionContainer}>
                        {/* 管理员操作区 */}
                        {isAdmin && (
                          <div className={styles.adminActionsSection}>
                            <h4 className={styles.sectionTitle}>管理员操作</h4>
                            <div className={styles.adminActions}>
                              {renderAdminButtons()}
                            </div>
                          </div>
                        )}

                        {/* 房间创建者操作区 */}
                        {!isAdmin && roomInfo && currentUser && roomInfo.creatorId === currentUser.id && (
                          <div className={styles.creatorActionsSection}>
                            <h4 className={styles.sectionTitle}>创建者操作</h4>
                            <div className={styles.creatorActions}>
                              {renderCreatorButtons()}
                            </div>
                          </div>
                        )}

                        {/* 普通操作区 */}
                        <div className={styles.userActionsSection}>
                          <h4 className={styles.sectionTitle}>玩家操作</h4>
                          {renderUserActions()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Empty
                        description="暂无活跃房间"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                      {/* 在无房间状态下，如果是管理员，显示管理员操作按钮 */}
                      {isAdmin && (
                        <div className={styles.adminActionsCenter}>
                          {renderAdminButtons()}
                        </div>
                      )}
                      {/* 在无房间状态下，如果不是管理员，显示创建房间按钮 */}
                      {!isAdmin && (
                        <div className={styles.adminActionsCenter}>
                          {renderCreateRoomButton()}
                        </div>
                      )}
                    </div>
                  )
                )
              },
              {
                key: 'list',
                label: (
                  <span>
                    <UnorderedListOutlined /> 房间列表
                  </span>
                ),
                children: (
                  <div className={styles.roomListContainer}>
                    {roomListLoading ? (
                      <div className={styles.loadingContainer}>
                        <Spin tip="加载中..." />
                      </div>
                    ) : roomList.length > 0 ? (
                      <List
                        className={styles.roomList}
                        itemLayout="horizontal"
                        dataSource={roomList}
                        renderItem={renderRoomListItem}
                        pagination={{
                          onChange: page => {
                            if (cardRef.current) {
                              cardRef.current.scrollTop = 0;
                            }
                          },
                          pageSize: 5,
                          size: 'small',
                          simple: true,
                        }}
                        footer={
                          <div className={styles.roomListFooter}>
                            <Button
                              icon={<ReloadOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                safelyCallRef(fetchRoomListRef);
                              }}
                            >
                              刷新列表
                            </Button>
                            <Button
                              type="primary"
                              icon={<PlusCircleOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                showCreateModal();
                                // 确保保持在房间列表标签
                                setActiveTab('list');
                              }}
                            >
                              创建房间
                            </Button>
                          </div>
                        }
                      />
                    ) : (
                      <Empty
                        description="暂无可用房间"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button
                          type="primary"
                          icon={<PlusCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            showCreateModal();
                            // 确保保持在房间列表标签
                            setActiveTab('list');
                          }}
                        >
                          创建房间
                        </Button>
                      </Empty>
                    )}
                  </div>
                )
              }
            ]}
          />
        </Card>

        {/* 聊天窗口 */}
        {showChat && (
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <span>房间聊天</span>
              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                onClick={() => setShowChat(false)}
              />
            </div>
            {/* 在聊天消息区域上方添加倒计时显示 */}
            {countdown !== null && (
              <div className={styles.chatCountdown}>
                <ClockCircleOutlined /> 倒计时: <span className={styles.chatCountdownValue}>{countdown}</span> 秒
              </div>
            )}
            <div className={styles.chatMessages} ref={chatMessagesRef}>
              {!roomInfo ? (
                <div className={styles.emptyChatMessage}>
                  <Empty description="请先选择房间" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              ) : chatMessages.filter(msg => !msg.roomId || msg.roomId === roomInfo?.roomId).length > 0 ? (
                chatMessages
                  .filter(msg => !msg.roomId || msg.roomId === roomInfo?.roomId)
                  .map((msg, index) => renderChatMessage(msg, index))
              ) : (
                <div className={styles.emptyChatMessage}>
                  <Empty description="暂无消息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </div>
            <div className={styles.chatInputContainer}>
              {!isRoomParticipant() && roomInfo && (
                <div className={styles.notJoinedTip}>
                  您尚未加入该房间，加入后才能参与聊天
                </div>
              )}
              <div className={styles.chatInputRow}>
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isRoomParticipant() ? "输入消息..." : "加入房间后才能发言"}
                  className={styles.chatInput}
                  disabled={!isRoomParticipant()}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !isRoomParticipant()}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 创建房间模态框 */}
      <Modal
        title="创建谁是卧底房间"
        open={isCreateModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsCreateModalVisible(false)}
        confirmLoading={creatingRoom}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRoom}
          initialValues={{
            maxPlayers: 8,
            civilianWord: '',
            undercoverWord: '',
            duration: 600,
            roomType: 'random',
            gameMode: 1 // 默认为常规模式(1)
          }}
        >
          <Form.Item
            name="roomType"
            label="房间类型"
            rules={[{ required: true, message: '请选择房间类型' }]}
            className={styles.roomTypeSelector}
          >
            <Radio.Group>
              <Radio value="god">上帝模式（自定义词语）</Radio>
              <Radio value="random">随机模式（系统随机词语）</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="gameMode"
            label="游戏模式"
            rules={[{ required: true, message: '请选择游戏模式' }]}
            className={styles.gameModeSelector}
          >
            <Radio.Group>
              <Radio value={1}>常规模式（所有人都有词语，不知道身份）</Radio>
              <Radio value={2}>猜词模式（卧底知道身份但没有词语）</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="maxPlayers"
            label="最大玩家数"
            rules={[
              { required: true, message: '请输入最大玩家数' },
              { type: 'number', min: 3, message: '玩家数至少为3人' },
              { type: 'number', max: 20, message: '玩家数最多为20人' }
            ]}
          >
            <InputNumber min={3} max={20} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.roomType !== currentValues.roomType}
          >
            {({ getFieldValue }) =>
              getFieldValue('roomType') === 'god' ? (
                <>
                  <Form.Item
                    name="civilianWord"
                    label="平民词"
                    rules={[{ required: true, message: '请输入平民词' }]}
                  >
                    <Input placeholder="例如：苹果" />
                  </Form.Item>

                  <Form.Item
                    name="undercoverWord"
                    label="卧底词"
                    rules={[{ required: true, message: '请输入卧底词' }]}
                  >
                    <Input placeholder="例如：梨" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="duration"
            label="游戏时长(秒)"
            rules={[
              { required: true, message: '请输入游戏时长' },
              { type: 'number', min: 60, message: '游戏时长至少为60秒' }
            ]}
          >
            <InputNumber min={60} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 游戏规则模态框 */}
      <Modal
        title="谁是卧底游戏规则"
        open={isRuleModalVisible}
        onOk={() => setIsRuleModalVisible(false)}
        onCancel={() => setIsRuleModalVisible(false)}
        maskClosable={false}
        footer={[
          <Button key="close" type="primary" onClick={(e) => {
            e.stopPropagation(); // 阻止事件冒泡
            setIsRuleModalVisible(false);
          }}>
            我知道了
          </Button>
        ]}
      >
        <div className={styles.ruleContent} onClick={(e) => e.stopPropagation()}>
          <h3>游戏规则说明</h3>
          <p><strong>游戏目标：</strong>平民找出卧底，卧底隐藏自己融入平民。</p>

          <h4>游戏模式：</h4>
          <ul>
            <li><strong>常规模式：</strong>所有玩家都有词语，但不知道自己的身份。通过描述和推理，平民需要找出卧底，卧底需要隐藏自己。</li>
            <li><strong>猜词模式：</strong>卧底知道自己的身份但不知道词语，平民知道词语但不知道自己的身份。卧底需要通过其他玩家的描述猜出平民词语。</li>
          </ul>

          <h4>基本规则：</h4>
          <ol>
            <li>游戏开始后，每位玩家会收到一个词语。大多数人收到的是平民词，少数人收到的是卧底词。</li>
            <li>玩家轮流描述自己拿到的词语，但不能直接说出这个词。</li>
            <li>每轮描述后，所有玩家投票选出一名怀疑是卧底的玩家。</li>
            <li>得票最多的玩家出局，并公布其身份。</li>
            <li>如果所有卧底被找出，平民获胜；如果卧底存活到只剩两名玩家，卧底获胜。</li>
            <li>在猜词模式下，卧底还可以通过猜出平民词语直接获胜。</li>
          </ol>

          <h4>描述技巧：</h4>
          <ul>
            <li><strong>平民：</strong>描述要准确但不要太明显，既能让其他平民理解，又不会让卧底轻易识别。</li>
            <li><strong>卧底：</strong>要仔细听平民的描述，尽量模仿平民的描述方式，避免被识破。</li>
          </ul>

          <h4>投票策略：</h4>
          <ul>
            <li>注意观察其他玩家的描述是否与大多数人一致。</li>
            <li>留意玩家的反应和表情，有时卧底会因紧张而露出破绽。</li>
            <li>不要轻易暴露自己的判断，以免被卧底利用。</li>
          </ul>

          <p><strong>祝您游戏愉快！</strong></p>
        </div>
      </Modal>

      {/* 用户消息模态框 */}
      <Modal
        title={`${viewingUserId ? getUserName(viewingUserId) : '用户'}的消息记录`}
        open={isUserMessagesVisible}
        onCancel={(e) => {
          // 阻止事件冒泡
          e?.stopPropagation();
          setIsUserMessagesVisible(false);
        }}
        maskClosable={false}
        wrapClassName={styles.userMessagesModal}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              setIsUserMessagesVisible(false);
            }}
          >
            关闭
          </Button>
        ]}
      >
        <div
          className={styles.userMessagesContent}
          onClick={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          {viewingUserId && (
            hasUserMessages(viewingUserId) ? (
              <List
                dataSource={getUserMessages(viewingUserId)}
                renderItem={(msg, index) => (
                  <List.Item
                    onClick={(e) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                  >
                    <div
                      className={styles.userMessageItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                      }}
                    >
                      <div className={styles.userMessageTime}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className={styles.userMessageContent}>
                        {msg.content}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="该用户暂无消息记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          )}
        </div>
      </Modal>

      {/* 猜词模态框 */}
      <Modal
        title="卧底猜词"
        open={isGuessModalVisible}
        onOk={(e) => {
          e?.stopPropagation();
          guessForm.submit();
        }}
        onCancel={(e) => {
          e?.stopPropagation();
          setIsGuessModalVisible(false);
        }}
        confirmLoading={guessing}
        maskClosable={false}
        okText="提交"
        cancelText="取消"
        wrapClassName={styles.guessModalWrapper}
        modalRender={(modal) => (
          <div onClick={(e) => e.stopPropagation()}>
            {modal}
          </div>
        )}
      >
        <div className={styles.guessModalContent} onClick={(e) => e.stopPropagation()}>
          <p>你是卧底！如果你猜出平民的词语，卧底将获胜。请输入你猜测的平民词：</p>
          <Form
            form={guessForm}
            onFinish={(values) => {
              handleGuessWord(values);
              return false;
            }}
            layout="vertical"
            onClick={(e) => e.stopPropagation()}
          >
            <Form.Item
              name="guessWord"
              rules={[{ required: true, message: '请输入你猜测的平民词' }]}
            >
              <Input
                placeholder="输入平民词"
                value={guessWord}
                onChange={(e) => {
                  e.stopPropagation();
                  setGuessWord(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default RoomInfoCard;
