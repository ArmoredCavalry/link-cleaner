// Code that is shared across normal Link Cleaner and bulk mode

// Function for cleaning links
function cleanLink(link, youtubeShortenEnabled = false, fixTwitterEnabled = false, pskyEnabled = false, amazonTrackingId = localStorage['amazon-tracking-id']) {
    try {
        var oldLink = new URL(link)
    } catch (e) {
        // TypeError rasied if not identified as URL, try stripping "Page Title"
        if (e instanceof TypeError) {
            var oldLink = new URL(link.split(/"(?:[^\\"]|\\.)*"/)[1].trim())
        }
    }
    console.log('Old link:', oldLink)
    // Fixes for various link shorteners/filters
    if ((oldLink.host === 'l.facebook.com') && oldLink.searchParams.has('u')) {
        // Fix for Facebook shared links
        var facebookLink = decodeURI(oldLink.searchParams.get('u'))
        oldLink = new URL(facebookLink)
    } else if ((oldLink.host === 'href.li')) {
        // Fix for href.li links
        var hrefLink = oldLink.href.split('?')[1]
        oldLink = new URL(hrefLink)
    } else if ((oldLink.host === 'www.google.com') && (oldLink.pathname === '/url') && (oldLink.searchParams.has('url'))) {
        // Fix for redirect links from Google Search (#29)
        oldLink = new URL(oldLink.searchParams.get('url'))
    }
    // Generate new link
    var newLink = new URL(oldLink.origin + oldLink.pathname)
    // Don't remove 'q' parameter
    if (oldLink.searchParams.has('q')) {
        newLink.searchParams.append('q', oldLink.searchParams.get('q'))
    }
    // Don't remove ID parameter for Macy's links (#21)
    if (oldLink.host.includes('macys.com') && oldLink.searchParams.has('ID')) {
        newLink.searchParams.append('ID', oldLink.searchParams.get('ID'))
    }
    // Don't remove 'v' (video id) and 't' (time position) for YouTube links
    if (oldLink.host.includes('youtube.com') && oldLink.searchParams.has('v')) {
        newLink.searchParams.append('v', oldLink.searchParams.get('v'))
        newLink.searchParams.append('t', oldLink.searchParams.get('t'))
    }
    // Don't remove required variables for Facebook links
    if (oldLink.host.includes('facebook.com') && oldLink.pathname.includes('story.php')) {
        newLink.searchParams.append('story_fbid', oldLink.searchParams.get('story_fbid'))
        newLink.searchParams.append('id', oldLink.searchParams.get('id'))
    }
    // Remove extra information for Amazon shopping links
    if (oldLink.host.includes('amazon') && (oldLink.pathname.includes('/dp/') || oldLink.pathname.includes('/product/'))) {
        newLink.hostname = newLink.hostname.replace('www.', '') // Amazon doesn't need www.
        var regex = /(?:\/dp\/|\/product\/)(\w*|\d*)/g
        var amazonID = regex.exec(oldLink.pathname)[1]
        if (amazonID) {
            newLink.pathname = '/dp/' + amazonID
        }
    }
    // Shorten YouTube links if enabled
    if (oldLink.host.includes('youtube.com') && youtubeShortenEnabled) {
        newLink.host = 'youtu.be'
        newLink.pathname = '/' + oldLink.searchParams.get('v')
        newLink.searchParams.delete('v')
    }
    // Use FixTwitter if enabled
    if ((oldLink.host.includes('twitter.com') || oldLink.host.includes('x.com')) && fixTwitterEnabled) {
        newLink.host = 'fxtwitter.com'
    }
    // Use psky.app if enabled
    if (oldLink.host.includes('bsky.app') && pskyEnabled) {
        newLink.host = 'psky.app'
    }
    // Add Amazon affiliate code if enabled
    if (oldLink.host.includes('amazon') && amazonTrackingId) {
        newLink.searchParams.append('tag', amazonTrackingId)
    }
    // Save to history
    addToHistory(newLink)
    // Switch to output
    console.log('New link:', newLink)
    return newLink.toString()
}

// Function for adding result to link clean history
function addToHistory(link) {
    var linkArray = []
    // Get current value if available
    if (localStorage.getItem('history')) {
        try {
            linkArray = JSON.parse(localStorage.getItem('history'))
        } catch {
            // Saved storage only has one value so it's not valid JSON
            linkArray.push(localStorage.getItem('history'))
        }
    }
    linkArray.unshift(link)
    // Don't exceed 100 links
    if (linkArray.length > 100) {
        linkArray.splice(-1)
    }
    // Save back to localStorage
    try {
        localStorage.setItem('history', JSON.stringify(linkArray))
    } catch (e) {
        // localStorage might be full, try deleting some items and try again
        linkArray.splice(arr1.length - 10, 10)
        localStorage.setItem('history', JSON.stringify(linkArray))
    }
}