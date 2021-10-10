import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const RedirectV1 = () => {
  const { transferKey, encryptionKey } = useParams();

  useEffect(() => {
    window.location.replace(
      `https://skytransfer-v1.hns.siasky.net/#/${transferKey}/${encryptionKey}`
    );
  }, [transferKey, encryptionKey]);

  return <></>;
};

export default RedirectV1;
