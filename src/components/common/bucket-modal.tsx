import { Form, Input, Spin } from 'antd';
import { Modal } from 'antd';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { MySky } from 'skynet-js';
import { v4 as uuid } from 'uuid';
import { keySet } from '../../features/user/user-slice';
import { Bucket, BucketInfo } from '../../models/files/bucket';
import {
  encryptAndStoreBucket,
  getMySky,
  storeUserHiddenBucket,
} from '../../skynet/skynet';

import { LoadingOutlined } from '@ant-design/icons';

type BucketModalProps = {
  bucketInfo: BucketInfo;
  bucket?: Bucket;
  visible: boolean;
  isLoggedUser: boolean;
  modalTitle: string;
  onCancel: () => void;
  onError?: (err) => void;
  onDone: (bucketInfo: BucketInfo) => void;
};

export const BucketModal = ({
  bucketInfo,
  bucket,
  visible = false,
  isLoggedUser = false,
  modalTitle,
  onCancel = () => {},
  onError = (e) => {},
  onDone = (bucketInfo: BucketInfo) => {},
}: BucketModalProps) => {
  const [isloading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const modalSpinner = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    const tempBucketID = uuid();

    const modalBucketInfo = { ...bucketInfo };
    modalBucketInfo.name = values.bucketName;
    modalBucketInfo.description = values.bucketDescription;
    modalBucketInfo.modified = Date.now();

    let bucketToStore: Bucket = {
      uuid: tempBucketID,
      name: values.bucketName,
      description: values.bucketDescription,
      files: {},
      created: Date.now(),
      modified: Date.now(),
    };

    if (bucket) {
      bucket.name = values.bucketName;
      bucket.description = values.bucketDescription;
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
        await storeUserHiddenBucket(mySky, modalBucketInfo);
      }
    } catch (error) {
      onError(error);
    }

    dispatch(
      keySet({
        bucketPrivateKey: bucketInfo.privateKey,
        bucketEncryptionKey: bucketInfo.encryptionKey,
      })
    );

    setIsLoading(false);
    onDone(modalBucketInfo);
  };

  return (
    <Modal
      title={modalTitle}
      centered
      visible={visible}
      onCancel={onCancel}
      okButtonProps={{ form: 'create-bucket', htmlType: 'submit' }}
    >
      <Form
        name="create-bucket"
        initialValues={{
          bucketName: bucketInfo.name,
          bucketDescription: bucketInfo.description,
        }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="bucketName"
          rules={[
            {
              required: true,
              message: 'Please add the bucket name',
            },
          ]}
        >
          <Input placeholder="Bucket name" />
        </Form.Item>
        <Form.Item
          name="bucketDescription"
          rules={[
            {
              required: true,
              message: 'Please add a short bucket description',
            },
          ]}
        >
          <Input.TextArea placeholder="Bucket description" />
        </Form.Item>
      </Form>
      {isloading && (
        <div className="default-margin" style={{ textAlign: 'center' }}>
          <Spin indicator={modalSpinner} tip="Creating the bucket..." />
        </div>
      )}
    </Modal>
  );
};
