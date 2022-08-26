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
EXECUTION_PATTERNS = config.EXECUTION_PATTERNS
DOC2VEC = config.DOC2VEC
document_nodes = DocumentNodes(OUTPUT_DIRECTORY, SUBJECT_SYSTEM_NAME, EXECUTION_PATTERNS)


class ClusteringCallGraph:
    """ This class takes caller-callee relationships of a python project. Next, builds a call graph from the input.
        Extracts execution paths from the call graph. Then clusters the execution paths according to their similarity.
        Finally, clusters are renamed using the execution paths under them using different topic modelling techniques.

     """
    nltk.download('stopwords')
    en_stop = set(nltk.corpus.stopwords.words('english'))
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
    function_id_to_name_file = {}
    w2v_model = None
    d2v_model = None

    def __del__(self):
        """ deletes the ClusteringCallGraph class objects """
        print('deleted')

    def log_analysis(self):
        """ analyzing programs to build cluster tree of execution paths. """

        total_start_time = timer()
        # self.tgf_to_networkX() #-- was used for the tgf files rather than log files
        # print(os.path.abspath(__file__))
        # We go one directory up to find the instance directory
        # self.graph = self.buildgraph(open(ROOT[:-4] + "/instance/callLogs/" + SUBJECT_SYSTEM_NAME + ".log"))
        # self.graph.remove_edges_from(nx.selfloop_edges(self.graph))
        # # Visual of the call graph
        # nx.draw(self.graph, nx.spring_layout(self.graph), with_labels=True, node_size=0)
        # plt.show()
        # self.extracting_source_and_exit_node()
        start = timer()
        self.pythonbuildgraph(open(ROOT[:-4] + "/instance/callLogs/" + SUBJECT_SYSTEM_NAME + ".log"))

        # See what are the entry nodes
        # for i in self.entry_point:
        #     print(self.function_id_to_name[i] + "-" + i)
        # self.extracting_execution_paths()
        end = timer()
        print('Time required for extracting_execution_paths: ', end - start)
        print('No. of execution paths', len(self.execution_paths))

        if len(self.execution_paths) > 5000:
            print("Over 5000 Execution Paths")
            self.execution_paths = util.random_sample_execution_paths(
                self.execution_paths)

        # Uses execution paths to create "sentences" that are then used to build the vocabulary and train the doc2vec
        # model.
        test = []
        if DOC2VEC:
            # Each execution path gets turned into a "sentence" which are a sequence of words that are generated by
            # taking each consecutive methods in an execution path and then first trying to see if that method has a
            # docstring. If it does then put that docstring into the sentence, otherwise put the method name instead.
            # Then you do the same with the next method in the execution path with its words being added to the end of
            # the existing sentence though the word "calls" is first added to divide two methods in the sentence.
            # All docstrings get preprocessed before added with the docstrings first getting all their punctuations and
            # then each word in the docstring gets turned into lowercase, checked if it's a stop word, and then
            # lemmatised.
            sentences = []
            d2v_sentences = []
            index = 0
            for path in self.execution_paths:
                sentence = []
                test2 = []
                for func in path:
                    no_punctuation = re.sub(r'[^\w\s]', '', self.function_to_docstring[func])  # removes punctuation
                    if no_punctuation == "":
                        sentence.append(self.function_id_to_name[func])
                        test2.append(self.function_id_to_name[func])
                    else:
                        sentence.extend([util.get_lemma(word.lower()) for word in no_punctuation.split(" ") if
                                         word.lower() != "" and word.lower() not in self.en_stop])
                        test2.extend([util.get_lemma(word.lower()) for word in no_punctuation.split(" ") if
                                      word.lower() != "" and word.lower() not in self.en_stop])
                    sentence.append("calls")  # The word "calls" acts as a division between two methods in the sentence
                sentence.pop()  # Removes the additional "calls" at the end
                sentences.append(sentence)
                # Creates a TaggedDocument object as these objects are needed to build a doc2vec model
                d2v_sentences.append(TaggedDocument(words=sentence, tags=[index]))
                test.append(test2)
                index += 1

            # Initialise model
            cores = multiprocessing.cpu_count()
            self.d2v_model = Doc2Vec(min_count=1,
                                     window=5,
                                     vector_size=50,
                                     sample=6e-5,
                                     alpha=0.03,
                                     min_alpha=0.0007,
                                     negative=20,
                                     workers=cores - 1)

            # Build vocab of the model
            t = timer()
            self.d2v_model.build_vocab(d2v_sentences, progress_per=50)
            print('Time to build vocab: {} secs'.format(timer() - t))

            # Train the model
            t = timer()
            self.d2v_model.train(d2v_sentences, total_examples=self.d2v_model.corpus_count, epochs=10000,
                                 report_delay=1)  # Usually 10000
            print('Time to train the model: {} secs'.format(timer() - t))

            self.d2v_model.init_sims(replace=True)  # Supposedly makes the model more memory efficient

        # Building a distance matrix between execution paths. distance_matrix_doc2vec() uses the doc2vec model while
        # distance_matrix_jaccard() uses Jaccard similarity coefficients. distance_matrix() currently doesn't work properly,
        # but it's supposed to be pairing up consecutive functions and then using that to get Jaccard similarity
        # coefficients.
        start = timer()
        # mat = self.distance_matrix(self.execution_paths)
        if DOC2VEC:
            mat = self.distance_matrix_doc2vec()
        else:
            mat = self.distance_matrix_jaccard(self.execution_paths)

        # Used to visualise the current mat matrix and Jaccard based matrix. Mainly to compare the doc2vec and Jaccard
        # matrix.
        mat_j = self.distance_matrix_jaccard(self.execution_paths)
        mat_j2 = self.distance_matrix_jaccard2(test)
        plt.matshow(mat)
        plt.colorbar()
        plt.show()
        plt.matshow(mat_j)
        plt.colorbar()
        plt.show()
        plt.matshow(mat_j2)
        plt.colorbar()
        plt.show()
        diff_mat = subtract(mat, mat_j)
        diff_mat = absolute(diff_mat)
        plt.matshow(diff_mat)
        plt.colorbar()
        plt.show()
        diff_mat2 = subtract(mat, mat_j2)
        diff_mat2 = absolute(diff_mat2)
        plt.matshow(diff_mat2)
        plt.colorbar()
        plt.show()
        end = timer()
        print('Time required for distance_matrix: ', end - start)

        # Number used to see how similar the mat matrix and Jaccard are to each other.
        print("Difference Value: ", mean(diff_mat))
        print("Difference Value 2: ", mean(diff_mat2))

        self.graph.clear()

        # Initialises the documents and data structures that will be used to save the cluster tree
        document_nodes.initialize_graph_related_data_structures(self.execution_paths, self.function_id_to_name,
                                                                self.function_id_to_file_name, self.id_to_sentence,
                                                                self.function_to_docstring)

        # Creates a cluster tree and then labels each node in the tree
        start = timer()
        ret = self.flat_cluster_and_label_nodes(mat)
        end = timer()
        print('Time required for cluster operations: ', end - start)

        total_end_time = timer()
        print('Total time required: ', total_end_time - total_start_time)
        return ret  # Doesn't do anything important

    def buildgraph(self, f):
        """
        Sets up all the data structures based on dynamic call logs from the CRHM project to use to create the
        cluster tree
        """
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
            if '</' not in line and line[1:-2] not in func_tracker:
                self.function_id_to_name[str(index)] = funname
                self.function_id_to_file_name[str(index)] = filename
                self.function_id_to_name_file[str(index)] = funname + '(' + filename + ')'
                func_tracker[line[1:-2]] = str(index)
                self.function_to_docstring[str(index)] = ''
                index += 1

            # root opening
            if '<root>' in line:
                stack.append('root')

            # root closing
            elif '</root>' in line:
                stack.pop()

            # opening other than root
            elif '</' not in line:
                stack.append(func_tracker[line[1:-2]])
                prev_character = "c"
            else:
                if prev_character == "c" and list(stack) not in execution_path_tracker:
                    execution_path_tracker.append(list(stack))
                    execution_path = list(stack)
                    execution_path = ",".join(execution_path) + ","
                    previous = ""
                    while execution_path != previous:
                        previous = execution_path
                        execution_path = re.sub(r'(.+?,)\1+', r'\1', execution_path)  # the ? seems redundant

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
        """
        Sets up all the data structures based on dynamic call logs created from python_logger.py to use to create the
        cluster tree
        """
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
                self.function_id_to_name_file[str(index)] = funname + '(' + filename + ')'
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
                        execution_path = re.sub(r'(.+?,)\1+', r'\1', execution_path)  # the ? seems redundant

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
        """
        Processes a docstring of a method such that all the sentences, starting from the first line, in a new line gets
        added in one long sentence until the next line is empty line. The basic idea is that the first chunk of the
        docstring gets extracted.
        """
        if doc is None:
            return ''
        complete_line = ''
        for line in doc.split('\n'):
            # The 'complete_line != ""' catches the case where the first few lines is empty and 'line == ""' catches
            # when we finally got the first chunk of sentences in the docstring.
            if line == "" and complete_line != "":
                if complete_line[-2] in string.punctuation:
                    return complete_line[:-1]
                else:
                    return complete_line[:-1] + "."

            line = line.strip()
            if (line == "" and complete_line == "") or (not any([c.isalnum() for c in line])):
                continue

            complete_line += line + " "
        return complete_line

    def tgf_to_networkX(self):
        """Converting tgf file to a networkX graph - used in static call logs created by pyan3"""
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
                self.function_id_to_name[ln[0]] = self.extract_function_name(ln[1])
                self.function_to_docstring[ln[0]] = ""
                self.function_id_to_file_name[ln[0]] = line.split('/')[-1].split(':')[0]
                self.function_id_to_name_file[ln[0]] = self.function_id_to_name[ln[0]] + '(' + \
                                                self.function_id_to_file_name[ln[0]] + ')'
                self.function_to_docstring[ln[0]] = ''  # Temporary

    def flat_cluster_and_label_nodes(self, mat):
        """
        Creates a cluster tree and then creates the document that is used in the HCPC tool
        """
        cep = ClusteringExecutionPath()
        tree = cep.label_flat_clusters(document_nodes, mat)
        json_data = {'cluster': tree,
                     'function_id_to_name': self.function_id_to_name,
                     'function_id_to_file_name': self.function_id_to_file_name,
                     'execution_paths': self.execution_paths,
                     'function_id_to_name_file': self.function_id_to_name_file}

        print(json_data, file=open(OUTPUT_DIRECTORY + 'TREE_DICT_' + self.subject_system, 'w'))

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
        """
        Creating distance matrix using Jaccard similarity value with elements of the set being consecutive pairs of
        functions. Note the current version of this method doesn't work mainly due to existence of single method paths.
        """
        length = len(paths)
        Matrix = [[0 for x in range(length)] for y in range(length)]

        for i in range(len(paths)):
            for j in range(len(paths)):
                Matrix[i][j] = util.compare_execution_paths(paths[i], paths[j])
        return Matrix

    def distance_matrix_jaccard(self, paths):
        """
        Creating distance matrix using Jaccard similarity value with elements of the set being method names in
        execution paths
        """
        length = len(paths)
        Matrix = [[0 for x in range(length)] for y in range(length)]

        for i in range(len(paths)):
            for j in range(len(paths)):
                Matrix[i][j] = util.jaccard_similarity(paths[i], paths[j])
        return Matrix

    def distance_matrix_jaccard2(self, paths):
        """
        Creating distance matrix using Jaccard similarity value with elements of the set being method names in
        execution paths
        """
        length = len(paths)
        Matrix = [[0 for x in range(length)] for y in range(length)]

        for i in range(len(paths)):
            for j in range(len(paths)):
                Matrix[i][j] = util.jaccard_similarity(paths[i], paths[j])
        return Matrix

    def distance_matrix_doc2vec(self):
        """
        Creating distance matrix by using doc2vec model vectors to get cosine similarity values
        """
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
