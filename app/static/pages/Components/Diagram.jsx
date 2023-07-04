import React, {Component, createRef} from 'react';
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
        this.initTree=this.initTree.bind(this);
        this.initialize=this.initialize.bind(this);
        this.imageConverter = this.imageConverter.bind(this);

        this.setupDiagram = this.setupDiagram.bind(this);
        this.updateNodeText = this.updateNodeText.bind(this);
        this.handleChange=this.handleChange.bind(this);
        this.resetNodeColor = this.resetNodeColor.bind(this);
        this.functionHighlightNode=this.functionHighlightNode.bind(this);
        this.highlightSameNodes=this.highlightSameNodes.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {


        //Check if the cluster data is changed
        const cluster = this.props.cluster;
        const prevCluster = prevProps.cluster;

        if(JSON.stringify(prevProps.searchedExecutionPaths)!==JSON.stringify(this.props.searchedExecutionPaths)){
            this.resetNodeColor();
            this.functionHighlightNode();
        }
        if(this.props.sameExecutionPath!==prevProps.sameExecutionPath){
            this.resetNodeColor();
            this.highlightSameNodes(this.props.sameExecutionPath,true);
        }

        if(prevProps.selectedUniqueExecutionPath!==this.props.selectedUniqueExecutionPath){
            this.resetNodeColor();
            this.highlightSameNodes(this.props.selectedUniqueExecutionPath,false);
        }

        if(this.props.cluster===undefined || this.props.cluster.length!==0){
            if(JSON.stringify(cluster)!==JSON.stringify(prevCluster) || prevProps.technique!== this.props.technique){


                    this.props.setReadyStatus(this.props.identifier, false)//disable readiness untill its updated

                    this.setupDiagram();

            }

        }

    }
    componentDidMount() {
       this.setupDiagram();
    }

    initialize(){
        if(this.props.drawMode===0) return this.initGraph();
        else return this.initTree();



    }
    initGraph(){
        const component=this;
        let $ = go.GraphObject.make;  // for conciseness in defining templates
        let diagram;


            diagram = $(go.Diagram,
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
                            imageStretch: go.GraphObject.Uniform,
                            cursor:"pointer"
                        },
                        // bind the picture source on two properties of the Node
                        // to display open folder, closed folder, or document
                        new go.Binding("source", "isTreeExpanded", this.imageConverter).ofObject(),
                        new go.Binding("source", "isTreeLeaf", this.imageConverter).ofObject()),
                    $(go.TextBlock,
                        { font: '9pt Verdana, sans-serif',cursor:"pointer"},
                        new go.Binding("text", "node_text", function(s) { return " " + s; }),
                        new go.Binding('stroke', 'color')
                    )
                ), // end Horizontal Panel
                $(go.Shape, "RoundedRectangle",
                    {position: new go.Point(-20,-3),
                        width: 20,
                        height: 20,
                        stroke: "black",
                        fill: "white",
                        cursor:"pointer"


                    },
                    new go.Binding("fill", "similarity")
                ) // end Shape
            );  // end Node

        // without lines
        diagram.linkTemplate = $(go.Link);



        diagram.addDiagramListener("ObjectSingleClicked",
            function (e) {
                const subject = e.subject;
                //used subject.Dh to check if it is dropdown button
                //on graph model only dropdown button has array value of Dh instead of null
                if (!(subject.part instanceof go.Link) && subject.Dh===null) {
                    component.props.showNodeDetails(subject.part, component.props.identifier);


                    const key1 = component.props.nodeKeys[0];
                    const key2 = component.props.nodeKeys[1];
                    if(key1!==undefined && key2!==undefined) {
                        component.props.updateUniqueNodePaths(key1,key2);
                    }
                    component.props.updateSimilarity(subject.part,  component.props.identifier);
                }

            });

        return diagram;
    }



