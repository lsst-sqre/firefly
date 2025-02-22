/*
 * License information at https://github.com/Caltech-IPAC/firefly/blob/master/License.txt
 */

import {isEmpty} from 'lodash';
import ImagePlotCntlr, {
    dispatchChangeCenterOfProjection,
    dispatchPlotHiPS,
    dispatchChangeHiPS,
    dispatchAbortHiPS,
    dispatchPlotImage,
    dispatchPlotProgressUpdate,
    dispatchZoom,
    IMAGE_PLOT_KEY,
    visRoot,
    WcsMatchType,
    makeUniqueRequestKey
} from '../ImagePlotCntlr.js';
import {UserZoomTypes} from '../ZoomUtil.js';
import {WebPlot, isHiPS, isImage, isBlankHiPSURL} from '../WebPlot.js';
import {PlotAttribute} from '../PlotAttribute.js';
import {getRootURL, loadImage} from '../../util/WebUtil.js';
import {
    findCurrentCenterPoint,
    getCenterOfProjection,
    getCorners,
    getDrawLayerByType,
    getDrawLayersByType,
    getFoV,
    getPlotViewById,
    primePlot,
} from '../PlotViewUtil.js';
import {dispatchAddActionWatcher} from '../../core/MasterSaga.js';
import {
    getHiPSZoomLevelToFit,
    getPointMaxSide,
    getPropertyItem,
    makeHiPSAllSkyUrl,
    makeHiPSAllSkyUrlFromPlot,
    makeHipsUrl,
    resolveHiPSConstant
} from '../HiPSUtil.js';
import {addAllSkyCachedImage, findAllSkyCachedImage} from '../iv/HiPSTileCache.js';
import {ZoomType} from '../ZoomType.js';
import {CCUtil} from '../CsysConverter.js';
import { addDrawLayers, determineViewerId, ensureWPR, getHipsImageConversion, } from './PlotImageTask.js';
import {
    dispatchAttachLayerToPlot,
    dispatchCreateDrawLayer,
    dispatchDetachLayerFromPlot,
    dlRoot,
    getDlAry
} from '../DrawLayerCntlr.js';
import ImageOutline from '../../drawingLayers/ImageOutline.js';
import Artifact from '../../drawingLayers/Artifact.js';
import HiPSGrid from '../../drawingLayers/HiPSGrid.js';
import {resolveHiPSIvoURL} from '../HiPSListUtil.js';
import {addNewMocLayer, isMOCFitsFromUploadAnalsysis, makeMocTableId, MOCInfo, UNIQCOL} from '../HiPSMocUtil.js';
import HiPSMOC from '../../drawingLayers/HiPSMOC.js';
import {getRowCenterWorldPt} from '../saga/ActiveRowCenterWatcher';
import {getActiveTableId} from '../../tables/TableUtil';
import {locateOtherIfMatched, matchHiPStoPlotView} from './WcsMatchTask';
import {upload} from '../../rpc/CoreServices.js';
import {fetchUrl} from '../../util/fetch';
import {getGpuJs} from '../rawData/GpuJsConfig.js';

const PROXY= true;


//======================================== Exported Functions =============================
//======================================== Exported Functions =============================


function parseProperties(str) {
    if (!str) {
        throw new Error('Could not retrieve HiPS properties file');
    }
    const hipsProperties= str.split('\n')
        .map( (s) => s.trim())
        .filter( (s) => !s.startsWith('#') && s)
        .map( (s) => s.split('='))
        .reduce( (obj, sAry) => {
            if (sAry.length===2) obj[sAry[0].trim()]= sAry[1].trim();
            return obj;
        },{});
    validateProperties(hipsProperties); // throws exceptions if not valid
    return hipsProperties;
}

function validateProperties(hipsProperties) {
    if (isEmpty(hipsProperties)) {
        throw new Error('Could not retrieve HiPS properties file');
    }
    const {dataproduct_type= 'image'}= hipsProperties;
    if (dataproduct_type!=='image' && dataproduct_type!=='cube') {
        if (dataproduct_type==='catalog') {
            throw new Error('HiPS catalogs are currently unsupported');
        }
        else {
            throw new Error('Currently only HiPS images and cubes are supported');
        }
    }
    return hipsProperties;

}

