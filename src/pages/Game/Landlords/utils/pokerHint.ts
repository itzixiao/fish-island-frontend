/**
 * 斗地主出牌提示工具
 * 提供牌型分析、智能选牌、出牌提示等功能
 */
import { parsePokerId } from './pokerUtils';

// ==================== 类型定义 ====================

/**
 * 牌型枚举
 */
export enum CardPattern {
  INVALID = 'INVALID',
  SINGLE = 'SINGLE',
  PAIR = 'PAIR',
  TRIPLE = 'TRIPLE',
  TRIPLE_SINGLE = 'TRIPLE_SINGLE',
  TRIPLE_PAIR = 'TRIPLE_PAIR',
  BOMB = 'BOMB',
  QUAD_PLANE_SINGLE = 'QUAD_PLANE_SINGLE', // 四带两单
  QUAD_PLANE_PAIR = 'QUAD_PLANE_PAIR',     // 四带一对
  STRAIGHT = 'STRAIGHT',
  DOUBLE_STRAIGHT = 'DOUBLE_STRAIGHT',
  PLANE = 'PLANE',
  PLANE_SINGLE = 'PLANE_SINGLE',
  PLANE_PAIR = 'PLANE_PAIR',
  JOKER_BOMB = 'JOKER_BOMB',
}

/**
 * 牌型分析结果
 */
export interface PatternResult {
  pattern: CardPattern;
  mainValue: number;    // 主牌值（用于比较大小）
  count: number;        // 牌数量
  cards: string[];      // 组成该牌型的牌
  description: string;  // 描述，如 "对A"、"顺子56789"
}

/**
 * 可出的牌组合
 */
export interface PlayableCombination {
  pattern: CardPattern;
  mainValue: number;
  count: number;
  cards: string[];        // 牌ID列表
  cardIndices: number[];  // 在手牌中的下标
  description: string;
}

/**
 * 提示上下文
 */
export interface HintContext {
  combinations: PlayableCombination[];
  currentIndex: number;
  isActive: boolean;
}

// ==================== 工具函数 ====================

/**
 * 获取牌点值（处理癞子）
 */
function getCardValue(cardId: string): number {
  const parsed = parsePokerId(cardId);
  return parsed.isUniversal ? 14 : parsed.value;
}

/**
 * 获取癞子数量
 */
function getUniversalCount(cards: string[]): number {
  return cards.filter(c => parsePokerId(c).isUniversal).length;
}

/**
 * 判断牌是否是癞子
 */
function isUniversal(cardId: string): boolean {
  return parsePokerId(cardId).isUniversal;
}

/**
 * 按牌值分组手牌
 */
function groupByValue(cards: string[]): Map<number, string[]> {
  const groups = new Map<number, string[]>();
  for (const card of cards) {
    const value = getCardValue(card);
    if (!groups.has(value)) {
      groups.set(value, []);
    }
    groups.get(value)!.push(card);
  }
  return groups;
}

/**
 * 按牌值排序
 */
function sortByValue(cards: string[]): string[] {
  return [...cards].sort((a, b) => getCardValue(a) - getCardValue(b));
}

// ==================== 牌型分析 ====================

/**
 * 分析牌型
 */
export function analyzePattern(cards: string[]): PatternResult | null {
  if (!cards || cards.length === 0) {
    return null;
  }

  const count = cards.length;
  const values = cards.map(getCardValue);
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  const universalCount = getUniversalCount(cards);

  // 单张
  if (count === 1) {
    const value = values[0];
    return {
      pattern: CardPattern.SINGLE,
      mainValue: value,
      count: 1,
      cards,
      description: getValueDisplay(value),
    };
  }

  // 王炸
  if (isJokerBomb(cards)) {
    return {
      pattern: CardPattern.JOKER_BOMB,
      mainValue: 100,
      count: 2,
      cards,
      description: '王炸',
    };
  }

  // 炸弹（四张相同点数）
  if (isBomb(cards, values, universalCount)) {
    const mainValue = getBombMainValue(cards, values);
    return {
      pattern: CardPattern.BOMB,
      mainValue,
      count: 4,
      cards,
      description: `炸弹${getValueDisplay(mainValue)}`,
    };
  }

  // 对子
  if (count === 2 && canFormPair(values, universalCount)) {
    const mainValue = getPairMainValue(cards, values);
    return {
      pattern: CardPattern.PAIR,
      mainValue,
      count: 2,
      cards,
      description: `对${getValueDisplay(mainValue)}`,
    };
  }

  // 三张
  if (count === 3 && canFormTriple(cards, values, universalCount)) {
    const mainValue = getTripleMainValue(cards, values);
    return {
      pattern: CardPattern.TRIPLE,
      mainValue,
      count: 3,
      cards,
      description: `三张${getValueDisplay(mainValue)}`,
    };
  }

  // 三带一
  if (count === 4 && canFormTripleSingle(cards, values, universalCount)) {
    const mainValue = getTripleMainValueFromFour(cards, values);
    return {
      pattern: CardPattern.TRIPLE_SINGLE,
      mainValue,
      count: 4,
      cards,
      description: `三带一${getValueDisplay(mainValue)}`,
    };
  }

  // 三带二
  if (count === 5 && canFormTriplePair(cards, values, universalCount)) {
    const mainValue = getTripleMainValueFromFive(cards, values);
    return {
      pattern: CardPattern.TRIPLE_PAIR,
      mainValue,
      count: 5,
      cards,
      description: `三带二${getValueDisplay(mainValue)}`,
    };
  }

  // 顺子（5张或更多连续单牌）
  if (count >= 5 && isStraight(values, universalCount)) {
    const mainValue = Math.max(...uniqueValues);
    return {
      pattern: CardPattern.STRAIGHT,
      mainValue,
      count,
      cards,
      description: `顺子${values.map(getValueDisplay).join('')}`,
    };
  }

  // 连对（3对或更多连续对子）
  if (count >= 6 && count % 2 === 0 && isDoubleStraight(cards, values, universalCount)) {
    const pairCount = count / 2;
    const mainValue = getDoubleStraightMainValue(cards, values, universalCount);
    return {
      pattern: CardPattern.DOUBLE_STRAIGHT,
      mainValue,
      count,
      cards,
      description: `${pairCount}连对`,
    };
  }

  // 飞机（2个或更多连续三张）
  if (count >= 6 && count % 3 === 0 && isPlane(values, universalCount)) {
    const tripleCount = count / 3;
    const mainValue = getPlaneMainValue(cards, values, universalCount);
    return {
      pattern: CardPattern.PLANE,
      mainValue,
      count,
      cards,
      description: `${tripleCount}飞机`,
    };
  }

  // 飞机带单
  if (count >= 6 && count % 4 === 2 && canFormPlaneSingle(cards, values, universalCount)) {
    const tripleCount = (count - 2) / 3;
    const mainValue = getPlaneMainValueFromPlaneSingle(cards, values, universalCount);
    return {
      pattern: CardPattern.PLANE_SINGLE,
      mainValue,
      count,
      cards,
      description: `飞机带单(${tripleCount})`,
    };
  }

  // 飞机带对
  if (count >= 10 && count % 5 === 0 && canFormPlanePair(cards, values, universalCount)) {
    const tripleCount = count / 5;
    const mainValue = getPlaneMainValueFromPlanePair(cards, values, universalCount);
    return {
      pattern: CardPattern.PLANE_PAIR,
      mainValue,
      count,
      cards,
      description: `飞机带对(${tripleCount})`,
    };
  }

  // 四带两单
  if (count === 6 && canFormQuadPlaneSingle(cards, values, universalCount)) {
    const mainValue = getQuadMainValue(cards, values, universalCount);
    return {
      pattern: CardPattern.QUAD_PLANE_SINGLE,
      mainValue,
      count,
      cards,
      description: `四带两单`,
    };
  }

  // 四带一对
  if (count === 6 && canFormQuadPlanePair(cards, values, universalCount)) {
    const mainValue = getQuadMainValue(cards, values, universalCount);
    return {
      pattern: CardPattern.QUAD_PLANE_PAIR,
      mainValue,
      count,
      cards,
      description: `四带两对`,
    };
  }

  return null;
}

