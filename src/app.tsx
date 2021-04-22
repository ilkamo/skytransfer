import './app.css';

import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import Uploader from './components/uploader/uploader';
import FileList from './components/filelist/file-list';

import { Layout } from 'antd';
import ApplicationStateProvider from './state/state';
import AppHeader from './components/header/header';


const { Content, Footer } = Layout;

function App() {
  return (
    <Router>
      <ApplicationStateProvider>
        <Layout className="layout">
          <AppHeader />
          <Content
            className="container"
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
          <Footer style={{ textAlign: 'center' }}><a rel="noreferrer" target="_blank" href="https://github.com/kamy22/skytransfer">Source code on GitHub</a>. Coded by <a target="_blank" rel="noreferrer" href="https://github.com/kamy22">Kamil Molendys</a> and <a rel="noreferrer" target="_blank" href="https://github.com/0michalsokolowski0">Michał Sokołowski</a>. Powered by <a target="_blank" rel="noreferrer" href="https://siasky.net/">Skynet</a>.</Footer>
        </Layout>
      </ApplicationStateProvider>
    </Router>
  );
}

export default App;
