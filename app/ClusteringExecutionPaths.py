from scipy.cluster.hierarchy import dendrogram, linkage, fcluster, to_tree
from scipy.spatial import distance as ssd
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
        thresholds = [5, 4, 3, 2, 1.5, 0.9]

        for i, threshold in enumerate(thresholds):
            self.flat_cluster(mat, threshold, i+1)

            for cluster, leaves in self.cluster_to_leaf.items():
                # print(leaves, type(leaves[0]))
                if i == 0:
                    tree.append(document_nodes.labeling_cluster(leaves, [], cluster, -1))
                else:
                    # print(self.cluster_to_parent_leaf[self.parent_leaf_to_cluster[leaves[0]]])
                    # print(leaves)
                    # print([item for item in self.cluster_to_parent_leaf[self.parent_leaf_to_cluster[leaves[0]]] if item not in leaves])
                    # print("_________")
                    tree.append(document_nodes.labeling_cluster(leaves, [item for item in self.cluster_to_parent_leaf[self.parent_leaf_to_cluster[leaves[0]]] if item not in leaves],
                                                                cluster, self.parent_leaf_to_cluster[leaves[0]]))

        return tree


