import React from 'react';
import { Link } from 'react-router-dom';
import { Nav } from 'react-bootstrap';

const Header = () => {
  return (
    <Nav className="mr-auto">
      <Nav.Link as={Link} to="/about">关于</Nav.Link>
      <Nav.Link as={Link} to="/subscribe">订阅</Nav.Link>
      <Nav.Link as={Link} to="/admin">管理</Nav.Link>
    </Nav>
  );
};

export default Header; 