/**
 * 判断是否是王炸
 */
function isJokerBomb(cards: string[]): boolean {
  if (cards.length !== 2) return false;
  const values = cards.map(getCardValue);
  return values.includes(16) && values.includes(17);
}

/**
 * 判断是否是炸弹
 */
function isBomb(cards: string[], values: number[], universalCount: number): boolean {
  if (cards.length !== 4) return false;
  if (universalCount === 4) return true; // 4个癞子
  if (universalCount === 3) return true; // 3个癞子+1张任意牌
  if (universalCount === 2) {
    // 需要2张相同点数的牌
    const nonUniversalValues = cards.filter(c => !isUniversal(c)).map(getCardValue);
    return nonUniversalValues.length === 2 && nonUniversalValues[0] === nonUniversalValues[1];
  }
  if (universalCount === 1) {
    // 需要3张相同点数的牌
    const nonUniversalValues = cards.filter(c => !isUniversal(c)).map(getCardValue);
    return nonUniversalValues.length === 3 && nonUniversalValues.every(v => v === nonUniversalValues[0]);
  }
  // 无癞子：4张相同点数
  return values.every(v => v === values[0]);
}

/**
 * 获取炸弹的主值
 */
function getBombMainValue(cards: string[], values: number[]): number {
  const universalCount = getUniversalCount(cards);
  if (universalCount >= 3) return 14; // 癞子作为A
  const nonUniversal = cards.filter(c => !isUniversal(c));
  if (nonUniversal.length > 0) {
    return getCardValue(nonUniversal[0]);
  }
  return 14;
}

/**
 * 判断能否组成对子
 */
function canFormPair(values: number[], universalCount: number): boolean {
  if (universalCount >= 2) return true;
  if (universalCount === 1) {
    // 1个癞子+任意1张牌
    return values.length === 2;
  }
  // 无癞子：2张相同点数
  return values[0] === values[1];
}

/**
 * 获取对子的主值
 */
function getPairMainValue(cards: string[], values: number[]): number {
  const universalCount = getUniversalCount(cards);
  if (universalCount >= 2) return 14; // 癞子作为A
  if (universalCount === 1) {
    const nonUniversal = cards.filter(c => !isUniversal(c));
    return getCardValue(nonUniversal[0]);
  }
  return values[0];
}

/**
 * 判断能否组成三张
 */
function canFormTriple(cards: string[], values: number[], universalCount: number): boolean {
  if (universalCount >= 3) return true;
  if (universalCount === 2) {
    // 2个癞子+任意1张牌
    return true;
  }
  if (universalCount === 1) {
    // 1个癞子+2张相同点数的牌
    const nonUniversal = cards.filter((c, i) => !isUniversal(c)).map(c => getCardValue(c));
    return nonUniversal.length >= 2 && nonUniversal[0] === nonUniversal[1];
  }
  // 无癞子：3张相同点数
  return values[0] === values[1] && values[1] === values[2];
}

/**
 * 获取三张的主值
 */
function getTripleMainValue(cards: string[], values: number[]): number {
  const universalCount = getUniversalCount(cards);
  if (universalCount >= 3) return 14;
  if (universalCount === 2 || universalCount === 1) {
    const nonUniversal = cards.filter(c => !isUniversal(c));
    return getCardValue(nonUniversal[0]);
  }
  return values[0];
}

function getTripleMainValueFromFour(cards: string[], values: number[]): number {
  const groups = groupByValue(cards);
  for (const [value, group] of groups) {
    if (group.length >= 3) return value;
  }
  return 14; // 癞子三张
}

function getTripleMainValueFromFive(cards: string[], values: number[]): number {
  const groups = groupByValue(cards);
  for (const [value, group] of groups) {
    if (group.length >= 3) return value;
  }
  return 14;
}

/**
 * 判断能否组成三带一
 */
function canFormTripleSingle(cards: string[], values: number[], universalCount: number): boolean {
  if (universalCount >= 2) return true; // 2个及以上癞子可以凑
  const groups = groupByValue(cards);
  for (const [, group] of groups) {
    if (group.length >= 3) return true;
  }
  return false;
}

/**
 * 判断能否组成三带二
 */
function canFormTriplePair(cards: string[], values: number[], universalCount: number): boolean {
  if (universalCount >= 2) return true;
  const groups = groupByValue(cards);
  for (const [, group] of groups) {
    if (group.length >= 3) return true;
  }
  return false;
}

/**
 * 判断是否是顺子
 */
function isStraight(values: number[], universalCount: number): boolean {
  const nonUniversalValues = values.filter(v => v < 14); // 癞子值14，不参与顺子判断
  const nonUniversalSorted = [...new Set(nonUniversalValues)].sort((a, b) => a - b);

  if (nonUniversalSorted.length === 0) {
    return false;
  }

  // 检查连续性
  let gaps = 0;
  for (let i = 1; i < nonUniversalSorted.length; i++) {
    gaps += nonUniversalSorted[i] - nonUniversalSorted[i - 1] - 1;
  }

  // 癞子可以填补空缺
  return gaps <= universalCount;
}

/**
 * 判断是否是连对
 */
function isDoubleStraight(cards: string[], values: number[], universalCount: number): boolean {
  const groups = groupByValue(cards);
  const pairs: number[] = [];

  for (const [value, group] of groups) {
    if (group.length >= 2) {
      pairs.push(value);
    }
  }

  // 癞子可以凑成对子
  const universalPairs = Math.floor(universalCount / 2);
  for (let i = 0; i < universalPairs; i++) {
    pairs.push(14); // 癞子对子作为A对
  }

  if (pairs.length < 3) return false;

  const sortedPairs = [...new Set(pairs)].sort((a, b) => a - b);

  // 检查连续性
  for (let i = 1; i < sortedPairs.length; i++) {
    if (sortedPairs[i] - sortedPairs[i - 1] !== 1) {
      return false;
    }
  }

  return true;
}

function getDoubleStraightMainValue(cards: string[], values: number[], universalCount: number): number {
  const groups = groupByValue(cards);
  const pairs: number[] = [];

  for (const [value, group] of groups) {
    if (group.length >= 2) {
      pairs.push(value);
    }
  }

  const universalPairs = Math.floor(universalCount / 2);
  for (let i = 0; i < universalPairs; i++) {
    pairs.push(14);
  }

  return Math.max(...pairs);
}

/**
 * 判断是否是飞机
 */
function isPlane(values: number[], universalCount: number): boolean {
  const groups = new Map<number, number>();
  for (const v of values) {
    groups.set(v, (groups.get(v) || 0) + 1);
  }

  // 统计三张及以上的组
  let tripleCount = 0;
  for (const count of groups.values()) {
    if (count >= 3) tripleCount++;
  }

  // 癞子可以凑成三张
  const universalTriples = Math.floor(universalCount / 3);
  tripleCount += universalTriples;

  if (tripleCount < 2) return false;

  // 检查三张是否连续
  const tripleValues: number[] = [];
  for (const [value, count] of groups) {
    if (count >= 3) {
      tripleValues.push(value);
    }
  }
  for (let i = 0; i < universalTriples; i++) {
    tripleValues.push(14);
  }

  const sortedTriples = [...new Set(tripleValues)].sort((a, b) => a - b);

  for (let i = 1; i < sortedTriples.length; i++) {
    if (sortedTriples[i] - sortedTriples[i - 1] !== 1) {
      return false;
    }
  }

  return true;
}

