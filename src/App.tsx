import React, { useState } from "react";
import "./App.css";

import DropZone from "./dropzone/DropZone";

function App() {
  const [count, setCount] = useState(0);

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
