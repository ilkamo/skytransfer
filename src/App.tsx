import "./App.css";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import DropZone from "./components/dropzone/DropZone";
import FileList from "./components/filelist/FileList";

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/users">Users</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/:sessionPublicKey/:encryptionKey">
            <FileList />
          </Route>
          <Route path="/">
            <p className="title">SkyTransfer</p>
            <div className="content">
              <DropZone />
            </div>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
