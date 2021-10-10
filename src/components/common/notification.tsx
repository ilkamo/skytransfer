import './notification.css';
import { NotificationOutlined } from '@ant-design/icons';

type HeaderNotificationProps = {
  content: JSX.Element;
};

export const HeaderNotification = ({ content }: HeaderNotificationProps) => {
  return (
    <div className="notification">
      <NotificationOutlined style={{ paddingRight: 10 }} />
      {content}
    </div>
  );
};
