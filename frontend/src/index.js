import React from "react";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import { BrowserRouter as Router } from "react-router-dom";

import App from "./App";
import registerServiceWorker from "./registerServiceWorker";

import { LocaleProvider } from "antd";
import enUS from "antd/lib/locale-provider/en_US";

import "./index.css";

import rootReducer from "./Reducers";

const store = createStore(rootReducer, applyMiddleware(thunk));

ReactDOM.render(
  <Provider store={store}>
    <LocaleProvider locale={enUS}>
      <Router>
        <App />
      </Router>
    </LocaleProvider>
  </Provider>,
  document.getElementById("root")
);
registerServiceWorker();
