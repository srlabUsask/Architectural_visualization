import React, {Component, createRef, useEffect} from 'react';
import {Accordion, Button, Col, Container, Row} from "react-bootstrap";
import Select from "react-select";
import {ReactDiagram} from "gojs-react";

import * as go from "gojs";



export default class NodeInformationPanel extends Component {


    constructor(props) {
        super(props);
        this.state = {
            patterns:[],
            executionPaths:[],
            functionText:"",
            slide1:"open",
            slide2:"open",


            /*
            Body render mode

            function: renders function only
            diagram: renders diagram only
            both: renders both

             */
            renderMode:"both",

        }

        this.diagram = createRef();

        this.executionPathExtract = this.executionPathExtract.bind(this);
        this.executionPathListextract=this.executionPathListextract.bind(this)
        this.initDiagram=this.initDiagram.bind(this);
        this.specificExecutionPathExtract=this.specificExecutionPathExtract.bind(this);
        this.setRenderMode=this.setRenderMode.bind(this);
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

                    new go.Binding("text", "nodeText"))
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

        const component=this;

        diagram.addDiagramListener("ObjectSingleClicked",
            function (e) {
                const subject = e.subject;
                //used subject.Dh to check if it is dropdown button
                //on graph model only dropdown button has array value of Dh instead of null
                if (!(subject.part instanceof go.Link) && subject.Dh===null) {
                    let data = component.props["diagramData"+component.props.identifier];
                    let currentID = data["function_name_to_id"][subject.part.key]


                    //in case whitespace causes key to be non-recognizable
                    if(currentID===undefined) currentID=data["function_name_to_id"][subject.part.key.trim()]

                    component.setState({
                        functionText: data["function_full_text"][currentID]
                    })
                }

            });
        return diagram
    }

    componentDidMount() {
        this.executionPathExtract(this.props.data.executionPaths)

    }



    /*
    Takes execution Paths/patterns as array of arrays of strings
   creates a diagram with "functionname(relative path)" format nodes
     */
    executionPathListextract(paths){

        let diagram=this.diagram.current;
        if(diagram===null) return

        diagram=diagram.getDiagram();

        let itemsInDiagram= {}//already in diagram
        let diagramPaths={}
        let diagramElements=[];
        let diagramParents=[]

        if(paths===undefined) return //No execution pattern was mined for this file

        for(let i=0;i<paths.length;i++){

            let functions = paths[i]

            for(let j=0;j<functions.length;j++){


                let index =functions[j].indexOf("(");
                let splited=functions[j].split("(")
                let start = functions[j].indexOf("::")>0? functions[j].indexOf("::")+2:0
                let functionName=functions[j].substring(start, index);
                functionName+="("+splited[splited.length-1].substring(0, splited[splited.length-1].length)


                let key=functions[j]
                let prevKey=j!==0? functions[j-1]:null;


                //Remove <b> from key and prevKey
                if(key.trim().substring(0,3)==="<b>"){
                    key = key.substring(3,key.length-4)
                }

                if(j!==0 && prevKey.trim().substring(0,3)==="<b>"){
                    prevKey = prevKey.substring(3,prevKey.length-4)
                }



                if(itemsInDiagram[key]===undefined){
                    itemsInDiagram[key]=1;//to keep track of items


                    diagramElements.push({key:key,nodeText:functionName, description:functionName})
                }

                if(j!==0 && diagramPaths[prevKey+"->"+key]===undefined){

                    diagramPaths[prevKey+"->"+key]=1;
                    diagramParents.push({from: prevKey, to: key})
                }



            }




        }




        diagram.model = new go.GraphLinksModel(diagramElements,diagramParents);





    }

    specificExecutionPathExtract(){
        let diagram=this.diagram.current;

        if(diagram===null) return

    }


    /*
    Takes array of string execution paths, coverts it into array of arrays of strings
    callst executionPathListextract with the array

     */
    executionPathExtract(paths){



        if(paths===undefined ) return

        let executionPathList=[]


        for(let i=0;i<paths.length;i++){

            let functions = paths[i].split("->").filter(e=>{return e.trim()!=="" && e.trim()!=="."});//split by arrow and filter out empty items and dots
            executionPathList.push(functions)


        }



        this.executionPathListextract(executionPathList);


    }



    setRenderMode(mode){
        this.setState({
            renderMode:mode
        })
    }
    render() {




        return (



            <div >


                <div className="row justify-content-start informationPanelHeader">

                    <div className="col d-flex justify-content-between">

                        <div>
                        <Button variant={"outline-dark"} onClick={()=>this.props.setNodeInformationState(false)}><i className="fa fa-arrow-left"></i>     Return</Button>

                        <Button variant={"outline-dark"} onClick={()=>this.executionPathExtract(this.props.data.executionPaths)}>Execution Paths</Button>
                        {this.props.data.executionPatternsList!==undefined && <Button variant={"outline-dark"} onClick={()=>this.executionPathListextract(this.props.data.executionPatternsList)}>Execution Patterns</Button>}
                        {(this.props.data.uniqueExecutionPaths!==undefined && this.props.data.uniqueExecutionPaths.length>0)  && <Button variant={"outline-dark"} onClick={()=>this.executionPathExtract(this.props.data.uniqueExecutionPaths)}>Unique Execution Paths</Button>}
                        </div>

                        <div style={{marginRight:"15px"}}>
                            <Button variant={"outline-dark"} onClick={()=>this.setRenderMode("function")}>Function only</Button>
                            <Button variant={"outline-dark"} onClick={()=>this.setRenderMode("both")}>Both</Button>
                            <Button variant={"outline-dark"} onClick={()=>this.setRenderMode("diagram")}>Diagram only</Button>


                        </div>
                    </div>
                </div>




                <Row className={"nodeInformationBody"}>
                    <div className={`${this.state.renderMode==="diagram"?"hide":""}  ${this.state.renderMode==="function"?"col-md-12":"col-md-6"} nodeInformationFunction`}>

                        <div >
                        <pre className={"vertical-scrollbar functionText"}>
                            {this.state.functionText}
                        </pre>
                        </div>

                    </div>




                    <div className={`${this.state.renderMode==="function"?"hide":""} ${this.state.renderMode==="diagram"?"col-md-12":"col-md-6"} nodeInformationDiagram`}>

                        <div >
                             <ReactDiagram initDiagram={this.initDiagram} ref={this.diagram} divClassName={"nodeInformationDiagram diagram"} />
                        </div>
                    </div>

                </Row>
            </div>
        );
    }

}
