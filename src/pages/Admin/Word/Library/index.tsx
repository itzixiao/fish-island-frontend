import CreateModal from '@/pages/Admin/Word/Library/components/CreateModal';
import UpdateModal from '@/pages/Admin/Word/Library/components/UpdateModal';
import { deleteWordLibraryUsingPost, listWordLibraryByPageUsingPost } from '@/services/backend/wordLibraryController';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { Button, message, Popconfirm, Space, Typography } from 'antd';
import React, { useRef, useState } from 'react';

/**
 * 词库管理页面
 *
 * @constructor
 */
const WordLibraryAdminPage: React.FC = () => {
  // 是否显示新建窗口
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  // 是否显示更新窗口
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  // 当前用户点击的数据
  const [currentRow, setCurrentRow] = useState<API.WordLibrary>();

  /**
   * 删除词库项
   *
   * @param row
   */
  const handleDelete = async (row: API.WordLibrary) => {
    const hide = message.loading('正在删除');
    if (!row) return true;
    try {
      await deleteWordLibraryUsingPost({
        id: row.id as any,
      });
      hide();
      message.success('删除成功');
      actionRef?.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error('删除失败，' + error.message);
      return false;
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<API.WordLibrary>[] = [
    {
      title: 'id',
      dataIndex: 'id',
      valueType: 'text',
      hideInForm: true,
    },
    {
      title: '单词',
      dataIndex: 'word',
      valueType: 'text',
    },
    {
      title: '分类',
      dataIndex: 'category',
      valueEnum: {
        'undercover': {
          text: '谁是卧底',
        },
        'draw-default': {
          text: '你画我猜-默认',
        },
        'draw-hero': {
          text: '你画我猜-王者荣耀',
        },
        'draw-idiom': {
          text: '你画我猜-成语',
        },
      },
    },
    {
      title: '类型',
      dataIndex: 'wordType',
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
            title="确定要删除该词库项吗？"
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
      <ProTable<API.WordLibrary>
        headerTitle={'词库管理'}
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

          const { data, code } = await listWordLibraryByPageUsingPost({
            ...params,
            sortField,
            sortOrder,
            ...filter,
          } as API.WordLibraryQueryRequest);

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
export default WordLibraryAdminPage;
