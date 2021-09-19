import { SkyTransferLogo } from '../common/icons';
import './about.css';

const About = () => {
  return (
    <div className="about">
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
      </p>
      <p>
        Use the minimal but powerful uploader (file picker or drag&drop) for{' '}
        <strong>uploading and sharing one or multiple files</strong> with a{' '}
        <strong>single link</strong> or <strong>QR code</strong>.
      </p>
      <p>
        Uploaded files are <strong>encrypted using the AES algorithm</strong>:
        no one can access them without your permission. Only by{' '}
        <strong>sharing the link</strong>, other people can{' '}
        <strong>download and decrypt</strong> the content you uploaded. In
        addition, by <strong>sharing a draft</strong>, people can continue
        uploading more data into the same SkyTransfer directory. Be careful when
        you share a draft!
      </p>
      <p>
        SkyTransfer supports <strong>uploading entire directories</strong>.
      </p>
      <p>
        Last but not least, thanks to MySky integration you can{' '}
        <strong>Publish your main directory</strong>. What does it exactly mean?
        Let's explain it with an example. Imagine SkyTransfer as a box that you
        can put different files in. This box can be opened by others only if
        they have the correct key. There is no other way of doing it. By
        publishing your SkyTransfer, you advertise this box with all its files
        on the public Skynet. At the same time, you attach the keys to the box
        so others can open it. Publish a SkyTransfer only when you are really
        aware of the consequences!
      </p>
      <p>
        SkyTransfer is still in development. Please report any issues, new ideas
        or bugs.
      </p>
    </div>
  );
};

export default About;
