import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import Login from './login/Login';
import Container from './container/Container';


class App extends React.Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={Login}/>
          <Route path="/containers" component={Container}/>
        </Switch>
      </Router>
    );
  };
};


export default App;
