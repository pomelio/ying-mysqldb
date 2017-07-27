'use strict';

var debug = require('debug')('mysqldb');

/**
 * Start a database transcation and return a promise
 * which resolve into a database connection in the transaction
 * or reject with error.
 * @param {mysql.pool} pool - mysql databse connection pool object.
 */

function beginTransaction(pool) {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, conn) => {
			if (err) {
				debug('getConnection---reject---');
				reject(err);
			} else {
				conn.beginTransaction(errr => {
					if (errr) {
						debug('beginTransaction---reject---');
						reject(errr);
					} else {
						resolve(conn);
					}
				});
			}
		});
	});
}

/**
 * Return a promise which resolve into a database
 * connection or reject with an error.
 * select afterwards.
 * @param {mysql.pool} pool - mysql database connection pool
 */
function beginQuery(pool) {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, conn) => {
			if (err) {
				debug('getConnection---reject---');
				reject(err);
			} else {
				resolve(conn);
			}
		});
	});
}

/**
 * Commit database changes made from callback function and 
 * return a promise which is the promise return from the callback
 * function or rollback all the changes and reject with an 
 * error. All the database changes 
 * should be put inside the callback function sharing same connection object
 *  and return a promise object.
 * @param {myql.pool} pool - mysql database connection pool
 * @param {function(conn: mysql.connection) Promise => {}} callback - callback function which includes all the database changes in a transaction. 
 * 
 */
function tx(pool, callback) {
	return new Promise((resolve, reject) => {
		beginTransaction(pool).then(conn => {
			debug('---begin transaction---');
			Promise.resolve(conn).then(callback).then(data => {
				conn.commit(err => {
					debug('---commit---');
					if (err) {
						debug('commit---reject---');
						reject(err);
					} else {
						resolve(data);
					}
				});
				debug('---connection release');
				conn.release();
			}).catch(err => {
				reject(err);
				debug('rollback:%o', err);
				conn.rollback(error => {
					debug('---rollback---');
				});
				debug('---connection release');
				conn.release();
			});

		}, err => {
			debug('beginTransaction---reject---%o', err);
			reject(err);
		});
	});
}


/**
 * return a promise which is the promise return from the callback
 * function or reject with an 
 * error. All the database select statements 
 * should be put inside the callback function shareing with same connection
 * object and return a promise
 * object.
 * @param {myql.pool} pool - mysql database connection pool
 * @param {function(conn: mysql.connection) Promise => {}} callback - callback function which includes all the database changes in a transaction. 
 * 
 */
function sql(pool, callback) {
	return new Promise((resolve, reject) => {
		beginQuery(pool).then(conn => {
			Promise.resolve(conn).then(callback).then(data => {
				debug('---connection release');
				conn.release();
				if (resolve) {
					resolve(data);
				}
			}).catch(err => {
				debug('---connection release');
				conn.release();
				debug('---reject---%o', err);
				reject(err);
			});

		}, err => {
			debug('---reject---%o', err);
			reject(err);
		});
	});
}


/**
 * return a promise which resolves to null or first record from a select statement
 * @param {mysql.connection} conn - the database connection
 * @param {squel.ql} ql - select statement 
 */
function get(conn, ql) {
	debug('start get');
	ql.limit(1);
	return new Promise((resolve, reject) => {
		let param = ql.toParam();
		debug('*********sql:%o', param);
		conn.query(param.text, param.values, (err, rows, fields) => {
			if (err) {
				debug('conn.query---reject---');
				reject(err);
				return;
			}
			if (rows.length > 0) {
				var result = rows[0];
				debug('success:%o', result);
				resolve(result);
			} else {
				resolve(null);
			}
		});
	});

}

/**
 * return an promise which resolve to an empty array or records from a select statement
 * @param {mysql.connection} conn - the database connection
 * @param {squel.ql} ql - select statement 
 */
function list(conn, ql) {
	debug('start list');
	return new Promise((resolve, reject) => {
		let param = ql.toParam();
		debug('*********sql:%o', param);
		conn.query(param.text, param.values, (err, rows, fields) => {
			if (err) {
				debug('conn.query---reject--');
				reject(err);
				return;
			}
			var result = rows;
			debug('success:%o', result);
			resolve(result);
		});
	});
}

/**
 * return a promise which resolve from the result of executing a insert/update/delete statement
 * @param {mysql.connection} conn - the database connection
 * @param {squel.ql} ql - select statement 
 */
function update(conn, ql) {
	debug('start update');
	return new Promise((resolve, reject) => {
		let param = ql.toParam();
		debug('*********sql:%o', param);
		conn.query(param.text, param.values, (err, result) => {
			if (err) {
				debug('conn.query---reject---');
				reject(err);
				return;
			}
			debug('success:%o', result);
			resolve(result);
		});
	});
}

/**
 * return a promise which resolve from the result of executing a insert/update/delete statement
 * @param {mysql.connection} conn - the database connection
 * @param {string} ql - select statement string
 */
function run(conn, sql) {
	debug('start update');
	return new Promise((resolve, reject) => {
		debug('*********sql:%s', sql);
		conn.query(sql, (err, result) => {
			if (err) {
				debug('conn.query---reject---');
				reject(err);
				return;
			}
			debug('success:%o', result);
			resolve(result);
		});
	});
}

/**
 * return a promise which resolve from the result rows of executing a select statement
 * @param {mysql.connection} conn - the database connection
 * @param {string} ql - select statement string
 */
function runList(conn, sql) {
	debug('start list');
	return new Promise((resolve, reject) => {
		debug('*********sql:%s', sql);
		conn.query(sql, (err, rows, fields) => {
			if (err) {
				debug('conn.query---reject---');
				reject(err);
				return;
			}
			var result = rows;
			debug('success:%o', result);
			resolve(result);
		});
	});
}

module.exports = {
	tx,
	sql,
	get,
	list,
	update,
	run,
	runList,
};
