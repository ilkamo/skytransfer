import "./App.css";

import DropZone from "./components/dropzone/DropZone";

function App() {
  return (
    <div className="App">
      <p className="title">SkyDrop</p>
      <div className="content">
        <DropZone />
      </div>
    </div>
  );
}

export default App;
