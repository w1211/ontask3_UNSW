import React from "react";
import {
  Modal,
  Select,
  Form,
  Checkbox,
  Divider,
  InputNumber,
  Button
} from "antd";
import * as d3 from "d3";
import memoize from "memoize-one";
import _ from "lodash";

import Highcharts from "highcharts";
import addHighchartsMore from "highcharts/highcharts-more";
import addHistogramModule from "highcharts/modules/histogram-bellcurve";
import HighchartsReact from "highcharts-react-official";

addHistogramModule(Highcharts);
addHighchartsMore(Highcharts);
Highcharts.setOptions({ credits: false });

const FormItem = Form.Item;
const { Option } = Select;

class VisualisationModal extends React.Component {
  state = {
    chartType: "barChart",
    colNameSelected: null,
    interval: 5,
    range: null,
    groupByCol: null,
    numBins: null,
    visibleField: null,
    onSameChart: false,
    percentageAxis: false,
    selections: [],
    filterCols: []
  };

  chartKey = 0;

  type = memoize(label => {
    const { columns } = this.props;
    return columns.find(column => column.details.label === label).details.type
  });

  transformData = memoize((column, chartType, plotBy, showPercentage) => {
    const { data } = this.props;

    // If this function is being called with new parameters (i.e. cache is busted)
    // then increment the chart key. This will force any highcharts on the page to
    // be destroyed and re-rendered, given that they have key={this.chartKey} set.
    this.chartKey++;

    const extras = {};

    let transformedData;
    if (["histogram", "boxPlot"].includes(chartType)) {
      transformedData = data.map(item => parseFloat(item[column])).sort();
    } else {
      transformedData = d3.nest();
      if (plotBy) transformedData = transformedData.key(item => item[plotBy]);
      transformedData = transformedData
        .key(item => item[column])
        .rollup(group => ({ count: group.length }))
        .entries(data);
    }

    if (chartType === "barChart") {
      if (plotBy) {
        extras.categories = transformedData.map(item => item.key);

        const temp = {};
        transformedData.forEach(group => {
          group.values.forEach(item => {
            if (!(item.key in temp))
              temp[item.key] = [].fill.call(
                { length: extras.categories.length },
                0
              );

            temp[item.key][
              extras.categories.indexOf(group.key)
            ] = showPercentage
              ? (item.value.count / data.length) * 100
              : item.value.count;
          });
        });

        transformedData = Object.entries(temp).map(item => ({
          name: item[0],
          data: item[1]
        }));
      } else {
        transformedData = transformedData.map(item => [
          item.key,
          showPercentage
            ? (item.value.count / data.length) * 100
            : item.value.count
        ]);
      }
    }

    if (chartType === "pieChart")
      transformedData = transformedData.map(i => ({
        name: i.key,
        y: i.value.count
      }));

    return [transformedData, extras];
  });

  handleCancel = () => {
    const { closeModal } = this.props;

    closeModal();
  };

  barChart = data => {
    const { form } = this.props;
    const { column, percentage } = form.getFieldsValue();

    return (
      <HighchartsReact
        key={this.chartKey}
        highcharts={Highcharts}
        options={{
          chart: { type: "column" },
          title: null,
          series: [{ name: column, data }],
          legend: {
            enabled: false
          },
          xAxis: {
            type: "category",
            title: {
              text: column
            }
          },
          yAxis: {
            title: {
              text: "Count"
            },
            labels: {
              format: percentage ? "{value:.2f}%" : "{value}"
            }
          },
          tooltip: {
            pointFormat: percentage
              ? "Count: <b>{point.y:.2f}%</b>"
              : "Count: <b>{point.y}</b>"
          }
        }}
      />
    );
  };

  groupedBarChart = (data, extras) => {
    const { form } = this.props;
    const { column, plotBy, percentage } = form.getFieldsValue();

    return (
      <HighchartsReact
        key={this.chartKey}
        highcharts={Highcharts}
        options={{
          chart: { type: "column" },
          title: null,
          series: data,
          legend: {
            enabled: true
          },
          xAxis: {
            title: {
              text: plotBy
            },
            categories: extras.categories
          },
          yAxis: {
            title: {
              text: `Count (${column})`
            },
            labels: {
              format: percentage ? "{value:.2f}%" : "{value}"
            }
          },
          plotOptions: {
            column: {
              stacking: "normal"
            }
          },
          tooltip: {
            shared: true,
            pointFormatter: function() {
              if (this.options.y)
                return `<span style="color:${
                  this.series.color
                };">\u25CF</span> ${this.series.name}: <b>${
                  percentage ? `${this.options.y.toFixed(2)}%` : this.options.y
                }</b><br/>`;
            }
          }
        }}
      />
    );
  };

