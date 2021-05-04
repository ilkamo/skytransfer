import { Button } from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import { isMobile } from 'react-device-detect';
import { useState } from 'react';

type DirectoryTreeLineProps = {
  disabled: boolean;
  isLeaf: boolean;
  name: string;
  onDownloadClick: () => void;
  onDeleteClick: () => void;
};

export const DirectoryTreeLine = ({
  disabled,
  isLeaf,
  name,
  onDownloadClick,
  onDeleteClick,
}: DirectoryTreeLineProps) => {
  const [hover, setHover] = useState(false)
  const showButtons = isMobile || hover;

  if (isLeaf) {
    return (
      <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        height: '24px'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      >
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
        {showButtons &&
          <div>
            <Button
              icon={<DownloadOutlined />}
              style={{ marginRight: '5px' }}
              type="primary"
              onClick={onDownloadClick}
              size="small"
              disabled={disabled}
            >
              {isMobile ? '' : 'Download'}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              type="primary"
              danger
              onClick={onDeleteClick}
              size="small"
              disabled={disabled}
            >
              {isMobile ? '' : 'Delete'}
            </Button>
          </div>
          }
      </div>
    );
  }

  return <span>{name}</span>;
};
