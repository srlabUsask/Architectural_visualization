from __future__ import division
import matplotlib.pyplot as plt
import numpy as np
import plotly.graph_objs as go
from plotly.offline import download_plotlyjs, init_notebook_mode, plot, iplot
import networkx as nx
from tkinter import *

# taking a particular log file and generating a graph
def buildgraph(f, view):
    g = nx.DiGraph()
    stack = []

    for line in f:
        # get func and file names without unnecessary texts
        if not "(" in line:
            continue
        if not "::" in line:
            continue
        funname = ''
        if ':' in line:
            funname = line.strip()[line.find(':') + 2:line.find('(') - 0] # ::OnHint
            # print funname
        else:
            funname = line.strip()[1:line.find('(') - 0] # void__fastcallTMain::OnHint
            # print funname

        filename =line.strip()[line.find('@@@') + 4: -7] #CRHMmain.cpp_nocom
        # --adding the root node--

        #root opening
        if '<root>' in line:
            stack.append('root')
            g.add_nodes_from(['root'])

        #root closing
        elif '</root>' in line:
            stack.pop()

        #opening other than root
        elif '</' not in line:
            if view == 1:
                # stack.append(funname[2:len(funname)])
                stack.append(funname)
            else:
                stack.append(filename)

            parent = stack[len(stack)-2]
            child = stack[len(stack)-1]

            #print stack[len(stack)-2]
            #print len(stack)-2
            #print stack[-1]

            g.add_edges_from([(parent, child)])

        else:
            try:
                stack.pop()
            except Exception as e:
                pass

    #end of loop

    #print stack
    print ('unique scenario extracted for', f.name)

    return g

def custom_draw(g):
    nx.draw_circular(g,
                     with_labels=True,
                     node_size=500,
                     edge_color='blue',
                     node_shape = 's',
                     width=1,
                     alpha = 1,
                     node_color='lightgreen',
                     font_color='red',
                     font_size=8,
                     arrowstyle = '->',

                     )

    plt.show(block=True)


def compressed_info(g):
    nodes = []

    for e in g.nodes():
        nodes.append(e)

    return nodes #extracting Nodes

def compressed_edge(g):
    edge = []

    for e in g.edges():
        edge.append(e)

    return edge #extracting Edges

def similarity(list1, list2):
    score = 0
    for i in list1:
        if i in list2:
            # print(i)
            score = score+1

    return score

def similiarityNode(list1, list2):
    nodeList = []
    for i in list1:
        if i in list2:
             nodeList.append(i)

    return nodeList


def simEdge(list1, list2):
    edgeList = []
    for i in list1.edges():
        if i in list2:
             edgeList.append(i)

    return edgeList


def similiarityEdge(list1, list2):
    score = 0
    for i in list1.edges():
        if i in list2:
            score = score+1

    return score

def matchscenerios(list1,list2):

    list1_as_set = set(list1)
    intersection = list1_as_set.intersection(list2)
    intersection_as_list = list(intersection)
    print(len(list1))
    print(len(list2))
    print(len(intersection_as_list))
    res = len(intersection_as_list) / (len(list1)) * 100
    # mismatched = len(intersection_as_list)
    # matched = (len(list)+len(list2)) - mismatched


    # res = len(intersection_as_list)/(len(list1)+len(list2)) * 100
    # if len(CoupRecord)==4:
    #     del CoupRecord[:]
    # score = 0
    # percS=''
    # score=0
    # for i in list1:
    #     if i in list2:
    #       score=score+1
    #
    # len_list2= len(list2)
    #
    # percNum = (score / len_list2) * 100
    # print(score)
    # if len_list1==0:
    #     percS= '0%'
    #     CoupRecord.append("NotCoupled")
    # else:
    # # totalGMethods=list2[Gmethods].count()
    # #     percS= str((score/Gmethods)*100)
    #     percNum= (score/Gmethods)*100


        # if percNum>50:
        #     CoupRecord.append("Highly Coupled")
        # else:
        #     CoupRecord.append("NotCoupled")
    # print  Gmethods/

    return res


def trynoded(list):
    node=[]
    for i in list:
        for j in i:
            node.append(j)
    return node

def tryedged(list):
    edge=[]
    for i in list:
        for j in i:
            edge.append(j)
    return edge

def buttonevent(g_arr, gtest):

    # global maxsim, matchingscene
    # # graphs = []
    # result =[]
    perc = []


    ### user scenario part

    # ftest = userlog
    # gtest = buildgraph(ftest, view)

    # for g in g_arr:

    # gtest = g
    # graphs = g_arr.remove(g)


    #custom_draw(gtest)

    #compress graph
    # compressed_gtest = compressed_info(gtest)
    compressed_gedge = compressed_edge(gtest)

    ### get similarities
    trynode=[]
    tryedge = []
    edgecomp =[]
    nodecom=[]
    sims = []

    gtest_nodes=[gtest.nodes]
    # del perc[:]
    for com in g_arr:
            # sims.append(similarity(com, compressed_gtest))
            perc.append(matchscenerios((list(com.nodes())), list(gtest.nodes())))
            # edgecomp.append(similiarityEdge(com, compressed_gedge))
            # trynode.append(similiarityNode(com,compressed_gtest))
            # tryedge.append(simEdge(com,compressed_gedge))
    # perc.append(p)
    #
    # print sims
    # print(p)
    # print(edgecomp)


    # maxsim = max(perc)
    # maxedge= max(edgecomp)
    # matchedge= edgecomp.index(maxedge)
    # matchingscene = perc.index(maxsim)
    return perc
