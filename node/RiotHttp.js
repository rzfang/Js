import busboy from 'busboy';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import riot from 'riot';
import ssr from '@riotjs/ssr';
import url from 'url';

import Cache from './Cache.js';
import Is from '../Is.js';
import Log from '../Log.js';
import { FilesFind, Riot4Compile2 } from './Riot4Compile.js';
import RiotMixin from '../RiotMixin.js';

const Cch = Cache;

const MM_TP = {
  '.bmp':  'image/x-windows-bmp',
  '.css':  'text/css',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.jpg':  'image/jpeg',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.png':  'image/png',
  '.riot': 'application/javascript',
  '.svg':  'image/svg+xml',
  '.tag':  'text/plain',
  '.tar':  'application/x-tar',
  '.txt':  'text/plain',
  '.xml':  'application/xml' }; // mime type map.

let ErrPg, // error page.
    Pg, // page.
    Pt = 9004, // port.
    Rt = [], // route.
    SvcCs = {}, // service case.
    UpldFlPth; // uploaded file path.

const App = express();

/*
  @ body file.
  @ callback function. */
function HtmlRender (Bd, Then) {
  const FlPth = path.resolve(process.env.PWD, Bd.component);

  Cch.FileLoad(
    FlPth,
    (Err, FlStr) => { // error, file string.
      if (Err < 0) {
        Then('FileLoad', '<!-- can not load this component. -->');
        Log(`FileLoad(${Err}) - ${FlPth} - load file failed.`, 'error');

        return;
      }

      Then(null, FlStr);
    });
}

function Riot4Render (Rqst, Bd, Then) {
  const { component: Cmpnt, componentJs: CmpntJs, module: Mdl } = Bd;
  const JsNm = path.basename(CmpntJs),
        { name: Nm } = path.parse(Cmpnt); // path info.
  const MdlNm = Nm.replace(/-\w/g, Str => Str.substr(1).toUpperCase()); // module name.

  let Rslt = { // result.
    HdStr: '', // head string.
    BdStr: '', // body string.
    ScrptStr: '' // script stream.
  };

  Bd.initialize(
    Rqst,
    url.parse(Rqst.url),
    (Cd, Dt) => {
      if (Cd < 0) { return Then(null, `<!-- can not render '${Nm}' component. -->`); }

      const { html: HTML, css: CSS } = ssr.fragments(Nm, Mdl, Dt);

      Rslt.BdStr = HTML + '\n';
      Rslt.ScrptStr = `<script type='module'>\nimport ${MdlNm} from '/${JsNm}';\nconst ${MdlNm}Shell = hydrate(${MdlNm});\n${MdlNm}Shell(document.querySelector('${Nm}'));\n</script>\n`;

      if (CSS) { Rslt.HdStr += `<style>${CSS}</style>\n`; }

      Then(null, Rslt);
    });
}

/*
  @ Riot mixin instance.
  @ page config.
  < HTML header inner HTML string. */
function HeaderGet (RMI, PgCnfg) {
  const RMIPgSto = RMI.StoreGet('PAGE') || {},
        {
          title: Ttl,
          description: Dscrptn,
          keywords: Kywrds,
          author: Athr,
          favicon: Fvcn,
          feed: Fd } = { ...PgCnfg, ...RMIPgSto };

  let HdStr = '';

  if (Ttl) { HdStr += `<title>${Ttl}</title>\n`; }

  if (Dscrptn) { HdStr += `<meta name='description' content='${Dscrptn}'/>\n`; }

  if (Kywrds) { HdStr += `<meta name='keywords' content='${Kywrds}'/>\n`; }

  if (Athr) { HdStr += `<meta name='author' content='${Athr}'/>\n`; }

  if (Fvcn) { HdStr += `<link rel='icon' href='favicon.ico' type='${Fvcn}'/>\n`; }

  if (Fd) { HdStr += `<link rel='alternate' type='application/atom+xml' title='atom' href='${Fd}'/>\n`; }

  return HdStr;
}

/*
  @ HTTP request object.
  @ HTTP response object.
  @ path.
  @ page config object. */
