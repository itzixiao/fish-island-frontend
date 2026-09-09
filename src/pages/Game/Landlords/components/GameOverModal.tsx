/**
 * 游戏结束弹窗组件
 *
 * 仅展示结算信息，由用户手动选择「继续游戏」或「离开房间」。
 * 自动退出由上层「准备阶段 30 秒倒计时」负责：
 *   游戏结束后后端立即把房间重置为 WAITING 阶段并广播 readyPhaseStartTime，
 *   若 30 秒内用户未点「继续游戏」（相当于点准备），
 *   会被前端的准备超时逻辑自动踢出房间。
 */
import React from 'react';
import { Modal, Button, Tag } from 'antd';
import { GameResult } from '../types';

interface GameOverModalProps {
  visible: boolean;
  result: GameResult | null;
  onClose?: () => void;
  onPlayAgain?: () => void;
  onBack?: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  result,
  onClose,
  onPlayAgain,
  onBack,
}) => {
  if (!visible || !result) return null;

  const isLandlordWin = result.isLandlordWin;
  const isWinner = result.players?.some(
    (p) => p.isWinner && String(p.userId) === String(result.winnerId)
  );

  return (
    <Modal
      open={visible}
      footer={null}
      closable={true}
      onCancel={onClose}
      centered
      width={420}
    >
      {/* 标题区 */}
      <div style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 24 }}>
        <div
          style={{
            fontSize: 60,
            marginBottom: 16,
            animation: isWinner ? 'bounce 1s infinite' : undefined,
          }}
        >
          {isWinner ? '🏆' : '😢'}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 8,
            color: isWinner ? '#eab308' : '#6b7280',
          }}
        >
          {isWinner ? '恭喜获胜!' : '很遗憾，你输了'}
        </div>
        <div style={{ color: '#6b7280' }}>
          获胜者: <span style={{ fontWeight: 'bold' }}>{result.winnerName}</span>
          <span style={{ marginLeft: 8, fontSize: 14 }}>
            ({isLandlordWin ? '地主获胜' : '农民获胜'})
          </span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

      {/* 结算详情 */}
      <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 12, textAlign: 'center' }}>结算详情</div>

        {/* 玩家结算 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.players?.map((player, index) => (
            <div
              key={player.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 8,
                paddingBottom: 8,
                borderBottom: index < result.players.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {player.isLandlord ? (
                  <Tag color="red" style={{ fontSize: 12, margin: 0 }}>地主</Tag>
                ) : (
                  <Tag color="green" style={{ fontSize: 12, margin: 0 }}>农民</Tag>
                )}
                <span style={player.isWinner ? { fontWeight: 'bold', color: '#2563eb' } : {}}>
                  {player.userName}
                  {player.isWinner && ' (赢家)'}
                </span>
              </div>
              <span
                style={{
                  fontWeight: 'bold',
                  color: player.scoreChange > 0 ? '#16a34a' : player.scoreChange < 0 ? '#dc2626' : '#6b7280',
                }}
              >
                {player.scoreChange > 0 ? '+' : ''}
                {player.scoreChange}
              </span>
            </div>
          ))}
        </div>

        {/* 炸弹奖励 */}
        {result.bombCount && result.bombCount > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6b7280' }}>炸弹 x{result.bombCount}</span>
              <span style={{ color: '#ea580c', fontWeight: 'bold' }}>
                +{result.bombCount * 5}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 提示：30秒后会自动踢出 */}
      <div
        style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        30 秒内未点击「继续游戏」将自动退出房间
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <Button block size="large" onClick={onBack}>
          离开房间
        </Button>
        <Button type="primary" block size="large" onClick={onPlayAgain}>
          继续游戏
        </Button>
      </div>
    </Modal>
  );
};

export default GameOverModal;