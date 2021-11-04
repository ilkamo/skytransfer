import { Badge, Divider, Progress, Tooltip } from 'antd';

import { CloudDownloadOutlined, SecurityScanOutlined } from '@ant-design/icons';

type UploadActivityBarProps = {
  encryptProgress: number;
};

type DownloadActivityBarProps = {
  downloadProgress: number;
  decryptProgress: number;
};

const progressBadge = (progress) => {
  return (
    <Badge
      status={progress === 0 ? 'default' : 'processing'}
      color={progress === 0 ? '#fafafa' : '#20bf6b'}
    />
  );
};

const progressMaxWidth = 100;

const UploadActivityBar = ({ encryptProgress }: UploadActivityBarProps) => {
  return (
    <div className="activity-bar" style={{ background: 'none' }}>
      <Tooltip
        trigger={['hover', 'click']}
        placement="right"
        title="Active when file encryption is in progress."
      >
        <SecurityScanOutlined style={{ marginRight: '4px' }} />
        <span className="label progress">Encrypt</span>
        {progressBadge(encryptProgress)}
      </Tooltip>
      <Progress
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        status={encryptProgress === 0 ? 'normal' : 'active'}
        percent={encryptProgress}
        showInfo={false}
        style={{ maxWidth: progressMaxWidth }}
        strokeWidth={6}
      />
    </div>
  );
};

const DownloadActivityBar = ({
  downloadProgress,
  decryptProgress,
}: DownloadActivityBarProps) => {
  return (
    <div className="activity-bar default-margin" style={{ background: 'none' }}>
      <Tooltip
        trigger={['hover', 'click']}
        placement="right"
        title="Active when a download is in progress."
      >
        <CloudDownloadOutlined style={{ marginRight: '4px' }} />
        <span className="label progress">Download</span>
        {progressBadge(downloadProgress)}
      </Tooltip>
      <Progress
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        status={downloadProgress === 0 ? 'normal' : 'active'}
        percent={downloadProgress}
        showInfo={false}
        style={{ maxWidth: progressMaxWidth }}
        strokeWidth={6}
      />
      <br />
      <Tooltip
        trigger={['hover', 'click']}
        placement="right"
        title="Active when file decryption is in progress."
      >
        <SecurityScanOutlined style={{ marginRight: '4px' }} />
        <span className="label progress">Decrypt</span>
        {progressBadge(decryptProgress)}
      </Tooltip>
      <Progress
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        status={decryptProgress === 0 ? 'normal' : 'active'}
        percent={decryptProgress}
        showInfo={false}
        style={{ maxWidth: progressMaxWidth }}
        strokeWidth={6}
      />
    </div>
  );
};

export const ActivityBars = {
  UploadActivityBar: UploadActivityBar,
  DownloadActivityBar: DownloadActivityBar,
};
