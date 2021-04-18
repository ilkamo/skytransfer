import "./app.css";

import {
  HashRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import Uploader from "./components/uploader/uploader";
import FileList from "./components/filelist/file-list";

import { Layout } from 'antd';
import Session from "./components/session/session";

const { Header, Content } = Layout;

function App() {
  return (
    <Router>
      <div>
        <Layout className="layout">
          <Session />
          <Header className="title">SkyTransfer</Header>
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
        </Layout>
      </div>
    </Router>
  );
}

export default App;
