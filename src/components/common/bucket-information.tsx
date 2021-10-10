import { Collapse, Card, Divider, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import { Bucket } from '../../models/files/bucket';
import { BucketIcon } from './icons';
const { Panel } = Collapse;
const { Meta } = Card;

type BucketInformationProps = {
  bucket: Bucket;
  onEdit?: () => void;
};

export const BucketInformation = ({
  bucket,
  onEdit,
}: BucketInformationProps) => {
  const createdDate: Date = new Date(bucket.created);
  const createdText = `Created: ${createdDate.toLocaleDateString()} at ${createdDate.toLocaleTimeString()}`;

  const modifiedDate: Date = new Date(bucket.modified);
  const modifiedText = `Edited: ${modifiedDate.toLocaleDateString()} at ${modifiedDate.toLocaleTimeString()}`;

  return (
    <div style={{ textAlign: 'center' }}>
      <Collapse>
        <Panel header="Bucket information" key="1">
          <Card
            style={{ border: 'none' }}
            title={bucket.name}
            cover={<BucketIcon />}
          >
            <Meta description={bucket.description} />
            <Divider />
            {createdText}
            <Divider />
            {modifiedText}
            <Divider />
            Total files: {Object.keys(bucket.files).length}
          </Card>
          {onEdit && (
            <Button
              type="primary"
              ghost
              style={{ margin: 12 }}
              icon={<EditOutlined />}
              onClick={onEdit}
              size="middle"
            >
              Edit bucket
            </Button>
          )}
        </Panel>
      </Collapse>
    </div>
  );
};
