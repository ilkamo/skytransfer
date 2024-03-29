import { SmileIcon, SupportUsIcon } from '../common/icons';
import './support-us.css';

import { Divider, Typography } from 'antd';

const { Title } = Typography;

const SupportUs = () => {
  return (
    <div className="support-us page">
      <Title style={{ textAlign: 'left' }} level={4}>
        Support us
      </Title>
      <Divider />
      <p style={{ textAlign: 'center' }}>
        <SmileIcon />
      </p>
      <Divider className="divider-text">
        Thanks for using <span className="title">SkyTransfer</span>, dear
        friend.
      </Divider>
      <p>We want the World to be a better place, in our own small way.</p>
      <p>
        SkyTransfer is a tool we developed with love, for Us, for You, for the
        World. We hope you enjoy it and find it useful. Forget how frustrating
        can be, sometimes, sharing files. Reimagine how file sharing experience
        should be.
      </p>
      <Divider />
      <p style={{ textAlign: 'center' }}>
        <SupportUsIcon />
      </p>
      <Divider className="divider-text">Support and motivate Us</Divider>
      <p>
        We are constantly shipping new features. We don't want to steal your
        time but if you really want, you can support Us with a donation. It's
        your way of returning the love we invested in developing SkyTransfer. We
        would appreciate it very much.
      </p>
      <Divider className="divider-text">Gitcoin Grants</Divider>
      <p>
        SkyTransfer is an open source project and it is part of{' '}
        <a
          target="_blank"
          href="https://gitcoin.co/grants/2998/skytransfer-free-open-source-decentralized-and-enc"
          rel="noreferrer"
        >
          Gitcoin Grants
        </a>{' '}
        to raise funds for the future development. Gitcoin's fund matching pool
        relies on the number of donors a project has, so every gwei or dai
        counts!
      </p>
      <Divider className="divider-text">Buy Us a coffee</Divider>
      <p style={{ textAlign: 'center' }}>
        <a
          href="https://www.buymeacoffee.com/skytransfer"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee"
            style={{ width: 217, height: 60 }}
          />
        </a>
      </p>
      <br />
      <Divider className="divider-text">Siacoin wallet address</Divider>
      <pre style={{ textAlign: 'center', fontWeight: 'bold' }}>
        a34ac5a2aa1d5174b1a9289584ab4cdb5d2f99fa24de4a86d592fb02b2f81b754ff97af0e6e4
      </pre>
      <Divider />
      <p>
        Thanks for your time. Take care of you.
        <br />
        <br />
        Kamil & Michał,
        <br />
        SkyTransfer creators.
      </p>
    </div>
  );
};

export default SupportUs;
