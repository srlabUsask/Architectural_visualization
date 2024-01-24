import subprocess


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


def main():
    extract_function_tags("test_data/ClassCRHM.cpp", "func_extract.tags")


if __name__ == "__main__":
    main()
