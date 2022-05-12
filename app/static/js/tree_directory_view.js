

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



function init() {
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
                                angle: 90, // was 0 before
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
                ) // end Horizontal Panel
            );  // end Node

        // without lines
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
                ),
                $(go.Shape,
                    {
                        toArrow: "Standard",
                        stroke: null
                    }
                )
            );


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




