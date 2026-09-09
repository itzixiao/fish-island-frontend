/**
 * 手牌组件 - 从左到右按从小到大排序，支持选中效果
 * 支持多副牌场景：每张牌用 (cardId, index) 复合 key 唯一标识
 * 响应式设计：根据视口宽度和可用空间自动调整牌面大小
 *
 * 选牌交互：单击牌切换选中状态
 */
import React, { useState, useEffect, useRef } from 'react';
import { parsePokerId } from '../utils/pokerUtils';

interface HandCardsProps {
  cards: string[];
  selectedCards: string[];
  onSelectCard: (cardId: string, index: number) => void;
  disabled?: boolean;
}

interface PokerCardComponentProps {
  id: string;
  selected: boolean;
  disabled: boolean;
  style?: React.CSSProperties;
  cardWidth: number;
  cardHeight: number;
  onClick?: () => void;
}

// 手牌之间的重叠比例（marginLeft 偏移与尺寸计算共用，保证总宽度一致）
const CARD_OVERLAP_RATIO = 0.48;

/**
 * 单张牌组件
 */
const PokerCardComponent = React.forwardRef<HTMLDivElement, PokerCardComponentProps>(({
  id,
  selected,
  disabled,
  style,
  cardWidth,
  cardHeight,
  onClick,
}, ref) => {
  const parsed = parsePokerId(id);
  const displayValue = parsed.displayValue;
  const cornerFontSize = cardWidth * 0.32;
  const symbolSize = cardWidth * 0.28;
  const cornerPadding = cardWidth * 0.06;

  return (
    <div
      ref={ref}
      data-card-element="true"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: cardWidth * 0.14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        width: cardWidth,
        height: cardHeight,
        backgroundColor: parsed.bgColor,
        border: selected ? `3px solid #f97316` : '2px solid #d9d9d9',
        color: parsed.color,
        // 始终保持紧凑重叠排列（不论是否选中）
        marginLeft: -cardWidth * CARD_OVERLAP_RATIO,
        // 选中牌：垂直向上偏移 30%，从牌堆中"抽出"
        transform: selected
          ? `translateY(-${cardHeight * 0.3}px)`
          : undefined,
        boxShadow: selected
          ? `0 ${cardHeight * 0.1}px ${cardHeight * 0.2}px rgba(249,115,22,0.35)`
          : `0 ${cardHeight * 0.03}px ${cardHeight * 0.08}px rgba(0,0,0,0.1)`,
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {/* 左上角 */}
      <div
        style={{
          position: 'absolute',
          top: cornerPadding,
          left: cornerPadding,
          fontSize: cornerFontSize,
          fontWeight: 'bold',
          lineHeight: 1,
          textAlign: 'center' as const,
        }}
      >
        <div>{parsed.symbol}</div>
        <div style={{ fontSize: cornerFontSize * 0.75 }}>{displayValue}</div>
      </div>

      {/* 中心 */}
      <div style={{ fontSize: symbolSize, fontWeight: 'bold' }}>{parsed.symbol}</div>

      {/* 右下角 (镜像) */}
      <div
        style={{
          position: 'absolute',
          bottom: cornerPadding,
          right: cornerPadding,
          fontSize: cornerFontSize,
          fontWeight: 'bold',
          lineHeight: 1,
          textAlign: 'center' as const,
          transform: 'rotate(180deg)',
        }}
      >
        <div>{parsed.symbol}</div>
        <div style={{ fontSize: cornerFontSize * 0.75 }}>{displayValue}</div>
      </div>

      {/* 癞子标记 */}
      {parsed.isUniversal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: '#facc15',
            color: '#000',
            fontSize: cardWidth * 0.14,
            padding: `${cardWidth * 0.04}px ${cardWidth * 0.08}px`,
            borderBottomLeftRadius: cardWidth * 0.14,
            borderTopRightRadius: cardWidth * 0.14,
            fontWeight: 'bold',
          }}
        >
          癞
        </div>
      )}
    </div>
  );
});
PokerCardComponent.displayName = 'PokerCardComponent';

const HandCards: React.FC<HandCardsProps> = ({
  cards = [],
  selectedCards = [],
  onSelectCard,
  disabled = false,
}) => {
  // 后端已在 LandlordsGameService 发牌时按斗地主规则降序排好序（大牌在左、小牌在右），
  // 这里直接使用后端返回的顺序，避免前后端排序逻辑不一致导致顺序错乱。
  const sortedCards = cards;
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 响应式牌面大小计算
  const [cardSize, setCardSize] = useState({ width: 60, height: 84 });

  useEffect(() => {
    const calculateCardSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width || container.clientWidth;
      const containerHeight = rect.height || container.clientHeight;

      if (containerWidth <= 0 || containerHeight <= 0) return;

      const cardCount = cards.length || 17;
      const overlapRatio = CARD_OVERLAP_RATIO;
      const effectiveWidthRatio = overlapRatio + cardCount * (1 - overlapRatio);
      const widthFromWidth = containerWidth / effectiveWidthRatio;
      const widthFromHeight = (containerHeight * 0.75) / 1.4;

      let cardWidth = Math.min(widthFromWidth, widthFromHeight);
      const minWidth = 28;
      const maxWidth = 72;
      cardWidth = Math.max(minWidth, Math.min(maxWidth, cardWidth));
      const cardHeight = cardWidth * 1.4;

      setCardSize((prev) =>
        prev.width !== cardWidth || prev.height !== cardHeight
          ? { width: cardWidth, height: cardHeight }
          : prev
      );
    };

    calculateCardSize();
    window.addEventListener('resize', calculateCardSize);

    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => calculateCardSize());
      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', calculateCardSize);
    };
  }, [cards.length]);

  // 单击牌：切换该牌的选中状态
  const handleCardClick = (index: number) => {
    if (disabled) return;
    if (index < 0 || index >= cards.length) return;
    onSelectCard(cards[index], index);
  };

  if (cards.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <div style={{ color: '#9ca3af' }}>暂无手牌</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        overflow: 'visible',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          maxWidth: '100%',
          overflow: 'visible',
          position: 'relative',
        }}
      >
        {sortedCards.map((cardId, index) => {
          const cardKey = `${cardId}:${index}`;
          return (
            <PokerCardComponent
              key={cardKey}
              id={cardId}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              selected={selectedCards.includes(cardKey)}
              disabled={disabled}
              cardWidth={cardSize.width}
              cardHeight={cardSize.height}
              onClick={() => handleCardClick(index)}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default HandCards;