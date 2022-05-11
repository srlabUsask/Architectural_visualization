import csv
import math
import multiprocessing
import queue
import re
from collections import defaultdict
from timeit import default_timer as timer

import matplotlib.pyplot as plt
import networkx as nx
import pandas as pd
import pydot
from AnalyzeAST import *
from scipy.cluster.hierarchy import dendrogram, fcluster, linkage, to_tree
from scipy.spatial import distance as ssd
from scipy.spatial.distance import pdist
from sklearn.cluster import AgglomerativeClustering

import config
import util
from ClusteringExecutionPaths import ClusteringExecutionPath
from DocumentNodes import DocumentNodes

ROOT = config.ROOT
SUBJECT_SYSTEM_NAME = config.SUBJECT_SYSTEM_NAME
OUTPUT_DIRECTORY = ROOT + '/output/'
DATASET = ROOT + '/dataset/' + SUBJECT_SYSTEM_NAME + '.txt'
# put location of repository for getting comments
SUBJECT_SYSTEM_FOR_COMMENT = config.SUBJECT_SYSTEM_FOR_COMMENT

document_nodes = DocumentNodes(OUTPUT_DIRECTORY, SUBJECT_SYSTEM_NAME)


class ClusteringCallGraph:
    """ This class takes caller-callee relationships of a python project. Next, builds a call graph from the input.
        Extracts execution paths from the call graph. Then clusters the execution paths according to their similarity.
        Finally, clusters are renamed using the execution paths under them using different topic modelling techniques.

     """
    entry_point = []
    exit_point = []
    tree = []
    text_data = []
    subject_system = ''
    special_functions = ['lambda', 'genexpr',
                         'listcomp', 'setcomp', 'dictcomp']
    execution_paths = []
    graph = nx.DiGraph()
    function_id_to_name = {}
    function_id_to_file_name = {}

    analyzeAST = AnalyzeAST()

    # Todo: function_name_to_docstring isn't used properly as config file hasn't been changed
    function_name_to_docstring = analyzeAST.get_all_method_docstring_pair_of_a_project(
        SUBJECT_SYSTEM_FOR_COMMENT)

    def __del__(self):
        """ deletes the ClusteringCallGraph class objects """
        print('deleted')

    def log_analysis(self):
        """ analyzing programs to build cluster tree of execution paths. """

        # self.tgf_to_networkX() -- was used for the tgf files rather than log files
        # print(os.path.abspath(__file__))
        self.graph = self.buildgraph(
            open(ROOT[:-4] + "/instance/callLogs/" + SUBJECT_SYSTEM_NAME + ".log"),
            1)  # We go one directory up to find the instance directory

        self.graph.remove_edges_from(nx.selfloop_edges(self.graph))
        # Visual of the call graph
        # nx.draw(self.graph, nx.spring_layout(self.graph), with_labels=True, node_size=0)
        # plt.show()

        self.extracting_source_and_exit_node()

        # See what are the entry nodes
        # for i in self.entry_point:
        #     print(self.function_id_to_name[i] + "-" + i)

        start = timer()
        self.extracting_execution_paths()
        end = timer()
        print('Time required for extracting_execution_paths: ', end - start)
        print('No. of execution paths', len(self.execution_paths))

        if len(self.execution_paths) > 5000:
            self.execution_paths = util.random_sample_execution_paths(
                self.execution_paths)

        # self.remove_redundant_ep()

        start = timer()
        mat = self.distance_matrix(self.execution_paths)
        end = timer()
        print('Time required for distance_matrix: ', end - start)

        self.graph.clear()

        # ToDo (also note usage of function_name_to_docstring which hasn't been changed in config.py)
        document_nodes.initalize_graph_related_data_structures(
            self.execution_paths, self.function_id_to_name,
            self.function_id_to_file_name, self.id_to_sentence,
            self.function_name_to_docstring)

        start = timer()
        ret = self.flat_cluster_and_label_nodes(mat)
        end = timer()
        print('Time required for cluster operations: ', end - start)
        return ret
        # return self.clustering_using_scipy(mat)

    def buildgraph(self, f, view):
        self.subject_system = SUBJECT_SYSTEM_NAME + '.log'
        g = nx.DiGraph()
        func_tracker = {}
        stack = []
        index = 0
        for line in f:
            # get func and file names without unnecessary texts
            if not "(" in line:
                continue
            if not "::" in line:
                continue
            funname = ''
            if ':' in line:
                funname = line.strip()[
                          line.find(':') + 2:line.find('(') - 0]  # ::OnHint
                # print funname
            else:
                funname = line.strip()[
                          1:line.find('(') - 0]  # void__fastcallTMain::OnHint
                # print funname

            filename = line.strip()[
                       line.find('@@@') + 3: -1]  # CRHMmain.cpp_nocom
            # --adding the root node--

            # Note usage of nearly all the line info was to make functions with
            # the same name be identified as unique functions
            if line[1:-2] not in func_tracker:
                self.function_id_to_name[str(index)] = funname
                self.function_id_to_file_name[str(index)] = filename
                func_tracker[line[1:-2]] = str(index)
                index += 1

            # root opening
            if '<root>' in line:
                stack.append('root')
                g.add_nodes_from(['root'])

            # root closing
            elif '</root>' in line:
                stack.pop()

            # opening other than root
            elif '</' not in line:
                if view == 1:
                    # stack.append(funname[2:len(funname)])
                    stack.append(func_tracker[line[1:-2]])
                else:
                    stack.append(func_tracker[line[1:-2]])

                parent = stack[len(stack) - 2]
                child = stack[len(stack) - 1]

                # print stack[len(stack)-2]
                # print len(stack)-2
                # print stack[-1]

                g.add_edges_from([(parent, child)])

            else:
                try:
                    stack.pop()
                except Exception as e:
                    pass

        # end of loop

        # print stack
        print('unique scenario extracted for', f.name)

        return g

    def tgf_to_networkX(self):
        """ converting tgf file to a networkX graph"""
        self.subject_system = SUBJECT_SYSTEM_NAME + '.txt'

        f = open(DATASET, "r")
        # G = nx.DiGraph()
        graph_started = False
        for line in f:

            if line.find('#') != -1:
                graph_started = True
                continue

            if graph_started == True:
                edge_info = line.split()

                if edge_info[0] in self.function_id_to_name and edge_info[
                    1] in self.function_id_to_name:
                    self.graph.add_edge(edge_info[0], edge_info[1])

            if graph_started == False and '.py' in line:
                ln = line.split(' ')
                self.function_id_to_name[ln[0]
                ] = self.extract_function_name(ln[1])
                self.function_id_to_file_name[ln[0]] = line.split(
                    '/')[-1].split(':')[0]

    def flat_cluster_and_label_nodes(self, mat):
        cep = ClusteringExecutionPath()
        tree = cep.label_flat_clusters(document_nodes, mat)
        json_data = {'cluster': tree,
                     'function_id_to_name': self.function_id_to_name,
                     'function_id_to_file_name': self.function_id_to_file_name,
                     'execution_paths': self.execution_paths}

        print(json_data, file=open(OUTPUT_DIRECTORY +
                                   'TREE_DICT_' + self.subject_system, 'w'))

        return tree

    def remove_redundant_ep(self):
        ''' this function removes redundant execution paths from list of execution paths.
            for example, execution_paths = [['A', 'B', 'C', 'D'], ['B', 'C', 'D'], ['E', 'F', 'G'], ['I', 'F', 'S'], ['A', 'B'], ['A','B', 'C']]
            this list as input will produce a list [['A', 'B', 'C', 'D'], ['B', 'C', 'D'], ['E', 'F', 'G'], ['I', 'F', 'S']]

         '''

        self.execution_paths.sort(key=len, reverse=True)

        redundant_ep = []
        for e in self.execution_paths:
            if e in redundant_ep:
                continue
            for f in self.execution_paths:
                if e != f:

                    if self.check_ep_overlap_from_start(e, f):
                        redundant_ep.append(f)
        for r in redundant_ep:
            self.execution_paths.remove(r)

    def check_ep_overlap_from_start(self, e, f):
        '''This function checks whether 2nd list is a sublist starting from start of 1st list'''

        for i in range(len(f)):
            if e[i] != f[i]:
                return False

        return True

    def extracting_source_and_exit_node(self):
        """ Finding source and exit nodes from networkX graph """
        print('In degree')
        for s, v in self.graph.in_degree():

            if v == 0:
                self.entry_point.append(s)

        print(len(self.entry_point))
        print('Out degree')
        for t, v in self.graph.out_degree():

            if v == 0:
                self.exit_point.append(t)

        print(len(self.exit_point))

    def extracting_execution_paths(self):
        """ Extracting execution paths from networkX call graph """
        print('Extracting execution paths')
        for s in self.entry_point:
            unpack_path = list(
                nx.all_simple_paths(self.graph, s, self.exit_point))
            for p in unpack_path:
                self.execution_paths.append(p)

        print("Number of EP: ", len(self.execution_paths))

    def distance_matrix(self, paths):
        """ creating distance matrix using jaccard similarity value """
        print('distance_matrix')
        length = len(paths)
        Matrix = [[0 for x in range(length)] for y in range(length)]
        for i in range(len(paths)):
            for j in range(len(paths)):
                # Matrix[i][j] = util.jaccard_similarity(paths[i], paths[j])
                Matrix[i][j] = util.compare_execution_paths(paths[i], paths[j])

        return Matrix

    def clustering_using_scipy(self, mt):
        """ clustering execution paths using scipy """

        start = timer()
        Z = linkage(ssd.squareform(mt), 'ward')
        fig = plt.figure(figsize=(25, 10))
        dn = dendrogram(Z, truncate_mode='lastp', p=200)
        rootnode, nodelist = to_tree(Z, rd=True)
        nodes_with_parent = self.bfs_with_parent(
            nodelist, rootnode.id, math.ceil(math.log(len(nodelist) + 1, 2)))
        nodes_with_leaf_nodes = util.find_leaf_nodes_for_nodes(
            rootnode, nodelist)
        end = timer()
        print('Time required for clustering: ', end - start)

        count = 0

        start = timer()
        for child, parent in nodes_with_parent.items():
            if nodelist[child].count == 1:
                self.tree.append({'key': child, 'parent': parent,
                                  'tfidf_word': 'EP: ' + str(child)
                                                + ', Name: ' +
                                                self.pretty_print_leaf_node(
                                                    self.execution_paths[
                                                        child]),
                                  'tfidf_method': '', 'lda_word': '',
                                  'lda_method': '', 'lsi_word': '',
                                  'lsi_method': '', 'spm_method': '',
                                  'text_summary': 'hello summary', 'files': [],
                                  'files_count': 0,
                                  'execution_path_count': 0,
                                  'function_id_to_name_file': []})
                continue
            execution_paths_of_a_cluster = nodes_with_leaf_nodes[child]

            count += 1
            print('Cluster no: ', count)

            self.tree.append(document_nodes.labeling_cluster(
                execution_paths_of_a_cluster, child, parent))

        end = timer()
        print('Time required for labeling using 6 techniques', end - start)

        print(self.tree, file=open(OUTPUT_DIRECTORY +
                                   'TREE_DICT_' + self.subject_system, 'w'))

        return self.tree

    def extract_function_name(self, str):
        """ extracting function names from TGF file """
        end = str.find('\\')

        return str[:end]

    def similarity(self, list1, list2):
        print('list1 :', list1)
        print('list2 :', list2)
        print('braycurtis ', ssd.braycurtis(list1, list2))
        return ssd.braycurtis(list1, list2)

    def bfs_with_parent(self, nodelist, id, depth):
        """
        BFS to get parent nodes from cluster tree with their child nodes. Key of the returned dict is parent node and values are their child nodes.
        """
        # node = nodelist[id]
        nodes = []
        count = 0
        visited = [0] * len(nodelist)
        q = queue.Queue()
        q.put(id)
        tree = dict()
        tree[id] = -1
        visited[id] = 1
        while True:
            if q.empty():
                break
            q.qsize()
            p = q.get()
            q.qsize()
            count = count + 1

            if nodelist[p].count == 1:
                nodes.append(p)
                visited[p] = 1
                continue

            if visited[nodelist[p].left.id] == 0:
                tree[nodelist[p].left.id] = nodelist[p].id
                q.put(nodelist[p].left.id)
            if visited[nodelist[p].right.id] == 0:
                tree[nodelist[p].right.id] = nodelist[p].id
                q.put(nodelist[p].right.id)

            nodes.append(p)

            visited[p] = 1

        return tree

    def id_to_sentence(self, execution_paths):
        """
        This function takes a single execution path and maps its function id with names. Returns printable sentence of a execution path.
        """
        str = ''

        for l in execution_paths:
            str += self.function_id_to_name[l]
            str += ' '

        return str

    def pretty_print_leaf_node(self, execution_paths):
        """
        This function takes a single execution path and maps its function id with names. Returns printable sentence of a execution path.
        """
        str = ''

        for l in execution_paths:
            str += self.function_id_to_name[l]
            if l != execution_paths[len(execution_paths) - 1]:
                str += ' &rarr; '

        return str


c = ClusteringCallGraph()

c.log_analysis()

# ToDo -
document_nodes.workbook.close()
