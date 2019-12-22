var HTMLParser = require('node-html-parser');
var fs = require('fs');
const ora = require('ora');
const open = require('open');
var figlet = require('figlet');
const request = require('request');
const prompts = require('prompts');
var download = require('download-pdf')
var findInFiles = require('find-in-files');
const crawler = require('crawler-request');
const chalkAnimation = require('chalk-animation');
const arrayToTxtFile = require('array-to-txt-file')
const removeEmptyLines = require("remove-blank-lines");

const forEachAsync = require('foreachasync').forEachAsync

const endpoint = "https://freeexampapers.com/exam-papers/IB/";

async function getAllSubjects(){
    return new Promise(function(resolve, reject){
        subjects=new Array();
        request(endpoint, function (error, response, body) {
            if (!error) {
                const root = HTMLParser.parse(body);
                forEachAsync(root.firstChild.text.split("\n").slice(10, -3), function (element) {
                    subjects.push(element.split('/')[0]);
                }).then(function () {
                    resolve(subjects);
                });
            } else {
                console.log(error);
                resolve(null);
            }
        });
    })
}

async function getOptionsForSubject(subject){
    return new Promise(function(resolve, reject){
        options=new Array()
        request(endpoint+subject+"/", function (error, response, body) {
            if (!error) {
                const root = HTMLParser.parse(body);
                forEachAsync(root.firstChild.text.split("\n").slice(10, -3), function (element) {
                    if(element.split('/')[0]!='Resources')options.push(element.split('/')[0]);
                }).then(function () {
                    resolve(options);
                });
            } else {
                console.log(error);
                resolve(null);
            }
        });
    })
}

async function getSubOptionsForSubject(subject, option){
    return new Promise(function(resolve, reject){
        suboptions=new Array()
        request(endpoint+subject+"/"+option+"/", function (error, response, body) {
            if (!error) {
                const root = HTMLParser.parse(body);
                forEachAsync(root.firstChild.text.split("\n").slice(10, -3), function (element) {
                    if (!isNaN(element.charAt(0)))resolve(null);
                    suboptions.push(element.split('/')[0]);
                }).then(function () {
                    //console.log("!!!!!!"+suboptions);
                    resolve(suboptions);
                });
            } else {
                console.log(error);
                resolve(null);
            }
        });
    })
}

async function getSessionsForSubject(subject, option, suboption){
    return new Promise(function(resolve, reject){
        sessions=new Array()
        request(endpoint+subject+"/"+option+"/"+(suboption!=null?suboption+"/":""), function (error, response, body) {
            if (!error) {
                const root = HTMLParser.parse(body);
                forEachAsync(root.firstChild.text.split("\n").slice(10, -3), function (element) {
                    if(element.split('/')[0]!='Resources')sessions.push(element.split('/')[0]);
                }).then(function () {
                    resolve(sessions);
                });
            } else {
                console.log(error);
                resolve(null);
            }
        });
    })
}

async function getPapers(subject, option, suboption, session){
    return new Promise(function(resolve, reject){
        papers=new Array()
        request(endpoint+subject+"/"+option+"/"+(suboption!=null?suboption+"/":"")+session+"/", function (error, response, body) {
            if (!error) {
                const root = HTMLParser.parse(body);
                forEachAsync(root.firstChild.text.split("\n").slice(10, -3), function (element) {
                    papers.push(element.split('.pdf')[0]+".pdf");
                }).then(function () {
                    resolve(papers);
                });
            } else {
                console.log(error);
                resolve(null);
            }
        });
    })
}

function getUrl(subject, option, option1, session, paper){
    return(String(endpoint+subject+"/"+option+"/"+((option1!=undefined)?(option1+"/"):"")+session+"/"+paper));
}

async function requestSubject(){
    const spinner = ora('Loading subjects...').start();
    spinner.color = 'yellow';
    answers=[]
    var s = await getAllSubjects();
    return new Promise(function(resolve, reject){
        s.forEach(e => {
            answers.push({title: e, value: e});
        });
        (async () => {
            spinner.stop();
            const response = await prompts({
                type: 'autocomplete',
                name: 'value',
                message: 'Enter a subject:',
                choices:answers
            });
            resolve(response.value);
        })();
    })
}