function PageRespond (Rqst, Rspns, Pth, PgCnfg) {
  const { body: Bd } = PgCnfg;

  if (!Bd) {
    Log(Pth + '\ncan not handle the body for this path.', 'warn');
    Rspns.status(500);

    const Pg500 = ErrPg['500'] || null;

    if (Pg500) { PageRespond(Rqst, Rspns, Pth, Pg500); }
    else { Rspns.send('Error 500.'); }

    return -1;
  }

  Rqst.RMI = new RiotMixin(Rqst); // put RiotMixin instance into request object.

  riot.install(Cmpnt => { Rqst.RMI.Bind(Cmpnt); }); // bind RiotMixin functions to each component on server side rendering.

  function Then (Cd, Rslt) {
    const { css: Css, js: Js } = PgCnfg;
    let BdStrs = '',
        HdStrs = HeaderGet(Rqst.RMI, PgCnfg),
        ScrptStrs = Bd.type === 'riot' ? Rqst.RMI.StorePrint() : '';

    if (!Is.Array(Css)) { Log(Pth + '\npage config css is not an array.', 'warn'); }
    else {
      for (let i = 0; i < Css.length; i++) {
        const CssPth = Css[i];

        if (!Is.String(CssPth)) {
          Log('CSS path in page config is not a string.', 'warn');

          continue;
        }

        HdStrs += `<link rel='stylesheet' type='text/css' href='${CssPth}'/>\n`;
      }
    }

    if (!Is.Array(Js)) { Log(Pth + '\npage config js is not an array.', 'warn'); }
    else {
      for (let i = 0; i < Js.length; i++) {
        const JsPth = Js[i];

        if (!Is.String(JsPth)) {
          Log('Js path in page config is not a string.', 'warn');

          continue;
        }

        if (JsPth.substr(-5) === '.riot') { HdStrs += `<script type='riot' src='${JsPth}'></script>\n`; }
        else { HdStrs += `<script src='${JsPth}'></script>\n`; }
      }
    }

    if (Is.String(Rslt)) {
      BdStrs += Rslt;
    }
    else {
      const { HdStr, BdStr, ScrptStr } = Rslt;

      HdStrs += HdStr +
                '<script src=\'/riot.min.js\'></script>\n' +
                '<script type=\'module\' src=\'/hydrate.js\'></script>\n';
      BdStrs += BdStr;
      ScrptStrs += ScrptStr;
    }

    Rspns.writeHead(Rspns.statusCode, { 'Content-Type': 'text/html' });
    Rspns.write(
      "<!DOCTYPE HTML>\n<html>\n<head>\n<meta charset='utf-8'/>\n" +
      HdStrs +
      '</head>\n<body>\n' +
      BdStrs +
      ScrptStrs +
      '</body>\n</html>\n');
    Rspns.end();
  }

  switch (Bd.type) {
    case 'html':
      return HtmlRender(Bd, Then);

    case 'riot':
      return Riot4Render(Rqst, Bd, Then);
  }
}

/*
  @ HTTP request object.
  @ HTTP response object.
  @ service function. */
function ServiceRespond (Rqst, Rspns, Service) {
  Service(Rqst, Rspns, { Bd: Rqst.body, Url: Rqst.query, Fls: Rqst.file }, (Cd, RsltObj) => { // code, result object.
    if (Cd < 0) {
      Rspns.writeHead(400, { 'Content-Type': 'text/html' });
      Rspns.write(Is.String(RsltObj) ? RsltObj : 'error');
      Rspns.end();

      return -1;
    }

    if (!RsltObj) {
      Rspns.writeHead(204, { 'Content-Type': 'text/html' });
      Rspns.write('');
      Rspns.end();

      return 1;
    }

    if (Is.Function(RsltObj)) { // take over whole process to end.
      RsltObj(Rspns, () => { Rspns.end(); });

      return 2;
    }

    if (!Is.Object(RsltObj)) {
      Rspns.writeHead(200, { 'Content-Type': 'text/html' });
      Rspns.write(RsltObj);
      Rspns.end();

      return 3;
    }

    Rspns.writeHead(200, { 'Content-Type': 'application/json' });
    Rspns.write(JSON.stringify(RsltObj));
    Rspns.end();

    return 0;
  });
}

/* HTTP file respond. this should be the end action of a request.
  @ request object.
  @ response object.
  @ file path.
  @ expired second, default 1 hour (3600 seconds). */
