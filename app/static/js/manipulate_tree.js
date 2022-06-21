const cluster_jsons = [];

async function get_cluster() {
    Url = '/get_cluster';
    let diagrams = [myDiagram1, myDiagram2];

    for (let i = 1; i < diagrams.length + 1; i++){
        var subject_systems = document.getElementById("subject_system_id" + i);
        var other_subject_system = document.getElementById("subject_system_id" + ((i % 2) + 1));
        await $.getJSON(Url, {
            subject_system: subject_systems.value,
            other_subject_system: other_subject_system.value
        }, function (result) {
            cluster_jsons[i - 1] = result;
            setupDiagram(result['cluster'], diagrams[i - 1]);
            setupSearchForFunction(result['cluster'][0].function_id_to_name_file);
        })
    }

    setupSearchForUniqueExecutionPaths()

    clearDiagram();

}

function get_similarity(part, identifier) {
    Url = '/get_similarity';
    var subject_system = document.getElementById("subject_system_id" + identifier);
    $.getJSON(Url, {
        subject_system: subject_system.value,
        key: part.data.key
    }, function (result) {
        update_similarity(result, (identifier % 2) + 1, part.data.key);
    })
}

function setupDiagram(result, myDiagram) {
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
            key_words: result[x].key_words,
            color: "black",
            spm_method: result[x].spm_method,
            text_summary: result[x].text_summary,
            files: result[x].files,
            files_count: result[x].files_count,
            execution_path_count: result[x].execution_path_count,
            function_id_to_name_file: result[x].function_id_to_name_file,
            execution_paths: result[x].execution_paths
        });

    }
    // Use below line for randomly coloring brushes
    // color: go.Brush.randomColor()

    myDiagram.model = new go.TreeModel(nodeDataArray);
    // update_nodes_for_study();

}

function update_node_text(node, technique, myDiagram) {
    myDiagram.model.commit(function (m) { // this Model
        // This is the safe way to change model data
        // GoJS will be notified that the data has changed
        // and can update the node in the Diagram
        // and record the change in the UndoManager
        if (technique == 'tfidf_word') {
            m.set(node.data, "node_text", node.data.tfidf_word);
        } else if (technique == 'tfidf_method') {
            m.set(node.data, "node_text", node.data.tfidf_method);
        } else if (technique == 'tfidf_method_and_docstring') {
            m.set(node.data, "node_text", node.data.tfidf_method_and_docstring);
        } else if (technique == 'tfidf_word_and_docstring') {
            m.set(node.data, "node_text", node.data.tfidf_word_and_docstring);
        } else if (technique == 'lda_word') {
            m.set(node.data, "node_text", node.data.lda_word);
        } else if (technique == 'lda_method') {
            m.set(node.data, "node_text", node.data.lda_method);
        } else if (technique == 'lda_word_and_docstring') {
            m.set(node.data, "node_text", node.data.lda_word_and_docstring);
        } else if (technique == 'lda_method_and_docstring') {
            m.set(node.data, "node_text", node.data.lda_method_and_docstring);
        } else if (technique == 'lsi_word') {
            m.set(node.data, "node_text", node.data.lsi_word);
        } else if (technique == 'lsi_method') {
            m.set(node.data, "node_text", node.data.lsi_method);
        } else if (technique == 'lsi_word_and_docstring') {
            m.set(node.data, "node_text", node.data.lsi_word_and_docstring);
        } else if (technique == 'lsi_method_and_docstring') {
            m.set(node.data, "node_text", node.data.lsi_method_and_docstring);
        } else if (technique == 'key_words') {
            m.set(node.data, "node_text", node.data.key_words);
        }

    }, "update node text");
}

function update_similarity(similarity_values, identifier, selected_node_key) {
    if (identifier == 1) {
        myDiagram1.nodes.each(function (n) {
            myDiagram1.model.commit(function (m) {
                let value = 255 * (1 - similarity_values[String(n.data.key)]);
                m.set(n.data, "similarity", "rgb(" + value + "," + value + "," + value + ")");
            }, 'change similarity value')
        });
        myDiagram2.nodes.each(function (n) {
            myDiagram2.model.commit(function (m) {
                m.set(n.data, "similarity", "rgb(255, 255, 255)"); // similarity[n.data.key]
                if (n.data.key === selected_node_key){
                    m.set(n.data, "similarity", "rgb(255, 0, 0)"); // similarity[n.data.key]
                }
            }, 'change similarity value')
        });
    }
    else {
        myDiagram2.nodes.each(function (n) {
            myDiagram2.model.commit(function (m) {
                let value = 255 * (1 - similarity_values[String(n.data.key)]);
                m.set(n.data, "similarity", "rgb(" + value + "," + value + "," + value + ")");
            }, 'change similarity value')
        });
        myDiagram1.nodes.each(function (n) {
            myDiagram1.model.commit(function (m) {
                m.set(n.data, "similarity", "rgb(255, 255, 255)"); // similarity[n.data.key]
                if (n.data.key === selected_node_key){
                    m.set(n.data, "similarity", "rgb(255, 0, 0)"); // similarity[n.data.key]
                }
            }, 'change similarity value')
        });
    }
}

