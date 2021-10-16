import { Form, Input, Spin } from 'antd';
import { Modal } from 'antd';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { MySky } from 'skynet-js';
import { IBucket, IReadWriteBucketInfo } from '../../models/files/bucket';
import {
  encryptAndStoreBucket,
  getMySky,
  storeUserReadWriteHiddenBucket,
} from '../../skynet/skynet';

import { LoadingOutlined } from '@ant-design/icons';
import { setUserKeys } from '../../features/bucket/bucket-slice';
import { readWriteBucketAdded } from '../../features/user/user-slice';

type BucketModalProps = {
  bucketInfo: IReadWriteBucketInfo;
  bucket?: IBucket;
  visible: boolean;
  isLoggedUser: boolean;
  modalTitle: string;
  onCancel: () => void;
  onError?: (err) => void;
  onDone: (bucketInfo: IReadWriteBucketInfo, decryptedBucket: IBucket) => void;
};

export const BucketModal = ({
  bucketInfo,
  bucket,
  visible = false,
  isLoggedUser = false,
  modalTitle,
  onCancel = () => {},
  onError = (e) => {},
  onDone = (a, b) => {},
}: BucketModalProps) => {
  const [isloading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const modalSpinner = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  const onSubmit = async (values: any) => {
    setIsLoading(true);

    const modalBucketInfo = { ...bucketInfo };

    let bucketToStore: IBucket = {
      uuid: bucketInfo.bucketID,
      name: values.bucketName,
      description: values.bucketDescription,
      files: {},
      created: Date.now(),
      modified: Date.now(),
    };

    if (bucket) {
      bucket.name = values.bucketName;
      bucket.description = values.bucketDescription;
      bucket.modified = Date.now();
      bucketToStore = bucket;
    }

    try {
      await encryptAndStoreBucket(
        bucketInfo.privateKey,
        bucketInfo.encryptionKey,
        bucketToStore
      );

      if (isLoggedUser) {
        const mySky: MySky = await getMySky();
        await storeUserReadWriteHiddenBucket(mySky, modalBucketInfo);
      }
    } catch (error) {
      onError(error);
    }

    dispatch(readWriteBucketAdded(modalBucketInfo));
    dispatch(
      setUserKeys({
        bucketPrivateKey: bucketInfo.privateKey,
        bucketEncryptionKey: bucketInfo.encryptionKey,
      })
    );

    setIsLoading(false);
    onDone(modalBucketInfo, bucketToStore);
  };

  return (
    <Modal
      title={modalTitle}
      centered
      visible={visible}
      onCancel={onCancel}
      okButtonProps={{ form: 'create-bucket', htmlType: 'submit' }}
      confirmLoading={isloading}
    >
      <Form
        name="create-bucket"
        initialValues={{
          bucketName: bucket?.name ? bucket?.name : '',
          bucketDescription: bucket?.description ? bucket.description : '',
        }}
        onFinish={onSubmit}
        layout="vertical"
      >
        <Form.Item
          label="Bucket name"
          required
          tooltip="Name the bucket"
          name="bucketName"
          rules={[
            {
              required: true,
              message: 'Please add the bucket name',
            },
          ]}
        >
          <Input disabled={isloading} placeholder="Bucket name" />
        </Form.Item>
        <Form.Item
          label="Bucket description"
          required
          tooltip="Describe the content of the bucket"
          name="bucketDescription"
          rules={[
            {
              required: true,
              message: 'Please add a short bucket description',
            },
          ]}
        >
          <Input.TextArea
            disabled={isloading}
            placeholder="Bucket description"
          />
        </Form.Item>
      </Form>
      {isloading && (
        <div className="default-margin" style={{ textAlign: 'center' }}>
          <Spin indicator={modalSpinner} tip="Sync in progress..." />
        </div>
      )}
    </Modal>
  );
};
