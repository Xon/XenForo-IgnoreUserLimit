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

    window.addEventListener('storage', StorageChanged);

    UpdateIgnores();

    document.addEventListener('DOMContentLoaded', MakeButtonsOnLoad, false);


///////////////////////////////////////////////////////////////////////////////

function StorageChanged(e) {
    if (e.key === "ignoredUsers" || e.key === "ignoredThreads") {
        CreateCSS();
    }
    else if (e.key === "ignoredExpiration") {
        // abort update attempts from this page
    }
}

function UpdateIgnores(){
    let skipUpdate = true;
    if (skipUpdate) {
        CreateCSS();
        return;
    }

    let expirationOffset = 21600000; // 6 hours
    let newExpiration = String(Date.now() + expirationOffset);
    
    let expiration = localStorage.getItem("ignoredExpiration");
    
    if (!expiration || Date.now() > expiration) {
        localStorage.setItem("ignoredExpiration", newExpiration);
        let delay = Math.random() * 1500 + 200;
        setTimeout(function() {
            let checkExpiration = localStorage.getItem("ignoredExpiration");
            if (checkExpiration == newExpiration) {
                RequestUpdatedIgnores();
            }
        }, delay);
    } else {
        CreateCSS();
    }
}

function RequestUpdatedIgnores() {
    console.log("RequestUpdatedIgnores");

    let xmlhttp = new XMLHttpRequest();
    var url = "https://forums.sufficientvelocity.com/account/ignored.json";

    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let ignored = JSON.parse(this.responseText);
            UpdateLocalStorage(ignored);
        }
    };
    
    xmlhttp.open("GET", url, true);
    xmlhttp.send();

    function UpdateLocalStorage(ignored) {
        // TODO: Find actual format of JSON response
        if (ignored && ignored.ignoredUsers) {
            localStorage.setItem("ignoredUsers", String(ignored.ignoredUsers));
        }
        CreateCSS();
    }
}

///////////////////////////////////////////////////////////////////////////////

var threadIgnoreCSS;
var userIgnoreCSS;

function CreateCSS() {
    RemoveCSS(userIgnoreCSS);
    userIgnoreCSS = CreateUserIgnoreCSS();
    ApplyCSS(userIgnoreCSS);
    
    RemoveCSS(threadIgnoreCSS);
    threadIgnoreCSS = CreateThreadIgnoreCSS();
    ApplyCSS(threadIgnoreCSS);
    
    MakeButtons(false);
}

function ApplyCSS(css) {
    let element = document.createElement("style");
    element.type = "text/css";
    element.innerHTML = css;
    document.head.appendChild(element);    
}

function RemoveCSS(css) {
    if (css) {
        let styleTags = document.head.getElementsByTagName("style");
        
        for (let i = 0; i < styleTags.length; i++) {
            if (styleTags[i].innerHTML == css) {
                document.head.removeChild(styleTags[i]);
                break;
            }
        }
    }
}

function CreateUserIgnoreCSS() {
    let users = GetIgnoredUsers();
    let cssText = "";
    
    // Create CSS for ignored user names.
    if (users.length > 0)
    {
        let postBlock = "";
        let quoteBlock = "";
        let nextLine = "";
        
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
    
    
        /* Put everything inside a check for custom property support */
        cssText = `@supports (--css: variables) {
${postBlock}
${quoteBlock}
}`;    
    }
    
    return cssText;
}

function CreateThreadIgnoreCSS() {
    let threads = GetIgnoredThreadIds();
    let cssText = "";

    // Create CSS for ignored threads.
    if (threads.length > 0)
    {
        // Open support block
        cssText = `@supports (--css: variables) {\n`;
        
        let nextLine = "";
        
        /* Build up the name selectors for posts and quotes */
        for (let thread of threads) {
            cssText += `${nextLine}    li[id="${thread}"]`;
            nextLine = ",\n";
        }
        
        /* Define the rules for each */
        cssText += ` {
        --ignored-thread-display: none;
        --ignored-thread-message: "You are ignoring this thread.";
        --ignored-thread-message-display: block;
    }\n`;
        
        // Close support block
        cssText += "}";
    }

    return cssText;
}

///////////////////////////////////////////////////////////////////////////////

function GetIgnoredUsers() {
    let users = localStorage.getItem("ignoredUsers");
    if (users) {
        return users.split(",");
    }
    return [];
}

function GetIgnoredThreadNumbers() {
    let threads = localStorage.getItem("ignoredThreads");
    if (threads) {
        return threads.split(",");
    }
    return [];
}

function GetIgnoredThreadIds() {
    let threads = GetIgnoredThreadNumbers();
    for (let i = 0; i < threads.length; i++) {
        threads[i] = `thread-${threads[i]}`;
    }
    return threads;
}

///////////////////////////////////////////////////////////////////////////////

function detach() {
    try {
        document.removeEventListener('DOMContentLoaded', MakeButtonsOnLoad, false);
    } catch (e) {
        // Ignore.  Possibly window closing.
    }
}

function MakeButtonsOnLoad() {
    detach();
    MakeButtons(true);
}

function MakeButtons(onLoad) {
    // If we got here before the page finished loading, skip and wait for
    // the event listener.
    if (!onLoad) {
        if (document.readyState != 'complete') {
            return;
        }
    }
    
    MakeShowIgnoredButtons();
    MakeHideThreadButtons();
}

///////////////////////////////////////////////////////////////////////////////

