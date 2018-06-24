import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Input, Icon, Tooltip, Button, Card } from "antd";
import { Link } from "react-router-dom";

import * as ContainerActionCreators from "../ContainerActions";

const { Meta } = Card;

class DataLabTab extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      ContainerActionCreators,
      dispatch
    );

    this.state = { filter: null };
  }

  render() {
    const { containerId, dataLabs } = this.props;
    const { filter } = this.state;

    return (
      <div className="tab">
        {dataLabs &&
          dataLabs.length > 0 && (
            <div className="filter_wrapper">
              <div className="filter">
                <Input
                  placeholder="Filter DataLabs by name"
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

        {dataLabs &&
          dataLabs.map((dataLab, i) => {
            if (filter && !dataLab.name.includes(filter)) return null;

            return (
              <Card
                className="item"
                bodyStyle={{ flex: 1 }}
                title={dataLab.name}
                actions={[
                  <Link to={{ pathname: `/datalab/${dataLab.id}/data` }}>
                    <Tooltip title="Edit DataLab">
                      <Button icon="arrow-right" />
                    </Tooltip>
                  </Link>,
                  <Tooltip title="Delete DataLab">
                    <Button
                      type="danger"
                      icon="delete"
                      onClick={() => {
                        this.boundActionCreators.deleteView(dataLab.id);
                      }}
                    />
                  </Tooltip>
                ]}
                key={i}
              >
                <Meta
                  description={
                    <div>
                      {`${dataLab.steps.length} ${
                        dataLab.steps.length > 1 ? "modules" : "module"
                      }`}
                    </div>
                  }
                />
              </Card>
            );
          })}
        <Link
          to={{
            pathname: `/datalab`,
            state: { containerId }
          }}
        >
          <div className="add item">
            <Icon type="plus" />
            <span>Create DataLab</span>
          </div>
        </Link>
      </div>
    );
  }
}

export default connect()(DataLabTab);
