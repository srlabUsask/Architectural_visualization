import React, { Component } from 'react';
import Header from "./Header";
import NodePanel from "./NodePanel"
import * as go from 'gojs';
import  "../../styles/style.css"


/*
state variables information

subject_systems: all subject_system files that are displayed in header select
techniqueChoices: all node labeling techniques that are displayed in header select

selectedSubjectSystems,selectedTechnique: currently selected option from lists above

diagramData1, diagramData2: data received from POST request to get_cluster. equivalent of cluster_jsons array in manipulate_tree.js
nodeData1, nodeData2: data needed to be displayed on side nodes(node key, EP count, file names)

subjectSystemRenderMode: radio buttons in header, rendereing first(0), both(1) or second(2) subject system.
 */


export default class Application extends Component {

    constructor(props) {
        super(props);


        //Initialize goJS data

        // use a V figure instead of MinusLine in the TreeExpanderButton
        go.Shape.defineFigureGenerator("ExpandedLine", function(shape, w, h) {
            return new go.Geometry()
                .add(new go.PathFigure(0, 0.25*h, false)
                    .add(new go.PathSegment(go.PathSegment.Line, .5 * w, 0.75*h))
                    .add(new go.PathSegment(go.PathSegment.Line, w, 0.25*h)));
        });

        // use a sideways V figure instead of PlusLine in the TreeExpanderButton
        go.Shape.defineFigureGenerator("CollapsedLine", function(shape, w, h) {
            return new go.Geometry()
                .add(new go.PathFigure(0.25*w, 0, false)
                    .add(new go.PathSegment(go.PathSegment.Line, 0.75*w, .5 * h))
                    .add(new go.PathSegment(go.PathSegment.Line, 0.25*w, h)));
        });



        const subject_systems = JSON.parse(document.querySelector("#subject_systems").innerHTML);
        const technique_choices =JSON.parse(document.querySelector("#technique_choices").innerHTML);


        this.state = {
            subjectSystems:subject_systems,
            techniqueChoices:technique_choices,
            //Chosen files for subject systems
            selectedSubjectSystems:[],
            selectedTechnique:null, //node labeling technique
            selectedSameExecutionPath:"",
            selectedHighlightFunction:"",


            //all data from reading the file
            //cluster, execution_path,function_id_to_filename/file/name,
            diagramData1:{},
            diagramData2:{},

            //Data for the side panels
            nodeData1:{},
            nodeData2:{},
            functionSearchData:[],
            searchedExecutionPaths:[],
            subjectSystemRenderMode:1, //0 renders only subject system 1, 1 renders both, 2 renders system 2
            diagramDrawMode:0,//0 renders as dictionary, 1 renders as tree
        }


        this.setSystemRenderMode=this.setSystemRenderMode.bind(this)
        this.setDiagramDrawMode=this.setDiagramDrawMode.bind(this)
        this.initializeGraph = this.initializeGraph.bind(this);
        this.getCluster = this.getCluster.bind(this)
        this.get_similarity = this.get_similarity.bind(this);
        this.showNodeDetails = this.showNodeDetails.bind(this)
        this.getExecutionPaths=this.getExecutionPaths.bind(this);
        this.setUpStringExecutionPaths=this.setUpStringExecutionPaths.bind(this);
        this.setupSearchForFunction = this.setupSearchForFunction.bind(this)
        this.setSameExecutionPath=this.setSameExecutionPath.bind(this);
        this.setHighlightFunction=this.setHighlightFunction.bind(this);
        this.findExecutionPathsForFunction=this.findExecutionPathsForFunction.bind(this);
    }


 /*
 called on "Load cluster tree" button click
 sets selected file names(subjectSystems) and node labeling technique(selected Technique)

 Draws the graph
  */
      initializeGraph(subjectSystems, selectedTechnique,diagramDrawMode) {



          const subject_system = subjectSystems[0];
          const other_subject_system = subjectSystems[1];


          //  Saving values to set the state only once after everything is fetched
          const sysyemData = {selectedSubjectSystems:[subject_system,other_subject_system],
              selectedTechnique:selectedTechnique,
              diagramDrawMode:diagramDrawMode}

            this.getCluster(subject_system,other_subject_system,sysyemData);












    }

