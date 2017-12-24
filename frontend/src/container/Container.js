import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Icon } from 'antd';

import { fetchContainers } from './ContainerActions';
import ContainerCreate from './ContainerCreate';
import ContainerUpdate from './ContainerUpdate';
import ContainerList from './ContainerList';


class Container extends React.Component {
  render() {
    const { containers } = this.props;

    return (
      <div>
        <h1>Containers</h1>
        <ContainerCreate />
        { containers.length > 0 ?
          <div>
            <ContainerUpdate/>
            <ContainerList containers={containers}/>
          </div>
        :
          <h2>
            <Icon type="info-circle-o" style={{marginRight: '10px'}}/>
            Get started by creating your first container.
          </h2>
        }
      </div>
    );
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fetchContainers());
  };

};

Container.propTypes = {
  dispatch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  containers: PropTypes.array.isRequired
}

const mapStateToProps = (state) => {
  const { isFetching, items: containers } = state.containers;
  return { 
    isFetching, 
    containers
  };
}

export default connect(mapStateToProps)(Container)