function initCorrectCoordinateSys(pv) {
    if (!pv) return;
    const plot= primePlot(pv);
    const vr= visRoot();
    const {plotId}= pv;
    if (vr.positionLock) {
        const hipsPv = vr.plotViewAry.filter((pv) => isHiPS(primePlot(pv)) && pv.plotId !== plotId)[0];
        const hipsPlot = primePlot(hipsPv);
        if (hipsPlot && hipsPlot.imageCoordSys !== plot.imageCoordSys) {
            dispatchChangeHiPS({plotId, coordSys: hipsPlot.imageCoordSys});
        }
    }
}


function watchForHiPSViewDim(action, cancelSelf, params) {
    const {plotId}= action.payload;
    if (plotId!==params.plotId) return;
    const vr= visRoot();
    const pv= getPlotViewById(vr, plotId);
    const {width,height}= pv.viewDim;
    const wp= pv.request && pv.request.getWorldPt();
    if (width && height && width>30 && height>30) {
        const plot= primePlot(pv);
        if (!plot) return;
        const otherPlot= lockedToOtherHiPS(vr,pv) && primePlot(getOtherLockedHiPS(vr,pv));

        if ((vr.wcsMatchType===WcsMatchType.Standard || vr.wcsMatchType===WcsMatchType.Target) &&
                                     isImage(primePlot(getPlotViewById(vr, vr.mpwWcsPrimId)))) {
            matchHiPStoPlotView(vr, getPlotViewById(vr, vr.mpwWcsPrimId));
        }
        else if (!pv.request.getSizeInDeg() && !wp && lockedToOtherHiPS(vr,pv) && otherPlot) { //if nothing enter, match to existing HiPS
            dispatchZoom({ plotId, userZoomType: UserZoomTypes.LEVEL, level:otherPlot.zoomFactor });
            const {centerWp}= getPointMaxSide(otherPlot, otherPlot.viewDim);
            dispatchChangeCenterOfProjection({plotId,centerProjPt:centerWp});
        }
        else {
            let size= pv.request.getSizeInDeg()  || (plot.blank? 180 : Number(plot.hipsProperties.hips_initial_fov)) || 180;

            if (size) {
                if (size<.00027 || size>70) { // if size is really small (<1 arcsec) or big then do a fill, small size is probably an error
                    dispatchZoom({ plotId, userZoomType: UserZoomTypes.FILL});
                }
                else {
                    if (size<.0025) size= .0025; //if between 1 arcsec and 9 then set to 9 arcsec
                    const level= getHiPSZoomLevelToFit(pv,size);
                    dispatchZoom({ plotId, userZoomType: UserZoomTypes.LEVEL, level });
                }
            }

            if (wp) dispatchChangeCenterOfProjection({plotId,centerProjPt:wp});
        }


        initCorrectCoordinateSys(pv);
        addDrawLayers(pv.request, pv, plot); //todo for blank

        cancelSelf();
    }
}



function lockedToOtherHiPS(vr, pv) {
    return Boolean(getOtherLockedHiPS(vr,pv));
}

/**
 *
 * @param {VisRoot} vr
 * @param {PlotView} pv
 * @return {Array.<PlotView>|boolean}  return the array of other HiPS or false if there is not any
 */
function getOtherLockedHiPS(vr, pv) {
    if (!vr.positionLock) return false;
    const ary= vr.plotViewAry.filter( (testPv) => isHiPS(primePlot(testPv)) || pv.plotId!==testPv.plotId);
    if (!ary.length) return false;
    return ary;
}