    /*
 Sends a post request to get_cluster URL with the names of chosen files in header
 in app.py, the files are read and result is returned.

 subjectSystems: (currently 2 file name) chosen files to read

  */

    async getCluster(subjectSystem1,subjectSystem2,systemData){
        const Url = '/get_cluster';
        let data = new FormData()

        data.append("subject_system", subjectSystem1)
        data.append("other_subject_system", subjectSystem2)
        let diagramData1 = await fetch(Url,
            {
                method: 'POST',
                body: data,
                credentials: 'same-origin'
            }
        ).then(response => response.json())

        data = new FormData()

        data.append("subject_system", subjectSystem2)
        data.append("other_subject_system", subjectSystem1)
        let diagramData2 = await fetch(Url,
            {
                method: 'POST',
                body: data,
                credentials: 'same-origin'
            }
        ).then(response => response.json())

        const string_Data =  this.setUpStringExecutionPaths([diagramData1,diagramData2])
        const functionSearchData = this.setupSearchForFunction(diagramData1["function_id_to_name_file"], diagramData2["function_id_to_name_file"])
        //Save the string version of data with the rest of it
        diagramData1['string_execution_paths'] = string_Data[0][0]
        diagramData2['string_execution_paths'] = string_Data[0][1]
        diagramData1['string_execution_path_names'] = string_Data[1][0]
        diagramData2['string_execution_path_names'] = string_Data[1][1]


        this.setState({
            selectedSubjectSystems:[systemData.selectedSubjectSystems[0],systemData.selectedSubjectSystems[1]],
            selectedTechnique:systemData.selectedTechnique,
            diagramDrawMode:systemData.diagramDrawMode,
            diagramData1:diagramData1,
            diagramData2:diagramData2,
            functionSearchData:functionSearchData,
        })

    }

    // Gets similarity values for a given node and then updates the heat map based on the similarity values
    //calls the callback function when data is fetched
    get_similarity(part, identifier,callback=()=>{}) {
        const Url = '/get_similarity';
        let data = new FormData()

        data.append("subject_system", this.state.selectedSubjectSystems[identifier-1])
        data.append("key", part.data.key)

        fetch(Url,
            {
                method: 'POST',
                body: data,
                credentials: 'same-origin'
            }
        ).then(response => response.json())
            .then(json => {

                callback(json,(identifier % 2) + 1,part.data.key);



            })

    }

    setSystemRenderMode(mode){
        this.setState({
            subjectSystemRenderMode:mode
        })
    }
    setDiagramDrawMode(mode){
        this.setState({
            diagramDrawMode:mode
        })
    }

    setSameExecutionPath(value){

        this.setState({
            selectedSameExecutionPath:JSON.parse(value)
        })
    }

