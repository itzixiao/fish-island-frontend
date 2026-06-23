import { updateWordLibraryUsingPost } from '@/services/backend/wordLibraryController';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { message, Modal } from 'antd';
import React from 'react';

interface Props {
  oldData?: API.WordLibrary;
  visible: boolean;
  columns: ProColumns<API.WordLibrary>[];
  onSubmit: (values: API.WordLibraryUpdateRequest) => void;
  onCancel: () => void;
}

/**
 * 更新词库项
 *
 * @param fields
 */
const handleUpdate = async (fields: API.WordLibraryUpdateRequest) => {
  const hide = message.loading('正在更新');
  try {
    const res = await updateWordLibraryUsingPost(fields);
    hide();
    if (res.code === 0) {
      message.success('更新成功');
      return true;
    } else {
      message.error('更新失败，' + (res.message || '未知错误'));
      return false;
    }
  } catch (error: any) {
    hide();
    message.error('更新失败，' + error.message);
    return false;
  }
};

/**
 * 更新弹窗
 * @param props
 * @constructor
 */
const UpdateModal: React.FC<Props> = (props) => {
  const { oldData, visible, columns, onSubmit, onCancel } = props;

  if (!oldData) {
    return <></>;
  }

  return (
    <Modal
      destroyOnClose
      title={'更新词库'}
      open={visible}
      footer={null}
      onCancel={() => {
        onCancel?.();
      }}
    >
      <ProTable
        type="form"
        columns={columns}
        form={{
          initialValues: oldData,
        }}
        onSubmit={async (values: API.WordLibraryUpdateRequest) => {
          const success = await handleUpdate({
            ...values,
            id: oldData.id as any,
          });
          if (success) {
            onSubmit?.(values);
          }
        }}
      />
    </Modal>
  );
};
export default UpdateModal;
