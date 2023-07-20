import React, {Component, useEffect} from 'react';
import {Accordion, Button} from "react-bootstrap";
import Select from "react-select";



export default class Node extends Component {


    constructor(props) {
        super(props);
        this.state = {

        }


    this.formatFiles = this.formatFiles.bind(this);
    this.formatExecutionPath=this.formatExecutionPath.bind(this);
    this.formatNodePatterns = this.formatNodePatterns.bind(this);
    this.handleUniqueExecutionPathChange=this.handleUniqueExecutionPathChange.bind(this);
    }

    /*
    gets the array of files, returns HTML formated version
     */
    formatFiles(){
        let result = []
        const items=this.props.data.items;
        if(items===undefined)return "";



        for (let i = 0; i < items.length; i++) {
            if(items[i].length >0) result.push(<li key={"fileli"+String(i)+":"+String(items[i])+":"+this.props.nodeID} value={i}> {items[i]} </li>);
        }



        return result
    }


    formatExecutionPath(paths,split='->',key="", temporalState=0){


            const newFileNameSeparator=String.fromCharCode(8681) //double downwards arrow
            const defaultSeparator=String.fromCharCode(8595) //downwards arrow
            let result = []

            let listForm=[];//list format of all items
            //if no path is to be found
            if(paths===undefined || paths.length===0) return "";
            //creates list of all items separated by downward arrow
            for(let i=0;i<paths.length;i++) {
                let items = paths[i].trim().split(split);
                if(items==="") continue
                let firstItem = true;//Track if this is the first item of list that is not empty string

                let EPblock=[];
                listForm[i]=[];

                let currentFileName="";//function name(the path to the file)
                for (let j = 0; j < items.length; j++) {
                    items[j] = items[j].trim()//remove white space
                    if (items[j] === "" || items[j]===".") continue//exclude empty or dot

                    //separate function name from path
                    let filePath = items[j].split("(")
                    let functionName = items[j].substring(items[j].indexOf("::")+2,items[j].indexOf("("))
                    filePath=filePath[filePath.length-1];


                    filePath = filePath.substring(0,filePath.length-1)//exclude last closing parenthesis symbol


                    if (!firstItem) {

                        //Setting the separator symbol for when new file is selected or new function in same file

                        EPblock.push(
                            <p key={"EPp"+key+String(i)+":"+String(items[i])+String(j)+":"+this.props.nodeID} className='executionPathArrowDown'>

                                {filePath !== currentFileName? newFileNameSeparator:defaultSeparator}

                            </p>
                        )





                    }

                    //if different file is selected add the file path to top
                    if(filePath!==currentFileName) {
                        EPblock.push(<span key={"EPspan"+key+String(i)+":"+String(items[i])+String(j)+":"+this.props.nodeID}>{filePath}</span>)
                        currentFileName=filePath;
                    }


                    //Check if <b> tag exists in name
                    if(functionName.substring(0,3)==="<b>"){//add the b tag and substing it from name
                        EPblock.push(<p
                            key={"EPp2" + key + String(i) + ":" + String(items[i]) + String(j) + ":" + this.props.nodeID}
                            className='functionName'><b>{functionName.substring(3,functionName.length-4)}</b></p>)

                    }
                    else {
                        EPblock.push(<p
                            key={"EPp2" + key + String(i) + ":" + String(items[i]) + String(j) + ":" + this.props.nodeID}
                            className='functionName'>{functionName}</p>)
                    }
                    listForm[i].push(items[j])
                    firstItem = false
                }

                result.push(<div key={"EPdiv"+key+String(i)+":"+String(items[i])+":"+this.props.nodeID}>{EPblock}</div>)
            }

            if(temporalState===1){
                return [result, listForm]
            }
            return result
        }


