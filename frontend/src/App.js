import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import Containers from './containers/containers.component';


class App extends React.Component {
  render() {
    return (
      <Router>
        <div>
          {/* <Route path="/login" component={Login}/> */}
          <Route path="/containers" component={Containers}/>
        </div>
      </Router>
    );
  };
};

export default App;
