import { CustomerServiceOutlined, ExportOutlined, MinusOutlined } from '@ant-design/icons';
import { history, useLocation } from '@umijs/max';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

const MUSIC_URL = 'https://music.yucoder.cn/';
const MUSIC_PATH = '/moments/music';
const MUSIC_LAUNCHER_POSITION_KEY = 'globalMusicLauncherPosition';
const LAUNCHER_VIEWPORT_GAP = 8;
const DRAG_THRESHOLD = 4;

interface LauncherPosition {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

const loadLauncherPosition = (): LauncherPosition | null => {
  if (typeof window === 'undefined') return null;

  try {
    const value = JSON.parse(window.localStorage.getItem(MUSIC_LAUNCHER_POSITION_KEY) || 'null');
    return Number.isFinite(value?.x) && Number.isFinite(value?.y) ? value : null;
  } catch {
    return null;
  }
};

const clampLauncherPosition = (
  position: LauncherPosition,
  width: number,
  height: number,
): LauncherPosition => ({
  x: Math.min(
    Math.max(LAUNCHER_VIEWPORT_GAP, position.x),
    Math.max(LAUNCHER_VIEWPORT_GAP, window.innerWidth - width - LAUNCHER_VIEWPORT_GAP),
  ),
  y: Math.min(
    Math.max(LAUNCHER_VIEWPORT_GAP, position.y),
    Math.max(LAUNCHER_VIEWPORT_GAP, window.innerHeight - height - LAUNCHER_VIEWPORT_GAP),
  ),
});

const GlobalMusicPlayer: React.FC = () => {
  const location = useLocation();
  const isMusicPage = location.pathname === MUSIC_PATH;
  const previousPathRef = useRef('/moments/post');
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const dragMovedRef = useRef(false);
  const [hasLoaded, setHasLoaded] = useState(isMusicPage);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [launcherPosition, setLauncherPosition] = useState<LauncherPosition | null>(
    loadLauncherPosition,
  );

  useEffect(() => {
    if (isMusicPage) {
      setHasLoaded(true);
      document.body.classList.add('music-page-no-scroll');
    } else {
      // 只有点击“后台挂起”才保留 iframe；普通路由切换直接卸载它。
      if (!isSuspended) {
        setHasLoaded(false);
      }
      previousPathRef.current = `${location.pathname}${location.search || ''}`;
      document.body.classList.remove('music-page-no-scroll');
    }

    return () => document.body.classList.remove('music-page-no-scroll');
  }, [isMusicPage, isSuspended, location.pathname, location.search]);

  useEffect(() => {
    const clampCurrentPosition = () => {
      setLauncherPosition((currentPosition) => {
        if (!currentPosition || !launcherRef.current) return currentPosition;
        const { width, height } = launcherRef.current.getBoundingClientRect();
        const nextPosition = clampLauncherPosition(currentPosition, width, height);
        window.localStorage.setItem(MUSIC_LAUNCHER_POSITION_KEY, JSON.stringify(nextPosition));
        return nextPosition;
      });
    };

    clampCurrentPosition();
    window.addEventListener('resize', clampCurrentPosition);
    return () => window.removeEventListener('resize', clampCurrentPosition);
  }, [isMusicPage]);

  const suspendPlayer = () => {
    setIsSuspended(true);
    history.push(
      previousPathRef.current === MUSIC_PATH ? '/moments/post' : previousPathRef.current,
    );
  };

  const cancelSuspension = () => {
    setIsSuspended(false);
    setHasLoaded(false);
  };

  const restorePlayer = () => {
    setHasLoaded(true);
    history.push(MUSIC_PATH);
  };

  const handleSuspendClick = () => {
    if (isSuspended) {
      cancelSuspension();
      return;
    }
    suspendPlayer();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    dragMovedRef.current = false;
    setIsDragging(true);
    setLauncherPosition({ x: rect.left, y: rect.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (
      Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) >=
      DRAG_THRESHOLD
    ) {
      dragMovedRef.current = true;
    }

    const { width, height } = event.currentTarget.getBoundingClientRect();
    setLauncherPosition(
      clampLauncherPosition(
        {
          x: event.clientX - dragState.offsetX,
          y: event.clientY - dragState.offsetY,
        },
        width,
        height,
      ),
    );
  };

  const finishDragging = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setLauncherPosition((currentPosition) => {
      if (currentPosition) {
        window.localStorage.setItem(MUSIC_LAUNCHER_POSITION_KEY, JSON.stringify(currentPosition));
      }
      return currentPosition;
    });
  };

  const handleSuspendedClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (dragMovedRef.current) {
      event.preventDefault();
      dragMovedRef.current = false;
      return;
    }
    restorePlayer();
  };

  return (
    <>
      {(isMusicPage || (hasLoaded && isSuspended)) && (
        <section
          className={`${styles.player} ${isMusicPage ? styles.playerFull : styles.playerSuspended}`}
          aria-hidden={!isMusicPage}
        >
          {isMusicPage && (
            <div className={styles.musicHeader}>
              <div className={styles.musicTitle}>
                <CustomerServiceOutlined />
                <span>摸鱼音乐</span>
                <span className={styles.keepAliveHint}>离开页面后仍可继续播放</span>
              </div>
              <div className={styles.headerActions}>
                <button type="button" className={styles.suspendButton} onClick={handleSuspendClick}>
                  <MinusOutlined />
                  {isSuspended ? '取消挂起' : '后台挂起'}
                </button>
                <a
                  href={MUSIC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.openLink}
                >
                  新窗口打开
                  <ExportOutlined />
                </a>
              </div>
            </div>
          )}
          <div className={styles.frameWrap}>
            <iframe
              className={styles.musicFrame}
              src={MUSIC_URL}
              title="摸鱼音乐"
              scrolling="no"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
      )}

      {!isMusicPage && isSuspended && (
        <button
          ref={launcherRef}
          type="button"
          className={`${styles.restoreButton} ${isDragging ? styles.restoreButtonDragging : ''}`}
          title="恢复摸鱼音乐"
          aria-label="恢复摸鱼音乐"
          style={
            launcherPosition
              ? {
                  top: launcherPosition.y,
                  left: launcherPosition.x,
                  right: 'auto',
                  bottom: 'auto',
                }
              : undefined
          }
          onClick={handleSuspendedClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDragging}
          onPointerCancel={finishDragging}
        >
          <span className={styles.vinylRecord} aria-hidden>
            <span className={styles.vinylLabel}>♫</span>
          </span>
        </button>
      )}
    </>
  );
};

export default GlobalMusicPlayer;