    setHighlightFunction(value){

        const function_ids = JSON.parse(value);
        const key1 = String(function_ids[0]);
        const key2 = String(function_ids[1]);

        //2 items in array
        //1 is the indices of nodes for highlighting the diagram nodes
        //2 is array of two each are string execution paths for node executionPath
        const execution_paths=this.findExecutionPathsForFunction(key1,key2)

        let nodeData1={...this.state.nodeData1}
        let nodeData2={...this.state.nodeData2}
        nodeData1.executionPaths=execution_paths[1][0]
        nodeData2.executionPaths=execution_paths[1][1]


        this.setState({
            selectedHighlightFunction:value,
            searchedExecutionPaths:execution_paths[0],
            nodeData1:nodeData1,
            nodeData2:nodeData2,
        })
    }



// Sets and shows a given nodes details
    showNodeDetails(part, identifier) {

        var clickable_text = '';

        for (let index = 0; index < part.data.files.length; index++) {
            clickable_text +=  part.data.files[index] + ' , ';
        }

        const key = part.data.key;
        const textSummary=part.data.text_summary;
        //const nodePatterns= listNodePatterns(part.data.spm_method);


        //Change the file text into a numbered list

        let items = clickable_text.trim().split(',');

        //set files innerHTML

        const numberOfFiles= part.data.files_count;
        const executionPathCount= part.data.execution_path_count;
        const executionPatterns=part.data.spm_method
        const nodeData = "nodeData"+identifier;
        const executionPaths=this.getExecutionPaths(part.data.execution_paths, identifier);
        this.setState({
            [nodeData]:{key:key, textSummary:textSummary, items:items,numberOfFiles:numberOfFiles, executionPathCount:executionPathCount,executionPaths:executionPaths,executionPatterns:executionPatterns},
        })






    }

    // Returns a maximum of 15 execution paths in a more visually appealing block of text.
    getExecutionPaths(eps, index){

        let data = this.state["diagramData"+index]

        let eps_preety = ''
        let count = 0
        let eps_list=[]
        for(let [key, value] of Object.entries(eps)){
            count += 1
            if(count === 15){
                break
            }
            for(let f = 0; f < data['execution_paths'][key].length; f++){
                eps_preety += data['function_id_to_name'][data['execution_paths'][key][f]]
                eps_preety += '(' + data['function_id_to_file_name'][data['execution_paths'][key][f]] + ')'

                eps_preety += '->' // Arrow (use Google to see the visual of this)
            }
            eps_list.push(eps_preety)
        }

        return eps_list
    }



    /* Sets up the data structures used for searching for execution paths existence in a node. The execution paths are first
    divided into three groups: paths that appear only in one cluster tree, paths that appear only in the other cluster tree,
    and paths that appear in both trees. This is to make finding for paths that are unique or shared much easier to do.
     */
     setUpStringExecutionPaths(clusters) {
         let cluster;
         let string_execution_paths=[];
         let string_execution_Paths_names=[]
        for (let j = 0; j < 2; j++) {
             cluster = clusters[j]

             string_execution_paths[j] = [];
            string_execution_Paths_names[j]=[]
            const execution_paths = cluster['execution_paths'];
            for (let i = 0; i < execution_paths.length; i++) {
                let execution_path_string = '';
                let execution_path_string_name = '';
                execution_path_string += '';
                for (let f = 0; f < execution_paths[i].length; f++) {
                    execution_path_string_name+=cluster['function_id_to_name'][execution_paths[i][f]]
                    execution_path_string_name+=" ( "+cluster['function_id_to_file_name'][execution_paths[i][f]].split("/").pop()+")"
                    execution_path_string += cluster['function_id_to_name'][execution_paths[i][f]];
                    execution_path_string += '(' + cluster['function_id_to_file_name'][execution_paths[i][f]] + ')';

                    execution_path_string += ' -> ';
                    if(f!==execution_paths[i].length-1)
                        execution_path_string_name+=' -> '
                }
                execution_path_string += '.';
                string_execution_paths[j].push(execution_path_string);
                string_execution_Paths_names[j].push(execution_path_string_name)
            }
        }


        return [string_execution_paths,string_execution_Paths_names];


    }
    // Sets up the data structures used for searching for a given function existence in a node
     setupSearchForFunction(function_id_to_name_file1, function_id_to_name_file2){
        let data = [];
        let tracker = []
        for (const key1 in function_id_to_name_file1) {
            let key2 = Object.keys(function_id_to_name_file2).find(k => function_id_to_name_file2[k] === function_id_to_name_file1[key1]);
            if (key2 === undefined) {
                key2 = -1;
            }
            data.push( {value:function_id_to_name_file1[key1],key:[key1,key2]});
            tracker.push(function_id_to_name_file1[key1]);
        }

        for (const key2 in function_id_to_name_file2) {
            if (tracker.includes(function_id_to_name_file2[key2])) {
                continue;
            }
            let key1 = Object.keys(function_id_to_name_file1).find(k => function_id_to_name_file1[k] === function_id_to_name_file2[key2]);
            if (key1 === undefined) {
                key1 = -1;
            }
            data.push( {value:function_id_to_name_file2[key2],key:[key1,key2]});
        }

        return data
    }
// Find all execution paths that have a given function. As the ids for a function may be different depending on the
// subject system, there are two keys inputted in the function for each of the two systems.
 findExecutionPathsForFunction(key1, key2){
        const indexes = [String(key1), String(key2)];
        let eps_list=[[],[]];
        let all_eps = [];
        for (let j = 0; j < 2; j++) {
            let eps = []
            let cluster = this.state["diagramData"+(j+1)]


            for (let i = 0; i < cluster['execution_paths'].length; i++) {



                if (cluster['execution_paths'][i].includes(indexes[j])) {

                    eps.push(i)
                }
                if (eps.length >= 3) {
                    break;
                }
            }


            all_eps[j] = eps;

            let eps_preety = ''

            for(let ep = 0; ep < eps.length; ep++){
                for(let f = 0; f < cluster['execution_paths'][eps[ep]].length; f++){
                    if(cluster['execution_paths'][eps[ep]][f] === indexes[j]){

                        eps_preety += '<b>' + cluster['function_id_to_name'][cluster['execution_paths'][eps[ep]][f]] + '</b>';
                        eps_preety += '(' + cluster['function_id_to_file_name'][cluster['execution_paths'][eps[ep]][f]] + ')';
                    }else{
                        eps_preety += cluster['function_id_to_name'][cluster['execution_paths'][eps[ep]][f]];
                        eps_preety += '(' + cluster['function_id_to_file_name'][cluster['execution_paths'][eps[ep]][f]] + ')';

                    }


                    eps_preety += '->'
                }

                eps_list[j].push(eps_preety)
            }
        }

        return [all_eps,eps_list];
    }




