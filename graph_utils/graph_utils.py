from igraph import Graph


def get_call_line_info(line):
    """
    Returns the relevant details of the function call extracted from a logging line

    Args:
        line (str): Line to return the info of
    Returns:
         class_name (str): The name of the class referenced in the line, empty String if no class given
         short_name (str): Short name of the function
         full_name  (str): Function name and signature
         file_name  (str): Name of the file where the function is contained
         line_num   (int): Line number where the function was invoked in file_name
    """
    if ':' in line:
        class_name_start = line.find('<') + 1
        class_name_end = line.find(':')
        class_name = line[class_name_start:class_name_end]

        short_name_start = line.find(':') + 2
        short_name_end = line.find('(')
        short_name = line[short_name_start:short_name_end]

    else:
        class_name = ""
        short_name_start = 1
        short_name_end = line.find('(')
        short_name = line[1:short_name_end]

    full_name_stop = line.find("@")
    full_name = line[short_name_start:full_name_stop]

    file_name_start = line.rfind("@") + 1
    file_name_end = line.rfind(">")
    file_name = line[file_name_start:file_name_end]

    line_num_start = file_name_end + 1
    line_num = int(line[line_num_start:])

    return class_name, short_name, full_name, file_name, line_num

def build_dynamic_call_graph(in_file):
    """
    Constructs and returns a Graph object representing the call graph of the execution log parsed from in_file

    Args:
        in_file (str): Name of a file containing a dynamic execution log produced by executing instrumented code
    """

    i = 0

    file = open(in_file, 'r')
    file.seek(0)
    for line in file:
        i = i + 1
        # Identify the key components of the line
        line = line.strip()

        if "/" in line:
            continue

        class_name, func_short_name, full_function_name, file_name, line_number  = get_call_line_info(line)

        print("_____________________")
        print("Raw Line: " + line)
        print("Class Name: " + class_name)
        print("Short Function Name: " + func_short_name)
        print("Full Function Name: " + full_function_name)
        print("File Name: " + file_name)
        print("Line Number: " + str(line_number))
        print("_____________________")

        if i > 10:
            break
        # short_name_start_pos = line.find(':') + 2
        # short_name_end_pos = line.find('(')
        # func_short_name = line[short_name_start_pos:short_name_end_pos]  # ::OnHint
        # print(func_short_name)

        # function_line_num = int(line[line.rfind(">") + 1:])
        # print(function_line_num)


def main():
    build_dynamic_call_graph("test_data/Open_Close Project (2018).log")


if __name__ == "__main__":
    main()
