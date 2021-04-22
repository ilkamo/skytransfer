import './app.css';

import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import Uploader from './components/uploader/uploader';
import FileList from './components/filelist/file-list';
import Session from './components/session/session';

import { Layout } from 'antd';
import ApplicationStateProvider from './state/state';
import AppHeader from './components/header/header';

const { Content } = Layout;

function App() {
  return (
    <Router>
      <ApplicationStateProvider>
        <Layout className="site-layout">
          <AppHeader />
          <Content
            className="site-layout-background"
            style={{
              margin: '24px 16px',
              padding: 24,
              minHeight: 280,
            }}
          >
            <Switch>
              <Route path="/:transferKey/:encryptionKey">
                <Content>
                  <FileList />
                </Content>
              </Route>
              <Route path="/session">
                <Content>
                  <Session />
                </Content>
              </Route>
              <Route path="/">
                <Content>
                  <Uploader />
                </Content>
              </Route>
            </Switch>
          </Content>
        </Layout>
      </ApplicationStateProvider>
    </Router>
  );
}

export default App;
