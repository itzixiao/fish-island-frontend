import { Helmet } from '@umijs/max';
import { useEffect, useState } from 'react';
import defaultSettings from '../../../config/defaultSettings';

const GlobalTitle: React.FC = () => {
  const [title, setTitle] = useState(defaultSettings.title);

  useEffect(() => {
    // 获取网站名称
    const getSiteName = () => {
      const savedSiteConfig = localStorage.getItem('siteConfig');
      if (savedSiteConfig) {
        const { siteName } = JSON.parse(savedSiteConfig);
        return siteName || defaultSettings.title;
      }
      return defaultSettings.title;
    };

    setTitle(getSiteName());

    // 监听localStorage变化
    const handleStorageChange = () => {
      setTitle(getSiteName());
    };

    window.addEventListener('storage', handleStorageChange);

    // 监听自定义事件（当网站设置更新时触发）
    const handleSiteConfigChange = () => {
      setTitle(getSiteName());
    };

    window.addEventListener('siteConfigChange', handleSiteConfigChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('siteConfigChange', handleSiteConfigChange);
    };
  }, []);

  return <Helmet title={title} titleTemplate="%s" />;
};

export default GlobalTitle;
