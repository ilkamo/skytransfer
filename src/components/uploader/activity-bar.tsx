import { Progress, Tooltip, Card } from 'antd';

import { CloudDownloadOutlined, SecurityScanOutlined } from '@ant-design/icons';

type ActivityBarProps = {
  downloadProgress: number;
  encryptProgress: number;
  decryptProgress: number;
};

const ActivityBar = ({
  downloadProgress,
  encryptProgress,
  decryptProgress,
}: ActivityBarProps) => {
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
        steps={35}
        size="small"
        strokeColor="#52c41a"
        trailColor="#cccccc"
      />
      <br />
      <Tooltip
        trigger={['hover', 'click']}
        placement="right"
        title="Active when a download is in progress."
      >
        <CloudDownloadOutlined style={{ marginRight: '4px' }} />
        <span className="label progress">Download</span>
      </Tooltip>
      <Progress
        className="progress"
        percent={downloadProgress}
        steps={35}
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
        steps={35}
        size="small"
        strokeColor="#52c41a"
        trailColor="#cccccc"
      />
    </div>
  );
};

export default ActivityBar;
