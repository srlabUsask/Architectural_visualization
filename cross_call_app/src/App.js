import React, { useState, useEffect } from 'react';
import CallGraph from "./components/CallGraph";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function App() {
  return (
    <div className="App" >
        <Container fluid>
            <Row>
                <Col>
                    <CallGraph></CallGraph>
                </Col>
            </Row>
        </Container>



    </div>
  );
}