function getPlaneMainValue(cards: string[], values: number[], universalCount: number): number {
  const groups = groupByValue(cards);
  const tripleValues: number[] = [];

  for (const [value, group] of groups) {
    if (group.length >= 3) {
      tripleValues.push(value);
    }
  }

  const universalTriples = Math.floor(universalCount / 3);
  for (let i = 0; i < universalTriples; i++) {
    tripleValues.push(14);
  }

  return Math.max(...tripleValues);
}

function canFormPlaneSingle(cards: string[], values: number[], universalCount: number): boolean {
  return false;
}

function canFormPlanePair(cards: string[], values: number[], universalCount: number): boolean {
  return false;
}

function getPlaneMainValueFromPlaneSingle(cards: string[], values: number[], universalCount: number): number {
  return 14;
}

function getPlaneMainValueFromPlanePair(cards: string[], values: number[], universalCount: number): number {
  return 14;
}

function canFormQuadPlaneSingle(cards: string[], values: number[], universalCount: number): boolean {
  return false;
}

function canFormQuadPlanePair(cards: string[], values: number[], universalCount: number): boolean {
  return false;
}

function getQuadMainValue(cards: string[], values: number[], universalCount: number): number {
  const groups = groupByValue(cards);
  for (const [value, group] of groups) {
    if (group.length >= 4) return value;
  }
  return 14;
}

/**
 * 获取牌值显示文本
 */
function getValueDisplay(value: number): string {
  if (value === 16) return '小王';
  if (value === 17) return '大王';
  const map: Record<number, string> = {
    3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A',
  };
  return map[value] || String(value);
}

// ==================== 能否打过判断 ====================

/**
 * 判断能否打过上家出的牌
 */
export function canBeat(lastPlayed: string[], currentPlayed: string[]): boolean {
  if (!lastPlayed || lastPlayed.length === 0) return true;

  const lastResult = analyzePattern(lastPlayed);
  const currentResult = analyzePattern(currentPlayed);

  if (!lastResult || !currentResult) return false;

  // 王炸最大
  if (currentResult.pattern === CardPattern.JOKER_BOMB) return true;
  if (lastResult.pattern === CardPattern.JOKER_BOMB) return false;

  // 炸弹特殊规则
  if (currentResult.pattern === CardPattern.BOMB) {
    if (lastResult.pattern === CardPattern.BOMB) {
      return currentResult.mainValue > lastResult.mainValue;
    }
    return true; // 炸弹可以打任何非王炸的牌
  }
  if (lastResult.pattern === CardPattern.BOMB) return false;

  // 牌数必须相同
  if (currentResult.count !== lastResult.count) return false;

  // 牌型必须相同
  if (currentResult.pattern !== lastResult.pattern) return false;

  // 比较主值
  return currentResult.mainValue > lastResult.mainValue;
}

// ==================== 查找辅助 ====================

/**
 * 把 array 中的元素去重（按 key 选择器），保留首次出现的元素
 */
function dedupeBy<T>(arr: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      result.push(item);
    }
  }
  return result;
}

/**
 * 在手牌中查找某个值对应的牌的实际下标。
 * 注意：癞子（isUniversal=true）的卡牌 id 都是同一个万用id，会导致 indexOf 始终返回同一个下标，
 * 需要按 instance 区分。
 */
function indicesOfValues(
  cards: string[],
  value: number,
  usedSet: Set<number>,
  take: number,
): number[] {
  const picked: number[] = [];
  for (let i = 0; i < cards.length && picked.length < take; i++) {
    if (usedSet.has(i)) continue;
    if (getCardValue(cards[i]) === value) {
      picked.push(i);
      usedSet.add(i);
    }
  }
  return picked;
}

function takeUniversals(cards: string[], usedSet: Set<number>, take: number): number[] {
  const picked: number[] = [];
  for (let i = 0; i < cards.length && picked.length < take; i++) {
    if (usedSet.has(i)) continue;
    if (isUniversal(cards[i])) {
      picked.push(i);
      usedSet.add(i);
    }
  }
  return picked;
}

/**
 * 把若干 indices 转换为输出 combo 的 cards/indices 字段
 */
function toCombo(
  cards: string[],
  indices: number[],
  pattern: CardPattern,
  mainValue: number,
  description: string,
): PlayableCombination {
  return {
    pattern,
    mainValue,
    count: indices.length,
    cards: indices.map(i => cards[i]),
    cardIndices: indices,
    description,
  };
}

// ==================== 各牌型组合查找 ====================

/**
 * 查找所有单张
 */
function findSingles(cards: string[]): PlayableCombination[] {
  const groups = groupByValue(cards);
  const result: PlayableCombination[] = [];
  for (const [value, group] of groups) {
    // 每张牌都作为单张候选
    for (const card of group) {
      const idx = cards.indexOf(card);
      if (idx >= 0) {
        result.push(toCombo(cards, [idx], CardPattern.SINGLE, value, getValueDisplay(value)));
      }
    }
  }
  return result;
}

/**
 * 获取手牌中所有可能的合法组合
 * 覆盖全部牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、飞机带单/带对、
 * 炸弹、王炸、四带两单/两对。
 *
 * @param handCards 手牌ID列表
 * @param includeBasicPatterns 是否包含"基本牌型"（单张/对子/三张）
 *      - 首出牌且希望提示合理出牌策略时可传 false（首出一般不会出三张）
 *      - 压牌场景必须传 true，否则上家出"单/对/三"时根本生成不出对应组合
 */
export function getAllCombinations(handCards: string[], includeBasicPatterns: boolean = true): PlayableCombination[] {
  const combinations: PlayableCombination[] = [];

  // 1) 基本牌型（首出/压牌场景）
  //    注意：首出牌时只屏蔽"三张"，单张和对子保留为提示选项
  if (includeBasicPatterns) {
    combinations.push(...findSingles(handCards));
    combinations.push(...findPairs(handCards));
    combinations.push(...findTriples(handCards));
  } else {
    // 首出牌：保留单张和对子，但屏蔽三张
    combinations.push(...findSingles(handCards));
    combinations.push(...findPairs(handCards));
  }

  // 2) 带牌牌型：三带一、三带二
  combinations.push(...findTripleSingles(handCards));
  combinations.push(...findTriplePairs(handCards));

  // 3) 顺子 / 连对 / 飞机（含带牌）
  combinations.push(...findStraightCombos(handCards));
  combinations.push(...findDoubleStraightCombos(handCards));
  combinations.push(...findPlaneCombos(handCards));
  combinations.push(...findPlaneSingles(handCards));
  combinations.push(...findPlanePairs(handCards));

  // 4) 四带二（单/对）
  combinations.push(...findQuadSingles(handCards));
  combinations.push(...findQuadPairs(handCards));

  // 5) 炸弹 / 王炸
  combinations.push(...findBombs(handCards));
  const jokerBomb = findJokerBomb(handCards);
  if (jokerBomb) {
    combinations.push({
      pattern: CardPattern.JOKER_BOMB,
      mainValue: 100,
      count: 2,
      cards: jokerBomb.cards,
      cardIndices: jokerBomb.indices,
      description: '王炸',
    });
  }

  // 去重：相同 (pattern, mainValue, count, sortedIndices) 仅保留一份
  return dedupeCombinations(combinations);
}

