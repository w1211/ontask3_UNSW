import React, { Component } from "react";
import { Table, Input, Button, Icon, Select, Form, notification } from "antd";
import apiRequest from "../../shared/apiRequest";
import "./UserList.css";
// import { NavLink, Link } from "react-router-dom";

const groupsHierarchy = {
  admin: 3,
  instructor: 2,
  user: 1
};

class GroupSelect extends Component {
  constructor(props) {
    super(props);
    const { record } = this.props;

    this.state = {
      value: record.group,
      editing: false
    };
  }

  handleSubmit = (value) => {
    const {record, updateRecord} = this.props

    this.setState({ value });
    this.select.blur();
    updateRecord(value);

    const url = `/administration/users/${record.id}/new-group/`;
    const payload = {group_name: value}
    apiRequest(url, {
      method: "POST",
      payload,
      onSuccess: res => {
        notification['success']({
          message: res.message,
          description: 'The User data is updated.',
        });
      },
      onError: res => {
        notification['error']({
          message: res.message,
          description: 'The User data is not updated.',
        });
        this.setState({value: record.group})
        updateRecord(record.group)
      }
    });
  };

  render() {
    const { editing, value } = this.state;

    return (
      <div
        className={`editable ${editing ? "is-editing" : "is-not-editing"}`}
        onClick={() => {
          this.setState({ editing: true });
        }}
      >
        {editing ? (
          <Select
            style={{ width: "100%" }}
            autoFocus
            onChange={value => {
              this.handleSubmit(value)
            }}
            value={value}
            defaultOpen={true}
            ref={ref => (this.select = ref)}
            onBlur={() => this.setState({ editing: false })}
          >
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="instructor">Instructor</Select.Option>
            <Select.Option value="user">User</Select.Option>
          </Select>
        ) : (
          value
        )}
      </div>
    );
  }
}

class UsersList extends Component {
  state = {
    usersList: [],
    pagination: {},
    searchTerm: "",
    loading: false
  };

  componentDidMount() {
    this.getUsers();
  }

  handleSearch = (selectedKeys, confirm) => {
    confirm();
    this.setState({ searchText: selectedKeys[0] });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: "" });
  };

  findKeys = (object, hierarchy) => {
    return Object.keys(object).find(
      key => object[key] === Math.max(...hierarchy)
    );
  };

  ///////////////////// Search ///////////////////////
  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters
    }) => {
      const searchPlaceholder = {
        displayName: "name"
      };

      return (
        <div style={{ padding: 8 }}>
          <Input
            ref={node => {
              this.searchInput = node;
            }}
            placeholder={`Search ${
              dataIndex in searchPlaceholder
                ? searchPlaceholder[dataIndex]
                : dataIndex
            }`}
            value={selectedKeys[0]}
            onChange={e =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button
            type="primary"
            onClick={() => this.handleSearch(selectedKeys, confirm)}
            icon="search"
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Search
          </Button>
          <Button
            onClick={() => this.handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
      );
    },
    filterIcon: filtered => (
      <Icon type="search" style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    }
  });

  ///////////////////// Pagination ///////////////////////
  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager
    });
    this.getUsers({
      results: pagination.pageSize,
      page: pagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters
    });
  };

  ///////////////////// GET USERS ///////////////////////
  getUsers = (params = {}) => {
    this.setState({ loading: true });
    if (!params.page) {
      params.page = 1;
    }
    const url = `/administration/users/?page=${params.page}`;
    apiRequest(url, {
      method: "GET",
      onSuccess: res => {
        const pagination = { ...this.state.pagination };
        pagination.total = res.count;
        this.setState({
          loading: false,
          usersList: res.results,
          pagination
        });
      },
      onError: () => this.setState({ loading: false })
    });
  };

  ///////////////////// User Impersonation ///////////////////////
  handleImpersonation = username => {};

  ///////////////////// Global search ///////////////////////
  handleGlobalSearch = e => {
      const query = e.target.value
      this.setState({ loading: true });
      if (!query){
        this.getUsers()
        this.setState({ searchTerm: '' })
        
        return;
      }
      const url = `/administration/user-search/?q=${query}`
      apiRequest(url, {
        method: "GET",
        onSuccess: res => {
          this.setState({
            loading: false,
            usersList: res
          })
        },
        onError: res => {
          this.setState({ loading: false })
        }
      })
  }

  ///////////////////// Render ///////////////////////
  render() {
    const { searchTerm } = this.state;
    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
        ...this.getColumnSearchProps("name")
      },
      {
        title: "Email",
        key: "email",
        dataIndex: "email",
        sorter: (a, b) => a.email.localeCompare(b.email),
        ...this.getColumnSearchProps("email")
      },
      {
        title: "Group",
        key: "group",
        dataIndex: "group",
        editable: true,
        filters: [
          {
            text: "Admin",
            value: "admin"
          },
          {
            text: "Instructor",
            value: "instructor"
          },
          {
            text: "User",
            value: "user"
          },
        ],
        onFilter: (value, record) => {
          return record.group === value
        },
        sorter: (a, b) => a.group.localeCompare(b.group),
        render: (text, record, index) => {
          return (
            <GroupSelect
              record={record}
              updateRecord={value => {
                const updatedRecord = data[index];
                updatedRecord.group = value;
                data[index] = updatedRecord;
                this.setState({ data });
              }}
            />
          );
        }
      }
    ];

    const data = this.state.usersList.map((user, index) => {
      const hierarchy = user.groups.map(group => {
        return groupsHierarchy[group.name];
      });
      const group = this.findKeys(groupsHierarchy, hierarchy);
      const user_data = {
        key: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        group
      };

      return user_data;
    });

    const term = searchTerm.trim().toLowerCase();

    const tableData =
      term === ""
        ? data
        : data.filter(row =>
            String(Object.values(row))
              .toLowerCase()
              .includes(term)
          );

    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <h2>All Users</h2>
          <Input.Search
            placeholder="Quick Search"
            onChange={e => this.handleGlobalSearch(e)}//this.setState({ searchTerm: e.target.value })}
            style={{ width: 200, height: 30 }}
          />
        </div>
        <Table
          bordered
          dataSource={tableData}
          rowKey={record => record.id}
          columns={columns}
          loading={this.state.loading}
          pagination={this.state.pagination}
          onChange={this.handleTableChange}
          size="small"
          scroll={{ x: 1 }}
        />
      </div>
    );
  }
}

export default UsersList;