async function requestOption(subject){
    const spinner = ora('Loading options...').start();
    spinner.color = 'yellow';
    answers=[]
    var o = await getOptionsForSubject(subject);
    return new Promise(function(resolve, reject){
        o.forEach(e => {
            answers.push({title: e, value: e});
        });
        (async () => {
            spinner.stop();
            const response = await prompts({
                type: 'autocomplete',
                name: 'value',
                message: 'Choose an option:',
                choices:answers
            });
            resolve(response.value);
        })();
    })
}

async function requestSecondOption(subject, option){
    const spinner = ora('Loading options...').start();
    spinner.color = 'yellow';
    answers=[]
    var so = await getSubOptionsForSubject(subject, option);
    return new Promise(function(resolve, reject){
        so.forEach(e => {
            answers.push({title: e, value: e});
        });
        (async () => {
            spinner.stop();
            const response = await prompts({
                type: 'autocomplete',
                name: 'value',
                message: 'Choose an option:',
                choices:answers
            });
            resolve(response.value);
        })();
    })
}

async function requestSession(subject, option, option1){
    const spinner = ora('Loading sessions...').start();
    spinner.color = 'yellow';
    answers=[]
    var so = await getSessionsForSubject(subject, option, option1);
    return new Promise(function(resolve, reject){
        so.forEach(e => {
            answers.push({title: e, value: e});
        });
        (async () => {
            spinner.stop();
            const response = await prompts({
                type: 'autocomplete',
                name: 'value',
                message: 'Choose a session:',
                choices:answers
            });
            resolve(response.value);
        })();
    })
}

async function requestPaper(subject, option, option1, session){
    const spinner = ora('Loading papers...').start();
    spinner.color = 'yellow';
    answers=[]
    var p = await getPapers(subject, option, option1, session);
    return new Promise(function(resolve, reject){
        p.forEach(e => {
            answers.push({title: e, value: e});
        });
        (async () => {
            spinner.stop();
            const response = await prompts({
                type: 'autocomplete',
                name: 'value',
                message: 'Choose a paper:',
                choices:answers
            });
            resolve(response.value);
        })();
    })
}

async function mainMenu(){
    const response = await prompts({
        type: 'select',
        name: 'value',
        message: 'What would you like to do?',
        choices: [
          { title: 'Browse papers', description: 'View papers by subject, year and session', value: "browse"},
          { title: 'Search for a question', description: 'Search in all papers using keywords', value: 'search'},
          { title: 'Get a random question', description: 'Choose a subject and get a random question and answer', value: 'random', disabled: true },
          { title: 'Exit IBFetch', value: 'exit'}
        ],
        initial: 0
      });
    if(response.value=="browse"){
        await browsePapersMenu();
        return;
    }else if (response.value=="search"){
        await searchForQuestionMenu();
        return;
    }else if (response.value=="exit"){
        process.exit();
    }
}

async function browsePapersMenu(){
    var subject, option, option1, session, paper = ''
    await requestSubject().then((result)=>{subject=result});
    await requestOption(subject).then((result)=>{option=result});
    if(await getSubOptionsForSubject(subject,option)!=null) await requestSecondOption(subject,option).then((result)=>{option1=result});
    await requestSession(subject, option, option1).then((result)=>{session=result});
    await requestPaper(subject, option, option1, session).then((result)=>{paper=result});
    await paperMenu(subject, option, option1, session, paper);
}

async function getNumberOfPapersForSubject(subject, option, option1){
    numPapers=0;
    fullPaperUrls=[]
    var sessions = await getSessionsForSubject(subject, option, option1);
    for (let index = 0; index < sessions.length; index++) {
        papers = await getPapers(subject, option, option1, sessions[index]);
        for (let i = 0; i < papers.length; i++) {
            fullPaperUrls.push(getUrl(subject, option, option1,sessions[index],papers[i]));
        }
        numPapers += papers.length;
    }
    return([numPapers, fullPaperUrls]);
}