// Initialises the tree view of the cluster graph
    initTree() {

        const component=this;
        let $ = go.GraphObject.make;  // for conciseness in defining templates

        let diagram =$(go.Diagram,
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
        diagram.layout=  $(go.TreeLayout,
                            {
                                angle: 90,
                                layerSpacing: 35
                            })


        diagram.nodeTemplate =
            $(go.Node,
                { // no Adornment: instead change panel background color by binding to Node.isSelected
                    selectionAdorned: false,
                    isTreeExpanded: true
                },
                $(go.Panel, "Horizontal",
                    { position: new go.Point(18, 0) },
                    new go.Binding("background", "isSelected", function(s) { return (s ? "lightblue" : "white"); }).ofObject(),
                    $(go.TextBlock,
                        { font: '9pt Verdana, sans-serif', width: 100,cursor:"pointer"},
                        new go.Binding("text", "node_text", function(s) { return " " + s; }),
                        new go.Binding('stroke', 'color')
                    )
                ), // end Horizontal Panel
                $(go.Shape, "RoundedRectangle",
                    {position: new go.Point(120,0),
                        width: 20,
                        height: 20,
                        stroke: "black",
                        fill: "white",
                        cursor:"pointer"
                    },
                    new go.Binding("fill", "similarity")
                ) // end Shape
                );  // end Node

        // Links nodes using an arrow
        diagram.linkTemplate =
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


        diagram.addDiagramListener("ObjectSingleClicked",
            function (e) {
                var subject = e.subject;
                if (!(subject.part instanceof go.Link)) {
                    // showUserStudyPanel(subject.part);
                    component.props.showNodeDetails(subject.part, component.props.identifier);
                    const key1 = component.props.nodeKeys[0];
                    const key2 = component.props.nodeKeys[1];
                    if(key1!==undefined && key2!==undefined) {

                        component.props.updateUniqueNodePaths(key1, key2);
                    }
                    component.props.updateSimilarity(subject.part, component.props.identifier);
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


// Sets up the values for a given diagram
    setupDiagram() {


        let nodeDataArray = [];
        const cluster = this.props.cluster;

        //If the tree is empty
        if(cluster===undefined || cluster.length===0) return;
        const myDiagram = this.props.diagram.current.getDiagram();
        for (let x in cluster) {
            nodeDataArray.push({
                key: cluster[x].key,
                parent: cluster[x].parent,
                node_text: cluster[x].tfidf_word,
                tfidf_word: cluster[x].tfidf_word,
                tfidf_method: cluster[x].tfidf_method,
                tfidf_method_and_docstring: cluster[x].tfidf_method_and_docstring,
                tfidf_word_and_docstring: cluster[x].tfidf_word_and_docstring,
                lda_word: cluster[x].lda_word,
                lda_method: cluster[x].lda_method,
                lda_word_and_docstring: cluster[x].lda_word_and_docstring,
                lda_method_and_docstring: cluster[x].lda_method_and_docstring,
                lsi_word: cluster[x].lsi_word,
                lsi_method: cluster[x].lsi_method,
                lsi_word_and_docstring: cluster[x].lsi_word_and_docstring,
                lsi_method_and_docstring: cluster[x].lsi_method_and_docstring,
                text_rank: cluster[x].text_rank,
                tree_context_based_label: cluster[x].tree_context_based_label,
                color: "black",
                spm_method: cluster[x].spm_method,
                text_summary: cluster[x].text_summary,
                files: cluster[x].files,
                files_count: cluster[x].files_count,
                execution_path_count: cluster[x].execution_path_count,
                execution_paths: cluster[x].execution_paths
            });

        }


        myDiagram.model = new go.TreeModel(nodeDataArray);



        const component = this;//save the reference to component
        myDiagram.nodes.each(function (n) {
            component.updateNodeText(n);
        });


        //refresh the status to ready
        this.props.setReadyStatus(this.props.identifier,true)

    }


    //function if diagram model changes
    //currently not used
    handleChange(change){
        return;
    }

// Updates the label for a node based on the labeling technique choice
    updateNodeText(node) {
        const myDiagram = this.props.diagram.current.getDiagram();
        const technique= this.props.technique;
        myDiagram.model.commit(function (m) { // this Model
            // This is the safe way to change model data
            // GoJS will be notified that the data has changed
            // and can update the node in the Diagram
            // and record the change in the UndoManager
            if (technique === 'tfidf_word') {
                m.set(node.data, "node_text", node.data.tfidf_word);
            } else if (technique === 'tfidf_method') {
                m.set(node.data, "node_text", node.data.tfidf_method);
            } else if (technique === 'tfidf_method_and_docstring') {
                m.set(node.data, "node_text", node.data.tfidf_method_and_docstring);
            } else if (technique === 'tfidf_word_and_docstring') {
                m.set(node.data, "node_text", node.data.tfidf_word_and_docstring);
            } else if (technique === 'lda_word') {
                m.set(node.data, "node_text", node.data.lda_word);
            } else if (technique === 'lda_method') {
                m.set(node.data, "node_text", node.data.lda_method);
            } else if (technique === 'lda_word_and_docstring') {
                m.set(node.data, "node_text", node.data.lda_word_and_docstring);
            } else if (technique === 'lda_method_and_docstring') {
                m.set(node.data, "node_text", node.data.lda_method_and_docstring);
            } else if (technique === 'lsi_word') {
                m.set(node.data, "node_text", node.data.lsi_word);
            } else if (technique === 'lsi_method') {
                m.set(node.data, "node_text", node.data.lsi_method);
            } else if (technique === 'lsi_word_and_docstring') {
                m.set(node.data, "node_text", node.data.lsi_word_and_docstring);
            } else if (technique === 'lsi_method_and_docstring') {
                m.set(node.data, "node_text", node.data.lsi_method_and_docstring);
            } else if (technique === 'text_rank') {
                m.set(node.data, "node_text", node.data.text_rank);
            } else if (technique === 'tree_context_based_label') {
                m.set(node.data, "node_text", node.data.tree_context_based_label);
            }

        }, "update node text");
    }

    // Resets color of text in the nodes to the color black
    resetNodeColor() {
        let diagram = this.props.diagram.current.getDiagram();

        diagram.nodes.each(function (n) {
            diagram.model.commit(function (m) {
                m.set(n.data, "color", "black");
            }, 'change node color');
        });
    }


    /* This method is for highlighting nodes that have a certain execution path. 'same' is used to choose which color do
    you want to change the text to when highlighting the node with True being green and False being red. The intended
    purpose of 'same' is to show whether the node we are highlighting is for a unique node or a node that exists in both
    cluster trees. 'identifier' is used to track which of the two trees we are searching in.
     */
    executionPathHighlightNode(execution_path, identifier, same) {
        let diagram = this.props.diagram.current.getDiagram();

        diagram.nodes.each(function (n) {
            if (execution_path in n.data.execution_paths){
                diagram.model.commit(function (m) {
                    if (same) {
                        m.set(n.data, "color", "green");
                    }
                    else {
                        m.set(n.data, "color", "red");
                    }
                }, 'change node color');
            }
        });


    }

    // Every node that has an execution path in that's also in execution_paths_for_func gets highlighted by its text being
// turned to red
     functionHighlightNode() {

        let execution_paths_for_func=this.props.searchedExecutionPaths[this.props.identifier-1];

         let diagram = this.props.diagram.current.getDiagram();
         diagram.nodes.each(function (n) {
            if (execution_paths_for_func.some(item => Object.keys(n.data.execution_paths).includes(item.toString()))) {

                diagram.model.commit(function (m) {
                    m.set(n.data, "color", "red");
                }, 'change node color');
            }
        });
    }


    /* This method is for highlighting nodes that have a certain execution path. 'same' is used to choose which color do
    you want to change the text to when highlighting the node with True being green and False being red. The intended
    purpose of 'same' is to show whether the node we are highlighting is for a unique node or a node that exists in both
    cluster trees. 'identifier' is used to track which of the two trees we are searching in.
     */
    highlightSameNodes(execution_path,same) {
        let diagram = this.props.diagram.current.getDiagram();
        diagram.nodes.each(function (n) {
            if (execution_path in n.data.execution_paths){
                diagram.model.commit(function (m) {
                    if (same) {
                        m.set(n.data, "color", "green");
                    }
                    else {
                        m.set(n.data, "color", "red");
                    }
                }, 'change node color');
            }
        });

    }


    render() {
        return (



                <Row style={this.props.height} >


                    <ReactDiagram key={this.props.diagramID}
                                  initDiagram={this.initialize}
                            ref={this.props.diagram}
                            divClassName='diagram'
                            onModelChange={this.handleChange}
                                  className={" col diagram vertical-scrollbar"}




                    />

                </Row>



        )
    }
}