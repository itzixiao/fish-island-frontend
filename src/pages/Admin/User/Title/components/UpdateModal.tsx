import {updateUserTitleUsingPost} from '@/services/backend/userTitleController';
import {ProColumns, ProTable} from '@ant-design/pro-components';
import '@umijs/max';
import {message, Modal} from 'antd';
import React from 'react';

interface Props {
  oldData?: API.UserTitle;
  visible: boolean;
  columns: ProColumns<API.UserTitle>[];
  onSubmit: (values: API.UserTitleUpdateRequest) => void;
  onCancel: () => void;
}

/**
 * 更新称号项
 *
 * @param fields
 */
const handleUpdate = async (fields: API.UserTitleUpdateRequest) => {
  const hide = message.loading('正在更新');
  try {
    const res = await updateUserTitleUsingPost(fields);
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
      title={'更新称号'}
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
        onSubmit={async (values: API.UserTitleUpdateRequest) => {
          const success = await handleUpdate({
            ...values,
            titleId: oldData.titleId as any,
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
