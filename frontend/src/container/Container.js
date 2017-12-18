import React from 'react';
// import { Route } from 'react-router-dom';
import { PageHeader, ButtonToolbar, Button, Glyphicon } from 'react-bootstrap';

import DefaultNavbar from '../shared/Navbar';


class Container extends React.Component {

  render() {
    return (
      <div className="padding-top-30">

        <DefaultNavbar/>

        <PageHeader className="text-center">Containers</PageHeader>

        <ButtonToolbar className="flex-center margin-bottom-20">
          <Button bsStyle="primary"><Glyphicon glyph="plus"/> New Container</Button>
          <Button bsStyle="primary" disabled><Glyphicon glyph="import"/> Import</Button>
        </ButtonToolbar>

      </div>
    );
  };

  componentDidMount() {
    console.log('mounted');
  };

};
export default Container;
