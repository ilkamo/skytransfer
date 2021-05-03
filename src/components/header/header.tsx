import { Menu, Layout } from 'antd';

import { useReducer } from 'react';
import {
  getCurrentPortal,
  getPortals,
  setPortalWithDomain,
} from '../../portals';
import {
  CopyOutlined,
  DeleteOutlined,
  LinkOutlined,
  RedoOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import SessionManager from '../../session/session-manager';
import { useHistory, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChangePortalIcon } from '../common/icons';

const { Header } = Layout;
const { SubMenu } = Menu;

type HeaderProps = {
  shareOnClick: () => void;
};

const AppHeader = ({ shareOnClick }: HeaderProps) => {
  const history = useHistory();
  let location = useLocation();

  const [canResumeSession, setCanResumeSession] = useState(false);

  useEffect(() => {
    setCanResumeSession(
      location.pathname !== '/' && SessionManager.canResume()
    );
  }, [location]);

  // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const portals = getPortals().map((x) => {
    const changePortal = () => {
      setPortalWithDomain(x.domain);
      forceUpdate();
    };

    return (
      <Menu.Item key={x.domain} onClick={changePortal}>
        {x.displayName}
      </Menu.Item>
    );
  });

  return (
    <Header>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[getCurrentPortal().domain]}
      >
        <Menu.Item key="share" onClick={shareOnClick} icon={<LinkOutlined />}>
          Share
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
        <SubMenu
          key="portals"
          style={{ float: 'right' }}
          title="Change Portal"
          icon={<ChangePortalIcon />}
        >
          {portals}
        </SubMenu>
      </Menu>
    </Header>
  );
};

export default AppHeader;
