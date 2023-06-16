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
        console.log("App constructor")


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

            //all data from reading the file
            //cluster, execution_path,function_id_to_filename/file/name,
            diagramData1:{},
            diagramData2:{},

            //Data for the side panels
            nodeData1:{},
            nodeData2:{},
            subjectSystemRenderMode:1, //0 renders only subject system 1, 1 renders both, 2 renders system 2
            diagramDrawMode:0,//0 renders as dictionary, 1 renders as tree
        }


        this.setSystemRenderMode=this.setSystemRenderMode.bind(this)
        this.setDiagramDrawMode=this.setDiagramDrawMode.bind(this)
        this.initializeGraph = this.initializeGraph.bind(this);
        this.getCluster = this.getCluster.bind(this)
        this.get_similarity = this.get_similarity.bind(this);
        this.showNodeDetails = this.showNodeDetails.bind(this)
        this.getEecutionPaths=this.getEecutionPaths.bind(this);
        this.setUpStringExecutionPaths=this.setUpStringExecutionPaths.bind(this);

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










       // setupSearchForFunction(cluster_jsons[0]["function_id_to_name_file"], cluster_jsons[1]["function_id_to_name_file"]);



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
        //Save the string version of data with the rest of it
        diagramData1['string_execution_paths'] = string_Data[0]
        diagramData2['string_execution_paths'] = string_Data[1]


        this.setState({
            selectedSubjectSystems:[systemData.selectedSubjectSystems[0],systemData.selectedSubjectSystems[1]],
            selectedTechnique:systemData.selectedTechnique,
            diagramDrawMode:systemData.diagramDrawMode,
            diagramData1:diagramData1,
            diagramData2:diagramData2,
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
        const executionPaths=this.getEecutionPaths(part.data.execution_paths, identifier);
        this.setState({
            [nodeData]:{key:key, textSummary:textSummary, items:items,numberOfFiles:numberOfFiles, executionPathCount:executionPathCount,executionPaths:executionPaths,executionPatterns:executionPatterns},
        })






    }
    getEecutionPaths(eps, index){

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
        for (let j = 0; j < 2; j++) {
             cluster = clusters[j]

             string_execution_paths[j] = [];
            const execution_paths = cluster['execution_paths'];
            for (let i = 0; i < execution_paths.length; i++) {
                let execution_path_string = '';
                execution_path_string += '';
                for (let f = 0; f < execution_paths[i].length; f++) {
                    execution_path_string += cluster['function_id_to_name'][execution_paths[i][f]];
                    execution_path_string += '(' + cluster['function_id_to_file_name'][execution_paths[i][f]] + ')';

                    execution_path_string += ' -> ';
                }
                execution_path_string += '.';
                string_execution_paths[j].push(execution_path_string);
            }
        }


        return string_execution_paths;


    }
    render() {
        return (
            <div>
                <Header setSystemRenderMode={this.setSystemRenderMode} initializeGraph={this.initializeGraph}
                        subject_systems={this.state.subjectSystems} technique_choices={this.state.techniqueChoices}
                        stringExecutionPaths={[this.state.diagramData1['string_execution_paths'], this.state.diagramData2['string_execution_paths']]}

                />


                <NodePanel nodeData1={this.state.nodeData1} nodeData2={this.state.nodeData2}
                           renderMode={this.state.subjectSystemRenderMode}
                           drawMode={this.state.diagramDrawMode}
                           technique={this.state.selectedTechnique}
                           getSimilarity={this.get_similarity}
                           diagramData1={this.state.diagramData1} diagramData2={this.state.diagramData2}
                           showNodeDetails={this.showNodeDetails}

                />
            </div>

        )
    }
}