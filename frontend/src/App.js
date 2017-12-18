import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import Login from './login/Login';
import Containers from './containers/Containers';


class App extends React.Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={Login}/>
          <Route path="/containers" component={Containers}/>
        </Switch>
      </Router>
    );
  };
};


export default App;
