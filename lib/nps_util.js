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

const debug = require('debug')('nps:util');

var hasTokenExpired = function(timestamp, ttl) {

	if(! timestamp) {
		return true;
	}

	ttl = ttl || 1800; // use default 30 * 60 seconds if not provided

	debug('Token timestamp: ' + timestamp + ' expired:' + (new Date() - Date.parse(timestamp) > (ttl * 1000)));
	return (new Date() - Date.parse(timestamp) > (ttl * 1000));
};

var getTokenTTL = function(timestamp, ttl) {

	if(! timestamp) {
		return 0;
	}

	ttl = ttl || 1800; // use default 30 * 60 seconds if not provided

	var now = new Date();
	var past = new Date(timestamp);
	debug('current: ' + now.valueOf() + ' ' + now);
	debug('past   : ' + past.valueOf() + ' ' + past);
	debug('elapsed: ' + (now - past));
	var remaining = Math.floor(((ttl * 1000) - (now - past))/60000);
	debug('remaining: ' + remaining);

	debug('Token timestamp: ' + timestamp + ' remaining TTL: ' + remaining);

	if(remaining > 0) {
		return remaining;
	}	
	else {
		return 0;
	}		
};

module.exports.hasTokenExpired = hasTokenExpired;
module.exports.getTokenTTL = getTokenTTL;