from __future__ import division
import matplotlib.pyplot as plt
import numpy as np
import plotly.graph_objs as go
from plotly.offline import download_plotlyjs, init_notebook_mode, plot, iplot
import networkx as nx
from tkinter import *

button = ''
label = ''
global p
p = []
global CoupRecord
CoupRecord=[]
userlog = open('scenarios/UserLogs/clogs_help')

view = 1

global matchingscene
matchingscene=0

f0 =open('scenarios/Static/OpenObsFile.log')
f1 = open('scenarios/Static/open.log')
f2 = open('scenarios/Static/build+run.log')
f3 = open('scenarios/Static/help.log')
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



#percentage
# def matchscenerios(list1,list2):
#     if len(CoupRecord)==4:
#         del CoupRecord[:]
#     score = 0
#     percS=''
#     for i in list1:
#         if i in list2:
#           score=score+1
#
#     Gmethods= len(list1)
#     if Gmethods==0:
#         percS= '0%'
#         CoupRecord.append("NotCoupled")
#     else:
#     # totalGMethods=list2[Gmethods].count()
#     #     percS= str((score/Gmethods)*100)
#         percNum= (score/Gmethods)*100
#
#
#         if percNum>50:
#             CoupRecord.append("Highly Coupled")
#         else:
#             CoupRecord.append("NotCoupled")
#     # print  Gmethods/
#
#     return percNum


### existing scenario part

#ga = buildgraph(fa, view)
#gb = buildgraph(fb, view)

# g0 = buildgraph(f0, view)
# g1 = buildgraph(f1, view)
# g2 = buildgraph(f2, view)
# g3 = buildgraph(f3, view)
# g4=  buildgraph(f4, view)


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
# graphs = [g0, g1, g2, g3, g4] # g3, g4, # g5, g6, g7, g8, g9, g10]
# files=[f0,f1,f2,f3,f4]
#compressed graph
compressed_graphs = []
compressed_edges = []

