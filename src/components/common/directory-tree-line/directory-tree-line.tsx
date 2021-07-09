import { Button, Tooltip } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';

import { isDesktop } from 'react-device-detect';

import './directory-tree-line.css';

type DirectoryTreeLineProps = {
  disabled: boolean;
  isLeaf: boolean;
  name: string;
  updatedAt: number;
  onDownloadClick: () => void;
  onDeleteClick?: () => void;
};

export const DirectoryTreeLine = ({
  disabled,
  isLeaf,
  name,
  updatedAt,
  onDownloadClick,
  onDeleteClick,
}: DirectoryTreeLineProps) => {
  if (isLeaf) {
    let updatedAtDate: Date;
    if (updatedAt) {
      updatedAtDate = new Date(updatedAt);
    }
    return (
      <div className="directory-tree-line">
        <Tooltip
          title={
            updatedAtDate
              ? `Last update: ${updatedAtDate.toLocaleDateString()} at ${updatedAtDate.toLocaleTimeString()}`
              : ''
          }
        >
          <span className="directory-tree-line__nodename">{name}</span>
        </Tooltip>
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
