import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          arXiv推送
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-links">
              首页
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/papers" className="nav-links">
              最新论文
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/subscribe" className="nav-links">
              订阅
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/my-subscriptions" className="nav-links">
              我的订阅
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-links">
              关于
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/admin" className="nav-links">
              管理
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/settings" className="nav-links">
              设置
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar; 