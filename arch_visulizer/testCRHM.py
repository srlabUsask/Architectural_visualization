from tkinter import Label

import matplotlib.pyplot as plt
import numpy as np
import plotly.graph_objs as go

import networkx as nx

import tkinter as tk

button = ''
label = ''

Gl = []

global perc
perc= []

global p_f
p_f = []

global CoupRecord
CoupRecord=[]
userlog = open('scenarios/UserLogs/Open-changedate_add_obs_save.log')
# userlog = open('uinit.log')      #view 2
#userlog = open('uopen.log')      #view 2
#userlog = open('ureport.log')    #view 2
#userlog = open('scenarios/8.log') #parameters

view = 1

global matchingscene
matchingscene=0

f0 =open('scenarios/Static/open.log')
f1 = open('scenarios/Static/build+run.log')
f2 = open('scenarios/Static/OpenObsFile.log')
f3 = open('scenarios/Static/run.log')
f4= open('scenarios/Static/ChangeIntervalandHRUs.log')




fileName = []



'''
#f = open('test.txt')
f0 = open('scenarios/0.log') #analysis
f0 = open('scenarios/0.log') #analysis
f1 = open('scenarios/1.log') #prj>report
f2 = open('scenarios/2.log') #prj>open
f3 = open('scenarios/3.log') #prj>log>select
f4 = open('scenarios/4.log') #prj>saveas
f5 = open('scenarios/5.log') #prj>refresh rate>select
f6 = open('scenarios/6.log') #observation>open
f7 = open('scenarios/7.log') #prj>frequency default>cancel
f8 = open('scenarios/8.log') #parameters
f9 = open('scenarios/9.log') #export
f10 = open('scenarios/10.log') #help
'''
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
            if ("TObject*Sender" or "Click") in line:
                Gl.append(funname)
            # print funname
        else:
            funname = line.strip()[1:line.find('(') - 0] # void__fastcallTMain::OnHint
            if ("Tobject*Sender" or "Click") in line:
                Gl.append(funname)
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
    # print(Gl)


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


# extracting Nodes
def compressed_info(g):
    nodes = []

    for e in g.nodes:
        nodes.append(e)

    return nodes

# extracting Edges
def compressed_edge(g):
    edge = []

    for e in g.edges:
        edge.append(e)

    return edge

# total matched nodes
def simnodescore(list1, list2):
    score = 0
    for i in list1:
        if i in list2:
            # print(i)
            score = score+1

    return score

# total matched edges
def simedgescore(list1, list2):
    score = 0
    for i in list1.edges:
        if i in list2:
            score = score+1

    return score

# list of matched nodes
def simNodeList(list1, list2):
    nodeList = []
    for i in list1:
        if i in list2:
             nodeList.append(i)

    return nodeList

#list of matched edges
def simEdgeList(list1, list2):
    edgeList = []
    for i in list1.edges:
        if i in list2:
             edgeList.append(i)

    return edgeList


# percentage of matched case

def matchscenerios(list1,list2):
   if len(CoupRecord)==4:
       del CoupRecord[:]
   score = 0
   percS=''
   for i in list1:
       if i in list2:
         score=score+1

   Gmethods= len(list1)
   if Gmethods==0:
       percS= '0%'
       CoupRecord.append("NotCoupled")
   else:
   # totalGMethods=list2[Gmethods].count()
   #     percS= str((score/Gmethods)*100)
       percNum= (score/Gmethods)*100


       if percNum>50:
           CoupRecord.append("Highly Coupled")
       else:
           CoupRecord.append("NotCoupled")
   # print  Gmethods/

   return percNum



g0 = buildgraph(f0, view)
g1 = buildgraph(f1, view)
g2 = buildgraph(f2, view)
g3 = buildgraph(f3, view)
g4=  buildgraph(f4, view)



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




#full graph
graphs = [g0, g1, g2, g3, g4] # g3, g4, # g5, g6, g7, g8, g9, g10]

files=[f0,f1,f2,f3,f4]


#compressed graph
compressed_graphs = []
compressed_edges = []

# compress graphs holds nodes and edges of all graphs
for g in graphs:
    compressed_graphs.append(compressed_info(g))
    compressed_edges.append(compressed_edge(g))
# print compressed_graphs
# print compressed_edges
def buttonevent():
    global maxsim, matchingscene

    ### user scenario part


    ugraph = buildgraph(userlog, view) # user's log

    # gtest_class= buildgraph_class(ftest, view)
    # gtest_files= buildgraph_files(ftest, view)