    render() {
        return (
            <div>
                <Header setSystemRenderMode={this.setSystemRenderMode} initializeGraph={this.initializeGraph}
                        subject_systems={this.state.subjectSystems} technique_choices={this.state.techniqueChoices}
                        stringExecutionPaths={[this.state.diagramData1['string_execution_paths'], this.state.diagramData2['string_execution_paths']]}
                        stringExecutionPathNames={[this.state.diagramData1['string_execution_path_names'], this.state.diagramData2['string_execution_path_names']]}
                        functionSearchData={this.state.functionSearchData}
                        setSameExecutionPath={this.setSameExecutionPath} setHighlightFunction={this.setHighlightFunction}
                />

                <h5 className="text-focus-in" style={{textAlign: 'center'}}>HCPC: Human Centric Program Comprehension By
                    Grouping
                    Dynamic Execution Scenarios
                </h5>


                <NodePanel nodeData1={this.state.nodeData1} nodeData2={this.state.nodeData2}
                           renderMode={this.state.subjectSystemRenderMode}
                           drawMode={this.state.diagramDrawMode}
                           technique={this.state.selectedTechnique}
                           sameExecutionPath = {this.state.selectedSameExecutionPath}
                           highlightFunction = {this.state.selectedHighlightFunction}
                           getSimilarity={this.get_similarity}
                           diagramData1={this.state.diagramData1} diagramData2={this.state.diagramData2}
                           showNodeDetails={this.showNodeDetails}
                           searchedExecutionPaths={this.state.searchedExecutionPaths}


                />
                <footer className="page-footer font-small blue">


                    <div className="footer-copyright text-center py-3">© 2021 Copyright:
                        <a href="https://ise.usask.ca/avijit/"> Avijit Bhattacharjee (iSE Lab) </a>
                    </div>


                </footer>
            </div>

        )
    }
}