function onUpdated(workmode, changeInfo, tab) {
    if (workmode && workmode !== undefined && workmode === 'all') {
        if (changeInfo !== undefined && changeInfo.status === "complete") {
            verify(tab.url);
        }
    } else {
        chrome.browserAction.setBadgeText({text: ''});
    }
}

function onActivated(workmode, activeInfo) {
    if (workmode && workmode !== undefined && workmode === 'all') {
        chrome.tabs.query({active: true}, function(tab){
            if (tab !== undefined ) {
                // do this to get the correct tab (the user may have detached tabs)
                for (var i = tab.length - 1; i >= 0; i--) {
                    if (tab[i].id === activeInfo.tabId) {
                        verify(tab[i].url);
                    }
                }
            }
        });
    } else {
        chrome.browserAction.setBadgeText({text: ''});
    }
}

function onClicked(workmode, tab) {
    if (workmode && workmode !== undefined && workmode === 'ondemand'){
        if (tab.status && tab.status !== undefined) {
            if (tab.status === "complete") {
                verify(tab.url);
            }
        }
    }

}

function verify(url) {
    if (url !== '') {
        var notesTransport = new Thrift.Transport(Eventnote.Auth.oauth.getParameter(Eventnote.Auth.note_store_url_param));
        var notesProtocol = new Thrift.Protocol(notesTransport);
        var noteStore = new NoteStoreClient(notesProtocol, notesProtocol);
        if (!noteStore) {
            console.log("connection failure during getting note store");
            return;
        }

        var filter = new NoteFilter();
        filter.words = "sourceURL:" + url + "*";
        var results = noteStore.findNotes(Eventnote.Auth.get_auth_token(), filter, 0, 100);
        var notes = results.notes;
        var totalNotes = 0;
        for (var i in notes) {
            totalNotes++;
        }

        if (totalNotes === 0) {
            chrome.browserAction.setBadgeText({text: 'no'});
        } else {
            chrome.browserAction.setBadgeText({text: 'yes:' + totalNotes});
        }
    }
}


$(function() {
    //listen for current tab to be changed
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        chrome.storage.sync.get('everduworkmode', function (items) {
            onUpdated(items.everduworkmode, changeInfo, tab);
        });
    });

    //listen for new tab to be activated (when clicked but not refreshed)
    chrome.tabs.onActivated.addListener(function(activeInfo) {
        chrome.storage.sync.get('everduworkmode', function (items) {
            onActivated(items.everduworkmode, activeInfo);
        });
    });

    // when clicked, perform a url verify
    chrome.browserAction.onClicked.addListener(function(tab){
        chrome.storage.sync.get('everduworkmode', function (items){
            onClicked(items.everduworkmode, tab);
        });
    });

    // work mode, by default, is to check every url (can be changed on the popup.html)
    chrome.storage.sync.set({ 'everduworkmode': 'all' });

    // se the default icon (gray = not connected)
    chrome.browserAction.setIcon({path:"../images/Evernote-off.png"});
    chrome.browserAction.setBadgeText({text: "X"});

    // login to evernote using oatuh
    Eventnote.Auth.authenticate(function(){
        // change the icon and remove badge text
        chrome.browserAction.setIcon({path:"../images/Evernote-on.png"});
        chrome.browserAction.setBadgeText({text: ''});
    });
});