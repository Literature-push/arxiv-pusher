import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Papers from './pages/Papers';
import Subscribe from './pages/Subscribe';
import About from './pages/About';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import MySubscriptions from './pages/MySubscriptions';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/papers" element={<Papers />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/my-subscriptions" element={<MySubscriptions />} />
          </Routes>
        </div>
        <footer className="footer">
          <p>© {new Date().getFullYear()} arXiv文献推送系统 | 基于arXiv.org数据</p>
        </footer>
      </div>
    </Router>
  );
}

export default App; 