import { Menu, Layout, Modal } from 'antd';

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
  HeartOutlined,
} from '@ant-design/icons';

import SessionManager from '../../session/session-manager';
import { useHistory, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChangePortalIcon } from '../common/icons';
import { HeaderNotification } from '../common/notification';

const { Header } = Layout;
const { SubMenu } = Menu;

type HeaderProps = {
  shareOnClick: () => void;
};

const AppHeader = ({ shareOnClick }: HeaderProps) => {
  const history = useHistory();
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

  const newDraftConfirmModal = (onNewDraftClick: () => void) => {
    Modal.confirm({
      title: 'Are you sure?',
      icon: <DeleteOutlined />,
      content: `By starting a new draft, all files you've uploaded will be lost if you don't have the draft link. Make sure you've saved the draft link before continuing.`,
      okText: 'New draft',
      cancelText: 'Cancel',
      onOk: onNewDraftClick,
    });
  };

  return (
    <>
      <HeaderNotification
        content={
          <>
            Support SkyTransfer on{' '}
            <a
              target="_blank"
              href="https://gitcoin.co/grants/2998/skytransfer-free-open-source-decentralized-and-enc"
              rel="noreferrer"
            >
              Gitcoin Grants
            </a>
            !
          </>
        }
      />
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
              newDraftConfirmModal(() => {
                SessionManager.destroySession();
                history.push('/');
                window.location.reload();
              });
            }}
            icon={<DeleteOutlined />}
          >
            New draft
          </Menu.Item>
          <Menu.Item
            key="publish"
            onClick={() => {
              history.push('/publish');
            }}
            disabled={!canPublishSession}
            icon={<EyeOutlined />}
          >
            Publish (MySky)
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
          <Menu.Item
            key="support-us"
            onClick={() => {
              history.push('/support-us');
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
    </>
  );
};

export default AppHeader;
