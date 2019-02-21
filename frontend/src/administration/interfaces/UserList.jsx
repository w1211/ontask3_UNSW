import React, { Component } from "react";
import { Table, Input, Button, Icon, Select, Spin, notification } from "antd";
import apiRequest from "../../shared/apiRequest";
import "./UserList.css";

const groupsHierarchy = {
  admin: 3,
  instructor: 2,
  user: 1
};

const groupLabelMap = {
  admin: "Admin",
  instructor: "Instructor",
  user: "User"
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

  handleSubmit = value => {
    const { record, updateRecord } = this.props;

    this.setState({ value });
    this.select.blur();
    updateRecord(value);

    const payload = { group: value };
    apiRequest(`/administration/user/${record.id}/change-group/`, {
      method: "PUT",
      payload,
      onSuccess: () => {
        notification["success"]({
          message: "Group successfully updated"
        });
      },
      onError: error => {
        notification["error"]({
          message: "Group update failed",
          description: error.message
        });
        this.setState({ value: record.group });
        updateRecord(record.group);
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
              this.handleSubmit(value);
            }}
            value={value}
            defaultOpen={true}
            ref={ref => (this.select = ref)}
            onBlur={() => this.setState({ editing: false })}
          >
            {["admin", "instructor", "user"].map(group => (
              <Select.Option value={group}>
                {groupLabelMap[group]}
              </Select.Option>
            ))}
          </Select>
        ) : (
          groupLabelMap[value]
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
    fetching: true,
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

  getUsers = (params = { page: 1 }) => {
    const { history, showNavigation } = this.props;

    apiRequest(`/administration/user/?page=${params.page}`, {
      method: "GET",
      onSuccess: res => {
        this.setState({
          usersList: res.results,
          pagination: { ...this.state.pagination, total: res.count }
        });
        this.setState({ fetching: false, loading: false });
        showNavigation();
      },
      onError: (error, status) => {
        if (status === 403) {
          history.replace("/forbidden");
        } else {
          this.setState({ fetching: false });
        }
      }
    });
  };

  handleImpersonation = username => {};

  handleGlobalSearch = e => {
    const query = e.target.value;
    this.setState({ loading: true });

    if (!query) {
      this.getUsers();
      this.setState({ searchTerm: "" });

      return;
    }

    apiRequest(`/administration/user/search/?q=${query}`, {
      method: "GET",
      onSuccess: res => {
        this.setState({
          loading: false,
          usersList: res
        });
      },
      onError: res => {
        this.setState({ loading: false });
      }
    });
  };

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
          }
        ],
        onFilter: (value, record) => {
          return record.group === value;
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
        name: `${user.first_name} ${user.last_name}`,
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

    return this.state.fetching ? (
      <Spin size="large" />
    ) : (
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
            onChange={e => this.handleGlobalSearch(e)} //this.setState({ searchTerm: e.target.value })}
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
