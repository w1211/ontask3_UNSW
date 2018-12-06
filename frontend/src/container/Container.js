import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Layout, Breadcrumb, Icon, Button, Spin } from "antd";

import * as ContainerActionCreators from "./ContainerActions";
import {
  updateSchedule,
  deleteSchedule
} from "../datasource/DatasourceActions";

import ContainerModal from "./ContainerModal";
import ContainerList from "./ContainerList";
import ContainerShare from "./ContainerShare";
import DatasourceModal from "../datasource/DatasourceModal";
import ActionModal from "../action/ActionModal";
import SchedulerModal from "../scheduler/SchedulerModal";
import DataPreview from "../datasource/DataPreview";

import "./Container.css";

const { Content } = Layout;

class Container extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      { ...ContainerActionCreators, updateSchedule, deleteSchedule },
      dispatch
    );

    this.state = {
      container: { visible: false, selected: null },
      datasource: { visible: false, selected: null, data: {} },
      scheduler: { visible: false, selected: null, data: {} },
      action: { visible: false, selected: null, data: {} },
      sharing: { visible: false, selected: null },
      dataPreview: { visible: false, selected: null, data: {} }
    };
  }

  componentDidMount() {
    this.boundActionCreators.fetchContainers();
  }

  openModal = ({ type, selected, data }) => {
    // Opens a model of the specified type
    // E.g. create/edit container, modify sharing permissions of a container
    this.setState({
      [type]: {
        visible: true,
        selected,
        data
      }
    });
  };

  closeModal = type => {
    // Close the model of the specified type, and clear the parameters
    this.setState({
      [type]: {
        visible: false,
        selected: null,
        data: {}
      }
    });
  };

  render() {
    const { isFetching, containers } = this.props;
    const {
      container,
      datasource,
      scheduler,
      action,
      sharing,
      dataPreview
    } = this.state;

    return (
      <Layout className="container">
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
                    onClick={() => this.openModal({ type: "container" })}
                    type="primary"
                    icon="plus"
                    size="large"
                    className="create_container"
                  >
                    New container
                  </Button>

                  <ContainerModal
                    {...container}
                    closeModal={() => this.closeModal("container")}
                  />

                  <DatasourceModal
                    {...datasource}
                    closeModal={() => this.closeModal("datasource")}
                    datasource={datasource}
                    containers={containers}
                  />

                  <DataPreview
                    {...dataPreview}
                    closeModal={() => this.closeModal("dataPreview")}
                  />

                  <ActionModal
                    {...action}
                    closeModal={() => this.closeModal("action")}
                  />

                  <ContainerShare
                    {...sharing}
                    closeModal={() => this.closeModal("sharing")}
                  />

                  <SchedulerModal
                    {...scheduler}
                    onUpdate={this.boundActionCreators.updateSchedule}
                    onDelete={this.boundActionCreators.deleteSchedule}
                    closeModal={() => this.closeModal("scheduler")}
                  />

                  {containers && containers.length > 0 ? (
                    <ContainerList openModal={this.openModal} />
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
      </Layout>
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
