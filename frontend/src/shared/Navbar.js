import React from 'react';

import { Navbar, Nav, NavItem, Glyphicon } from 'react-bootstrap';

class DefaultNavbar extends React.Component {
  render() {
    return (
      <Navbar fixedTop className="font-size-medium">
        <Nav>
          <NavItem eventKey={1} href="#"><Glyphicon glyph="home"/></NavItem>
          <NavItem eventKey={1} href="#">About</NavItem>
          <NavItem eventKey={1} href="#">Contact</NavItem>
        </Nav>
      </Navbar>
    );
  };

};

export default DefaultNavbar;
