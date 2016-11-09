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
const async = require('async');
const debug = require('debug')('nps:init');
const debug_data = require('debug')('nps:data');

const domain = require('./domain.js');
const score = require('./score.js');
const TagSet = require('./tags.js');

/*
 * Load domain information from the metadata repository
 * @param {Object} metaRepository
 * @param {callback} domainCallback(err, domains)
 */
var loadDomains = function(metaRepository, domainCallback) {

	if(! metaRepository) {
		console.error('Incorrect invocation of loadDomains: ' + metaRepository + ' is not defined');
		return [];
	}

	debug('Fetching documents using "domains_spec" view.');
	metaRepository.view('metadata', 
						'domains_spec',
						{reduce:false, include_docs:true},
						function(err, domainDocs) {
							if(err) {
								console.error('Fetch for "domains_spec" view failed: ' + err);
								// fatal error
								return domainCallback('Fetch for "domains_spec" view failed: ' + err);
							}
							else {
								var domainSpec = new domain.DomainSpec();
								debug_data('Fetched domain documents: ' + JSON.stringify(domainDocs));
								if(domainDocs.rows.length > 0) {
									_.forEach(domainDocs.rows, 
											  function(domainDoc) {							 	
												if((domainDoc.doc.type === 'domain') && (domainDoc.doc.domain_id) && (domainDoc.doc.entities) && (Array.isArray(domainDoc.doc.entities)) && (domainDoc.doc.entities.length > 0)) {
													domainSpec.addDomain(new domain.Domain(domainDoc.doc.domain_id, _.sortBy(domainDoc.doc.entities, function(entity) {return entity.name.toLowerCase();})));
												}
												else {
													console.error('Ignoring invalid domain document: ' + JSON.stringify(domainDoc));
												}
									});
									if(domainSpec.isEmpty()) {
										console.error('No valid domain specification was found in the metadata database.');
										// fatal error
										return domainCallback('No valid domain specification was found in the metadata database.');
									}
									else {
										debug_data('Loaded domain information: ' + JSON.stringify(domainSpec));
										return domainCallback(null, domainSpec);
									}
								}
								else {
									// no domain specification document was found; create one if a default spec 
									// is present in "default_specs/default_domain_spec"
									debug('The "domains_spec" view did not return any documents containing valid domain specifications. Trying to load application defaults.');
									try {
										const default_domain_spec = require('../default_specs/default_domain_spec.json');	
										debug_data('Fetched default domain specification document: ' + JSON.stringify(default_domain_spec));					 	
										if((default_domain_spec.type === 'domain') && (default_domain_spec.entities) && (default_domain_spec.entities.length > 0)) {
											    domainSpec.addDomain(new domain.Domain(default_domain_spec.domain_id, _.sortBy(default_domain_spec.entities, function(entity) {return entity.name.toLowerCase();})));
										}
										else {
											console.error('Default domain specification document is invalid: ' + JSON.stringify(default_domain_spec));
											// fatal error
											return domainCallback('No valid domain specification was found in the metadata database or in "default_specs/default_domain_spec.json".');
										}

										debug_data('Default domain specification: ' + JSON.stringify(domainSpec));

										// save default domain spec in the repository database
										metaRepository.insert(default_domain_spec, 
															  function(err) {
															  	if(err) {
															  		console.error('Default domain specification could not be saved in the repository database: ' + err);
															  		// no recovery needed; the defaults have been loaded
															  	}
															  	return domainCallback(null, domainSpec);
															  });
									}
									catch(err) {
										console.error('Default domain specification could not be loaded: ' + err);
										// fatal error
										return domainCallback('Default domain specification could not be loaded: ' + err);
									}
								}		
							}
						});				
};

/*
 * Load tag specification from the metadata repository.
 * @param {Object} metaRepository
 * @param {callback} tagsCallback(err, tags)
 */
