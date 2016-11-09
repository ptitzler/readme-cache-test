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

const _ = require('lodash');

/*
 * Simple wrapper class, defining a set of tags.
 * Each tag contains an id and a name: {id: 'performance_1', name: 'Scalability'}
 * @param {String} name - tag set name
 * @param {Object} tags[]
 * @param {String} tags.id - tag id
 * @param {String} tags.name - tag name
 * 
 */
function TagSet(name, tags) {
	this.name = name;
	this.tags = tags;
}

TagSet.prototype.getName = function() {
	return this.name;
};

TagSet.prototype.getTags = function() {
	return this.tags;
};

TagSet.prototype.getTagById = function(tagId) {
	return _.find(this.tags, {id: tagId});
};

TagSet.prototype.getTagByName = function(tagName) {
	return _.find(this.tags, {name: tagName});
};

module.exports = TagSet;