function MakeShowIgnoredButtons() {
    let showContentFn;
    let whatToShow;
    let visible;
    
    if (IsThreadView()) {
        showContentFn = function() {
            ToggleIgnoredEntries(document.getElementById('messageList'));
        };
        whatToShow = "Users";
        visible = PageHasIgnoredPosts();
    } else if (IsForumView()) {
        showContentFn = function() {
            ToggleIgnoredEntries(document.getElementsByClassName('discussionListItems')[0]);
        };
        whatToShow = "Threads";
        visible = PageHasIgnoredThreads();
    } else {
        return;
    }
    
    let buttonClass = visible ? "button" : "hidden button";
    
    let showingButtons = GetIgnoreButtons("showing");
    
    if (showingButtons.length > 0) {
        for (let i = 0; i < showingButtons.length; i++) {
            showingButtons[i].className = buttonClass;
        }
        
        return;
    }
    
    let navGroups = document.getElementsByClassName('pageNavLinkGroup');

    for (let nav of navGroups) {
        let button = document.createElement('button');
        button.className = buttonClass;
        button.addEventListener('click', showContentFn);
        button.innerHTML = 'Show Ignored ' + whatToShow;
        button.setAttribute("data-ignore", "showing");
        nav.appendChild(button);
    }
}

function MakeHideThreadButtons() {
    if (!IsThreadView()) {
        return;
    }

    let isIgnored = IsThreadIgnored();
    let ignoringButtons = GetIgnoreButtons("ignoring");
    
    if (ignoringButtons.length > 0) {
        for (let i = 0; i < ignoringButtons.length; i++) {
            ignoringButtons[i].innerHTML = IgnoreThreadButtonText(isIgnored);
        }
        
        return;
    }

    let navGroups = document.getElementsByClassName('pageNavLinkGroup');

    for (let nav of navGroups) {
        let button = document.createElement('button');
        button.className = "button";
        button.addEventListener('click', ToggleThreadIgnore);
        button.innerHTML = IgnoreThreadButtonText(isIgnored);
        button.setAttribute("data-ignore", "ignoring");
        nav.appendChild(button);
    }
}

///////////////////////////////////////////////////////////////////////////////

function GetIgnoreButtons(dataVal) {
    let buttons = [];
    let navGroups = document.getElementsByClassName('pageNavLinkGroup');

    for (let nav of navGroups) {
        let navButtons = nav.getElementsByTagName("button");
        for (let i = 0; i < navButtons.length; i++) {
            if (navButtons[i].getAttribute("data-ignore") === dataVal) {
                buttons.push(navButtons[i]);
            }
        }
    }
    
    return buttons;
}

function ToggleIgnoredEntries(parentElement) {
    if (parentElement) {
        parentElement.classList.toggle('showIgnored');

        let buttons = GetIgnoreButtons("showing");

        for (let i = 0; i < buttons.length; i++) {
            let cmd = buttons[i].innerHTML.slice(0,4) === 'Show' ? 'Hide' : 'Show';
            buttons[i].innerHTML = `${cmd}${buttons[i].innerHTML.slice(4)}`;
        }
    }
}

///////////////////////////////////////////////////////////////////////////////

function IsThreadView() {
    let content = document.getElementById('content');
    return (content.className == "thread_view");
}

function IsForumView() {
    let content = document.getElementById('content');
    return (content.className == "forum_view");
}

function IsThreadIgnored() {
    let id = GetThisThreadId();
    let threads = GetIgnoredThreadNumbers();
    let index = threads.indexOf(id);
    
    return (index >= 0);
}

function PageHasIgnoredPosts() {
    let messageList = document.getElementById('messageList');
    if (messageList) {
        let posts = messageList.children;
        for (let i = 0; i < posts.length; i++) {
            let val = getComputedStyle(posts[i]).getPropertyValue('--ignored-post-display');
            if (val !== null && val != "") {
                return true;
            } else {
                let quotes = posts[i].getElementsByClassName('bbCodeQuote');
                for (let i = 0; i < quotes.length; i++) {
                    let val = getComputedStyle(quotes[i]).getPropertyValue('--ignored-quote-display');
                    if (val !== null && val != "") {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

function PageHasIgnoredThreads() {
    let threads = document.getElementsByClassName('discussionListItem')

    for (let i = 0; i < threads.length; i++) {
        let val = getComputedStyle(threads[i]).getPropertyValue('--ignored-thread-display');
        if (val !== null && val != "") {
            return true;
        }
    }
    
    return false;
}

///////////////////////////////////////////////////////////////////////////////

function ToggleThreadIgnore() {
    let id = GetThisThreadId();
    if (id) {
        let threads = GetIgnoredThreadNumbers();
        
        let index = threads.indexOf(id);
        let threadIsIgnored = index >= 0;

        // If it doesn't exist, add it; otherwise, remove it.
        if (threadIsIgnored) {
            threads.splice(index, 1);
        } else {
            threads.push(id);
        }
        
        localStorage.setItem("ignoredThreads", String(threads));
        UpdateToggleButtons(!threadIsIgnored);
    }
}


function IgnoreThreadButtonText(threadIsIgnored) {
    if (threadIsIgnored === true) {
        return "Unignore Thread";
    } else if (threadIsIgnored === false) {
        return "Ignore Thread";
    } else {
        return IgnoreThreadButtonText(IsThreadIgnored());
    }
}

function UpdateToggleButtons(threadIsIgnored) {
    let text = IgnoreThreadButtonText(threadIsIgnored);
    
    let ignoringButtons = GetIgnoreButtons("ignoring");

    for (let btn of ignoringButtons) {
        btn.innerHTML = text;
    }
}

///////////////////////////////////////////////////////////////////////////////


function GetThisThreadId() {
    // Extract the thread ID from the end of the canonical link href
    let idRegex = /\/threads\/[^\/]+\.(\d+)\//;

    let docLinks = document.head.getElementsByTagName("link");
    
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
        // Shortcut test if we've already used local storage.
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

}) ();