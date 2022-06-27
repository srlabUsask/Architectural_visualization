import csv
import math
import multiprocessing
import queue
import re
import string
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

from gensim.models import Word2Vec, Doc2Vec
import multiprocessing
from gensim.models.doc2vec import TaggedDocument
from numpy import dot
from numpy.linalg import norm
from numpy import subtract
from numpy import absolute
from numpy import mean
from numpy import any
import nltk

import config
import util
import ast
from ClusteringExecutionPaths import ClusteringExecutionPath
from DocumentNodes import DocumentNodes

ROOT = config.ROOT
SUBJECT_SYSTEM_NAME = config.SUBJECT_SYSTEM_NAME
OUTPUT_DIRECTORY = ROOT + '/output/'
DATASET = ROOT[:-4] + "/instance/callLogs/" + SUBJECT_SYSTEM_NAME + ".txt"
# put location of repository for getting comments
SUBJECT_SYSTEM_FOR_COMMENT = config.SUBJECT_SYSTEM_FOR_COMMENT

document_nodes = DocumentNodes(OUTPUT_DIRECTORY, SUBJECT_SYSTEM_NAME)


class ClusteringCallGraph:
    """ This class takes caller-callee relationships of a python project. Next, builds a call graph from the input.
        Extracts execution paths from the call graph. Then clusters the execution paths according to their similarity.
        Finally, clusters are renamed using the execution paths under them using different topic modelling techniques.

     """
    nltk.download('stopwords')
    en_stop = set(nltk.corpus.stopwords.words('english'))
    # print(en_stop)
    entry_point = []
    exit_point = []
    tree = []
    text_data = []
    subject_system = ''
    special_functions = ['lambda', 'genexpr',
                         'listcomp', 'setcomp', 'dictcomp']
    execution_paths = []
    execution_paths2 = []
    graph = nx.DiGraph()
    function_id_to_name = {}
    function_id_to_file_name = {}
    function_id_to_line_num = {}
    function_to_docstring = {}
    w2v_model = None
    d2v_model = None

    analyzeAST = AnalyzeAST()

    function_name_to_docstring = analyzeAST.get_all_method_docstring_pair_of_a_project(
        SUBJECT_SYSTEM_FOR_COMMENT)

    def __del__(self):
        """ deletes the ClusteringCallGraph class objects """
        print('deleted')

    def log_analysis(self):
        """ analyzing programs to build cluster tree of execution paths. """

        # self.tgf_to_networkX() #-- was used for the tgf files rather than log files
        # print(os.path.abspath(__file__))
        # We go one directory up to find the instance directory
        self.graph = self.buildgraph2(open(ROOT[:-4] + "/instance/callLogs/" + SUBJECT_SYSTEM_NAME + ".log"))  # pythonbuildgraph
        start = timer()
        self.buildgraph(open(ROOT[:-4] + "/instance/callLogs/" + SUBJECT_SYSTEM_NAME + ".log"))

        self.graph.remove_edges_from(nx.selfloop_edges(self.graph))
        # Visual of the call graph
        nx.draw(self.graph, nx.spring_layout(self.graph), with_labels=True, node_size=0)
        plt.show()

        self.extracting_source_and_exit_node()

        # See what are the entry nodes
        # for i in self.entry_point:
        #     print(self.function_id_to_name[i] + "-" + i)
        self.extracting_execution_paths()
        end = timer()
        print('Time required for extracting_execution_paths: ', end - start)
        print('No. of execution paths', len(self.execution_paths))

        print(len(self.execution_paths))
        print(len(self.execution_paths2))
        if len(self.execution_paths) > 5000:
            print("Over 5000 Execution Paths")
            self.execution_paths = util.random_sample_execution_paths(
                self.execution_paths)

        sentences = []
        d2v_sentences = []
        index = 0
        exe = open(SUBJECT_SYSTEM_NAME + ".txt", "w")
        for path in self.execution_paths:
            test = []
            sentence = []
            for func in path:
                test.append(self.function_id_to_name[func])
                no_punctuation = re.sub(r'[^\w\s]', '', self.function_to_docstring[func])
                if no_punctuation == "":
                    sentence.append(self.function_id_to_name[func])
                else:
                    sentence.extend([word.lower() for word in no_punctuation.split(" ") if
                                     word.lower() != "" and word.lower() not in self.en_stop])  # sentence.append(self.function_id_to_name[func])
                sentence.append("calls")
            sentence.pop()
            exe.write(str(test) + "\n")
            sentences.append(sentence)
            d2v_sentences.append(TaggedDocument(words=sentence, tags=[index]))
            index += 1

        cores = multiprocessing.cpu_count()
        self.d2v_model = Doc2Vec(min_count=1,
                                 window=5,
                                 vector_size=50,
                                 sample=6e-5,
                                 alpha=0.03,
                                 min_alpha=0.0007,
                                 negative=20,
                                 workers=cores - 1)
        t = timer()

        self.d2v_model.build_vocab(d2v_sentences, progress_per=50)

        print('Time to build vocab: {} mins'.format(timer() - t))

        t = timer()

        self.d2v_model.train(d2v_sentences, total_examples=self.d2v_model.corpus_count, epochs=100,
                             report_delay=1)  # Usually 10000

        print('Time to train the model: {} mins'.format(timer() - t))

        # self.w2v_model.init_sims(replace=True)
        self.d2v_model.init_sims(replace=True)

        # print(self.w2v_model.wv.most_similar(positive=["init"]))
        index = 0
        # print(d2v_sentences[index].words)
        print(self.d2v_model.docvecs.most_similar([self.d2v_model[index]]))
        # print(d2v_sentences[self.d2v_model.docvecs.most_similar([self.d2v_model[index]])[1][0]].words)
        # a = self.d2v_model[index]
        # b = self.d2v_model[self.d2v_model.docvecs.most_similar([self.d2v_model[index]])[2][0]]
        # print(dot(a, b)/(norm(a)*norm(b)))
        print(self.d2v_model.docvecs.most_similar([self.d2v_model[index]])[1][1])
        print(self.d2v_model.docvecs.similarity(index,
                                                self.d2v_model.docvecs.most_similar([self.d2v_model[index]])[1][0]))
        # print(cosine_similarity(self.d2v_model.infer_vector(sentences[index]), self.d2v_model.infer_vector(d2v_sentences[self.d2v_model.docvecs.most_similar([self.d2v_model.infer_vector(sentences[index])])[0][0]].words)))

        # self.remove_redundant_ep()

        # print(self.execution_paths)
        start = timer()
        # mat = self.distance_matrix(self.execution_paths)
        mat = self.distance_matrix3(self.execution_paths)  # Change it to distance_matrix2() for doc2vec
        # print(mat)
        # mat_c = self.distance_matrix(self.execution_paths)  # Note problem with making pairs with new execution paths
        # due to 1 func execution paths
        mat_j = self.distance_matrix3(self.execution_paths)
        plt.matshow(mat)
        plt.colorbar()
        plt.show()
        diff_mat = subtract(mat, mat_j)
        diff_mat = absolute(diff_mat)
        if any(diff_mat < 0):
            exit(1)
        plt.matshow(diff_mat)
        plt.colorbar()
        plt.show()
        # plt.matshow(mat_c)
        # plt.colorbar()
        # plt.show()
        # plt.matshow(mat_j)
        # plt.colorbar()
        # plt.show()
        end = timer()
        print('Time required for distance_matrix: ', end - start)

        print("Difference Value: ", mean(diff_mat))

        self.graph.clear()
        document_nodes.initalize_graph_related_data_structures(
            self.execution_paths, self.function_id_to_name,
            self.function_id_to_file_name, self.id_to_sentence,
            self.function_name_to_docstring,
            self.function_to_docstring)  # Todo wipe out self.function_name_to_docstring

        start = timer()
        ret = self.flat_cluster_and_label_nodes(mat)
        end = timer()
        print('Time required for cluster operations: ', end - start)
        return ret
        # return self.clustering_using_scipy(mat)

    def buildgraph2(self, f):
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
                self.function_to_docstring[str(index)] = ''
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

    def pythonbuildgraph2(self, f):
        self.subject_system = SUBJECT_SYSTEM_NAME + '.log'
        g = nx.DiGraph()
        func_tracker = {}
        stack = []
        index = 0
        for line in f:
            funname = line[:line.find('@@@')]

            filename = line[line.find('@@@') + 3: line.find('::')].split("\\")[-1]
            # print(funname, filename, line[:-2])
            if line[:-2] not in func_tracker:
                self.function_id_to_name[str(index)] = funname
                self.function_id_to_file_name[str(index)] = filename
                self.function_id_to_line_num[str(index)] = line[line.find('::') + 2:-2]

                file = open(line[line.find('@@@') + 3: line.find('::')], encoding='utf-8')
                tree = ast.parse(file.read(), filename=line[line.find('@@@') + 3: line.find('::')], mode='exec')
                file.seek(0)
                lines = file.readlines()

                for node in ast.walk(tree):
                    if isinstance(node, ast.ClassDef):
                        for cn in ast.iter_child_nodes(node):
                            if isinstance(cn, ast.FunctionDef) and funname == cn.name:
                                i = 0
                                while "def " not in lines[int(self.function_id_to_line_num[str(index)]) + i - 1]:
                                    i += 1
                                if int(self.function_id_to_line_num[str(index)]) + i == cn.lineno:
                                    self.function_to_docstring[str(index)] = self.process_docstring(
                                        ast.get_docstring(cn))
                                    break

                    if isinstance(node, ast.FunctionDef) and funname == node.name:
                        i = 0
                        while "def " not in lines[int(self.function_id_to_line_num[str(index)]) + i - 1]:
                            i += 1

                        if int(self.function_id_to_line_num[str(index)]) + i == node.lineno:
                            self.function_to_docstring[str(index)] = self.process_docstring(
                                ast.get_docstring(node))
                            break
                if str(index) not in self.function_to_docstring:
                    self.function_to_docstring[str(index)] = ""  # was None before (tend to be classes)
                func_tracker[line[:-2]] = str(index)
                index += 1

            # opening other than root
            if line[-2] == "c":
                stack.append(func_tracker[line[:-2]])

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
        print('unique scenario extracted for', f.name)
        f.close()

        # print(set(self.function_id_to_name.keys()).difference(set(self.function_to_docstring)))
        # for i in set(self.function_id_to_name.keys()).difference(set(self.function_to_docstring)):
        #     print(self.function_id_to_name[i], self.function_id_to_file_name[i], self.function_id_to_line_num[i])

        return g

    def buildgraph(self, f):
        self.subject_system = SUBJECT_SYSTEM_NAME + '.log'
        func_tracker = {}
        execution_path_tracker = []
        stack = []
        prev_character = None
        index = 0
        f.seek(0)
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
                self.function_to_docstring[str(index)] = ''
                index += 1

            # root opening
            if '<root>' in line:
                print("????????")
                stack.append('root')

            # root closing
            elif '</root>' in line:
                print("????????")
                stack.pop()

            # opening other than root
            elif '</' not in line:
                stack.append(func_tracker[line[1:-2]])
                prev_character = "c"
            else:
                if prev_character == "c" and list(stack) not in execution_path_tracker:  #Todo check if removing the execution_path_tracker speeds up or slows down
                    execution_path_tracker.append(list(stack))
                    execution_path = list(stack)
                    execution_path = ",".join(execution_path) + ","
                    previous = ""
                    while execution_path != previous:
                        previous = execution_path
                        execution_path = re.sub(r'(.+?,)\1+', r'\1', execution_path) # the ? seems redundant

                    execution_path = execution_path[:-1]
                    execution_path = execution_path.split(",")

                    if execution_path not in self.execution_paths:
                        self.execution_paths.append(execution_path)
                prev_character = "r"
                try:
                    stack.pop()
                except Exception as e:
                    pass

        # end of loop

        # print stack
        print('unique scenario extracted for', f.name)

    def pythonbuildgraph(self, f):
        self.subject_system = SUBJECT_SYSTEM_NAME + '.log'
        func_tracker = {}
        stack = []
        execution_path_tracker = []
        prev_character = None
        index = 0
        f.seek(0)
        for line in f:
            funname = line[:line.find('@@@')]

            filename = line[line.find('@@@') + 3: line.find('::')].split("\\")[-1]

            if line[:-2] not in func_tracker:
                self.function_id_to_name[str(index)] = funname
                self.function_id_to_file_name[str(index)] = filename
                self.function_id_to_line_num[str(index)] = line[line.find('::') + 2:-2]

                file = open(line[line.find('@@@') + 3: line.find('::')], encoding='utf-8')
                tree = ast.parse(file.read(), filename=line[line.find('@@@') + 3: line.find('::')], mode='exec')
                file.seek(0)
                lines = file.readlines()

                for node in ast.walk(tree):
                    if isinstance(node, ast.ClassDef):
                        for cn in ast.iter_child_nodes(node):
                            if isinstance(cn, ast.FunctionDef) and funname == cn.name:
                                i = 0
                                while "def " not in lines[int(self.function_id_to_line_num[str(index)]) + i - 1]:
                                    i += 1
                                if int(self.function_id_to_line_num[str(index)]) + i == cn.lineno:
                                    self.function_to_docstring[str(index)] = self.process_docstring(
                                        ast.get_docstring(cn))
                                    break

                    if isinstance(node, ast.FunctionDef) and funname == node.name:
                        i = 0
                        while "def " not in lines[int(self.function_id_to_line_num[str(index)]) + i - 1]:
                            i += 1

                        if int(self.function_id_to_line_num[str(index)]) + i == node.lineno:
                            self.function_to_docstring[str(index)] = self.process_docstring(
                                ast.get_docstring(node))
                            break
                if str(index) not in self.function_to_docstring:
                    self.function_to_docstring[str(index)] = ""  # was None before (tend to be classes)
                func_tracker[line[:-2]] = str(index)
                index += 1

            # opening other than root
            if line[-2] == "c":
                stack.append(func_tracker[line[:-2]])
                prev_character = "c"
            else:
                if prev_character == "c" and list(stack) not in execution_path_tracker:
                    execution_path_tracker.append(list(stack))
                    execution_path = list(stack)
                    execution_path = ",".join(execution_path) + ","
                    previous = ""
                    while execution_path != previous:
                        previous = execution_path
                        execution_path = re.sub(r'(.+?,)\1+', r'\1', execution_path) # the ? seems redundant

                    execution_path = execution_path[:-1]
                    execution_path = execution_path.split(",")

                    if execution_path not in self.execution_paths:
                        self.execution_paths.append(execution_path)
                prev_character = "r"
                try:
                    stack.pop()
                except Exception as e:
                    pass

    def process_docstring(self, doc):
        if doc is None:
            return ''
        complete_line = ''
        for line in doc.split('\n'):
            if line == "" and complete_line != "":
                if complete_line[-2] in string.punctuation:
                    # print(complete_line)
                    return complete_line[:-1]
                else:
                    # print(complete_line[:-1] + ".")
                    return complete_line[:-1] + "."

            line = line.strip()
            if (line == "" and complete_line == "") or (not any([c.isalnum() for c in line])):
                continue

            complete_line += line + " "
        return complete_line

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
                self.function_to_docstring[ln[0]] = ""
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
                self.execution_paths2.append(p)

        print("Number of EP: ", len(self.execution_paths2))

    def distance_matrix(self, paths):
        """ creating distance matrix using jaccard similarity value """
        print('distance_matrix')
        length = len(paths)
        Matrix = [[0 for x in range(length)] for y in range(length)]
        similar = 0
        dissimilar = 0

        for i in range(len(paths)):
            for j in range(len(paths)):
                Matrix[i][j] = util.compare_execution_paths(paths[i], paths[j])
        return Matrix

    def distance_matrix3(self, paths):
        """ creating distance matrix using jaccard similarity value """
        print('distance_matrix')
        length = len(paths)
        Matrix = [[0 for x in range(length)] for y in range(length)]
        similar = 0
        dissimilar = 0

        for i in range(len(paths)):
            for j in range(len(paths)):
                Matrix[i][j] = util.jaccard_similarity(paths[i], paths[j])
        return Matrix

    def distance_matrix2(self):
        print('distance_matrix')
        length = len(self.d2v_model.docvecs)
        Matrix = [[0 for x in range(length)] for y in range(length)]

        for i in range(length):
            for j in range(length):
                Matrix[i][j] = 1 - abs(self.d2v_model.docvecs.similarity(i, j))
                if Matrix[i][j] < 0.00001:
                    Matrix[i][j] = 0
                elif Matrix[i][j] > 1:
                    Matrix[i][j] = 1
        return Matrix

    # def clustering_using_scipy(self, mt):
    #     """ clustering execution paths using scipy """
    #
    #     start = timer()
    #     Z = linkage(ssd.squareform(mt), 'ward')
    #     fig = plt.figure(figsize=(25, 10))
    #     dn = dendrogram(Z, truncate_mode='lastp', p=200)
    #     rootnode, nodelist = to_tree(Z, rd=True)
    #     nodes_with_parent = self.bfs_with_parent(
    #         nodelist, rootnode.id, math.ceil(math.log(len(nodelist) + 1, 2)))
    #     nodes_with_leaf_nodes = util.find_leaf_nodes_for_nodes(
    #         rootnode, nodelist)
    #     end = timer()
    #     print('Time required for clustering: ', end - start)
    #
    #     count = 0
    #
    #     start = timer()
    #     for child, parent in nodes_with_parent.items():
    #         if nodelist[child].count == 1:
    #             self.tree.append({'key': child, 'parent': parent,
    #                               'tfidf_word': 'EP: ' + str(child)
    #                                             + ', Name: ' +
    #                                             self.pretty_print_leaf_node(
    #                                                 self.execution_paths[
    #                                                     child]),
    #                               'tfidf_method': '', 'lda_word': '',
    #                               'lda_method': '', 'lsi_word': '',
    #                               'lsi_method': '', 'spm_method': '',
    #                               'text_summary': 'hello summary', 'files': [],
    #                               'files_count': 0,
    #                               'execution_path_count': 0,
    #                               'function_id_to_name_file': []})
    #             continue
    #         execution_paths_of_a_cluster = nodes_with_leaf_nodes[child]
    #
    #         count += 1
    #         print('Cluster no: ', count)
    #
    #         self.tree.append(document_nodes.labeling_cluster(
    #             execution_paths_of_a_cluster, child, parent))
    #
    #     end = timer()
    #     print('Time required for labeling using 6 techniques', end - start)
    #
    #     print(self.tree, file=open(OUTPUT_DIRECTORY +
    #                                'TREE_DICT_' + self.subject_system, 'w'))
    #
    #     return self.tree

    def extract_function_name(self, str):
        """ extracting function names from TGF file """
        end = str.find('\\')

        return str[:end]

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

document_nodes.workbook.close()
