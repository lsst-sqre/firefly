

/**
 * @global
 * @public
 * @typedef {Object} DataProductsDisplayType
 * @prop {string} displayType one of 'image', 'message', 'promise', 'table', 'png', 'download, 'xyplot', 'analyze'
 * @prop {String} menuKey - unique key of this item
 * @prop {Function} [activate] - function to plot 'image', 'table', 'xyplot', require for those
 * @prop {String} [url] - required if display type is 'png' or 'download'
 * @prop {String} [message] - required it type is 'message' or 'promise'
 * @prop {String} [name]
 * @prop {WebPlotRequest} [request]
 * @prop {boolean} [isWorkingState] - if defined this means we are in a transitive/loading state. expect regular updates
 * @prop {Promise} [promise] - required it type is 'promise'
 * @prop {Array.<DataProductsDisplayType>|undefined} menu - if defined, then menu to display
 *
 */


/**
 * @global
 * @public
 * @typedef {Object} DataProductsFileMenu
 * @prop {Object} fileAnalysis
 * @prop {String} activeItemLookUpKey
 * @prop {Array.<DataProductsDisplayType>|undefined} menu - if defined, then menu to display
 *
 */


export const DPtypes= {
    MESSAGE: 'message',
    SEND_TO_BROWSER: 'send-to-browser',
    PROMISE: 'promise',
    IMAGE: 'image',
    IMAGE_SNGLE_AXIS: 'image-single-axis',
    TABLE: 'table',
    CHART: 'xyplot',
    CHOICE_CTI: 'chartTable',
    DOWNLOAD: 'download',
    DOWNLOAD_MENU_ITEM: 'download-menu-item',
    PNG: 'png',
    ANALYZE: 'analyze',
};


export const SHOW_CHART='showChart';
export const SHOW_TABLE='showTable';
export const SHOW_IMAGE='showImage';
export const AUTO='auto';

/**
 *
 * @param {String} message
 * @param {Array.<DataProductsDisplayType>|undefined} [menu] - if defined, then menu to display
 * @param {Object} extra - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export function dpdtMessage(message, menu= undefined, extra={}) {
    return {displayType:DPtypes.MESSAGE, message, menu, menuKey:'message-0', ...extra};
}

/**
 *
 * @param {String} message
 * @param {WebPlotRequest} [request]
 * @param {Object} [extra]
 * @param {String} [rootMessage] will default to message
 * @return {DataProductsDisplayType}
 */
export function dpdtWorkingMessage(message,request, extra={}, rootMessage=undefined) {
    return {displayType:DPtypes.MESSAGE, message, rootMessage:rootMessage||message, menuKey:'working-0',
        isWorkingState:true, menu:undefined, ...extra};
}

/**
 *
 * @param {String} message
 * @param {Promise} promise
 * @param {WebPlotRequest} [request]
 * @param {Object} [extra]
 * @param {String} [rootMessage] will default to message
 * @return {DataProductsDisplayType}
 */
export function dpdtWorkingPromise(message,promise,request=undefined, extra={}, rootMessage=undefined) {
    return {
        displayType:DPtypes.PROMISE,
        promise,
        message,
        request,
        rootMessage:rootMessage||message, menuKey:'working-promise-0',
        isWorkingState:true,
        menu:undefined, ...extra
    };
}

export const dpdtSendToBrowser= (url, extra={}) => {
    return {displayType:DPtypes.SEND_TO_BROWSER, url, ...extra};
}

/**
 *
 * @param {String} message
 * @param {String} titleStr download title str
 * @param {String} url download url
 * @param {String} [fileType]
 * @param {Object} [extra] - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export const dpdtMessageWithDownload= (message,titleStr, url,fileType=undefined, extra={}) => {
    const singleDownload= Boolean(titleStr && url);
    return dpdtMessage(message,singleDownload ?[dpdtDownload(titleStr,url,'download-0',fileType)] : undefined,{singleDownload,...extra} );
};

export const dpdtMessageWithError= (message,detailMsgAry) => {
    return dpdtMessage(message,undefined,{complexMessage:true, detailMsgAry} );
};

/**
 *
 * @param {string} name
 * @param {Function} activate
 * @param {number|string} menuKey
 * @param {Object} extra - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export function dpdtImage(name, activate, menuKey='image-0', extra={}) {
    return { displayType:DPtypes.IMAGE, name, activate, menuKey, ...extra};
}

/**
 *
 * @param {string} name
 * @param {Function} activate
 * @param {number|string} menuKey
 * @param {Object} extra - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export function dpdtTable(name, activate, menuKey='table-0', extra={}) {
    return { displayType:DPtypes.TABLE, name, activate, menuKey, ...extra};
}

/**
 *
 * @param {string} name
 * @param {Function} activate
 * @param {number|string} menuKey
 * @param {Object} extra - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export function dpdtChart(name, activate, menuKey='chart-0', extra={}) {
    return { displayType:DPtypes.CHART, name, activate, menuKey, ...extra};
}

/**
 *
 * @param {string} name
 * @param {Function} activate
 * @param {number|string} menuKey
 * @param {Object} extra - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export function dpdtChartTable(name, activate, menuKey='chart-table-0', extra={}) {
    return { displayType:DPtypes.CHOICE_CTI, name, activate, menuKey, ...extra};
}

/**
 *
 * @param {string} name
 * @param {Function} activate
 * @param {String} url
 * @param {Object} serDefParams
 * @param {number|string} menuKey
 * @param {Object} extra - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export function dpdtAnalyze(name, activate, url, serDefParams, menuKey='analyze-0', extra={}) {
    return { displayType:DPtypes.ANALYZE, name, url, activate, serDefParams, menuKey, ...extra};
}

/**
 *
 * @param {string} name
 * @param {string} url
 * @param {number|string} menuKey
 * @param {string} fileType type of file eg- tar or gz
 * @param {Object} extra - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export function dpdtDownload(name, url, menuKey='download-0', fileType, extra={}) {
    return { displayType:DPtypes.DOWNLOAD, name, url, menuKey, fileType, ...extra};
}

export function dpdtDownloadMenuItem(name, url, menuKey='download-0', fileType, extra={}) {
    return { displayType:DPtypes.DOWNLOAD_MENU_ITEM, name, url, menuKey, singleDownload: true, fileType, ...extra};
}



/**
 *
 * @param {string} name
 * @param {string} url
 * @param {number|string} menuKey
 * @param {Object} extra - all values in this object are added to the DataProjectType Object
 * @return {DataProductsDisplayType}
 */
export function dpdtPNG(name, url, menuKey='png-0', extra={}) {
    return { displayType:DPtypes.PNG, name, url, menuKey, ...extra};
}


/**
 *
 * @param {Array.<DataProductsDisplayType>} menu
 * @param {number} activeIdx
 * @param {String} activeMenuLookupKey
 * @param {boolean} keepSingleMenu
 * @return {DataProductsDisplayType}
 */
export function dpdtFromMenu(menu,activeIdx,activeMenuLookupKey, keepSingleMenu=false) {
    return {...menu[activeIdx], activeMenuLookupKey, menu: (menu.length>1||keepSingleMenu)?menu:[]};
}
