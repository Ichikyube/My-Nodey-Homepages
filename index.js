var connect = require('connect'),
    path = require("path"),
    Router       = require('router'),
    serveStatic = require('serve-static'),
    mustache     = require("mustache");
var http = require('http'),
    https = require('https');
var app = connect();
var router = Router();

// gzip/deflate outgoing responses
var compression = require('compression');
app.use(compression());

// store session state in browser cookie
var cookieSession = require('cookie-session');
app.use(cookieSession({
    keys: ['secret1', 'secret2']
}));

// parse urlencoded request bodies into req.body
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(serveStatic(path.join(__dirname, 'public')));
app.use(router.get("/sayHello/:firstName/:lastName", function (req, res) {
    var userName = req.params.firstName + " " + req.params.lastName,
        html = "<html lang=\"en\"><head><title>Hello " + userName + "</title></head>" +
        "<body>" + userName + ", you are in nowhere</div></body></html>";
    res.end(html);
}));

app.use(router.post("builder", function (req, res) {
    var options = {
        shim:req.body.html5shim,
        flash:req.body.useFlash,
        sockets:req.body.useWebSockets,
        jsonp:req.body.useJsonp
    }
}));

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
//create node.js http server and listen on port
io.on('connection', (socket) => {
    console.log('a user connected');
  });
server.listen(3000, () => {
    console.log('listening on *:3000');
  });
//https.createServer(options, app).listen(443);
requirejs(["text!public/css/theme.css"], function(tmpl) {
    
    var css = mustache.to_html(tmpl, theme);
    res.writeHead(200, {
        "Content-Type": "text/css",
        "Content-Length": css.length
    });
    res.end(css);
});

function render(res,filename, data, style, script, callback) {
    requirejs(["text!public/" + filename], function(tmpl) {
        if(callback) {
            callback(res, tmpl, data, style, script);
        } else {
            var html = mustache.to_html(
                parentTmpl,
                {content: data},
                {content: tmpl, stylesheets: style || "", scripts:script || ""}
            );
            res.end(html);
        }
    })
}