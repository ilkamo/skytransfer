import { Progress } from 'antd';

type StatusBarProps = {
  downloadProgress: number;
  encryptProgress: number;
  decryptProgress: number;
};

const StatusBar = ({
  downloadProgress,
  encryptProgress,
  decryptProgress,
}: StatusBarProps) => {
  return (
    <div className="status-bar default-margin">
      <span className="label">Download</span>
      <Progress
        className="progress"
        percent={downloadProgress}
        steps={8}
        size="small"
        strokeColor="#52c41a"
        trailColor="#cccccc"
      />
      <span className="label">Decrypt</span>
      <Progress
        className="progress"
        percent={decryptProgress}
        steps={8}
        size="small"
        strokeColor="#52c41a"
        trailColor="#cccccc"
      />
      <span className="label">Encrypt</span>
      <Progress
        className="progress"
        percent={encryptProgress}
        steps={8}
        size="small"
        strokeColor="#52c41a"
        trailColor="#cccccc"
      />
    </div>
  );
};

export default StatusBar;
