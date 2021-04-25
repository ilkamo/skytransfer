import { Menu, message, Layout } from 'antd';

import {
  CopyOutlined,
  DeleteOutlined,
  LinkOutlined,
  RedoOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import SessionManager from '../../session/session-manager';
import { useHistory, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const { Header } = Layout;

const AppHeader = () => {
  const history = useHistory();
  let location = useLocation();

  const [canResumeSession, setCanResumeSession] = useState(false);
  const [isReadOnlySession, setIsReadOnlySession] = useState(false);

  useEffect(() => {
    setCanResumeSession(
      location.pathname !== '/' && SessionManager.canResume()
    );
    setIsReadOnlySession(
      location.pathname !== '/' && SessionManager.isReadOnlyFromLink()
    );
  }, [location]);

  return (
    <Header>
      <Menu theme="dark" mode="horizontal" selectedKeys={[]}>
        <Menu.Item
          key="share"
          onClick={() => {
            navigator.clipboard.writeText(SessionManager.readOnlyLink);
            message.info('SkyTransfer link copied');
          }}
          icon={<LinkOutlined />}
        >
          Share
        </Menu.Item>
        <Menu.Item
          key="share-draft"
          disabled={isReadOnlySession}
          onClick={() => {
            navigator.clipboard.writeText(SessionManager.readWriteLink);
            message.info('SkyTransfer editable link copied');
          }}
          icon={<EditOutlined />}
        >
          Share draft
        </Menu.Item>
        <Menu.Item
          key="resume-draft"
          onClick={() => {
            history.push('/');
          }}
          disabled={!canResumeSession}
          icon={<RedoOutlined />}
        >
          Resume draft
        </Menu.Item>
        <Menu.Item
          key="new-draft"
          onClick={() => {
            SessionManager.destroySession();
            history.push('/');
            window.location.reload();
          }}
          icon={<DeleteOutlined />}
        >
          New draft
        </Menu.Item>
        <Menu.Item
          key="publish"
          onClick={() => {
            history.push('/public');
          }}
          icon={<EyeOutlined />}
        >
          Publish
        </Menu.Item>
        <Menu.Item
          key="about-us"
          onClick={() => {
            history.push('/about');
          }}
          icon={<CopyOutlined />}
        >
          About
        </Menu.Item>
      </Menu>
    </Header>
  );
};

export default AppHeader;
