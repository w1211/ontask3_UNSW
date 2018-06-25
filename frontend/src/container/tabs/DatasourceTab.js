import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Input, Icon, Tooltip, Button, Card, Modal } from "antd";

import { deleteDatasource } from "../../datasource/DatasourceActions";

const { Meta } = Card;
const confirm = Modal.confirm;

class DatasourceTab extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      { deleteDatasource },
      dispatch
    );

    this.state = { filter: null, loading: {} };
  }

  deleteDatasource = datasourceId => {
    confirm({
      title: "Confirm container deletion",
      content:
        "All associated datasources, views and workflows will be irrevocably deleted with the container.",
      okText: "Continue with deletion",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({
          loading: { [datasourceId]: true }
        });

        this.boundActionCreators.deleteDatasource({
          datasourceId,
          onFinish: () => {
            this.setState({ loading: { [datasourceId]: false } });
          }
        });
      }
    });
  };

  render() {
    const { containerId, datasources, openModal } = this.props;
    const { filter, loading } = this.state;

    const typeMap = {
      mysql: "MySQL",
      postgresql: "PostgreSQL",
      xlsXlsxFile: "Excel file",
      csvTextFile: "CSV/text file",
      s3BucketFile: "S3 bucket file",
      sqlite: "SQLite",
      mssql: "MSSQL"
    };

    return (
      <div className="tab">
        {datasources &&
          datasources.length > 0 && (
            <div className="filter_wrapper">
              <div className="filter">
                <Input
                  placeholder="Filter datasources by name"
                  value={filter}
                  addonAfter={
                    <Tooltip title="Clear filter">
                      <Icon
                        type="close"
                        onClick={() => this.setState({ filter: null })}
                      />
                    </Tooltip>
                  }
                  onChange={e => this.setState({ filter: e.target.value })}
                />
              </div>
            </div>
          )}

        {datasources &&
          datasources.map((datasource, i) => {
            if (filter && !datasource.name.includes(filter)) return null;

            let actions = [];
            actions.push(
              <Tooltip title="Edit datasource">
                <Button
                  icon="edit"
                  onClick={() => {
                    openModal({ type: "datasource", selected: datasource });
                  }}
                />
              </Tooltip>
            );

            if (
              [
                "mysql",
                "postgresql",
                "sqlite",
                "mssql",
                "s3BucketFile"
              ].includes(datasource.connection.dbType)
            )
              actions.push(
                <Tooltip
                  title={
                    "schedule" in datasource
                      ? "Update schedule"
                      : "Create schedule"
                  }
                >
                  <Button
                    icon="calendar"
                    onClick={() => {
                      openModal({
                        type: "scheduler",
                        selected: datasource.id,
                        data: {
                          schedule: datasource.schedule
                        }
                      });
                    }}
                  />
                </Tooltip>
              );

            actions.push(
              <Tooltip title="Delete datasource">
                <Button
                  type="danger"
                  icon="delete"
                  loading={datasource.id in loading && loading[datasource.id]}
                  onClick={() => this.deleteDatasource(datasource.id)}
                />
              </Tooltip>
            );

            return (
              <Card
                className="item"
                bodyStyle={{ flex: 1 }}
                title={datasource.name}
                actions={actions}
                key={i}
              >
                <Meta
                  description={
                    <span>{typeMap[datasource.connection.dbType]}</span>
                  }
                />
              </Card>
            );
          })}

        <div
          className="add item"
          onClick={() => {
            openModal({ type: "datasource", data: { containerId } });
          }}
        >
          <Icon type="plus" />
          <span>Add datasource</span>
        </div>
      </div>
    );
  }
}

export default connect()(DatasourceTab);
