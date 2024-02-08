from flask import Flask
import graph_utils as g_util

app = Flask(__name__)


@app.route('/get_call_graph_data')
def get_call_graph_data():

    graph = g_util.build_dynamic_call_graph("/graph_utils/test_data/calculator.log")
    node_data = g_util.create_node_data_array(graph)
    link_data = g_util.create_link_data_array(graph)

    call_graph_data = {
        "node_data": node_data,
        "link_data": link_data
    }

    return call_graph_data