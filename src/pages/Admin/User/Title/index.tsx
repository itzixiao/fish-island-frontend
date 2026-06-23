import CreateModal from '@/pages/Admin/User/Title/components/CreateModal';
import UpdateModal from '@/pages/Admin/User/Title/components/UpdateModal';
import { deleteUserTitleUsingPost, listUserTitleByPageUsingPost } from '@/services/backend/userTitleController';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { Button, message, Popconfirm, Space, Typography } from 'antd';
import React, { useRef, useState } from 'react';

/**
 * 称号管理页面
 *
 * @constructor
 */
const UserTitleAdminPage: React.FC = () => {
  // 是否显示新建窗口
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  // 是否显示更新窗口
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  // 当前用户点击的数据
  const [currentRow, setCurrentRow] = useState<API.UserTitle>();

  /**
   * 删除称号项
   *
   * @param row
   */
  const handleDelete = async (row: API.UserTitle) => {
    const hide = message.loading('正在删除');
    if (!row) return true;
    try {
      const res = await deleteUserTitleUsingPost({
        id: row.titleId as any,
      });
      hide();
      if (res.code === 0) {
        message.success('删除成功');
        actionRef?.current?.reload();
        return true;
      } else {
        message.error('删除失败，' + (res.message || '未知错误'));
        return false;
      }
    } catch (error: any) {
      hide();
      message.error('删除失败，' + error.message);
      return false;
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<API.UserTitle>[] = [
    {
      title: 'ID',
      dataIndex: 'titleId',
      valueType: 'text',
      hideInForm: true,
    },
    {
      title: '称号名称',
      dataIndex: 'name',
      valueType: 'text',
    },
    {
      title: '创建时间',
      sorter: true,
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      hideInForm: true,
    },
    {
      title: '更新时间',
      sorter: true,
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInSearch: true,
      hideInForm: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space size="middle">
          <Typography.Link
            onClick={() => {
              setCurrentRow(record);
              setUpdateModalVisible(true);
            }}
          >
            修改
          </Typography.Link>
          <Popconfirm
            title="确定要删除该称号项吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Typography.Link type="danger">删除</Typography.Link>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.UserTitle>
        headerTitle={'称号管理'}
        actionRef={actionRef}
        rowKey="key"
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={async (params, sort, filter) => {
          const sortField = Object.keys(sort)?.[0];
          const sortOrder = sort?.[sortField] ?? undefined;

          const { data, code } = await listUserTitleByPageUsingPost({
            ...params,
            sortField,
            sortOrder,
            ...filter,
          } as API.UserTitleQueryRequest);

          return {
            success: code === 0,
            data: data?.records || [],
            total: Number(data?.total) || 0,
          };
        }}
        columns={columns}
      />
      <CreateModal
        visible={createModalVisible}
        columns={columns}
        onSubmit={() => {
          setCreateModalVisible(false);
          actionRef.current?.reload();
        }}
        onCancel={() => {
          setCreateModalVisible(false);
        }}
      />
      <UpdateModal
        visible={updateModalVisible}
        columns={columns}
        oldData={currentRow}
        onSubmit={() => {
          setUpdateModalVisible(false);
          setCurrentRow(undefined);
          actionRef.current?.reload();
        }}
        onCancel={() => {
          setUpdateModalVisible(false);
        }}
      />
    </PageContainer>
  );
};
export default UserTitleAdminPage;