''
    #compress the user graph

    compressed_unodes = compressed_info(ugraph)

    # compressed_gtest_class = compressed_info(gtest_class)
    # compressed_gtest_files = compressed_info(gtest_files)

    compressed_uedge = compressed_edge(ugraph)

    # compressed_gedge_class = compressed_edge(gtest_class)
    # compressed_gedge_files = compressed_edge(gtest_files)


    # # print(compressed_gedge)
    # print gtest
    # print compressed_gtest

    ### get similarities
    trynode=[]
    tryedge = []
    edgecomp =[]
    nodecom=[]
    sims = []

    trynodeC = []
    tryedgeC = []
    edgecompC = []
    nodecomC = []
    simsC = []

    trynodeF = []
    tryedgeF = []
    edgecompF = []
    nodecomF = []
    simsF = []


    del perc[:]
    for com in graphs:
            sims.append(simnodescore(com, compressed_unodes))
            # simsC.append(similarity(com, compressed_gtest_class))
            # simsF.append(similarity(com, compressed_gtest_files))

            perc.append(matchscenerios(com, compressed_uedge))

            edgecomp.append(simedgescore(com, compressed_uedge))
            # edgecompF.append(similiarityEdge(com, compressed_gedge_files))
            # edgecompC.append(similiarityEdge(com, compressed_gedge_class))

            trynode.append(simNodeList(com,compressed_unodes))
            # trynodeF.append(similiarityNode(com, compressed_gtest_files))
            # trynodeC.append(similiarityNode(com, compressed_gtest_class))

            tryedge.append(simEdgeList(com,compressed_uedge))
            # tryedgeF.append(simEdge(com, compressed_gedge_files))
            # tryedgeC.append(simEdge(com, compressed_gedge_class))



            # nodecom.append(similiarityNode(com, compressed_gtest))

    # print '\n\n'
    # print sims
    # print(perc)
    # print(edgecomp)



    maxsim = max(perc)
    maxedge= max(edgecomp)
    matchedge= edgecomp.index(maxedge)
    matchingscene = perc.index(maxsim)


    #notify matched node
    n=trynoded(trynode)
    # nc=trynoded(trynodeC)
    # nf= trynoded(tryedgeF)

    #notify macthed edges
    e=tryedged(tryedge)
    # ef= tryedged(tryedgeF)
    # ec=tryedged(tryedgeC)

    # print(n)
    # print(e)
    #print 'maxsim =', maxsim
    #print 'scenario', matchingscene

    #matched graph
    nodegrp1 = graphs[matchingscene].nodes
    edgegrp1 = graphs[matchingscene].edges

    # nodegrp1F = graphs[matchingsceneF].nodes
    # edgegrp1F = graphs[matchingsceneF].edges
    #
    # nodegrp1C = graphs[matchingsceneC].nodes
    # edgegrp1C = graphs[matchingsceneC].edges

    #user's graph
    nodegrp2 = ugraph.nodes
    edgegrp2 = ugraph.edges


    nodegrp3 = n
    edgegrp3 = e


    G = nx.DiGraph()
    G.add_nodes_from(nodegrp1)
    G.add_edges_from(edgegrp1)


    G.add_nodes_from(nodegrp2)
    G.add_edges_from(edgegrp2)

    ft= f0.name

    for i in nodegrp1:
        G.add_node(i,file=f0.name )

    G.nodes(data=True)
    # print(list(G.nodes.data('file')))



    position = nx.circular_layout(G,scale=10)


    nx.draw(G,
            label="matched",
            pos=position,
            nodelist=nodegrp3,
            label_size= 8,
            with_labels=True,
            edgelist=edgegrp3,
            node_size=100,
            edge_size=50,
            edge_color='yellow',
            node_shape='s',
            width=3,
            node_color='yellow',
            font_color='black',
            font_size= 6.5,
            arrowstyle='->',
            node_data=True,
            shadow=True
            )
    #matched graph
    nx.draw(G,
            label=files[matchingscene].name,
            pos=position,
            nodelist=nodegrp1,
            label_size=8,
            hovermode='closest',
            with_labels=True,
            edgelist=edgegrp1,
            node_size=100,
            edge_size=100,
            edge_color='skyblue',
            node_shape='s',
            width=1,
            alpha=1,
            node_color='skyblue',
            font_color='red',
            font_size=6.5,
            arrowstyle=' ->',
            node_data = True,
            shadow=True


            )

    # # user
    nx.draw(G,
            label=userlog.name,
            pos=position,
            nodelist=nodegrp2,
            edgelist=edgegrp2,
            with_labels=True,
            hovermode='closest',
            label_size=8,
            node_size=100,
            edge_size=100,
            edge_color = 'green',
            node_shape = 'd',
            width=1,
            font_size=6.5,
            node_color='green',
            font_color="brown",
            arrowstyle='->',
            node_data=True,
            shadow=True


            )


    plt.legend(loc='lower right')


    colors=["darkblue","darkblue","darkblue","darkblue"]
    colors.insert(matchingscene,"brown")


    fig, ax = plt.subplots()

    labels =[ f0.name,f1.name, f2.name, f3.name, f4.name]
    # sizes = np.array(p)
    print(perc)
    sizes= perc
    index = np.arange(len(labels))
    # colors = ['skyblue', 'purple', 'pink', 'orange']
    plt.bar(index, sizes, color=colors)

    plt.xlabel('log_files', fontsize=8)
    plt.ylabel('percentage', fontsize=8)
    plt.xticks(index,labels, fontsize=8, rotation=12)
    plt.title('Matched Scenerios with UserLog ('+userlog.name+ ")")





    label.config(background="green")
    Label(label,text=userlog.name+" is best matched with " + files[matchingscene].name+"!",font = "none 10 italic underline").pack()

    plt.show()



try:
    root = tk.Tk()
    root.geometry('300x200')
    root.title('Call Graph Generator')


    button = tk.Button(root, text ='Plot', command = buttonevent)
    label = Label(root, text = '')

    button.pack()
    label.pack()

    button.place(x = 100, y = 20, height = 50, width = 100, in_=root)
    label.place(x = 30, y = 100, in_ = root)


    root.mainloop()
except Exception as e:
    pass
### console running part

# plot
#color()

# flush log file
#open('C:/injection.log', 'w').close()


## GUI part

