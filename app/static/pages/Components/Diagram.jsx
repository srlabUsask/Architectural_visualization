import React, { Component } from 'react';
import  "../../styles/style.css"
import {Col, Row} from "react-bootstrap";
import {ReactDiagram} from "gojs-react";
import * as go from "gojs";



/*
Creates the goJS diagram

needed props values:
    key: integer value of the graph(first graph should have 1)

 */
export default class Diagram extends Component {


    constructor(props) {
        super(props);
        this.state = {


        }

        this.initGraph = this.initGraph.bind(this);
        this.imageConverter = this.imageConverter.bind(this)
    }



    initGraph(){

        var $ = go.GraphObject.make;  // for conciseness in defining templates
        const diagram  =
            $(go.Diagram,
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
        diagram.nodeTemplate =
            $(go.Node,
                { // no Adornment: instead change panel background color by binding to Node.isSelected
                    selectionAdorned: false,
                    isTreeExpanded: false,
                    // a custom function to allow expanding/collapsing on double-click
                    // this uses similar logic to a TreeExpanderButton
                    doubleClick: function(e, node) {
                        var cmd = diagram.commandHandler;
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
                        new go.Binding("source", "isTreeExpanded", this.imageConverter).ofObject(),
                        new go.Binding("source", "isTreeLeaf", this.imageConverter).ofObject()),
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
        diagram.linkTemplate = $(go.Link);



    diagram.addDiagramListener("ObjectContextClicked",
            function (e) {
                const subject = e.subject;
                if (!(subject.part instanceof go.Link)) {
                    // showUserStudyPanel(subject.part);
                    this.props.showNodeDetails(subject.part, this.props.key);

                    this.props.updateUniqueNodePaths();
                }
                if (subject.figure === 'RoundedRectangle'){
                    this.props.get_similarity(subject.part,  this.props.key);
                }
            });


        return diagram;
    }
    imageConverter(prop, picture) {
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

    render() {
        return (



                <Row >
                    <ReactDiagram className={" col diagram"}
                            initDiagram={this.initGraph}
                            divClassName='diagram'
                            onModelChange={()=>console.log("ModelChange")}

                    />
                </Row>



        )
    }
}