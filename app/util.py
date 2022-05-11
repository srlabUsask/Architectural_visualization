import random
import re

def test_strike_a_match():
    ep1 = ['58', '338', '342', '340'] #['F', 'R', 'A', 'N', 'C', 'E']
    ep2 = ['58', '342', '340'] # ['F', 'R', 'E', 'N', 'C', 'H']
    assert compare_execution_paths(ep1, ep2)== 0.6, 'Test Successful'

def method_pairs(execution_path):
    all_pairs = []
    for i in range(len(execution_path) - 1):
        all_pairs.append(execution_path[i: i+2])
        
    return all_pairs
    
def compare_execution_paths(ep1, ep2):
    ''' Strike a match implementation '''
    ep1_pairs = method_pairs(ep1)
    ep2_pairs = method_pairs(ep2)
    union = len(ep1_pairs) + len(ep2_pairs)
    intersection = 0
    
    for i in range(len(ep1_pairs)):
        for j in range(len(ep2_pairs)):
            
            if ep1_pairs[i] == ep2_pairs[j]:
                intersection += 1
                ep2_pairs.pop(j)
                break
                
    return 1 - ( 2 * intersection) / union

def random_sample_execution_paths(execution_paths):
    execution_path_max = 5000

    return random.sample(execution_paths, execution_path_max)

def jaccard_similarity(list1, list2):
    """ calculating jaccard similarity """
    intersection = len(list(set(list1).intersection(list2)))
    # print(list(set(list1).intersection(list2)))
    union = (len(list1) + len(list2)) - intersection

    return 1 - float(intersection / union)

def find_leaf_nodes_for_nodes(rootnode, nodelist):

    nodes_to_leaf_nodes = {}

    dfs_for_leaf_nodes(rootnode, nodes_to_leaf_nodes)

    return nodes_to_leaf_nodes

def dfs_for_leaf_nodes(node, nodes_to_leaf_nodes):
    
    if node.count == 1:
        nodes_to_leaf_nodes[node.id] = [node.id]
        return nodes_to_leaf_nodes[node.id]
    elif node.id in nodes_to_leaf_nodes:
        return nodes_to_leaf_nodes[node.id]
    else:
        leaves_in_left = dfs_for_leaf_nodes(node.left, nodes_to_leaf_nodes)
        leaves_in_right = dfs_for_leaf_nodes(node.right, nodes_to_leaf_nodes)
        nodes_to_leaf_nodes[node.id] = leaves_in_left + leaves_in_right
        return nodes_to_leaf_nodes[node.id]

def parse_method_class_name_to_words(name):
    ''' split class name, method name of both camel case and snake case identifiers '''
    # if '-' is in a name, we assume it is snake case else camel case
    words = []
    if '_' in name:
        words = name.split('_')
    else:
        words =  re.sub('([A-Z][a-z]+)', r' \1', re.sub('([A-Z]+)', r' \1', name)).split()

    return [w for w in words if w != '']



    

    