async function addAllSky(plot) {
    const allSkyURL= makeHiPSAllSkyUrlFromPlot(plot);
    const cachedAllSkyImage= findAllSkyCachedImage(allSkyURL);
    if (cachedAllSkyImage) return plot;
    dispatchPlotProgressUpdate(plot.plotId, 'Retrieving HiPS Data', false, null);
    const allSkyImage= await loadImage(makeHiPSAllSkyUrlFromPlot(plot));
    addAllSkyCachedImage(allSkyURL, allSkyImage);
    return plot;
}

async function addAllSkyUsingProperties(hipsProperties, hipsUrlRoot, plotId, proxyHips) {
    const exts= hipsProperties?.hips_tile_format ?? 'jpg';
    const allSkyURL= makeHiPSAllSkyUrl(hipsUrlRoot, exts, 0);
    const cachedAllSkyImage= findAllSkyCachedImage(allSkyURL);
    if (cachedAllSkyImage) return hipsProperties;
    dispatchPlotProgressUpdate(plotId, 'Retrieving HiPS Data', false, null);
    const allSkyImage= await loadImage(makeHiPSAllSkyUrl(hipsUrlRoot, exts, 0, proxyHips));
    addAllSkyCachedImage(allSkyURL, allSkyImage);
    return hipsProperties;
}



const currentPlots= {};

export const makeAbortHiPSAction= (rawAction) => () =>  currentPlots[rawAction.payload.plotId]= undefined;
export const makePlotHiPSAction= (rawAction) => (dispatcher) => makeHiPSPlot(rawAction,dispatcher);
export const makeChangeHiPSAction= (rawAction) => (dispatcher, getState) => doHiPSChange(rawAction,dispatcher,getState);




async function makeHiPSPlot(rawAction, dispatcher) {

    const {payload}= rawAction;
    const {plotId, attributes, pvOptions, renderTreeId}= payload;
    const wpRequest= ensureWPR(payload.wpRequest);
    const blank= isBlankHiPSURL(wpRequest.getHipsRootUrl());

    const newPayload= {...payload, wpRequest, plotType:'hips', wpRequestAry:[wpRequest], renderTreeId, pvOptions};
    newPayload.viewerId= determineViewerId(payload.viewerId, plotId);
    const hipsImageConversion= getHipsImageConversion(payload.hipsImageConversion);
    if (hipsImageConversion) newPayload.pvOptions= {...pvOptions, hipsImageConversion};
    const requestKey= makeUniqueRequestKey('plotRequestKey');
    currentPlots[plotId]=requestKey;

    const hipsFail= (errStr) => dispatcher( { type: ImagePlotCntlr.PLOT_HIPS_FAIL,
                                           payload:{ description: 'HiPS display failed: '+ errStr, plotId, wpRequest } });

    try {
        const resolvedHipsRootUrl= await resolveHiPSIvoURL(wpRequest.getHipsRootUrl());
        if (currentPlots[plotId]!==requestKey) {
            // hipsFail('hips plot expired or aborted');
            console.log('hips plot expired or aborted');
            return;
        }
        dispatcher( { type: ImagePlotCntlr.PLOT_IMAGE_START,payload:newPayload} );
        if (!resolvedHipsRootUrl) {
            hipsFail('Empty URL');
            return;
        }

        dispatchPlotProgressUpdate(plotId, 'Retrieving Info', false, null);
        const result= await fetchUrl(makeHipsUrl(`${resolvedHipsRootUrl}/properties`, PROXY), {}, true, PROXY);
        if (!result.text) {
            hipsFail('Could not retrieve HiPS properties file');
            return;
        }
        const str= await result.text();
        const hipsProperties= parseProperties(str);
        let plot= WebPlot.makeWebPlotDataHIPS(plotId, resolvedHipsRootUrl, wpRequest, hipsProperties, attributes, PROXY);

        if (!blank) {
            await createHiPSMocLayer(getPropertyItem(hipsProperties, 'ivoid'), resolvedHipsRootUrl, plot);
        }
        if (currentPlots[plotId]!==requestKey) {
            // hipsFail('hips plot expired or aborted');
            console.log('hips plot expired or aborted');
            return;
        }
        plot= await addAllSky(plot);
        const GPU= await getGpuJs(getRootURL());
        createHiPSGridLayer();
        dispatchAddActionWatcher({
            actions:[ImagePlotCntlr.PLOT_HIPS, ImagePlotCntlr.UPDATE_VIEW_SIZE],
            callback:watchForHiPSViewDim,
            params:{plotId}}
        );
        const pvNewPlotInfoAry= [ {plotId, plotAry: [plot]} ];
        dispatcher( { type: ImagePlotCntlr.PLOT_HIPS, payload: {...newPayload, plot,pvNewPlotInfoAry }});
    } catch (error) {
        hipsFail(error.message);
    }
}





