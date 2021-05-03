import { Button } from 'antd';

import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';

import { isMobile } from 'react-device-detect';

type DirectoryTreeLineProps = {
  isLeaf: boolean;
  name: string;
  onDownloadClick: () => void;
  onDeleteClick: () => void;
};

export const DirectoryTreeLine = ({
  isLeaf,
  name,
  onDownloadClick,
  onDeleteClick,
}: DirectoryTreeLineProps) => {
  if (isLeaf) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: isMobile ? '200px' : 'auto',
          }}
        >
          {name}
        </span>
        <div>
          <Button
            icon={<DownloadOutlined />}
            style={{ marginRight: '5px' }}
            type="primary"
            onClick={onDownloadClick}
          >
            {isMobile ? '' : 'Download'}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            type="primary"
            danger
            onClick={onDeleteClick}
          >
            {isMobile ? '' : 'Delete'}
          </Button>
        </div>
      </div>
    );
  }

  return <span>{name}</span>;
};
