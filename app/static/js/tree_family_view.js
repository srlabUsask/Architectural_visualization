function init() {
  //if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
  var $ = go.GraphObject.make; // for conciseness in defining templates
    const diagrams = [myDiagram1, myDiagram2];
    for (let i = 1; i < diagrams.length + 1; i++){
        diagrams[i - 1] =
            $(go.Diagram, "fullDiagram" + i, // each diagram refers to its DIV HTML element by id
                {
                    initialAutoScale: go.Diagram.UniformToFill, // automatically scale down to show whole tree
                    //maxScale: 0.25,
                    contentAlignment: go.Spot.Center, // center the tree in the viewport
                    isReadOnly: false, // don't allow user to change the diagram
                    "animationManager.isEnabled": true,
                    // layout: $(go.TreeLayout,
                    //   { angle: 90, sorting: go.TreeLayout.SortingAscending }),
                    layout: $(FlatTreeLayout, // custom Layout, defined below
                        {
                            angle: 90,
                            compaction: go.TreeLayout.CompactionNone
                        }),
                    maxSelectionCount: 1, // only one node may be selected at a time in each diagram
                    // when the selection changes, update the myLocalDiagram view
                    "undoManager.isEnabled": true
                });

        var myNodeTemplate =
            $(go.Node, "Auto", {
                    isTreeExpanded: false
                }, // by default collapsed
                {
                    locationSpot: go.Spot.Center
                },
                new go.Binding("text", "key", go.Binding.toString), // for sorting
                $(go.Shape, "Rectangle",
                    new go.Binding("fill", "color"), {
                        stroke: null,
                        name: "SHAPE"
                    }),
                $(go.TextBlock, {
                        margin: 5,
                        editable: true
                    },
                    new go.Binding("text", "node_text", function (k) {
                        return "" + k;
                    })), {
                    toolTip: // define a tooltip for each node
                        $(go.Adornment, "Spot", // that has several labels around it
                            {
                                background: "transparent"
                            }, // avoid hiding tooltip when mouse moves
                            $(go.Placeholder, {
                                padding: 5
                            }),
                            $(go.TextBlock, {
                                    alignment: go.Spot.Top,
                                    alignmentFocus: go.Spot.Bottom,
                                    stroke: "red"
                                },
                                new go.Binding("text", "key", function (s) {
                                    return "key: " + s;
                                })),
                            $(go.TextBlock, "Bottom", {
                                    alignment: go.Spot.Bottom,
                                    alignmentFocus: go.Spot.Top,
                                    stroke: "red"
                                },
                                new go.Binding("text", "node_text", function (s) {
                                    return "Cluster Name: " + s;
                                }))
                        ) // end Adornment
                },
                $("TreeExpanderButton")

            );
        diagrams[i - 1].nodeTemplate = myNodeTemplate;

        // Define a basic link template, not selectable, shared by both diagrams
        var myLinkTemplate =
            $(go.Link, {
                    routing: go.Link.Normal,
                    selectable: false
                },
                $(go.Shape, {
                    strokeWidth: 1
                })
            );
        diagrams[i - 1].linkTemplate = myLinkTemplate;

        // Create the full tree diagram
        // setupDiagram();

        // Create a part in the background of the full diagram to highlight the selected node
        highlighter =
            $(go.Part, "Auto", {
                    layerName: "Background",
                    selectable: false,
                    isInDocumentBounds: false,
                    locationSpot: go.Spot.Center
                },
                $(go.Shape, "Ellipse", {
                    fill: $(go.Brush, "Radial", {
                        0.0: "yellow",
                        1.0: "white"
                    }),
                    stroke: null,
                    desiredSize: new go.Size(400, 400)
                })
            );
        diagrams[i - 1].add(highlighter);

        diagrams[i - 1].addDiagramListener("ObjectContextClicked",
            function (e) {
                var part = e.subject.part;
                if (!(part instanceof go.Link)) {
                    // showUserStudyPanel(part);
                    showNodeDetails(part);
                }

            });

        // Start by focusing the diagrams on the node at the top of the tree.
        // Wait until the tree has been laid out before selecting the root node.
        diagrams[i - 1].addDiagramListener("InitialLayoutCompleted", function (e) {
            var node0 = diagrams[i - 1].findPartForKey(0);
            console.log(node0);
            if (node0 !== null) node0.isSelected = true;
            e.diagram.findTreeRoots().each(function (r) {
                r.expandTree(3);
            });

        });
    }
}

// Customize the TreeLayout to position all of the leaf nodes at the same vertical Y position.
function FlatTreeLayout() {
  go.TreeLayout.call(this); // call base constructor
}
go.Diagram.inherit(FlatTreeLayout, go.TreeLayout);

// This assumes the TreeLayout.angle is 90 -- growing downward
FlatTreeLayout.prototype.commitLayout = function () {
  go.TreeLayout.prototype.commitLayout.call(this); // call base method first
  // find maximum Y position of all Nodes
  var y = -Infinity;
  this.network.vertexes.each(function (v) {
    y = Math.max(y, v.node.position.y);
  });
  // move down all leaf nodes to that Y position, but keeping their X position
  this.network.vertexes.each(function (v) {
    if (v.destinationEdges.count === 0) {
      // shift the node down to Y
      v.node.position = new go.Point(v.node.position.x, y);
      // extend the last segment vertically
      v.node.toEndSegmentLength = Math.abs(v.centerY - y);
    } else { // restore to normal value
      v.node.toEndSegmentLength = 10;
    }
  });
};
// end FlatTreeLayout

function clearDiagram() {
  myDiagram1.model = null;
  myDiagram2.model = null;
}