# for g in graphs:
#     compressed_graphs.append(compressed_info(g))
#     compressed_edges.append(compressed_edge(g))

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



        # n=trynoded(trynode)
        # e=tryedged(tryedge)
        #
        # # print(n)
        # # print(e)
        # #print 'maxsim =', maxsim
        # #print 'scenario', matchingscene
        #
        # #matched graph
        # nodegrp1 = g_arr[matchingscene].nodes
        #
        # # print("nodegroup1:" + nodegrp1)
        # edgegrp1 = g_arr[matchingscene].edges
        #
        # #user's graph
        # nodegrp2 = gtest.nodes
        # edgegrp2 = gtest.edges
        #
        # nodegrp3 = n
        # edgegrp3 = e
        #
        #
        # G = nx.DiGraph()
        # G.add_nodes_from(nodegrp1)
        # G.add_edges_from(edgegrp1)
        # G.add_nodes_from(nodegrp2)
        # G.add_edges_from(edgegrp2)
        #
        # ft= f0.name
        #
        # for i in nodegrp1:
        #     G.add_node(i,file=f0.name )
        #
        # G.nodes(data=TRUE)
        # print(list(G.nodes.data('file')))
        #
        #
        # position = nx.circular_layout(G,scale=10)
        # plt.figtext(0.5, 0.95, "A Scenerio Between Best Matched Case ("+ files[matchingscene].name+ ") & Userlog (" +userlog.name+ ")",size="small",  ha ='center',color="brown",weight="bold")
        #
        # nx.draw(G,
        #         label="matched",
        #         pos=position,
        #         nodelist=nodegrp3,
        #         label_size= 8,
        #         with_labels=True,
        #         edgelist=edgegrp3,
        #         node_size=100,
        #         edge_size=50,
        #         edge_color='yellow',
        #         node_shape='s',
        #         width=3,
        #         node_color='yellow',
        #         font_color='black',
        #         font_size= 6.5,
        #         arrowstyle='->',
        #         node_data=TRUE,
        #         shadow=True
        #         )
        # #matched graph
        # nx.draw(G,
        #         label=files[matchingscene].name,
        #         pos=position,
        #         nodelist=nodegrp1,
        #         label_size=8,
        #         hovermode='closest',
        #         with_labels=True,
        #         edgelist=edgegrp1,
        #         node_size=100,
        #         edge_size=100,
        #         edge_color='skyblue',
        #         node_shape='s',
        #         width=1,
        #         alpha=1,
        #         node_color='skyblue',
        #         font_color='red',
        #         font_size=6.5,
        #         arrowstyle=' ->',
        #         node_data = TRUE,
        #         shadow=True
        #
        #
        #         )
        #
        # # # user
        # nx.draw(G,
        #         label=userlog.name,
        #         pos=position,
        #         nodelist=nodegrp2,
        #         edgelist=edgegrp2,
        #         with_labels=True,
        #         hovermode='closest',
        #         label_size=8,
        #         node_size=100,
        #         edge_size=100,
        #         edge_color = 'green',
        #         node_shape = 'd',
        #         width=1,
        #         font_size=6.5,
        #         node_color='green',
        #         font_color="brown",
        #         arrowstyle='->',
        #         node_data=TRUE,
        #         shadow=True
        #
        #
        #         )
        # # plt.legend(["matched"], loc=0)
        # # plt.legend([graphs[matchingscene].name], loc=0)
        # plt.legend(loc='lower right')
        #
        #
        # colors=["brown","brown","brown","brown"]
        # colors.insert(matchingscene,"lightgreen")
        #
        #
        # # labels = ['Cookies', 'Jellybean', 'Milkshake', 'Cheesecake']
        # # sizes = [38.4, 40.6, 20.7, 10.3]
        # # colors = ['yellowgreen', 'gold', 'lightskyblue', 'lightcoral']
        # # # patches, texts = plt.pie(sizes, colors=colors, shadow=True, startangle=90)
        # # plt.legend(G, labels, loc="best")
        #
        # # tempList = [[f0.name, userlog.name, content1, p[j], CoupRecord[j]],
        # #             [f1.name, userlog.name, content2, p[j + 1], CoupRecord[j + 1]],
        # #             [f2.name, userlog.name, content3, p[j + 2], CoupRecord[j + 2]],
        # #             [f3.name, userlog.name, content4, p[j + 3], CoupRecord[j + 3]]]
        #
        # fig, ax = plt.subplots()
        #
        # # labels = ['Oxygen', 'Hydrogen', 'Carbon_Dioxide', 'Nitrogen']
        # # values = [4500, 2500, 1053, 500]
        # # colors = ['#FEBFB3', '#E1396C', '#96D38C', '#D0F9B1']
        # #
        # # trace = go.Pie(labels=labels, values=values,
        # #                hoverinfo='label+percent', textinfo='value',
        # #                textfont=dict(size=20),
        # #                marker=dict(colors=colors,
        # #                            line=dict(color='#000000', width=2)))
        # #
        # # py.iplot([trace], filename='styled_pie_chart')
        # labels =[ f0.name,f1.name, f2.name, f3.name, f4.name]
        # # sizes = np.array(p)
        # sizes= p
        # index = np.arange(len(labels))
        # # colors = ['skyblue', 'purple', 'pink', 'orange']
        # # plt.bar(index, sizes, color=colors)
        # #
        # # plt.xlabel('log_files', fontsize=8)
        # # plt.ylabel('percentage', fontsize=8)
        # # plt.xticks(index,labels, fontsize=8, rotation=12)
        # # plt.title('Matched Scenerios')
        # # plt.savefig('percentage.png')
        #
        #
        # # fig2, ax2 = plt.subplots()
        # # sizes = np.array(p)
        # # labels = f0.name, f1.name, f2.name, f3.name
        # # data=["%","%" "%"+"%"]
        # # colors = ['skyblue', 'purple', 'pink', 'orange']
        # # explode = ex  # explode 1st slice
        # #
        # # def absolute_value(val):
        # #     a = np.round(val / 100. * sizes.sum(), 0)
        # #     return a
        # # # plt.pie(sizes, explode=explode, labels=labels, colors=colors, shadow=True, startangle=140, autopct='%1.1f%%')
        # # plt.pie(sizes, explode=explode, labels=labels, colors=colors, shadow=True, startangle=140, autopct=absolute_value)
        # # plt.axis('equal')
        #
        #
        # # plt.title("best matched with ("+ files[matchingscene].name+")")
        # # plt.figtext(0.5, 0.95, "Best matched with : " +files[matchingscene].name, size="medium",color="red", weight="bold", ha ='center')
        # # # plt.figtext(0.51, 0.95,"("+files[matchingscene].name + ")", size="medium", color="red")
        #
        #
        # # Gi = nx.karate_club_graph()
        # # hv.Graph.from_networkx(Gi, nx.layout.circular_layout).opts(tools=['hover'])
        #
        #
        # label.config(background="green")
        # Label(label,text=userlog.name+" is best matched with " + files[matchingscene].name+"!",font = "none 10 italic underline").pack()
    # return result,perc



        #open('C:/injection.log', 'w').close()



        # plt.axis('equal')
        # plt.tight_layout()
        # plt.show()
        # table()
        # plt.show()


