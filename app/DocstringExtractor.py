import re
import os



#  .../crhmcode/crhmcode
ROOT = '/mnt/c/Users/uwo916/source/repos/clone/CRHM/crhmcode/crhmcode/' # directory location of app folder for the server run


"""
Extracts docstrings from c++ function 

filename-> relative path to file from the given ROOT specified above
functionName-> full function name including all parameters and their types



NOTE: functionLine starts from 1 and not 0. subtract 1 if accessing in file array
"""

def getDocString(filename,functionName, functionLine):

    print("-------------****************----------")
    print("getting "+functionName+ " from "+filename)

    file = open(ROOT+filename,"r")



    


    lines = file.readlines()
   
    functionIndex=0


    for i in range(functionLine-2,0,-1):
    
        if functionName in lines[i]:
            functionIndex=i
            break


    # finding comments above functionIndex name

    comments=[]
    # if the current line is within docstring
    
    isInDocString=False
    commentStartIndex=functionIndex
    for i in range(functionLine-2,0,-1):
        
        
        line = lines[i]
        commentStart=line.find("/*")

        commentEnd=line.find("*/")

        if(i>=functionIndex):
        
            if isInDocString:

                if(commentStart>0):
                    comments.append(line[commentStart+2:])
                    lines[i] = line[:commentStart]
                    i+=1
                    isInDocString=False
                    continue

                comments.append(line)
            else:    
                

                inlineCommentStart = line.find("//")

                if(inlineCommentStart>0):
                    comments.append(line[inlineCommentStart+2:])
                    lines[i]=line[:inlineCommentStart]#remove inline comment part
                    i+=1
                    continue

                if(commentEnd>0):


                    if(commentStart>=0 and commentStart<commentEnd):
                        comments.append(line[commentStart+2:commentEnd])
                        lines[i]=line[:commentStart]+ line[commentEnd+2:]
                    else:
                        comments.append(line[:commentEnd])
                        isInDocString=True
    
           
        



        else:
              
            if( line.strip()[:2]=="//"):
                if(line.replace("-","").strip()=="//" or line.replace("/","").strip()==""):#not count the comment with only dashes
                    continue
                comments.append("\n"+line.strip()[2:]) #remove the // part
                continue

            if("/*" in line):
                isInDocString=False
                comments.append(line.replace("/*","",1))#remove first "/*"
                continue
            if("*/" in line):
                isInDocString=True
                #remove "*/" at end
                formatted = line.rsplit("*/",1)
                comments.append("".join(formatted))
                continue

  
      

            if isInDocString:
                
                if(len(line.strip())>1 and line.strip()[0]=="*"):
                    line = line.strip()[1:]
                comments.append(line.strip())


            elif not isInDocString or i==0:

                if(line.strip()==""):
                    continue
                commentStartIndex= i
                break

           



    """
    extracting comments inside function
    
    to match closing and opening braket of function
    starts with "Not Started" in case of faving inline comments before function opening bracket
    Will not work if multiple multiline comments are in one line


    """
    bracketCount="Not started"

    # if the current line is within docstring
   
    """
    isInDocString=False

    isInString=False#if inisde a string " 
    innerComments=[]
    for i in range(functionIndex, len(lines)):
        line=lines[i]
        print(lines[i])
        print(i)

        if(isInString):
            quoteIndex=line.find("\"")
            if quoteIndex<0:
                continue

            i-=1
            lines[i]=line[quoteIndex+1:]#subtract the string from line
            isInString=False
            continue

        if(bracketCount=="Not started" or bracketCount>0):
            
           
           
        

            if( "//" in line):

                commentPos = line.find("//")                
                innerComments.append("\n"+line.strip()[commentPos+2:]) #remove the // part
                line = line[:commentPos]#remove the part that was taken

            if("/*" in line):
                isInDocString=True
                commentPos = line.find("/*")

                commentEndPos=line.find("*/")

                if(commentEndPos> commentPos): #if multiline comment was used in one line(for some reason)
                    isInDocString=False
                else:
                    commentEndPos=len(line)

                innerComments.append(line[commentStartIndex+2:commentEndPos])

                #recheck same line without extracted part
                lines[i] = line[:commentPos]
                i-=1
                continue

            if("*/" in line):
                isInDocString=False
                #remove "*/" at end
                commentEndPos= line.find("*/")
                innerComments.append(line[:commentEndPos])

                 #recheck same line without extracted part
                lines[i] = line[commentEndPos:]
                i-=1
                continue
           

            if(isInDocString):
                innerComments.append(line)
                continue

            #exclude string from source code that are not comment
            if("\"" in line):
                stringStart=line.find("\"")
                isInString=True
                if(stringStart+1 > len(line)):
                    continue
                stringEnd=line[stringStart+1:].find("\"")#if the end of the string is in the same line
                if(stringEnd>0):
                    isInString=False
                    lines[i]=line[stringEnd+1:]
                    i-=1
                    continue


                


            if("{" in line ):

                bracketPos=line.find("{")
                if(bracketPos==0 or bracketPos==len(line)-1 or (line[bracketPos+1]!="\'" and line[bracketPos-1]!="\'")):
                    bracketCount=1 if bracketCount=="Not started" else bracketCount+1

                    
                    if(bracketPos==len(lines)-1):
                        continue
                    lines[i]=line[bracketPos+1:]
                    i-=1
                    continue

            if("}" in line ):

                bracketPos=line.find("}")
                if(bracketPos==0 or bracketPos==len(line)-1 or (line[bracketPos+1]!="\'" and line[bracketPos-1]!="\'")):
                    bracketCount-=1

                    if(bracketPos==len(lines)-1):
                        continue
                    lines[i]=line[bracketPos+1:]
                    i-=1
                    continue

        else:
            break


    """


    #reread the file
    file.close()

    print("-------------****************----------")
    comments = comments[::-1] #reverse the string

    stringComments = " ".join(comments)


    functionFullText=extractFunctionText(filename,functionName, functionLine,functionIndex)
    return [stringComments,functionFullText]




    """
    Extracting entire function text from source code

    """

def extractFunctionText(filename,functionName, functionLine,functionIndex):





    file = open(ROOT+filename,"r")


    functionFullText=[]#keeps entire function text



    lines = file.readlines()

    #reconstruct the function header
    #function header adds newlines after each variable during instrumentation

    linesToAdd=""
    for i in range(functionIndex,functionLine-2):#up to opening bracket
        if("//" in lines[i]):#inline comment in variable
            if(linesToAdd!=""):
                functionFullText.append(linesToAdd)
                linesToAdd=""#reset lines
            functionFullText.append(lines[i])
        else:
            if(len(lines[i].strip())>0 and lines[i].strip()[0]!=","):
                linesToAdd+=" "#add space after every parameter if it is not comma
            linesToAdd+=lines[i].rstrip('\n')#remove last newline


    if linesToAdd!="":
        linesToAdd+="\n"
        functionFullText.append(linesToAdd)


    #add rest of the file
    for i in range(functionLine-2, len(lines)):
        line = lines[i]







        """
        end of the function format: the SPDLOG call, an empty line and a line with "}" as first symbol of line
        """
        if(len(line.strip())>0 and line.strip()[0]=="}" and "SPDLOG_LOGGER_INFO(InstrumentLogger::instance()->get_instrument_logger(), \"</" in lines[i-2]):
            functionFullText.append(line)
            break

        functionFullText.append(line)







    functionFullText="\n".join(functionFullText)
    return functionFullText


getDocString("src/Core/Administer.cpp","AddModel",156)


