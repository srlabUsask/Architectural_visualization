import React, {Component, createRef, useEffect} from 'react';
import {Accordion, Button, Container} from "react-bootstrap";
import Select from "react-select";
import {ReactDiagram} from "gojs-react";
import * as go from "gojs";



export default class NodeInformationPanel extends Component {


    constructor(props) {
        super(props);
        this.state = {
            patterns:[]
        }

        this.diagram = createRef();

        this.executionPathExtract = this.executionPathExtract.bind(this);
        this.executionPatternsExtract=this.executionPatternsExtract.bind(this)
        this.initDiagram=this.initDiagram.bind(this);
    }


    initDiagram(){

        let $ = go.GraphObject.make;  // for conciseness in defining templates


        let diagram =$(go.Diagram,
            {
                allowMove: true,
                allowCopy: false,
                allowDelete: false,
                allowHorizontalScroll: true,
                layout: $(go.LayeredDigraphLayout, { alignOption: go.LayeredDigraphLayout.AlignAll })
                /*
                    $(go.CircularLayout,
                        {
                            radius:150,
                            spacing: 60,
                            startAngle:0,
                            sweepAngle:360,
                        })

                 */

            });
        diagram.nodeTemplate =
            $(go.Node, "Auto",
                new go.Binding("location", "loc", go.Point.parse),
                $(go.Shape, "RoundedRectangle", { fill: "#e6f2ff",
                    height:50,
                    stroke: "black",

                    cursor:"pointer"
                }),
                $(go.TextBlock,{ font: '9pt Verdana, sans-serif',cursor:"pointer"},
                    new go.Binding("text", "key"))
            );

        diagram.linkTemplate =
            $(go.Link,
                {
                    routing: go.Link.Orthogonal,
                    corner: 5
                },
                $(go.Shape,
                    {
                        strokeWidth: 3,
                        stroke: "#555",

                        cursor:"pointer"
                    }
                ), //end line Shape
                $(go.Shape,
                    {
                        toArrow: "Standard",
                        stroke: null
                    }
                ) // end arrow Shape
            ); // end Link

        return diagram
    }

    componentDidMount() {
        this.executionPathExtract()
    }

    executionPatternsExtract(){

        let diagram=this.diagram.current;
        if(diagram===null) return

        diagram=diagram.getDiagram();

        let itemsInDiagram= {}//already in diagram
        let diagramPaths={}
        let diagramElements=[];
        let diagramParents=[]

        if(this.props.data.executionPatternsList===undefined) return //No execution pattern was mined for this file

        for(let i=0;i<this.props.data.executionPatternsList.length;i++){

            let functions = this.props.data.executionPatternsList[i]

            for(let j=0;j<functions.length;j++){
                let index =functions[j].indexOf("(");
                let functionName=functions[j].substring(0, index);
                let functionPath=functions[j].substring(index+1, functions[j].length)
                if(itemsInDiagram[functions[j]]===undefined){
                    itemsInDiagram[functions[j]]=1;//to keep track of items


                    diagramElements.push({key:functions[j], data:functionName,functionPath:functionPath})
                }

                if(j!==0 && diagramPaths[functions[j-1]+"->"+functions[j]]===undefined){

                    diagramPaths[functions[j-1]+"->"+functions[j]]=1;
                    diagramParents.push({from: functions[j-1], to: functions[j]})
                }



            }




        }




        diagram.model = new go.GraphLinksModel(diagramElements,diagramParents);



    }

    executionPathExtract(){

        let diagram=this.diagram.current;

        if(diagram===null) return

        diagram=diagram.getDiagram();

        let itemsInDiagram= {}//already in diagram
        let diagramPaths={}
        let diagramElements=[];
        let diagramParents=[]


        for(let i=0;i<this.props.data.executionPaths.length;i++){

            let functions = this.props.data.executionPaths[i].split("->")

            for(let j=0;j<functions.length;j++){

                if(functions[j]==="") continue

                let index =functions[j].indexOf("(");
                let functionName=functions[j].substring(0, index);
                let functionPath=functions[j].substring(index+1, functions[j].length)


                if(itemsInDiagram[functions[j]]===undefined){
                    itemsInDiagram[functions[j]]=1;//to keep track of items


                    diagramElements.push({key:functions[j],data:functionName, functionPath:functionPath})
                }

                if(j!==0 && diagramPaths[functions[j-1]+"->"+functions[j]]===undefined){
                    diagramPaths[functions[j-1]+"->"+functions[j]]=1;

                    diagramParents.push({from: functions[j-1], to: functions[j]})
                }



            }




        }




        diagram.model = new go.GraphLinksModel(diagramElements,diagramParents);



    }

    render() {


        return (



            <div >

                <Container>
                    
                    <Button onClick={this.executionPathExtract}>Execution Paths</Button>
                    {this.props.data.executionPatternsList!==undefined && <Button onClick={this.executionPatternsExtract}>Execution Patterns</Button>}
                </Container>



                <ReactDiagram initDiagram={this.initDiagram} ref={this.diagram} divClassName={"nodeInformationDiagram"} />
            </div>
        );
    }

}
