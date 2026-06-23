import {
  addTitleToUserUsingPost,
  listUserTitleByPageUsingPost,
  listUserTitlesByUserIdUsingGet,
  removeTitleFromUserUsingPost
} from "@/services/backend/userTitleController";
import React, { useEffect, useState } from "react";
import { Button, Card, Divider, Empty, Input, message, Modal, Spin, Table, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

const TitleModal: React.FC<{
  visible: boolean;
  currentUser?: API.User;
  onClose: () => void;
}> = ({ visible, currentUser, onClose }) => {
  const [userTitles, setUserTitles] = useState<API.UserTitle[]>([]);
  const [allTitles, setAllTitles] = useState<API.UserTitle[]>([]);
  const [filteredTitles, setFilteredTitles] = useState<API.UserTitle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userTitlesLoading, setUserTitlesLoading] = useState<boolean>(false);
  const [allTitlesLoading, setAllTitlesLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  // 在现有状态中添加用户称号的分页状态
  const [userTitlesPagination, setUserTitlesPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  // 添加分页状态
  const [allTitlesPagination, setAllTitlesPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  // 获取用户拥有的称号
  const fetchUserTitles = async (userId: number) => {
    setUserTitlesLoading(true);
    try {
      const res = await listUserTitlesByUserIdUsingGet({ userId });
      if (res.code === 0) {
        // 过滤掉ID为2-10的称号
        const filteredData = (res.data || []).filter(title => {
          const titleId = title.titleId ?? 0;
          return !(titleId >= 2 && titleId <= 10);
        });
        setUserTitles(filteredData);
      } else {
        message.error('获取用户称号失败: ' + res.message);
      }
    } catch (error: any) {
      message.error('获取用户称号失败: ' + error.message);
    } finally {
      setUserTitlesLoading(false);
    }
  };

  // 获取所有称号列表（支持分页和搜索参数）
  const fetchAllTitles = async (page = 1, pageSize = 5, titleId?: number, name?: string) => {
    setAllTitlesLoading(true);
    try {
      const res = await listUserTitleByPageUsingPost({
        current: page,
        pageSize: pageSize,
        titleId,
        name,
      });
      if (res.code === 0) {
        // 过滤掉ID为2-10的称号
        const filteredData = (res.data?.records || []).filter(title => {
          const titleId = title.titleId ?? 0;
          return !(titleId >= 2 && titleId <= 10);
        });
        setAllTitles(filteredData);
        setFilteredTitles(filteredData);
        setAllTitlesPagination(prev => ({
          ...prev,
          current: page,
          total: filteredData.length || 0, // 更新总数为过滤后的数量
        }));
      } else {
        message.error('获取称号列表失败: ' + res.message);
      }
    } catch (error: any) {
      message.error('获取称号列表失败: ' + error.message);
    } finally {
      setAllTitlesLoading(false);
    }
  };

  // 当模态框打开且有当前用户时获取数据
  useEffect(() => {
    if (visible && currentUser?.id) {
      fetchUserTitles(currentUser.id);
      fetchAllTitles(1, 5);
    }
  }, [visible, currentUser]);

  // 检查用户是否拥有某个称号
  const hasTitle = (titleId: number) => {
    return userTitles.some(title => title.titleId === titleId);
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    const titleId = value && /^\d+$/.test(value) ? parseInt(value, 10) : undefined;
    const name = value && !/^\d+$/.test(value) ? value : undefined;
    fetchAllTitles(1, 5, titleId, name);
  };

  // 添加称号给用户
  const handleAddTitleToUser = async (titleId: number) => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const res = await addTitleToUserUsingPost({
        userId: currentUser.id,
        titleId
      });
      if (res.code === 0) {
        message.success('添加称号成功');
        // 重新获取用户称号列表
        await fetchUserTitles(currentUser.id);
        // 重新获取所有称号列表以更新状态
        const titleIdSearch = searchValue && /^\d+$/.test(searchValue) ? parseInt(searchValue, 10) : undefined;
        const nameSearch = searchValue && !/^\d+$/.test(searchValue) ? searchValue : undefined;
        await fetchAllTitles(allTitlesPagination.current, allTitlesPagination.pageSize, titleIdSearch, nameSearch);
      } else {
        message.error('添加称号失败: ' + res.message);
      }
    } catch (error: any) {
      message.error('添加称号失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 从用户删除称号
  const handleRemoveTitleFromUser = async (titleId: number, titleName: string) => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const res = await removeTitleFromUserUsingPost({
        userId: currentUser.id,
        titleId
      });
      if (res.code === 0) {
        message.success(`删除称号"${titleName}"成功`);
        // 重新获取用户称号列表
        await fetchUserTitles(currentUser.id);
        // 重新获取所有称号列表以更新状态
        const titleIdSearch = searchValue && /^\d+$/.test(searchValue) ? parseInt(searchValue, 10) : undefined;
        const nameSearch = searchValue && !/^\d+$/.test(searchValue) ? searchValue : undefined;
        await fetchAllTitles(allTitlesPagination.current, allTitlesPagination.pageSize, titleIdSearch, nameSearch);
      } else {
        message.error('删除称号失败: ' + res.message);
      }
    } catch (error: any) {
      message.error('删除称号失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 用户当前拥有的称号表格列定义
  const userTitlesColumns = [
    {
      title: '称号ID',
      dataIndex: 'titleId',
      key: 'titleId',
      width: 100,
    },
    {
      title: '称号名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: API.UserTitle) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveTitleFromUser(record.titleId!, record.name!)}
        >
          删除
        </Button>
      ),
    },
  ];

  // 所有称号表格列定义
  const allTitlesColumns = [
    {
      title: '称号ID',
      dataIndex: 'titleId',
      key: 'titleId',
      width: 100,
      sorter: (a: API.UserTitle, b: API.UserTitle) => (a.titleId || 0) - (b.titleId || 0),
    },
    {
      title: '称号名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: API.UserTitle, b: API.UserTitle) =>
        (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, record: API.UserTitle) =>
        hasTitle(record.titleId!) ? (
          <Tag color="green">已拥有</Tag>
        ) : (
          <Tag>未拥有</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: API.UserTitle) => (
        hasTitle(record.titleId!) ? (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveTitleFromUser(record.titleId!, record.name!)}
          >
            删除
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleAddTitleToUser(record.titleId!)}
          >
            添加
          </Button>
        )
      ),
    },
  ];

  return (
    <Modal
      title={"查看称号"}
      open={visible}
      onCancel={() => {
        onClose();
        setUserTitles([]);
        setSearchValue('');
        // 重置分页状态
        setAllTitlesPagination({
          current: 1,
          pageSize: 5,
          total: 0,
        });
      }}
      footer={null}
      width={1000}
      centered
    >
      <Spin spinning={userTitlesLoading || allTitlesLoading || loading}>
        {/* 用户当前拥有的称号 */}
        <Card size="small" title={currentUser ? `用户"${currentUser.userName}"拥有的称号` : "用户当前拥有的称号"}>
          {userTitles.length === 0 ? (
            <Empty description="该用户暂无称号" />
          ) : (
            <Table
              dataSource={userTitles}
              columns={userTitlesColumns}
              pagination={{
                current: userTitlesPagination.current,
                pageSize: userTitlesPagination.pageSize,
                total: userTitlesPagination.total,
                onChange: (page, pageSize) => {
                  // 由于当前接口 listUserTitlesByUserIdUsingGet 不支持分页，这里只更新分页状态
                  setUserTitlesPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
                },
              }}
              size="small"
              rowKey="titleId"
            />
          )}
        </Card>

        <Divider />

        {/* 所有可分配的称号 */}
        <Card
          size="small"
          title={"所有可分配的称号"}
          extra={
            <Search
              placeholder="搜索称号ID或名称"
              allowClear
              onSearch={handleSearch}
              onChange={e => setSearchValue(e.target.value)}
              style={{ width: 250 }}
            />
          }
        >
          <Table
            dataSource={filteredTitles}
            columns={allTitlesColumns}
            pagination={{
              current: allTitlesPagination.current,
              pageSize: allTitlesPagination.pageSize,
              total: allTitlesPagination.total,
              onChange: (page, pageSize) => {
                const titleId = searchValue && /^\d+$/.test(searchValue) ? parseInt(searchValue, 10) : undefined;
                const name = searchValue && !/^\d+$/.test(searchValue) ? searchValue : undefined;
                fetchAllTitles(page, pageSize || allTitlesPagination.pageSize, titleId, name);
              },
            }}
            size="middle"
            rowKey="titleId"
            scroll={{ x: 600 }}
          />
        </Card>
      </Spin>
    </Modal>
  );
};

export default TitleModal;