/**
 * 组合去重：相同牌型/主值/张数+相同牌的视为同一个组合
 */
function dedupeCombinations(combinations: PlayableCombination[]): PlayableCombination[] {
  const seen = new Set<string>();
  const result: PlayableCombination[] = [];
  for (const combo of combinations) {
    const key = [
      combo.pattern,
      combo.mainValue,
      combo.count,
      [...combo.cardIndices].sort((a, b) => a - b).join(','),
    ].join('|');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(combo);
    }
  }
  return result;
}

/**
 * 查找所有对子（含癞子）
 */
function findPairs(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);

  // 真实对子
  for (const [value, group] of groups) {
    if (value === 16 || value === 17) continue; // 大小王不能构成对子
    if (group.length >= 2) {
      // 同一 value 可能多张，按索引精确取前两张
      const allIndices: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (getCardValue(cards[i]) === value) allIndices.push(i);
      }
      // 输出所有可能的对子（C(n,2)）
      for (let i = 0; i + 1 < allIndices.length; i++) {
        result.push(toCombo(cards, [allIndices[i], allIndices[i + 1]], CardPattern.PAIR, value, `对${getValueDisplay(value)}`));
      }
    }
  }

  // 癞子参与的对子
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }
  // 2个癞子 -> 1个对子（癞子当A 处理）
  if (universalIndices.length >= 2) {
    result.push(toCombo(cards, [universalIndices[0], universalIndices[1]], CardPattern.PAIR, 14, `对A(癞)`));
  }
  // 1个癞子 + 1张普通牌
  if (universalIndices.length >= 1) {
    for (let i = 0; i < cards.length; i++) {
      if (isUniversal(cards[i])) continue;
      const v = getCardValue(cards[i]);
      if (v === 16 || v === 17) continue; // 大小王 + 癞子不算对子
      result.push(toCombo(cards, [universalIndices[0], i], CardPattern.PAIR, v, `对${getValueDisplay(v)}(癞)`));
    }
  }

  return result;
}

/**
 * 查找所有三张（含癞子）
 */
function findTriples(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);

  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  for (const [value, group] of groups) {
    if (value === 16 || value === 17) continue;
    const allIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (getCardValue(cards[i]) === value) allIndices.push(i);
    }
    if (allIndices.length >= 3) {
      // 取前三张作为代表（每个 value 通常 4 张）
      const taken = allIndices.slice(0, 3);
      result.push(toCombo(cards, taken, CardPattern.TRIPLE, value, `三张${getValueDisplay(value)}`));
    }
    if (allIndices.length >= 2 && universalIndices.length >= 1) {
      // 2张真实牌 + 1癞子
      result.push(toCombo(
        cards,
        [universalIndices[0], allIndices[0], allIndices[1]],
        CardPattern.TRIPLE,
        value,
        `三张${getValueDisplay(value)}(癞)`,
      ));
    }
  }

  // 全癞子三张
  if (universalIndices.length >= 3) {
    result.push(toCombo(cards, universalIndices.slice(0, 3), CardPattern.TRIPLE, 14, `三张A(癞)`));
  }
  if (universalIndices.length >= 2) {
    // 2癞子 + 任意1张
    for (let i = 0; i < cards.length; i++) {
      if (isUniversal(cards[i])) continue;
      const v = getCardValue(cards[i]);
      if (v === 16 || v === 17) continue;
      result.push(toCombo(
        cards,
        [universalIndices[0], universalIndices[1], i],
        CardPattern.TRIPLE,
        v,
        `三张${getValueDisplay(v)}(癞)`,
      ));
    }
  }

  return result;
}

/**
 * 查找三带一：三张 + 任意单张
 */
function findTripleSingles(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  for (const [value, group] of groups) {
    if (value === 16 || value === 17) continue;
    const allIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (getCardValue(cards[i]) === value) allIndices.push(i);
    }
    // case A：3张真实牌 + 1张其他单牌
    if (allIndices.length >= 3) {
      const tripleIdx = allIndices.slice(0, 3);
      const others: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (tripleIdx.includes(i)) continue;
        others.push(i);
      }
      if (others.length > 0) {
        result.push(toCombo(
          cards,
          [...tripleIdx, others[0]],
          CardPattern.TRIPLE_SINGLE,
          value,
          `三带一${getValueDisplay(value)}`,
        ));
      }
    }
    // case B：2张真实牌 + 1癞子(凑三张) + 1张其他单牌
    if (allIndices.length >= 2 && universalIndices.length >= 1) {
      const u = universalIndices[0];
      const others: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (i === u) continue;
        if (allIndices.slice(0, 2).includes(i)) continue;
        others.push(i);
      }
      if (others.length > 0) {
        result.push(toCombo(
          cards,
          [u, allIndices[0], allIndices[1], others[0]],
          CardPattern.TRIPLE_SINGLE,
          value,
          `三带一${getValueDisplay(value)}(癞)`,
        ));
      }
    }
    // case C：1张真实牌 + 2癞子(凑三张) + 1张其他单牌
    if (allIndices.length >= 1 && universalIndices.length >= 2) {
      const u1 = universalIndices[0];
      const u2 = universalIndices[1];
      const others: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (i === u1 || i === u2) continue;
        if (i === allIndices[0]) continue;
        others.push(i);
      }
      if (others.length > 0) {
        result.push(toCombo(
          cards,
          [u1, u2, allIndices[0], others[0]],
          CardPattern.TRIPLE_SINGLE,
          value,
          `三带一${getValueDisplay(value)}(癞)`,
        ));
      }
    }
  }

  return result;
}

/**
 * 查找三带二：三张 + 对子
 */
function findTriplePairs(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  // 列出所有可能的对子（牌值, 索引列表）
  const pairCandidates: Array<{ value: number; indices: number[] }> = [];
  for (const [value, group] of groups) {
    if (value === 16 || value === 17) continue;
    const allIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (getCardValue(cards[i]) === value) allIndices.push(i);
    }
    if (allIndices.length >= 2) {
      pairCandidates.push({ value, indices: allIndices.slice(0, 2) });
    }
  }
  // 2癞子 -> 对子
  if (universalIndices.length >= 2) {
    pairCandidates.push({ value: 14, indices: [universalIndices[0], universalIndices[1]] });
  }
  // 1癞子 + 普通牌 -> 对子
  if (universalIndices.length >= 1) {
    for (let i = 0; i < cards.length; i++) {
      if (isUniversal(cards[i])) continue;
      const v = getCardValue(cards[i]);
      if (v === 16 || v === 17) continue;
      pairCandidates.push({ value: v, indices: [universalIndices[0], i] });
    }
  }

  for (const [value, group] of groups) {
    if (value === 16 || value === 17) continue;
    const allTripleIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (getCardValue(cards[i]) === value) allTripleIndices.push(i);
    }
    // 三张真实
    if (allTripleIndices.length >= 3) {
      const tripleIdx = allTripleIndices.slice(0, 3);
      for (const pair of pairCandidates) {
        if (pair.indices.some(idx => tripleIdx.includes(idx))) continue;
        if (pair.value === value) continue;
        result.push(toCombo(
          cards,
          [...tripleIdx, ...pair.indices],
          CardPattern.TRIPLE_PAIR,
          value,
          `三带二${getValueDisplay(value)}`,
        ));
        break; // 一个三张只取一个代表对子，避免组合臃肿
      }
    }
    // 2张真实 + 1癞子(凑三张)
    if (allTripleIndices.length >= 2 && universalIndices.length >= 1) {
      const tripleIdx = [universalIndices[0], allTripleIndices[0], allTripleIndices[1]];
      for (const pair of pairCandidates) {
        if (pair.indices.some(idx => tripleIdx.includes(idx))) continue;
        if (pair.value === value) continue;
        result.push(toCombo(
          cards,
          [...tripleIdx, ...pair.indices],
          CardPattern.TRIPLE_PAIR,
          value,
          `三带二${getValueDisplay(value)}(癞)`,
        ));
        break;
      }
    }
    // 1张真实 + 2癞子(凑三张)
    if (allTripleIndices.length >= 1 && universalIndices.length >= 2) {
      const tripleIdx = [universalIndices[0], universalIndices[1], allTripleIndices[0]];
      for (const pair of pairCandidates) {
        if (pair.indices.some(idx => tripleIdx.includes(idx))) continue;
        if (pair.value === value) continue;
        result.push(toCombo(
          cards,
          [...tripleIdx, ...pair.indices],
          CardPattern.TRIPLE_PAIR,
          value,
          `三带二${getValueDisplay(value)}(癞)`,
        ));
        break;
      }
    }
  }

  return result;
}