function showNodeDetails(part, identifier) {
    var clickable_text = '';

    for (index = 0; index < part.data.files.length; index++) {
        clickable_text +=  part.data.files[index] + ' , ';
    }

    document.getElementById('node_key' + identifier).innerHTML = 'Node Key: ' + part.data.key;
    document.getElementById('node_summary' + identifier).innerHTML = part.data.text_summary;
    document.getElementById('node_patterns' + identifier).innerHTML = part.data.spm_method;
    document.getElementById('files' + identifier).innerHTML = clickable_text;
    document.getElementById('number_of_files' + identifier).innerHTML = part.data.files_count;
    document.getElementById('number_of_execution_paths' + identifier).innerHTML = part.data.execution_path_count;
    document.getElementById('searched_execution_paths' + identifier).innerHTML = get_some_execution_patterns(part.data.execution_paths, identifier - 1);
}


function reset_node_color() {
    myDiagram1.nodes.each(function (n) {
        myDiagram1.model.commit(function (m) {
            m.set(n.data, "color", "black");
        }, 'change node color');
    });
    myDiagram2.nodes.each(function (n) {
        myDiagram2.model.commit(function (m) {
            m.set(n.data, "color", "black");
        }, 'change node color');
    });
}

function function_highlight_node(function_id) {
    myDiagram1.nodes.each(function (n) {

        if (function_id in n.data.function_id_to_name_file){
            myDiagram1.model.commit(function (m) {
                m.set(n.data, "color", "red");
            }, 'change node color');
        }

    });
    myDiagram2.nodes.each(function (n) {

        if (function_id in n.data.function_id_to_name_file){
            myDiagram2.model.commit(function (m) {
                m.set(n.data, "color", "red");
            }, 'change node color');
        }

    });
}

function execution_path_highlight_node(execution_path, identifier, similar) {
    if (identifier.includes(0)) {
        myDiagram1.nodes.each(function (n) {
            if (execution_path in n.data.execution_paths){
                myDiagram1.model.commit(function (m) {
                    if (similar) {
                        m.set(n.data, "color", "green");
                    }
                    else {
                        m.set(n.data, "color", "red");
                    }
                }, 'change node color');
            }
        });
    }
    if (identifier.includes(1)) {
        myDiagram2.nodes.each(function (n) {
            if (execution_path in n.data.execution_paths){
                myDiagram2.model.commit(function (m) {
                    if (similar) {
                        m.set(n.data, "color", "green");
                    }
                    else {
                        m.set(n.data, "color", "red");
                    }
                }, 'change node color');
            }
        });
    }
}

function find_execution_paths_for_function(function_id){

    for (let j = 0; j < cluster_jsons.length; j++) {
        eps = []
        for (i = 0; i < cluster_jsons[j]['execution_paths'].length; i++) {
            if (cluster_jsons[j]['execution_paths'][i].includes(function_id)) {
                eps.push(i)
            }
            if (eps.length >= 3) {
                break;
            }
        }

        eps_preety = ''

        for(ep = 0; ep < eps.length; ep++){
            eps_preety += ' &#187; '
            for(f = 0; f < cluster_jsons[j]['execution_paths'][eps[ep]].length; f++){
                if(cluster_jsons[j]['execution_paths'][eps[ep]][f] === function_id){

                    eps_preety += '<b>' + cluster_jsons[j]['function_id_to_name'][cluster_jsons[j]['execution_paths'][eps[ep]][f]] + '</b>';
                    eps_preety += '(' + cluster_jsons[j]['function_id_to_file_name'][cluster_jsons[j]['execution_paths'][eps[ep]][f]] + ')';
                }else{
                    eps_preety += cluster_jsons[j]['function_id_to_name'][cluster_jsons[j]['execution_paths'][eps[ep]][f]];
                    eps_preety += '(' + cluster_jsons[j]['function_id_to_file_name'][cluster_jsons[j]['execution_paths'][eps[ep]][f]] + ')';

                }


                eps_preety += ' &rarr; '
            }
            eps_preety += '. <br> '
        }

        document.getElementById('searched_execution_paths' + (j + 1)).innerHTML = eps_preety;
    }

}


