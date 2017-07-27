'use strict';
var debug = require('debug')('DataWorker:WorkerDB');
var sql = require('squel').useFlavour('mysql');
var Errors = require('./Errors');
var db = require('ying-mysqldb');
var utils = require('ying-utils');


function getById(conn, model, id) {
	debug('getById:model:%s,id:%s', model, id);
	var ql = sql.select();
	ql.from(model);

	ql.where('id=?', id);
	return db.get(conn, ql);
}

function deleteById(conn, model, id) {
	debug('deleteById:model:%s,id:%s', model, id);
	var nw = utils.now();
	var ql = sql.update();
	ql.table(model);

	ql.set('deleteTime', nw);
	ql.set('lastModified', nw);
	ql.where('id=?', id);

	return db.update(conn, ql);
}



function insertSpace(conn, space) {
	debug('insertSpace:space:%o', space);
	if (!space.id) {
		return Promise.reject(Errors.makeError('ER_SPACE_ID_NOT_FOUND', {space}));
	}

	if (!space.createTime) {
		return Promise.reject(Errors.makeError('ER_CREATE_TIME_NOT_FOUND', {space}));
	}

	if (!space.lastModified) {
		return Promise.reject(Errors.makeError('ER_LAST_MODIFIED_NOT_FOUND', {space}));
	}

	var ql = sql.insert();
	ql.into('space');

	ql.set('id', space.id);
	ql.set('createTime', space.createTime);
	ql.set('lastModified', space.lastModified);
	if (space.name) {
		ql.set('name', space.name);
	}
	if (space.pictureID) {
		ql.set('pictureID', space.pictureID);
	}

	return db.update(conn, ql);
}

function updateSpace(conn, space) {
	debug('updateSpace:space:%o', space);
	if (!space.id) {
		return Promise.reject(Errors.makeError('ER_SPACE_ID_NOT_FOUND', {space}));
	}

	let flag = false;
	var ql = sql.update();
	ql.table('space');

	if (space.name) {
		flag = true;
		ql.set('name', space.name);
	}

	if (space.pictureID) {
		flag = true;
		ql.set('pictureID', space.pictureID);
	}

	if (space.hasOwnProperty('lockTime')) {
		flag = true;
		ql.set('lockTime', space.lockTime);
	}

	if (space.accessToken) {
		flag = true;
		ql.set('accessToken', space.accessToken);
	}
	if (space.trackingID) {
		flag = true;
		ql.set('trackingID', space.trackingID);
	}
	ql.set('lastModified', space.lastModified);

	if (!flag) {
		return Promise.reject(Errors.makeError('ER_UPDATE_NO_FILEDS', {space}));
	}

	ql.where('id=?', space.id);

	return db.update(conn, ql);
}

function deleteSpace(conn, spaceID) {
	debug('deleteSpace:spaceID:%s', spaceID);
	return deleteById(conn, 'space', spaceID);
}

function getArticle(conn, spaceID, id) {
	debug('getArticle:id:%s', id);
	return getById(conn, 'article_' + spaceID, id);
}

function insertArticle(conn, spaceID, article) {
	debug('insertArticle:spaceID:%s, article:%o', spaceID, article);
	var ql = sql.insert();
	ql.into('article_' + spaceID);

	if (!article.id) {
		return Promise.reject(Errors.makeError('ER_ARTICLE_ID_NOT_FOUND', {article}));
	}

	if (!article.title) {
		return Promise.reject(
			Errors.makeError('ER_TITLE_NOT_FOUND', {article}));
	}

	ql.set('id', article.id);

	ql.set('title', article.title);
	ql.set('priorityTime', article.priorityTime);
	ql.set('createTime', article.createTime);
	ql.set('lastModified', article.lastModified);

	return db.update(conn, ql);
}

function updateArticle(conn, spaceID, article) {
	debug('updateArticle:spaceID:%s, article:%o', spaceID, article);
	if (!article.id) {
		return Promise.reject(Errors.makeError('ER_ARTICLE_ID_NOT_FOUND', {article}));
	}

	var ql = sql.update();
	ql.table('article_' + spaceID);

	var flag = false;

	if (article.title) {
		ql.set('title', article.title);
		flag = true;
	}

	if (article.hasOwnProperty('deleteTime')) {
		ql.set('deleteTime', article.deleteTime);
		flag = true;
	}

	if (article.hasOwnProperty('priorityTime')) {
		ql.set('priorityTime', article.priorityTime);
		flag = true;
	}

	if (!flag) {
		return Promise.reject(
			Errors.makeError('ER_NO_FILED_CHANGED', {article}));
	}
	ql.set('lastModified', article.lastModified);
	ql.where('id=?', article.id);

	return db.update(conn, ql);
}


function listSpaceArticles(conn, spaceID) {
	debug('listSpaceArticles->spaceID%s', spaceID);
	var ql = sql.select();
	ql.from('article_' + spaceID);

	ql.order('priorityTime', false);
	ql.order('createTime', false);
	return db.list(conn, ql);
}

function deleteArticle(conn, spaceID, articleID) {
	debug('deleteArticle:spaceID:%s,articleID:%s', spaceID, articleID);
	return deleteById(conn, 'article_' + spaceID, articleID);
}


module.exports = {
	getById,
	deleteById,
	insertSpace,
	updateSpace,
	getArticle,
	insertArticle,
	updateArticle,
	deleteArticle,
};
