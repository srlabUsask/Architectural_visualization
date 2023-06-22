import React, {Component, createRef} from "react";

import $ from 'jquery';
import {Col, Row, ToggleButtonGroup, ToggleButton, Container} from "react-bootstrap";


/*
Creates the header(navbar) of the website\

includes: choosing graph model, method, files for both subjects systems, Execution path search and load graph button.
 */
export default class Header extends Component {


    constructor(props) {
        super(props);

        this.collapseHeader=createRef();


        this.state = {
            renderMode:1,
            subjectSystems:[this.props.subject_systems[0],this.props.subject_systems[0]],//initialized to first value
            selectedTechnique:this.props.technique_choices[0],
            diagramDrawMode:0,
            selectedSameExecutionPath:null,
            selectedHighlightFunction:null,
            collapsed:false,
        }
        this.renderModeChange= this.renderModeChange.bind(this);
        this.diagramModeChange=this.diagramModeChange.bind(this);
        this.handleSubjectSystemChange=this.handleSubjectSystemChange.bind(this);
        this.handleSubmit=this.handleSubmit.bind(this);
        this.handleTechniqueChange = this.handleTechniqueChange.bind(this)
        this.setUpSameExecutionPaths = this.setUpSameExecutionPaths.bind(this)
        this.setUpFunctionSearch=this.setUpFunctionSearch.bind(this);
        this.handleSameExecutionPathChange = this.handleSameExecutionPathChange.bind(this);
        this.handleFucntionSearchChange=this.handleFucntionSearchChange.bind(this);
        this.handleCollapseClick=this.handleCollapseClick.bind(this);
    }



    /*
    chosing between first subject system, both subject systems, second subject system
     */
    renderModeChange(e){

        this.props.setSystemRenderMode(parseInt(e)-1)


        //Store mode in state to disable/enable rendering the same execution path block
        this.setState({
                renderMode:parseInt(e)-1,
            } )
    }

    /*
 chosing between first subject system, both subject systems, second subject system
  */
   diagramModeChange(e) {

       this.setState({
           diagramDrawMode:parseInt(e.target.value)
       })
   }

        /*
        when "Load cluster tree" is clicked
         */
    handleSubmit(){

        this.props.initializeGraph(this.state.subjectSystems, this.state.selectedTechnique,this.state.diagramDrawMode)
    }

    /*
    Recieves the value of subject and its index (starting from 1)
    stores the choice in state
     */
    handleSubjectSystemChange(value,index){
        let subjectSystems = [...this.state.subjectSystems]
        subjectSystems[index-1]=value


        this.setState({
            subjectSystems:subjectSystems,
        })
    }
    handleTechniqueChange(e){
        this.setState({
            selectedTechnique:e.target.value
        })
    }

    handleSameExecutionPathChange(e){
        if(e.target.value!=="None")
        this.props.setSameExecutionPath(e.target.value)
    }

    handleUniqueC
    handleFucntionSearchChange(e){
        if(e.target.value!=="None")
        this.props.setHighlightFunction(e.target.value)
    }

    setUpSameExecutionPaths(){
        //if no file is selected yet
        if(this.props.stringExecutionPathNames[0]===undefined || this.props.stringExecutionPathNames[1]===undefined){
            return ""
        }

        let same = [];
        same.push(<option key={0} value={"None"}>Select execution Path</option>)
        for (let j = 0; j < 2; j++) {
            let unique = [];
            const execution_paths = this.props.stringExecutionPathNames[j];
            for (let i = 0; i < execution_paths.length; i++) {
                const index = (this.props.stringExecutionPathNames[(j + 1) % 2].indexOf(execution_paths[i]));
                if (j === 0 && this.state.renderMode===1) {
                    same.push(<option key={String(j)+":"+i} value={"["+i+","+index+"]"}>{execution_paths[i]}</option>);
                }
            }




        }

        return same
    }


    /*
    recieves the list of search functions
    sets list values into select component
     */
    setUpFunctionSearch(){

        if(this.props.functionSearchData.length===0) return""

        let functions = []
        functions.push(<option key={0} value={"None"}>Select highlight function</option>)
        for(let i=0;i<this.props.functionSearchData.length;i++){
            const functionData = this.props.functionSearchData[i];
            functions.push(<option key={"["+functionData.key[0]+","+functionData.key[1]+"]"+functionData} value={"["+functionData.key[0]+","+functionData.key[1]+"]"}>{functionData.value}</option>)
        }



        return  functions;
    }

