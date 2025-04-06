import Game from "./Game";
import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home/Home";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/room" element={<Game />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
