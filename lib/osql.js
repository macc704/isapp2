var osql = {};

osql.db = 'isdb';
osql.via = null;
osql.baseurl = 'https://dbkiso.si.aoyama.ac.jp';
osql.url = osql.baseurl + '/oursql2/api/index.php';
osql.historyurl = osql.baseurl + '/oursql2/api/history.php';
osql.meurl = osql.baseurl + '/oursql2/api/me.php';

osql.requireLogin = function () {
    var token;
    token = osql.getParams()['token'];
    if (token) {
        localStorage.setItem('access-token', token);
        var url = document.URL;
        var goto = url.split('?')[0];
        window.location = goto;
    }

    token = osql.getCookies()['access-token'];
    if (!token) {
        token = localStorage.getItem('access-token');
    }

    if (!token) {
        osql.login();
    }
};

osql.login = function (userid, password, success, failure) {
    osql.goto(osql.baseurl + '/oursql2/oauth/login.php?referer=' + encodeURIComponent(document.URL));
};

osql.logout = function () {
    localStorage.removeItem('access-token');
    osql.goto(osql.baseurl + '/oursql2/oauth/logout.php?referer=' + encodeURIComponent(document.URL));
};

osql.goto = function (url) {
    if (!url) {
        return;
    }
    window.localStorage.setItem('referrer', location.href);
    window.location.href = url;
};

osql.back = function (defaulturl) {
    var ref = window.localStorage.getItem('referrer');
    if (ref) {
        window.location.href = ref;
    } else if (defaulturl) {
        window.location.href = defaulturl;
    } else {
        //do nothing
    }
};

osql.connectInsert = async function (sql) {
    var sqls = [];
    sqls.push(sql);
    sqls.push('select LAST_INSERT_ID() as lastId;');
    var obj = await osql.connect(JSON.stringify(sqls));
    return obj[0].lastId;
}

osql.connect = function (sql) {
    var query = {};
    query.db = osql.db;
    query.sql = sql;
    query.via = osql.via;
    return osql.connectImpl(query, osql.url);
}

osql.getMe = function () {
    var query = {};
    return osql.connectImpl(query, osql.meurl);
}

osql.connectImpl = function (query, url) {
    var token = localStorage.getItem('access-token');
    if (token) {
        query['access-token'] = token;
    }
    return new Promise(function (resolve) {
        $.post(url, query, function (data) {
            try {
                var res = JSON.parse(data);
                if (res.status != 200) {
                    if (res.status === 401) {//no token
                        osql.requireLogin();
                    }
                    if (failure) {
                        failure(res);
                    } else {
                        console.error('Error in osql.connect() \n sql:' + sql + '\n data: ' + data);
                    }
                    return;
                }
                if (res.objects) {
                    resolve(res.objects);
                } else if (res.user) {
                    var user = res.user;
                    var studentid = user.id.split('@')[0];
                    studentid = '1' + studentid.substring(1, 8);
                    user.studentid = studentid;
                    resolve(res.user);
                } else {
                    resolve(res);
                }
            } catch (ex) {
                console.error('Error in osql.connect() \n sql:' + query.sql + '\n data: ' + data);
                console.error(ex);
            }
        })
    });
}

osql.getParams = function () {
    var paramstr = document.location.search.substring(1);
    paramstr = decodeURI(paramstr);
    var paramstrs = paramstr.split('&');
    params = {};
    paramstrs.forEach(function (each) {
        var tokens = each.split('=');
        params[tokens[0]] = tokens[1];
    });
    return params;
};

osql.getParam = function (key) {
    return osql.getParams()[key];
};

osql.getCookies = function () {
    var cookies = {};
    var cookiesArray = document.cookie.split(';');

    //２つ目以降，cookieの前にスペースが入る実行系がある
    for (var c of cookiesArray) {
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        var cookie = c.split('=');
        cookies[cookie[0]] = cookie[1];
    }
    return cookies;
}
