import { addWordLibraryUsingPost } from '@/services/backend/wordLibraryController';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { message, Modal } from 'antd';
import React from 'react';

interface Props {
  visible: boolean;
  columns: ProColumns<API.WordLibrary>[];
  onSubmit: (values: API.WordLibraryAddRequest) => void;
  onCancel: () => void;
}

/**
 * 添加词库项
 * @param fields
 */
const handleAdd = async (fields: API.WordLibraryAddRequest) => {
  const hide = message.loading('正在添加');
  try {
    const res = await addWordLibraryUsingPost(fields);
    hide();
    if (res.code === 0) {
      message.success('创建成功');
      return true;
    } else {
      message.error('创建失败，' + (res.message || '未知错误'));
      return false;
    }
  } catch (error: any) {
    hide();
    message.error('创建失败，' + error.message);
    return false;
  }
};

/**
 * 创建弹窗
 * @param props
 * @constructor
 */
const CreateModal: React.FC<Props> = (props) => {
  const { visible, columns, onSubmit, onCancel } = props;

  return (
    <Modal
      destroyOnClose
      title={'创建词库'}
      open={visible}
      footer={null}
      onCancel={() => {
        onCancel?.();
      }}
    >
      <ProTable
        type="form"
        columns={columns}
        onSubmit={async (values: API.WordLibraryAddRequest) => {
          const success = await handleAdd(values);
          if (success) {
            onSubmit?.(values);
          }
        }}
      />
    </Modal>
  );
};
export default CreateModal;
