/*
 * License information at https://github.com/Caltech-IPAC/firefly/blob/master/License.txt
 */
import {RangeValues,STRETCH_LINEAR,SIGMA} from '../visualize/RangeValues.js';
import {getCellValue} from '../tables/TableUtil.js';
import {makeWebPlotRequestViaZtfIbe} from 'firefly/templates/lightcurve/ztf/IbeZTFPlotRequests.js';

const rangeValues= RangeValues.makeRV({which:SIGMA, lowerValue:-2, upperValue:10, algorithm:STRETCH_LINEAR});


export function makeZtfPlotRequest(table, row, includeSingle, includeStandard) {

    const makeReq= (pid) => {
        const req= makeWebPlotRequestViaZtfIbe(table,row, table.request.size, table.request.subsize);
        req.setPlotId(pid);
        req.setInitialRangeValues(rangeValues);
        return req;
    };
    const val= (cell) => getCellValue(table, row, cell);
    
    const plotId= `ztf-${val('field')}-${val('filtercode')}-${val('filefracday') ?? val('rfid')}`;
    const retval= {};
    if (includeSingle) retval.single= makeReq(plotId);
    if (includeStandard) {
        retval.standard= [ makeReq(`group-1-${plotId}`) ];
        retval.highlightPlotId= retval.standard[0];
    }
    return retval;
}