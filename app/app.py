from flask import Flask, jsonify, send_from_directory, render_template
from flask import abort
from flask import make_response
from flask import request
from flask import url_for
from flask_cors import CORS
import glob
import config
import util

# from ClusteringCallGraph import *

from datetime import datetime
import json

app = Flask(__name__, static_url_path='/static')
CORS(app)

ROOT = config.ROOT + '/output/'
SUBJECT_SYSTEMS = glob.glob1(ROOT, 'TREE_DICT*')
print(SUBJECT_SYSTEMS)
NUMBER_OF_SUBJECT_SYSTEMS = len(SUBJECT_SYSTEMS)
print(NUMBER_OF_SUBJECT_SYSTEMS)
similarity = {}
unique_execution_paths = {}


@app.route('/', methods=['GET'])
def root():
    """
    Renders the HCPC tool
    """
    TECHNIQUE_CHOICES = ['tfidf_method', 'tfidf_word', 'tfidf_method_and_docstring', 'tfidf_word_and_docstring',
                         'lda_method', 'lda_word', 'lda_method_and_docstring', 'lda_word_and_docstring', 'lsi_method',
                         'lsi_word', 'lsi_method_and_docstring', 'lsi_word_and_docstring', 'text_rank',
                         'tree_context_based_label']
    return render_template('visualization_app/App.html', subject_systems=SUBJECT_SYSTEMS, technique_choices=TECHNIQUE_CHOICES)


@app.route('/get_cluster/', methods=['GET'])
def get_cluster():
    """
    Returns the clusters trees of the two subject systems but first calculates the similarity values of each node in one
    cluster tree with every node in the other cluster tree
    """
    subject_system = request.args.get('subject_system')
    other_subject_system = request.args.get('other_subject_system')
    with open(ROOT + subject_system, 'r') as f:
        print(subject_system)
        content = f.read()
        clusters = eval(content)

    if subject_system not in similarity or other_subject_system not in similarity:
        similarity.clear()

    if subject_system in similarity:
        return jsonify(clusters)

    cluster_similarity = {}
    other_cluster_similarity = {}
    file = open(ROOT + other_subject_system, 'r')
    content = file.read()
    other_sub_sys_clusters = eval(content)
    for cluster in clusters['cluster']:
        words = cluster['words_in_cluster']
        words = words.split(" ")
        key = cluster['key']
        if str(key) not in cluster_similarity:
            cluster_similarity[str(key)] = {}
        for other_cluster in other_sub_sys_clusters['cluster']:
            other_words = other_cluster['words_in_cluster']
            other_words = other_words.split(" ")
            other_key = other_cluster['key']
            similarity_value = len(set(words) & set(other_words)) / len(set(words) | set(other_words))
            cluster_similarity[str(key)][str(other_key)] = similarity_value
            if str(other_key) not in other_cluster_similarity:
                other_cluster_similarity[str(other_key)] = {}
            other_cluster_similarity[str(other_key)][str(key)] = similarity_value
    similarity[subject_system] = cluster_similarity
    similarity[other_subject_system] = other_cluster_similarity
    return jsonify(clusters)

@app.route('/get_similarity/', methods=['GET'])
def get_similarity():
    """
    Returns similarity values array based on a given node
    """
    subject_system = request.args.get('subject_system')
    key = request.args.get('key')
    return similarity[subject_system][key]


if __name__ == '__main__':
    app.run()
