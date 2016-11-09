//-------------------------------------------------------------------------------
// Copyright IBM Corp. 2016
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//-------------------------------------------------------------------------------

'use strict';

const cfenv = require('cfenv');
const debug = require('debug');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');

/*
 * This application implements a simple Slack slash command back-end service that serves the following requests:
 * /about                   display usage information
 * /about @userName         display statistics for the Slack user identified by userName
 * /about #channelName		display statistics for the Slack channel identified by channelName
 * For information about Slack slash commands refer to https://api.slack.com/slash-commands
 * 
 * Service dependencies:
 *       - slack-graph-database: IBM Graph service instance, containing a populated Slack social graph
 * 
 * Environment variable dependencies:
 *       - SLACK_TOKEN: the unique token that was assigned by Slack to this integration
 *       - DEBUG (optional): if set to * or slack-about-service, debug information is added to the log
 */

 	debug('debug is enabled.');

	var appEnv = null;

	try {
	  appEnv = cfenv.getAppEnv({vcap: {services: require('./vcap_services.json')}});
	}
	catch(ex) {
	  appEnv = cfenv.getAppEnv();
	}

	debug(JSON.stringify(appEnv));


		var app = express();
		app.use(bodyParser.urlencoded({extended: false}));
		// Set the view engine
		app.set('view engine', 'html');
		app.engine('html', hbs.__express);
		app.engine('xml', hbs.__express);

		app.use(express.static(path.join(__dirname, 'views')));

		//const url = (appEnv.app.application_uris) ? appEnv.app.application_uris[0] : 'localhost:' + appEnv.port;

		//
		// API endpoint: return dynamically generated svg
		// 
		//
		app.get('/test', function(req,res) {
			console.log('/test');
			var svgData = {
      						left: 'Bluemix Deployments',
      						right: new Date().toISOString()
    					  };		
    		svgData.leftWidth = svgData.left.length * 6.5 + 10;
    		svgData.rightWidth = svgData.right.length * 7.5 + 10;
    		svgData.totalWidth = svgData.leftWidth + svgData.rightWidth;
    		svgData.leftX = svgData.leftWidth / 2 + 1;
    		svgData.rightX = svgData.leftWidth + svgData.rightWidth / 2 - 1;
    		res.set({'Content-Type': 'image/svg+xml',
    				 'Cache-Control': 'no-cache',
    				 'Expires': 0});
    		res.render('badge.xml', svgData);
		});

		app.get('/badge', function(req,res) {
			console.log('/badge');
		    var svgData = {
		      left: "Bluemix Deployments",
		      right: new Date().toISOString()
		    };
		    svgData.leftWidth = svgData.left.length * 6.5 + 10;
		    svgData.rightWidth = svgData.right.length * 7.5 + 10;
		    svgData.totalWidth = svgData.leftWidth + svgData.rightWidth;
		    svgData.leftX = svgData.leftWidth / 2 + 1;
		    svgData.rightX = svgData.leftWidth + svgData.rightWidth / 2 - 1;
		    res.set({"Content-Type": "image/svg+xml",
		             "Cache-Control": "no-cache",
		             "Expires": 0});
		    res.render("badge.xml", svgData);
		});


		app.get('/button', function(req,res) {
			console.log('/button');
		    var svgData = {
		      left: "Deploy to Bluemix",
		      right: new Date().toISOString()
		    };
		    svgData.leftWidth = svgData.left.length * 11 + 20;
		    svgData.rightWidth = svgData.right.length * 12 + 16;
		    svgData.totalWidth = svgData.leftWidth + svgData.rightWidth;
		    svgData.leftX = svgData.leftWidth / 2 + 1;
		    svgData.rightX = svgData.leftWidth + svgData.rightWidth / 2 - 1;
		    svgData.leftWidth = svgData.leftWidth + 48;
		    svgData.totalWidth = svgData.totalWidth + 48;
		    svgData.leftX = svgData.leftX + 48;
		    svgData.rightX = svgData.rightX + 48;
		    res.set({"Content-Type": "image/svg+xml",
		             "Cache-Control": "no-cache",
		             "Expires": 0});
		    res.render("button.xml", svgData);
		});

		//
		// start server on the specified port and binding host
		//
		app.listen(appEnv.port, '0.0.0.0', function() {
			console.log('Server starting on ' + appEnv.url);
		});