async function createHiPSMocLayer(ivoid, hipsUrl, plot, mocFile = 'Moc.fits') {
    const mocUrl = hipsUrl.endsWith('/') ? hipsUrl + mocFile : hipsUrl+'/'+mocFile;
    const tblId = makeMocTableId(ivoid);
    const dls = getDrawLayersByType(getDlAry(), HiPSMOC.TYPE_ID);

    let   dl = dls.find((oneLayer) => oneLayer.drawLayerId === tblId);
    if (dl) {
        if (plot.plotId) {
            dispatchAttachLayerToPlot(dl.drawLayerId, plot.plotId, false, false);
        }
        return;
    }

    try {
        const {status, cacheKey, analysisResult}=  await upload(mocUrl, 'details');
        if (status === '200') {
            const report = JSON.parse(analysisResult) || {};

            const isMocFits = isMOCFitsFromUploadAnalsysis(report);
            if (isMocFits.valid) {
                dl = addNewMocLayer(tblId, cacheKey, mocUrl, isMocFits?.[MOCInfo]?.[UNIQCOL]);
                if (dl && plot.plotId) {
                    dispatchAttachLayerToPlot(dl.drawLayerId, plot.plotId, true, false);
                }
            }
        }
    }
    catch (e) {
        console.log(`MOC not found at URL (this is not uncommon): ${e}`) ;
    }
}

function createHiPSGridLayer() {
    const dl= getDrawLayerByType(getDlAry(), HiPSGrid.TYPE_ID);
    if (!dl) {
        dispatchCreateDrawLayer(HiPSGrid.TYPE_ID);
    }
}


async function doHiPSChange(rawAction, dispatcher, getState) {

    const {payload}= rawAction;
    const {hipsUrlRoot:inHipsUrlRoot}= payload;
    const {plotId}= payload;

    const hipsUrlRoot= resolveHiPSConstant(inHipsUrlRoot);
    const pv= getPlotViewById(getState()[IMAGE_PLOT_KEY], plotId);
    const plot= primePlot(pv);
    if (!plot) return;
    const {width,height}= pv.viewDim;
    if (!width || !height) return;
    const blank= inHipsUrlRoot ? isBlankHiPSURL(inHipsUrlRoot) : plot.blank;

    if (!hipsUrlRoot) { // only change to some attributes, we are not replacing the HiPS source
        const newPayload= {...payload, blank};
        dispatcher( { type: ImagePlotCntlr.CHANGE_HIPS, payload:newPayload });
        locateOtherIfMatched(visRoot(),plotId);
        dispatcher( { type: ImagePlotCntlr.ANY_REPLOT, payload:newPayload });
        return;
    }

    const hipsChangeFailP=(reason) =>
        dispatchPlotProgressUpdate(plotId, 'Failed to change HiPS display',true, pv.request.getRequestKey(), false);

    const resolvedHipsRootUrl= await resolveHiPSIvoURL(hipsUrlRoot);

    const url= makeHipsUrl(`${resolvedHipsRootUrl}/properties`, true);

    dispatchPlotProgressUpdate(plotId, 'Retrieving Info', false, null);
    try {
        let result;
        try {
            result = await fetchUrl(url, {}, true, PROXY);
        } catch (error) {
            console.log('properties not found');
            hipsChangeFailP('Could not retrieve HiPS properties file');
            return;
        }
        const s = await result.text();
        const hipsProperties = parseProperties(s);
        await addAllSkyUsingProperties(hipsProperties, resolvedHipsRootUrl, plotId, true);
        dispatcher(
            {
                type: ImagePlotCntlr.CHANGE_HIPS,
                payload: {...payload, hipsUrlRoot, hipsProperties, coordSys: plot.imageCoordSys, blank},
            });
        initCorrectCoordinateSys(getPlotViewById(visRoot(), plotId));
        locateOtherIfMatched(visRoot(),plotId);
        dispatcher({type: ImagePlotCntlr.ANY_REPLOT, payload});
    } catch (error) {
        console.log(error);
        hipsChangeFailP(pv, error.message);
    }
}




