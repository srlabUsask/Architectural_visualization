const cluster_jsons = [];
const string_execution_paths = [];
let node_unique_execution_paths = [];
let two_subject_system = true;

// Gets the two requested subject systems and sets up the NodeJS diagram and searching for the tool
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
        })
    }

    setupSearchForFunction(cluster_jsons[0]["function_id_to_name_file"], cluster_jsons[1]["function_id_to_name_file"]);

    setupSearchForUniqueAndSameExecutionPaths();
    setupUniqueNodeExecutionPaths();

    //the method is causing error, temporarily disabled
    //clearDiagram();

}

// Gets similarity values for a given node and then updates the heat map based on the similarity values
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

// Sets up the values for a given diagram
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
function update_node_text(node, technique, myDiagram) {
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

// Updates the similarity values
function update_similarity(similarity_values, identifier, selected_node_key) {
    if (identifier === 1) {
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

// Sets and shows a given nodes details
function showNodeDetails(part, identifier) {
    var clickable_text = '';

    for (index = 0; index < part.data.files.length; index++) {
        clickable_text +=  part.data.files[index] + ' , ';
    }

    document.getElementById('node_key' + identifier).innerHTML = 'Node Key: ' + part.data.key;
    document.getElementById('node_summary' + identifier).innerHTML = part.data.text_summary;
    document.getElementById('node_patterns' + identifier).innerHTML = listNodePatterns(part.data.spm_method);


    //Change the file text into a numbered list

    let files = document.getElementById('files' + identifier)
    let items = clickable_text.trim().split(',');

   files.innerHTML="<ol></ol>";
    for (var i = 0; i < items.length; i++) {
        if(items[i].length >0) $( '#files' + identifier+ " ol").append('<li value="'+i+'">' + items[i] + '</li>');
    }


    document.getElementById('number_of_files' + identifier).innerHTML = "Number of Files: " + part.data.files_count;
    document.getElementById('number_of_execution_paths' + identifier).innerHTML = "Number of Execution paths: " + part.data.execution_path_count;
    document.getElementById('searched_execution_paths' + identifier).innerHTML = get_some_execution_patterns(part.data.execution_paths, identifier - 1);
}

// Updates the node details panels with the unique execution paths for each of the two nodes being compared
function updateUniqueNodePaths(key1, key2) {
    const unique_paths1 = node_unique_execution_paths[0][key1][key2];
    const unique_paths2 = node_unique_execution_paths[1][key2][key1];
    let list_version1 = [];
    let list_version2 = [];
    for (const path of unique_paths1) {
        list_version1.push(path);
    }
    for (const path of unique_paths2) {
        list_version2.push(path);
    }

    document.getElementById('unique_node_execution_paths1').innerHTML = listExecutionPaths(list_version1)
    document.getElementById('unique_node_execution_paths2').innerHTML = listExecutionPaths(list_version2)
}

/*
Takes a list of execution paths, replaces arrows into a list structure
split is the string that will be used to split the text( either -> or &rarr(HTML code for -> symbol)
 */
function listExecutionPaths(paths,split='->'){

    const newFileNameSeparator="&#8681;" //double downwards arrow
    const defaultSeparator="&#8595;" //downwards arrow

    //if no path is to be found
    if(paths.length===0) return "";
    //creates list of all items separated by downward arrow
    result = "<div class='executionPathContainer'>"
    for(let i=0;i<paths.length;i++) {
        let items = paths[i].trim().split(split);
        if(items==="") continue
        result+="<div>"
        let firstItem = true;//Track if this is the first item of list that is not empty string




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
                result += "<p class='executionPathArrowDown'>";

                //Setting the separator symbol for when new file is selected or new function in same file
                if (filePath !== currentFileName) result += newFileNameSeparator;
                else result += defaultSeparator;

                result += "</p>"
            }

            //if different file is selected add the file path to top
            if(filePath!==currentFileName) {
                result+="<span>"+filePath+"</span>"
                currentFileName=filePath;
            }
            result +="<p class='functionName'>"+functionName+"</p>"
            firstItem = false
        }

        result+="</div>"
    }
    result += "</div>"
    return result
}

/*
Takes a string node patterns, replaces arrows into a list structure
string uses  &rarr as separation string
 */
function listNodePatterns(paths){

    paths= paths.replaceAll(". <br>","")//remove page breaks
    paths=paths.trim().split("&#187;").filter(i=>i)//split by >> symbol, filter out empty strings
    return listExecutionPaths(paths,"&rarr;")
}

// Resets color of text in the nodes to the color black
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

// Every node that has an execution path in that's also in execution_paths_for_func gets highlighted by its text being
// turned to red
function function_highlight_node(execution_paths_for_func) {
    myDiagram1.nodes.each(function (n) {
        if (execution_paths_for_func[0].some(item => Object.keys(n.data.execution_paths).includes(item.toString()))) {
            myDiagram1.model.commit(function (m) {
                m.set(n.data, "color", "red");
                }, 'change node color');
        }
    });

    myDiagram2.nodes.each(function (n) {
        if (execution_paths_for_func[1].some(item => Object.keys(n.data.execution_paths).includes(item.toString()))) {
            myDiagram2.model.commit(function (m) {
                m.set(n.data, "color", "red");
            }, 'change node color');
        }
    });
}

/* This method is for highlighting nodes that have a certain execution path. 'same' is used to choose which color do
you want to change the text to when highlighting the node with True being green and False being red. The intended
purpose of 'same' is to show whether the node we are highlighting is for a unique node or a node that exists in both
cluster trees. 'identifier' is used to track which of the two trees we are searching in.
 */
function execution_path_highlight_node(execution_path, identifier, same) {
    if (identifier === 0) {
        myDiagram1.nodes.each(function (n) {
            if (execution_path in n.data.execution_paths){
                myDiagram1.model.commit(function (m) {
                    if (same) {
                        m.set(n.data, "color", "green");
                    }
                    else {
                        m.set(n.data, "color", "red");
                    }
                }, 'change node color');
            }
        });
    }
    else {
        myDiagram2.nodes.each(function (n) {
            if (execution_path in n.data.execution_paths){
                myDiagram2.model.commit(function (m) {
                    if (same) {
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

// Find all execution paths that have a given function. As the ids for a function may be different depending on the
// subject system, there are two keys inputted in the function for each of the two systems.
function find_execution_paths_for_function(key1, key2){
    const indexes = [key1, key2];
    let all_eps = [];
    for (let j = 0; j < cluster_jsons.length; j++) {
        eps = []
        for (i = 0; i < cluster_jsons[j]['execution_paths'].length; i++) {
            if (cluster_jsons[j]['execution_paths'][i].includes(indexes[j])) {
                eps.push(i)
            }
            if (eps.length >= 3) {
                break;
            }
        }

        all_eps[j] = eps;

        eps_preety = ''
        eps_list=[]
        for(ep = 0; ep < eps.length; ep++){
            for(f = 0; f < cluster_jsons[j]['execution_paths'][eps[ep]].length; f++){
                if(cluster_jsons[j]['execution_paths'][eps[ep]][f] === indexes[j]){

                    eps_preety += '<b>' + cluster_jsons[j]['function_id_to_name'][cluster_jsons[j]['execution_paths'][eps[ep]][f]] + '</b>';
                    eps_preety += '(' + cluster_jsons[j]['function_id_to_file_name'][cluster_jsons[j]['execution_paths'][eps[ep]][f]] + ')';
                }else{
                    eps_preety += cluster_jsons[j]['function_id_to_name'][cluster_jsons[j]['execution_paths'][eps[ep]][f]];
                    eps_preety += '(' + cluster_jsons[j]['function_id_to_file_name'][cluster_jsons[j]['execution_paths'][eps[ep]][f]] + ')';

                }


                eps_preety += '->'
            }
            eps_list.push(eps_preety)
        }
        document.getElementById('searched_execution_paths' + (j + 1)).innerHTML = listExecutionPaths(eps_list);
    }
    return all_eps;
}

// Returns a maximum of 15 execution paths in a more visually appealing block of text.
function get_some_execution_patterns(eps, index){
    eps_preety = ''
    count = 0
    eps_list=[]
    for(const [key, value] of Object.entries(eps)){
        count += 1
        if(count === 15){
            break
        }
        for(f = 0; f < cluster_jsons[index]['execution_paths'][key].length; f++){
            eps_preety += cluster_jsons[index]['function_id_to_name'][cluster_jsons[index]['execution_paths'][key][f]]
            eps_preety += '(' + cluster_jsons[index]['function_id_to_file_name'][cluster_jsons[index]['execution_paths'][key][f]] + ')'

            eps_preety += '->' // Arrow (use Google to see the visual of this)
        }
        eps_list.push(eps_preety)
    }

    return listExecutionPaths(eps_list)
}

// Adds the functionality for the search button that finds execution paths with a specific function in it
jQuery(document).ready(function() {
    jQuery("#search_button").click(function () {
        const function_ids = JSON.parse(document.getElementById('function_file').value);
        const key1 = function_ids[0];
        const key2 = function_ids[1];
        reset_node_color();
        const execution_paths_for_func = find_execution_paths_for_function(key1, key2);
        function_highlight_node(execution_paths_for_func);
    });
});

// Adds the functionality to highlight nodes that have an execution path that are unique for a given subject system
jQuery(document).ready(function () {
    for (let i = 0; i < 2; i++) { //Todo the 2 is hardcoded
        jQuery("#unique_execution_paths" + (i + 1).toString()).change(function () {
            var execution_path = document.getElementById('unique_execution_paths' + (i + 1).toString()).value;
            reset_node_color();
            if (execution_path !== "None") {
                execution_path = JSON.parse(execution_path);
                var subject_system = execution_path[1];
                execution_path = execution_path[0];
                execution_path_highlight_node(execution_path, subject_system, false);
            }
        });
    }
});

// Adds the functionality to highlight nodes that have an execution path that exists in both subject systems
jQuery(document).ready(function () {
    jQuery("#same_execution_paths").change(function () {
        var execution_path = document.getElementById('same_execution_paths').value;
        reset_node_color();
        if (execution_path !== "None") {
            execution_path = JSON.parse(execution_path);
            execution_path_highlight_node(execution_path[0], 0, true);
            execution_path_highlight_node(execution_path[1], 1, true);
        }
    });
});

// Adds the functionality to change the labeling technique of the nodes in both cluster trees
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

// Adds the functionality to be able to choose how you want to visualise the cluster trees: directory or tree view
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

// Adds the functionality to be able to switch between seeing two subject systems to just one. Note only the top tree
// gets carried over and back when switching between seeing one and two subject systems.
jQuery(document).ready(function () {
    jQuery('#view :input').change(function() {

        if (this.id === "systemBoth") {
            toggleSubjectSystems(true,true)
            jQuery("#fullDiagram1").height(400);
            jQuery("#fullDiagram2").height(400);
            jQuery("#diagrams").addClass("col-6").removeClass("col-8");
            two_subject_system = true;
            myDiagram1.layout.invalidateLayout();
            myDiagram2.layout.invalidateLayout();
        }
        else if(this.id==="system2"){
            toggleSubjectSystems(false,true)
            jQuery("#fullDiagram2").height(800);
            jQuery("#diagrams").addClass("col-8").removeClass("col-6");
            two_subject_system = false;
            myDiagram2.layout.invalidateLayout();
        }
        else {
            toggleSubjectSystems(true,false)
            jQuery("#fullDiagram1").height(800);
            jQuery("#diagrams").addClass("col-8").removeClass("col-6");
            two_subject_system = false;
            myDiagram1.layout.invalidateLayout();
        }

    });
});


function toggleSubjectSystems(first=false, second=false) {
    jQuery("#fullDiagram2").toggle(second);
    jQuery("#subjectSystem2Info").toggle(second);
    jQuery("#fullDiagram1").toggle(first);
    jQuery("#subjectSystem1Info").toggle(first);
    jQuery("#same_execution_paths_block").toggle(first && second);
}


// Sets up the data structures used for searching for a given function existence in a node
function setupSearchForFunction(function_id_to_name_file1, function_id_to_name_file2){
    let data = [];
    let tracker = []
    for (const key1 in function_id_to_name_file1) {
        let key2 = Object.keys(function_id_to_name_file2).find(k => function_id_to_name_file2[k] === function_id_to_name_file1[key1]);
        if (key2 === undefined) {
            key2 = -1;
        }
        data.push({"id": JSON.stringify([key1, key2]), "text": function_id_to_name_file1[key1]});
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
        data.push({"id": JSON.stringify([key1, key2]), "text": function_id_to_name_file2[key2]});
    }

    jQuery('#function_file').empty().select2({
        width: 'resolve',
        placholder: 'Start typing...',
        data:  data
    });
}

/* Sets up the data structures used for searching for execution paths existence in a node. The execution paths are first
divided into three groups: paths that appear only in one cluster tree, paths that appear only in the other cluster tree,
and paths that appear in both trees. This is to make finding for paths that are unique or shared much easier to do.
 */
function setupSearchForUniqueAndSameExecutionPaths() {
    for (let j = 0; j < cluster_jsons.length; j++) {
        string_execution_paths[j] = [];
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
            const index = (string_execution_paths[(j + 1) % 2].indexOf(execution_paths[i]));
            if (index === -1) {
                unique.push({"id": JSON.stringify([i,j]), "text": execution_paths[i]});
            }
            else if (j === 0 && two_subject_system) {
                same.push({"id": JSON.stringify([i, index]), "text": execution_paths[i]});
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

// Sets up the data structures used for getting unique execution paths of each of the two nodes that are being compared
function setupUniqueNodeExecutionPaths() {
    node_unique_execution_paths[0] = [];
    node_unique_execution_paths[1] = [];
    myDiagram1.nodes.each(function (n) {
        node_unique_execution_paths[0][parseInt(n.key)] = [];
        const index1 = n.data.execution_paths;
        const execution_paths1 = Object.entries(index1).map(([k, v]) => string_execution_paths[0][parseInt(k)]);
        myDiagram2.nodes.each(function (m) {
            if (node_unique_execution_paths[1][parseInt(m.key)] === undefined) {
                node_unique_execution_paths[1][parseInt(m.key)] = [];
            }
            const index2 = m.data.execution_paths;
            const execution_paths2 = Object.entries(index2).map(([k, v]) => string_execution_paths[1][parseInt(k)]);
            node_unique_execution_paths[0][parseInt(n.key)][parseInt(m.key)] = execution_paths1.filter(x => !execution_paths2.includes(x));
            node_unique_execution_paths[1][parseInt(m.key)][parseInt(n.key)] = execution_paths2.filter(x => !execution_paths1.includes(x));
        })
    });
}
