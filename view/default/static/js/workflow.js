/**
 * Created by Vasiliy Ermilov (ermilov.work@yandex.ru) on 3/23/17.
 */
(function(){

  function conditionType(condition){
    switch(condition) {
      case 0: return '=';
      case 1: return '!=';
      case 2: return 'EMPTY';
      case 3: return 'NOT_EMPTY';
      case 4: return 'LIKE';
      case 5: return '<';
      case 6: return '>';
      case 7: return '<=';
      case 8: return '>=';
      case 9: return 'IN';
      case 10: return 'CONTAINS';
      default: return ' ';
    }
  }

  function getScale (label, box) {
    var boxHeight = box.attr('height') - 5;
    var boxWidth = box.attr('width') - 20;

    var bbox = label.node().getBBox();
    var textHeight = bbox.height;
    var textWidth = bbox.width;

    var x = (boxWidth < textWidth) ? (boxWidth - 4) / textWidth : 1;
    var y = (boxHeight < boxHeight) ? boxHeight / textHeight : 1;
    return {x:x, y:y};
  }

  function scaleFont(x, label, fontSize) {
    label.style("font-size", fontSize * x);
  }

  function scaleLabel (label, box, fontSize) {
    var scale = getScale(label, box);
    if (scale.y < 1) {
      scaleFont(scale.x, label, fontSize);
    } else if (scale.x < 0.5) {
      var text = label.text();
      var parts = text.split(' ');
      if (parts.length > 1) {
        var middle = Math.round(parts.length / 2);
        var line1 = parts.slice(0, middle).join(' ');
        var line2 = parts.slice(middle).join(' ');
        label.text('');
        var tspan1 = label.append('tspan').attr('x', label.attr('x'))
          .attr('dy', -5)
          .text(line1);
        var tspan2 = label.append('tspan').attr('x', label.attr('x')).attr('dy', 10).text(line2);
        var scale1 = getScale(tspan1, box);
        var scale2 = getScale(tspan2, box);
        var x = scale1.x < scale2.x ? scale1.x : scale2.x;
        scaleFont(x, tspan1, fontSize);
        scaleFont(x, tspan2, fontSize);
      } else {
        scaleFont(scale.x, label, fontSize);
      }
    } else if (scale.x < 1) {
      scaleFont(scale.x, label, fontSize);
    }
  }

  function diagonal (d) {
    return "M" + d.x1 + "," + d.y1
      + "C" + (d.x1 + d.x2) / 2 + "," + d.y1
      + " " + (d.x1 + d.x2) / 2 + "," + d.y2
      + " " + d.x2 + "," + d.y2;
  }

  function diagonalRight(d){
    return "M" + d.x1 + "," + d.y1
      + "C" + (d.x1+boxWidth/2) + "," + d.y1
      + " " + (d.x2+boxWidth/2) + "," + d.y2
      + " " + d.x2 + "," + d.y2;
  }

  function diagonalDown(d){
    return "M" + d.x1 + "," + d.y1
      + "C" + d.x1 + "," + (d.y1+boxHeight/2)
      + " " + d.x2 + "," + (d.y2+boxHeight/2)
      + " " + d.x2 + "," + d.y2;
  }

  function findNode(id) {
    for (var i = 0; i < treeData.nodes.length; i++) {
      if (treeData.nodes[i].id === id) {
        return treeData.nodes[i];
      }
    }
    return null;
  }

  function findTargets(id) {
    var result = [];
    for (var i = 0; i < treeData.links.length; i++) {
      if (treeData.links[i].source === id) {
        result.push(treeData.links[i].target);
      }
    }
    return result;
  }

  function nodesContains(nodes, nodeId) {
    for (var i = 0; i < nodes.length; i++) {
     if (nodes[i].id === nodeId) {
       return true;
     }
    }
    return false;
  }

  function enrichTargets(node, nodesList) {
    var i,
      target,
      tmp = [],
      targets = findTargets(node.id);

    if (!targets.length) {
      node.type = 'finish';
    } else {
      for (i = 0; i < targets.length; i++) {
        if (!nodesContains(nodesList, targets[i])) {
          target = findNode(targets[i]);
          if (target) {
            tmp.push(target);
          }
        }
      }
    }


    node.children = [];
    if (tmp.length) {
      node.children = [].concat(tmp);
      nodesList = nodesList.concat(tmp);
      for (i = 0; i < tmp.length; i++) {
        nodesList = enrichTargets(tmp[i], nodesList);
      }
    }
    return nodesList;
  }

  function findLinkedNode(id) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].data.id === id) {
        return nodes[i];
      }
    }
    return null;
  }

  function linkCoordinates (link) {
    var result = {
      source: link.source,
      target: link.target
    };
    var source = findLinkedNode(link.source);
    var target = findLinkedNode(link.target);
    if (source && target) {
      if (source.y < target.y) {
        result.x1 = source.y + (boxWidth / 2);
        result.y1 = source.x;
        result.x2 = target.y - (boxWidth / 2);
        result.y2 = target.x;
      } else if(source.y === target.y) {
        result.type = 'right';
        result.x1 = source.y + (boxWidth / 2);
        result.y1 = source.x;
        result.x2 = target.y + (boxWidth / 2);
        result.y2 = target.x;
      } else if(source.x < target.x) {
        result.type = 'down-right';
        result.x1 = source.y;
        result.y1 = source.x + (boxHeight / 2);
        result.x2 = target.y + (boxWidth / 2);
        result.y2 = target.x;
      } else {
        result.type = 'down';
        result.x1 = source.y;
        result.y1 = source.x + (boxHeight / 2);
        result.x2 = target.y;
        result.y2 = target.x + (boxHeight / 2);
      }

      return result;
    }
    return null;
  }

  function mouseOverBox(box) {
    box.attr('class', box.attr('class') + ' selected');
  }

  function mouseOutBox(box){
    box.attr('class', box.attr('class').replace(' selected', ''));
  }

  function mouseOverSelectedLinks(id) {
    if (id) {
      var links = d3.selectAll('path[wf-source='+id+']');
      links.style('stroke-width', '2px');
      var labels = d3.selectAll('text[wf-source='+id+']');
      labels.each(function(){
        mouseOverPathLabel(d3.select(this));
      })
    }
  }

  function mouseOutSelectedLinks(id) {
    if (id) {
      var links = d3.selectAll('path[wf-source='+id+']');
      links.style('stroke-width', '1px');
      var labels = d3.selectAll('text[wf-source='+id+']');
      labels.each(function(){
        mouseOutPathLabel(d3.select(this));
      })
    }
  }

  function mouseOverPath(link, d) {
    var sourceBox = d.source ? d3.select('rect#'+d.source) : null;
    var targetBox = d.source ? d3.select('rect#'+d.target) : null;
    if (sourceBox) {
      mouseOverBox(sourceBox);
    }
    if (targetBox) {
      mouseOverBox(targetBox);
    }
    link.style('stroke-width', '2px');
  }

  function mouseOutPath(link, d) {
    var sourceBox = d.source ? d3.select('rect#'+d.source) : null;
    var targetBox = d.source ? d3.select('rect#'+d.target) : null;
    if (sourceBox) {
      mouseOutBox(sourceBox);
    }
    if (targetBox) {
      mouseOutBox(targetBox);
    }
    link.style('stroke-width', '1px');
  }

  function mouseOverPathLabel(lbl) {
    lbl.attr('class', lbl.attr('class')+ ' selected');
  }

  function mouseOutPathLabel(lbl) {
    lbl.attr('class', lbl.attr('class').replace(' selected', ''));
  }

  function mouseOverStateTooltip(data) {
    var i;
    var html = "";
    if (data.conditions && data.conditions.length) {
      html += "<p class='header'>conditions:</p>";
      for (i = 0; i < data.conditions.length; i++) {
        html += "<p class='condition'>"+JSON.stringify(data.conditions[i])+"</p>";
      }
    }
    if (data.itemPermissions && data.itemPermissions.length) {
      html += "<p class='header'>itemPermissions:</p>";
      for (i = 0; i < data.itemPermissions.length; i++) {
        html += "<p class='permission'>"+JSON.stringify(data.itemPermissions[i])+"</p>";
      }
    }
    if (data.propertyPermissions && data.propertyPermissions.length) {
      html += "<p class='header'>propertyPermissions:</p>";
      for (i = 0; i < data.propertyPermissions.length; i++) {
        html += "<p class='permission'>"+JSON.stringify(data.propertyPermissions[i])+"</p>";
      }
    }
    if (html) {
      html = "<p class='caption'>"+data.caption+"</p>" + html;
      div
        .html('<div>'+html+'</div>')
        .style("visibility", "visible");
    }
  }

  function mouseMoveStateTooltip(data) {
    div.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
  }

  function mouseOutStateTooltip(data) {
    div.style("visibility", "hidden");
  }
  function mouseOverTransitionTooltip(data) {
    var i;
    var html = "";
    if (data.assignments && data.assignments.length) {
      html += "<p class='header'>assignments:</p>";
      for (i = 0; i < data.assignments.length; i++) {
        html += "<p class='assignment'>" + data.assignments[i].key + ":" + data.assignments[i].value + "</p>";
      }
    }
    if (data.conditions && data.conditions.length) {
      html += "<p class='header'>conditions:</p>";
      for (i = 0; i < data.conditions.length; i++) {
        html += "<p class='condition'>"
          + data.conditions[i].property + ' ' + conditionType(data.conditions[i].operation) + ' '
          + (data.conditions[i].value ? data.conditions[i].value : '') + "</p>";
      }
    }
    if (html) {
      html = "<p class='caption'>"+data.caption+"</p>" + html;
      div
        .html('<div>'+html+'</div>')
        .style("visibility", "visible");
    }
  }

  function mouseMoveTransitionTooltip(data) {
    div.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
  }

  function mouseOutTransitionTooltip(data) {
    div.style("visibility", "hidden");
  }

  var startState = findNode(treeData.startState);
  if (startState) {
    var i,j;
    startState.type = 'start';
    var nodesList = [startState];
    nodesList = enrichTargets(startState, nodesList);
    var extraNodes = [];
    if (treeData.nodes.length > nodesList.length) {
      for (i = 0; i < treeData.nodes.length; i++) {
        if (!nodesContains(nodesList, treeData.nodes[i].id)) {
          treeData.nodes[i].type = 'extra';
          extraNodes.push(treeData.nodes[i]);
        }
      }
    }
    var hierarchy = {"name": "Старт", "children": [startState]};
    if (extraNodes.length) {
      hierarchy.children = hierarchy.children.concat(extraNodes);
    }

    var margin = {top: 20, right: 90, bottom: 30, left: 90},
      width = window.innerWidth - (margin.left * 2) - (margin.right * 2),
      height = window.innerHeight - (margin.top * 2) - (margin.bottom * 2);

    var fontSize = 17;

    var treemap = d3.tree().size([height, width]);
    var root = d3.hierarchy(hierarchy, function(d) { return d.children; });

    var data = treemap(root);
    var descendants = data.descendants();

    var depth = 0,
      maxChild = 0,
      minVertical;

    for (i = 0; i < descendants.length; i++) {
      if (descendants[i].depth > depth) {
        depth = descendants[i].depth;
      }
      if (descendants[i].children && descendants[i].children.length > maxChild) {
        maxChild = descendants[i].children.length;
      }

      if (descendants[i].children) {
        for (j = 0; j < descendants[i].children.length; j++) {
          if (descendants[i].children[j-1]) {
            if (!minVertical || Math.abs(descendants[i].children[j].x - descendants[i].children[j-1].x) < minVertical) {
              minVertical = Math.abs(descendants[i].children[j].x - descendants[i].children[j-1].x);
            }
          }
        }
      }

    }

    var distance = width / (depth - 1),
      boxWidth = distance / 3,
      boxHeight = minVertical ? minVertical * 0.75 : height / (maxChild + 2),
      boxHeight = boxHeight > boxWidth ? boxWidth : boxHeight;

    var startNode = descendants[0];
    var nodes = descendants.slice(1);

    var startStateNode;
    for (i = 0; i < startNode.children.length; i++) {
      if (startNode.children[i].data.id === startState.id) {
        startStateNode = startNode.children[i];
      }
    }

    var links = [];
    links.push({
      x1: startNode.y,
      y1: startNode.x,
      x2: startStateNode ? startStateNode.y - (boxWidth / 2) : startNode.y,
      y2: startStateNode ? startStateNode.x : startNode.x,
      name:'Старт'
    });

    var l;
    for (i = 0; i < treeData.links.length; i++) {
      l = linkCoordinates(treeData.links[i]);
      if (l) {
        l.name = treeData.links[i].data.caption;
        l.data = treeData.links[i].data;
        links.push(l);
      }
    }

    var div = d3.select("body").append("div")
      .attr('class', 'tooltip')
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .style('max-width', boxWidth * 2)
      .text("");

    var svg = d3.select("div#graph").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate("
        + margin.left + "," + margin.top + ")");

    var defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrow90")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "-90")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    var solidColor = defs.append("filter")
      .attr("id", "solid")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 1)
      .attr("height", 1);
    solidColor.append("feFlood").attr("flood-color","#fff");
    solidColor.append("feComposite").attr("in","SourceGraphic");

    svg.append("g")
      .append("circle")
      .attr("class", "start-circle")
      .attr("r", 7)
      .attr('cx', startNode.y)
      .attr('cy', startNode.x);

    var boxes = svg.append("g")
      .attr("class", "nodes")
      .selectAll("rect")
      .data(nodes)
      .enter()
      .append("rect")
      .attr("class", function(d){
        if (d.data.type === 'start') {
          return "start-state"
        } else if (d.data.type === 'finish') {
          return "finish-state";
        } else if (d.data.type === 'extra') {
          return "extra-state";
        }
        return "state";
      })
      .attr('id', function(d){ return d.data.id;})
      .attr('x', function(d){ return d.y - (boxWidth / 2); })
      .attr('y', function(d){ return d.x - (boxHeight / 2); })
      .attr('rx', 6).attr('ry', 6)
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .on('mouseover', function(d){
        var box = d3.select(this);
        mouseOverBox(box);
        mouseOverSelectedLinks(d.data.id);
        mouseOverStateTooltip(d.data.data);
      })
      .on('mousemove', function(d){
        mouseMoveStateTooltip(d.data.data);
      })
      .on('mouseout', function(d){
        var box = d3.select(this);
        mouseOutBox(box);
        mouseOutSelectedLinks(d.data.id);
        mouseOutStateTooltip(d.data.data);
      });

    var labels = svg.append("g")
      .attr("class", "labels");

    boxes.each(function(d){
      var box = d3.select(this);
      var label = labels.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .text(d.data.name)
        .attr("x", d.y)
        .attr("y", d.x)
        .on('mouseover', function(){
          mouseOverBox(box);
          mouseOverSelectedLinks(d.data.id);
          mouseOverStateTooltip(d.data.data);
        })
        .on('mousemove', function(){
          mouseMoveStateTooltip(d.data.data);
        })
        .on('mouseout', function(){
          mouseOutBox(box);
          mouseOutSelectedLinks(d.data.id);
          mouseOutStateTooltip(d.data.data);
        });
      scaleLabel(label, box, fontSize);
    });

    var path = svg.append("g")
      .style("stroke", "#aaa")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr('class', 'link')
      .attr('wf-source', function(d){return d.source;})
      .attr('wf-target', function(d){return d.target;})
      .attr("d", function(d){
        if (d.type === 'down' || d.type === 'down-right') {
          return diagonalDown(d);
        } else if (d.type === 'right') {
           return diagonalRight(d);
        }
        return diagonal(d);
      })
      .attr("marker-end", function(d){
        return d.type === 'down' ? "url(#arrow)" : "url(#arrow90)";
      })
      .on('mouseover', function(d){
        var link = d3.select(this);
        var lbl = d3.select('text[wf-source='+d.source+'][wf-target='+d.target+']');
        mouseOverPath(link, d);
        mouseOverPathLabel(lbl);
        mouseOverTransitionTooltip(d.data);
      })
      .on('mousemove', function(d){
        mouseMoveTransitionTooltip(d.data);
      })
      .on('mouseout', function(d){
        var link = d3.select(this);
        var lbl = d3.select('text[wf-source='+d.source+'][wf-target='+d.target+']');
        mouseOutPath(link, d);
        mouseOutPathLabel(lbl);
        mouseOutTransitionTooltip(d.data);
      });

    var linkLabels = svg.append("g")
      .attr('class', 'link-labels');

    var box1;
    boxes.each(function(d, i) {
      if (i === 0) {
        box1 = d3.select(this);
      }
    });

    path.each(function(d){
      var link = d3.select(this);
      var linkLabel = linkLabels.append("text")
        .attr("class", "link-label")
        .attr("text-anchor", function() {
          if (d.type === "right") {
            return "start";
          }
          return "middle";
        })
        .text(d.name)
        .attr("filter", "url(#solid)")
        .attr("x", d.x1 + ((d.x2 - d.x1) / 2))
        .attr("y", function(){
          if (d.type === 'down') {
            return d.y1 + boxHeight / 2;
          }
          return d.y1 + ((d.y2 - d.y1) / 2) + 4;
        })
        .attr('wf-source', d.source)
        .attr('wf-target', d.target)
        .on('mouseover', function(){
          mouseOverPathLabel(d3.select(this));
          mouseOverPath(link, d);
          mouseOverTransitionTooltip(d.data);
        })
        .on('mousemove', function(){
          mouseMoveTransitionTooltip(d.data);
        })
        .on('mouseout', function(){
          mouseOutPathLabel(d3.select(this));
          mouseOutPath(link, d);
          mouseOutTransitionTooltip(d.data);
        });
      scaleLabel(linkLabel, box1, fontSize);
    });

  }

})();