  pieChart = data => {
    const { form } = this.props;
    const { column } = form.getFieldsValue();

    return (
      <HighchartsReact
        key={this.chartKey}
        highcharts={Highcharts}
        options={{
          chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: "pie"
          },
          title: {
            text: column
          },
          series: [{ name: column, colorByPoint: true, data }],
          plotOptions: {
            pie: {
              dataLabels: {
                enabled: true,
                format: "<b>{point.name}</b>: {point.percentage:.2f} %",
                style: {
                  color:
                    (Highcharts.theme && Highcharts.theme.contrastTextColor) ||
                    "black"
                }
              }
            }
          },
          tooltip: {
            pointFormat: "Count: <b>{point.percentage:.2f}%</b>"
          }
        }}
      />
    );
  };

  histogram = data => {
    const { form } = this.props;
    const { binsNumber } = form.getFieldsValue();

    return (
      <HighchartsReact
        key={this.chartKey}
        highcharts={Highcharts}
        options={{
          title: {
            text: null
          },
          legend: false,
          xAxis: [
            {
              title: { text: "Data" },
              alignTicks: false
            },
            {
              title: { text: "Histogram" },
              alignTicks: false,
              opposite: true
            }
          ],
          yAxis: [
            {
              title: { text: "Data" }
            },
            {
              title: { text: "Histogram" },
              opposite: true
            }
          ],
          plotOptions: {
            histogram: {
              binsNumber
            }
          },
          series: [
            {
              name: "Histogram",
              type: "histogram",
              xAxis: 1,
              yAxis: 1,
              baseSeries: "dataSeries",
              tooltip: {
                pointFormat: `
                  <span style="font-size:10px">
                    {point.x:.2f} - {point.x2:.2f}
                  </span>
                  <br/>
                  <span style="color:{point.color}">
                    \u25CF
                  </span>
                  {series.name} <b>{point.y}</b>`
              }
            },
            {
              name: "Data",
              type: "scatter",
              data,
              id: "dataSeries",
              marker: {
                radius: 1.5
              }
            }
          ]
        }}
      />
    );
  };

  boxPlot = data => {
    const { form } = this.props;
    const { column } = form.getFieldsValue();

    return (
      <HighchartsReact
        key={this.chartKey}
        highcharts={Highcharts}
        options={{
          chart: {
            type: "boxplot"
          },
          title: {
            text: null
          },
          legend: false,
          xAxis: {
            categories: [null],
            title: {
              text: column
            }
          },
          yAxis: {
            title: {
              text: null
            }
          },
          series: [
            {
              type: "boxplot",
              name: column,
              data: [
                {
                  low: 4,
                  q1: 1,
                  median: 9,
                  q3: 9,
                  high: 10
                }
              ]
            }
          ]
        }}
      />
    );
  };

  renderGraph(data, extras) {
    const { form } = this.props;
    const { type, plotBy } = form.getFieldsValue();

    if (type === "barChart") {
      if (plotBy) return this.groupedBarChart(data, extras);
      return this.barChart(data);
    }

    if (type === "pieChart") return this.pieChart(data);

    if (type === "histogram") return this.histogram(data);

    if (type === "boxPlot") return this.boxPlot(data, extras);
  }

  onColumnChange = column => {
    const { form } = this.props;
    const { getFieldValue, setFieldsValue, resetFields } = form;

    const fieldType = this.type(column);
    const chartType = getFieldValue("type");

    if (chartType === "histogram") resetFields(["binsNumber", "binWidth"]);

    if (fieldType === "number" && chartType === "barChart")
      setFieldsValue({ type: "histogram" });

    if (fieldType !== "number" && ["histogram", "boxPlot"].includes(chartType))
      setFieldsValue({ type: "barChart" });
  };

  render() {
    const { visible, columns, form, chart } = this.props;
    const {
      getFieldDecorator,
      getFieldsValue,
      getFieldValue,
      setFieldsValue
    } = form;

    const columnFormField = getFieldDecorator("column", {
      rules: [{ required: true }],
      initialValue: _.get(chart, "column", Object.keys(this.props.data[0])[0]),
      onChange: this.onColumnChange
    })(
      <Select style={{ minWidth: 135 }}>
        {columns.map(column => (
          <Option key={column.details.label} value={column.details.label}>
            {column.details.label}
          </Option>
        ))}
      </Select>
    );

    const typeFormField = getFieldDecorator("type", {
      rules: [{ required: true }],
      initialValue: _.get(
        chart,
        "type",
        this.type(Object.keys(this.props.data[0])[0]) === "number"
          ? "histogram"
          : "barChart"
      )
    })(
      <Select
        style={{ width: 135 }}
        onChange={() => setFieldsValue({ plotBy: null })}
      >
        {this.type(getFieldValue("column")) === "number" ? (
          <Option value="histogram">Histogram</Option>
        ) : (
          <Option value="barChart">Bar chart</Option>
        )}
        <Option value="pieChart">Pie chart</Option>
        {/* <Option value="table">Table</Option> */}
        {this.type(getFieldValue("column")) === "number" && (
          <Option value="boxPlot" disabled>
            Box plot
          </Option>
        )}
      </Select>
    );

    const plotByFormField = getFieldDecorator("plotBy", {
      initialValue: _.get(chart, "plotBy")
    })(
      <Select style={{ width: 135 }} allowClear>
        {columns.map(column => (
          <Option key={column.details.label} value={column.details.label}>
            {column.details.label}
          </Option>
        ))}
      </Select>
    );

    const percentageFormField = getFieldDecorator(`percentage`, {
      initialValue: _.get(chart, "percentage", false),
      valuePropName: "checked"
    })(<Checkbox />);

    const { column, type, plotBy, percentage } = getFieldsValue();
    const [data, extras] = this.transformData(column, type, plotBy, percentage);

    const binsNumberFormField = getFieldDecorator("binsNumber", {
      initialValue: _.get(
        chart,
        "binsNumber",
        Math.round(Math.sqrt(data.length))
      )
    })(
      <InputNumber
        min={1}
        precision={0}
        onChange={e => {
          this.chartKey++;
          setFieldsValue({
            binWidth: (Math.max(...data) - Math.min(...data)) / e
          });
        }}
      />
    );

    const binWidthFormField = getFieldDecorator(`binWidth`, {
      initialValue: _.get(
        chart,
        "binWidth",
        (Math.max(...data) - Math.min(...data)) / getFieldValue("binsNumber")
      )
    })(
      <InputNumber
        min={0}
        precision={2}
        onChange={e => {
          this.chartKey++;
          setFieldsValue({
            binsNumber: Math.round((Math.max(...data) - Math.min(...data)) / e)
          });
        }}
      />
    );

    return (
      <Modal
        width={600}
        visible={visible}
        title="Visualise"
        onCancel={this.handleCancel}
        // onOk={()=>{this.handleSubmit(colNameSelected)}}
        okText="Save"
        cancelText="Close"
        footer={<Button onClick={this.handleCancel}>Close</Button>}
      >
        <Form layout="horizontal" style={{ display: "flex", flexWrap: "wrap" }}>
          <FormItem
            label="Column"
            className="no-explain"
            style={{ display: "flex", margin: "0 15px 0 0" }}
          >
            {columnFormField}
          </FormItem>

          <FormItem
            label="Chart type"
            style={{ display: "flex", margin: "0 15px 0 0" }}
          >
            {typeFormField}
          </FormItem>

          {getFieldValue("type") === "barChart" && (
            <div style={{ display: "flex", flexDirection: "wrap" }}>
              <FormItem
                label="Plot by"
                style={{ display: "flex", margin: "0 15px 0 0" }}
              >
                {plotByFormField}
              </FormItem>

              <FormItem
                label="Show percentage"
                style={{ display: "flex", margin: "0 15px 0 0" }}
              >
                {percentageFormField}
              </FormItem>
            </div>
          )}

          {getFieldValue("type") === "histogram" && (
            <div style={{ display: "flex", flexDirection: "wrap" }}>
              <FormItem
                label="Bins"
                style={{ display: "flex", margin: "0 15px 0 0" }}
              >
                {binsNumberFormField}
              </FormItem>

              <FormItem
                label="Bin width"
                style={{ display: "flex", margin: "0 15px 0 0" }}
              >
                {binWidthFormField}
              </FormItem>
            </div>
          )}
        </Form>

        <Divider />

        {this.renderGraph(data, extras)}
      </Modal>
    );
  }
}

export default Form.create()(VisualisationModal);
