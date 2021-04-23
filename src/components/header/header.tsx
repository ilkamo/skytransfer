import { Menu, message, Layout } from 'antd';

import {
  CopyOutlined,
  DeleteOutlined,
  LinkOutlined,
  RedoOutlined,
  EditOutlined,
} from '@ant-design/icons';
import SessionManager from '../../session/session-manager';
import { useStateContext } from '../../state/state';
import { useHistory, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const { Header } = Layout;

const AppHeader = () => {
  const { state } = useStateContext();
  const { isReadOnlySession } = state;
  const history = useHistory();
  let location = useLocation();

  const [canResumeSession, setCanResumeSession] = useState(false);

  useEffect(() => {
    setCanResumeSession(
      location.pathname !== '/' && SessionManager.canResume()
    );
  }, [location]);

  return (
    <Header>
      <Menu theme="dark" mode="horizontal" selectedKeys={[]}>
        <Menu.Item
          key="copy-read-write"
          disabled={isReadOnlySession}
          onClick={() => {
            navigator.clipboard.writeText(SessionManager.readWriteLink);
            message.info('SkyTransfer link copied');
          }}
          icon={<LinkOutlined />}
        >
          Share files
        </Menu.Item>
        <Menu.Item
          key="copy-read-only"
          onClick={() => {
            navigator.clipboard.writeText(SessionManager.readOnlyLink);
            message.info('SkyTransfer editable link copied');
          }}
          icon={<EditOutlined />}
        >
          Share draft
        </Menu.Item>
        <Menu.Item
          key="new-session"
          onClick={() => {
            SessionManager.destroySession();
            history.push('/');
            window.location.reload();
          }}
          icon={<DeleteOutlined />}
        >
          New
        </Menu.Item>
        <Menu.Item
          key="resume-session"
          onClick={() => {
            history.push('/');
          }}
          disabled={!canResumeSession}
          icon={<RedoOutlined />}
        >
          Resume
        </Menu.Item>
        <Menu.Item key="about-us" disabled icon={<CopyOutlined />}>
          About
        </Menu.Item>
      </Menu>
    </Header>
  );
};

export default AppHeader;
