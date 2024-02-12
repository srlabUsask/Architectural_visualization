# Install Instructions

1. Set up a python3.8 virtual environment
2. Install python packages with ```pip install -r requirements.txt```
3. Change directory to "app"
4. Run program with ```flask run --debug```

## Set up python3.8 virtual environment

```
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt install python3.8
sudo apt install python3.8-venv
python3.8 -m venv .venv
source ./venv/bin/activate
```

## Creating execution paths file

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
   should look like "path"/Architectural_visualization/app \
   2.2) set SUBJECT_SYSTEM_NAME to name of the call log created in step 1(without extension)\
   2.3) set EXECUTION_PATTERNS if necessary to display the patterns in website\
   2.4) set DOC2VEC to True if necessary to use DOC2Vec instead of Jaccard Similarity\
   2.5) set IS_PYTHON to False if using CRHMcode InstrumentLogger created log file. True if using python_logger.py created log file.

3) create execution file output by running ClusteringCallGraph.py
   python3 ClusteringCallGraph.py

   .log and .xlsx file will be added to /app/output folder, which will be automatically added to subject system
   tab in website





## React npm setup

1) enter app/static folder
2) run "npm install" command in terminal 
3) for production build run "npm run build"
4) for development build run "npm run watch"
5) If the files are not being loaded, make sure the absolute path to /app folder is set in config.py