function FileRespond (Rqst, Rspns, FlPth, ExprScd = 3600) {
  fs.stat(
    FlPth,
    (Err, St) => {
      const MmTp = MM_TP[path.extname(FlPth)] || 'text/plain';

      if (Err) {
        Rspns.writeHead(
          404,
          { 'Content-Type': MmTp,
            'Content-Length': 0 });
        Rspns.write('');
        Rspns.end();

        return;
      }

      const Expr = ExprScd.toString(), // expire seconds string.
            Mms = St.mtimeMs || (new Date(St.mtime)).getTime(), // mtime milisecond.
            IfMdfSnc = Rqst.headers['if-modified-since']; // if-modified-since.

      if (IfMdfSnc && IfMdfSnc !== 'Invalid Date') {
        const ChkdMs = (new Date(IfMdfSnc)).getTime(); // checked milisecond.

        if (Mms < ChkdMs) {
          Rspns.writeHead(
            304,
            { 'Content-Type': MmTp,
              'Cache-Control': 'public, max-age=' + Expr,
              'Last-Modified': IfMdfSnc });
          Rspns.write('\n');
          Rspns.end();

          return;
        }
      }

      const RdStrm = fs.createReadStream(FlPth); // ready stream.

      Rspns.writeHead(
        200,
        {
          'Cache-Control': 'public, max-age=' + Expr,
          'Content-Type': MmTp + '; charset=utf-8',
          'Last-Modified': (new Date(Mms + 1000)).toUTCString()
        });

      RdStrm.pipe(Rspns);
    });
}

function BodyParse (Rqst, Rspns, Next) {
  if (!Rqst.is('urlencoded', 'multipart')) { return Next(); } // don't handle without multipart.

  const BsBy = busboy({ headers: Rqst.headers, fileSize: 1024 * 1024 * 10, files: 100 }); // file size: 10mb.

  let Flds = {}, // body fields.
      Fls = []; // files.

  BsBy.on(
    'file',
    (Ky, FlStrm, FlNm) => { // key, file stream, file name, encoding, mine type.
      const DstFlPth = UpldFlPth + '/' + FlNm; // destination file path.

      FlStrm.pipe(fs.createWriteStream(DstFlPth));
      FlStrm.on('end', () => Fls.push(DstFlPth));
    });

  BsBy.on(
    'field',
    (Ky, Vl) => { // key, value, fieldnameTruncated, fieldnameTruncated, encoding, mimetype.
      if (Ky.substr(-2) !== '[]') {
        Flds[Ky] = Vl;

        return;
      }

      // ==== handle array type fields. ====

      const ArrKy = Ky.substr(0, Ky.length -2); // array key.

      if (!Object.prototype.hasOwnProperty.call(Flds, ArrKy)) { Flds[ArrKy] = [ Vl ]; }
      else { Flds[ArrKy].push(Vl); }
    });

  BsBy.on('filesLimit', () => { Log('upload file size is out of limitation.', 'warn'); });
  BsBy.on('finish', () => {
    Rqst.body = Flds;
    Rqst.file = Fls;

    Next();
  });
  Rqst.pipe(BsBy);
}

/*
  @ config object.
  @ extension. optional, can be js|ms. */
function Build (Cfg, Ext = 'js') {
  Log('build...');

  Ext = (Ext === 'mjs') ? 'mjs' : 'js';

  const Pgs = Object
    .values({ ...Cfg.page, ...Cfg.errorPage })
    .filter(Pg => Pg.body.type === 'riot');
  const Cmpnts = Pgs
    .map(Pg => Pg.body.component)
    .reduce(
      (Cmpnts, Cmpnt) => {
        if (!Cmpnts.includes(Cmpnt)) { Cmpnts.push(Cmpnt); }

        return Cmpnts;
      },
      []);

  Cmpnts.map(Cmpnt => {
    const FlPth = path.resolve(process.env.PWD, Cmpnt)
    const { ExprtDflt, Imprts, MdlsCd } = Riot4Compile2(FlPth, Ext, true),
          FlInfo = path.parse(FlPth); // file information.
    const Cd = Imprts.join('\n') + '\n\n' + MdlsCd.map(({ Cd }) => Cd).join('\n\n') + ExprtDflt + '\n',
          RE = `${FlInfo.name}\\.riot\\..+\\.m?js$`;
    const Hsh = crypto.createHash('shake256', { outputLength: 5 }).update(Cd).digest('hex'); // hash.
    const JsFlPth = FlPth.replace('.riot', `.riot.${Hsh}.${Ext}`);

    if (!fs.existsSync(JsFlPth)) {
      const OldJsFls = FilesFind(FlInfo.dir, new RegExp(RE));

      if (OldJsFls.length > 0) {
        OldJsFls.forEach(OldJsFl => { fs.unlinkSync(OldJsFl); }); // remove old Js files.
      }

      fs.writeFileSync(JsFlPth, Cd);
      Log(`${JsFlPth} compiled and saved.`);
    }

    const JsFlInfo = path.parse(JsFlPth);

    Pgs.forEach(Pg => {
      const PgFlInfo = path.parse(Pg.body.component);

      if (PgFlInfo.base !== FlInfo.base) { return; }

      Pg.body.componentJs = PgFlInfo.dir + '/' + JsFlInfo.base;
    });

    Cfg.route.push({
      path: new RegExp(JsFlInfo.base + '$'),
      type: 'resource',
      location: JsFlInfo.dir,
      nameOnly: true
    });

    return JsFlPth;
  });

  return this;
}

