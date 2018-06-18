import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Layout, Breadcrumb, Icon, Button, Spin } from "antd";

import * as ContainerActionCreators from "./ContainerActions";

import ContainerModal from "./ContainerModal";
import ContainerList from "./ContainerList";
import DatasourceModal from "../datasource/DatasourceModal";
import WorkflowModal from "../workflow/WorkflowModal";
import SchedulerModal from "../scheduler/SchedulerModal";

import "./Container.css";

const { Content } = Layout;

class Container extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      ContainerActionCreators,
      dispatch
    );
  }

  componentDidMount() {
    this.boundActionCreators.fetchContainers();
  }

  render() {
    const { dispatch, isFetching, containers, history } = this.props;

    return (
      <div className="container">
        <Content className="wrapper">
          <Breadcrumb className="breadcrumbs">
            <Breadcrumb.Item>
              <Link to="/">Dashboard</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Containers</Breadcrumb.Item>
          </Breadcrumb>

          <Layout className="layout">
            <Content className="content">
              <h1>Containers</h1>

              {isFetching ? (
                <Spin size="large" />
              ) : (
                <div>
                  <Button
                    onClick={() => {
                      dispatch(this.boundActionCreators.openContainerModal());
                    }}
                    type="primary"
                    icon="plus"
                    size="large"
                    className="create_container"
                  >
                    New container
                  </Button>

                  <ContainerModal />

                  {containers && containers.length > 0 ? (
                    <div>
                      <WorkflowModal history={history} />
                      <DatasourceModal />
                      <SchedulerModal />
                      <ContainerList />
                    </div>
                  ) : (
                    <h2>
                      <Icon type="info-circle-o" className="info_icon" />
                      Get started by creating your first container.
                    </h2>
                  )}
                </div>
              )}
            </Content>
          </Layout>
        </Content>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { isFetching, containers } = state.containers;

  return {
    isFetching,
    containers
  };
};

export default connect(mapStateToProps)(Container);
