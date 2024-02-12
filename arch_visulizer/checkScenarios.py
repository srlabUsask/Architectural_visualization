from __future__ import division
import matplotlib.pyplot as plt
import numpy as np
import plotly.graph_objs as go
from plotly.offline import download_plotlyjs, init_notebook_mode, plot, iplot

import networkx as nx

import tkinter as tk


button = ''
label = ''
global p
p = []
global CoupRecord
CoupRecord=[]
userlog = open('scenarios/Static/build.log')
# userlog = open('uinit.log')      #view 2
#userlog = open('uopen.log')      #view 2
#userlog = open('ureport.log')    #view 2
#userlog = open('scenarios/8.log') #parameters

view = 1

global matchingscene
matchingscene=0

f0 =open('scenarios/Static/help.log')
f1 = open('scenarios/Static/open.log')
f2 = open('scenarios/Static/build+run.log')
f3 = open('scenarios/Static/build.log')
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
g = nx.DiGraph()
S = []
T = []

def extracting_source_and_exit_node():
   print('In degree')
   for s, v in g.in_degree():
       # print(s, v)
       if v == 0:
           S.append(s)
           # print(s)
   print(len(S))
   print('Out degree')
   for t, v in g.out_degree():
       # print(t, v)
       if v == 0:
           T.append(t)
           # print(t)

   print(len(T))

   return
# taking a particular log file and generating a graph
def buildgraph(f, view):
   # g = nx.DiGraph()
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
   # extracting_source_and_exit_node()

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

   for e in g.nodes:
       nodes.append(e)

   return nodes #extracting Nodes

def compressed_edge(g):
   edge = []

   for e in g.edges:
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
   for i in list1.edges:
       if i in list2:
            edgeList.append(i)

   return edgeList


def similiarityEdge(list1, list2):
   score = 0
   for i in list1.edges:
       if i in list2:
           score = score+1

   return score

#percentage
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

#gb = buildgraph(fb, view)

g0 = buildgraph(f0, view)
g1 = buildgraph(f1, view)
g2 = buildgraph(f2, view)
g3 = buildgraph(f3, view)
g4=  buildgraph(f4, view)


'''
g3 = buildgraph(f3, view)
g4 = buildgraph(f4, view)
g5 = buildgraph(f5, view)
g6 = buildgraph(f6, view)
g7 = buildgraph(f7, view)
g8 = buildgraph(f8, view)
g9 = buildgraph(f9, view)
g10 = buildgraph(f10, view)
'''

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




### building graph metric

#full graph
graphs = [g0, g1, g2, g3, g4] # g3, g4, # g5, g6, g7, g8, g9, g10]
files=[f0,f1,f2,f3,f4]
#compressed graph
compressed_graphs = []
compressed_edges = []


for g in graphs:
   compressed_graphs.append(compressed_info(g))
   compressed_edges.append(compressed_edge(g))
# print compressed_graphs
# print compressed_edges
def buttonevent():
   global maxsim, matchingscene

   ### user scenario part

   ftest = userlog
   gtest = buildgraph(ftest, view)

   #custom_draw(gtest)

   #compress graph
   compressed_gtest = compressed_info(gtest)
   compressed_gedge = compressed_edge(gtest)
   # print(compressed_gedge)
   # print gtest
   # print compressed_gtest

   ### get similarities
   trynode=[]
   tryedge = []
   edgecomp =[]
   nodecom=[]
   sims = []
   del p[:]
   for com in graphs:
           sims.append(similarity(com, compressed_gtest))
           p.append(matchscenerios(com, compressed_gtest))
           edgecomp.append(similiarityEdge(com, compressed_gedge))
           trynode.append(similiarityNode(com,compressed_gtest))
           tryedge.append(simEdge(com,compressed_gedge))



   maxsim = max(p)
   maxedge= max(edgecomp)
   matchedge= edgecomp.index(maxedge)
   matchingscene = p.index(maxsim)

   n=trynoded(trynode)
   e=tryedged(tryedge)

   # print(n)
   # print(e)
   #print 'maxsim =', maxsim
   #print 'scenario', matchingscene

   print(graphs[matchingscene])

   #matched graph
   nodegrp1 = graphs[matchingscene].nodes
   # print (nodegrp1)
   # print("nodegroup1:" + nodegrp1)
   edgegrp1 = graphs[matchingscene].edges

   #user's graph
   nodegrp2 = gtest.nodes
   edgegrp2 = gtest.edges



   nodegrp3 = n
   edgegrp3 = e

   with open("matchedNodes.txt", 'w') as outfile1:
       outfile1.write(str(graphs[matchingscene].nodes))
   with open("matchedEdges.txt",'w') as outfile2:
       outfile2.write(str(nx.write_edgelist(graphs[matchingscene],"matchedEdges.txt")))


   with open("userNodes.txt".format(userlog.name), 'w') as outfile1:
       outfile1.write(str(gtest.nodes))
   with open("userEdges.txt", 'w') as outfile2:
       outfile2.write(str(nx.write_edgelist(gtest,"userEdges.txt")))



   # for n in nodegrp1:
   #     data[n]=filegenerate(n)

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


   # nx.set_node_attributes(G, attrs)

   # sample= nx.DiGraph()
   # sample.add_nodes_from(n)
   # sample.add_edges_from(e)

   position = nx.circular_layout(G,scale=10)
   plt.figtext(0.5, 0.95, "A Scenerio Between Best Matched Case ("+ files[matchingscene].name+ ") & Userlog (" +userlog.name+ ")",size="small",  ha ='center',color="brown",weight="bold")


   # created graph
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


   colors=["brown","brown","brown","brown"]
   colors.insert(matchingscene,"lightgreen")



   fig, ax = plt.subplots()


   labels =[ f0.name,f1.name, f2.name, f3.name, f4.name]
   # sizes = np.array(p)
   sizes= p
   print ( sizes)
   index = np.arange(len(labels))
   # colors = ['skyblue', 'purple', 'pink', 'orange']
   plt.bar(index, sizes, color=colors)

   plt.xlabel('log_files', fontsize=8)
   plt.ylabel('percentage', fontsize=8)
   plt.xticks(index,labels, fontsize=8, rotation=12)
   plt.title('Matched Scenerios')
   plt.savefig('percentage.png')




   label.config(background="green")
   tk.Label(label, text=userlog.name + " is best matched with " + files[matchingscene].name + "!", font ="none 10 italic underline").pack()


   plt.show()




try:
   root = tk.Tk()
   root.geometry('300x200')
   root.title('Call Graph Generator')


   button = tk.Button(root, text ='Plot', command = buttonevent)
   label = tk.Label(root, text ='')

   button.pack()
   label.pack()

   button.place(x = 100, y = 20, height = 50, width = 100, in_=root)
   label.place(x = 30, y = 100, in_ = root)


   root.mainloop()
except Exception as e:
   pass

