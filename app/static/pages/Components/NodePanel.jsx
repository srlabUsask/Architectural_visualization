import React, { Component } from 'react';

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


        }
    }


    render() {
        return (
        <Container fluid>
            <Row className={"justify-content-center"}>
                { this.props.renderMode!==2 &&
                <Col md={3}>
                    <Node  nodeID={"diagram2"}/>
                </Col>
                }
                <Col  id="diagrams">
                    { this.props.renderMode!==2 &&
                <Diagram diagramID={"fullDiagram1"} key={1}/>
                    }
                    { this.props.renderMode!==0 &&
                <Diagram diagramID={"fullDiagram2"} key={2}/>
                    }
                </Col>
                { this.props.renderMode!==0 &&
                <Col  md={3}>
                    <Node  nodeID={"diagram2"}/>
                </Col>
                }
            </Row>
        </Container>
        )
    }
}