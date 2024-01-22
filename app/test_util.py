import unittest

import util 

class UtilTestCase(unittest.TestCase):

    def test_parse_method_class_name_to_words(self):
        ''' split class name, method name of both camel case and snake case identifiers '''

        self.assertEqual(util.parse_method_class_name_to_words('__call__'), ['call'])
        self.assertEqual(util.parse_method_class_name_to_words('ZMQSocketChannel'), ['ZMQ', 'Socket', 'Channel'])
        self.assertEqual(util.parse_method_class_name_to_words('_recv_reply'), ['recv', 'reply'])
        self.assertEqual(util.parse_method_class_name_to_words('cleanup_connection_file'), ['cleanup', 'connection', 'file'])
        self.assertEqual(util.parse_method_class_name_to_words('V4toV5TestCase'), ['V4to', 'V5', 'Test', 'Case'])
        self.assertEqual(util.parse_method_class_name_to_words('_kernel_spec_manager_changed'), ['kernel', 'spec', 'manager', 'changed'])
        self.assertEqual(util.parse_method_class_name_to_words('InvalidPortNumber'), ['Invalid', 'Port', 'Number'])
        self.assertEqual(util.parse_method_class_name_to_words('testPrintFrozenSet'), ['test', 'Print', 'Frozen', 'Set'])
        self.assertEqual(util.parse_method_class_name_to_words('Py2GetArgSpec'), ['Py2', 'Get', 'Arg', 'Spec'])
        


if __name__ == '__main__':
    unittest.main()

