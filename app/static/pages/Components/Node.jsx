import React, {Component, useEffect} from 'react';
import {Accordion} from "react-bootstrap";



export default class Node extends Component {


    constructor(props) {
        super(props);
        this.state = {


        }



    }



    render() {
        return (


                <Accordion id="diagram1Accordion" alwaysOpen>
                    <Accordion.Item eventKey={1}>
                        <Accordion.Header >
                                Files
                        </Accordion.Header>

                        <Accordion.Body>
                                <div id="files1" className="vertical-scrollbar"></div>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={2}>
                        <Accordion.Header >
                                Node summary
                        </Accordion.Header>


                        <Accordion.Body >


                                <div id={this.props.nodeID} className="vertical-scrollbar"></div>

                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={3}>
                        <Accordion.Header>
                                Execution patterns
                        </Accordion.Header>
                        <Accordion.Body>
                                <div className="vertical-scrollbar" id="node_patterns1"></div>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={4}>
                        <Accordion.Header>
                                Unique Node Specific Execution Paths
                        </Accordion.Header>
                        <Accordion.Body >
                                <div className="vertical-scrollbar" id="unique_node_execution_paths1"></div>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={5}>
                        <Accordion.Header >

                                Execution Paths

                        </Accordion.Header>
                        <Accordion.Body>
                                <p className="card-text vertical-scrollbar" id="searched_execution_paths1"></p>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>



        )
    }
}