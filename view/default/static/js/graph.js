/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/17/17.
 */

function tooltipHtml(d) {
  var html = "";
  if (d.data.__string) {
    html += d.data.__string;
  }
  return html;
}

var margin = {top: 20, right: 90, bottom: 30, left: 90},
  width = window.innerWidth - (margin.left * 2) - (margin.right * 2),
  height = window.innerHeight - (margin.top * 2) - (margin.bottom * 2);

var color = d3.scaleOrdinal(d3.schemeCategory20);

var div = d3.select("body").append("div")
  .attr('class', 'tooltip')
  .style("position", "absolute")
  .style("z-index", "10")
  .style("visibility", "hidden")
  .style('max-width', '200px')
  .text("");

var svg = d3.select("div#graph").append("svg")
  .attr("width", width)
  .attr("height", height);

svg.append("defs").append("marker")
  .attr("id", "arrow")
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 20)
  .attr("refY", 0)
  .attr("markerWidth", 8)
  .attr("markerHeight", 8)
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", "M0,-5L10,0L0,5");

var simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(function(){ return width * 0.1; }))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width /2 , height /2 ));

  var link = svg.append("g")
    .style("stroke", "#aaa")
    .selectAll("line")
    .data(treeData.links)
    .enter()
    .append("line")
    .attr("marker-end", "url(#arrow)");

  var nodeEnter = svg.append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(treeData.nodes)
    .enter();

  nodeEnter.each(function(d) {
    var enter = d3.select(this);
    var node;
    if (d.html) {
      node = enter.append('foreignObject')
        .attr("class", "graph-node")
        .attr('width', 10)
        .attr('height', 10)
        .html(d.html);   
    } else {
      node = enter.append("circle")
        .attr("class", "graph-node")
        .attr("r", 10)
        .attr("fill", function(d){return color(d.data.className);})
    }
    node
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on('mouseover', function(d){
        var html = d.tooltip || tooltipHtml(d);
        if (html) {
          div.html('<div>'+html+'</div>').style("visibility", "visible");
        }
      })
      .on('mousemove', function(d){
        div.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on('mouseout', function(d){
        div.style("visibility", "hidden");
      });
  });


  var label = svg.append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(treeData.nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("text-anchor", "start")
    .text(function(d) { return d.name; });

  simulation
    .nodes(treeData.nodes)
    .on("tick", ticked);

  simulation.force("link")
    .links(treeData.links);

  function ticked() {
    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    d3.selectAll("foreignObject.graph-node")
      .attr("x", function (d) { return d.x; })
      .attr("y", function(d) { return d.y; });

    d3.selectAll("circle.graph-node")
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
    
    label
      .attr("x", function(d) { return d.x + 20; })
      .attr("y", function (d) { return d.y; });
  }


function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}
