import React from 'react';
// import { bindActionCreators } from 'redux';
// import { connect } from 'react-redux';
// import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Icon, Button, Modal, notification } from 'antd';

// import { fetchContainers } from './ContainerActions';

// import * as ContainerActionCreators from './ContainerActions';

// const confirm = Modal.confirm;


class Workflow extends React.Component {
  // constructor(props) { 
  //   super(props);
  //   const { dispatch } = props;

  //   // this.boundActionCreators = bindActionCreators(ContainerActionCreators, dispatch)
  // }

  // componentWillReceiveProps(nextProps) {
  //   const { dispatch } = this.props;
  // }

  render() {
    // const { 
    //   containers, dispatch
    // } = this.props;

    return (
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1em'}}>
        <Link to="/containers"><Button shape="circle" icon="arrow-left" style={{marginRight: '10px'}}/></Link>
        <h1 style={{display: 'inline-block', margin: 0}}>Workflow wow!</h1>
      </div>
    );
  };

  // componentDidMount() {
  //   const { dispatch } = this.props;
  //   // dispatch(fetchContainers());
  // };

};

// Workflow.propTypes = {
//   dispatch: PropTypes.func.isRequired,
//   // containers: PropTypes.array.isRequired
// }

// const mapStateToProps = (state) => {
//   const { 
//     isFetching
//   } = state.workflow;
//   return { 
//     isFetching
//   };
// }

export default Workflow;

// export default connect(mapStateToProps)(Workflow)
