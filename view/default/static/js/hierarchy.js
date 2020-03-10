/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/3/17.
 */

(function(){

  var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = window.innerWidth - (margin.left * 2) - (margin.right * 2),
    height = window.innerHeight - (margin.top * 2) - (margin.bottom * 2);

  var svgWrapper = d3.select("div#graph").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

  var svg = svgWrapper.append("g")
    .attr("transform", "translate("
      + margin.left + "," + margin.top + ")");

  var i = 0, duration = 750, root;

  var treemap = d3.tree().size([width, height]);

  root = d3.hierarchy(treeData, function(d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  update(root);

  function update(source) {

    var treeData = treemap(root);
    var maxWidth = 0, maxHeight = 0, maxDepth = 0;

    var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

    var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.x0 + "," + source.y0 + ")";
      });

    nodeEnter.each(function(d){
      if (d.depth > maxDepth) {
        maxDepth = d.depth;
      }

      var enter = d3.select(this);
      if (d.data && d.data.html) {
        enter
          .append('foreignObject')
          .attr('width', 10)
          .attr('height', 10)
          .attr('x', 0)
          .attr('y', 0)
          .html(d.data.html);
      } else {
        enter
          .append('circle')
          .attr('class', 'node')
          .attr('r', 1e-6)
          .style("fill", d._children ? "lightsteelblue" : "#fff");
        enter
          .append('text')
          .attr("dy", ".35em")
          .attr("x", function(d) {
            return d.children || d._children ? -13 : 13;
          })
          .attr("text-anchor", "start")
          .text(function(d) { return d.data.name; });
      }
    });

    var nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.select('foreignObject')
      .each(function(d){
        var fo = d3.select(this);
        var childs = d3.selectAll(this.childNodes);
        var maxFoWidth = 0;
        var maxFoHeight = 0;
        childs.each(function(d){
          var node = d3.select(this).node();
          if (node.getBoundingClientRect) {
            var box = node.getBoundingClientRect();
            if (box && box.width && box.width > maxFoWidth) {
              maxFoWidth = box.width;
            }
            if (box && box.height && box.height > maxFoHeight) {
              maxFoHeight = box.height;
            }         
          }
        });
        d.maxWidth = maxFoWidth;
        d.maxHeight = maxFoHeight;
        if (d.maxWidth > maxWidth) {
          maxWidth = d.maxWidth;
        }
        if (d.maxHeight > maxHeight) {
          maxHeight = d.maxHeight;
        }
      });

    var linkHeight = (height - maxHeight) / maxDepth;
    for (i = 0; i < nodes.length; i++) {
      nodes[i].y = nodes[i].depth * linkHeight;
    }

    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    nodeUpdate.select('foreignObject')
      .each(function(d){
        var fo = d3.select(this);
        if (d.maxWidth) {
          fo.attr('x', 0 - (d.maxWidth / 2));
        }
      });

    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
      })
      .attr('cursor', 'pointer');

    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    nodeExit.select('circle')
      .attr('r', 1e-6);

    nodeExit.select('text')
      .style('fill-opacity', 1e-6);


    var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; });

    var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0};
        return diagonal(o, o)
      });

    var linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ 
        var start = {
          x: d.x, 
          y: d.y
        };
        var finish = {
          x: d.parent.x, 
          y: d.parent.y + (d.parent.maxHeight ? d.parent.maxHeight : 0)
        };
        return diagonal(start, finish);
      });

    var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal(o, o)
      })
      .remove();

    function diagonal(s, d) {
      path =  `M ${s.x} ${s.y}
            C ${(s.x + d.x) / 2} ${s.y},
              ${(s.x + d.x) / 2} ${d.y},
              ${d.x} ${d.y}`;
      return path;
    }
  }

})();