var loadTagSpec = function(metaRepository, tagsCallback) {

	if(! metaRepository) {
		console.error('Incorrect invocation of loadTagSpec: ' + metaRepository + ' is not defined');
		return [];
	}

	debug('Fetching documents using "tag_spec" view.');
	metaRepository.view('metadata', 
						'tag_spec',
						{reduce:false, include_docs:true},
						function(err, tagSetDocs) {
							if(err) {
								console.error('Fetch for "tag_spec" view failed: ' + err);
								return tagsCallback('Fetch for "tag_spec" view failed: ' + err);
							}
							else {
								var tagSets = [];
								debug_data('Fetched tag set documents: ' + JSON.stringify(tagSetDocs));
								if(tagSetDocs.rows.length > 0) {
									_.forEach(tagSetDocs.rows, 
											 function(tagSetDoc) {							 	
												if(tagSetDoc.doc.type === 'tags') {
													if((tagSetDoc.doc.tags) && (tagSetDoc.doc.tags.length > 0)) {
														tagSets.push(new TagSet(tagSetDoc.doc.set_name, _.sortBy(tagSetDoc.doc.tags, ['name'])));
													}
													else {
														console.error('Ignoring invalid tags document: ' + JSON.stringify(tagSetDoc));
													}
												}
									});
									debug_data('Loaded tags specification: ' + JSON.stringify(tagSets));
									return tagsCallback(null, tagSets);
								}
								else {
									// no tag specification document was found; create one if a default spec 
									// is present in "default_specs/default_tag_spec"
									try {
										const default_tag_spec = require('../default_specs/default_tag_spec.json');	
										debug_data('Fetched default tag specification document: ' + JSON.stringify(default_tag_spec));					 	
										if(default_tag_spec.type === 'tags') {
											if((default_tag_spec.tags) && (default_tag_spec.tags.length > 0)) {
												tagSets.push(new TagSet(default_tag_spec.set_name, _.sortBy(default_tag_spec.tags, ['name'])));
											}
											else {
												console.error('Ignoring invalid tag specification document: ' + JSON.stringify(default_tag_spec));
											}
										}

										debug_data('Default tag specification: ' + JSON.stringify(tagSets));

										// save default tag spec in the repository database
										metaRepository.insert(default_tag_spec, 
															  function(err) {
															  		if(err) {
															  			console.error('Default tag specification could not be saved in the repository database:' + err);
															  			// no recovery needed; the defaults have been loaded
															  		}
															  		return tagsCallback(null, tagSets);
															  });
									}
									catch(err) {
										console.error('Default tag specification could not be loaded: ' + err + '. No tags will be used.');
										debug_data('Loaded tags specification: ' + JSON.stringify(tagSets));
										return tagsCallback(null, tagSets);
									}
								}		
							}
						});				
};

/*
 * Load score spec from the metadata repository. If load fails, load it from 
 * "default_specs/default_score_spec.json". If load fails, use built-in defaults.
 * @param {Object} metaRepository
 * @param {callback} scoresCallback(err, scores)
 */
var loadScoreSpec = function(metaRepository, scoresCallback) {

	if(! metaRepository) {
		console.error('Incorrect invocation of loadScoresSpec: ' + metaRepository + ' is not defined');
		return [];
	}
	var scoreSpec = new score.ScoreSpec();
	debug('Fetching score specification');
	metaRepository.get('score_spec', 
						function(err, scoresDoc) {
							if(err) {
								console.error('Fetch of custom scores specification failed: ' + err + '. Using default score specification.');
								try {
									const default_score_spec = require('../default_specs/default_score_spec.json');	
									debug_data('Fetched default scores specification document: ' + JSON.stringify(default_score_spec));
									_.forEach(default_score_spec.scores, 
											 function(aScoreDef) {
											 	scoreSpec.addScore(new score.Score(aScoreDef.name, aScoreDef.value, aScoreDef.sentiment));
									});
									debug_data('Default score specification: ' + JSON.stringify(scoreSpec));

									// save default score spec in the repository database
									metaRepository.insert(default_score_spec, 
														  function(err) {
														  		if(err) {
														  			console.error('Default score specification could not be saved in the repository database:' + err);
														  			// no recovery needed; the defaults have been loaded
														  		}
														  		return scoresCallback(null, scoreSpec);
														  });
								}
								catch(err) {
									console.error('Default score scpecification could not be loaded: ' + err + '. Using built-in defaults.');
									scoreSpec.addScore(new score.Score('0 (worst)', 0, 'negative'));
									scoreSpec.addScore(new score.Score('1', 1, 'negative'));
									scoreSpec.addScore(new score.Score('2', 2, 'negative'));
									scoreSpec.addScore(new score.Score('3', 3, 'negative'));
									scoreSpec.addScore(new score.Score('4', 4, 'neutral'));
									scoreSpec.addScore(new score.Score('5', 5, 'neutral'));
									scoreSpec.addScore(new score.Score('6', 6, 'neutral'));
									scoreSpec.addScore(new score.Score('7', 7, 'neutral'));
									scoreSpec.addScore(new score.Score('8', 8, 'positive'));
									scoreSpec.addScore(new score.Score('9', 9, 'positive'));
									scoreSpec.addScore(new score.Score('10 (best)', 10, 'positive'));
									debug_data('Loaded scores specification: ' + JSON.stringify(scoreSpec));
									return scoresCallback(null, scoreSpec);
								}
							}
							else {
								debug_data('Fetched custom score specification document: ' + JSON.stringify(scoresDoc));
								_.forEach(scoresDoc.scores, 
										 function(aScoreDef) {
										 	scoreSpec.addScore(new score.Score(aScoreDef.name, aScoreDef.value, aScoreDef.sentiment));
								});
								debug_data('Loaded custom score specification: ' + JSON.stringify(scoreSpec));
								return scoresCallback(null, scoreSpec);		
							}
						});				
};


