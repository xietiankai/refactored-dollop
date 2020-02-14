import * as React from "react";
import * as d3 from "d3";
import { findDOMNode } from "react-dom";
import { clusteringColors, graphEdgeColor, greenAndRed } from "../styles";
import "../components/css/InfluenceGraphView.css";
import { toolTipGenerator } from "../utils";

export default class InfluenceGraphView extends React.Component {
  componentDidMount() {
    // console.log("mount");
    this.initializeCanvas();
  }

  /***
   * Graph simulation when dragging the node
   * @param simulation {Object} d3 simulation
   * @returns {Function} d3 function
   */
  drag = simulation => {
    function dragStarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragEnded(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = d.x;
      d.fy = d.y;
    }

    return d3
      .drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded);
  };

  renderSvg(baseGroup, props) {
    const {
      perturbation,
      canvasWidth,
      canvasHeight,
      labels,
      removedID
    } = props;
    if (
      !perturbation ||
      perturbation["influence_graph_nodes"] === [] ||
      perturbation["influence_graph_edges"] === []
    )
      return;
    const circleRadius = 7;
    const tooltip = toolTipGenerator("#influence-graph-view");
    let nodesData = perturbation["influence_graph_nodes"];
    let edgesData = perturbation["influence_graph_edges"];

    /***
     * Graph simulation
     */
    const simulation = d3
      .forceSimulation(nodesData)
      .force(
        "link",
        d3
          .forceLink(edgesData)
          .id(d => {
            return d.node_id;
          })
          .distance(d => {
            return d.target.level * 72;
          })
      )
      .force("charge", d3.forceManyBody().strength(-1))
      .force("center", d3.forceCenter(canvasWidth / 2.3, canvasHeight / 2))
      .force("collision", d3.forceCollide(circleRadius + 5));

    const svg = baseGroup;

    /*****
     * Drawing Graphs
     */
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("markerUnits", "userSpaceOnUse")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("xoverflow", "visible")
      .append("svg:path")

      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#999")
      .style("stroke", "none");

    const edgeScale = d3
      .scaleLinear()
      .domain(d3.extent(edgesData, d => Math.abs(d.influence)))
      .range([1, 20]);

    const link = svg
      .append("g")
      .attr("class", "edges")
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(edgesData)
      .join("line")
      .attr("class", d => {
        let classString = "";
        if (d.influence > 0) {
          classString += "negative level-" + d.target.level;
        } else {
          classString += "positive level-" + d.target.level;
        }
        return classString;
      })
      .attr("stroke-width", d => {
        return edgeScale(Math.abs(d.influence));
      })
      .attr("stroke", d => {
        if (d.influence > 0) {
          return greenAndRed[0];
        } else {
          return greenAndRed[1];
        }
      })
      .attr("marker-end", "url(#arrowhead)");

    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodesData)
      .enter()
      .append("g");

    const nodeScale = d3
      .scaleLinear()
      .domain(d3.extent(nodesData, d => Math.abs(d.rank_change)))
      .range([6, 15]);

    const circles = node
      .append("circle")
      .attr("class", d => {
        let classString = "";
        if (d.level !== 0) {
          if (d.rank_change > 0) {
            classString += "negative level-" + d.level;
          } else {
            classString += "positive level-" + d.level;
          }
        } else {
          classString += "target level-0";
        }
        return classString;
      })
      .attr("id", d => "node-" + d.node_id)
      .attr(
        "fill",
        d => clusteringColors[labels["politicalStandpoint"][d.node_id]["value"]]
      )
      .attr("stroke", d => {
        if (d.level === 0) {
          return "black";
        } else {
          return "white";
        }
      })
      .attr("stroke-width", d => {
        if (d.level === 0) {
          return 3;
        } else {
          return 2;
        }
      })
      .attr("r", d => {
        if (d.level === 0) {
          return 25;
        } else {
          return nodeScale(Math.abs(d.rank_change));
        }
      })
      .call(this.drag(simulation))
      .on("click", d => {
        d.fx = null;
        d.fy = null;
      })
      .on("mousemove", function(d) {
        tooltip
          .style("left", () => {
            return d3.event.pageX + "px";
          })
          .style("top", () => {
            return d3.event.pageY - 50 + "px";
          })
          .style("display", "inline-block")
          .html(() => {
            return "<div>" + d.node_id + "</div>";
          });
      })
      .on("mouseout", function(d) {
        tooltip.style("display", "none");
      });

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)

        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      circles.attr("cx", d => d.x).attr("cy", d => d.y);
    });

    function zoomed() {
      svg.attr("transform", d3.event.transform);
    }

    const svgRoot = d3.select("#impact-graph-chart-" + removedID);

    // svgRoot.call(
    //   d3
    //     .zoom()
    //     .extent([
    //       [0, 0],
    //       [canvasWidth, canvasHeight]
    //     ])
    //     .scaleExtent([0, 8])
    //     .on("zoom", zoomed)
    // );

    /***
     * Lasso
     */
    // Lasso functions
    let lasso_start = function() {
      lasso
        .items()
        .attr("r", 3.5) // reset size
        .classed("not_possible", true)
        .classed("selected", false);
    };

    let lasso_draw = function() {
      // Style the possible dots
      lasso
        .possibleItems()
        .classed("not_possible", false)
        .classed("possible", true);

      // Style the not possible dot
      lasso
        .notPossibleItems()
        .classed("not_possible", true)
        .classed("possible", false);
    };

    let lasso_end = function() {
      // Reset the color of all dots
      lasso
        .items()
        .classed("not_possible", false)
        .classed("possible", false);

      // Style the selected dots
      lasso
        .selectedItems()
        .classed("selected", true)
        .attr("r", 7);

      // Reset the style of the not selected dots
      lasso.notSelectedItems().attr("r", 3.5);
    };

    let lasso = d3
      .lasso()
      .closePathSelect(true)
      .closePathDistance(100)
      .items(circles)
      .targetArea(svgRoot)
      .on("start", lasso_start)
      .on("draw", lasso_draw)
      .on("end", lasso_end);

    svgRoot.call(lasso);
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return false;
  }

  /**
   * Entry point
   * @returns None
   */
  initializeCanvas() {
    const { removedID, canvasHeight, canvasWidth } = this.props;

    const baseGroup = d3.select("#impact-graph-chart-base-" + removedID);
    this.renderSvg(baseGroup, this.props);
    /*****
     * Drawing Grids
     */
    const svg = d3.select("#impact-graph-chart-" + removedID);
    const x = d3
      .scaleLinear()
      .domain([-1, 1])
      .range([-1, canvasWidth]);
    const y = d3
      .scaleLinear()
      .domain([-1, 1])
      .range([canvasHeight, 0]);

    const xAxisGrid = d3
      .axisBottom(x)
      .tickSize(-canvasHeight)
      .tickFormat("")
      .ticks(100);
    const yAxisGrid = d3
      .axisLeft(y)
      .tickSize(-canvasWidth)
      .tickFormat("")
      .ticks(100);
    // Create grids.
    svg
      .append("g")
      .attr("class", "x axis-grid")
      .attr("transform", "translate(-3," + canvasHeight + ")")
      .call(xAxisGrid);
    svg
      .append("g")
      .attr("class", "y axis-grid")
      .attr("transform", "translate(-5,0)")
      .call(yAxisGrid);
    baseGroup.raise();
  }

  /***
   * When updating the props, according canvas needs to be updated.
   * Remove original canvas and draw a new one.
   * @param props {Object} from React.Component
   */
  updateCanvas(props) {
    const thisDOM = findDOMNode(this);
    const svgRoot = d3.select(thisDOM);
    let baseGroup = d3.select(thisDOM).select("#impact-graph-chart-base");
    baseGroup.remove();
    baseGroup = svgRoot.append("g").attr("id", "impact-graph-chart-base");
    this.renderSvg(baseGroup, props);
  }

  render() {
    const { canvasHeight, canvasWidth, removedID } = this.props;
    const svgID = "impact-graph-chart-" + removedID;
    const svgIDBase = "impact-graph-chart-base-" + removedID;
    return (
      <svg id={svgID} style={{ height: canvasHeight, width: canvasWidth }}>
        <g id={svgIDBase} style={{ height: "100%", width: "100%" }} />
      </svg>
    );
  }
}
