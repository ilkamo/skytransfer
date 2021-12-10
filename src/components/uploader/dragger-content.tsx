import { SkyTransferLogo } from '../common/icons';

type DraggerContentProps = {
  onlyClickable: boolean;
  draggableMessage: string;
};

export const DraggerContent = ({
  onlyClickable,
  draggableMessage,
}: DraggerContentProps) => {
  return (
    <>
      <p className="ant-upload-text">
        {onlyClickable ? (
          <span>Click here to upload</span>
        ) : (
          <span>{draggableMessage}</span>
        )}
      </p>
      <p className="ant-upload-drag-icon">
        <SkyTransferLogo />
        <br />
        <span className="ant-upload-drag-icon version">SkyTransfer v2.0.3</span>
      </p>
    </>
  );
};