/*
 * Initialize repository and load defaults
 * @param {Object} appEnv
 * @param {callback} initCallback
 */
var init = function(appEnv, initCallback) {

	if(! process.env.SLACK_TOKEN) {
	    debug(JSON.stringify(appEnv));
	    return initCallback('Configuration error. Environment variable SLACK_TOKEN is not set.');
	}

	if(! process.env.SLACK_URL) {
	    debug(JSON.stringify(appEnv));
	    return initCallback('Configuration error. Environment variable SLACK_URL is not set.');
	}

	const couchDBCredentials = appEnv.getServiceCreds('nps-cloudant');

	if(! couchDBCredentials) {
	    debug_data('appEnv: ' + JSON.stringify(appEnv));
	    return initCallback('Configuration error. No CouchDB/Cloudant is bound to this service.');
	}
	else {
		debug_data('couchDBCredentials: ' + JSON.stringify(couchDBCredentials));
	}

	const repository = require('cloudant')({url:couchDBCredentials.url});

	const dataRepositoryName = 'nps-data';
	const metaRepositoryName = 'nps-meta';

	async.parallel({
						data: function(asyncCallback) {
							const designDoc = {
											    _id: '_design/stats',
											    views: {
											     all_ratings: {
											       map: 'function (doc) {\n  if(doc.type === \'rating\') {\n emit(doc.data.offering_id, 1);}\n}'
											     },
											     minmaxavg: {
      											   map: 'function (doc) {\n  if (doc.type && doc.type === \'rating\' && doc.data && doc.data.score && !isNaN(doc.data.score)) {\n    emit(doc.data.offering_id, Number(doc.data.score));\n  }\n}',
      											   reduce: '_stats'
    											 },
											     ratings_per_month: {
											      map: 'function (doc) {\n  if(doc.type && doc.type === \'rating\' && doc.data && doc.created) { \nemit([doc.data.offering_id, doc.created.substr(0,7)], doc.data.score);}\n}',
											      reduce: '_stats'
											     }
											   },
											   language: 'javascript'
											  };
							repository.db.get(dataRepositoryName, 
										   	  function(err, body) {
												if(err) {
													// try to create the database
													console.log('Cannot get information about database "' + dataRepositoryName + '": ' + err);
													repository.db.create(dataRepositoryName, function(err) {
														if(err) {
															return asyncCallback('Cannot create database "' + dataRepositoryName + '": ' + err);
														}

														var dataRepository = repository.use(dataRepositoryName);
														// create design document
														dataRepository.insert(designDoc, 
																			  designDoc._id,
																			  function (err) {																		  	
																			  		if(err)	 {
																			  			console.error('Could not create design document in data repository database: ' + JSON.stringify(err));
																			  			return asyncCallback('Could not create design document in data repository database: ' + err);	
																			  		}
																			  		else {
																			  			console.log('Created design document in the data repository database.');
																						return asyncCallback(null, dataRepository);
																			  		}
																			  });											
													});
												}
												else {
													debug('data repository database stats: ' + JSON.stringify(body));
													var dataRepository = repository.use(dataRepositoryName);
													// make sure the design document exists
													dataRepository.get(designDoc._id, 
																	   function (err) {
																	   		if(err)	{
																	   			debug('Design document ' + designDoc._id + ' was not found: ' + err);
																				dataRepository.insert(designDoc, 
																									  designDoc._id,
																									  function (err) {																		  	
																									  		if(err)	 {
																									  			console.error('Could not create design document in data repository database: ' + err);
																									  			return asyncCallback('Could not create design document in data repository database: ' + err);	
																									  		}
																									  		else {
																									  			console.log('Created design document in the data repository database.');
																												return asyncCallback(null, dataRepository);
																									  		}
																									  });
																	   		}
																	   		else {
																	   			debug('Design document ' + designDoc._id + ' was found in the data repository database.');
																	   			return asyncCallback(null, dataRepository);
																	   		}
																	   });		
												}
								});
						},
						meta: function(asyncCallback) {

							const designDoc = {
												_id: '_design/metadata',
											    views: {
												    auth_tokens: {
												      map: 'function (doc) {\n  if(doc.type && doc.type === \'token\') {\n    emit(doc._id, [doc.user_name, doc.created]);\n  }\n}'
												    },
												    expired_tokens: {
												      reduce: '_count',
												      map: 'function (doc) {\n  if(doc.type === \'token\') {\n    var remaining = Math.floor(((1800 * 1000) - (new Date() - new Date(doc.created)))/60000);\n    if(remaining <= 0) {\n      emit(doc.user_name, doc.created);      \n    }\n  }\n}'
												    },
												    domains_spec: {
												      reduce: '_count',
												      map: 'function (doc) {\n if(doc.type && doc.type === "domain") {\n  var entities = [];\n  for(var e in doc.entities) {\n  entities.push(doc.entities[e].name);\n }\n  emit(doc.domain_id, entities);    }\n}\n'
												  	},
												  	tag_spec: {
	      												map: 'function (doc) {\n  if(doc.type && doc.type === \'tags\') {\n  var tags = [];\n   for(var t in doc.tags) {\n   tags.push(doc.tags[t].name);\n    }\n    emit(doc._id, tags.sort());  \n  }\n  \n}\n'
	      											},
	      											score_spec: {
	      												map: 'function (doc) {\n  if(doc._id === \'score_spec\') {\n  var scores = [];\n   for(var s in doc.scores) {\n   scores.push(doc.scores[s].name);\n    }\n    emit(doc._id, scores.sort());  \n  }\n  \n}\n'
	      											}
											  	},
											  	language: 'javascript'
											 };

							repository.db.get(metaRepositoryName, 
										   function(err, body) {
												if(err) {
													// try to create the database
													console.log('Cannot get information about database "' + metaRepositoryName + '": ' + err);
													repository.db.create(metaRepositoryName, function(err) {
														if(err) {
															return asyncCallback('Cannot create database "' + metaRepositoryName + '": ' + err);
														}

														var metaRepository = repository.use(metaRepositoryName);
														// create design document
														metaRepository.insert(designDoc, 
																			  designDoc._id,
																			  function (err) {																		  	
																			  		if(err)	 {
																			  			console.error('Could not create design document in repository database: ' + err);
																			  			return asyncCallback('Could not create design document in repository database: ' + err);	
																			  		}
																			  		else {
																			  			console.log('Created design document in the repository database.');
																						return asyncCallback(null, metaRepository);
																			  		}
																			  });
													});
												}
												else {
													debug('metada repository database stats: ' + JSON.stringify(body));
													var metaRepository = repository.use(metaRepositoryName);

													// make sure the design document exists
													metaRepository.get(designDoc._id, 
																	   function (err) {
																	   		if(err)	{
																	   			debug('Design document ' + designDoc._id + ' was not found.');
																				metaRepository.insert(designDoc, 
																									  designDoc._id,
																									  function (err) {																		  	
																									  		if(err)	 {
																									  			console.error('Could not create design document in repository database: ' + err);
																									  			return asyncCallback('Could not create design document in repository database: ' + err);	
																									  		}
																									  		else {
																									  			console.log('Created design document in the repository database.');
																												return asyncCallback(null, metaRepository);
																									  		}
																									  });
																	   		}
																	   		else {
																	   			return asyncCallback(null, metaRepository);
																	   		}
																	   });
												}
											});
						}
				   },
				   function(err, handles) {
				   		// async.parallel callback
						if(err) {
							// repository initialization failed
							return initCallback(err);
						}

						// load scores specification from metadata database
						async.parallel({
										// load domain spec from metadata repository
										domains: function(asyncCallback) {
											loadDomains(handles.meta, function(err, domainSpec) {
												if(err) {
													return asyncCallback(err);								
												}
												return asyncCallback(null, domainSpec);
											});
										},
										// load tag information from metadata repository
										tags: function(asyncCallback) {
											loadTagSpec(handles.meta, function(err, tagSets) {
												if(err) {
													return asyncCallback(err);								
												}																						
												return asyncCallback(null, tagSets);
											});
										},
										// load scores information from metadata repository
										scores: function(asyncCallback) {
											loadScoreSpec(handles.meta, function(err, scoreSpec) {
												if(err) {
													return asyncCallback(err);								
												}																						
												return asyncCallback(null, scoreSpec);
											});
										},										
									   },
									   function(err, results) {
									   	// async.parallel callback
										if(err) {
											// domain spec, tag spec or scores spec could not be loaded
											return initCallback(err);								
										}
										else {
											// return data database handle, metadata database handle, domain spec and tags spec
											return initCallback(null, handles.data, handles.meta, results.domains, results.tags, results.scores);
										}
									   });
				   });
};

module.exports = init;