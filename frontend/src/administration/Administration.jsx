import React, {Component} from 'react';
import { Route, Link } from "react-router-dom";
import Users from "./users/UserList";
import { Layout, Breadcrumb, Menu, Icon, Spin } from "antd";




const { Content, Sider } = Layout;
class Administration extends Component{
    state = { 
        fetching: false
    }
  

    render(){
        const { match, location, history } = this.props;
        const { fetching } = this.state
        const currentKey = location.pathname.split("/")[1].toLowerCase();
        return(
            <div>
        <Content className="wrapper">
          <Breadcrumb className="breadcrumbs">
            <Breadcrumb.Item>
              <Link to="/">Dashboard</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Admininstration</Breadcrumb.Item>
          </Breadcrumb>
        
        <Layout className="layout">
            <Content className="content">
                <Layout className="content_body">
                <Sider width={200}>
                    <Menu
                      mode="inline"
                      selectedKeys={[currentKey]}
                      style={{ height: "100%" }}
                    >
                      <Menu.Item key="back">
                        <Link to="/containers">
                          <Icon type="arrow-left" />
                          <span>Back to containers</span>
                        </Link>
                      </Menu.Item>

                      <Menu.Divider />

                      <Menu.Item key="administration">
                        <Link to={`/administration`}>
                        <Icon type="team" />
                        <span>Users</span>
                        </Link>
                      </Menu.Item>

                     
                    </Menu>

                  </Sider>
                  <Content className="content">

                      {fetching ? (
                    <Spin size="large" />
                  ) : (
                      <div>
                           <Route
                            path={`/administration`}
                            render={props => (
                              <Users
                                {...props}
                              />
                            )}
                          />
                      </div>

                  )
                  }


                  </Content>
                </Layout>
            </Content>
        </Layout>
          
        </Content>
            </div>
        )
    }
}
export default Administration;