    handleCollapseClick(e){

        this.setState({
            collapsed:!this.state.collapsed
        })
        $(this.collapseHeader.current).slideToggle();
    }
    render() {
        const sameExecutionPaths = this.setUpSameExecutionPaths();
        const collapseStyle = this.state.collapsed ?  "navBarOpaque":"";
        const collapseIcon = !this.state.collapsed ? "fa-angle-up":"fa-angle-down navToggled"


        return (
            <Row className={`nav justify-content-end ${collapseStyle}`} id="navBar">
                <Col className={"navBarCollapse"} id={"collapseNavHeader"} ref={this.collapseHeader}>
                    <Container fluid className={"d-flex justify-content-center"} id="view">
                        <ToggleButtonGroup type="radio" name="options" defaultValue={2} onChange={this.renderModeChange}>


                                <ToggleButton id="system1" variant={"secondary"} value={1} autoComplete="off">
                                    First Subject System
                                </ToggleButton>

                            <ToggleButton id="systemBoth" variant={"secondary"} value={2} autoComplete="off">
                                Both Subject
                                Systems
                            </ToggleButton>
                            <ToggleButton id="system2"  variant={"secondary"} value={3} autoComplete="off">
                                Second Subject
                                System
                            </ToggleButton>

                        </ToggleButtonGroup>

                    </Container>


                    <Container fluid>
                        <Row>
                        <Col md>
                            <b> Technique to label nodes</b> <br/>


                                <select onChange={this.handleTechniqueChange} title={"technique_choice"} name="technique_choice" id="technique_choice_id" className={"form-control"}>
                                    {this.props.technique_choices.map(function(object, i){




                                        return <option key={object} value={object}>{object}</option>;
                                    })
                                    }

                                </select>

                        </Col>

                        <Col md={6}>
                            <b> Model for Graph</b> <br/>
                            <select onChange={this.diagramModeChange} title="Model for grapgh" className={"form-control"} name="graph_model" id="graph_model_id">
                                <option value={0}>Directory</option>
                                <option value={1}>Tree</option>
                            </select>
                        </Col>
                        </Row>
                    </Container>


                    <Container fluid >
                        <Row>
                        <Col md={6} xs={12}>
                            <b> Subject System 1 </b> <br/>
                            <select title="Subject System 1" onChange={(e)=>{this.handleSubjectSystemChange(e.target.value,1)}} name="subject_system" id="subject_system_id1" className={"form-control"}>

                                {
                                    this.props.subject_systems.map(function(object, i){
                                    return <option key={object} value={object}>{object}</option>;
                                })
                                }

                            </select>
                        </Col>
                        <Col md={6} xs={12}>
                            <b> Subject System 2 </b> <br/>
                            <select title="Subject System 2" onChange={(e)=>{this.handleSubjectSystemChange(e.target.value,2)}} name="subject_system" id="subject_system_id2" className={"form-control"}>
                                {this.props.subject_systems.map(function(object, i){
                                    return <option key={object} value={object}>{object}</option>;
                                })
                                }

                            </select>
                        </Col>
                        </Row>
                    </Container>

                    {this.state.renderMode===1 &&
                    <Container fluid id="same_execution_paths_block">

                        <div >
                            <b> Show Same Execution Path </b> <br/>
                            <select  onChange={this.handleSameExecutionPathChange} title="Same Execution Path" className={"form-select"} name="same_paths" id="same_execution_paths">
                                {sameExecutionPaths===""? <option value="None">None</option>:sameExecutionPaths}
                            </select>
                        </div>

                    </Container>
                    }

                    <Container fluid >

                        <div >
                            <b> Highlight Functions</b> <br/>
                            <div className={"d-flex"}>
                                <select onChange={this.handleFucntionSearchChange} title="Highlight Functions" id='function_file' name='select_elem' className={"form-control"}>
                                    {this.setUpFunctionSearch()}
                                </select>

                            </div>
                        </div>

                    </Container>


                    <div className={"d-flex justify-content-center navBarLoadButton"}>

                        <button onClick={this.handleSubmit} type="submit" className={"btn btn-secondary float-end"}> Load
                            Cluster Tree
                        </button>

                    </div>
                </Col>
                <div className={"navCollapseButton d-flex align-items-end justify-content-center"}>
                    <i onClick={this.handleCollapseClick} className={`fa ${collapseIcon}`}>
                    </i>

                </div>

            </Row>

        )
    }
}