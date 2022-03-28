import os
import data_set_config as cfg

from arch_visulizer.diff_scenarios import buildgraph

from pickle import Pickler

call_log_data = cfg.CALL_LOGS

graph_data = []

# Open each file and build a graph
for file_name in call_log_data:
    g = buildgraph(open(file_name), 1)
    f = os.path.basename(file_name)
    graph_data.append((f, g))

nodes = []
edges = []
names = []
for data in graph_data:
    nodes.append(list(data[1].nodes()))
    edges.append(list(data[1].edges()))
    names.append(data[0])

nodes_jar = open("instance/nodes.pkl", "wb")
Pickler(nodes_jar).dump(nodes)
nodes_jar.close()

edges_jar = open("instance/edges.pkl", "wb")
Pickler(edges_jar).dump(edges)
edges_jar.close()

names_jar = open("instance/names.pkl", "wb")
Pickler(names_jar).dump(names)
names_jar.close()
