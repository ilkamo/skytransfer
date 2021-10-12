import './app.less';

import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import Uploader from './components/uploader/uploader';
import FileList from './components/filelist/file-list';

import { Layout, Divider } from 'antd';
import AppHeader from './components/header/header';
import Buckets from './components/buckets/buckets';
import About from './components/about/about';
import SupportUs from './components/support-us/support-us';
import { HomescreenIcon } from './components/common/icons';
import { HeaderNotification } from './components/common/notification';
import RedirectV1 from './components/redirect-v1/redirect-v1';

import store from './app/store';
import { silentLogin } from './features/user/user-slice';

const { Content, Footer } = Layout;

store.dispatch(silentLogin());

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
        <AppHeader />
        <Content className="container">
          <Switch>
            <Route path="/v2/:transferKey/:encryptionKey">
              <Content>
                <FileList />
              </Content>
            </Route>
            <Route path="/:transferKey/:encryptionKey">
              <Content>
                <RedirectV1 />
              </Content>
            </Route>
            <Route path="/buckets">
              <Content>
                <Buckets />
              </Content>
            </Route>
            <Route path="/about">
              <Content>
                <About />
              </Content>
            </Route>
            <Route path="/support-us">
              <Content>
                <SupportUs />
              </Content>
            </Route>
            <Route path="/">
              <Content>
                <Uploader />
              </Content>
            </Route>
          </Switch>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
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
          <Divider />
          <a
            target="_blank"
            href="https://homescreen.hns.siasky.net/#/skylink/AQAJGCmM4njSUoFx-YNm64Zgea8QYRo-kHHf3Vht04mYBQ"
            rel="noreferrer"
          >
            <HomescreenIcon />
          </a>
        </Footer>
      </Layout>
    </Router>
  );
};

export default App;
