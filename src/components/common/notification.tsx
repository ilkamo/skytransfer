import { NotificationOutlined } from '@ant-design/icons';

type HeaderNotificationProps = {
  content: JSX.Element;
};

export const HeaderNotification = ({ content }: HeaderNotificationProps) => {
  return (
    <div style={{ textAlign: 'center', padding: '14px', fontSize: 16 }}>
      <NotificationOutlined style={{ paddingRight: 10 }} />
      {content}
    </div>
  );
};