/**
 * 查找所有顺子（从3到A的连续n+张单牌）
 */
function findStraightCombos(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  // 收集可作为顺子点的 value（不含 14/A 单独存在 + 不含大小王）
  const candidateValues: number[] = [];
  for (const [value, group] of groups) {
    if (value >= 14) continue;
    if (value === 16 || value === 17) continue;
    if (group.length === 0) continue;
    candidateValues.push(value);
  }
  candidateValues.sort((a, b) => a - b);

  // 对每个起点尝试构造"最长连续段"，并在所有连续长度 ≥ 5 上都生成组合
  for (const startValue of candidateValues) {
    if (startValue > 10) continue; // 顺子不能跨过 A(14)

    let sequence: number[] = [];
    let universalsUsed = 0;
    for (let v = startValue; v <= 14 && sequence.length < 12; v++) {
      if (v === 14) {
        // 只有从3开始的顺子能包含A
        if (startValue === 3 && (groups.has(v) || universalsUsed < universalIndices.length)) {
          sequence.push(v);
        }
        break;
      }
      if (groups.has(v)) {
        sequence.push(v);
      } else if (universalsUsed < universalIndices.length) {
        sequence.push(v);
        universalsUsed++;
      } else {
        break;
      }
    }

    // 生成所有长度 ≥ 5 的子序列
    for (let len = 5; len <= sequence.length; len++) {
      const slice = sequence.slice(0, len);
      const usedIdx = new Set<number>();
      const indices: number[] = [];
      let ok = true;
      let extraUniversals = 0;
      for (const v of slice) {
        // 找一张未用的 v
        let picked = -1;
        for (let i = 0; i < cards.length; i++) {
          if (usedIdx.has(i)) continue;
          if (getCardValue(cards[i]) === v && !isUniversal(cards[i])) {
            picked = i;
            break;
          }
        }
        if (picked >= 0) {
          usedIdx.add(picked);
          indices.push(picked);
        } else {
          // 用癞子补
          if (extraUniversals < universalsUsed) {
            let uIdx = -1;
            for (let i = 0; i < cards.length; i++) {
              if (usedIdx.has(i)) continue;
              if (isUniversal(cards[i])) {
                uIdx = i;
                break;
              }
            }
            if (uIdx >= 0) {
              usedIdx.add(uIdx);
              indices.push(uIdx);
              extraUniversals++;
            } else {
              ok = false;
              break;
            }
          } else {
            ok = false;
            break;
          }
        }
      }
      if (ok && indices.length === len) {
        result.push(toCombo(
          cards,
          indices,
          CardPattern.STRAIGHT,
          Math.max(...slice),
          `顺子${len}张`,
        ));
      }
    }
  }

  return result;
}

/**
 * 查找所有连对（3对及以上连续对子）
 */
function findDoubleStraightCombos(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  // 收集"有对子"的牌值（含癞子凑成的对）
  const pairValues = new Set<number>();
  for (const [value, group] of groups) {
    if (value >= 14) continue;
    if (value === 16 || value === 17) continue;
    if (group.length >= 2) pairValues.add(value);
  }

  // 对每个起点尝试构造最长连续对段（≥3对）
  const sortedStarts = [...pairValues].sort((a, b) => a - b);
  for (const startValue of sortedStarts) {
    if (startValue > 11) continue; // A以上的不能作为连对起点
    let seq: number[] = [];
    let universalsUsed = 0;
    for (let v = startValue; v <= 14; v++) {
      if (v === 14) {
        if (startValue === 3 && (pairValues.has(v) || universalsUsed < universalIndices.length)) {
          seq.push(v);
        }
        break;
      }
      if (pairValues.has(v)) {
        seq.push(v);
      } else if (universalsUsed < universalIndices.length) {
        // 用癞子补对
        seq.push(v);
        universalsUsed++;
      } else {
        break;
      }
    }

    // 生成所有长度 ≥ 3 对的连对（每段 length * 2 张）
    for (let len = 3; len <= seq.length; len++) {
      const slice = seq.slice(0, len);
      const usedIdx = new Set<number>();
      const indices: number[] = [];
      let ok = true;
      let usedU = 0;
      for (const v of slice) {
        // 优先用真实牌对
        const matches: number[] = [];
        for (let i = 0; i < cards.length; i++) {
          if (usedIdx.has(i)) continue;
          if (getCardValue(cards[i]) === v && !isUniversal(cards[i])) matches.push(i);
        }
        if (matches.length >= 2) {
          usedIdx.add(matches[0]); usedIdx.add(matches[1]);
          indices.push(matches[0], matches[1]);
        } else if (matches.length === 1 && usedU < universalsUsed) {
          // 一张真实牌 + 1癞子 凑成对
          const u = universalIndices.find(idx => !usedIdx.has(idx));
          if (u === undefined) { ok = false; break; }
          usedIdx.add(matches[0]); usedIdx.add(u);
          indices.push(matches[0], u);
          usedU++;
        } else if (usedU < universalsUsed && universalsUsed >= 2) {
          // 两癞子
          const u1 = universalIndices.find(idx => !usedIdx.has(idx));
          const u2 = u1 === undefined ? undefined : universalIndices.find(idx => !usedIdx.has(idx) && idx !== u1);
          if (u1 === undefined || u2 === undefined) { ok = false; break; }
          usedIdx.add(u1); usedIdx.add(u2);
          indices.push(u1, u2);
          usedU += 2;
        } else {
          ok = false;
          break;
        }
      }
      if (ok && indices.length === len * 2) {
        result.push(toCombo(
          cards,
          indices,
          CardPattern.DOUBLE_STRAIGHT,
          Math.max(...slice),
          `${len}连对`,
        ));
      }
    }
  }

  return result;
}

/**
 * 找所有"飞机"主体（连续三张，至少 2 个）
 * 这里只生成纯飞机主体（不带牌），长度 = n*3
 */
