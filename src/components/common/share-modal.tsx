import React from 'react';
import { Modal, message } from 'antd';

import SessionManager from '../../session/session-manager';

import { TabsCards } from './tabs-cards';
import { QR } from './qr';

type ShareModalProps = {
  title: string;
  visible: boolean;
  header: React.ReactNode;
  onCancel: () => void;
  shareLinkOnClick?: () => void;
  shareDraftLinkOnClick?: () => void;
};

export const ShareModal = ({
  title,
  visible,
  onCancel,
  header,
  shareLinkOnClick = () => {},
  shareDraftLinkOnClick = () => {},
}: ShareModalProps) => {
  const shareTab = {
    name: 'Share',
    content: (
      <QR
        qrValue={SessionManager.readOnlyLink}
        linkOnClick={() => {
          navigator.clipboard.writeText(SessionManager.readOnlyLink);
          message.info('SkyTransfer link copied');
          shareLinkOnClick();
        }}
      />
    ),
  };
  const shareDraftTab = {
    name: 'Share draft',
    content: (
      <QR
        qrValue={SessionManager.readWriteLink}
        linkOnClick={() => {
          navigator.clipboard.writeText(SessionManager.readWriteLink);
          message.info('SkyTransfer draft link copied');
          shareDraftLinkOnClick();
        }}
      />
    ),
  };

  const tabs = SessionManager.isReadOnlyFromLink()
    ? [shareTab]
    : [shareTab, shareDraftTab];

  return (
    <Modal
      title={title}
      centered
      visible={visible}
      onCancel={onCancel}
      footer={null}
    >
      {header}

      <TabsCards values={tabs} />
    </Modal>
  );
};
