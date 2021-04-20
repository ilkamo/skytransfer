import { Menu, message, Layout } from 'antd';

import { CopyOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import SessionManager from '../../session/session-manager';
import { useStateContext } from '../../state/state';
import { useHistory } from 'react-router-dom';

const { Header } = Layout;

const Sidebar = () => {
  const { state } = useStateContext();
  const { isReadOnlySession } = state;
  const history = useHistory();

  return (
    <Header>
      <div className="logo">SkyTransfer</div>
      <Menu theme="dark" mode="horizontal" selectedKeys={[]}>
        <Menu.Item
          key="copy-read-write"
          disabled={isReadOnlySession}
          onClick={() => {
            navigator.clipboard.writeText(SessionManager.readWriteLink);
            message.info('SkyTransfer read-write link copied');
          }}
          icon={<LinkOutlined />}
        >
          Read/write link
        </Menu.Item>
        <Menu.Item
          key="copy-read-only"
          onClick={() => {
            navigator.clipboard.writeText(SessionManager.readOnlyLink);
            message.info('SkyTransfer read-only link copied');
          }}
          icon={<LinkOutlined />}
        >
          Read only link
        </Menu.Item>
        <Menu.Item
          key="new-session"
          onClick={() => {
            SessionManager.destroySession();
            history.push('/');
          }}
          icon={<DeleteOutlined />}
        >
          New session
        </Menu.Item>
        <Menu.Item key="about-us" disabled icon={<CopyOutlined />}>
          About SkyTransfer
        </Menu.Item>
      </Menu>
    </Header>
  );
};

export default Sidebar;
