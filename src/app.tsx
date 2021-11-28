import './app.less';

import { HashRouter as Router, Route, Routes } from 'react-router-dom';

import Uploader from './components/uploader/uploader';
import FileList from './components/filelist/file-list';

import { Divider, Layout } from 'antd';
import AppHeader from './components/header/header';
import Buckets from './components/buckets/buckets';
import About from './components/about/about';
import SupportUs from './components/support-us/support-us';
import { HomescreenIcon } from './components/common/icons';
import { HeaderNotification } from './components/common/notification';
import RedirectV1 from './components/redirect-v1/redirect-v1';

const {Content, Footer} = Layout;

const App = () => {
  return (
    <Router>
      <Layout className="layout">
        <HeaderNotification
          content={
            <>
              <a
                href="https://github.com/kamy22/skytransfer/wiki/Changelog"
                target="_blank"
                rel="noreferrer"
              >
                SkyTransfer v2
              </a>{' '}
              is here but you can still{' '}
              <a
                target="_blank"
                href="https://skytransfer-v1.hns.siasky.net/"
                rel="noreferrer"
              >
                access the previous version
              </a>
              .
            </>
          }
        />
        <AppHeader/>
        <Content className="container">
          <Routes>
            <Route path="/v2/:transferKey/:encryptionKey" element={<Content>
              <FileList/>
            </Content>}/>
            <Route path="/:transferKey/:encryptionKey" element={<Content>
              <RedirectV1/>
            </Content>}/>
            <Route path="/buckets" element={<Content>
              <Buckets/>
            </Content>}/>
            <Route path="/about" element={<Content>
              <About/>
            </Content>}/>
            <Route path="/support-us" element={<Content>
              <SupportUs/>
            </Content>}/>
            <Route path="/" element={<Content>
              <Uploader/>
            </Content>}/>
          </Routes>
        </Content>
        <Footer style={{textAlign: 'center'}}>
          <a
            rel="noreferrer"
            target="_blank"
            href="https://github.com/kamy22/skytransfer"
          >
            Source code on GitHub
          </a>
          . Coded by{' '}
          <a target="_blank" rel="noreferrer" href="https://github.com/kamy22">
            Kamil Molendys
          </a>{' '}
          and{' '}
          <a
            rel="noreferrer"
            target="_blank"
            href="https://github.com/0michalsokolowski0"
          >
            Michał Sokołowski
          </a>
          . Powered by{' '}
          <a target="_blank" rel="noreferrer" href="https://siasky.net/">
            Skynet
          </a>
          .
          <Divider/>
          <a
            target="_blank"
            href="https://homescreen.hns.siasky.net/#/skylink/AQAJGCmM4njSUoFx-YNm64Zgea8QYRo-kHHf3Vht04mYBQ"
            rel="noreferrer"
          >
            <HomescreenIcon/>
          </a>
        </Footer>
      </Layout>
    </Router>
  );
};

export default App;
