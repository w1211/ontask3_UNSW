import React, { Component } from 'react';
import { Navbar, Nav, NavItem, Glyphicon, PageHeader, ButtonToolbar, Button } from 'react-bootstrap';

import utils from './shared/utils.css.js';

class App extends Component {
  render() {
    return (
      <div style={utils.padding.top[30]}>
        <Navbar fixedTop style={utils.fontSize.medium}>
          <Nav>
            <NavItem eventKey={1} href="#"><Glyphicon glyph="home"/></NavItem>
            <NavItem eventKey={1} href="#">About</NavItem>
            <NavItem eventKey={1} href="#">Contact</NavItem>
          </Nav>
        </Navbar>
        <PageHeader className="text-center">Containers</PageHeader>
        <ButtonToolbar style={utils.flexCenter}>
          <Button bsStyle="primary"><Glyphicon glyph="plus"/> New Container</Button>
          <Button bsStyle="primary" disabled><Glyphicon glyph="import"/> Import</Button>
        </ButtonToolbar>
      </div>
    );
  }
}

export default App;