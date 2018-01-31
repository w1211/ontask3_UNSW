import React from 'react';

import aaf from '../img/aaf.png';

class Login extends React.Component {
  render() {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <a href="https://rapid.aaf.edu.au/jwt/authnrequest/research/QGSS9UUcaI6UXa7v6AL3Yg"><img src={aaf} alt="AAF Logo" style={{ width: 200 }}/></a>
      </div>
    );
  };

};

export default Login;
