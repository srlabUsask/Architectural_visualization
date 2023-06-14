creating execution paths file

files use absolute path -> call logs from different device will not work.
all files in app/output that will be rendered in website will cause error, because of absolute path used
(they can be deleted)


1)  creating call log
    set the file name in python_logger.py(line 6) (default value is below)
        file = open("../instance/callLogs/test2_" + date.today().strftime("%m-%d-%Y") + ".log", "w")
    run python_logger.py-> python3 python_logger.py
    in instance/callogs file will be created with name that was set

2) setup config.py in /app

    2.1) set root to the absolute path of the app folder(same as in the terminal)
    should look like "path"/Architectural_visualization/app
    2.2) set SUBJECT_SYSTEM_NAME to name of the call log created in step 1(without extension)
    2.3) set EXECUTION_PATTERNS if necessary to display the patterns in website
    2.4) set DOC2VEC to True if necessary to use DOC2Vec instead of Jaccard Similarity

3) create execution file output by running ClusteringCallGraph.py
    python3 ClusteringCallGraph.py

    .log and .xlsx file will be added to /app/output folder, which will be automatically added to subject system
    tab in website
