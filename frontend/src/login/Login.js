import React from 'react';
import aaf from '../img/aaf.png';

const queryString = require('query-string');


class Login extends React.Component {

  componentDidMount() {
    const oneTimeToken = queryString.parse(window.location.search).tkn;
    const authToken = localStorage.getItem('token');
    const payload = { token: oneTimeToken };

    if (!authToken && oneTimeToken) {
      fetch('http://uat-ontask2.teaching.unsw.edu.au/user/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (response.status >= 400 && response.status < 600) {
          response.json().then(error => {
            console.log(error);
          });
        } else {
          response.json().then(response => {
            localStorage.setItem('token', response.token);
            this.props.history.push("containers");
          })
        }
      })
      .catch(error => {
        console.log(error);
      })
    } else if (authToken) {
      this.props.history.push("containers");
    }

  }


  render() {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <a href="https://rapid.aaf.edu.au/jwt/authnrequest/research/QGSS9UUcaI6UXa7v6AL3Yg"><img src={aaf} alt="AAF Logo" style={{ width: 200 }}/></a>
      </div>
    );
  };

};

export default Login;
