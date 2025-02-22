/*
 * License information at https://github.com/Caltech-IPAC/firefly/blob/master/License.txt
 */
import {isPlainObject, truncate} from 'lodash';
import {getOrCreateWsConn} from '../core/messaging/WebSocketClient.js';
import {ServerParams} from '../data/ServerParams.js';
import {showInfoPopup} from '../ui/PopupUtil.jsx';
import {DownloadProgress, getDownloadProgress} from '../rpc/SearchServicesJson.js';
import {logger} from './Logger.js';
import {parseUrl, AJAX_REQUEST, lowLevelDoFetch, REQUEST_WITH, WS_CHANNEL_HD, WS_CONNID_HD} from './WebUtil.js';


/**
 * A wrapper for the underlying window.fetch function.
 * see https://github.com/github/fetch for usage.
 * see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API for current status on the API
 * see https://fetch.spec.whatwg.org/ for official standard
 *
 * This function applies default behaviors before fetching.
 *
 * @param {string} url the URL to connect
 * @param {Object} options
 * @param {Object} options.params a parameter map to send along with the request.  It does not need to
 *                                  be encoded.  Base on the method used, it will be handled internally.
 * @param {string} options.method can be one of get, post, or multipart
 *                                when 'multipart', it will post with 'multipart/form-data' encoding.
 * @param {boolean} doValidation
 * @param {boolean} [enableDefOptions= true]
 * @return {Promise} a promise of the response when successful, or reject with an Error.
 */
export async function fetchUrl(url, options={}, doValidation = true, enableDefOptions = true) {

    if (!url) return;

    // define defaults request options
    if (!enableDefOptions) return lowLevelDoFetch(url, options, doValidation, logger?.tag('fetchUrl').debug);
    const {connId, channel}= await getOrCreateWsConn();
    const optionsWithDef= {
        method: 'get',
        mode: 'cors',
        credentials: 'include',
        cache: 'default',
        ...options,
        headers: {
            [WS_CHANNEL_HD]: channel,
            [WS_CONNID_HD]: connId,
            [REQUEST_WITH]: AJAX_REQUEST,
            ...options.headers
        }
    };
    return lowLevelDoFetch(url, optionsWithDef, doValidation, logger?.tag('fetchUrl').debug);
}


/**
 * @param {string} url  the url to download.  It should be based on AnyFileDownload
 * @param {number} [numTries=1000]  number of time to check for progress until giving up
 * @returns {Promise}  resolve is called on DONE and reject when FAIL.
 */
export function downloadWithProgress(url, numTries = 1000) {
    return new Promise((resolve, reject) => {
        const {search} = parseUrl(url);
        let cnt = 0;
        const doIt = () => {
            const interval = Math.min(5000, Math.pow(2, 2 * cnt / 10) * 1000);  //gradually increase between 1 and 5 secs
            console.log('Interval: ' + interval);
            setTimeout(async () => {
                cnt++;
                const v= await getDownloadProgress(search);
                if (DownloadProgress.DONE.is(v)) {
                    resolve(v);
                } else if (DownloadProgress.FAIL.is(v)) {
                    reject(v);
                } else {
                    cnt < numTries ? doIt() : reject(`Number of tries(${numTries}) exceeded without results`);
                }
            }, interval);
        };
        doIt();
        download(url);
    });
}

export function downloadBlob(blob, filename) {
    if (!blob) return;
    window.URL = window.URL || window.webkitURL;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
}

/**
 * return the filename from the Content-Disposition header or undefined
 * @param resp - fetch response
 * @return {string|undefined}
 */
function resolveFileName(resp) {
    if (resp && resp.headers) {
        const cd = resp.headers.get('Content-Disposition') || '';
        const parts = cd.match(/.*filename=(.*)/);
        const possibleName= (parts && parts.length > 1) ? parts[1] : undefined;
        return possibleName?.indexOf('?')>4 ? possibleName.split('?')[0] : possibleName;
    }
}

export async function download(url, filename) {
    const {protocol, host, path, hash, searchObject = {}} = parseUrl(url);
    const cmd = searchObject[ServerParams.COMMAND];
    url = cmd ? `${protocol}//${host}${path}?${ServerParams.COMMAND}=${cmd}` + (hash ? '#' + hash : '') : url;// add cmd into the url as a workaround for server-side code not supporting it

    const params = Object.fromEntries(
        Object.entries(searchObject)
            .map(([k, v]) => [k, (isPlainObject(v) ? JSON.stringify(v) : v)]));          // convert object back into JSON if needed.

    try {
        const resp= await fetchUrl(url, {method: 'post', params});
        filename = filename || resolveFileName(resp);
        downloadBlob(await resp.blob(), filename);
    } catch ({message}) {
        showInfoPopup(truncate(message, {length: 200}), 'Unexpected error');
    }
}