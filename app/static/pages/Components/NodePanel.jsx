import React, {Component,createRef} from 'react';

import Diagram from "./Diagram";
import Node from "./Node";

import {Row, Col, Container} from "react-bootstrap";



/*
Central panel of the page
consists of 2 Nodes(one for each subject system) at edges
2 graphs at the center
 */
export default class NodePanel extends Component {


    constructor(props) {

        super(props);
        this.state = {
            //Execution Path in Node tab select(for the opposite subject system)
            nodeUniqueExecutionPath1:[],
            nodeUniqueExecutionPath2:[],


            diagramUniqueExecutionPaths:{},

            //Values to be set in Unique execution Path tab in Node
            uniqueExecutionPathList1:[],
            uniqueExecutionPathList2:[],
            //status of the data in each diagram
            diagramReadyStatus1:false,
            diagramReadyStatus2:false,

            //Unqiue execution Path selected from option box
            selectedUniqueExecutionPath1:"",
            selectedUniqueExecutionPath2:"",
            slide1:"open",
            slide2:"open"
        }

        this.diagram1=createRef();
        this.diagram2=createRef();

        this.updateSimilarity=this.updateSimilarity.bind(this);
        this.updateDiagramNodes=this.updateDiagramNodes.bind(this);
        this.setupUniqueOptions= this.setupUniqueOptions.bind(this);
        this.setupUniqueNodeExecutionPaths = this.setupUniqueNodeExecutionPaths.bind(this);
        this.setDiagramReadyStatus = this.setDiagramReadyStatus.bind(this)
        this.updateUniqueNodePaths = this.updateUniqueNodePaths.bind(this);
        this.setUnqiueExecutionPathOfSystem=this.setUnqiueExecutionPathOfSystem.bind(this);
        this.slideToSide = this.slideToSide.bind(this);
        this.getSlideStyle =this.getSlideStyle.bind(this);
    }


componentDidUpdate(prevProps, prevState, snapshot) {

        if(this.props.diagramData2['cluster']!==undefined && this.props.diagramData1['cluster']!==undefined){
            //if any of the files was changed
             if(JSON.stringify(prevProps.diagramData1)!== JSON.stringify(this.props.diagramData1) || JSON.stringify(prevProps.diagramData2)!== JSON.stringify(this.props.diagramData2)){
                 this.setupUniqueOptions();
             }






             if(this.state.diagramReadyStatus1===true && this.state.diagramReadyStatus2===true){
                 if(prevState.diagramReadyStatus1===false || prevState.diagramReadyStatus2===false){
                     this.setupUniqueNodeExecutionPaths()
                 }
             }
    }

}


// Updates the similarity values
    updateSimilarity(part,identifier) {

       this.props.getSimilarity(part, identifier,this.updateDiagramNodes)

    }

    //Sets the colors of diagram nodes
    //Used as a callback in updateSimilarity to be called after the data is fetched
    updateDiagramNodes(similarity_values,identifier,selected_node_key){

        let myDiagram1 = this.diagram1.current.getDiagram();
        let myDiagram2 = this.diagram2.current.getDiagram();
        if (identifier === 1) {
            myDiagram1.nodes.each(function (n) {
                myDiagram1.model.commit(function (m) {
                    let value = 255 * (1 - similarity_values[String(n.data.key)]);
                    m.set(n.data, "similarity", "rgb(" + value + "," + value + "," + value + ")");
                }, 'change similarity value')
            });
            myDiagram2.nodes.each(function (n) {
                myDiagram2.model.commit(function (m) {
                    m.set(n.data, "similarity", "rgb(255, 255, 255)"); // similarity[n.data.key]
                    if (n.data.key === selected_node_key){
                        m.set(n.data, "similarity", "rgb(255, 0, 0)"); // similarity[n.data.key]
                    }
                }, 'change similarity value')
            });
        }
        else {
            myDiagram2.nodes.each(function (n) {
                myDiagram2.model.commit(function (m) {
                    let value = 255 * (1 - similarity_values[String(n.data.key)]);
                    m.set(n.data, "similarity", "rgb(" + value + "," + value + "," + value + ")");
                }, 'change similarity value')
            });
            myDiagram1.nodes.each(function (n) {
                myDiagram1.model.commit(function (m) {
                    m.set(n.data, "similarity", "rgb(255, 255, 255)"); // similarity[n.data.key]
                    if (n.data.key === selected_node_key){
                        m.set(n.data, "similarity", "rgb(255, 0, 0)"); // similarity[n.data.key]
                    }
                }, 'change similarity value')
            });
        }
    }



