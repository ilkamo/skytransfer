import { Button } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';

import { isMobile } from 'react-device-detect';

import './directory-tree-line.css';

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
  if (isLeaf) {
    return (
      <div className="directory-tree-line">
        <span className="directory-tree-line__filename">{name}</span>
        <div className="directory-tree-line__buttons">
          <Button
            icon={<DownloadOutlined />}
            className="directory-tree-line__btn-download"
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
      </div>
    );
  }

  return <span>{name}</span>;
};
