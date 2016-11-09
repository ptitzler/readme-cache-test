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
 * Simple wrapper class, defining a set of of scores.
 * @param {String} name - spec name
 */
function ScoreSpec(name) {
	this.name = name || 'default';
	this.scores = [];
}

/**
 * @returns {String} name of this score set
 */
ScoreSpec.prototype.getName = function() {
	return this.name;
};

/**
 * Returns true if no scores are defined in this set, false otherwise
 * @returns {Boolean}
 */
ScoreSpec.prototype.isEmpty = function() {
	return (this.scores.length === 0);
};

/**
 * Add a score to the set
 * @param {Object} score
 * @param {String} score.name
 * @param {Number} score.value
 */
ScoreSpec.prototype.addScore = function(score) {
	if((score) && (typeof score === 'object') && (score.constructor.name === 'Score')) {
		this.scores.push(score);
		this.scores = _.sortedUniq(_.sortBy(this.scores,['value'],['asc']));
	}
};

/**
 * Removes the score associated with this name
 * @param {String} name
 */
ScoreSpec.prototype.removeScoreByName = function(name) {
	if(name) {
		this.scores = _.remove(this.scores, 
			                   function(score) {
			                   		return (score.getName() === name);
			                   });
	}
};

/**
 * Removes the score associated with this value
 * @param {Number} value
 */
ScoreSpec.prototype.removeScoreByValue = function(value) {
	if(value) {
		this.scores = _.remove(this.scores, 
			                   function(score) {
			                   		return (score.getValue() === value);
			                   });
	}
};

/**
 * Get score associated with this value or null, if not found
 * @param {Number} value
 * @returns {Object} score - an instance of Score
 */
ScoreSpec.prototype.getScoreByValue = function(value) {
	if(value) {
		return _.find(this.scores, 
			          function(score) {
			         	return (score.getValue() === value);
			         });
	}
};

/**
 * Returns the scores in this spec or an emtpry array
 * @returns {Object} score[]
 * @returns {String} score.name
 * @returns {Number} score.value
 */
ScoreSpec.prototype.getScores = function() {
	return this.scores;
};

/**
 * Returns the lowest score in this spec or null if no score is defined
 * @returns {Object} score
 * @returns {String} score.name
 * @returns {Number} score.value
 */
ScoreSpec.prototype.getLowestScore = function() {
	return _.first(this.scores);
};

/**
 * Returns the highest score in this spec or null if no score is defined
 * @returns {Object} score
 * @returns {String} score.name
 * @returns {Number} score.value
 */
ScoreSpec.prototype.getHighestScore = function() {
	return _.last(this.scores);
};

/**
 * Returns the sentiment for this score or null if not defined
 * @param {Number} score_value
 * @returns {String} sentiment for score
 */
ScoreSpec.prototype.getSentimentByValue = function(score_value) {
	var numeric_value = Number(score_value);
	var score = _.find(this.scores, 
		           		   function(score) {	           		   	
		           				return (score.getValue() === numeric_value);
		           		   }); 
	if(score) {
		return score.getSentiment();
	}
	return null;
};

/*
 * Score class.
 * @param {String} name - display name for this score; defaults to '0' if not specified
 * @param {String} value - numerical value for this score (used for sorting); defaults to 0 if NaN

 */
function Score(name, value, sentiment) {
	this.name = name || '0';
	this.value = Number(value) || 0;
	this.sentiment = sentiment || null;
}

/**
 * Returns the score name
 * @returns {String} name
 */
Score.prototype.getName = function() {
	return this.name;
};

/**
 * Returns the numeric score value
 * @returns {Number} value
 */
Score.prototype.getValue = function() {
	return this.value;
};

/**
 * Returns the sentiment for this score
 * @returns {String} sentiment
 */
Score.prototype.getSentiment = function() {
	return this.sentiment;
};

// exports
module.exports.ScoreSpec = ScoreSpec;
module.exports.Score = Score;
