import React, { useEffect, useRef } from 'react';
import { InputNumber, Row, Col, Typography, Divider } from 'antd';

const { Text } = Typography;

// 属性定义
const ATTRIBUTE_CONFIG = [
  {
    key: 'critRate',
    label: '暴击率',
    group: 'active',
  },
  {
    key: 'comboRate',
    label: '连击率',
    group: 'active',
  },
  {
    key: 'dodgeRate',
    label: '闪避率',
    group: 'active',
  },
  {
    key: 'blockRate',
    label: '格挡率',
    group: 'active',
  },
  {
    key: 'lifesteal',
    label: '吸血',
    group: 'active',
  },
  {
    key: 'critResistance',
    label: '抗暴击',
    group: 'resistance',
  },
  {
    key: 'comboResistance',
    label: '抗连击',
    group: 'resistance',
  },
  {
    key: 'dodgeResistance',
    label: '抗闪避',
    group: 'resistance',
  },
  {
    key: 'blockResistance',
    label: '抗格挡',
    group: 'resistance',
  },
  {
    key: 'lifestealResistance',
    label: '抗吸血',
    group: 'resistance',
  },
];

interface MainAttrEditorProps {
  value?: string | Record<string, number>;
  onChange?: (value: string | undefined) => void;
}

/**
 * 装备属性可视化编辑器
 */
const MainAttrEditor: React.FC<MainAttrEditorProps> = ({ value, onChange }) => {
  // 将输入值（可能是字符串或对象）转换为属性对象
  // 注意：后端存储的是小数（如0.01表示1%），界面显示的是百分比（如1），所以需要乘以100
  const parseJsonToAttrs = (input: string | Record<string, number> | undefined): Record<string, number> => {
    if (!input) return {};
    
    // 如果已经是对象，直接处理
    if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
      const attrs: Record<string, number> = {};
      Object.keys(input).forEach((key) => {
        const val = input[key];
        if (typeof val === 'number') {
          // 将小数转换为百分比（乘以100）用于界面显示
          // 后端返回的 1 表示 1%（即 0.01），所以需要乘以100得到界面显示的 1
          attrs[key] = val * 100;
        }
      });
      return attrs;
    }
    
    // 如果是字符串，尝试解析为JSON
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        // 支持对象格式（Map）
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          const attrs: Record<string, number> = {};
          Object.keys(parsed).forEach((key) => {
            const val = parsed[key];
            if (typeof val === 'number') {
              // 将小数转换为百分比（乘以100）用于界面显示
              attrs[key] = val * 100;
            }
          });
          return attrs;
        }
        // 兼容旧格式（数组格式），方便迁移
        if (Array.isArray(parsed)) {
          const attrs: Record<string, number> = {};
          parsed.forEach((item) => {
            if (item && item.k && typeof item.v === 'number') {
              // 如果旧格式是百分比，需要判断；如果是小数，则乘以100
              // 假设旧格式如果是大于1的数值，则是百分比；小于等于1的是小数
              const value = item.v > 1 ? item.v : item.v * 100;
              attrs[item.k] = value;
            }
          });
          return attrs;
        }
      } catch (e) {
        // 解析失败，返回空对象
      }
    }
    
    return {};
  };

  // 将属性对象转换为 JSON 字符串（对象格式）
  // 注意：上传时需要将百分比值（如10）转换为小数（如0.1），所以除以100
  const convertAttrsToJson = (attrs: Record<string, number | undefined>): string | undefined => {
    const result: Record<string, number> = {};
    Object.keys(attrs).forEach((key) => {
      const val = attrs[key];
      // 只保存非 0 的值，并将百分比转换为小数（除以100）
      if (val !== undefined && val !== null && val !== 0) {
        result[key] = Number(val) / 100;
      }
    });
    const keys = Object.keys(result);
    return keys.length > 0 ? JSON.stringify(result) : undefined;
  };

  // 当前属性值
  const [attrs, setAttrs] = React.useState<Record<string, number | undefined>>(() => 
    parseJsonToAttrs(value)
  );
  
  // 用于跟踪上一次的 value，避免不必要的更新
  const prevValueRef = useRef<string | Record<string, number> | undefined>(value);

  // 当外部 value 变化时，更新内部状态
  useEffect(() => {
    // 比较 value 是否真正改变（使用 JSON 字符串化比较）
    const currentValueStr = typeof prevValueRef.current === 'object' 
      ? JSON.stringify(prevValueRef.current) 
      : prevValueRef.current;
    const newValueStr = typeof value === 'object' 
      ? JSON.stringify(value) 
      : value;
    
    if (currentValueStr !== newValueStr) {
      prevValueRef.current = value;
      const newAttrs = parseJsonToAttrs(value);
      setAttrs(newAttrs);
    }
  }, [value]);

  // 处理单个属性值变化
  const handleAttrChange = (key: string, newValue: number | null) => {
    const updatedAttrs = {
      ...attrs,
      [key]: newValue === null ? undefined : newValue,
    };
    setAttrs(updatedAttrs);
    
    // 转换为 JSON 字符串并触发 onChange
    const jsonStr = convertAttrsToJson(updatedAttrs);
    onChange?.(jsonStr);
  };

  const activeAttrs = ATTRIBUTE_CONFIG.filter((attr) => attr.group === 'active');
  const resistanceAttrs = ATTRIBUTE_CONFIG.filter((attr) => attr.group === 'resistance');

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ fontSize: '14px' }}>主动属性</Text>
      </div>
      <Row gutter={[16, 12]}>
        {activeAttrs.map((attr) => (
          <Col span={12} key={attr.key}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <Text style={{ width: '80px', fontSize: '13px' }}>{attr.label}:</Text>
              <InputNumber
                style={{ flex: 1 }}
                value={attrs[attr.key]}
                onChange={(val) => handleAttrChange(attr.key, val)}
                min={0}
                max={100}
                precision={1}
                placeholder="0"
              />
              <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>%</Text>
            </div>
          </Col>
        ))}
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ fontSize: '14px' }}>抗性属性</Text>
      </div>
      <Row gutter={[16, 12]}>
        {resistanceAttrs.map((attr) => (
          <Col span={12} key={attr.key}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <Text style={{ width: '80px', fontSize: '13px' }}>{attr.label}:</Text>
              <InputNumber
                style={{ flex: 1 }}
                value={attrs[attr.key]}
                onChange={(val) => handleAttrChange(attr.key, val)}
                min={0}
                max={100}
                precision={1}
                placeholder="0"
              />
              <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>%</Text>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default MainAttrEditor;

