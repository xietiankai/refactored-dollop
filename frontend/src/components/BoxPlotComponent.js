import * as React from "react";
import { Box, Typography } from "@material-ui/core";
import { FlexibleWidthXYPlot, LineSeries, XAxis, YAxis } from "react-vis";
import BoxPlot from "./BoxPlot";
import { clusteringColors } from "../styles";
import { connect } from "react-redux";
import { withStyles } from "@material-ui/styles";
import {
  snackBarClose,
  updateAlgorithmName,
  updateConstraints,
  updateDataName,
  updateProtectionExtent,
  updateProtectionType
} from "../actions";

const styles = theme => ({
  boxPlotContainer: {
    padding: theme.spacing(2)
  }
});

const mapStateToProps = state => {
  return {
    nodes: state.nodes,
    labels: state.labels
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

class BoxPlotComponent extends React.Component {
  render() {
    let boxPlotData = {};
    let boxPlotDataAfter = {};
    const tempLabelHashMap = this.props.labels[
      Object.keys(this.props.labels)[0]
    ];

    this.props.perturbation.map(item => {
      let rankArraysAfter = [];

      if (tempLabelHashMap[item["node_id"]]["value"] in boxPlotDataAfter) {
        rankArraysAfter =
          boxPlotDataAfter[tempLabelHashMap[item["node_id"]]["value"]];
      }

      rankArraysAfter.push(item["rank"]);
      boxPlotDataAfter[
        tempLabelHashMap[item["node_id"]]["value"]
      ] = rankArraysAfter;
    });

    Object.keys(this.props.nodes).map(key => {
      let rankArrays = [];
      if (tempLabelHashMap[key]["value"] in boxPlotData) {
        rankArrays = boxPlotData[tempLabelHashMap[key]["value"]];
      }
      rankArrays.push(this.props.nodes[key]["rank"]);
      boxPlotData[tempLabelHashMap[key]["value"]] = rankArrays;
    });

    function numSort(a, b) {
      return a - b;
    }

    function getPercentile(data, percentile) {
      data.sort(numSort);
      let index = (percentile / 100) * data.length;
      let result;
      if (Math.floor(index) === index) {
        result = (data[index - 1] + data[index]) / 2;
      } else {
        result = data[Math.floor(index)];
      }
      return result;
    }

    let boxPlotDataUltimate = {};

    Object.keys(boxPlotData).map(key => {
      let tempArray = [];
      if (key in boxPlotDataUltimate) {
        tempArray = boxPlotDataUltimate[key];
      }
      tempArray.push({
        x: 0,
        y: getPercentile(boxPlotData[key], 50),
        yHigh: Math.max.apply(Math, boxPlotData[key]),
        yOpen: getPercentile(boxPlotData[key], 25),
        yClose: getPercentile(boxPlotData[key], 75),
        yLow: Math.min.apply(Math, boxPlotData[key]),
        color: clusteringColors[key],
        opacity: 0.7
      });
      boxPlotDataUltimate[key] = tempArray;
    });

    console.log("boxplotdataafter");
    console.log(boxPlotDataAfter);
    Object.keys(boxPlotDataAfter).map(key => {
      let tempArray = [];
      if (key in boxPlotDataUltimate) {
        tempArray = boxPlotDataUltimate[key];
      }
      tempArray.push({
        x: 1,
        y: getPercentile(boxPlotDataAfter[key], 50),
        yHigh: Math.max.apply(Math, boxPlotDataAfter[key]),
        yOpen: getPercentile(boxPlotDataAfter[key], 25),
        yClose: getPercentile(boxPlotDataAfter[key], 75),
        yLow: Math.min.apply(Math, boxPlotDataAfter[key]),
        color: clusteringColors[key],
        opacity: 0.7
      });
      boxPlotDataUltimate[key] = tempArray;
    });
    let boxPlotComponents = Object.keys(boxPlotDataUltimate).map(key => {
      return (
        <Box display={"inline-flex"}>
          <Box justifyContent="center">
            <FlexibleWidthXYPlot
              animation
              yDomain={[Object.keys(this.props.nodes).length, 0]}
              xDomain={[-1, 2]}
              height={200}
              width={170}
            >
              <YAxis />
              <LineSeries color="#12939A" data={boxPlotDataUltimate[key]} />
              <BoxPlot
                colorType="literal"
                opacityType="literal"
                stroke="#79C7E3"
                data={boxPlotDataUltimate[key]}
              />
            </FlexibleWidthXYPlot>
            <Typography align={"center"}>Rank Distribution Change</Typography>
          </Box>
        </Box>
      );
    });
    return (
      <Box className={this.props.classes.boxPlotContainer}>
        {boxPlotComponents}
      </Box>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(BoxPlotComponent));
