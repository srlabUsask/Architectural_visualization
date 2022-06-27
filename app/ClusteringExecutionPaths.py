from scipy.cluster.hierarchy import dendrogram, linkage, fcluster, to_tree
from scipy.spatial import distance as ssd
from timeit import default_timer as timer
import copy

class ClusteringExecutionPath:

    def __init__(self):
        self.parent_leaf_to_cluster = {}
        self.cluster_to_parent_leaf = {}
        self.cluster_to_leaf = {}
        self.leaf_to_cluster = {}

    def flat_cluster(self, mt, threshold, index):

        Z = linkage(ssd.squareform(mt), 'ward')
        # print("--------------")
        # print(mt)
        # print("--------------")
        # print(ssd.squareform(mt))
        # print("--------------")
        # print(Z)
        # print("--------------")

        flat_cluster = fcluster(Z, t= threshold, criterion='distance')
        # flat_cluster = fcluster(Z, t = 4, monocrit= 'maxclust')
        self.parent_leaf_to_cluster.clear()
        self.parent_leaf_to_cluster = copy.deepcopy(self.leaf_to_cluster)
        self.cluster_to_parent_leaf.clear()
        self.cluster_to_parent_leaf = copy.deepcopy(self.cluster_to_leaf)
        self.cluster_to_leaf.clear()
        self.leaf_to_cluster.clear()

        root_level = pow(10, index)

        for leaf, cluster in enumerate(flat_cluster):
            # print("---------------", cluster, root_level, leaf)
            # print(cluster, cluster+root_level, leaf, flat_cluster, "|||", self.cluster_to_leaf, "|||", self.leaf_to_cluster)
            if cluster+root_level in self.cluster_to_leaf:
                self.cluster_to_leaf[cluster + root_level].append(leaf)
            else:
                self.cluster_to_leaf[cluster + root_level] = [leaf]

            self.leaf_to_cluster[leaf] = cluster + root_level


        return flat_cluster

    def label_flat_clusters(self, document_nodes, mat):
        tree = []
        cluster_to_tree_index = {}
        thresholds = [5, 4, 3, 2, 1.5, 0.9]

        for i, threshold in enumerate(thresholds):
            start = timer()
            self.flat_cluster(mat, threshold, i+1)
            end = timer()
            print("Clustering time for threshold", threshold, end - start)

            for cluster, leaves in self.cluster_to_leaf.items():
                # print(leaves, type(leaves[0]))
                start = timer()
                if i == 0:
                    tree.append(document_nodes.labeling_cluster(leaves, [], cluster, -1, None))
                else:
                    # print(self.cluster_to_parent_leaf[self.parent_leaf_to_cluster[leaves[0]]])
                    # print(leaves)
                    # print([item for item in self.cluster_to_parent_leaf[self.parent_leaf_to_cluster[leaves[0]]] if item not in leaves])
                    # print("_________")
                    # print(leaves, cluster, self.parent_leaf_to_cluster[leaves[0]])
                    siblings = [item for item in self.cluster_to_parent_leaf[self.parent_leaf_to_cluster[leaves[0]]] if item not in leaves]
                    parent_label = None
                    if len(siblings) == 0:
                        parent_label = tree[cluster_to_tree_index[self.parent_leaf_to_cluster[leaves[0]]]]['key_words']
                    tree.append(document_nodes.labeling_cluster(leaves, siblings, cluster, self.parent_leaf_to_cluster[leaves[0]], parent_label))
                end = timer()
                print("___________Total Node Time:", end - start)
                cluster_to_tree_index[cluster] = len(tree) - 1

        return tree


