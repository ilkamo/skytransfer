import './about.css';

const logoURL = process.env.PUBLIC_URL + 'assets/skytransfer-opt.svg';

const About = () => {
  return (
    <div className="about">
      <p style={{ textAlign: 'center' }}>
        <img alt="logo" className="skytransfer-logo" src={logoURL} />
      </p>
      <p>
        <span className="title">SkyTransfer</span> is an open source
        decentralized file sharing platform. Do you have difficult times{' '}
        <strong>sharing files between devices</strong>? Are you writing an email
        and you need to <strong>attach different files</strong>? Are you
        struggling with a ton of <strong>pictures to share</strong>? Let's try
        doing it using SkyTransfer.
      </p>
      <p>
        Use the minimal but powerful uploader (file picker or drag&drop) for{' '}
        <strong>uploading and sharing one or multiple files</strong> by a{' '}
        <strong>single link</strong> or <strong>QR code</strong>.
      </p>
      <p>
        Uploaded files are <strong>encrypted using AES algorithm</strong> so no
        one can access them without your permission. Only{' '}
        <strong>sharing the link</strong>, other people can{' '}
        <strong>download and decrypt</strong> the content you uploaded. In
        addition, <strong>sharing a draft</strong>, people can continue
        uploading into the same SkyTransfer{' '}
        <strong>adding more files to it</strong>. Be careful when you share a
        draft!
      </p>
      <p>
        SkyTransfer supports <strong>directories upload</strong> and is able to
        manage nested folders.
      </p>
      <p>
        Last but not least, you can <strong>Public your SkyTransfer</strong>.
        What does it exactly mean? Let's explain in with an example. Imagine{' '}
        SkyTransfer like a box where you can put inside different files. This
        box can be opened by others only if they have the correct key. There is
        no other way of doing it. By publishing a SkyTransfer, you send this box
        with all the files inside on the public Skynet. In addition, you are
        attaching the keys to it so, when others find it, they can use the keys
        to open it. Publish a SkyTransfer only when you are really aware of the
        consequences!
      </p>
    </div>
  );
};

export default About;
