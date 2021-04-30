import { Menu, Layout } from 'antd';

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
import {
  getAlternativePortals,
  getCurrentPortal,
  setPortalWithDomain,
} from '../../portals';

const { Header } = Layout;
const { SubMenu } = Menu;

type HeaderProps = {
  shareOnClick: () => void;
};

const AppHeader = ({ shareOnClick }: HeaderProps) => {
  const history = useHistory();
  let location = useLocation();

  const [canResumeSession, setCanResumeSession] = useState(false);
  const [portal, setPortal] = useState(getCurrentPortal());

  useEffect(() => {
    setCanResumeSession(
      location.pathname !== '/' && SessionManager.canResume()
    );
  }, [location]);

  const alternativePortals = getAlternativePortals().map((x) => {
    const changePortal = () => {
      setPortalWithDomain(x.domain);
      setPortal(getCurrentPortal());
    };
    return (
      <Menu.Item key={x.domain} onClick={changePortal}>
        {x.displayName}
      </Menu.Item>
    );
  });

  return (
    <Header>
      <Menu theme="dark" mode="horizontal" selectedKeys={[]}>
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
          key={portal.domain}
          style={{ float: 'right' }}
          title={portal.displayName}
        >
          {alternativePortals}
        </SubMenu>
      </Menu>
    </Header>
  );
};

export default AppHeader;
