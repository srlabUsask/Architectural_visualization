import base64
import os
# from _operator import itemgetter
from io import BytesIO
import matplotlib.pyplot as plt

from tkinter import Image

import networkx as nx
from flask import Flask, jsonify, send_from_directory, render_template, json, jsonify
import ast



app = Flask(__name__)

#
# with open('nodegrp1.json', 'r') as f1:
#     nodegrp1 = json.loads(f1.read())
#
# with open('nodegrp2.json', 'r') as f2:
#     nodegrp2 = json.loads(f2.read())
#
# with open('edgegrp1.json', 'r') as f3:
#     edgegrp1 = json.loads(f3.read())
#
# with open('edgegrp2.json', 'r') as f4:
#     edgegrp2 = json.loads(f4.read())

# nodetree = open("userNodes.txt")

#
PEOPLE_FOLDER = os.path.join('percentage.png')
app.config['UPLOAD_FOLDER'] = PEOPLE_FOLDER


nodegrp1=open("matchedNodes.txt", "r")
nodegrp2=open("userNodes.txt", "r")
edgegrp1=open("matchedEdges.txt", "r")
edgegrp2=open("userEdges.txt", "r")


global edge1dict
global edge2dict
edge1list= []
edge2list = []
edge1dict = {}
edge2dict = {}

for line in nodegrp1:
    node1 = line.strip()

for line1 in edgegrp1:
    edge1 = line1.strip()
    res1= edge1.split(' ',1)[0]
    # # print("res1 :" +res1)
    res2= edge1.split(' ',2)[1]
    edge1list.append(res1 + " : " + res2)
    # if res1 in edge1dict:
    #
    #     list(edge1dict[res1]).append(res2)
    # else:
    #     edge1dict[str(res1)] = str(res2)

# print(edge1list)

# edges = nx.parse_edgelist(edge1list, nodetype = str)
# print(edges)
print(edge1list)

for line in nodegrp2:
    node2 = line.strip()

for line2 in edgegrp2:
    edge2 = line2.strip()
    res1= edge2.split(' ',1)[0]
    # print("res1 :" +res1)
    res2= edge2.split(' ',2)[1]
    # print("res2 :" +res2)
    edge2list.append(res1 + " : " + res2)
    # if res1 in edge2dict:
    #
    #     list(edge2dict[res1]).append(res2)
    # else:
    #     edge2dict[str(res1)] = str(res2)

print(edge2dict)





@app.route('/')
def index():

    #jsonify(nodegrp1)



    # print(edge1dict);

    full_filename = os.path.join(app.config['UPLOAD_FOLDER'], 'percentage.png')

    print(full_filename)

    return render_template('friendwheel.html', sc1_nodes=node1,sc1_edges=edge1list,sc2_nodes=node2,sc2_edges=edge2list,img=full_filename)
    #return render_template('friendwheel-copy.html', nodegrp1=node1,nodegrp2=node2,edgegrp1=edge1list,edgegrp2=edge2list,img=full_filename)
    #return render_template('treeview.html', nodetree= node2)
    #return render_template('CHRM.html')





if __name__ == '__main__':
    app.run(debug=True)