    /*
    Sets the unique execution path data for both subject systems.

    results are saved in state nodeUniqueExecutionPath1 and nodeUniqueExecutionPath2 variables
     */
    setupUniqueOptions(){
        let uniques=[]//to save both uniqe EP and set state only once
        if(this.props.diagramData1===undefined || this.props.diagramData2===undefined) return
        for (let j = 0; j < 2; j++) {
            let unique = [];
            unique.push({   label:"Select Unique Execution Path", value:"None"})
            const execution_paths = this.props["diagramData"+(j+1)]["string_execution_paths"];
            for (let i = 0; i < execution_paths.length; i++) {
                const index = (this.props["diagramData"+(((j+1)%2)+1)]["string_execution_paths"].indexOf(execution_paths[i]));


                if (index === -1) {
                    unique.push({ value:"["+i+","+j+"]", label:execution_paths[i]})
                }
            }

            uniques[j]=unique;

        }



        this.setState({
            nodeUniqueExecutionPath2:uniques[0],
            nodeUniqueExecutionPath1:uniques[1]
        })

    }


// Sets up the data structures used for getting unique execution paths of each of the two nodes that are being compared
    setupUniqueNodeExecutionPaths() {
        let node_unique_execution_paths=[];
        node_unique_execution_paths[0] = [];
        node_unique_execution_paths[1] = [];

        //reference of this to component can be rewritten in map function
        const component =this;

        component.diagram1.current.getDiagram().nodes.each(function (n) {
            node_unique_execution_paths[0][parseInt(n.key)] = [];
            const index1 = n.data.execution_paths;
            const execution_paths1 = Object.entries(index1).map(([k, v]) => component.props.diagramData1["string_execution_paths"][parseInt(k)]);
            component.diagram2.current.getDiagram().nodes.each(function (m) {
                if (node_unique_execution_paths[1][parseInt(m.key)] === undefined) {
                    node_unique_execution_paths[1][parseInt(m.key)] = [];
                }
                const index2 = m.data.execution_paths;
                const execution_paths2 = Object.entries(index2).map(([k, v]) => component.props.diagramData2["string_execution_paths"][parseInt(k)]);
                node_unique_execution_paths[0][parseInt(n.key)][parseInt(m.key)] = execution_paths1.filter(x => !execution_paths2.includes(x));
                node_unique_execution_paths[1][parseInt(m.key)][parseInt(n.key)] = execution_paths2.filter(x => !execution_paths1.includes(x));
            })
        });


        //encapsulating in an object to make it easy to be loaded by developer tools extension(otherwise will crash from 200k item arrays)
        const diagramUniqueExecutionPaths ={diagram1: node_unique_execution_paths[0], diagram2:node_unique_execution_paths[1]}


        this.setState({
            diagramUniqueExecutionPaths: diagramUniqueExecutionPaths

        })




    }


    // Updates the node details panels with the unique execution paths for each of the two nodes being compared
     updateUniqueNodePaths(key1, key2,identifier) {



         const unique_paths1 = this.state.diagramUniqueExecutionPaths.diagram1[key1][key2];
         const unique_paths2 = this.state.diagramUniqueExecutionPaths.diagram2[key2][key1];
        
 


         if(unique_paths1===undefined || unique_paths2===undefined) return;

         let list_version1 = [];
         let list_version2 = [];
         for (let i=0; i<unique_paths1.length;i++) {
             list_version1.push(unique_paths1[i]);
         }
         for (let i=0; i<unique_paths2.length;i++) {
             list_version2.push(unique_paths2[i]);
         }


         this.setState({
             uniqueExecutionPathList1:list_version1,
             uniqueExecutionPathList2:list_version2
         })

    }


    /*
    Sets the status of diagram(identifier as id of diagram) to the given status(true or false)
    when both become true -> calls setupUniqueNodeExecutionPaths
     */
    setDiagramReadyStatus(identifier, status,callback=()=>{}){

      



        this.setState({
            ['diagramReadyStatus'+identifier]:status
        },callback)

    }

    //Selecting the unique execution Path
    setUnqiueExecutionPathOfSystem(path, identifier){


        this.setState({
            ["selectedUniqueExecutionPath"+identifier]:JSON.parse(path)[0],
        })
    }



    /*
    Sets the status of the node panel to slide

    3 status

     1: open-> when panel is opened
     2:closing -> panel is getting closed (transition step)
     3:closed-> finished closing


     */
    slideToSide(identifier, status){
        const currentStatus = this.state["slide"+identifier];
        if(currentStatus==="closing") return;

        const timeOut=500;//300ms wait for transition

        if(status==="open")
        this.setState({
            ["slide"+identifier]:"open"
        })
        else if(status==="closing"){
            this.setState({
                ["slide"+identifier]:"closing"
            },()=>
                setTimeout( () => {
                    this.setState( prevState => ({
                        ["slide"+identifier]:"closed"
                    }));
                }, timeOut)
            )
        }
    }

    getSlideStyle(identifier){

        const slideStatus = this.state["slide"+identifier]
        if(slideStatus==="open"){
            return "col-md-3"
        }
        else if(slideStatus==="closing"){
            return "col-md-1 collapsedPanel"
        }

        else if(slideStatus==="closed"){
            return "collapsedPanel"
        }


    }

