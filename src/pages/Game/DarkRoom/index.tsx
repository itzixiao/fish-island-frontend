import React, { useEffect, useRef } from 'react';
import styles from './index.module.less';

const GbaEmulator: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // 确保 iframe 加载完成后设置其高度
    const handleLoad = () => {
      if (iframeRef.current) {
        iframeRef.current.style.height = '100%';
      }
    };

    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleLoad);
    }

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleLoad);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <iframe
        ref={iframeRef}
        src="https://adarkroom.yucoder.cn/?lang=zh_cn"
        className={styles.iframe}
        title="小黑屋模拟器"
      />
    </div>
  );
};

export default GbaEmulator;
