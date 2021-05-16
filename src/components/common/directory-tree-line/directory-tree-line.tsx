import { Button } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';

import { isDesktop } from 'react-device-detect';

import './directory-tree-line.css';

type DirectoryTreeLineProps = {
  disabled: boolean;
  isLeaf: boolean;
  name: string;
  onDownloadClick: () => void;
  onDeleteClick?: () => void;
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
        <span className="directory-tree-line__nodename">{name}</span>
        <div className="directory-tree-line__buttons">
          <Button
            icon={<DownloadOutlined />}
            className="directory-tree-line__btn directory-tree-line__btn--download"
            onClick={onDownloadClick}
            size="small"
            disabled={disabled}
          >
            {isDesktop ? 'Download' : ''}
          </Button>
          {onDeleteClick && (
            <Button
              className="directory-tree-line__btn"
              icon={<DeleteOutlined />}
              danger
              onClick={onDeleteClick}
              size="small"
              disabled={disabled}
            >
              {isDesktop ? 'Delete' : ''}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <span className="directory-tree-line__nodename">{name}</span>;
};