async function indexPaper(URL){
    return new Promise(function(resolve, reject){
        crawler(URL+"/").then(function(response){
            resolve("_NEW_PAPER_:"+URL+"\n"+removeEmptyLines(response.text));
        });
    })
}

async function searchForQuestionMenu(){
    var subject, option, option1 = ''
    URLs=[];
    index=[];
    await requestSubject().then((result)=>{subject=result});
    await requestOption(subject).then((result)=>{option=result});
    if(await getSubOptionsForSubject(subject,option)!=null) await requestSecondOption(subject,option).then((result)=>{option1=result});
    const spinner = ora('Retrieving papers...').start();
    spinner.color = 'green';
    var filenm = "./index/"+option+option1+".txt"
    if(!fs.existsSync(filenm)){
        await getNumberOfPapersForSubject(subject, option, option1).then((result)=>{spinner.text="Indexing 0/"+result[0]+" papers...";URLs=result[1]});
        for (let i = 0; i < URLs.length; i++) {
            spinner.text="Indexing "+(i+1)+"/"+URLs.length+" papers...";
            await indexPaper(URLs[i]).then((result)=>{index.push(result)});
        }
        spinner.text="Saving content...";
        if (!fs.existsSync("./index/")) {
            fs.mkdirSync("./index/");
        }
        fs.writeFile(filenm, "", function (err) {
            if (err) throw err;
        }); 
        arrayToTxtFile(index, (filenm), err => {
            if(err) {
            console.error(err)
            return
            }
        })
    }
    spinner.stop();
    (async () => {
        const response = await prompts({
          type: 'text',
          name: 'value',
          message: 'Enter a keyword:'
        });
        fs.readFile(filenm, {encoding: 'utf-8'}, function(err,data){
            if (!err) {
				keywordIndices=[]
                var pos = 0;
				var i = -1;
				while (pos != -1) {
					pos = data.indexOf(response.value, i + 1);
					if(pos!=-1)keywordIndices.push(pos);
					i = pos;
				}
				paperIndices=[]
				papers=[]
                var pos = 0;
				var i = -1;
				while (pos != -1) {
					pos = data.indexOf("_NEW_PAPER_", i + 1);
					if(pos!=-1){
						paperIndices.push(pos);
						papers.push(data.slice(pos+12,pos+120).split('.pdf')[0]+".pdf");
					}
					i = pos;
				}
				console.log("Found "+response.value+" in:");
				for (let i = 0; i < keywordIndices.length; i++) {
					for (let x = 0; x < paperIndices.length; x++) {
						if(keywordIndices[i]>paperIndices[x]&&keywordIndices[i]<(paperIndices[x+1]?paperIndices[x+1]:1000)){
							console.log(papers[x]);
						}
					}
				}
            } else {
                console.log(err);
            }
        });
      })();
}

async function paperMenu(subject, option, option1, session, paper){
    const response = await prompts({
        type: 'select',
        name: 'value',
        message: (option+" "+subject+" "+session+" "+paper),
        choices: [
          { title: 'Open', value: "open"},
          { title: 'Download', value: 'download'},
          { title: 'Back to main menu', value: 'back'}
        ],
        initial: 0
      });
      if(response.value=='open'){
        (async () => {
            // Opens the image in the default image viewer and waits for the opened app to quit.
            await open(getUrl(subject, option, option1, session, paper), {wait: true});
            console.log("Paper successfully opened!");
        })();
      }else if (response.value=='download'){
        var options = {
            directory: "./"+subject,
            filename: session+"."+paper
        }
        download(getUrl(subject, option, option1, session, paper), options, function(err){
            if (err) throw err
        }) 
        console.log("Paper successfully downloaded!");
      }else if (response.value=='back'){
          await mainMenu();
          return;
      }
    await paperMenu(subject, option, option1, session, paper);
}

async function app(){
    console.log("");
    figlet('IB Fetch', function(err, data) {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        const title = chalkAnimation.glitch(data);
        setTimeout(() => {
            title.replace("                             by cyrus");
        }, 1000);
        setTimeout(() => {
            title.stop();
            console.log("");
            mainMenu();
        }, 2000);
    });
}

app();