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
 * Simple wrapper class, defining a set of of domains.
 * @param {String} name - domain name
 */
function DomainSpec(name) {
	this.name = name || 'default';
	this.domains = {};
}

DomainSpec.prototype.getName = function() {
	return this.name;
};

DomainSpec.prototype.isEmpty = function() {
	return (Object.keys(this.domains).length === 0);
};

DomainSpec.prototype.addDomain = function(domain) {
	if((domain) && (domain.getName())){
		this.domains[domain.getName()] = domain;
	}
};

DomainSpec.prototype.removeDomain = function(domainName) {
	if(domainName) {
		delete this.domains[domainName];
	}
};

DomainSpec.prototype.getDomains = function() {
	return this.domains;
};

DomainSpec.prototype.getDomainsAsArray = function() {
	var domainsArray = [];
	_.forEach(Object.keys(this.domains), function(domainName) {
		domainsArray.push(this.domains[domainName]);
	}.bind(this));
	return domainsArray;
};

DomainSpec.prototype.getDomain = function(domainName) {
	return this.domains[domainName];
};

DomainSpec.prototype.getOfferingById = function(offeringId) {
	if(! offeringId) {
		return null;
	}

	// iterate through domains and locate offering 
	const domain =  _.find(Object.keys(this.domains), 
				  		   function(domainName){
				  			return (this.domains[domainName].getOfferingById(offeringId) !== null);	
						   }.bind(this));
	if(domain) {
		return this.domains[domain].getOfferingById(offeringId);
	}
	return(null);	
};

/*
 * Simple wrapper class, defining a set of entities/offerings in a domain
 * Each tag contains an id and a name: {id: 'performance_1', name: 'Scalability'}
 * @param {String} name - domain name
 * @param {Object} offerings[]
 * @param {String} offerings.id - offering id
 * @param {String} offerings.name - offering name
 */
function Domain(name, offerings) {
	this.name = name || 'default';
	this.offerings = offerings || [];
}

Domain.prototype.getName = function() {
	return this.name;
};

Domain.prototype.getOfferings = function() {
	return this.offerings;
};

Domain.prototype.getOfferingById = function(offeringId) {
	return _.find(this.offerings, {id: offeringId});
};

Domain.prototype.getOfferingByName = function(offeringName) {
	return _.find(this.offerings, {name: offeringName});
};

module.exports.DomainSpec = DomainSpec;
module.exports.Domain = Domain;
