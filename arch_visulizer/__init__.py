import os

from flask import Flask, render_template

from arch_visulizer.diff_scenarios import buildgraph

def create_app(test_config=None):

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev'
    )

    if test_config is None:
        # load from the config file
        app.config.from_pyfile('config.py')
    else:
        # Load from the passed in config
        app.config.from_pyfile(test_config)


    @app.before_first_request
    def load_data():
        app.graph_data = []

        # Open each file and build a graph
        for file_name in app.config['CALL_LOGS']:
            g = buildgraph(open(file_name), 1)
            f = os.path.basename(file_name)
            app.graph_data.append((f, g))

        nodes = []
        edges = []
        names = []
        for data in app.graph_data:
            nodes.append(list(data[1].nodes()))
            edges.append(list(data[1].edges()))
            names.append(data[0])




    @app.route('/', methods=['GET'])
    def index():

        nodes = []
        edges = []
        names = []


        for data in app.graph_data:
            nodes.append(list(data[1].nodes()))
            edges.append(list(data[1].edges()))
            names.append(data[0])




        perc=[]
        for graph in app.graph_data:
            perc.append(50)

        return render_template(
            'friendwheel.html',
            sc1_nodes = nodes,
            sc1_edges = edges,
            sc2_nodes = nodes,
            sc2_edges = edges,
            sc1_filenames = names,
            sc2_filenames = names,
            perc = perc
        )

    return app
