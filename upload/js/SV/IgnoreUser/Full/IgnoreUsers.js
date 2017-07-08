/*

The MIT License (MIT)

Copyright (c) 2017 Kinematics

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

(function () {
  'use strict';

  if (!supportsLocalStorageAndCustomProperties())
      return;
    
  IgnoreNames();
    
  document.addEventListener('DOMContentLoaded', MakeButtons, false);
}) ();

function detach() {
  try {
    document.removeEventListener('DOMContentLoaded', MakeButtons, false);
  } catch (e) {
    // Ignore.  Possibly window closing.
  }
}

///////////////////////////////////////////////////////////////////////////////

function MakeButtons() {
  detach();

  // Check for any ignored content.  If it exists, create the button to reveal it.
  let makeShowButton = false;
  let makeIgnoreThreadButton = false;
  let whatToShow = "Users";
  let showFn;
    
  let messageList = document.getElementById('messageList');
  if (messageList !== null) {
      showFn = function() { $('#messageList').addClass('showIgnored'); };
      makeIgnoreThreadButton = true;
      
      // Posts
      let posts = messageList.children;
      for (let i = 0; i < posts.length; i++) {
          let val = getComputedStyle(posts[i]).getPropertyValue('--ignored-post-display');
          if (val !== null && val != "") {
              makeShowButton = true;
              break;
          }
      }

      // Quotes
      if (!makeShowButton) {
          let quotes = messageList.getElementsByClassName('bbCodeQuote');
          for (let i = 0; i < quotes.length; i++) {
              let val = getComputedStyle(quotes[i]).getPropertyValue('--ignored-quote-display');
              if (val !== null && val != "") {
                  makeShowButton = true;
                  break;
              }
          }
      }
  }

  if (!makeShowButton) {
      showFn = function() { $('.discussionListItems').addClass('showIgnored'); };
      whatToShow = "Threads";
      // Threads
      let threadsList = document.getElementsByClassName('discussionListItems')

      for (let t = 0; t < threadsList.length; t++) {
          let threads = threadsList[t].children;
          for (let i = 0; i < threads.length; i++) {
              let val = getComputedStyle(threads[i]).getPropertyValue('--ignored-thread-display');
              if (val !== null && val != "") {
                  makeShowButton = true;
                  break;
              }
          }
      }
  }

  if (makeShowButton || makeIgnoreThreadButton) {
      let navGroups = document.getElementsByClassName('pageNavLinkGroup');

      for (let nav of navGroups) {
          if (makeShowButton) {
              let button = document.createElement('button');
              button.className = "button";
              button.addEventListener('click', showFn);
              button.innerHTML = 'Show Ignored ' + whatToShow;
              nav.appendChild(button);
          }
          if (makeIgnoreThreadButton) {
              let button = document.createElement('button');
              button.className = "button toggleIgnoreThreadButton";
              button.addEventListener('click', ToggleThreadIgnore);
              button.innerHTML = IgnoreThreadButtonText();
              nav.appendChild(button);
          }
      }
  }
}

///////////////////////////////////////////////////////////////////////////////

function IgnoreNames() {
    let ignoreData = GetIgnoredValues();
    CreateCSSForIgnores(ignoreData[0], ignoreData[1]);
}

function CreateCSSForIgnores(users, threads){
    let postBlock = "";
    let quoteBlock = "";
    let threadBlock = "";
    let nextLine = "";
    
    // Create CSS for ignored user names.
    if (users.length > 0)
    {
        nextLine = "";
        
        /* Build up the name selectors for posts and quotes */
        for (let user of users) {
            postBlock += `${nextLine}    li[data-author="${user}"]:not(.staff)`;
            quoteBlock += `${nextLine}    .bbCodeQuote[data-author="${user}"]`;
            nextLine = ",\n";
        }
        
        /* Define the rules for each */
        postBlock += ` {
        --ignored-post-display: none;
        --ignored-user-post-message: "You are ignoring this user.";
        --ignored-user-post-message-display: block;
    }`;
        quoteBlock += ` {
        --ignored-quote-display: none;
        --ignored-user-quote-message: "You are ignoring this user.";
        --ignored-user-quote-message-display: block;
    }`;
    }
    
    // Create CSS for ignored threads.
    if (threads.length > 0)
    {
        nextLine = "";
        
        /* Build up the name selectors for posts and quotes */
        for (let thread of threads) {
            threadBlock += `${nextLine}    li[id="${thread}"]`;
            nextLine = ",\n";
        }
        
        /* Define the rules for each */
        threadBlock += ` {
        --ignored-thread-display: none;
        --ignored-thread-message: "You are ignoring this thread.";
        --ignored-thread-message-display: block;
    }`;
        
    }
        /* Put everything inside a check for custom property support */
        let cssText = `@supports (--css: variables) {
${postBlock}
${quoteBlock}
${threadBlock}
}`;
    
    /* And add it to the page. */
    let css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = cssText;
    document.head.appendChild(css);    
}

