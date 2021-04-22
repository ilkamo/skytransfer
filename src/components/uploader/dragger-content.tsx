import { Spin } from 'antd';

type DraggerContentProps = {
  onlyClickable: boolean
  isEncrypting: boolean
  logoURL: string
  draggableMessage: string
}

export const DraggerContent = ({ onlyClickable, isEncrypting, logoURL,draggableMessage  }: DraggerContentProps) => {
  return <>
    <div className="ant-upload-drag-icon logo">SkyTransfer</div>
    <p className="ant-upload-drag-icon">
      <img alt="logo" className="skytransfer-logo" src={logoURL} />
    </p>
    <p className="ant-upload-text">
      {onlyClickable ? (
        <span>Click here to upload</span>
      ) : (
        <span>{draggableMessage}</span>
      )}
    </p>
    {isEncrypting ? (
      <Spin tip="File encryption started. Please wait ..." />
    ) : (
      ''
    )}
  </>
};