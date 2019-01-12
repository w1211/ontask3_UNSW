import React from "react";
import { Link } from "react-router-dom";
import { Switch, Route } from "react-router-dom";
import {
  Spin,
  Layout,
  Breadcrumb,
  Icon,
  Radio,
  Dropdown,
  Menu,
  Button
} from "antd";
import { DragDropContext } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import _ from "lodash";

import "./DataLab.css";

import Model from "./model/Model";
import Details from "./details/Details";
import Data from "./data/Data";
import WebForm from "./webform/WebForm";

import apiRequest from "../shared/apiRequest";

const { Content } = Layout;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class DataLab extends React.Component {
  state = { fetching: true, isForm: false };

  componentDidMount() {
    const { match, location, history } = this.props;

    const route = location.pathname.split("/");
    const isForm = route[route.length - 2] === "form";

    const containerId = _.get(location, "state.containerId");

    if (isForm) {
      this.setState({ isForm: true, fetching: false });
    } else {
      // User pressed "Create DataLab", as the containerId is only set in the
      // location state when the navigation occurs
      if (containerId) {
        apiRequest(`/container/${containerId}/datasources/`, {
          method: "GET",
          onSuccess: datasources =>
            this.setState({ fetching: false, datasources, containerId }),
          onError: () => this.setState({ fetching: false })
        });
      } else if (match.params.id) {
        apiRequest(`/datalab/${match.params.id}/`, {
          method: "GET",
          onSuccess: datalab => {
            this.setState({
              fetching: false,
              selectedId: match.params.id,
              ...datalab
            });
          },
          onError: () => this.setState({ fetching: false })
        });
      } else {
        // The user must have cold-loaded the URL, so we have no container to reference
        // Therefore redirect the user back to the container list
        history.push("/containers");
      }
    }
  }

  updateDatalab = datalab => {
    this.setState({ ...datalab });
  };

  render() {
    const { match, history, location } = this.props;
    const {
      isForm,
      showBreadcrumbs,
      fetching,
      datasources,
      name,
      steps,
      order,
      data,
      selectedId
    } = this.state;

    const webForms = [];
    steps && steps.forEach((step, stepIndex) => {
      if (_.get(step, "form.webForm.active"))
        webForms.push({ name: step.form.name, index: stepIndex });
    });

    return (
      <div className={`dataLab ${isForm && !showBreadcrumbs && "is_web_form"}`}>
        <Content className="wrapper">
          {(!isForm || showBreadcrumbs) && (
            <Breadcrumb className="breadcrumbs">
              <Breadcrumb.Item>
                <Link to="/">Dashboard</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <Link to="/containers">Containers</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>DataLab</Breadcrumb.Item>
            </Breadcrumb>
          )}

          <Layout className="layout">
            <Content className="content">
              {!isForm && (
                <div className="heading">
                  <h1>{`${selectedId ? "Update" : "Create"} DataLab`}</h1>
                  <Link to="/containers">
                    <Icon type="arrow-left" />
                    <span>Back to containers</span>
                  </Link>
                </div>
              )}

              {selectedId && !isForm && (
                <div className="actions">
                  <RadioGroup
                    size="large"
                    style={{ marginRight: 15 }}
                    onChange={e =>
                      history.push(`${match.url}/${e.target.value}`)
                    }
                    value={location.pathname.split("/").slice(-1)[0]}
                  >
                    <RadioButton value="data">Data</RadioButton>
                    <RadioButton value="details">Details</RadioButton>
                    <RadioButton value="model">Model</RadioButton>
                  </RadioGroup>

                  {webForms.length > 0 && (
                    <Dropdown
                      trigger={["click"]}
                      overlay={
                        <Menu>
                          {webForms.map((form, i) => (
                            <Menu.Item key={i}>
                              <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`/datalab/${selectedId}/form/${
                                  form.index
                                }`}
                              >
                                {form.name}
                              </a>
                            </Menu.Item>
                          ))}
                        </Menu>
                      }
                    >
                      <Button icon="global" size="large">
                        Web forms ({webForms.length})
                      </Button>
                    </Dropdown>
                  )}
                </div>
              )}

              {fetching ? (
                <Spin size="large" />
              ) : (
                <Switch>
                  <Route
                    exact
                    path={`${match.url}`}
                    render={props => (
                      <Model
                        {...props}
                        datasources={datasources}
                        updateDatalab={this.updateDatalab}
                      />
                    )}
                  />

                  <Route
                    path={`${match.url}/model`}
                    render={props => (
                      <Model
                        {...props}
                        datasources={datasources}
                        selectedId={selectedId}
                        name={name}
                        steps={steps}
                        updateDatalab={this.updateDatalab}
                      />
                    )}
                  />

                  <Route
                    path={`${match.url}/details`}
                    render={props => (
                      <Details
                        {...props}
                        datasources={datasources}
                        selectedId={selectedId}
                        steps={steps}
                        order={order}
                        updateDatalab={this.updateDatalab}
                      />
                    )}
                  />

                  <Route
                    path={`${match.url}/data`}
                    render={props => (
                      <Data
                        {...props}
                        steps={steps}
                        data={data}
                        order={order}
                        selectedId={selectedId}
                        updateDatalab={this.updateDatalab}
                      />
                    )}
                  />

                  <Route
                    path={`${match.url}/form/:moduleIndex`}
                    render={props => (
                      <WebForm
                        {...props}
                        dataLabId={match.params.id}
                        showBreadcrumbs={() =>
                          this.setState({ showBreadcrumbs: true })
                        }
                      />
                    )}
                  />
                </Switch>
              )}
            </Content>
          </Layout>
        </Content>
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(DataLab);
