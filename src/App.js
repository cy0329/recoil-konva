import React from 'react';
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil';
import {Route, Routes} from "react-router-dom";

import './App.css'

import ImageEditor from "./Components/ImageEditor/ImageEditor";

function App() {
  return (
    <RecoilRoot>
      <Routes>
        <Route path="/" element={<ImageEditor/>}/>
      </Routes>
    </RecoilRoot>
  );
}

export default App;
