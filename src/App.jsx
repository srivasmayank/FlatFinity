import Game from "./Game";
import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home/Home";
import Authenticate from "./pages/Authenticate/Authenticate";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/room" element={<Game />}></Route>
        <Route path="/authenticate" element={<Authenticate />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