    formatNodePatterns(paths){
        if(paths===undefined) return
        paths= paths.replaceAll(". <br>","")//remove page breaks
        paths=paths.trim().split("&#187;").filter(i=>i)//split by >> symbol, filter out empty strings
        let patterns = this.formatExecutionPath(paths,"&rarr;","Node Pattern",1)



        return patterns;
    }

    handleUniqueExecutionPathChange(e){
        if(e.value!=="None")
            this.props.setUniqueExecutionPath(e.value, this.props.identifier)
    }

    render() {
        //Select styles
        const colourStyles = {
            menuList: styles => ({
                ...styles,
            }),
            option: (styles, {isFocused, isSelected}) => ({
                ...styles,
                background: isSelected
                        ? 'hsl(0deg 0% 30.16%)'
                        : undefined,
                fontSize:isSelected?
                            "13px" : "12px",
                transition:isFocused? "all 0.1s ease" :"transition: all 0.25s ease"
            }),

        }
        let patterns=this.formatNodePatterns(this.props.data.executionPatterns);

        let patternsList=undefined;


        if(patterns!==undefined) {
            patternsList=patterns[1]
            patterns = patterns[0]
        }
        let nodeData={...this.props.data,executionPatternsList:patternsList,uniqueExecutionPaths:this.props.uniqueExecutionPathList}

        return (

            <div className={"nodePanel"} style={this.props.style}>
                <div className="row justify-content-around">
                    <div className={"nodeCountInfo col"}>
                        <p>Node Key:<b>   {this.props.data.key}</b></p>
                        <p> Number of Files:<b>   {this.props.data.numberOfFiles} </b></p>
                        <p> Number of Execution paths:<b>   {this.props.data.executionPathCount} </b></p>
                    </div>

                    { this.props.data.key!==undefined &&
                    <div className="col d-flex justify-content-end align-items-center">

                            <Button variant={"outline-dark"} className={"nodeInformationButton"} onClick={()=>this.props.setNodeInformationState(true, nodeData,this.props.identifier)}>See more</Button>

                    </div>

                     }
                </div>
                <Accordion  alwaysOpen>
                    <Accordion.Item eventKey={1}>
                        <Accordion.Header >
                                Files
                        </Accordion.Header>

                        <Accordion.Body>
                                <div  className="vertical-scrollbar"><ol>{this.formatFiles()}</ol></div>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={2}>
                        <Accordion.Header >
                                Node summary
                        </Accordion.Header>


                        <Accordion.Body >


                                <div id={this.props.nodeID} className="vertical-scrollbar">
                                    <p>
                                        {this.props.data.textSummary}
                                    </p>

                                </div>

                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={3}>
                        <Accordion.Header>
                                Execution patterns
                        </Accordion.Header>
                        <Accordion.Body>
                                <div className="vertical-scrollbar" >
                                    <div className="executionPathContainer card-text vertical-scrollbar">
                                    {patterns}
                                    </div>
                                </div>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={4}>
                        <Accordion.Header>
                                Unique Node Specific Execution Paths
                        </Accordion.Header>
                        <Accordion.Body >
                            <div className="executionPathContainer card-text vertical-scrollbar">

                                    {
                                       this.formatExecutionPath( this.props.uniqueExecutionPathList)
                                    }


                                </div>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey={5}>
                        <Accordion.Header >

                                Execution Paths

                        </Accordion.Header>
                        <Accordion.Body>
                                <div className="executionPathContainer card-text vertical-scrollbar">

                                    {this.formatExecutionPath(this.props.data.executionPaths,'->',"ExecutionPath")}

                                </div>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>


                <div className="row unique_paths reactSelect">
                    <div className="col">
                        <b> Show Unique Execution Path For Subject System {this.props.identifier} </b>


                        <Select styles={colourStyles} defaultValue={"None"} options={ this.props.uniqueExecutionPath} onChange={this.handleUniqueExecutionPathChange}

                                getOptionLabel={option => option.label}
                                getOptionValue={option => option.value}
                        />
                    </div>
                </div>

            </div>

        )
    }
}