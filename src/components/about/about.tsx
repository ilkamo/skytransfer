import { SkyTransferLogo } from '../common/icons';
import './about.css';

import { Divider, Typography } from 'antd';

const { Title } = Typography;

const About = () => {
  return (
    <div className="about page">
      <Title style={{ textAlign: 'left' }} level={4}>
        About us
      </Title>
      <Divider />
      <p style={{ textAlign: 'center' }}>
        <SkyTransferLogo />
      </p>
      <p>
        <span className="title">SkyTransfer</span> is an open source
        decentralized file sharing platform. Do you have difficulty{' '}
        <strong>sharing files with others</strong> or{' '}
        <strong>between different devices</strong>? Are you writing an email and
        you need to <strong>attach files</strong>? Are you struggling with a ton
        of <strong>pictures to share</strong>? Try doing it using SkyTransfer.
        Use the minimal but powerful uploader (file picker or drag&drop) for{' '}
        <strong>uploading and sharing one or multiple files</strong> with a{' '}
        <strong>single link</strong> or <strong>QR code</strong>.
      </p>
      <p>
        Uploaded files are{' '}
        <strong>
          encrypted using{' '}
          <a
            href="https://github.com/jedisct1/libsodium.js"
            target="_blank"
            rel="noreferrer"
          >
            the sodium crypto library
          </a>
        </strong>{' '}
        compiled to WebAssembly and pure JavaScript: no one can access them
        without your permission. Only by{' '}
        <strong>sharing the bucket link</strong>, other people can{' '}
        <strong>download and decrypt</strong> the content you uploaded. In
        addition, by <strong>sharing a draft</strong>, people can continue
        uploading more data into the same bucket. Be careful when you share a
        draft!
      </p>
      <p>
        SkyTransfer supports <strong>uploading entire directories</strong>.
      </p>
      <p>
        Last but not least, using MySky you can access <strong>buckets</strong>,
        SkyTransfer's most advanced feature. Buckets are like folders in which
        files are stored. Before a collection of files can be uploaded, a bucket
        must first be created.
      </p>
      <p>
        SkyTransfer is still in development. Please report any bug or new idea{' '}
        <a href="https://github.com/kamy22/skytransfer">
          by opening an issue on github
        </a>{' '}
        and keep in mind that the encryption process has not yet been audited.
      </p>
    </div>
  );
};

export default About;
