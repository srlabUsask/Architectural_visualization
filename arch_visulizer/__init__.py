import os

from flask import Flask, render_template
from pickle import Unpickler

def create_app(test_config=None):

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev'
    )

    @app.before_first_request
    def load_data_set():

        nodes_jar = open("instance/nodes.pkl", "rb")
        app.nodes = Unpickler(nodes_jar).load()
        nodes_jar.close()

        edges_jar = open("instance/edges.pkl", "rb")
        app.edges = Unpickler(edges_jar).load()
        edges_jar.close()

        names_jar = open("instance/names.pkl", "rb")
        app.names = Unpickler(names_jar).load()
        edges_jar.close()



    @app.route('/', methods=['GET'])
    def index():

        perc=[]
        for graph in app.names:
            perc.append(50)

        return render_template(
            'friendwheel.html',
            sc1_nodes = app.nodes,
            sc1_edges = app.edges,
            sc2_nodes = app.nodes,
            sc2_edges = app.edges,
            sc1_filenames = app.names,
            sc2_filenames = app.names,
            perc = perc
        )

    return app
