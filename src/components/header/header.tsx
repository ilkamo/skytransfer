import './header.css';

import { Menu, Layout } from 'antd';

import { useReducer } from 'react';
import {
  getCurrentPortal,
  getPortals,
  setPortalWithDomain,
} from '../../portals';

import {
  CopyOutlined,
  RedoOutlined,
  UnorderedListOutlined,
  HeartOutlined,
} from '@ant-design/icons';

import SessionManager from '../../session/session-manager';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChangePortalIcon } from '../common/icons';

const { Header } = Layout;
const { SubMenu } = Menu;

const AppHeader = () => {
  const navigate = useNavigate();
  let location = useLocation();

  const [canResumeSession, setCanResumeSession] = useState(false);
  const [canPublishSession, setCanPublishSession] = useState(false);

  useEffect(() => {
    setCanResumeSession(
      location.pathname !== '/' && SessionManager.canResume()
    );
    setCanPublishSession(SessionManager.canResume());
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
        <Menu.Item
          key="resume-draft"
          onClick={() => {
            navigate('/');
          }}
          disabled={!canResumeSession}
          icon={<RedoOutlined />}
        >
          Resume draft
        </Menu.Item>
        <Menu.Item
          key="buckets"
          onClick={() => {
            navigate('/buckets');
          }}
          disabled={!canPublishSession}
          icon={<UnorderedListOutlined />}
        >
          Buckets
        </Menu.Item>
        <Menu.Item
          key="about-us"
          onClick={() => {
            navigate('/about');
          }}
          icon={<CopyOutlined />}
        >
          About
        </Menu.Item>
        <Menu.Item
          key="support-us"
          onClick={() => {
            navigate('/support-us');
          }}
          icon={<HeartOutlined />}
        >
          Support Us
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