//==============================================================================
//------------------------------------------------------------------------------
//==============================================================================



export function makeImageOrHiPSAction(rawAction) {
    return () => {
        const {payload}= rawAction;
        const hipsRequest= ensureWPR(payload.hipsRequest);
        const imageRequest= ensureWPR(payload.imageRequest);
        const allSkyRequest= ensureWPR(payload.allSkyRequest);

        if (!validateHipsAndImage(imageRequest, hipsRequest, payload.fovDegFallOver)) return;


        const {plotId, fovDegFallOver, fovMaxFitsSize, autoConvertOnZoom, renderTreeId,
                pvOptions, attributes, plotAllSkyFirst=false}= payload;
        const viewerId= determineViewerId(payload.viewerId, plotId);
        const size= getSizeInDeg(imageRequest, hipsRequest);
        const groupId= getPlotGroupId(imageRequest, hipsRequest);
        const useImage= (plotAllSkyFirst && allSkyRequest) || (imageRequest.getWorldPt() &&
                                                              (size !== 0) && (size < fovDegFallOver));
        let wpRequest;

        if (useImage) {
            wpRequest= plotAllSkyFirst ? allSkyRequest.makeCopy() : imageRequest.makeCopy();
        }
        else {
            wpRequest= hipsRequest.makeCopy();
        }

        const hipsImageConversion= {hipsRequestRoot:hipsRequest, imageRequestRoot:imageRequest, fovMaxFitsSize,
                                    autoConvertOnZoom, allSkyRequest, fovDegFallOver, plotAllSkyFirst};


        wpRequest.setSizeInDeg(size);
        wpRequest.setPlotId(plotId);
        wpRequest.setPlotGroupId(groupId);

        dispatchAbortHiPS({plotId});
        if (useImage) {
            dispatchPlotImage({plotId, wpRequest, viewerId, hipsImageConversion, pvOptions, attributes, renderTreeId});
        }
        else {
            dispatchPlotHiPS({plotId, wpRequest, viewerId, hipsImageConversion, pvOptions, attributes, renderTreeId});
        }
    };
}


/**
 * convert to a image defined in  hipsImageConversion
 * @param {PlotView} pv
 * @param {boolean} allSky if true, convert to the allsky image defined in hipsImageConversion
 * @param {boolean} tryCenterBySelectedObj - if the field of view is large and convert to image is selected then try to
 *             choose and image center that is the selected object of the associated table.
 */
