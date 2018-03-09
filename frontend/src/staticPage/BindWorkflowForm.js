import React from 'react';
import { Collapse, Radio, Button, notification } from 'antd';
import './staticPage.css';
const RadioGroup = Radio.Group;
const Panel = Collapse.Panel;

class BindWorkflowForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    onChange = (e) => {
        this.setState({
            value: e.target.value,
        });
    }

    onClick = (onBind, linkId) => {
        onBind(linkId, this.state.value);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.bindWorkflowSuccess) {
            notification['success']({
                message: 'Workflow bound',
                description: 'Workflow has been successfully bound.'
            });
        }
    }

  render(){
    const {
        containers, onBind, linkId, bindWorkflowSuccess
    } = this.props;

    const radioStyle = {
        display: 'block',
        height: '30px',
        lineHeight: '30px',
    };

    return( 
        <div style={{justifyContent: 'center', display: 'flex'}}>
            <div style={{width: '70%', flexDirection: 'column', display: 'flex', 
                        backgroundColor: 'white', margin: '10px', borderRadius: '5px'}}>
            <RadioGroup onChange={this.onChange} value={this.state.value} style={{margin: '20px'}}>
                <Collapse accordion>
                        {containers.map((container, key)=>{
                            return(
                                <Panel header={container.code} key={key}>
                                    {container.workflows.map((workflow, i)=>{
                                        return(
                                            <Radio key={i} style={radioStyle} value={workflow.id}>{workflow.name}</Radio>
                                        );
                                    })}
                                </Panel>
                            );
                        })}
                </Collapse>
            </RadioGroup>
            <Button type="primary" onClick={()=>this.onClick(onBind, linkId)} style={{width: '80px', alignSelf: 'right', marginBottom: '20px', marginRight: '20px'}}>Bind</Button>
            </div>
        </div>
    );}
}

export default BindWorkflowForm;