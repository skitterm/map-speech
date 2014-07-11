 var hasGP = false;
 var mymap = null;
 var mapResponse = null;
 var helpHidden = false;
 var isButtonBusy = false;
 var showingLegend = false;
 var showingTitleBar = true;
 var originalHelpText = '';
 var changedOriginalText = true;
 var legendShown = false;
 var canTalk = false;

 var webmapgallery = ['d94dcdbe78e141c2b2d3a91d5ca8b9c9', '4778fee6371d4e83a22786029f30c7e1', 'c63cdcbbba034b62a2f3becac021b0a8', 'ef5920f160bd4239bdeb1348de3a3156',
     '8a567ebac15748d39a747649a2e86cf4', '2618187b305f4eafbae8fd6eb52afc76'
 ];

 //webmapgallery = [];


 var basemapTypes = ['streets', 'hybrid', 'topo', 'gray', 'oceans', 'national-geographic', 'osm'];
 var basemapIndex = 0;
 var bookmarkIndex = 0;
 var mapIndex = 0;
 var legendDijit;
 var overviewMapDijit;
 var isBusy = false;
 var recognition = null;
 var clickEvent;

 require([
     "dojo/ready",
     "dojo/on",
     "dojo/dom-attr",
     "esri/map",
     'esri/dijit/Legend',
     "esri/dijit/OverviewMap",
     "esri/arcgis/Portal",
     "esri/urlUtils",
     "esri/arcgis/utils"
 ], function(ready,
     on,
     attr,
     Map,
     Legend,
     OverviewMap,
     Portal,
     urlUtils,
     arcgisUtils) {

     ready(function() {

        clickEvent = ('ontouchstart' in window ? 'touchend' : 'click');
        
        var micButton = dojo.byId('microphone');
        on(micButton, clickEvent, function() {
            if(canTalk) {
               dojo.byId('help-text-text').innerHTML = 'Touch mic to begin';
                dojo.byId('connect-status').style.background = 'transparent';
                dojo.byId('help-prompts').style.display = 'none';
            }
            else {
                dojo.byId('help-text-text').innerHTML = 'Say a command';
                dojo.byId('connect-status').style.background = 'white';
                dojo.byId('help-prompts').style.display = 'block';
            }            
            canTalk = !canTalk;
        });

         'use strict';
         //get webmap id
         var webmapid = 'd94dcdbe78e141c2b2d3a91d5ca8b9c9';
         var groupid = '46b23d6bfae34260a61b1ea4e266b4a4';



         var defaultGeometryServerUrl = document.location.protocol + "//utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer";
         esri.config.defaults.geometryService = new esri.tasks.GeometryService(defaultGeometryServerUrl);

         if (!('webkitSpeechRecognition' in window)) {
             alert("API Not supported. please upgrade your browser.")

         } else {

             recognition = new webkitSpeechRecognition();


             // listen the whole time for user voice -- otherwise stops listening after a statement
             //recognition.interimResults = true;
             recognition.continuous = true;
             recognition.lang = 'en-US';

             var recognizedCommands = ['help', 'hope', 'health', 'ok', 'okay', 'k', 'next', 'mint', 'mixed', 'no', 'nick', 'net', 'in', 'is', 'then', 'out', 'want', 'left', 'list', 'last', 'right', 'down', 'town', 'up', 'switch', 'twitch', 'search',
             'reload', 'remote', 'reloved', 'reserved', 'reset','legend', 'mentioned', 'legends', 'question', 'watching', 'budget'];

             recognition.onspeechstart = function() {
                if(canTalk) {
                    dojo.byId('help-text-text').innerHTML = 'searching...';
                }                 
             }

             recognition.onresult = function(evt) {
                 console.log('result');
                 // if there are results
                 console.log(canTalk);
                 if(canTalk) {
                    var result = evt.results[evt.resultIndex][0].transcript;
                     if (result) {
                         result = result.trim().toLowerCase();
                         displayResult(result, recognizedCommands);
                     }
                 }
             };

             recognition.onnomatch = function() {
                 dojo.byId('help-text').className = 'invalid-command';
                 dojo.byId('help-text-text').innerHTML = 'no result found';
             };

             recognition.start();

         }



         var hrefObject = esri.urlToObject(document.location.href);
         if (hrefObject.query && hrefObject.query.webmap) {
             webmapid = hrefObject.query.webmap;
         }

         if (hrefObject.query && hrefObject.query.groupid) {
             groupid = hrefObject.query.groupid;
         }

         if (groupid) {

             console.log("using groupid: " + groupid);

             var portal = new esri.arcgis.Portal('http://www.arcgis.com');
             portal.on("load", function() {
                 var params = {
                     q: 'group:' + groupid + " AND " + "type:Web Map"
                 };
                 portal.queryItems(params).then(function(items) {
                     var results = items.results;
                     if (results.length > 0) {
                         webmapgallery = [];
                         for (var i = results.length - 1; i >= 0; i--) {
                             var result = results[i];
                             if (result.type == "Web Map") {
                                 webmapgallery.push(result.id);
                             }
                         }
                         loadMap(webmapgallery[0]);
                     } else {
                         alert("Sorry, no webmaps are available in this group. Loading a default map.");
                         loadMap(webmapid);
                     }
                 }, function(err) {
                     console.log(err);
                     alert("Sorry, could not load the group items. Loading a default map.");
                     loadMap(webmapid);
                 });
             });

         } else {
             //add the map
             loadMap(webmapid);
         }



     });

 });


 function loadMap(webmapid) {
     require(['dojo/_base/array'], function(arrayUtils) {
         if (mymap) {
             mymap.destroy();
             //legendDijit.destroy();
             dojo.byId('legend-div').style.display = "none";
             basemapIndex = 0;
             bookmarkIndex = 0;
             if (overviewMapDijit) overviewMapDijit.destroy();
             dojo.byId("title").innerHTML = "Loading ...";
         }

         esri.arcgis.utils.createMap(webmapid, "mapdiv").then(function(response) {

             dojo.byId("title").innerHTML = "<h3>" + response.itemInfo.item.title + "</h3>";
             mymap = response.map;


             mymap.hideZoomSlider();
             mapResponse = response;
             mymap.initialExtent = mymap.extent;

             var legendLayers = esri.arcgis.utils.getLegendLayers(response);

             //set basemap layerids
             if (mymap.basemapLayerIds && mymap.basemapLayerIds.length > 0) {
                 //good to go
             } else {
                 mymap.basemapLayerIds = [];
                 for (var i = 0; i < mapResponse.itemInfo.itemData.baseMap.baseMapLayers.length; i++) {
                     mymap.basemapLayerIds.push(mapResponse.itemInfo.itemData.baseMap.baseMapLayers[i].id);
                 };
             }


             isBusy = false;
             //call gamepadinit

             if (legendDijit) {
                 legendDijit.layerInfos = legendLayers;
                 legendDijit.refresh();
             } else {
                 legendDijit = new esri.dijit.Legend({
                     map: mymap,
                     layerInfos: legendLayers
                 }, 'legend-div');
                 legendDijit.startup();
             }


             overviewMapDijit = new esri.dijit.OverviewMap({
                 map: mymap,
                 attachTo: "bottom-left",
                 color: " #D84E13",
                 opacity: .40
             });

             overviewMapDijit.startup();

             hasBookmarks();

         }, function(err) {
             console.log(err);
             isBusy = false;
         });
     });
 }

 window.requestAnimFrame = (function() {
     return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         function(callback) {
             window.setTimeout(callback, 1000 / 60);
         };
 })();

 function displayResult(resultStr, validCommands) {
     var isValidCommand = false;
     for (var i = 0; i < validCommands.length; i++) {
         if (validCommands[i] == resultStr) {
             isValidCommand = true;
             break;
         }
     }
     // if result is in the array of accepted commands, make the help bar background green, otherwise red. 
     if (isValidCommand == true) {
         dojo.byId('help-text').className = 'valid-command';
         var commandStr = executeCommand(resultStr);
         dojo.byId('help-text-text').innerHTML = commandStr;
     } else {
         dojo.byId('help-text-text').innerHTML = resultStr;
         dojo.byId('help-text').className = 'invalid-command';
     }
 }

 function executeCommand(command) {
     var displayStr = '';
     switch (command) {
         case 'help':
         case 'health':
         case 'hope':
             displayStr = 'help';
             dojo.byId('help-prompts').style.display = 'block';
             break;
         case 'ok':
         case 'okay':
         case 'k':
             displayStr = 'ok';
             dojo.byId('help-prompts').style.display = 'none';
             break;
         case 'next':
         case 'net':
         case 'no':
         case 'nick':
         case 'mint':
         case 'mixed':
             displayStr = 'next';
             mapAction('nextMap');
             break;
         case 'left':
         case 'list':
         case 'last':
             displayStr = 'left';
             mapAction('panleft');
             break;
         case 'right':
             displayStr = 'right';
             mapAction('panright');
             break;
         case 'up':
             displayStr = 'up';
             mapAction('panup');
             break;
         case 'down':
         case 'town':
             displayStr = 'down';
             mapAction('pandown');
             break;
         case 'in':
         case 'is':
         case 'then':
             displayStr = 'in';
             mapAction('zoomin');
             break;
         case 'out':
         case 'want':
             displayStr = 'out';
             mapAction('zoomout');
             break;
         case 'cancel':
             //reset the map to defaults  and clear any feedback text
             break;
         case 'reset':
             displayStr = 'reset';
             mapAction('reset');
             break;
         case 'reload':
         case 'remote':
         case 'reloved':
         case 'reserved':
             displayStr = 'reload';
             document.location.reload();
             break;
         case 'switch':
         case 'twitch':
         case 'search':
             displayStr = 'switch';
             mapAction('switchBasemap');
             break;
         case 'legend':
         case 'mentioned':
         case 'watching':
         case 'legends':
         case 'question':
         case 'budget':
             displayStr = 'legend';
             mapAction('toggleLegend');
             break;
         default:
             break;
     }
     return displayStr;
 }


 function toggleTitleBar() {
     if (showingTitleBar) {
         dojo.byId('header').style.display = "none";
     } else {
         dojo.byId('header').style.display = "inline-block";
     }
     showingTitleBar = !showingTitleBar;
 }

 function toggleLegend() {
     if (showingLegend) {
         dojo.byId('legend-div').style.display = "none";
     } else {
         dojo.byId('legend-div').style.display = "inline-block";
     }
     showingLegend = !showingLegend;
 }

 function hasBookmarks() {

     // if there are any...     
     var bookmarks = mapResponse.itemInfo.itemData.bookmarks;
     if (bookmarks && bookmarks.length > 0) {
         overviewMapDijit.show();
         dojo.byId('bookmarks').style.display = "inline-block";
         var pluralSuffix = bookmarks.length > 1 ? 's' : '';
         var bookmarkText = bookmarks.length + ' Bookmark' + pluralSuffix + ' available! Press B to get started.';
         dojo.byId('help-text-text').innerHTML = bookmarkText;
     } else {
         //dojo.byId('help-text-text').innerHTML = '';
         overviewMapDijit.hide();
     }
 }

 function displayBookmark() {
     var bookmarks = mapResponse.itemInfo.itemData.bookmarks;
     if (bookmarks && bookmarks.length > 0) {
         console.log("Changing bookmark");
         // set this to do.
         if (bookmarkIndex > bookmarks.length - 1) {
             dojo.byId('bookmarks').style.display = 'none';
             overviewMapDijit.hide();
             bookmarkIndex = 0;
             var pluralSuffix = bookmarks.length > 1 ? 's' : '';
             var bookmarkText = bookmarks.length + ' Bookmark' + pluralSuffix + ' available! Press B to get started.';
             dojo.byId('help-text-text').innerHTML = bookmarkText;
             mymap.setExtent(mymap.initialExtent);
         } else {
             // set extent
             //console.log('showing bookmark ' + (bookmarkIndex + 1));
             overviewMapDijit.show();
             dojo.byId('bookmarks').style.display = 'inline-block';
             dojo.byId('help-text-text').innerHTML = "Showing Bookmark " + (bookmarkIndex + 1) + ' of ' + bookmarks.length;
             var newExtent = new esri.geometry.Extent(bookmarks[bookmarkIndex].extent);
             mymap.setExtent(newExtent, true);
             bookmarkIndex++;
         }
     }
 }

 function toggleHelp() {
     if (helpHidden) {
         dojo.byId('help-pics').style.display = 'block';
     } else {
         dojo.byId('help-pics').style.display = 'none';
     }
     helpHidden = !helpHidden;
 }

 function mapAction(type) {

     if (isBusy) return;

     switch (type) {
         case 'zoomin':
             setPanZoomHelpText();
             mymap.setLevel(mymap.getLevel() + 1);
             break;
         case 'zoomout':
             setPanZoomHelpText();
             mymap.setLevel(mymap.getLevel() - 1);
             break;
         case 'panup':
             setPanZoomHelpText();
             mymap.panUp();
             break;
         case 'pandown':
             setPanZoomHelpText();
             mymap.panDown();
             break;
         case 'panleft':
             setPanZoomHelpText();
             mymap.panLeft();
             break;
         case 'panright':
             setPanZoomHelpText();
             mymap.panRight();
             break;
         case 'panupright':
             setPanZoomHelpText();
             mymap.panUpperRight();
             break;
         case 'pandownright':
             setPanZoomHelpText();
             mymap.panLowerRight();
             break;
         case 'panupleft':
             setPanZoomHelpText();
             mymap.panUpperLeft();
             break;
         case 'pandownleft':
             setPanZoomHelpText();
             mymap.panLowerLeft();
             break;
         case 'reset':
             //dojo.byId('help-text-text').innerHTML = originalHelpText;
             mymap.setExtent(mymap.initialExtent);
             changedOriginalText = true;
             break;
         case 'switchBasemap':
             switchBasemap();
             break;
         case 'nextMap':
             ++mapIndex;
             if (mapIndex > webmapgallery.length - 1) {
                 mapIndex = 0;
             }
             isBusy = true;
             loadMap(webmapgallery[mapIndex]);
             break;
         case 'toggleLegend':
             if (showingLegend == true) {
                 dojo.byId('legend-div').style.display = 'none';
             } else {
                 dojo.byId('legend-div').style.display = 'block';
             }
             showingLegend = !showingLegend;
             break;
         default:
             break;
     }
 }

 function setPanZoomHelpText() {
     if (changedOriginalText) {
         originalHelpText = dojo.byId('help-text-text').innerHTML;
         //dojo.byId('help-text-text').innerHTML = 'Press "back" to return to original extent.';
         changedOriginalText = false;
     }
 }

 function switchBasemap() {
     mymap.setBasemap(basemapTypes[basemapIndex % basemapTypes.length]);
     basemapIndex++;
 }

 window.onload = (function() {


     //initializeGamePad();

     //https://developer.mozilla.org/en-US/docs/Web/Guide/API/Gamepad
     /* TODO
         window.addEventListener("gamepadconnected", function(e) {
             console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                 e.gamepad.index, e.gamepad.id,
                 e.gamepad.buttons.length, e.gamepad.axes.length);
         });
    */

 });