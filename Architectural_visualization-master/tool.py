import base64
import os
# from _operator import itemgetter
from io import BytesIO
import matplotlib.pyplot as plt
from tkinter import Image
import networkx as nx
from flask import Flask, jsonify, send_from_directory, render_template, json, jsonify, request, flash, redirect, url_for
import ast
import json

from werkzeug.utils import secure_filename

from diff_scenarios import buildgraph,buttonevent

app = Flask(__name__)
view = 1

global  sc1_graphs, sc2_graphs, perc,sc1_file_names,sc2_file_names

#scenario 1 files
sc1_f1 = open('scenarios/Static/Task_1_Nov-19-20.log')
sc1_f2 = open('scenarios/Static/Task_2_Nov-19-20.log')
sc1_f3 = open('scenarios/Static/Task_3_Nov-19-20.log')
sc1_f4 = open('scenarios/Static/Task_4_Nov-19-20.log')
sc1_filename1 = os.path.basename('scenarios/Static/Task_1_Nov-19-20.log')
sc1_filename2 = os.path.basename('scenarios/Static/Task_2_Nov-19-20.log')
sc1_filename3 = os.path.basename('scenarios/Static/Task_3_Nov-19-20.log')
sc1_filename4 = os.path.basename('scenarios/Static/Task_4_Nov-19-20.log')

sc1_file_names = [sc1_filename1,sc1_filename2,sc1_filename3,sc1_filename4]


#scenario 2 files
sc2_f1 = open('scenarios/Static/Task_1_Feb-04-22.log')
sc2_f2 = open('scenarios/Static/Task_2_Feb-04-22.log')
sc2_f3 = open('scenarios/Static/Task_3_Feb-04-22.log')
sc2_f4 = open('scenarios/Static/Task_4_Feb-04-22.log')
sc2_filename1 = os.path.basename('scenarios/Static/Task_1_Feb-04-22.log')
sc2_filename2 = os.path.basename('scenarios/Static/Task_2_Feb-04-22.log')
sc2_filename3 = os.path.basename('scenarios/Static/Task_3_Feb-04-22.log')
sc2_filename4 = os.path.basename('scenarios/Static/Task_4_Feb-04-22.log')

sc2_file_names = [sc2_filename1,sc2_filename2,sc2_filename3,sc2_filename4]

# f2 = open('scenarios/Static/build+run.log')
# f3 = open('scenarios/Static/help.log')
# f4= open('scenarios/Static/ChangeIntervalandHRUs.log')

#scenario 1 graphs
sc1_g1 = buildgraph(sc1_f1, view)
sc1_g2 = buildgraph(sc1_f2, view)
sc1_g3 = buildgraph(sc1_f3, view)
sc1_g4 = buildgraph(sc1_f4, view)

#scenario 2 graphs
sc2_g1 = buildgraph(sc2_f1, view)
sc2_g2 = buildgraph(sc2_f2, view)
sc2_g3 = buildgraph(sc2_f3, view)
sc2_g4 = buildgraph(sc2_f4, view)

sc1_graphs = [sc1_g1,sc1_g2,sc1_g3,sc1_g4]
sc2_graphs = [sc2_g1,sc2_g2,sc2_g3,sc2_g4]




# Extracting scenario graphs info
def sc1_info_for_callgraph():
    sc1_nodes = []
    sc1_edges = []

    sc2_nodes = []
    sc2_edges = []

    for g in sc1_graphs:

        nodes = g.nodes()
        n_list = list(nodes)
        sc1_nodes.append(n_list)
        edges =g.edges()
        e=list(edges)
        # res=json.dumps((e))
        # res=json.dumps(dict(edges))
        # for i in edges:
        #     e.update({ i[0] : i[1]})
            # e.append(i[0])

        sc1_edges.append(e)
    return sc1_nodes,sc1_edges

def sc2_info_for_callgraph():

    sc2_nodes = []
    sc2_edges = []
    for g in sc2_graphs:
        nodes = g.nodes()
        n_list =list(nodes)
        sc2_nodes.append(n_list)
        edges = g.edges()
        e = list(edges)
        # res=json.dumps((e))
        # e=dict(edges)
        # for i in edges:
        #     e=dict(i)
        # for i,j in edges:
        #     e.setdefault(i,j)
        # e.append(i[0])

        sc2_edges.append(e)
    return sc2_nodes, sc2_edges

