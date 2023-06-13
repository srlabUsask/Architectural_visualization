import React, {Component} from "react";


import {Col, Row, ToggleButtonGroup,ToggleButton, Container} from "react-bootstrap";


/*
Creates the header(navbar) of the website\

includes: choosing graph model, method, files for both subjects systems, Execution path search and load graph button.
 */
export default class Header extends Component {


    constructor(props) {
        super(props);



        this.state = {

        subjectSystems:[this.props.subject_systems[0],this.props.subject_systems[0]],//initialized to first value
        selectedTechnique:[this.props.technique_choices[0]],
        selectedSameExecutionPath:null,
        selectedHighlightFunction:null,
        }
        this.renderModeChange= this.renderModeChange.bind(this);
        this.handleSubjectSystemChange=this.handleSubjectSystemChange.bind(this);
        this.handleSubmit=this.handleSubmit.bind(this);
    }


    renderModeChange(e){

        this.props.setSystemRenderMode(parseInt(e)-1)
    }

    handleSubmit(){

        this.props.initializeGraph(this.state.subjectSystems, this.state.selectedTechnique)
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
    render() {
        return (
            <Row className={"nav justify-content-end"} id="navBar">
                <Col className={"nabBarCollapse"}>
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


                                <select name="technique_choice" id="technique_choice_id" className={"form-control"}>
                                    {this.props.technique_choices.map(function(object, i){




                                        return <option key={object} value={object}>{object}</option>;
                                    })
                                    }

                                </select>

                        </Col>

                        <Col md-6>
                            <b> Model for Graph</b> <br/>
                            <select className={"form-control"} name="graph_model" id="graph_model_id">
                                <option value="directory">Directory</option>
                                <option value="tree">Tree</option>
                            </select>
                        </Col>
                        </Row>
                    </Container>


                    <Container fluid >
                        <Row>
                        <Col md-6 xs-12>
                            <b> Subject System 1 </b> <br/>
                            <select onChange={(e)=>{this.handleSubjectSystemChange(e.target.value,1)}} name="subject_system" id="subject_system_id1" className={"form-control"}>

                                {
                                    this.props.subject_systems.map(function(object, i){
                                    return <option key={object} value={object}>{object}</option>;
                                })
                                }

                            </select>
                        </Col>
                        <Col md-6 xs-12>
                            <b> Subject System 2 </b> <br/>
                            <select onChange={(e)=>{this.handleSubjectSystemChange(e.target.value,2)}} name="subject_system" id="subject_system_id2" className={"form-control"}>
                                {this.props.subject_systems.map(function(object, i){
                                    return <option key={object} value={object}>{object}</option>;
                                })
                                }

                            </select>
                        </Col>
                        </Row>
                    </Container>


                    <Container fluid id="same_execution_paths_block">

                        <div >
                            <b> Show Same Execution Path </b> <br/>
                            <select className={"form-control"} name="same_paths" id="same_execution_paths">
                                <option value="None">None</option>
                            </select>
                        </div>

                    </Container>

                    <Container fluid >

                        <div >
                            <b> Highlight Functions</b> <br/>
                            <div className={"d-flex"}>
                                <select id='function_file' name='select_elem' className={"form-control"}> </select>
                                <button type="submit" className={"btn btn-secondary"} id="search_button"> Search</button>
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
                    <i className={"fa fa-angle-up"}>
                    </i>

                </div>

            </Row>

        )
    }
}