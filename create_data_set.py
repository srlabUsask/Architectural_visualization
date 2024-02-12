# Library imports
import os
from pickle import Pickler
# User imports
import data_set_config as cfg
from arch_visulizer.diff_scenarios import buildgraph

def main():
    # Retrive list of call log files
    call_log_data = cfg.CALL_LOGS

    nodes = []
    edges = []
    names = []
    # For each file build a graph and append the data to the
    #   nodes, edges, and names list respectivly.
    for file_name in call_log_data:
        g = buildgraph(open(file_name), 1)
        f = os.path.basename(file_name)
        nodes.append(list(g.nodes()))
        edges.append(list(g.edges()))
        names.append(f)

    # Pickle the data for use by the web app.
    nodes_jar = open("instance/nodes.pkl", "wb")
    Pickler(nodes_jar).dump(nodes)
    nodes_jar.close()

    edges_jar = open("instance/edges.pkl", "wb")
    Pickler(edges_jar).dump(edges)
    edges_jar.close()

    names_jar = open("instance/names.pkl", "wb")
    Pickler(names_jar).dump(names)
    names_jar.close()

if __name__ == "__main__":
    main()