/* Get the locally-stored list of ignored user names. */
function GetIgnoredValues() {
    let usersArray = [];
    let threadsArray = [];
    
    // get names from local storage
    let users = localStorage.getItem("ignoredUsers");
    let threads = localStorage.getItem("ignoredThreads");
    let timeToRefresh = false;

    if (!users || !threads || timeToRefresh) {
        UpdateIgnored();

        users = localStorage.getItem("ignoredUsers");
        threads = localStorage.getItem("ignoredThreads");
    }

    try {
        if (typeof(users) == "string" && users != "undefined") {
            usersArray = users.split(",");
        }
        if (typeof(threads) == "string" && threads != "undefined") {
            threadsArray = threads.split(",");

            for (i = 0; i < threadsArray.length; i++) {
                threadsArray[i] = `thread-${threadsArray[i]}`;
            }
        }
    } catch (e) {
    }

    return new Array(usersArray, threadsArray);
}

/* Assign the list of ignored usernames to local storage. */
function UpdateIgnored(){
    try {
        let ignored = JSON.parse(mockRequest());

        if (typeof ignored !== "undefined") {
            localStorage.setItem("ignoredUsers", String(ignored.ignoredUsers));
            localStorage.setItem("ignoredThreads", String(ignored.ignoredThreads));
        }
    } catch (e) {
    }
}

///////////////////////////////////////////////////////////////////////////////

function ToggleThreadIgnore() {
    let id = GetThisThreadId();
    if (typeof id === "string") {
        let ignoredThreads = localStorage.getItem("ignoredThreads");
        let ignoredThreadsArr = ignoredThreads.split(",");
        
        let index = ignoredThreadsArr.indexOf(id);
        let threadIsIgnored = index >= 0;

        // If it doesn't exist, add it; otherwise, remove it.
        if (threadIsIgnored) {
            ignoredThreadsArr.splice(index, 1);
        } else {
            ignoredThreadsArr.push(id);
        }
        
        localStorage.setItem("ignoredThreads", String(ignoredThreadsArr));
        UpdateToggleButtons(!threadIsIgnored);
    }
}


function IgnoreThreadButtonText(threadIsIgnored) {
    if (threadIsIgnored === true) {
        return "Unignore Thread";
    } else if (threadIsIgnored === false) {
        return "Ignore Thread";
    } else {
        let id = GetThisThreadId();
        if (id) {
            let ignoredThreads = localStorage.getItem("ignoredThreads");
            let ignoredThreadsArr = ignoredThreads.split(",");
            let index = ignoredThreadsArr.indexOf(id);
            let alreadyIgnored = index >= 0;

            return IgnoreThreadButtonText(alreadyIgnored);
        } else {
            return "Ignore Thread";
        }
    }
}

function UpdateToggleButtons(threadIsIgnored) {
    let text = IgnoreThreadButtonText(threadIsIgnored);
    
    let buttons = document.getElementsByClassName('toggleIgnoreThreadButton');

    for (let btn of buttons) {
        btn.innerHTML = text;
    }
}

function GetThisThreadId() {
    let docLinks = document.head.getElementsByTagName("link");
    // Extract the thread ID from the end of the canonical link href
    let idRegex = /\/threads\/[^\/]+\.(\d+)\//;

    for (let i = 0; i < docLinks.length; i++) {
        if (docLinks[i].rel == "canonical") {
            let href = docLinks[i].href;
            if (href) {
                let found = href.match(idRegex);
                if (found)
                    return found[1];
                else
                    return;
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////

function supportsLocalStorageAndCustomProperties() {
    let supportsLocalStorage = storageAvailable('localStorage');
    let supportsCustomProperties = window.CSS && CSS.supports('color', 'var(--primary)');
    
    return supportsLocalStorage && supportsCustomProperties;
}

/* Function to test whether local storage is available to use.
   Can check for localStorage and sessionStorage. */
function storageAvailable(type) {
    try {
        let storage = window[type], x = '__storage_test__';
        let users = storage.getItem("ignoredUsers");
        if (!users) {
            storage.setItem(x, x);
            storage.removeItem(x);
        }
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

// Fake JSON response from the server
function mockRequest() {
    return '{ "ignoredUsers": ["EarthScorpion", "Arcus2611", "Xon"], "ignoredThreads": ["38832"] }';
}


