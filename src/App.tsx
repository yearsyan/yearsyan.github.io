import React from 'react';
import { Routes, Route } from "react-router-dom"
import './App.css';
import { CanvasPlayground } from './pages/CanvasPlayground/CanvasPlayground';
import { Home } from './pages/Home/Home';
import VideoPlayer from './pages/Player';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/canvas' element={<CanvasPlayground width={document.body.clientWidth} height={document.body.clientHeight}/>}/>
      <Route path='/video' element={<VideoPlayer/>}/>
    </Routes>
  );
}

export default App;
