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

/**
 * Create the SV namespace, if it does not already exist.
 */
var SV = SV || {};

/** @param {jQuery} $ jQuery Object */
!function($, window, document, _undefined)
{
    'use strict';

    if (!supportsLocalStorageAndCustomProperties())
        return;

    var ignoreUrl = `${window.location.protocol}//${window.location.hostname}/account/ignored.json`;

    window.addEventListener('storage', storageChanged);

    updateIgnoredEntities();

    document.addEventListener('DOMContentLoaded', makeButtonsOnLoad, false);


///////////////////////////////////////////////////////////////////////////////

function storageChanged(e) {
    if (e.key === "ignoredUsers" || e.key === "ignoredThreads") {
        createCSS();
    }
    else if (e.key === "ignoredExpiration") {
        // TODO: abort update attempts from this page
    }
}

function updateIgnoredEntities(){
    let expirationOffset = 21600000; // 6 hours
    let newExpiration = String(Date.now() + expirationOffset);

    let expiration = localStorage.getItem("ignoredExpiration");

    if (!expiration || Date.now() > expiration) {
        localStorage.setItem("ignoredExpiration", newExpiration);
        let delay = Math.random() * 300 + 200;
        setTimeout(function() {
            let checkExpiration = localStorage.getItem("ignoredExpiration");
            if (checkExpiration == newExpiration) {
                requestIgnoreData();
            }
        }, delay);
    } else {
        createCSS();
    }
}

function requestIgnoreData() {
    XenForo.ajax(ignoreUrl, {'r':1}, function(ajaxData, textStatus) {
        if (XenForo.hasResponseError(ajaxData))
        {
            return false;
        }
        updateLocalStorage(ajaxData);
    });

    function updateLocalStorage(ignored) {
        if (ignored && ignored.ignoredUsers) {
            localStorage.setItem("ignoredUsers", String(ignored.ignoredUsers));
        }
        createCSS();
    }
}

///////////////////////////////////////////////////////////////////////////////

var threadIgnoreCSS;
var userIgnoreCSS;

function createCSS() {
    removeCSS(userIgnoreCSS);
    userIgnoreCSS = createCssToIgnoreUsers();
    applyCSS(userIgnoreCSS);

    removeCSS(threadIgnoreCSS);
    threadIgnoreCSS = createCssToIgnoreThreads();
    applyCSS(threadIgnoreCSS);

    makeButtons(false);
}

function applyCSS(css) {
    let element = document.createElement("style");
    element.type = "text/css";
    element.innerHTML = css;
    document.head.appendChild(element);
}

function removeCSS(css) {
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

function createCssToIgnoreUsers() {
    let users = getIgnoredUsers();
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

function createCssToIgnoreThreads() {
    let threads = getIgnoredThreadIds();
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

function detach() {
    try {
        document.removeEventListener('DOMContentLoaded', makeButtonsOnLoad, false);
    } catch (e) {
        // Ignore.  Possibly window closing.
    }
}

function makeButtonsOnLoad() {
    detach();
    makeButtons(true);
}

function makeButtons(onLoad) {
    // If we got here before the page finished loading, skip and wait for
    // the event listener.
    if (!onLoad) {
        if (document.readyState != 'complete') {
            return;
        }
    }

    makeButtonsToHideThread();
    makeButtonsToShowIgnoredInfo();
}

///////////////////////////////////////////////////////////////////////////////

function makeButtonsToShowIgnoredInfo() {
    let visible;

    if (isThreadView()) {
        visible = pageHasIgnoredPosts();
    } else if (isForumView()) {
        visible = pageHasIgnoredThreads();
    } else {
        return;
    }

    let showingButtons = findIgnoreButtons("showing");

    if (showingButtons.length > 0) {
        for (let i = 0; i < showingButtons.length; i++) {
            if (visible)
                showingButtons[i].classList.remove("hidden");
            else
                showingButtons[i].classList.add("hidden");
        }

        return;
    }

    let navGroups = document.getElementsByClassName('pageNavLinkGroup');

    for (let nav of navGroups) {
        let button = document.createElement('button');
        button.className = "button ignore-button";
        if (!visible)
            button.classList.add("hidden");
        button.addEventListener('click', toggleShowingIgnoredEntities);
        button.innerHTML = getShowIgnoredButtonText(true, isThreadView())
        button.setAttribute("data-ignore", "showing");
        nav.appendChild(button);
    }
}

function makeButtonsToHideThread() {
    if (!isThreadView()) {
        return;
    }

    let isIgnored = isThreadIgnored();
    let ignoringButtons = findIgnoreButtons("ignoring");

    if (ignoringButtons.length > 0) {
        for (let i = 0; i < ignoringButtons.length; i++) {
            ignoringButtons[i].innerHTML = getIgnoreThreadButtonText(isIgnored);
        }

        return;
    }

    let navGroups = document.getElementsByClassName('pageNavLinkGroup');

    for (let nav of navGroups) {
        let button = document.createElement('button');
        button.className = "button ignore-button";
        button.addEventListener('click', toggleIgnoringThread);
        button.innerHTML = getIgnoreThreadButtonText(isIgnored);
        button.setAttribute("data-ignore", "ignoring");
        nav.appendChild(button);
    }
}

///////////////////////////////////////////////////////////////////////////////

function toggleShowingIgnoredEntities() {
    let parentElement = getIgnoredParentElement(isThreadView());

    if (parentElement) {
        let revealed = parentElement.classList.toggle('showIgnored');
        setTextOfShowIgnoreButtons(!revealed, isThreadView());
    }
}

function toggleIgnoringThread() {
    let num = getThisThreadNumber();
    if (num) {
        let threads = getIgnoredThreadNumbers();

        let index = threads.indexOf(num);
        let threadIsIgnored = index >= 0;

        // If it doesn't exist, add it; otherwise, remove it.
        if (threadIsIgnored) {
            threads.splice(index, 1);
        } else {
            threads.push(num);
        }

        localStorage.setItem("ignoredThreads", String(threads));
        setTextOfIgnoreThreadButtons(!threadIsIgnored);
    }
}

///////////////////////////////////////////////////////////////////////////////

function findIgnoreButtons(dataVal) {
    let buttons = [];
    let navGroups = document.getElementsByClassName('pageNavLinkGroup');

    if (navGroups) {
        for (let nav of navGroups) {
            let navButtons = nav.getElementsByTagName("button");
            for (let i = 0; i < navButtons.length; i++) {
                if (navButtons[i].getAttribute("data-ignore") === dataVal) {
                    buttons.push(navButtons[i]);
                }
            }
        }
    }

    return buttons;
}

function setTextOfIgnoreThreadButtons(threadIsIgnored) {
    let text = getIgnoreThreadButtonText(threadIsIgnored);

    let buttons = findIgnoreButtons("ignoring");

    for (let btn of buttons) {
        btn.innerHTML = text;
    }
}

function setTextOfShowIgnoreButtons(isIgnored, ignoreType) {
    let text = getShowIgnoredButtonText(isIgnored, ignoreType);

    let buttons = findIgnoreButtons("showing");

    for (let btn of buttons) {
        btn.innerHTML = text;
    }
}

function getIgnoreThreadButtonText(isIgnored) {
    return isIgnored ? "Unignore Thread" : "Ignore Thread";
}

function getShowIgnoredButtonText(isIgnored, isThreadView) {
    return `${isIgnored ? "Show" : "Hide"} Ignored ${isThreadView ? "Users" : "Threads"}`;
}

function getIgnoredParentElement(isThreadView) {
    if (isThreadView) {
        return document.getElementById('messageList');
    } else {
        return document.getElementsByClassName('discussionListItems')[0];
    }
}

///////////////////////////////////////////////////////////////////////////////

function isThreadView() {
    let content = document.getElementById('content');
    return (content.className == "thread_view");
}

function isForumView() {
    let content = document.getElementById('content');
    return (content.className == "forum_view");
}

function isThreadIgnored() {
    let num = getThisThreadNumber();
    let threads = getIgnoredThreadNumbers();
    let index = threads.indexOf(num);

    return (index >= 0);
}

function pageHasIgnoredPosts() {
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

function pageHasIgnoredThreads() {
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

function getIgnoredUsers() {
    let users = localStorage.getItem("ignoredUsers");
    if (users) {
        return users.split(",");
    }
    return [];
}

function getIgnoredThreadNumbers() {
    let threads = localStorage.getItem("ignoredThreads");
    if (threads) {
        return threads.split(",");
    }
    return [];
}

function getIgnoredThreadIds() {
    let threads = getIgnoredThreadNumbers();
    for (let i = 0; i < threads.length; i++) {
        threads[i] = `thread-${threads[i]}`;
    }
    return threads;
}

function getThisThreadNumber() {
    // Extract the thread ID number from the end of the canonical link href
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
    let supportsLocalStorage = hasStorageAvailable('localStorage');
    let supportsCustomProperties = window.CSS && CSS.supports('color', 'var(--primary)');

    return supportsLocalStorage && supportsCustomProperties;
}

/* Function to test whether local storage is available to use.
   Can check for localStorage and sessionStorage. */
function hasStorageAvailable(type) {
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

}
(jQuery, this, document);