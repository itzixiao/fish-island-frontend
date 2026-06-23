import React, {useEffect, useState} from 'react';
import {Button, Card, Collapse, Form, List, message, Modal, Select, Space, Tooltip} from 'antd';
import "./index.css"
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  RocketOutlined
} from "@ant-design/icons";
import {aesDecrypt} from "@/utils/cryptoUtils";
import pinyin from 'pinyin';
import {
  getGuessCountUsingGet, getGuessRankingUsingGet, getHeroByIdUsingGet,
  getNewHeroUsingGet,
  getRandomHeroUsingGet,
  listSimpleHeroUsingGet, recordGuessSuccessUsingPost,
  getCurrentUserGuessDataUsingGet
} from "@/services/backend/heroController";

const GuessHero: React.FC = () => {
  const [form] = Form.useForm();
  const [heroList, setHeroList] = useState<API.SimpleHeroVO[]>([]);
  const [randomHero, setRandomHero] = useState<API.HeroVO | null>(null);
  const [guessList, setGuessList] = useState<API.HeroVO[]>([]);
  const [loading, setLoading] = useState(false);

  const [gameStarted, setGameStarted] = useState(false);
  // 在现有状态声明区域添加
  const [correctHeroId, setCorrectHeroId] = useState<number | null>(null);
  const [newHero, setNewHero] = useState<API.HeroVO | null>(null);
  const [loadingNewHero, setLoadingNewHero] = useState(false);
  const [isRuleModalVisible, setIsRuleModalVisible] = useState(false);
  // 新增状态
  const [guessCount, setGuessCount] = useState<number | null>(null);
  // 新增状态
  const [isRankingModalVisible, setIsRankingModalVisible] = useState(false);
  const [rankingList, setRankingList] = useState<API.HeroRankingVO[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  // 我的排行信息
  const [currentUserRanking, setCurrentUserRanking] = useState<API.HeroRankingVO | null>(null);
  const [loadingCurrentUserRanking, setLoadingCurrentUserRanking] = useState(false);

  // 加载英雄列表
  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await listSimpleHeroUsingGet();
        if (response.code === 0) {
          setHeroList(response.data || []);
        }
      } catch (error) {
        message.error('加载英雄列表失败');
      }
    };

    const fetchNewHero = async () => {
      setLoadingNewHero(true);
      try {
        const response = await getNewHeroUsingGet();
        if (response.code === 0) {
          setNewHero(response.data);
        } else {
          message.error('获取最新英雄失败');
        }
      } catch (error) {
        message.error('获取最新英雄失败');
      } finally {
        setLoadingNewHero(false);
      }
    };
    const fetchGuessCount = async () => {
      try {
        const response = await getGuessCountUsingGet();
        if (response.code === 0) {
          setGuessCount(response.data || 0);
        }
      } catch (error) {
        message.error('获取猜中次数失败');
      }
    };
    fetchGuessCount();
    fetchNewHero();
    fetchHeroes();
  }, []);

  // 开始游戏
  const handleStartGame = async () => {
    try {
      setLoading(true);
      const response = await getRandomHeroUsingGet();
      if (response.code === 0) {
        // aes解密
        aesDecrypt(response.data).then((hero) => {
          setRandomHero(hero);
          setCorrectHeroId(hero?.id || null); // 存储正确答案 ID
          setGuessList([]);
          setGameStarted(true);
        }).catch((error) => {
          console.error('解密失败:', error);
        });
      }
    } catch (error) {
      message.error('获取随机英雄失败');
    } finally {
      setLoading(false);
    }
  };

  // 结束游戏
  const handleEndGame = () => {
    if (randomHero) {
      setGuessList([randomHero, ...guessList]);
      resetGame();
    }
  };

  // 猜测英雄
  const handleGuess = async (values: { heroId: number }) => {
    try {
      // 新增重复猜测校验
      const isDuplicate = guessList.some(item => item.id === values.heroId);
      if (isDuplicate) {
        message.warning('请勿重复猜测同一英雄');
        return;
      }
      setLoading(true);
      const token = localStorage.getItem('tokenValue');
      if (values.heroId === randomHero?.id) {
        // 猜中逻辑
        setGuessList(prev => [randomHero, ...prev]);
        message.success('恭喜猜中！');
        resetGame();
        if (token) {
          try {
            await recordGuessSuccessUsingPost({heroId: values.heroId}); // 记录猜中
            const response = await getGuessCountUsingGet(); // 更新统计
            if (response.code === 0) {
              setGuessCount(response.data || 0);
            }
          } catch (error) {
            message.error('记录猜中次数失败');
          }
        }
      } else {
        // 未猜中逻辑
        const response = await getHeroByIdUsingGet({id: values.heroId});
        if (response.code === 0) {
          setGuessList(prev => [response.data, ...prev]); // 使用函数式更新
        }
      }
    } catch (error) {
      message.error('获取英雄详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置游戏状态
  const resetGame = () => {
    form.resetFields();
    setRandomHero(null);
    setGameStarted(false);
  };

  // 定义码值映射
  const typeMap = {
    1: '战士',
    2: '法师',
    3: '坦克',
    4: '刺客',
    5: '射手',
    6: '辅助',
  };

  // 判断两个字段是否相等
  const isSame = (a: any, b: any) => a === b;

  // 获取身高前三位并转为数字
  const getHeightNumber = (height: string) => {
    const match = height?.match(/^\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // 获取排行榜数据
  const fetchRanking = async () => {
    setLoadingRanking(true);
    setLoadingCurrentUserRanking(true);
    try {
      const response = await getGuessRankingUsingGet();
      if (response.code === 0) {
        setRankingList(response.data || []);
      }

      // 获取当前用户排名信息
      try {
        const currentUserResponse = await getCurrentUserGuessDataUsingGet();
        if (currentUserResponse.code === 0) {
          setCurrentUserRanking(currentUserResponse.data || null);
        }
      } catch (error) {
        // 用户未登录或无数据时清空状态
        setCurrentUserRanking(null);
      }
    } catch (error) {
      message.error('获取排行榜失败');
    } finally {
      setLoadingRanking(false);
      setLoadingCurrentUserRanking(false);
    }
  };

  // 排行榜模态框
  const rankingModal = (
    <Modal
      title={
        <div>
          <span>排行榜</span>
          <span style={{paddingLeft: 8}}>
        <Tooltip title="仅展示猜中次数最高的前10名玩家">
          <QuestionCircleOutlined style={{color: '#888', cursor: 'pointer'}}/>
        </Tooltip>
      </span>
        </div>
      }
      visible={isRankingModalVisible}
      onOk={() => setIsRankingModalVisible(false)}
      onCancel={() => setIsRankingModalVisible(false)}
      className="ranking-modal"
      width={600}
      footer={[
        <Button key="close" type="primary" onClick={(e) => {
          e.stopPropagation(); // 阻止事件冒泡
          setIsRankingModalVisible(false);
        }}>
          我知道了
        </Button>
      ]}
    >
      {loadingRanking ? (
        <div className="ranking-loading">
          <RocketOutlined spin style={{color: '#597ef7'}}/>
          <p>加载中...</p>
        </div>
      ) : rankingList.length > 0 ? (
        <div className="ranking-container">
          {/* 领奖台区块 */}
          <div className="podium-wrapper">
            <div className="podium-container">
              {/* 第二名 */}
              {rankingList[1] && (
                <div className="podium-item silver">
                  <div className="podium-avatar">
                    <img src={rankingList[1].userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'} />
                    <div className="podium-name">{rankingList[1].userName || '游客'}</div>
                  </div>
                  <div className="podium-body">
                    <span className="podium-medal">🥈</span>
                    <span className="podium-count">{rankingList[1].score}次</span>
                  </div>
                </div>
              )}

              {/* 第一名 */}
              {rankingList[0] && (
                <div className="podium-item gold">
                  <div className="podium-avatar">
                    <img src={rankingList[0].userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'} />
                    <div className="podium-name">{rankingList[0].userName || '游客'}</div>
                  </div>
                  <div className="podium-body">
                    <span className="podium-medal">🥇</span>
                    <span className="podium-count">{rankingList[0].score}次</span>
                  </div>
                </div>
              )}

              {/* 第三名 */}
              {rankingList[2] && (
                <div className="podium-item bronze">
                  <div className="podium-avatar">
                    <img src={rankingList[2].userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'} />
                    <div className="podium-name">{rankingList[2].userName || '游客'}</div>
                  </div>
                  <div className="podium-body">
                    <span className="podium-medal">🥉</span>
                    <span className="podium-count">{rankingList[2].score}次</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 排名列表（包含前3名之外的排行榜数据和当前用户信息） */}
          <List
            className="ranking-list"
            dataSource={[
              ...rankingList.slice(3),
              // 添加当前用户信息作为列表的最后一项（如果用户已登录）
              ...(currentUserRanking ? [{
                isCurrentUser: true,
                rank: currentUserRanking.rank,
                userAvatar: currentUserRanking.userAvatar,
                userName: currentUserRanking.userName,
                score: currentUserRanking.score
              }] : [])
            ]}
            renderItem={(item: any, index) => {
              // 处理当前用户信息的显示
              if (item.isCurrentUser) {
                return (
                  <List.Item
                    className={`ranking-list-item ${item.rank && item.rank <= 10 ? 'current-user-highlight' : ''}`}
                  >
                    <div className="list-item-content">
                      {loadingCurrentUserRanking ? (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <RocketOutlined spin style={{ color: '#597ef7' }} />
                          <span style={{ marginLeft: 8 }}>加载中...</span>
                        </div>
                      ) : item.rank && item.rank <= 10 ? (
                        <>
                          <span className="ranking-position">{"我"}</span>
                          <img
                            src={item.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'}
                            className="ranking-avatar"
                          />
                          <span className="ranking-name">{item.userName || '游客'}</span>
                          <span className="ranking-score">{item.score}次</span>
                        </>
                      ) : (
                        <>
                          <span className="ranking-position">-</span>
                          <img
                            src={item.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'}
                            className="ranking-avatar"
                          />
                          <span className="ranking-name">{item.userName || '游客'}</span>
                          <span className="ranking-score">未上榜</span>
                        </>
                      )}
                    </div>
                  </List.Item>
                );
              }

              // 处理普通排行榜项的显示
              return (
                <List.Item className="ranking-list-item">
                  <div className="list-item-content">
                    <span className="ranking-position">{index + 4}</span>
                    <img
                      src={item.userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=visitor'}
                      className="ranking-avatar"
                    />
                    <span className="ranking-name">{item.userName || '游客'}</span>
                    <span className="ranking-score">{item.score}次</span>
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      ) : (
        <div className="ranking-empty">
          暂无排行榜数据
        </div>
      )}
    </Modal>
  );

  const gameRules = (
    <Modal
      title="游戏规则"
      visible={isRuleModalVisible}
      onOk={() => setIsRuleModalVisible(false)}
      onCancel={() => setIsRuleModalVisible(false)}
      footer={[
        <Button key="close" type="primary" onClick={(e) => {
          e.stopPropagation(); // 阻止事件冒泡
          setIsRuleModalVisible(false);
        }}>
          我知道了
        </Button>
      ]}
    >
      <div style={{padding: '0 12px'}}>
        <ol>
          <li><strong>目标：</strong>通过每次猜测获取线索，最终猜中隐藏的英雄。</li>
          <li><strong>流程：</strong>点击「开始」获取随机英雄 → 选择猜测 → 获取属性对比线索 → 直到猜中或点击「结束」。</li>
          <li><strong>线索类型：</strong>上线时间、定位、身高、皮肤数量等属性对比（↑/↓），相同属性显示✅。</li>
          <li><strong>限制：</strong>不可重复猜测同一英雄。</li>
          <li><strong>提示功能：</strong>点击「提示」可查看正确英雄的台词（若存在）。</li>
        </ol>

        {/* 最新英雄信息区块 */}
        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
        }}>
          <h4 style={{marginBottom: 12, fontSize: 14, fontWeight: 600}}>
            最新英雄信息
          </h4>

          {loadingNewHero ? (
            <Space>
              <RocketOutlined spin style={{color: '#ffa768'}}/>
              <span>加载中...</span>
            </Space>
          ) : newHero ? (
            <Space>
              <img
                src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${newHero.ename}/${newHero.ename}.jpg`}
                alt="最新英雄"
                style={{width: 80, height: 80, borderRadius: 4}}
              />
              <div>
                <div>名称：<strong>{newHero.cname}</strong></div>
                <div>定位：<strong>{typeMap[newHero.primaryType as keyof typeof typeMap] || newHero.primaryType}</strong>
                </div>
                <div>种族：<strong>{newHero.race || '无'}</strong></div>
                <div>首发：<strong>{newHero.releaseDate}</strong></div>
              </div>
            </Space>
          ) : (
            <span style={{color: '#888'}}>暂无最新英雄信息</span>
          )}
        </div>
      </div>
    </Modal>
  );


  // 比较图标渲染函数
  const renderCompareIcon = (current: number, target: number) => {
    if (!randomHero) return null;
    if (current > target) return <ArrowDownOutlined style={{color: '#ff4d4f', marginLeft: 4}}/>;
    if (current < target) return <ArrowUpOutlined style={{color: '#49aa19', marginLeft: 4}}/>;
    return <CheckCircleOutlined style={{color: '#52c41a', marginLeft: 4}}/>;
  };
  // 替换表格的移动端列表展示
  const renderGuessList = () => (
    <List
      dataSource={guessList}
      renderItem={(record) => (
        <List.Item
          className={`guess-hero-list-item ${record.id === correctHeroId ? 'highlight-row' : ''}`}
          style={{
            backgroundColor: '#fff',
            marginBottom: 12,
            borderRadius: 8,
            padding: '12px 16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{width: '100%'}}>
            {/* 头部信息 */}
            <div style={{display: 'flex', marginBottom: 12}}>
              <img
                src={`https://game.gtimg.cn/images/yxzj/img201606/heroimg/${record.ename}/${record.ename}.jpg`}
                style={{width: 50, height: 50, borderRadius: 4, marginRight: 12}}
              />
              <div>
                <div style={{fontWeight: 'bold', fontSize: 16}}>{record.cname}</div>
                <div style={{
                  fontSize: 12,
                }}>
                  {typeMap[record.primaryType as keyof typeof typeMap] || record.primaryType}
                  {randomHero && isSame(record.primaryType, randomHero.primaryType) && (
                    <CheckCircleOutlined style={{color: '#52c41a', marginLeft: 4}}/>
                  )}
                </div>
              </div>
            </div>

            {/* 核心对比指标 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginBottom: 8,
              fontSize: 12
            }}>
              <div style={{padding: 8, border: '1px solid #eee', borderRadius: 4}}>
                上线时间：{record.releaseDate}
                {renderCompareIcon(
                  new Date(record.releaseDate).getTime(),
                  randomHero?.releaseDate ? new Date(randomHero.releaseDate).getTime() : 0
                )}
              </div>

              <div style={{padding: 8, border: '1px solid #eee', borderRadius: 4}}>
                皮肤数：{record.skinsNum}
                {renderCompareIcon(
                  parseInt(record.skinsNum),
                  randomHero?.skinsNum ? parseInt(randomHero.skinsNum) : 0
                )}
              </div>

              <div style={{padding: 8, border: '1px solid #eee', borderRadius: 4}}>
                身高：{getHeightNumber(record.height)}cm
                {renderCompareIcon(
                  getHeightNumber(record.height),
                  randomHero?.height ? getHeightNumber(randomHero.height) : 0
                )}
              </div>
            </div>

            {/* 可展开详情 */}
            <Collapse size="small" bordered={false}>
              <Collapse.Panel header="查看详情" key="1">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 6,
                  fontSize: 12
                }}>
                  <div style={{
                    padding: 6,
                  }}>
                    阵营：{record.faction || '无'}
                    {randomHero && isSame(record.faction, randomHero.faction) && (
                      <CheckCircleOutlined style={{color: '#52c41a', marginLeft: 4}}/>
                    )}
                  </div>

                  <div style={{
                    padding: 6,
                  }}>
                    区域：{record.region || '无'}
                    {randomHero && isSame(record.region, randomHero.region) && (
                      <CheckCircleOutlined style={{color: '#52c41a', marginLeft: 4}}/>
                    )}
                  </div>

                  <div style={{
                    padding: 6,
                  }}>
                    副定位：
                    {record.secondaryType
                      ? typeMap[record.secondaryType as keyof typeof typeMap] || record.secondaryType
                      : '无'}
                    {randomHero && isSame(record.secondaryType, randomHero.secondaryType) && (
                      <CheckCircleOutlined style={{color: '#52c41a', marginLeft: 4}}/>
                    )}
                  </div>

                  <div style={{
                    padding: 6,
                  }}>
                    种族：{record.race || '无'}
                    {randomHero && isSame(record.race, randomHero.race) && (
                      <CheckCircleOutlined style={{color: '#52c41a', marginLeft: 4}}/>
                    )}
                  </div>

                  <div style={{
                    padding: 6,
                  }}>
                    能量：{record.ability || '无'}
                    {randomHero && isSame(record.ability, randomHero.ability) && (
                      <CheckCircleOutlined style={{color: '#52c41a', marginLeft: 4}}/>
                    )}
                  </div>
                </div>
              </Collapse.Panel>
            </Collapse>
          </div>
        </List.Item>
      )}
    />
  );
  return (
    <>
      {gameRules} {}
      {rankingModal} {}
      <Card
        className="card-background"
        style={{maxHeight: '80vh', overflowY: 'auto'}}
        title={
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontSize: 16}}>英雄猜猜乐</span>
            {/* 图标组 */}
            <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
              {/* 排行榜图标 */}
              <a
                style={{color: '#ffa768'}}
                onClick={() => {
                  setIsRankingModalVisible(true);
                  fetchRanking();
                }}
                title="排行榜"
              >
                <BarChartOutlined style={{fontSize: 18}}/>
              </a>
              {/* 规则图标 */}
              <a
                style={{color: '#ffa768'}}
                onClick={() => setIsRuleModalVisible(true)}
                title="游戏规则"
              >
                <QuestionCircleOutlined style={{fontSize: 18}}/>
              </a>
            </div>
          </div>
        }
      >
        <Form form={form} onFinish={handleGuess}>
          <Space
            direction="vertical"
            size="large"
            style={{width: '100%'}}
            align="center" // 新增属性
          >
            <Form.Item
              label="选择英雄"
              name="heroId"
              rules={[
                {
                  required: true,
                  message: <span className="mobile-validation">请选择英雄</span>, // 使用自定义样式容器
                }
              ]}
              style={{textAlign: 'center'}} // 新增样式
              labelCol={{style: {textAlign: 'left'}}} // 保持标签左对齐
            >
              <Select
                placeholder="请选择一位英雄"
                showSearch={true}
                options={heroList.map(hero => ({
                  label: hero.cname,
                  value: hero.id,
                }))}
                filterOption={(input, option) => {
                  const label = (option?.label as string) || '';
                  const inputLower = input.toLowerCase();
                  // 中文直接匹配
                  if (label.toLowerCase().includes(inputLower)) return true;
                  // 生成两种拼音形式
                  const fullPinyin = pinyin(label, { style: pinyin.STYLE_NORMAL }).join('');
                  const initialPinyin = pinyin(label, { style: pinyin.STYLE_FIRST_LETTER }).join('');
                  // 全拼模糊匹配（如：yas 可匹配 yase）
                  const fullMatch = fullPinyin.toLowerCase().includes(inputLower);
                  // 首字母匹配（如：ys 可匹配 ya se）
                  const initialMatch = initialPinyin.toLowerCase().includes(inputLower);
                  return fullMatch || initialMatch;
                }}
                style={{minWidth: 200}}
              />
            </Form.Item>
            {/* 动态显示猜中次数 */}
            {guessCount !== null && (
              <div className="guess-count-container">
                <span>全站累计猜对次数：</span>
                <span className="guess-count-number">{guessCount}</span>
                <span className="guess-count-login-hint">（登录后计入统计）</span>
              </div>
            )}

            <Space>
              <Button
                type="primary"
                onClick={handleStartGame}
                loading={loading}
                disabled={gameStarted}
              >
                开始
              </Button>
              <Button
                danger
                onClick={handleEndGame}
                disabled={!gameStarted}
              >
                结束
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  if (randomHero?.quote) {
                    message.success(`英雄台词：${randomHero.quote}`);
                  } else {
                    message.warning('该英雄暂无经典台词');
                  }
                }}
                disabled={!gameStarted}
              >
                提示
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!gameStarted}
                loading={loading}
              >
                猜一下
              </Button>
            </Space>

            {guessList.length > 0 ? (
              renderGuessList()
            ) : (
              <p style={{textAlign: 'center', color: '#888'}}>
                暂无猜测记录，请开始游戏并猜一下
              </p>
            )}
          </Space>
        </Form>
      </Card>
    </>
  );
};

export default GuessHero;
