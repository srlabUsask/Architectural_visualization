

// use a V figure instead of MinusLine in the TreeExpanderButton
go.Shape.defineFigureGenerator("ExpandedLine", function(shape, w, h) {
  return new go.Geometry()
        .add(new go.PathFigure(0, 0.25*h, false)
              .add(new go.PathSegment(go.PathSegment.Line, .5 * w, 0.75*h))
              .add(new go.PathSegment(go.PathSegment.Line, w, 0.25*h)));
});

// use a sideways V figure instead of PlusLine in the TreeExpanderButton
go.Shape.defineFigureGenerator("CollapsedLine", function(shape, w, h) {
  return new go.Geometry()
        .add(new go.PathFigure(0.25*w, 0, false)
              .add(new go.PathSegment(go.PathSegment.Line, 0.75*w, .5 * h))
              .add(new go.PathSegment(go.PathSegment.Line, 0.25*w, h)));
});

// Initialises the directory view of the cluster graph
function init_directory(){
    var $ = go.GraphObject.make;  // for conciseness in defining templates
    const diagrams = [];
    for (let i = 1; i < 3; i++){
        diagrams[i - 1] =
            $(go.Diagram, "fullDiagram" + i,
                {
                    allowMove: false,
                    allowCopy: false,
                    allowDelete: false,
                    allowHorizontalScroll: true,
                    layout:
                        $(go.TreeLayout,
                            {
                                alignment: go.TreeLayout.AlignmentStart,
                                angle: 0,
                                compaction: go.TreeLayout.CompactionNone,
                                layerSpacing: 16,
                                layerSpacingParentOverlap: 1,
                                nodeIndentPastParent: 1.0,
                                nodeSpacing: 0,
                                setsPortSpot: false,
                                setsChildPortSpot: false
                            })
                });
        diagrams[i - 1].nodeTemplate =
            $(go.Node,
                { // no Adornment: instead change panel background color by binding to Node.isSelected
                    selectionAdorned: false,
                    isTreeExpanded: false,
                    // a custom function to allow expanding/collapsing on double-click
                    // this uses similar logic to a TreeExpanderButton
                    doubleClick: function(e, node) {
                        var cmd = diagrams[i - 1].commandHandler;
                        if (node.isTreeExpanded) {
                            if (!cmd.canCollapseTree(node)) return;
                        } else {
                            if (!cmd.canExpandTree(node)) return;
                        }
                        e.handled = true;
                        if (node.isTreeExpanded) {
                            cmd.collapseTree(node);
                        } else {
                            cmd.expandTree(node);
                        }

                        if (node.isTreeLeaf){
                            leaf_similarity(node);
                        }
                    }
                },
                $("TreeExpanderButton",
                    { // customize the button's appearance
                        "_treeExpandedFigure": "ExpandedLine",
                        "_treeCollapsedFigure": "CollapsedLine",
                        "ButtonBorder.fill": "whitesmoke",
                        "ButtonBorder.stroke": null,
                        "_buttonFillOver": "rgba(0,128,255,0.25)",
                        "_buttonStrokeOver": null
                    }),
                $(go.Panel, "Horizontal",
                    { position: new go.Point(18, 0) },
                    new go.Binding("background", "isSelected", function(s) { return (s ? "lightblue" : "white"); }).ofObject(),
                    $(go.Picture,
                        {
                            width: 18, height: 18,
                            margin: new go.Margin(0, 4, 0, 0),
                            imageStretch: go.GraphObject.Uniform
                        },
                        // bind the picture source on two properties of the Node
                        // to display open folder, closed folder, or document
                        new go.Binding("source", "isTreeExpanded", imageConverter).ofObject(),
                        new go.Binding("source", "isTreeLeaf", imageConverter).ofObject()),
                    $(go.TextBlock,
                        { font: '9pt Verdana, sans-serif'},
                        new go.Binding("text", "node_text", function(s) { return " " + s; }),
                        new go.Binding('stroke', 'color')
                    )
                ), // end Horizontal Panel
                $(go.Shape, "RoundedRectangle",
                    {position: new go.Point(-20,-3),
                        width: 20,
                        height: 20,
                        stroke: "black",
                        fill: "white"},
                    new go.Binding("fill", "similarity")
                ) // end Shape
            );  // end Node

        // without lines
        diagrams[i - 1].linkTemplate = $(go.Link);


        diagrams[i - 1].addDiagramListener("ObjectContextClicked",
            function (e) {
                var part = e.subject.part;
                if (!(part instanceof go.Link)) {
                    // showUserStudyPanel(part);
                    showNodeDetails(part, i);
                }

            });
    }
    myDiagram1 = diagrams[0];
    myDiagram2 = diagrams[1];
}

// Initialises the tree view of the cluster graph
function init_tree() {
    var $ = go.GraphObject.make;  // for conciseness in defining templates
    const diagrams = [];
    for (let i = 1; i < 3; i++){
        diagrams[i - 1] =
            $(go.Diagram, "fullDiagram" + i,
                {
                    allowMove: true,
                    allowCopy: false,
                    allowDelete: false,
                    allowHorizontalScroll: true,
                    layout:
                        $(go.TreeLayout,
                            {
                                angle: 90,
                                layerSpacing: 35
                            })
                });
        diagrams[i - 1].nodeTemplate =
            $(go.Node,
                { // no Adornment: instead change panel background color by binding to Node.isSelected
                    selectionAdorned: false,
                    isTreeExpanded: true
                },
                $(go.Panel, "Horizontal",
                    { position: new go.Point(18, 0) },
                    new go.Binding("background", "isSelected", function(s) { return (s ? "lightblue" : "white"); }).ofObject(),
                    $(go.TextBlock,
                        { font: '9pt Verdana, sans-serif', width: 100},
                        new go.Binding("text", "node_text", function(s) { return " " + s; }),
                        new go.Binding('stroke', 'color')
                    )
                ), // end Horizontal Panel
                $(go.Shape, "RoundedRectangle",
                    {position: new go.Point(120,0),
                    width: 20,
                    height: 20,
                    stroke: "black",
                    fill: "white"},
                    new go.Binding("fill", "similarity")
                ) // end Shape
            );  // end Node

        // Links nodes using an arrow
        diagrams[i - 1].linkTemplate =
            $(go.Link,
                {
                    routing: go.Link.Orthogonal,
                    corner: 5
                },
                $(go.Shape,
                    {
                        strokeWidth: 3,
                        stroke: "#555"
                    }
                ), //end line Shape
                $(go.Shape,
                    {
                        toArrow: "Standard",
                        stroke: null
                    }
                ) // end arrow Shape
            ); // end Link


        diagrams[i - 1].addDiagramListener("ObjectContextClicked",
            function (e) {
                var subject = e.subject;
                if (!(subject.part instanceof go.Link)) {
                    // showUserStudyPanel(subject.part);
                    showNodeDetails(subject.part, i);
                }
                if (subject.figure == 'RoundedRectangle'){
                    get_similarity(subject.part, i);
                }

            });

        }
    myDiagram1 = diagrams[0];
    myDiagram2 = diagrams[1];
}

function imageConverter(prop, picture) {
  var node = picture.part;
  if (node.isTreeLeaf) {
    return "/static/images/document.svg";
  } else {
    if (node.isTreeExpanded) {
      return "/static/images/openFolder.svg";
    } else {
      return "/static/images/closedFolder.svg";
    }
  }
}


function clearDiagram() {
  myDiagram1.model = null;
  myDiagram2.model = null;
}