export function convertToImage(pv, allSky= false, tryCenterBySelectedObj= false) {
    const {plotId, plotGroupId,viewDim}= pv;
    const {allSkyRequest, imageRequestRoot, fovMaxFitsSize}= pv.plotViewCtx.hipsImageConversion;
    dispatchDetachLayerFromPlot(ImageOutline.TYPE_ID, plotId);
    dispatchDetachLayerFromPlot(HiPSGrid.TYPE_ID, plotId);
    const convertToAllSky= allSky && allSkyRequest;
    const wpRequest= (convertToAllSky) ? allSkyRequest.makeCopy() : imageRequestRoot.makeCopy();
    const currentFoV= getFoV(pv);
    wpRequest.setPlotId(plotId);
    wpRequest.setPlotGroupId(plotGroupId);
    const plot= primePlot(pv);
    const attributes= {...plot.attributes, ...getCornersAttribute(pv)};
    const fromImage= isImage(plot) && !plot.projection.isWrappingProjection();
    const {displayFixedTarget,userCanDeletePlots}= pv.plotViewCtx;
    if (convertToAllSky) {
        if (fromImage) {
            prepFromImageConversion(pv,wpRequest);
            // wpRequest.setZoomType(ZoomType.ARCSEC_PER_SCREEN_PIX);
            // wpRequest.setZoomArcsecPerScreenPix((currentFoV/viewDim.width) * 3600);
            wpRequest.setZoomType(ZoomType.TO_WIDTH);
        }
        else {
            wpRequest.setZoomType(ZoomType.TO_WIDTH);
        }
    }
    else {
        wpRequest.setWorldPt(findWorldPtToCenterOn(pv,tryCenterBySelectedObj));
        wpRequest.setSizeInDeg(currentFoV> fovMaxFitsSize ? fovMaxFitsSize : currentFoV);
        if (currentFoV > 5) {
            wpRequest.setZoomType(ZoomType.TO_WIDTH_HEIGHT);
        }
        else {
            wpRequest.setZoomType(ZoomType.ARCSEC_PER_SCREEN_PIX);
            wpRequest.setZoomArcsecPerScreenPix((currentFoV/viewDim.width) * 3600);
        }
    }

    dispatchPlotImage({plotId, wpRequest, hipsImageConversion: pv.plotViewCtx.hipsImageConversion,
        pvOptions:{displayFixedTarget,userCanDeletePlots},
        attributes, enableRestore:false});
}



export function convertToHiPS(pv, fromAllSky= false, tryCenterBySelectedObj= false) {
    const {plotId, plotGroupId}= pv;
    const wpRequest= pv.plotViewCtx.hipsImageConversion.hipsRequestRoot.makeCopy();
    wpRequest.setPlotId(plotId);
    wpRequest.setPlotGroupId(plotGroupId);
    wpRequest.setSizeInDeg(getFoV(pv));
    const plot= primePlot(pv);


    const attributes= {...plot.attributes, ...getCornersAttribute(pv)};
    wpRequest.setWorldPt(findWorldPtToCenterOn(pv,tryCenterBySelectedObj));
    if (!fromAllSky) {
        prepFromImageConversion(pv,wpRequest);
    }
    const {displayFixedTarget,userCanDeletePlots}= pv.plotViewCtx;

    dispatchPlotHiPS({plotId, wpRequest, attributes, hipsImageConversion: pv.plotViewCtx.hipsImageConversion,
        enableRestore:false,
        pvOptions:{ displayFixedTarget, userCanDeletePlots }
    });
}

function findWorldPtToCenterOn(pv, tryCenterBySelectedObj) {
    let centerPt;
    const currentFoV= getFoV(pv);
    const plot= primePlot(pv);
    if (tryCenterBySelectedObj && currentFoV>15 && plot.attributes[PlotAttribute.VISUALIZED_TABLE_IDS]) {
        const tblIdAry=  plot.attributes[PlotAttribute.VISUALIZED_TABLE_IDS];
        const tbl_id= getActiveTableId();
        if (!isEmpty(tblIdAry) && tblIdAry.includes(tbl_id)) {
            centerPt= getRowCenterWorldPt(tbl_id);
        }
    }
    return centerPt || getCenterPt(pv);

}

function getCenterPt(pv) {
    const plot= primePlot(pv);
    if (isHiPS(plot)) {
        return getCenterOfProjection(plot);
    }
    else {
        return CCUtil.getWorldCoords(plot,findCurrentCenterPoint(pv));
    }
}


/**
 * This function has a lot of side effects, it modified wpRequest and dispatch drawing
 * @param pv
 * @param wpRequest
 */
