from xlsxwriter import worksheet
from collections import Counter
from prefixspan import PrefixSpan
import xlsxwriter
from spacy.lang.en import English
import nltk
from nltk.corpus import wordnet as wn
from nltk.stem.wordnet import WordNetLemmatizer
from gensim import corpora
import pickle
import gensim
from gensim.summarization.summarizer import summarize
from gensim.summarization.keywords import keywords
from gensim.summarization.textcleaner import clean_text_by_sentences as _clean_text_by_sentences
from gensim.summarization.textcleaner import get_sentences
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import math
import re
from timeit import default_timer as timer

import util


class DocumentNodes:
    """
    This class takes information on a call log and then takes in any node in a cluster tree to label it and put any
    relevant information for the HCPC tool into a document for use by the tool.
    """
    nltk.download('wordnet')
    parser = English()
    nltk.download('stopwords')
    en_stop = set(nltk.corpus.stopwords.words('english'))

    def __init__(self, output_directory, subject_system_name, execution_patterns):
        self.workbook = xlsxwriter.Workbook(
            output_directory + subject_system_name + '.xlsx')
        self.worksheet = self.workbook.add_worksheet()
        self.row = 0
        self.initalize_sheet()
        self.execution_paths = []
        self.function_id_to_name = {}
        self.function_id_to_file_name = {}
        self.function_to_docstring = {}
        self.id_to_sentence = {}
        self.execution_path_words = {}
        self.initalize_sheet()
        self.execution_patterns = execution_patterns

    def initialize_graph_related_data_structures(self, execution_paths, function_id_to_name, function_id_to_file_name,
                                                 id_to_sentence, function_to_docstring):
        """
        Sets the data structures that will be used to label the nodes and create the document used in HCPC tool
        """
        self.execution_paths = execution_paths
        self.function_id_to_name = function_id_to_name
        self.function_id_to_file_name = function_id_to_file_name
        self.id_to_sentence = id_to_sentence
        self.function_to_docstring = function_to_docstring
        self.execution_path_words = self.extract_words_in_execution_paths(execution_paths, function_to_docstring,
                                                                          function_id_to_name)
        return

    def extract_words_in_execution_paths(self, execution_paths, function_to_docstring, function_id_to_name):
        """
        Gets the set of words in an execution path. The words are obtained from each method in the execution path's
        docstring or if the docstring doesn't exist, the method's name.
        """
        ret = {}
        for path in execution_paths:
            ret[str(path)] = []
            for func in path:
                words = []
                no_punctuation = re.sub(r'[^\w\s]', '', function_to_docstring[func])
                if no_punctuation == "":
                    words.append(function_id_to_name[func])
                else:
                    words.extend([util.get_lemma(word.lower()) for word in no_punctuation.split(" ") if
                                  word.lower() != "" and word.lower() not in self.en_stop])
                ret[str(path)].extend(words)
            ret[str(path)] = set(ret[str(path)])
        return ret

    def initalize_sheet(self):
        """
        Initialises the Excel sheet (don't think this document does anything other than give a better way to see data
        of the cluster tree)
        """
        sheet_labels = ['Cluster Id', 'Execution_Paths', 'tfidf_word', 'tfidf_method', 'tfidf_word_and_docstring',
                        'tfidf_method_and_docstring', 'lda_word', 'lda_method', 'lsi_word', 'lsi_method', 'key_words',
                        'text_summary', 'SPM method']

        for column in range(len(sheet_labels)):
            self.worksheet.write(0, column, sheet_labels[column])

    def labeling_cluster(self, execution_paths_of_a_cluster, execution_paths_of_siblings, k, v, parent_label):
        """ Labelling a cluster using multiple variants """
        start = timer()
        # The reason the sequential pattern mining is optional is due to certain subject systems are complex enough that
        # mining sequential patterns take hours upon hours (potentially days as I gave up after 6 hours).
        if self.execution_patterns:
            spm_method = self.mining_sequential_patterns(execution_paths_of_a_cluster)
        else:
            spm_method = ""
        end = timer()
        print("Time mining seq patterns:", end - start)

        start = timer()
        tfidif_documents = self.make_documents_for_a_cluster_tfidf(execution_paths_of_a_cluster)
        tfidf_method = self.tf_idf_score_for_scipy_cluster(tfidif_documents, 'method')
        tfidf_word = self.tf_idf_score_for_scipy_cluster(tfidif_documents, 'word')
        end = timer()
        print("Time tfidf method and word:", end - start)

        start = timer()
        tfidf_method_and_docstring = self.tf_idf_score_for_scipy_cluster(tfidif_documents, 'docstring_and_method')
        tfidf_word_and_docstring = self.tf_idf_score_for_scipy_cluster(tfidif_documents, 'docstring_and_word')
        end = timer()
        print("Time tfidf docstring method and word:", end - start)

        start = timer()
        tm_documents = self.make_documents_for_a_cluster_tm(execution_paths_of_a_cluster)
        lda_method = self.topic_model_lda(tm_documents, 'method')
        lda_word = self.topic_model_lda(tm_documents, 'word')
        end = timer()
        print("Time lda method and word:", end - start)

        start = timer()
        lda_method_and_docstring = self.topic_model_lda(tm_documents, 'method_and_docstring')
        lda_word_and_docstring = self.topic_model_lda(tm_documents, 'word_and_docstring')
        end = timer()
        print("Time lda docstring method and word:", end - start)

        start = timer()
        lsi_method = self.topic_model_lsi(tm_documents, 'method')
        lsi_word = self.topic_model_lsi(tm_documents, 'word')
        end = timer()
        print("Time lsi method and word:", end - start)

        start = timer()
        lsi_method_and_docstring = self.topic_model_lsi(tm_documents, 'method_and_docstring')
        lsi_word_and_docstring = self.topic_model_lsi(tm_documents, 'word_and_docstring')
        end = timer()
        print("Time lsi docstring method and word:", end - start)

        start = timer()
        key_words = self.key_words(execution_paths_of_a_cluster, execution_paths_of_siblings, parent_label)
        end = timer()
        print("Time key words:", end - start)

        start = timer()
        text_rank = self.text_rank_words(tm_documents[2])
        end = timer()
        print("Time textrank:", end - start)

        start = timer()
        text_summary = self.summarize_clusters_using_docstring(
            execution_paths_of_a_cluster, self.function_to_docstring)
        end = timer()
        print("Text summary:", end - start)

        start = timer()
        files_count, files = self.count_files_in_node(
            execution_paths_of_a_cluster)
        execution_paths_count = len(execution_paths_of_a_cluster)
        end = timer()
        print("Time file count and stuff", end - start)

        start = timer()
        words_in_cluster = self.words_in_cluster(self.execution_path_words, execution_paths_of_a_cluster)
        end = timer()
        print("Time word cluster:", end - start)

        start = timer()

        self.worksheet.write(self.row, 0, k)
        self.worksheet.write(self.row, 1, self.execution_path_to_sentence(
            execution_paths_of_a_cluster))
        self.worksheet.write(self.row, 2, tfidf_word)
        self.worksheet.write(self.row, 3, tfidf_method)
        self.worksheet.write(self.row, 4, tfidf_word_and_docstring)
        self.worksheet.write(self.row, 5, tfidf_method_and_docstring)
        self.worksheet.write(self.row, 6, lda_word)
        self.worksheet.write(self.row, 7, lda_method)
        self.worksheet.write(self.row, 8, lda_word_and_docstring)
        self.worksheet.write(self.row, 9, lda_method_and_docstring)
        self.worksheet.write(self.row, 10, lsi_word)
        self.worksheet.write(self.row, 11, lsi_method)
        self.worksheet.write(self.row, 12, lsi_word_and_docstring)
        self.worksheet.write(self.row, 13, lsi_method_and_docstring)
        self.worksheet.write(self.row, 14, text_rank)
        self.worksheet.write(self.row, 16, key_words)
        self.worksheet.write(self.row, 17, text_summary)
        self.worksheet.write(self.row, 18, spm_method)
        self.worksheet.write(self.row, 19, words_in_cluster)
        self.row += 1

        end = timer()
        print("Work sheet write:", end - start)

        execution_paths = {ep: 1 for ep in execution_paths_of_a_cluster}

        return {'key': k, 'parent': v, 'tfidf_word': tfidf_word, 'tfidf_method': tfidf_method,
                'tfidf_word_and_docstring': tfidf_word_and_docstring,
                'tfidf_method_and_docstring': tfidf_method_and_docstring, 'lda_word': lda_word,
                'lda_method': lda_method, 'lda_word_and_docstring': lda_word_and_docstring,
                'lda_method_and_docstring': lda_method_and_docstring, 'lsi_word': lsi_word, 'lsi_method': lsi_method,
                'lsi_word_and_docstring': lsi_word_and_docstring, 'lsi_method_and_docstring': lsi_method_and_docstring,
                'text_rank': text_rank, 'key_words': key_words, 'spm_method': spm_method,
                'words_in_cluster': words_in_cluster, 'text_summary': text_summary, 'files_count': files_count,
                'files': files, 'execution_path_count': execution_paths_count, 'execution_paths': execution_paths}

    def tf_idf_score_for_scipy_cluster(self, tfidif_documents, method_or_word):
        """
        Tfidf score calculation for a scipy cluster.
        """

        txt1 = ['His smile was not perfect',
                'His smile was not not not not perfect', 'she not sang']

        try:

            if method_or_word == 'method':
                txt1 = tfidif_documents[0]
            elif method_or_word == 'word':
                txt1 = tfidif_documents[1]
            elif method_or_word == "docstring_and_method":
                txt1 = tfidif_documents[2]
            elif method_or_word == "docstring_and_word":
                txt1 = tfidif_documents[3]

            tf = TfidfVectorizer(smooth_idf=False, sublinear_tf=False,
                                 norm=None, analyzer='word', token_pattern='[a-zA-Z0-9]+')

            txt_transformed = tf.fit_transform(txt1)

        except Exception as e:
            print(e)
            exit(1)

        feature_names = np.array(tf.get_feature_names())
        max_val = txt_transformed.max(axis=0).toarray().ravel()
        sort_by_tfidf = max_val.argsort()

        if method_or_word == 'method':
            return self.id_to_sentence(feature_names[sort_by_tfidf[-10:]])
        elif method_or_word in ['word', "docstring_and_method", "docstring_and_word"]:
            return self.merge_words_as_sentence(feature_names[sort_by_tfidf[-10:]])

    def make_documents_for_a_cluster_tfidf(self, cluster):
        """
        Sets up data structures needed to get all the labels that use the TFIDF algorithm
        """

        method_doc = []
        method_and_docstring_doc = []
        word_doc = []
        word_and_docstring_doc = []

        for c in cluster:
            method_str = ''
            method_and_docstring_str = ''
            word_str = ''
            word_and_docstring_str = ''

            for e in self.execution_paths[c]:
                method_str += e

                words_in_function_name = [
                    w for w in util.parse_method_class_name_to_words(self.function_id_to_name[e]) if
                    w not in self.en_stop]
                words_in_function_name = [util.get_lemma(
                    w) for w in words_in_function_name]
                word_str += self.merge_words_as_sentence(words_in_function_name)

                no_punctuation = re.sub(r'[^\w\s]', '', self.function_to_docstring[e])
                if no_punctuation == '':
                    method_and_docstring_str += "funcname" + e
                    word_and_docstring_str += self.merge_words_as_sentence(words_in_function_name)
                else:
                    temp = ' '.join(
                        [util.get_lemma(word.lower()) for word in no_punctuation.split(" ") if word.lower() != "" and
                         word.lower() not in self.en_stop])
                    method_and_docstring_str += temp
                    word_and_docstring_str += temp
                method_str += ' '
                word_str += ' '
                method_and_docstring_str += ' '
                word_and_docstring_str += ' '

            method_doc.append(method_str[:-1])
            word_doc.append(word_str[:-1])
            method_and_docstring_doc.append(method_and_docstring_str[:-1])
            word_and_docstring_doc.append(word_and_docstring_str[:-1])

        return [method_doc, word_doc, method_and_docstring_doc, word_and_docstring_doc]

    def make_documents_for_a_cluster_tm(self, cluster):
        """
        Sets up data structures needed to get all the labels that use either the LDA or LSI algorithm
        """
        method_doc = []
        method_and_docstring_doc = []
        word_doc = []
        word_and_docstring_doc = []

        for c in cluster:
            method_str = ''
            method_and_docstring_str = ''
            word_str = ''
            word_and_docstring_str = ''

            for e in self.execution_paths[c]:
                method_str += self.function_id_to_name[e]

                words_in_function_name = [
                    w for w in util.parse_method_class_name_to_words(self.function_id_to_name[e]) if
                    w not in self.en_stop]
                words_in_function_name = [util.get_lemma(
                    w) for w in words_in_function_name]
                word_str += self.merge_words_as_sentence(words_in_function_name)

                no_punctuation = re.sub(r'[^\w\s]', '', self.function_to_docstring[e])
                if no_punctuation == '':
                    method_and_docstring_str += self.function_id_to_name[e]
                    word_and_docstring_str += self.merge_words_as_sentence(words_in_function_name)
                else:
                    method_and_docstring_str += ' '.join(
                        [util.get_lemma(word.lower()) for word in no_punctuation.split(" ") if word.lower() != "" and
                         word.lower() not in self.en_stop])
                    word_and_docstring_str += ' '.join(
                        [util.get_lemma(word.lower()) for word in no_punctuation.split(" ") if word.lower() != "" and
                         word.lower() not in self.en_stop])
                method_str += ' '
                word_str += ' '
                method_and_docstring_str += ' '
                word_and_docstring_str += ' '

            method_doc.append(method_str[:-1])
            word_doc.append(word_str[:-1])
            method_and_docstring_doc.append(method_and_docstring_str[:-1])
            word_and_docstring_doc.append(word_and_docstring_str[:-1])

        return [method_doc, word_doc, method_and_docstring_doc, word_and_docstring_doc]

    def merge_words_as_sentence(self, identifiers):
        """
        Merging array of words as sentence. If identifiers is an empty array or filled with empty strings, then returns
        "{low similarity}" instead.
        """
        result = []
        st = ''
        # to omit empty words
        for i in identifiers:
            if i == '':
                continue
            else:
                result.append(i)

        for r in result:
            if len(r) > 8 and r[:8] == 'funcname':
                st += self.function_id_to_name[r[8:]]
            else:
                st += r
            st += ' '

        if st == '':
            st = "{low similarity} "

        return st[:-1]

    def topic_model_output(self, topics):
        """ formatting topic model outputs """
        out = ' '

        for t in topics:
            out = out + t[0]
            out = out + ','

        return out

    def topic_model_lda(self, tm_documents, method_or_word):
        """
        LDA algorithm based labels generation.
        """
        self.text_data = []
        if method_or_word == 'method':
            txt = tm_documents[0]
        elif method_or_word == 'word':
            txt = tm_documents[1]
        elif method_or_word == "method_and_docstring":
            txt = tm_documents[2]
        elif method_or_word == "word_and_docstring":
            txt = tm_documents[3]

        for line in txt:
            tokens = self.prepare_text_for_lda(line)
            # if random.random() > .99:
            # print(tokens)
            self.text_data.append(tokens)

        dictionary = corpora.Dictionary(self.text_data)
        corpus = [dictionary.doc2bow(text) for text in self.text_data]

        NUM_TOPICS = 5
        # ldamodel = gensim.models.ldamulticore.LdaMulticore(corpus, num_topics=NUM_TOPICS, id2word=dictionary, passes=3)
        ldamodel = gensim.models.ldamodel.LdaModel(
            corpus, num_topics=NUM_TOPICS, id2word=dictionary, passes=3)

        topics = ldamodel.show_topic(0, topn=5)
        # print(topics)
        topics = self.topic_model_output(topics)
        # print(topics)

        return topics

    def topic_model_lsi(self, tm_documents, method_or_word):
        """
        LSI algorithm based labels generation.
        """

        self.text_data = []

        if method_or_word == 'method':
            txt = tm_documents[0]
        elif method_or_word == 'word':
            txt = tm_documents[1]
        elif method_or_word == 'method_and_docstring':
            txt = tm_documents[2]
        elif method_or_word == 'word_and_docstring':
            txt = tm_documents[3]

        for line in txt:
            tokens = self.prepare_text_for_lda(line)
            # if random.random() > .99:
            # print(tokens)
            self.text_data.append(tokens)

        dictionary = corpora.Dictionary(self.text_data)
        corpus = [dictionary.doc2bow(text) for text in self.text_data]

        # pickle.dump(corpus, open('corpus.pkl', 'wb'))
        # dictionary.save('dictionary.gensim')

        NUM_TOPICS = 5
        # ldamodel = gensim.models.ldamulticore.LdaMulticore(corpus, num_topics=NUM_TOPICS, id2word=dictionary, passes=3)
        # ldamodel = gensim.models.ldamodel.LdaModel(corpus, num_topics=NUM_TOPICS, id2word=dictionary, passes=3)
        lsimodel = gensim.models.lsimodel.LsiModel(
            corpus, num_topics=5, id2word=dictionary)
        topics = lsimodel.show_topic(0, topn=5)
        topics = self.topic_model_output(topics)

        return topics

    def prepare_text_for_lda(self, text):
        """
        Proprocessing text for LDA.
        """
        tokens = self.tokenize(text)

        tokens = [token for token in tokens if len(token) >= 2]

        tokens = [token for token in tokens if token not in self.en_stop]

        tokens = [util.get_lemma(token) for token in tokens]

        return tokens

    def tokenize(self, text):
        """
        Tokenize a word.
        """
        lda_tokens = []
        tokens = self.parser(text)
        for token in tokens:
            if token.orth_.isspace():
                continue
            elif token.like_url:
                lda_tokens.append('URL')
            elif token.orth_.startswith('@'):
                lda_tokens.append('SCREEN_NAME')
            else:
                lda_tokens.append(token.lower_)
        return lda_tokens

    def key_words(self, execution_paths_of_a_cluster, execution_paths_of_siblings, parent_label):
        cluster_word_freq = {}
        sibling_word_freq = {}
        if len(execution_paths_of_siblings) == 0 and parent_label is not None:
            return parent_label
        for path in execution_paths_of_a_cluster:
            for word in self.execution_path_words[str(self.execution_paths[path])]:
                if word not in cluster_word_freq:
                    cluster_word_freq[word] = 1
                else:
                    cluster_word_freq[word] += 1
                if word not in sibling_word_freq:
                    sibling_word_freq[word] = 0
                    for sibling_path in execution_paths_of_siblings:
                        sibling_word_freq[word] += word in self.execution_path_words[
                            str(self.execution_paths[sibling_path])]
        for word in cluster_word_freq:
            cluster_word_freq[word] = cluster_word_freq[word] / len(execution_paths_of_a_cluster)
            if len(execution_paths_of_siblings) == 0:
                continue
            sibling_word_freq[word] = sibling_word_freq[word] / len(execution_paths_of_siblings)
            if sibling_word_freq[word] > 1:
                exit(1)
            cluster_word_freq[word] = cluster_word_freq[word] * (1 - sibling_word_freq[word])
        most_freq_words = [word_and_freq[0] for word_and_freq in
                           sorted(cluster_word_freq.items(), key=lambda item: item[1], reverse=True)]

        return self.merge_words_as_sentence([word for index, word in enumerate(most_freq_words) if
                                             cluster_word_freq[word] > 0.25 and (index < 5 or cluster_word_freq[
                                                 word] == 1)])  # Todo case when not 5 words

    def text_rank_words(self, documents):
        """
        Label generation based on text rank algorithm
        """
        try:
            cluster_keywords = keywords(". ".join(documents), split=True, words=5, lemmatize=True)
            cluster_keywords = ', '.join(list(set(cluster_keywords)))
        except ValueError:
            cluster_keywords = "Empty"
        return cluster_keywords

    def words_in_cluster(self, execution_path_words, execution_paths):
        """
        Get the set the words in a node in a cluster tree. This is done by doing the union between sets of words in each
        execution path in the node.
        """
        words = set()
        for path in execution_paths:
            words |= execution_path_words[str(self.execution_paths[path])]
        return self.merge_words_as_sentence(words)

    def summarize_clusters_using_docstring(self, execution_paths_of_a_cluster, function_to_docstring):
        """  automatic text summarization for docstring of function names based on text rank algorithm """

        text_for_summary = ''
        # count = 0
        for c in execution_paths_of_a_cluster:
            for f in self.execution_paths[c]:
                if function_to_docstring[f] is not None:
                    text_for_summary += function_to_docstring[f] + ' '

        try:
            # cluster_summary = summarize(
            #     text_for_summary, word_count= 120, split=True)
            cluster_summary = summarize(
                text_for_summary, split=True)
            cluster_summary = ' '.join(list(set(cluster_summary)))

            return cluster_summary
        except ValueError:
            return 'Empty'

    def mining_sequential_patterns(self, execution_paths_of_a_cluster):
        """ This function mines sequential patterns from execution paths """

        # print(self.execution_paths)
        preprocess = [self.execution_paths[item]
                      for item in execution_paths_of_a_cluster]
        # print(preprocess)
        start = timer()
        print("a", len(preprocess))
        ps = PrefixSpan(preprocess)
        ps.maxlen = 10
        ps.minlen = 3
        NUMBER_OF_PATTERNS = 2 * math.log(len(execution_paths_of_a_cluster)) + 6
        print("b", NUMBER_OF_PATTERNS)
        top_patterns = ps.topk(NUMBER_OF_PATTERNS)
        print("c")
        top_patterns = [pattern[1] for pattern in top_patterns]
        # top_patterns = self.remove_similar_patterns(top_patterns)
        end = timer()
        print("MINING PART 1:", end - start)
        print(len(top_patterns))

        sentence = ' '
        for pattern in top_patterns:
            sentence += ' &#187; '
            for method in pattern:
                sentence += self.function_id_to_name[method] + \
                            '(' + self.function_id_to_file_name[method] + ')'
                if method != pattern[len(pattern) - 1]:
                    sentence += ' &rarr; '

            sentence += ' . <br>'

        return sentence

    def remove_similar_patterns(self, patterns):
        ''' Ignore similar patterns and keep the lengthy one. '''

        similar_pattern_removed = {}

        for pattern in patterns:
            if pattern[1][0] in similar_pattern_removed:
                if len(similar_pattern_removed[pattern[1][0]]) < len(pattern[1]):
                    similar_pattern_removed[pattern[1][0]] = pattern[1]
            else:
                similar_pattern_removed[pattern[1][0]] = pattern[1]

        return list(similar_pattern_removed.values())

    def execution_path_to_sentence(self, execution_paths_of_a_cluster):
        """
        This function takes execution paths of a cluster. Then creates a printable string with execution paths with function names.
        """
        try:
            str = ''
            for l in execution_paths_of_a_cluster:

                for e in self.execution_paths[l]:
                    str += self.function_id_to_name[e]
                    str += ', '
                str += ' ;'
        except:
            print('Crushed : ', e)

        return str

    def count_files_in_node(self, execution_paths_of_a_cluster):
        """
        Returns the number and set of files that are accessed when going through all the execution paths in a node.
        """
        files_count = {}

        for c in execution_paths_of_a_cluster:
            for f in self.execution_paths[c]:
                if self.function_id_to_file_name[f] in files_count:
                    files_count[self.function_id_to_file_name[f]] += 1

                else:
                    files_count[self.function_id_to_file_name[f]] = 1

        return len(list(files_count.keys())), list(files_count.keys())
