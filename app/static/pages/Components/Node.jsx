import React, {Component, useEffect} from 'react';
import {Accordion} from "react-bootstrap";



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


    formatExecutionPath(paths,split='->',key=""){


            const newFileNameSeparator=String.fromCharCode(8681) //double downwards arrow
            const defaultSeparator=String.fromCharCode(8595) //downwards arrow
            let result = []
            //if no path is to be found
            if(paths===undefined || paths.length===0) return "";
            //creates list of all items separated by downward arrow
            for(let i=0;i<paths.length;i++) {
                let items = paths[i].trim().split(split);
                if(items==="") continue
                let firstItem = true;//Track if this is the first item of list that is not empty string

                let EPblock=[];


                let currentFileName="";//function name(the path to the file)
                for (let j = 0; j < items.length; j++) {
                    items[j] = items[j].trim()//remove white space
                    if (items[j] === "" || items[j]===".") continue//exclude empty or dot

                    //separate function name from path
                    let filePath = items[j].split("(")
                    let functionName = filePath[0]
                    filePath=filePath[1]

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
                    firstItem = false
                }

                result.push(<div key={"EPdiv"+key+String(i)+":"+String(items[i])+":"+this.props.nodeID}>{EPblock}</div>)
            }
            return result
        }


    formatNodePatterns(paths){
        if(paths===undefined) return
        paths= paths.replaceAll(". <br>","")//remove page breaks
        paths=paths.trim().split("&#187;").filter(i=>i)//split by >> symbol, filter out empty strings
        return this.formatExecutionPath(paths,"&rarr;","Node Pattern")
    }

    handleUniqueExecutionPathChange(e){
        if(e.target.value!=="None")
            this.props.setUniqueExecutionPath(e.target.value, this.props.identifier)
    }

    render() {
        return (

            <div className={"nodePanel"} style={this.props.style}>
                <div className={"nodeCountInfo"}>
                <p>Node Key:<b>   {this.props.data.key}</b></p>
                <p> Number of Files:<b>   {this.props.data.numberOfFiles} </b></p>
                <p> Number of Execution paths:<b>   {this.props.data.executionPathCount} </b></p>
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
                                    {this.formatNodePatterns(this.props.data.executionPatterns)}
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


                <div className="row unique_paths">
                    <div className="col">
                        <b> Show Unique Execution Path For Subject System {this.props.identifier} </b>
                        <select onChange={this.handleUniqueExecutionPathChange} className="form-control" title="unique_paths" name="unique_paths">
                        {this.props.uniqueExecutionPath.length===0? <option value="None">None</option>:this.props.uniqueExecutionPath }
                        </select>
                    </div>
                </div>

            </div>

        )
    }
}