# desc1 = open('Descriptions/{}'.format(f0.name),'r')
# content1= desc1.read()
# desc2 = open('Descriptions/{}'.format(f1.name),'r')
# content2= desc2.read()
# desc3 = open('Descriptions/{}'.format(f2.name),'r')
# content3= desc3.read()
# desc4 = open('Descriptions/{}'.format(f3.name),'r')
# content4= desc4.read()
# desc5 = open('Descriptions/{}'.format(f4.name),'r')
# content5= desc4.read()

# desc4 = open('Descriptions/{}'.format(f3.name),'r')

# def chart():
#     fig, ax = plt.subplots()
#     labels = f0.name + "\n" + "(" + CoupRecord[0] + ")", f1.name + "\n" + "(" + CoupRecord[
#         1] + ")", f2.name + "\n" + "(" + CoupRecord[2] + ")", f3.name + "\n" + "(" + CoupRecord[3] + ")"
#     sizes = np.array(sims)
#     colors = ['gold', 'yellowgreen', 'lightcoral', 'lightskyblue']
#     explode = (0.1, 0, 0, 0)  # explode 1st slice
#
#     def absolute_value(val):
#         a = np.round(val / 100. * sizes.sum(), 0)
#         return a
#
#     plt.pie(sizes, explode=explode, labels=labels, colors=colors, shadow=True, startangle=140, autopct='%100.1f%%')
#     plt.axis('equal')
#     plt.show()
# def table():
#
#     p=buildgraph(f0,view)

    # j=0
    # tempList =  [[f0.name,userlog.name,content1,p[j],CoupRecord[j]],
    #             [f1.name,userlog.name,content2,p[j+1], CoupRecord[j+1]],
    #             [f2.name, userlog.name,content3 ,p[j+2], CoupRecord[j+2]],
    #             [f3.name,userlog.name,content4,p[j+3], CoupRecord[j+3]]]
    #
    # tempList.sort(key=lambda e: e[1], reverse=True)
    # scores = tk.Tk()
    # cols = ('ID', 'File name','Compare With' ,'Description', 'MatchingPercentage', 'Coupling')
    # listBox = ttk.Treeview(scores, columns=cols, show='headings')
    # label = ttk.Label(root, text='none')
    # for i, (name, com, desc, perc, iscoupled) in enumerate(tempList, start=1):
    #   listBox.insert("", "end", values=(i, name, com, desc, perc, iscoupled))
    #
    #
    # label = tk.Label(scores,text="Matching Scenerios", font=("TimesNewRoman",10)).grid(row=0, columnspan=3)
    #
    #
    # # create Treeview with 3 columns
    #
    # # set column headings
    # for col in cols:
    #     listBox.heading(col, text=col)
    # listBox.grid(row=1, column=0, columnspan=3)
    # values = [[["f0.name","f1.name","f2.name","f3.name", '<b>TOTAL<br>EXPENSES</b>']],
    #           [[
    #               "content1", "content2","content3","content4"]]]

#     trace0= plot([go.Table(
#     header=dict(values=["Log_files", 'Description'],
#                 line=dict(color='#506784'),
#                 fill=dict(color='#119DFF'),
#                 align=['left', 'center'],
#                 font=dict(color='white', size=12),
#                 height=40),
#     cells=dict(values=[[f0.name+":"+'<br>'+CoupRecord[0]+'<br>',f1.name+":"+'<br>'+CoupRecord[1],f2.name+":"+'<br>'+CoupRecord[2] ,f3.name+":"+'<br>'+CoupRecord[3]],
#                        [content1,content2,content3,content4,content5]],
#                line=dict(color='#506784'),
#                fill=dict(color=['#25FEFD', 'white']),
#                align=['left', 'center'],
#                font=dict(color='#506784', size=12),
#                height=30
#
#                ))])
#     #
#     # py.iplot(data, filename="Row and Column Size"))])
# def clip():
#     scores=Tk()
#     scores.title("Scenerios")
#     Label(scores, text="best matched scenerio is graphed").pack()
#     scores.mainloop()
#     # showScores = tk.Button(scores, text="Show scores", width=15, command=table).grid(row=4, column=0)
#     # closeButton = tk.Button(scores, text="Close", width=15, command=exit).grid(row=4, column=1)
#
#     # scores.mainloop()
# # except Exception as e:
# #     pass
#
# try:
#     root = Tk()
#     root.geometry('300x200')
#     root.title('Call Graph Generator')
#
#
#     button = Button(root, text = 'Plot', command = buttonevent )
#     label = Label(root, text = '')
#
#     button.pack()
#     label.pack()
#
#     button.place(x = 100, y = 20, height = 50, width = 100, in_=root)
#     label.place(x = 30, y = 100, in_ = root)
#
#
#     root.mainloop()
# except Exception as e:
#     pass
### console running part

# plot
#color()

# flush log file
#open('C:/injection.log', 'w').close()


## GUI part

