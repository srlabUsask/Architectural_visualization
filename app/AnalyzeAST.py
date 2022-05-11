import ast
import glob
import os


class AnalyzeAST:
    """ This class takes a python file as input returns its function name with corresponding docstring"""

    function_with_docstring = {}

    def file_to_function_docstring_pair(self, filename):
        """ This function returns function name with their docstring """

        with open(filename) as f:
            tree = ast.parse(f.read(), filename=filename, mode='exec')

            for node in ast.walk(tree):
                
                if isinstance(node, ast.ClassDef):
                    for cn in ast.iter_child_nodes(node):
                        if isinstance(cn, ast.FunctionDef):
                            
                            self.function_with_docstring[cn.name] = self.process_docstring(
                                ast.get_docstring(cn))
                            
                if isinstance(node, ast.FunctionDef):
                    self.function_with_docstring[node.name] = self.process_docstring(
                        ast.get_docstring(node))
        

    def process_docstring(self, doc):
        
        if doc is None:
            return ''
        for line in doc.split('\n'):
            line = line.strip()
            if (line == "") or (not any([c.isalnum() for c in line])):
                continue
            
            if '.' in line:
                return line
            else:
                return line+'.'

        return ''

    def get_all_py_files(self, root):
        all_py = []
        for path, subdirs, files in os.walk(root):
            for name in files:
                if name.endswith('.py'):
                    all_py.append(os.path.join(path, name))

        return all_py

    def get_all_method_docstring_pair_of_a_project(self, location):
        all_files = self.get_all_py_files(location)

        for f in all_files:
            self.file_to_function_docstring_pair(f)
        
        return self.function_with_docstring

    def get_function_to_comment_ratio(self, location):

        self.get_all_method_docstring_pair_of_a_project(location)
        total_methods = len(self.function_with_docstring)
        no_comments = 0
        for method, doc in self.function_with_docstring.items():
            if doc == '':
                no_comments += 1

        return (no_comments/total_methods) * 100