function prepFromImageConversion(pv, wpRequest) {
    const {plotId}= pv;
    wpRequest.setWorldPt(getCenterPt(pv));
    wpRequest.setSizeInDeg(getFoV(pv));
    const dl = getDrawLayerByType(dlRoot(), ImageOutline.TYPE_ID);
    if (!dl) dispatchCreateDrawLayer(ImageOutline.TYPE_ID);
    dispatchAttachLayerToPlot(ImageOutline.TYPE_ID, plotId);
    const artAry= getDrawLayersByType(dlRoot(), Artifact.TYPE_ID);
    artAry.forEach( (a) => dispatchDetachLayerFromPlot(a.drawLayerId,plotId));
}


function getCornersAttribute(pv) {
    const plot= primePlot(pv);
    const cAry= getCorners(plot);
    if (!cAry) return {};
    return {
        [PlotAttribute.OUTLINEIMAGE_BOUNDS]: cAry,
        [PlotAttribute.OUTLINEIMAGE_TITLE]: plot.title
    };
}


/**
 * This function will convert between HiPS and FITS or FITS and Hips depend on hipsImageConversion settings and zoom
 * direction.
 * @param {PlotView} pv
 * @param {number} [prevZoomLevel] - previous zoom level
 * @param {number} [nextZoomLevel] - next zoom level
 * @return {boolean}
 */
export function doHiPSImageConversionIfNecessary(pv, prevZoomLevel, nextZoomLevel) {
    if (!pv.plotViewCtx.hipsImageConversion) return false;
    const plot= primePlot(pv);
    const {fovDegFallOver, allSkyRequest}=  pv.plotViewCtx.hipsImageConversion;
    const {width,height}= pv.viewDim;
    const fov= getFoV(pv);
    if (!nextZoomLevel || !prevZoomLevel) {
        nextZoomLevel = plot.zoomFactor;
        prevZoomLevel = plot.zoomFactor;
    }

    if (isHiPS(plot) ) {
        const {screenSize}= plot;
        if (fovDegFallOver && prevZoomLevel<=nextZoomLevel && fov < fovDegFallOver) { // zooming in hips FOV passes fovDegFallOver
            convertToImage(pv, false);
            return true;
        }
        else if (fov>179 &&  prevZoomLevel>=nextZoomLevel &&   // zooming out, hips image getting small
            screenSize.width<width-10 && screenSize.height<height-10 && screenSize.width>50 &&
            allSkyRequest){
            convertToImage(pv, true);
            return true;
        }
    }
    else if (isImage(plot)) {
        if (plot.projection.isWrappingProjection() && prevZoomLevel<=nextZoomLevel && fov < 200) {// zooming in, all sky FOV less than 180
            convertToHiPS(pv);
            return true;
        }
        else if (prevZoomLevel>=nextZoomLevel &&
            (width-10)>plot.dataWidth*nextZoomLevel && (height-10) >plot.dataHeight*nextZoomLevel ) { //zoom out image getting small
            convertToHiPS(pv);
            return true;
        }
    }
    return false;
}





function validateHipsAndImage(imageRequest, hipsRequest, fovDegFallOver) {
    if (!fovDegFallOver) {
        console.log('You must define fovDegFallOver to the degree field of view to switch between HiPS and Image');
        return false;
    }
    if (!hipsRequest || !imageRequest) {
        console.log('You must define both hipsRequest and imageRequest');
        return false;
    }
    if (!getPlotGroupId(imageRequest, hipsRequest)) {
        console.log('You must call setPlotGroupId in either the hipsRequest or the imageRequest');
        return false;
    }
    return true;
}


function getSizeInDeg(imageRequest, hipsRequest) {
    if (imageRequest && imageRequest.getSizeInDeg()) return imageRequest.getSizeInDeg();
    if (hipsRequest && hipsRequest.getSizeInDeg()) return hipsRequest.getSizeInDeg();
    return 0;
}

function getPlotGroupId(imageRequest, hipsRequest) {
    if (imageRequest && imageRequest.getPlotGroupId()) return imageRequest.getPlotGroupId();
    if (hipsRequest && hipsRequest.getPlotGroupId()) return hipsRequest.getPlotGroupId();
}
