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
      <div className="ant-upload-drag-icon logo">SkyTransfer</div>
      <p className="ant-upload-drag-icon">
        <SkyTransferLogo />
      </p>
      <p className="ant-upload-text">
        {onlyClickable ? (
          <span>Click here to upload</span>
        ) : (
          <span>{draggableMessage}</span>
        )}
      </p>
    </>
  );
};
