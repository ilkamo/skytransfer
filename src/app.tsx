import './app.css';

import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import Uploader from './components/uploader/uploader';
import FileList from './components/filelist/file-list';

import { Layout, Row } from 'antd';
import ApplicationStateProvider from './state/state';
import Sidebar from './components/header/header';

const { Content, Sider } = Layout;

function App() {
  return (
    <Router>
      <ApplicationStateProvider>
        {/* <Row> */}
        <Layout className="site-layout">
          <Sidebar />
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
              <Route path="/">
                <Content>
                  <Uploader />
                </Content>
              </Route>
            </Switch>
          </Content>
        </Layout>
        {/* </Col> */}
        {/* </Row> */}
      </ApplicationStateProvider>
    </Router>
  );
}

export default App;
