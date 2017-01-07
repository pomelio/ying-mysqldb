# Node JS MySQL utilities with squel.js

## Features

 * Automatic Transaction management
 * Automatic Connection management
 * utilities API to simplify DB Accessing


## Synopsis

### MYSQL dbConfig.json

```js
{
	"master":{
		"host": "localhost",
		"user": "user1",
		"password": "1122sz",
		"database": "user"
	},
	"slave":{
		"host": "localhost",
		"user": "user1",
		"password": "1122sz",
		"database": "user"
	}
}
```

###get 1 record or null
```js
'use strict';
var debug = require('debug')('AppServer:DBService');
var sql = require('squel').useFlavour('mysql');
var db = require('ying-mysqldb');

exports.getById = function(conn, model, id) {
	debug('getById->model:%s,id:%s', model, id);
	var ql = sql.select();
	ql.from(model);

	ql.where('id=?', id);
	return db.get(conn, ql);
};

exports.getUser = function(conn, id) {
	debug('getUser->ID:%s', id);
	return exports.getById(conn, 'user', id);
};

exports.getEmailAuth = function(conn, email) {
	debug('getEmailAuth->email:%s', email);
	var ql = sql.select();
	ql.from('email_auth');

	ql.where('email=?', email);
	return db.get(conn, ql);
};
```

### get multi records or empty array
```js

exports.listProfile = function(conn) {
	debug('listProfile');
	var ql = sql.select();
	ql.from('profile');
	ql.where('deleteTime=0');
	ql.order('createTime', true);

	return db.list(conn, ql);
};


```

### Insert an object
```js

exports.insertUser = function(conn, user) {
	debug('insertUser:user:%o', user);
	if (!user.id) {
		return Promise.reject(Errors.fieldNotFound('id is not allowed null', user));
	}

	if (!user.nickName) {
		return Promise.reject(
			Errors.fieldNotFound('nickName is not allowed null', user));
	}

	if (!user.accessToken) {
		return Promise.reject(
			Errors.fieldNotFound('accessToken is not allowed null', user));
	}

	var ql = sql.insert();
	ql.into('user');

	ql.set('id', user.id);
	ql.set('nickName', user.nickName);
	ql.set('createTime', utils.now());

	if (user.lat && user.lng) {
		ql.set('lat', user.lat);
		ql.set('lng', user.lng);
	}
	if (user.ip) {
		ql.set('ip', user.ip);
	}
	if (user.pictureID) {
		ql.set('pictureID', user.pictureID);
	}
	if (user.timezone) {
		ql.set('timezone', user.timezone);
	}
	if (user.country) {
		ql.set('country', user.country);
	}

	return db.update(conn, ql);
};

```

### Update an object
```js
exports.updateUser = function(conn, user) {
	debug('updateUser:user:%o', user);
	if (!user.id) {
		return Promise.reject(Errors('id is not allowed null', user));
	}

	let flag = false;
	var ql = sql.update();
	ql.table('user');

	if (user.nickName) {
		flag = true;
		ql.set('nickName', user.nickName);
	}

	if (user.role) {
		flag = true;
		ql.set('role', user.role);
	}


	if (user.pictureID) {
		flag = true;
		ql.set('pictureID', user.pictureID);
	}

	if (user.hasOwnProperty('lockTime')) {
		flag = true;
		ql.set('lockTime', user.lockTime);
	}

	if (user.hasOwnProperty('lat')) {
		flag = true;
		ql.set('lat', user.lat);
	}

	if (user.hasOwnProperty('lng')) {
		flag = true;
		ql.set('lng', user.lng);
	}

	if (user.ip) {
		flag = true;
		ql.set('ip', user.ip);
	}

	if (!flag) {
		return Promise.reject(Errors.fieldNotFound('field not allowed null', user));
	}

	ql.where('id=?', user.id);

	return db.update(conn, ql);
};
```

### Connection Management (only select, no changing in data)
```js

var mysql = require('mysql');

var dbconfig = require('./dbconfig');

var db = require('ying-mysqldb');

var dbserv = require('../DBService');

var pool = mysql.createPool({
	host: dbconfig.slave.host,
	user: dbconfig.slave.user,
	password: dbconfig.slave.password,
	database: dbconfig.slave.database
});


var signIn = function(usr) {
	debug('signIn->user:%o', usr);
	return db.sql(pool, conn => {
		return dbserv.getEmailAuth(conn, usr.email).then(auth => {
			if (!auth) {
        throw Errors.notFound('email is not found.', {user: usr});
      }
			if (usr.pwd !== auth.pwd) {
        throw Errors.mismatched('password is mismatched.', {auth:maskAuth(auth)});
      }
      return dbserv.getUser(conn, auth.userID).then(user => {
        if (user.lockTime > 0) {
          throw Errors.isLocked('user is locked.', {user: maskUser(user)});
        }
        return user;
      });
		});
	});
};


```

### Automatic Transaction management (multi insert/update/delete)
```js

var mysql = require('mysql');

var dbconfig = require('../dbconfig');

var db = require('ying-mysqldb');

var dbserv = require('../DBService');

var pool = mysql.createPool({
	host: dbconfig.master.host,
	user: dbconfig.master.user,
	password: dbconfig.master.password,
	database: dbconfig.master.database
});

var saveUserInfo = function(sec_userID, userInfo) {
	debug('start saveUserInfo. userInfo:%o', userInfo);

	return db.tx(pool, conn => {
		return dbserv.getUserInfo(conn, userInfo.userID).then(usrInfo => {
			if (!usrInfo) {
				return dbserv.insertUserInfo(conn, userInfo);
			} else {
				return dbserv.updateUserInfo(conn, userInfo);
			}
		});
	});
};
```
