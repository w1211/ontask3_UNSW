import React from 'react';

import { Navbar, Nav, NavItem, Glyphicon, PageHeader, ButtonToolbar, Button, Table } from 'react-bootstrap';
import utils from '../shared/utils.css.js';


class Containers extends React.Component {
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
        <ButtonToolbar style={{...utils.flexCenter, ...utils.margin.bottom[20]}}>
          <Button bsStyle="primary"><Glyphicon glyph="plus"/> New Container</Button>
          <Button bsStyle="primary" disabled><Glyphicon glyph="import"/> Import</Button>
        </ButtonToolbar>
        <div className="container">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Mark</td>
                <td>Otto</td>
                <td>@mdo</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Jacob</td>
                <td>Thornton</td>
                <td>@fat</td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  componentDidMount() {
    console.log('mounted');
  };

};

export default Containers;
