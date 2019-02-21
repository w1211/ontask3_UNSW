import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";

import App from "./App";
import registerServiceWorker from "./registerServiceWorker";

import { LocaleProvider } from "antd";
import enUS from "antd/lib/locale-provider/en_US";

import "./index.css";

ReactDOM.render(
  <LocaleProvider locale={enUS}>
    <Router>
      <App />
    </Router>
  </LocaleProvider>,
  document.getElementById("root")
);
registerServiceWorker();