function get_some_execution_patterns(eps, index){
    eps_preety = ''
    count = 0
    for(const [key, value] of Object.entries(eps)){
        count += 1
        if(count === 15){
            break
        }
        eps_preety += ' &#187; '
        for(f = 0; f < cluster_jsons[index]['execution_paths'][key].length; f++){
            eps_preety += cluster_jsons[index]['function_id_to_name'][cluster_jsons[index]['execution_paths'][key][f]]
            eps_preety += '(' + cluster_jsons[index]['function_id_to_file_name'][cluster_jsons[index]['execution_paths'][key][f]] + ')'

            eps_preety += ' &rarr; '
        }
        eps_preety += '. <br> '
    }

    return eps_preety
}

jQuery(document).ready(function() {
    jQuery("#search_button").click(function () {
      var function_id = document.getElementById('function_file').value;
      //console.log(function_id);
      reset_node_color();
      function_highlight_node(parseInt(function_id));
      find_execution_paths_for_function(function_id);
    });
  });

jQuery(document).ready(function () {
    for (let i = 0; i < 2; i++) { //Todo the 2 is hardcoded
        jQuery("#unique_execution_paths" + (i + 1).toString()).change(function () {
            var execution_path = document.getElementById('unique_execution_paths' + (i + 1).toString()).value;
            reset_node_color();
            if (execution_path !== "None") {
                execution_path = JSON.parse(execution_path);
                var subject_system = execution_path[1];
                execution_path = execution_path[0];
                execution_path_highlight_node(execution_path, [subject_system], false);
            }
        });
    }
});

jQuery(document).ready(function () {
    jQuery("#same_execution_paths").change(function () {
        var execution_path = document.getElementById('same_execution_paths').value;
        reset_node_color();
        if (execution_path !== "None") {
            execution_path = execution_path[0];
            execution_path_highlight_node(execution_path, [0, 1], true);
        }
    });
});

jQuery(document).ready(function() {
    jQuery('#technique_choice_id').change(function () {
        var technique_choice = document.getElementById('technique_choice_id').value;

        myDiagram1.nodes.each(function (n) {
            update_node_text(n, technique_choice, myDiagram1);
        });
        myDiagram2.nodes.each(function (n) {
            update_node_text(n, technique_choice, myDiagram2);
        });

    });
});

jQuery(document).ready(function () {
    jQuery('#graph_model_id').change(function() {
        myDiagram1.div = null;
        myDiagram2.div = null;
        if (document.getElementById('graph_model_id').value === "tree"){
            init_tree();
        }
        else {
            init_directory();
        }
    });
});

function setupSearchForFunction(function_id_to_name_file){

    var data = []
    for (var key in function_id_to_name_file) { // function_id_to_name_file
        data.push({"id": key, "text": function_id_to_name_file[key]})
    }

    jQuery('#function_file').select2({
        width: 'resolve',
        placholder: 'Start typing...',
        data:  data
    });


}

function setupSearchForUniqueExecutionPaths() {
    const string_execution_paths = [];

    for (let j = 0; j < cluster_jsons.length; j++) {
        string_execution_paths[j] = []
        const execution_paths = cluster_jsons[j]['execution_paths'];
        for (let i = 0; i < execution_paths.length; i++) {
            let execution_path_string = '';
            execution_path_string += '';
            for (let f = 0; f < execution_paths[i].length; f++) {
                execution_path_string += cluster_jsons[j]['function_id_to_name'][execution_paths[i][f]];
                execution_path_string += '(' + cluster_jsons[j]['function_id_to_file_name'][execution_paths[i][f]] + ')';

                execution_path_string += ' -> ';
            }
            execution_path_string += '.';
            string_execution_paths[j].push(execution_path_string);
        }
    }

    let same = [];
    for (let j = 0; j < cluster_jsons.length; j++) {
        let unique = [];
        const execution_paths = string_execution_paths[j];
        for (let i = 0; i < execution_paths.length; i++) {
            if (!(string_execution_paths[(j + 1) % 2].includes(execution_paths[i]))) {
                unique.push({"id": JSON.stringify([i,j]), "text": execution_paths[i]});
            }
            else if (j === 0) {
                same.push({"id": i, "text": execution_paths[i]});
            }
        }

        jQuery('#unique_execution_paths' + [(j % 2) + 1].toString()).empty().append('<option value="None">None</option>').
        select2({
            width: 'resolve',
            placholder: 'Start typing...',
            data: unique,
            allowClear: true
        });

        jQuery('#same_execution_paths').empty().append('<option value="None">None</option>').select2({
            width: 'resolve',
            placholder: 'Start typing...',
            data: same,
            allowClear: true
        });
    }

}
