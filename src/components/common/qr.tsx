import { QRCode } from 'react-qr-svg';

import { Button, Input } from 'antd';

import { CopyOutlined } from '@ant-design/icons';

type QRProps = {
  qrValue: string;
  linkOnClick: () => void;
};

export const QR = ({ qrValue, linkOnClick }: QRProps) => {
  return (
    <>
      <QRCode bgColor="#FFFFFF" fgColor="#000000" level="L" value={qrValue} />
      <Input.TextArea
        value={qrValue}
        disabled
        autoSize
        style={{ fontSize: '12px', marginTop: 10, marginBottom: 10 }}
      />
      <div style={{textAlign: "center"}}>
        <Button
          type="ghost"
          size="middle"
          icon={<CopyOutlined />}
          onClick={linkOnClick}
        >
          Copy link
        </Button>
      </div>
    </>
  );
};