function findPlaneCombos(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  // 拥有 ≥ 3 张的真实牌值
  const tripleRealValues = new Set<number>();
  for (const [value, group] of groups) {
    if (value >= 14) continue;
    if (value === 16 || value === 17) continue;
    if (group.length >= 3) tripleRealValues.add(value);
  }
  // 癞子能凑 1个额外 的飞机组
  const usableUniversals = universalIndices.length;
  const fakeTripleCount = usableUniversals; // 每个癞子可以独立补一个 3 张

  const sortedStarts = [...tripleRealValues].sort((a, b) => a - b);
  for (const startValue of sortedStarts) {
    if (startValue > 12) continue; // 飞机起始最大 12
    let seq: number[] = [];
    let uUsed = 0;
    for (let v = startValue; v <= 14; v++) {
      if (v === 14) {
        // 飞机主体不含 A（避免与飞机带牌混），只构造到 14 以下
        break;
      }
      if (tripleRealValues.has(v)) {
        seq.push(v);
      } else if (uUsed < usableUniversals) {
        seq.push(v);
        uUsed++;
      } else {
        break;
      }
    }
    // 飞机主体至少连续2个三张
    for (let len = 2; len <= seq.length; len++) {
      const slice = seq.slice(0, len);
      const usedIdx = new Set<number>();
      const indices: number[] = [];
      let ok = true;
      for (const v of slice) {
        const matches: number[] = [];
        for (let i = 0; i < cards.length; i++) {
          if (usedIdx.has(i)) continue;
          if (getCardValue(cards[i]) === v && !isUniversal(cards[i])) matches.push(i);
        }
        if (matches.length >= 3) {
          for (let k = 0; k < 3; k++) { usedIdx.add(matches[k]); indices.push(matches[k]); }
        } else if (matches.length === 2 && usableUniversals > 0) {
          const u = universalIndices.find(idx => !usedIdx.has(idx));
          if (u === undefined) { ok = false; break; }
          for (const m of matches) { usedIdx.add(m); indices.push(m); }
          usedIdx.add(u); indices.push(u);
        } else if (matches.length === 1 && usableUniversals >= 2) {
          const u1 = universalIndices.find(idx => !usedIdx.has(idx));
          const u2 = u1 === undefined ? undefined : universalIndices.find(idx => !usedIdx.has(idx) && idx !== u1);
          if (u1 === undefined || u2 === undefined) { ok = false; break; }
          usedIdx.add(matches[0]); indices.push(matches[0]);
          usedIdx.add(u1); indices.push(u1);
          usedIdx.add(u2); indices.push(u2);
        } else {
          ok = false;
          break;
        }
      }
      if (ok && indices.length === len * 3) {
        result.push(toCombo(
          cards,
          indices,
          CardPattern.PLANE,
          Math.max(...slice),
          `飞机${len}组`,
        ));
      }
    }
  }

  return result;
}

/**
 * 飞机带单：n 个三张 + n 个单牌（合计 4n 张）
 * 简化：每个飞机主体配 n 个"非三张同点"的单牌
 */
function findPlaneSingles(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  const tripleRealValues = new Set<number>();
  for (const [value, group] of groups) {
    if (value >= 14) continue;
    if (value === 16 || value === 17) continue;
    if (group.length >= 3) tripleRealValues.add(value);
  }

  const sortedStarts = [...tripleRealValues].sort((a, b) => a - b);
  for (const startValue of sortedStarts) {
    if (startValue > 12) continue;
    let seq: number[] = [];
    let uUsed = 0;
    for (let v = startValue; v <= 14; v++) {
      if (v === 14) break;
      if (tripleRealValues.has(v)) seq.push(v);
      else if (uUsed < universalIndices.length) { seq.push(v); uUsed++; }
      else break;
    }
    for (let len = 2; len <= seq.length; len++) {
      const slice = seq.slice(0, len);
      const usedIdx = new Set<number>();
      const planeIndices: number[] = [];
      let ok = true;

      // 构造飞机主体
      for (const v of slice) {
        const matches: number[] = [];
        for (let i = 0; i < cards.length; i++) {
          if (usedIdx.has(i)) continue;
          if (getCardValue(cards[i]) === v && !isUniversal(cards[i])) matches.push(i);
        }
        if (matches.length >= 3) {
          for (let k = 0; k < 3; k++) { usedIdx.add(matches[k]); planeIndices.push(matches[k]); }
        } else if (matches.length === 2 && universalIndices.length > 0) {
          const u = universalIndices.find(idx => !usedIdx.has(idx));
          if (u === undefined) { ok = false; break; }
          for (const m of matches) { usedIdx.add(m); planeIndices.push(m); }
          usedIdx.add(u); planeIndices.push(u);
        } else if (matches.length === 1 && universalIndices.length >= 2) {
          const u1 = universalIndices.find(idx => !usedIdx.has(idx));
          const u2 = u1 === undefined ? undefined : universalIndices.find(idx => !usedIdx.has(idx) && idx !== u1);
          if (u1 === undefined || u2 === undefined) { ok = false; break; }
          usedIdx.add(matches[0]); planeIndices.push(matches[0]);
          usedIdx.add(u1); planeIndices.push(u1);
          usedIdx.add(u2); planeIndices.push(u2);
        } else { ok = false; break; }
      }
      if (!ok) continue;

      // 收集"非飞机点组"的可用单牌
      const singles: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (usedIdx.has(i)) continue;
        const v = getCardValue(cards[i]);
        if (!slice.includes(v)) singles.push(i);
      }
      if (singles.length < len) continue;

      // 取前 len 个单牌
      const wing = singles.slice(0, len);
      result.push(toCombo(
        cards,
        [...planeIndices, ...wing],
        CardPattern.PLANE_SINGLE,
        Math.max(...slice),
        `飞机带单(${len})`,
      ));
    }
  }
  return result;
}

/**
 * 飞机带对：n 个三张 + n 个对子（合计 5n 张）
 */
function findPlanePairs(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  const tripleRealValues = new Set<number>();
  for (const [value, group] of groups) {
    if (value >= 14) continue;
    if (value === 16 || value === 17) continue;
    if (group.length >= 3) tripleRealValues.add(value);
  }

  const sortedStarts = [...tripleRealValues].sort((a, b) => a - b);
  for (const startValue of sortedStarts) {
    if (startValue > 12) continue;
    let seq: number[] = [];
    let uUsed = 0;
    for (let v = startValue; v <= 14; v++) {
      if (v === 14) break;
      if (tripleRealValues.has(v)) seq.push(v);
      else if (uUsed < universalIndices.length) { seq.push(v); uUsed++; }
      else break;
    }
    for (let len = 2; len <= seq.length; len++) {
      const slice = seq.slice(0, len);
      const usedIdx = new Set<number>();
      const planeIndices: number[] = [];
      let ok = true;

      for (const v of slice) {
        const matches: number[] = [];
        for (let i = 0; i < cards.length; i++) {
          if (usedIdx.has(i)) continue;
          if (getCardValue(cards[i]) === v && !isUniversal(cards[i])) matches.push(i);
        }
        if (matches.length >= 3) {
          for (let k = 0; k < 3; k++) { usedIdx.add(matches[k]); planeIndices.push(matches[k]); }
        } else if (matches.length === 2 && universalIndices.length > 0) {
          const u = universalIndices.find(idx => !usedIdx.has(idx));
          if (u === undefined) { ok = false; break; }
          for (const m of matches) { usedIdx.add(m); planeIndices.push(m); }
          usedIdx.add(u); planeIndices.push(u);
        } else if (matches.length === 1 && universalIndices.length >= 2) {
          const u1 = universalIndices.find(idx => !usedIdx.has(idx));
          const u2 = u1 === undefined ? undefined : universalIndices.find(idx => !usedIdx.has(idx) && idx !== u1);
          if (u1 === undefined || u2 === undefined) { ok = false; break; }
          usedIdx.add(matches[0]); planeIndices.push(matches[0]);
          usedIdx.add(u1); planeIndices.push(u1);
          usedIdx.add(u2); planeIndices.push(u2);
        } else { ok = false; break; }
      }
      if (!ok) continue;

      // 找 len 个对子（不能与飞机点组位重复）
      const pairWings: number[][] = [];
      const usedForPair = new Set<number>(usedIdx);
      // 真实牌的对子
      for (const [value] of groups) {
        if (slice.includes(value)) continue;
        if (value === 16 || value === 17) continue;
        const matches: number[] = [];
        for (let i = 0; i < cards.length; i++) {
          if (usedForPair.has(i)) continue;
          if (getCardValue(cards[i]) === value && !isUniversal(cards[i])) matches.push(i);
        }
        if (matches.length >= 2) {
          pairWings.push([matches[0], matches[1]]);
          usedForPair.add(matches[0]); usedForPair.add(matches[1]);
        }
        if (pairWings.length >= len) break;
      }
      // 用癞子补对
      while (pairWings.length < len) {
        const u1 = universalIndices.find(idx => !usedForPair.has(idx));
        const u2 = u1 === undefined ? undefined : universalIndices.find(idx => !usedForPair.has(idx) && idx !== u1);
        if (u1 === undefined || u2 === undefined) break;
        pairWings.push([u1, u2]);
        usedForPair.add(u1); usedForPair.add(u2);
      }
      if (pairWings.length < len) continue;

      const flatWings = pairWings.slice(0, len).flat();
      result.push(toCombo(
        cards,
        [...planeIndices, ...flatWings],
        CardPattern.PLANE_PAIR,
        Math.max(...slice),
        `飞机带对(${len})`,
      ));
    }
  }
  return result;
}

