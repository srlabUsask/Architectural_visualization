import React, { Component } from 'react';
import Header from "./Header";
import NodePanel from "./NodePanel"
import * as go from 'gojs';
import  "../../styles/style.css"
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
            selectedTechnique:null,
            diagrams:[],
            subjectSystemRenderMode:1, //0 renders only subject system 1, 1 renders both, 2 renders system 2
        }


        this.setSystemRenderMode=this.setSystemRenderMode.bind(this)
        this.initializeGraph = this.initializeGraph.bind(this);
        this.setupDiagram = this.setupDiagram.bind(this);
        this.update_node_text=this.update_node_text.bind(this);


    }


    /*
    Sends a post request to get_cluster URL with the names of chosen files in header
    in app.py, the files are read and result is returned.

    subjectSystems: (currently 2 file name) chosen files to read
    selectedTechnique: tfidf,lda, etc.
     */
      initializeGraph(subjectSystems, selectedTechnique) {


          const Url = '/get_cluster';
          const subject_system = subjectSystems[0];
          const other_subject_system = subjectSystems[1];


          let data = new FormData()
          data.append("subject_system", subject_system)
          data.append("other_subject_system", other_subject_system)
          fetch(Url,
          {
              method: 'POST',
                  body: data,
              credentials: 'same-origin'
          }
          ).then(response => response.json())
              .then(json => {

                console.log(json)
              })




       // setupSearchForFunction(cluster_jsons[0]["function_id_to_name_file"], cluster_jsons[1]["function_id_to_name_file"]);

      //  setupSearchForUniqueAndSameExecutionPaths();
      //  setupUniqueNodeExecutionPaths();

        //the method is causing error, temporarily disabled
        //clearDiagram();
        this.setState({
            selectedSubjectSystems:[subject_system,other_subject_system],
            selectedTechnique:selectedTechnique,

        })
    }

// Sets up the values for a given diagram
     setupDiagram(result, myDiagram) {
        var nodeDataArray = [];
        for (x in result) {
            nodeDataArray.push({
                key: result[x].key,
                parent: result[x].parent,
                node_text: result[x].tfidf_word,
                tfidf_word: result[x].tfidf_word,
                tfidf_method: result[x].tfidf_method,
                tfidf_method_and_docstring: result[x].tfidf_method_and_docstring,
                tfidf_word_and_docstring: result[x].tfidf_word_and_docstring,
                lda_word: result[x].lda_word,
                lda_method: result[x].lda_method,
                lda_word_and_docstring: result[x].lda_word_and_docstring,
                lda_method_and_docstring: result[x].lda_method_and_docstring,
                lsi_word: result[x].lsi_word,
                lsi_method: result[x].lsi_method,
                lsi_word_and_docstring: result[x].lsi_word_and_docstring,
                lsi_method_and_docstring: result[x].lsi_method_and_docstring,
                text_rank: result[x].text_rank,
                tree_context_based_label: result[x].tree_context_based_label,
                color: "black",
                spm_method: result[x].spm_method,
                text_summary: result[x].text_summary,
                files: result[x].files,
                files_count: result[x].files_count,
                execution_path_count: result[x].execution_path_count,
                execution_paths: result[x].execution_paths
            });

        }
        // Use below line for randomly coloring brushes
        // color: go.Brush.randomColor()

        myDiagram.model = new go.TreeModel(nodeDataArray);

        var technique_choice = document.getElementById('technique_choice_id').value;
        myDiagram.nodes.each(function (n) {
            update_node_text(n, technique_choice, myDiagram);
        });
        // update_nodes_for_study();

    }

// Updates the label for a node based on the labeling technique choice
     update_node_text(node, technique, myDiagram) {
        myDiagram.model.commit(function (m) { // this Model
            // This is the safe way to change model data
            // GoJS will be notified that the data has changed
            // and can update the node in the Diagram
            // and record the change in the UndoManager
            if (technique === 'tfidf_word') {
                m.set(node.data, "node_text", node.data.tfidf_word);
            } else if (technique === 'tfidf_method') {
                m.set(node.data, "node_text", node.data.tfidf_method);
            } else if (technique === 'tfidf_method_and_docstring') {
                m.set(node.data, "node_text", node.data.tfidf_method_and_docstring);
            } else if (technique === 'tfidf_word_and_docstring') {
                m.set(node.data, "node_text", node.data.tfidf_word_and_docstring);
            } else if (technique === 'lda_word') {
                m.set(node.data, "node_text", node.data.lda_word);
            } else if (technique === 'lda_method') {
                m.set(node.data, "node_text", node.data.lda_method);
            } else if (technique === 'lda_word_and_docstring') {
                m.set(node.data, "node_text", node.data.lda_word_and_docstring);
            } else if (technique === 'lda_method_and_docstring') {
                m.set(node.data, "node_text", node.data.lda_method_and_docstring);
            } else if (technique === 'lsi_word') {
                m.set(node.data, "node_text", node.data.lsi_word);
            } else if (technique === 'lsi_method') {
                m.set(node.data, "node_text", node.data.lsi_method);
            } else if (technique === 'lsi_word_and_docstring') {
                m.set(node.data, "node_text", node.data.lsi_word_and_docstring);
            } else if (technique === 'lsi_method_and_docstring') {
                m.set(node.data, "node_text", node.data.lsi_method_and_docstring);
            } else if (technique === 'text_rank') {
                m.set(node.data, "node_text", node.data.text_rank);
            } else if (technique === 'tree_context_based_label') {
                m.set(node.data, "node_text", node.data.tree_context_based_label);
            }

        }, "update node text");
    }

    setSystemRenderMode(mode){
        this.setState({
            subjectSystemRenderMode:mode
        })
    }






    render() {
        return (
            <div>
                <Header setSystemRenderMode={this.setSystemRenderMode} initializeGraph={this.initializeGraph}
                        subject_systems={this.state.subjectSystems} technique_choices={this.state.techniqueChoices}/>


                <NodePanel  renderMode={this.state.subjectSystemRenderMode} diagrams={this.state.diagrams}/>


                <button onClick={this.get_cluster}>EEEEEEEE</button>
            </div>

        )
    }
}