function Initialize (Cfg) {
  Log('initialize...');

  App.use(helmet({ contentSecurityPolicy: false })); // header handle for security.

  // === set up all config variables. ===

  ErrPg = Cfg.errorPage;
  Pg = Cfg.page;
  Rt = [
    // append necessary files.
    {
      path: /hydrate\.js$/,
      type: 'resource',
      location: './node_modules/@riotjs/hydrate',
      nameOnly: true
    },
    {
      path: /riot\.min\.js$/,
      type: 'resource',
      location: './node_modules/riot',
      nameOnly: true
    },
    {
      path: /RiotMixin\.js$/,
      type: 'resource',
      location: './node_modules/rzjs',
      nameOnly: true
    },
    ...Cfg.route ];
  SvcCs = Cfg.service.case || {};
  UpldFlPth = Cfg.uploadFilePath;

  Cfg.port && (Pt = Cfg.port);

  // ==== resource route. ====

  Rt.forEach(OneRt => {
    const {
      location: Lctn = '',
      nameOnly: NmOnly = false,
      path: Pth,
      type: Tp } = OneRt;

    if (!Pth || !Tp) {
      Log('the route case misses path or type.', 'error');

      return;
    }

    App.get(Pth, (Rqst, Rspns, Next) => {
      const { url: Url } = Rqst;
      let FlPth;

      switch (Tp) {
        case 'resource':
        case 'static': // static file response.
          if (!Lctn) {
            Log('the resource type route case ' + Url + ' misses the location or mime type.', 'warn');

            return;
          }

          FlPth = decodeURI(Url.charAt(0) === '/' ? Url.substr(1) : Url);
          FlPth = path.resolve(process.env.PWD, Lctn, NmOnly ? path.basename(FlPth) : FlPth);

          return FileRespond(Rqst, Rspns, FlPth);

        default:
          Next();
      }
    });
  });

  // ==== service route. ====

  const SvcCsEntrs = Object.entries(SvcCs); // service case entries.

  for (let i = 0; i < SvcCsEntrs.length; i++) {
    const [ Pth, Mthds ] = SvcCsEntrs[i],
          MthdsEntrs = Object.entries(Mthds);

    for (let j = 0; j < MthdsEntrs.length; j++) {
      const [ Mthd, Service ] = MthdsEntrs[j];

      if (App[Mthd]) {
        App[Mthd](Pth, BodyParse); // parse body for each service.
        App[Mthd](Pth, (Rqst, Rspns) => { ServiceRespond(Rqst, Rspns, Service) });
      }
    }
  }

  // ==== import riot components then set up page route. ====

  Object.entries(Pg).forEach(([ Pth, PgCnfg ]) => {
    const { body: Bd } = PgCnfg;

    if (!Bd.initialize) {
      Bd.initialize = (Rqst, Dt, Clbck) => Clbck(0, null);
    }

    if (Bd.type === 'html') {
      return App.get(Pth, (Rqst, Rspns) => PageRespond(Rqst, Rspns, Pth, PgCnfg));
    }

    import(path.resolve(process.env.PWD, Bd.componentJs)).then(Mdl => {
      Bd.module = Mdl.default;

      App.get(Pth, (Rqst, Rspns) => PageRespond(Rqst, Rspns, Pth, PgCnfg));
    });
  });

  // ==== 404 route. ====

  // App.use((Rqst, Rspns) => {
  //   const Pg404 = ErrPg['404'] || null;

  //   Rspns.status(404);

  //   if (Pg404) { PageRespond(Rqst, Rspns, Rqst.url, Pg404); }
  //   else { Rspns.send('Error 404.'); }
  // });

  return this;
}

function Run () {
  Log('run...');
  App.listen(Pt, () => { Log('server has started - 127.0.0.1:' + Pt.toString()); });
  Cch.RecycleRoll(10); // 10 minutes a round.

  return this;
}

export const RiotHttp = {
  Build,
  Initialize,
  Run
};

export default RiotHttp;