/**
 * 四带两单：4张 + 2个单牌
 */
function findQuadSingles(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);

  for (const [value, group] of groups) {
    if (value === 16 || value === 17) continue;
    const allIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (getCardValue(cards[i]) === value) allIndices.push(i);
    }
    if (allIndices.length < 4) continue;
    const usedIdx = new Set<number>(allIndices.slice(0, 4));
    const others: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (!usedIdx.has(i)) others.push(i);
    }
    if (others.length < 2) continue;
    result.push(toCombo(
      cards,
      [...usedIdx, others[0], others[1]],
      CardPattern.QUAD_PLANE_SINGLE,
      value,
      `四带两单${getValueDisplay(value)}`,
    ));
  }

  return result;
}

/**
 * 四带两对：4张 + 2个对子
 */
function findQuadPairs(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  for (const [value, group] of groups) {
    if (value === 16 || value === 17) continue;
    const allIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (getCardValue(cards[i]) === value) allIndices.push(i);
    }
    if (allIndices.length < 4) continue;
    const usedIdx = new Set<number>(allIndices.slice(0, 4));
    // 找 2 个对子
    const pairList: number[][] = [];
    for (const [pv] of groups) {
      if (pv === value) continue;
      if (pv === 16 || pv === 17) continue;
      const matches: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (usedIdx.has(i)) continue;
        if (getCardValue(cards[i]) === pv && !isUniversal(cards[i])) matches.push(i);
      }
      if (matches.length >= 2) {
        pairList.push([matches[0], matches[1]]);
        usedIdx.add(matches[0]); usedIdx.add(matches[1]);
      }
      if (pairList.length >= 2) break;
    }
    while (pairList.length < 2 && universalIndices.length >= 2) {
      const u1 = universalIndices.find(idx => !usedIdx.has(idx));
      const u2 = u1 === undefined ? undefined : universalIndices.find(idx => !usedIdx.has(idx) && idx !== u1);
      if (u1 === undefined || u2 === undefined) break;
      pairList.push([u1, u2]);
      usedIdx.add(u1); usedIdx.add(u2);
    }
    if (pairList.length < 2) continue;

    const flat = pairList.flat();
    result.push(toCombo(
      cards,
      [...allIndices.slice(0, 4), ...flat],
      CardPattern.QUAD_PLANE_PAIR,
      value,
      `四带两对${getValueDisplay(value)}`,
    ));
  }

  return result;
}

/**
 * 查找所有炸弹（4张相同 + 癞子炸弹）
 */
function findBombs(cards: string[]): PlayableCombination[] {
  const result: PlayableCombination[] = [];
  const groups = groupByValue(cards);
  const universalIndices: number[] = [];
  for (let i = 0; i < cards.length; i++) {
    if (isUniversal(cards[i])) universalIndices.push(i);
  }

  // 真实炸弹
  for (const [value, group] of groups) {
    if (value === 16 || value === 17) continue;
    if (group.length >= 4) {
      const allIndices: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (getCardValue(cards[i]) === value) allIndices.push(i);
      }
      result.push(toCombo(cards, allIndices.slice(0, 4), CardPattern.BOMB, value, `炸弹${getValueDisplay(value)}`));
    }
  }

  // 癞子凑炸弹：4癞子 / 3癞子+1 / 2癞子+2同点 / 1癞子+3同点
  if (universalIndices.length >= 4) {
    result.push(toCombo(cards, universalIndices.slice(0, 4), CardPattern.BOMB, 14, '炸弹A(癞)'));
  }
  if (universalIndices.length >= 3) {
    const others: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (!isUniversal(cards[i])) others.push(i);
    }
    for (const o of others) {
      const v = getCardValue(cards[o]);
      const idxs = [universalIndices[0], universalIndices[1], universalIndices[2], o];
      result.push(toCombo(cards, idxs, CardPattern.BOMB, v, `炸弹${getValueDisplay(v)}(癞)`));
    }
  }
  if (universalIndices.length >= 2) {
    for (const [value] of groups) {
      if (value === 16 || value === 17) continue;
      const matches: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (getCardValue(cards[i]) === value && !isUniversal(cards[i])) matches.push(i);
      }
      if (matches.length >= 2) {
        const idxs = [universalIndices[0], universalIndices[1], matches[0], matches[1]];
        result.push(toCombo(cards, idxs, CardPattern.BOMB, value, `炸弹${getValueDisplay(value)}(癞)`));
      }
    }
  }
  if (universalIndices.length >= 1) {
    for (const [value] of groups) {
      if (value === 16 || value === 17) continue;
      const matches: number[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (getCardValue(cards[i]) === value && !isUniversal(cards[i])) matches.push(i);
      }
      if (matches.length >= 3) {
        const idxs = [universalIndices[0], matches[0], matches[1], matches[2]];
        result.push(toCombo(cards, idxs, CardPattern.BOMB, value, `炸弹${getValueDisplay(value)}(癞)`));
      }
    }
  }

  return result;
}

/**
 * 查找王炸（大小王各一）
 */
function findJokerBomb(cards: string[]): { cards: string[]; indices: number[] } | null {
  let smallIdx = -1;
  let bigIdx = -1;
  for (let i = 0; i < cards.length; i++) {
    const v = getCardValue(cards[i]);
    if (v === 16 && smallIdx === -1) smallIdx = i;
    else if (v === 17 && bigIdx === -1) bigIdx = i;
  }
  if (smallIdx === -1 || bigIdx === -1) return null;
  return {
    cards: [cards[smallIdx], cards[bigIdx]],
    indices: [smallIdx, bigIdx],
  };
}

// ==================== 获取可出的牌组合 ====================

/**
 * 获取可以打过上家的所有组合
 * @param handCards 手牌
 * @param lastPlayed 上家出的牌
 * @param isFirstPlay 是否是首出牌
 * @param includeBasicPatterns 首出牌时是否包含基本牌型（单张/对子/三张）
 *      - 首出牌时为 false：仅生成单张+对子，不生成三张（首出一般不会单出三张）
 *      - 压牌时为 true：必须生成所有牌型，否则上家出"单/对/三"时找不到对应组合
 */
