import "./App.css";

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import DropZone from "./components/dropzone/DropZone";
import FileList from "./components/filelist/FileList";

import { Layout } from 'antd';

const { Header, Footer, Content } = Layout;

function App() {
  return (
    <Router>
      <div>
        <Layout className="layout">
          <Header className="title">SkyTransfer</Header>
          <Switch>
            <Route path="/:sessionPublicKey/:encryptionKey">
              <Content>
                <FileList />
              </Content>
            </Route>
            <Route path="/">
              <Content>
                <DropZone />
              </Content>
            </Route>
          </Switch>
          <Footer>Footer</Footer>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
