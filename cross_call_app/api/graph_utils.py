import igraph as ig
import matplotlib.pyplot as plt
from data_structures import Stack

def get_call_line_info(line):
    """
    Returns the relevant details of the function call extracted from a logging line

    Args:
        line (str): Line to return the info of
    Returns:
         class_name (str): The name of the class referenced in the line, empty String if no class given
         short_name (str): Short name of the function
         full_name  (str): Function name and signature
         file_name  (str): Name of the file where the function is contained
         #line_num   (int): Line number where the function was invoked in file_name
    """
    if ':' in line:
        class_name_start = line.find('<') + 1
        class_name_end = line.find(':')
        class_name = line[class_name_start:class_name_end]

        short_name_start = line.find(':') + 2
        short_name_end = line.find('(')
        short_name = line[short_name_start:short_name_end]

    else:
        class_name = ""
        short_name_start = 1
        short_name_end = line.find('(')
        short_name = line[1:short_name_end]

    full_name_stop = line.find("@")
    full_name = line[short_name_start:full_name_stop]

    file_name_start = line.rfind("@") + 1
    file_name_end = line.rfind(">")
    file_name = line[file_name_start:file_name_end]

    # line_num_start = file_name_end + 1
    # line_num = int(line[line_num_start:])

    return class_name, short_name, full_name, file_name


def build_dynamic_call_graph(in_file):
    """
    Constructs and returns a Graph object representing the call graph of the execution log parsed from in_file

    Args:
        in_file (str): Name of a file containing a dynamic execution log produced by executing instrumented code
    """

    graph = ig.Graph(directed=True)
    stack = Stack()

    file = open(in_file, 'r')
    file.seek(0)
    for line in file:

        line = line.strip()

        # Line represents a call to another function
        if "/" not in line:
            class_name, short_name, full_name, file_name = get_call_line_info(line)

            try:
                node = graph.vs.find(name=full_name)
                node_exists = True
            except ValueError:
                node = None
                node_exists = False

            if not node_exists:
                node = graph.add_vertex(
                    name=full_name,
                    class_name=class_name,
                    short_name=short_name,
                    full_name=full_name,
                )

            prev_node = stack.peek()
            if prev_node:
                graph.add_edge(prev_node, node)

            stack.push(node)

        # Line represents a return from a function call
        else:
            stack.pop()

    return graph

def create_node_data_array_str(graph: ig.Graph):
    data_array = "[\n"
    i = 0
    for node in graph.vs:
        node_data = "{ "
        node_data += "key: " + str(i) + ", "
        node_data += "text: \"" + str(node["name"]) + "\" "
        node_data += "},\n"
        data_array += node_data
        i = i + 1
    data_array += "]"
    return data_array

def create_node_data_array(graph: ig.Graph):
    data_array = []
    i = 0
    for node in graph.vs:
        data_array.append({
            "key": i,
            "text": str(node["name"])
        })
        i = i + 1

    return data_array

def create_link_data_array_str(graph: ig.Graph):
    edge_list = graph.get_edgelist()
    i = -1
    data_array = "[\n"
    for edge in edge_list:
        edge_data = "{ "
        edge_data += "key: " + str(i) + ", "
        edge_data += "from: " + str(edge[0]) + ", "
        edge_data += "to: " + str(edge[1]) + " "
        edge_data += "},\n"
        data_array += edge_data
        i = i - 1
    data_array +="]"
    return data_array

def create_link_data_array(graph: ig.Graph):
    edge_list = graph.get_edgelist()
    i = -1
    link_array = []
    for edge in edge_list:
        link_array.append({
            "key": i,
            "from": str(edge[0]),
            "to": str(edge[1])
        })
        i = i - 1

    return link_array
def main():
    graph = build_dynamic_call_graph("test_data/calculator.log")

    # # Test graph generation
    # layout = ig.Graph.layout_reingold_tilford(graph, root=[0])
    # fig, ax = plt.subplots(figsize=(10,10))
    # ig.plot(
    #     graph,
    #     target=ax,
    #     layout=layout,
    #     vertex_label=graph.vs['short_name']
    # )
    # fig.savefig("test.png")




if __name__ == "__main__":
    main()