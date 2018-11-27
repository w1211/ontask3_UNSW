import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
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

import * as DataLabActionCreators from "./DataLabActions";

import "./DataLab.css";

import { Model, Details, Data, WebForm } from "./interfaces";

const { Content } = Layout;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class DataLab extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = { route: null, isForm: false };
  }

  componentDidMount() {
    const { match, location, history } = this.props;

    const route = location.pathname.split("/");
    const isForm = route[route.length - 2] === "form";

    if (isForm) {
      this.setState({ isForm: true });
    } else {
      if (location.state && "containerId" in location.state) {
        // User pressed "Create DataLab", as the containerId is only set in the
        // location state when the navigation occurs
        this.boundActionCreators.fetchDatasources(location.state.containerId);
      } else if (match.params.id) {
        this.boundActionCreators.fetchDataLab(match.params.id);
      } else {
        // The user must have cold-loaded the URL, so we have no container to reference
        // Therefore redirect the user back to the container list
        history.push("/containers");
      }
    }
  }

  render() {
    const {
      isFetching,
      selectedId,
      match,
      history,
      location,
      build
    } = this.props;
    const { isForm, showBreadcrumbs } = this.state;

    const webForms = [];
    build &&
      build.steps.forEach((step, stepIndex) => {
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

              {isFetching ? (
                <Spin size="large" />
              ) : (
                <Switch>
                  <Route exact path={`${match.url}`} component={Model} />
                  <Route path={`${match.url}/model`} component={Model} />
                  <Route path={`${match.url}/details`} component={Details} />
                  <Route path={`${match.url}/data`} component={Data} />
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

const mapStateToProps = state => {
  const { isFetching, selectedId, build } = state.dataLab;

  return {
    isFetching,
    selectedId,
    build
  };
};

export default _.flow(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend)
)(DataLab);
