from flask import Flask, jsonify, send_from_directory, render_template
from flask import abort
from flask import make_response
from flask import request
from flask import url_for
from flask_cors import CORS
import glob
import config

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


@app.route('/', methods=['GET'])
def root():
    # return 'Hello world'
    TECHNIQUE_CHOICES = ['tfidf_method', 'tfidf_word', 'tfidf_method_and_docstring', 'tfidf_word_and_docstring',
                         'lda_method', 'lda_word', 'lda_method_and_docstring', 'lda_word_and_docstring', 'lsi_method',
                         'lsi_word', 'lsi_method_and_docstring', 'lsi_word_and_docstring', 'key_words']
    return render_template('home.html', subject_systems=SUBJECT_SYSTEMS, technique_choices=TECHNIQUE_CHOICES)


@app.route('/get_cluster/', methods=['GET'])
def get_cluster():
    subject_system = request.args.get('subject_system')
    with open(ROOT + subject_system, 'r') as f:
        print(subject_system)
        content = f.read()
        cluster = eval(content)

    return jsonify(cluster)


if __name__ == '__main__':
    app.run()
