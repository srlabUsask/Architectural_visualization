import sys
from datetime import date
from rich.console import Console
from rich import print

file = open("../instance/callLogs/test2_" + date.today().strftime("%m-%d-%Y") + ".log", "w")

def trace(frame, event, arg):
    # Current trace function based on logging the activities run using the rich library
    code = frame.f_code
    if (event == 'call' or event == "return") and "rich" in code.co_filename and code.co_name[0] != '<':
        # code.co_varnames[:code.co_argcount] -  if you want arguments of functions
        file.write(code.co_name + "@@@" + code.co_filename + "::" + str(code.co_firstlineno) + event[0] + "\n")
    return trace

if __name__ == "__main__":
    sys.settrace(trace)
    # Activities we will do to log function calls
    console = Console()
    console.print("Hello", "World!", style="bold red")
    console.print("Where there is a [bold cyan]Will[/bold cyan] there [u]is[/u] a [i]way[/i].")
    # print("Hello, [bold magenta]World[/bold magenta]!", ":vampire:", locals())

    sys.settrace(None)
