import { QRCode } from 'react-qr-svg';

import { Button } from 'antd';

type QRProps = {
  qrValue: string;
  linkOnClick: () => void;
};

export const QR = ({ qrValue, linkOnClick }: QRProps) => {
  return (
    <>
      <QRCode bgColor="#FFFFFF" fgColor="#000000" level="L" value={qrValue} />
      <Button type="dashed" block size="middle" onClick={linkOnClick}>
        Copy link!
      </Button>
    </>
  );
};