#calculating differences
def perc_calc():
    perc=[]
    for g in sc1_graphs:
        perc.append(buttonevent(sc2_graphs,g))

    return perc


def cal_matched_mismatched_nodes(g,sc2_graphs):
    res=[]

    for graph in sc2_graphs:
        list1= list(g.nodes())
        list2 = list(graph.nodes())
        list1_as_set = set(list1)
        intersection = list1_as_set.intersection(list2)
        intersection_as_list = list(intersection)
        # union = list1_as_set.union(list2)
        # union_as_list = list(list1_as_set.union(list2))

        matched = len(intersection_as_list)
        mismatched1= len(list1)-len(intersection_as_list)
        mismatched2= len(list2)-len(intersection_as_list)
        # total = len(list(union))
        # matched = len(intersection_as_list)
        # mismatched = total -len(intersection_as_list)
        node_count_1= [len(list1),matched,mismatched1]
        node_count_2=[len(list2),matched,mismatched2]
        res.append([node_count_1,node_count_2])
    return res

def get_matched_mismached_nodes():
    res=[]
    for g in sc1_graphs:
        res.append(cal_matched_mismatched_nodes(g,sc2_graphs))
    return res

#total_node_count = get_matched_mismached_nodes()
#print(total_node_count)
# Extracting scenario 2 graphs info


# print "\n".join(sc1_nodes)
# print "\n".join(sc1_edges)
sc1_node = []
sc2_node = []
sc1_edge = []
sc2_edge = []
sc1_node,sc1_edge = sc1_info_for_callgraph()
sc2_node, sc2_edge= sc2_info_for_callgraph()
perc= perc_calc()




# def allowed_file(filename, ALLOWED_EXTENSIONS=None):
#     return '.' in filename and \
#            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

ALLOWED_EXTENSIONS = set(['.log',])


def allowed_file(filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        f = request.files['sc_uploads']
        #check for only log files to be added to the scenarios
        if 'sc_uploads' not in request.files:
             flash('No file part')
             pass
        # # if user does not select file, browser also
        # # submit an empty part without filename
        if f.filename == '':
             flash('No selected file')
             pass
        # if not f.filename.rsplit('.', 1)[1].lower() in ".log":
        #     flash('Please add a valid file')
        #     return redirect(request.url)
        if f or f.filename.rsplit('.', 1)[1].lower() in ".log":

            f = request.files['sc_uploads']
            f.save(secure_filename(f.filename))
            new_file = open(f.filename)
            # print(f)
            print(f.filename)
            print(sc1_file_names)
            sc1_file_names.append(str(f.filename))
            print(sc1_file_names)
            sc2_file_names.append(str(f.filename))
            new_graph=buildgraph(new_file,1)
            #print(new_graph.nodes)
            sc1_graphs.append(new_graph)
            #print(sc1_graphs)
            sc2_graphs.append(new_graph)
            sc1_new_nodes,sc1_new_edges = sc1_info_for_callgraph()
            sc2_new_nodes,sc2_new_edges = sc2_info_for_callgraph()
            perc_new= perc_calc()
            #total_node_count_new = get_matched_mismached_nodes()

            print(perc_new)

            return render_template('friendwheel.html', sc1_nodes =sc1_new_nodes, sc1_edges =sc1_new_edges, sc2_nodes =sc2_new_nodes, sc2_edges =sc2_new_edges, sc1_filenames =sc1_file_names, sc2_filenames = sc2_file_names,perc=perc_new)

    return render_template('friendwheel.html', sc1_nodes =sc1_node, sc1_edges =sc1_edge, sc2_nodes =sc2_node, sc2_edges =sc2_edge, sc1_filenames =sc1_file_names, sc2_filenames = sc2_file_names,perc=perc)



if __name__ == '__main__':
    app.secret_key = 'super secret key'
    app.config['SESSION_TYPE'] = 'filesystem'

    app.run(debug=True,port=8001)