export function getPlayableCombinations(
  handCards: string[],
  lastPlayed: string[] | null,
  isFirstPlay: boolean,
  includeBasicPatterns: boolean = true
): PlayableCombination[] {
  // 首出牌：返回所有可组成的组合（按 includeBasicPatterns 控制是否包含单/对/三）
  if (!lastPlayed || lastPlayed.length === 0 || isFirstPlay) {
    return getAllCombinations(handCards, includeBasicPatterns);
  }

  const lastResult = analyzePattern(lastPlayed);
  if (!lastResult) return [];

  // 压牌场景：必须生成所有牌型（含单/对/三），否则上家出"单/对/三"时返回空
  const allCombinations = getAllCombinations(handCards, true);

  return allCombinations.filter(combo => {
    // 王炸可以打任何非王炸的牌
    if (combo.pattern === CardPattern.JOKER_BOMB) {
      return lastResult.pattern !== CardPattern.JOKER_BOMB;
    }
    if (lastResult.pattern === CardPattern.JOKER_BOMB) {
      // 上家是王炸，只有更大的炸弹（不存在）/王炸同点打不赢
      return false;
    }

    // 炸弹可以打任何非王炸的牌（前提：前揭：炸弹比上家炸弹大）
    if (combo.pattern === CardPattern.BOMB) {
      if (lastResult.pattern === CardPattern.BOMB) {
        return combo.mainValue > lastResult.mainValue;
      }
      return true; // 炸弹可炸任何非王炸
    }
    if (lastResult.pattern === CardPattern.BOMB) {
      return false; // 非炸弹打不过炸弹
    }

    // 同牌型要 count 与 pattern 一致（不同牌型不能互打）
    if (combo.count !== lastResult.count) return false;
    if (combo.pattern !== lastResult.pattern) return false;

    // 主值必须更大
    return combo.mainValue > lastResult.mainValue;
  });
}

// ==================== 智能选牌 ====================

/**
 * 根据点击的牌获取应选中的组合索引
 * 规则：
 * 1. 没有任意选中时 → 点击触发辅助选中（顺子补全、炸弹等）
 * 2. 已有选中时 → 只是简单的选中/取消该牌，不触发辅助
 * 3. 已选中的牌点击 → 取消选中
 * @param clickedIndex 点击的牌在手牌中的索引
 * @param handCards 手牌
 * @param selectedIndices 当前已选中的索引
 * @returns 新的选中索引数组
 */
export function getAutoSelectForClick(
  clickedIndex: number,
  handCards: string[],
  selectedIndices: number[] = []
): number[] {
  const clickedCard = handCards[clickedIndex];
  const clickedValue = getCardValue(clickedCard);
  const groups = groupByValue(handCards);

  // 如果点击的牌已经在选中列表中，则取消选中（支持取消选中）
  if (selectedIndices.includes(clickedIndex)) {
    return selectedIndices.filter(i => i !== clickedIndex);
  }

  // 如果已经有选中的牌（不是首次点击），不做任何待助，只是简单的选中
  if (selectedIndices.length > 0) {
    return [...selectedIndices, clickedIndex];
  }

  // ========== 以下是首次点击（没有选中时）才执行的辅助选中逻辑 ==========

  // 1. 检查是否有炸弹组合（4张需要同时选中）
  const bombGroup = groups.get(clickedValue);
  if (bombGroup && bombGroup.length >= 4) {
    // 选中所有 4 张
    const indices = bombGroup.slice(0, 4).map(c => handCards.indexOf(c));
    return indices;
  }

  // 检查癞子炸弹（4个癞子）
  const universalCount = getUniversalCount(handCards);
  if (universalCount >= 4 && isUniversal(clickedCard)) {
    const universals = handCards.filter(c => isUniversal(c));
    return universals.slice(0, 4).map(c => handCards.indexOf(c));
  }

  // 2. 顺子逻辑：只有点击的那张牌本身是顺子的一部分（=5张连续）时
  //    才自动选中整个顺子
  const straights = findStraightCombos(handCards);
  for (const straight of straights) {
    if (straight.cards.includes(clickedCard) && straight.cards.length >= 5) {
      return straight.cardIndices;
    }
  }

  // 3. 默认：只选中点击的牌（首次点击，单张、对子、三张都不自动待助）
  return [clickedIndex];
}

// ==================== 推荐出牌 ====================

/**
 * 获取推荐出牌组合
 * @param handCards 手牌
 * @param lastPlayed 上家出的牌
 * @param isFirstPlay 是否是首出牌
 */
export function getRecommendedPlay(
  handCards: string[],
  lastPlayed: string[] | null,
  isFirstPlay: boolean
): PlayableCombination | null {
  // 排除基本牌型（单张、对子、三张）
  const combinations = getPlayableCombinations(handCards, lastPlayed, isFirstPlay, false);

  if (combinations.length === 0) return null;

  if (isFirstPlay || !lastPlayed) {
    // 首出牌：选牌数最多的
    const sorted = [...combinations].sort((a, b) => {
      // 炸弹优先级降序
      if (a.pattern === CardPattern.BOMB && b.pattern !== CardPattern.BOMB) return 1;
      if (b.pattern === CardPattern.BOMB && a.pattern !== CardPattern.BOMB) return -1;
      return b.count - a.count;
    });
    return sorted[0];
  } else {
    // 压牌：选最小能打过的
    const lastResult = analyzePattern(lastPlayed);
    if (!lastResult) return combinations[0];

    // 优先找同牌型的最小组合
    const samePattern = combinations.filter(c => c.pattern === lastResult.pattern);
    if (samePattern.length > 0) {
      const sorted = [...samePattern].sort((a, b) => a.mainValue - b.mainValue);
      return sorted[0];
    }

    // 找炸弹炸
    const bombs = combinations.filter(c =>
      c.pattern === CardPattern.BOMB || c.pattern === CardPattern.JOKER_BOMB
    );
    if (bombs.length > 0) {
      const sorted = [...bombs].sort((a, b) => a.mainValue - b.mainValue);
      return sorted[0];
    }

    return combinations[0];
  }
}

// ==================== 排序函数 ====================

/**
 * 根据策略排序可出的组合
 * @param combinations 可出的组合
 * @param isFirstPlay 是否是首出牌
 */
export function sortCombinations(
  combinations: PlayableCombination[],
  isFirstPlay: boolean
): PlayableCombination[] {
  if (isFirstPlay) {
    // 首出牌：牌数降序，炸弹放最后
    return [...combinations].sort((a, b) => {
      // 炸弹优先级降序
      if (a.pattern === CardPattern.BOMB && b.pattern !== CardPattern.BOMB) return 1;
      if (b.pattern === CardPattern.BOMB && a.pattern !== CardPattern.BOMB) return -1;
      if (a.pattern === CardPattern.JOKER_BOMB && b.pattern !== CardPattern.JOKER_BOMB) return 1;
      if (b.pattern === CardPattern.JOKER_BOMB && a.pattern !== CardPattern.JOKER_BOMB) return -1;
      return b.count - a.count;
    });
  } else {
    // 压牌：主值升序（最小能打过优先）
    return [...combinations].sort((a, b) => {
      // 王炸/炸弹优先级降序
      if (a.pattern === CardPattern.JOKER_BOMB && b.pattern !== CardPattern.JOKER_BOMB) return 1;
      if (b.pattern === CardPattern.JOKER_BOMB && a.pattern !== CardPattern.JOKER_BOMB) return -1;
      if (a.pattern === CardPattern.BOMB && b.pattern !== CardPattern.BOMB) return 1;
      if (b.pattern === CardPattern.BOMB && a.pattern !== CardPattern.BOMB) return -1;
      return a.mainValue - b.mainValue;
    });
  }
}