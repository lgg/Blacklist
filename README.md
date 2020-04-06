# Blacklist websites Chrome Extension

**README IS OUTDATED**

**WORK IN PROGRESS**

This is a very simple extension for Google Chrome. When you find yourself on a website that is taking too much of your time, simply hit the Blacklist button in the upper right corner of Chrome and you will be blocked from visiting that site while Blacklist remains active. To resume visiting any site blocked by Blacklist, you must visit the site, click the Blacklist extension button in the upper right corner of the browser, and then click the "unlist" button. You will be forced to wait for 15 seconds before the site is unlisted and you are redirected to the root url.
 
This extension is released for free in and can be installed directly from the Chrome store at https://chrome.google.com/webstore/detail/blacklist/jbpccandodannohfaoncogijbkfcmpgo?hl=en&gl=US.
Alternatively, to install this extension directly from the source, download the code from GitHub, extract it, and then add it to Chrome as detailed in step 4 of Create and Load Extensions on this page: http://developer.chrome.com/extensions/getstarted.html.
 
To completely disable Blacklist, return to chrome://extensions and uncheck the box next to Blacklist.

## Installation

* install it as unpacked extension in Developer mode

## Roadmap

* settings page (edit blocked sites)
* add time ranges for blocking sites (time, dates range, workdays/holidays, for next 30 days (detox :) )
* count site visit attempts (total, today, last 24 hours)
    * create dynamic visualization
    * optional show it on blocked page
* add "one time allow button"
    * and reason (tags) why u allowed to show this website for this time
        * like: `work`, `study article` and others (come up with some)
* store history of visited pages attempts
* improve installation docs
* upload to chrome store
* post on habr/vc

## License

* MIT, 2020
* Author of original project: [Rahul Gupta-Iwasaki](https://github.com/rahulgi)
* Author of current project: [lgg](https://github.com/lgg)
