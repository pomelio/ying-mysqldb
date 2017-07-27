'use strict';

var debug = require('debug')('DataWorker:Worker');
var SHA256 = require('crypto-js/sha256');
var mysql = require('mysql');
var dbconfig = require('./dbconfig');

var utils = require('ying-utils');
var db = require('ying-mysqldb');

var dbserv = require('./WorkerDB');
var Errors = require('./Errors');

var pool = mysql.createPool({
	host: dbconfig.master.host,
	user: dbconfig.master.user,
	password: dbconfig.master.password,
	database: dbconfig.master.database,
	charset : 'utf8mb4'
});


var updateSpace = function(userID, space) {
	debug('start updateSpace. space:%o', space);

	return db.tx(pool, conn => {
		return dbserv.updateSpace(conn, space);
	});
};


function getArticle(request, spaceID, articleID) {
	debug('getArticle spaceID:%s,articleID:%s', spaceID, articleID);
	return db.sql(pool, conn => {
		return dbserv.getArticle(conn, spaceID, articleID).then(articleJ => {
			if (!articleJ) {
				throw Errors.makeError('ER_ARTICLE_NOT_FOUND', {spaceID, articleID});
			}
			return dbserv.listArticleParts(conn, spaceID, articleID);
		});
	});
}

var saveArticle = function(userID, article) {
	debug('start saveArticle. article:%o', article);
	let spaceID = article.spaceID;
	let nw = utils.now();
	return db.tx(pool, conn => {
		article.publishTime = nw;
		return dbserv.getArticle(conn, spaceID, article.id).then(articleJJ => {
			if (!articleJJ) {
				article.spaceID = spaceID;
				return dbserv.insertArticle(conn, spaceID, article);
			}
			return dbserv.updateArticle(conn, spaceID, article);
		});
	});
};

var deleteArticle = function(userID, spaceID, articleID) {
	debug('start deleteArticle spaceID:%s,articleID:%s', spaceID, articleID);
	return db.tx(pool, conn => {
		return dbserv.getArticle(conn, spaceID, articleID).then(articleJ => {
			if (!articleJ || (articleJ.deleteTime  && articleJ.deleteTime > 0)) {
				throw Errors.makeError('ER_ARTICLE_NOT_FOUND', {spaceID, articleID});
			}
			return dbserv.deleteById(conn, 'article_' + spaceID, articleID);
		});
	});
};


var newPhoto = function(userID, photo) {
	return db.tx(pool, conn => {
		return dbserv.insertPhoto(conn, photo);
	});
};
