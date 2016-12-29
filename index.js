'use strict';

var debug = require('debug')('mysqldb');

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

		},  err => {
			debug('---reject---%o', err);
			reject(err);
		});
	});
}

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
