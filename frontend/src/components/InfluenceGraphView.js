import * as React from "react";
import * as d3 from "d3";
import { findDOMNode } from "react-dom";
import { clusteringColors, graphEdgeColor } from "../styles";

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
    const { perturbation, canvasWidth, canvasHeight, labels } = props;
    if (
      !perturbation ||
      perturbation["influence_graph_nodes"] === [] ||
      perturbation["influence_graph_edges"] === []
    )
      return;
    const circleRadius = 13;
    console.log(perturbation);
    let nodesData = perturbation["influence_graph_nodes"];
    let edgesData = perturbation["influence_graph_edges"];

    console.log(nodesData);
    console.log(edgesData);
    const simulation = d3
      .forceSimulation(nodesData)
      .force(
        "link",
        d3
          .forceLink(edgesData)
          .id(d => {
            return d.node_id;
          })
          .distance(200)
      )
      .force("charge", d3.forceManyBody().strength(-10))
      .force("center", d3.forceCenter(canvasWidth / 2, canvasHeight / 2))
      .force("collision", d3.forceCollide(circleRadius + 25));

    const svg = baseGroup;

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 40)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#999")
      .style("stroke", "none");

    const link = svg
      .append("g")
      .attr("class", "edges")
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(edgesData)
      .join("line")
      .attr("stroke-width", 1)
      .attr("stroke", graphEdgeColor)
      .attr("marker-end", "url(#arrowhead)");

    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodesData)
      .enter()
      .append("g");

    const circles = node
      .append("circle")
      .attr("id", d => "node-" + d.node_id)
      .attr("fill", d => clusteringColors[labels["politicalStandpoint"][d.node_id]["value"]])

      .attr("stroke-width", 2)
      .attr("r", circleRadius)
      .call(this.drag(simulation))
      .on("click", d => {
        d.fx = null;
        d.fy = null;
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

    const svgRoot = d3.select("#impact-graph-chart");

    svgRoot.call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [canvasWidth, canvasHeight]
        ])
        .scaleExtent([0, 8])
        .on("zoom", zoomed)
    );
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return false;
  }

  /**
   * Entry point
   * @returns None
   */
  initializeCanvas() {
    const baseGroup = d3.select("#impact-graph-chart-base");
    // console.log(baseGroup);
    this.renderSvg(baseGroup, this.props);
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
    const { canvasHeight, canvasWidth } = this.props;
    return (
      <svg
        id="impact-graph-chart"
        style={{ height: canvasHeight, width: canvasWidth }}
      >
        <g
          id="impact-graph-chart-base"
          style={{ height: "100%", width: "100%" }}
        />
      </svg>
    );
  }
}