    render() {

        const slideStyle1 = this.getSlideStyle(1)
        const slideStyle2 =this.getSlideStyle(2);
        const slideStatus1 = this.state.slide1==="open"?"closing":"open";
        const slideStatus2 = this.state.slide2==="open"?"closing":"open"
        return (


        <Container fluid>
            <Row className={"justify-content-between navPanelHeader"}>
                <Col md={1} sm={1} xs={1} className={`d-flex justify-content-start`}>
                    <div  className={` nodeSlideButton  ${this.props.renderMode===2 ? "hide":""}`} style={{marginLeft:"-15px"}} onClick={()=>this.slideToSide(1,slideStatus1)}>
                        <i className={`fa ${slideStatus1==="open"? "fa-chevron-right":"fa-chevron-left"}`}></i>
                        <i className={`fa ${slideStatus1==="open"? "fa-chevron-right":"fa-chevron-left"}`}></i>
                        <i className={`fa ${slideStatus1==="open"? "fa-chevron-right":"fa-chevron-left"}`}></i>

                    </div>
                </Col>
                <Col md={1}  sm={1} xs={1} className={`d-flex justify-content-end `}>
                    <div onClick={()=>this.slideToSide(2,slideStatus2)} style={{marginRight:"-15px"}}className={` nodeSlideButton ${this.props.renderMode===0 ? "hide":""}`}>
                        <i className={`fa ${slideStatus2==="open"? "fa-chevron-left":"fa-chevron-right"}`}></i>
                        <i className={`fa ${slideStatus2==="open"? "fa-chevron-left":"fa-chevron-right"}`}></i>
                        <i className={`fa ${slideStatus2==="open"? "fa-chevron-left":"fa-chevron-right"}`}></i>

                    </div>
                </Col>
            </Row>
            <Row className={"justify-content-center"}>

                <div  className= {`${this.props.renderMode===2 ? "hide":""} ${slideStyle1}`} >
                    <Node style = {this.state.slide1==="closing"?{marginRight:"150%"}:{}}
                        setNodeInformationState={this.props.setNodeInformationState}
                        uniqueExecutionPath={this.state.nodeUniqueExecutionPath2}
                        uniqueExecutionPathList={this.state.uniqueExecutionPathList1}
                        data={this.props.nodeData1}  nodeID={"diagram1"}
                        identifier={1}
                        setUniqueExecutionPath={this.setUnqiueExecutionPathOfSystem}
                          />
                </div>

                <Col  id="diagrams">
                <div className={this.props.renderMode===2 ? "hide":""}  >


                <Diagram
                    height={ this.props.renderMode===1?{height:"400px"}:{height:"800px"}}
                    key={"fullDiagram1"+this.props.drawMode}
                    showNodeDetails={this.props.showNodeDetails}
                    cluster={this.props.diagramData1['cluster']} technique={this.props.technique}
                    nodeKeys={[this.props.nodeData1.key,this.props.nodeData2.key]}//used for finding unique keys
                    diagramID={"fullDiagram1"} identifier={1}
                    diagram={this.diagram1} updateSimilarity={this.updateSimilarity}
                    setReadyStatus={this.setDiagramReadyStatus}
                    updateUniqueNodePaths={this.updateUniqueNodePaths}
                    drawMode={this.props.drawMode}
                    searchedExecutionPaths = {this.props.searchedExecutionPaths}
                    sameExecutionPath={this.props.sameExecutionPath[0]}
                    selectedUniqueExecutionPath={this.state.selectedUniqueExecutionPath1}
                         />


                </div>

                    <div className = {this.props.renderMode===0 ? "hide":""}>


                        <Diagram
                            height={ this.props.renderMode===1?{height:"400px"}:{height:"800px"}}
                            key={"fullDiagram2"+this.props.drawMode}
                            showNodeDetails={this.props.showNodeDetails}
                            cluster={this.props.diagramData2['cluster']} technique={this.props.technique}
                            nodeKeys={[this.props.nodeData1.key,this.props.nodeData2.key]}//used for finding unique keys
                            diagramID={"fullDiagram2"} identifier={2}
                            updateSimilarity={this.updateSimilarity}
                            updateUniqueNodePaths={this.updateUniqueNodePaths}
                            setReadyStatus={this.setDiagramReadyStatus}
                            drawMode={this.props.drawMode}
                            diagram={this.diagram2}
                            searchedExecutionPaths = {this.props.searchedExecutionPaths}
                            sameExecutionPath={this.props.sameExecutionPath[1]}
                            selectedUniqueExecutionPath={this.state.selectedUniqueExecutionPath2}


                        />

                    </div>
                </Col>

                <div   className={ `${this.props.renderMode===0 ? "hide":""} ${slideStyle2}`} >
                    <div className={"d-flex justify-content-end"}>

                    </div>
                    <Node
                        setNodeInformationState={this.props.setNodeInformationState}
                        style = {this.state.slide2==="closing"?{marginLeft:"150%"}:{}}
                        uniqueExecutionPath={this.state.nodeUniqueExecutionPath1}
                        uniqueExecutionPathList={this.state.uniqueExecutionPathList2}
                        data={this.props.nodeData2}    nodeID={"diagram2"}
                        identifier={2} setUniqueExecutionPath={this.setUnqiueExecutionPathOfSystem}

                    />
                </div>

            </Row>
        </Container>
        )
    }
}