import linecache
import subprocess
import re as regex


def find_first_of(input_text, start_pos, *substrings):
    """
    Returns the index of the first occurrence of any string in *substrings within the input_text
    if there are no occurrences then -1 is returned, also returns which substring was matched and the end of the match

    Args:
        input_text (str): Text to be searched for occurrences of any substring
        start_pos (int): Position in input_text where the search starts
        *substrings: list of strings that define the substrings to search for
    """
    pattern = regex.compile('|'.join([regex.escape(s) for s in substrings]))
    match = pattern.search(input_text[start_pos:])
    if match is None:
        return -1, "", -1
    else:
        return match.start(), match.string, match.end()


def extract_function_tags(in_file, out_file):
    """
    Calls ctags to extract the functions tags from in_file and write them to out_file

    Args:
        in_file (str): A c/c++ source file containing function definitions
        out_file (str): A tab delimited file containing the function tags extracted from in_filename
    """

    command = [
        'ctags',
        '-x',
        '--c-kinds=fp',
        in_file
    ]

    completed_process = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if completed_process.returncode == 0:
        tags_text = completed_process.stdout.decode('utf-8')
        file_handle = open(out_file, 'w')
        file_handle.write(tags_text)
    else:
        print("Error encountered while extracting function tags from file:")
        print(in_file)
        print('Error message from ctags:\n')
        print(completed_process.stderr.decode('utf-8'))
        exit()


def extract_function_text(line_number, file_name):
    """
    Returns a string containing the full text of the function found at line_number in file_name

    Args:
        line_number (int): Line number where the function starts
        file_name (str): Path to the source file that contains the function
    """
    full_function = ""
    key_tokens = ['{', '}', '//', '/**', '**/', '/*', '*/', '\'', '\"']

    current_line_num = line_number
    current_line_text = linecache.getline(file_name, current_line_num)
    full_function += current_line_text

    start_index, match, end_index = find_first_of(current_line_text, 0, key_tokens)
    while match is not '{':
        if match == "":
            current_line_num = current_line_num + 1
            current_line_text = linecache.getline(file_name, current_line_num)
            full_function += current_line_text
            start_index, match, end_index = find_first_of(current_line_text, 0, key_tokens)
        elif match == '/**':
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, ['**/'])
            while match != '**/':
                current_line_num = current_line_num + 1
                current_line_text = linecache.getline(file_name, current_line_num)
                full_function += current_line_text
                start_index, match, end_index = (current_line_text, 0, ['**/'])
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)
        elif match == '/*':
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, ['*/'])
            while match != '*/':
                current_line_num = current_line_num + 1
                current_line_text = linecache.getline(file_name, current_line_num)
                full_function += current_line_text
                start_index, match, end_index = find_first_of(current_line_text, 0, ['*/'])
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)
        else:
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)

    token_stack = []
    token_stack.insert(0, '{')
    start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)

    while len(token_stack) != 0:
        if match == '{':
            token_stack.insert(0, '{')
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)
        elif match == '}':
            token_stack.pop(0)
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)
        elif match == '//':
            current_line_num = current_line_num + 1
            current_line_text = linecache.getline(file_name, current_line_num)
            full_function += current_line_text
            start_index, match, end_index = find_first_of(current_line_text, 0, ['*/'])
        elif match == '/**':
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, ['**/'])
            while match != '**/':
                current_line_num = current_line_num + 1
                current_line_text = linecache.getline(file_name, current_line_num)
                full_function += current_line_text
                start_index, match, end_index = find_first_of(current_line_text, 0, ['**/'])
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)
        elif match == '/*':
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, ['*/'])
            while match != '*/':
                current_line_num = current_line_num + 1
                current_line_text = linecache.getline(file_name, current_line_num)
                full_function += current_line_text
                start_index, match, end_index = find_first_of(current_line_text, 0, ['*/'])
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)
        elif match == '\'':
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, ['\'', '\\'])
            while match != '\'':
                if match == '\\':
                    start_index, match, end_index = find_first_of(current_line_text, end_index+1, ['\'', '\\'])
                else:
                    current_line_num = current_line_num + 1
                    current_line_text = linecache.getline(file_name, current_line_num)
                    full_function += current_line_text
                    start_index, match, end_index = find_first_of(current_line_text, 0, ['\'', '\\'])
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)
        elif match == '\"':
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, ['\"', '\\'])
            while match != '\"':
                if match == '\\':
                    start_index, match, end_index = find_first_of(current_line_text, end_index+1, ['\"', '\\'])
                else:
                    current_line_num = current_line_num + 1
                    current_line_text = linecache.getline(file_name, current_line_num)
                    full_function += current_line_text
                    start_index, match, end_index = find_first_of(current_line_text, 0, ['\"', '\\'])
            start_index, match, end_index = find_first_of(current_line_text, end_index + 1, key_tokens)
        elif match == "":
            current_line_num = current_line_num + 1
            current_line_text = linecache.getline(file_name, current_line_num)
            full_function += current_line_text
            start_index, match, end_index = find_first_of(current_line_text, 0, key_tokens)

    # while start_index == -1:
    #     current_line_num = current_line_num + 1
    #     current_line_text = linecache.getline(file_name, current_line_num)
    #     full_function += current_line_text
    #     start_index = current_line_text.find('{')
    #
    # brace_count = 1
    # start_index = start_index + 1
    # while brace_count != 0:
    #     next_open_brace_index = current_line_text.find('{', start_index)
    #     next_close_brace_index = current_line_text.find('}', start_index)
    #
    #     if next_close_brace_index == -1 and next_open_brace_index == -1:
    #         # Line does not contain any more braces
    #         current_line_num = current_line_num + 1
    #         current_line_text = linecache.getline(file_name, current_line_num)
    #         full_function += current_line_text
    #         start_index = 0
    #     elif (next_close_brace_index < next_open_brace_index and next_close_brace_index != -1) \
    #             or (next_close_brace_index != -1 and next_open_brace_index == -1):
    #         # Close brace occurs before the next open brace
    #         brace_count = brace_count - 1
    #         start_index = next_close_brace_index + 1
    #     elif (next_open_brace_index < next_close_brace_index and next_open_brace_index != -1) \
    #             or (next_open_brace_index != -1 and next_close_brace_index == -1):
    #         # Open brace occurs before the next close brace
    #         brace_count = brace_count + 1
    #         start_index = next_open_brace_index + 1

    print(full_function)


def main():
    # extract_function_tags("test_data/ClassCRHM.cpp", "func_extract.tags")
    extract_function_text(66, "test_data/ClassCRHM.cpp")


if __name__ == "__main__":
    main()
