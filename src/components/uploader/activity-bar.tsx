import { Progress, Tooltip } from 'antd';

import { CloudDownloadOutlined, SecurityScanOutlined } from '@ant-design/icons';

type UploadActivityBarProps = {
  encryptProgress: number;
};

type DownloadActivityBarProps = {
  downloadProgress: number;
  decryptProgress: number;
};

const UploadActivityBar = ({ encryptProgress }: UploadActivityBarProps) => {
  return (
    <div className="activity-bar default-margin" style={{ background: 'none' }}>
      <Tooltip
        trigger={['hover', 'click']}
        placement="right"
        title="Active when file encryption is in progress."
      >
        <SecurityScanOutlined style={{ marginRight: '4px' }} />
        <span className="label progress">Encrypt</span>
      </Tooltip>
      <Progress
        className="progress"
        percent={encryptProgress}
        steps={26}
        size="small"
        strokeColor="#52c41a"
        trailColor="#cccccc"
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
        <span className="label progress">Download chunk(s)</span>
      </Tooltip>
      <Progress
        className="progress"
        percent={downloadProgress}
        steps={26}
        size="small"
        strokeColor="#52c41a"
        trailColor="#cccccc"
      />
      <br />
      <Tooltip
        trigger={['hover', 'click']}
        placement="right"
        title="Active when file decryption is in progress."
      >
        <SecurityScanOutlined style={{ marginRight: '4px' }} />
        <span className="label progress">Decrypt</span>
      </Tooltip>
      <Progress
        className="progress"
        percent={decryptProgress}
        steps={26}
        size="small"
        strokeColor="#52c41a"
        trailColor="#cccccc"
      />
    </div>
  );
};

export const ActivityBars = {
  UploadActivityBar: UploadActivityBar,
  DownloadActivityBar: DownloadActivityBar,
};
