import async from 'async';
import busboy from 'busboy';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import requireFromString from 'require-from-string';
import riot from 'riot';
import ssr from '@riotjs/ssr';
import { fileURLToPath } from 'url';

import Cache from './Cache.js';
import Is from '../Is.js';
import Log from '../Log.js';
import Riot4Compile from './Riot4Compile.js';
import RiotMixin from '../RiotMixin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Cch = Cache;

const MM_TP = {
  '.bmp':  'image/x-windows-bmp',
  '.css':  'text/css',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.jpg':  'image/jpeg',
  '.js':   'application/javascript',
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
    Riot3Url = 'https://cdn.jsdelivr.net/npm/riot@3.13/riot+compiler.min.js',
    Riot4Url = 'https://unpkg.com/riot@4/riot+compiler.min.js',
    Rt = [], // route.
    SvcCs = {}, // service case.
    SvcPthPtrm = null, // service path patterm.
    UpldFlPth; // uploaded file path.

const App = express();

/*
  @ body file.
  @ callback function. */
function HtmlRender (BdFl, Then) {
  Cch.FileLoad(
    BdFl,
    (Err, FlStr) => { // error, file string.
      if (Err < 0) {
        Then('FileLoad', '<!-- can not load this component. -->');
        Log(`FileLoad(${Err}) - ${BdFl} - load file failed.`, 'error');

        return;
      }

      Then(null, FlStr);
    });
}

/*
  @ body info object.
  @ async callback function. (error, result)
    @ error.
    @ result object. ()
      @ riot version.
      @ head string.
      @ body string.
      @ script string. */
function Riot3Render (Rqst, Bd, Then) {
  const
    { component: Cmpnt, initialize: Initialize = null } = Bd,
    { base: Bs, ext: Ext, name: Nm } = path.parse(Cmpnt); // path info.

  let Rslt = { // result.
    RiotVrsn: 3, // riot version.
    HdStr: `<script type='riot/tag' src='${Bs}'></script>\n`, // head string.
    BdStr: `<${Nm}><!-- this will be replaced by riot.mount. --></${Nm}>\n`, // body string.
    ScrptStr: `<script>\nriot.mixin('Z.RM', Z.RM);\nriot.compile(() => { riot.mount('${Nm}'); });\n</script>\n` // script stream.
  };

  if (!Initialize || !Is.Function(Initialize)) { return Then(null, Rslt); }

  Initialize(
    Rqst,
    {},
    (Cd, Dt) => {
      if (Cd < 0) {
        Rslt.HdStr = '';
        Rslt.BdStr = `<!-- can not render '${Nm}' component. -->\n`;
        Rslt.ScrptStr = '';

        return Then(null, Rslt);
      }

      const Jsn = JSON.stringify(Dt);

      Rslt.ScrptStr = `<script>\nriot.mixin('Z.RM', Z.RM);\nriot.compile(() => { riot.mount('${Nm}', ${Jsn}); });\n</script>\n`;

      Then(null, Rslt);
    });
}

function Riot4Render (Rqst, Bd, Then) {
  const
    { component: Cmpnt, initialize: Initialize = null } = Bd,
    { base: Bs, ext: Ext, name: Nm } = path.parse(Cmpnt); // path info.

  Riot4Compile(
    Bd.component,
    'node',
    (ErrCd, Cd) => {
      if (ErrCd < 0) {
        Log('riot 4 compile+ failed: ' + ErrCd, 'error');

        return Then(null, '');
      }

      const Cmpnts = requireFromString(Cd, __dirname + '/' + Bd.component),
            Cmpnt = Cmpnts.default,
            MdlNm = Nm.replace(/-\w/g, Str => Str.substr(1).toUpperCase()); // module name.

      let Rslt = { // result.
        RiotVrsn: 4, // riot version.
        HdStr: '', // head string.
        BdStr: '', // body string.
        ScrptStr: '' // script stream.
      };

      if (!Bd.initialize || !Is.Function(Bd.initialize)) {
        const { html: HTML, css: CSS } = ssr.fragments(Nm, Cmpnt, {});

        Rslt.BdStr = HTML + '\n';
        Rslt.ScrptStr = `<script type='module'>\nimport ${MdlNm} from '/${Bs}';\nconst ${MdlNm}Shell = hydrate(${MdlNm});\n${MdlNm}Shell(document.querySelector('${Nm}'));\n</script>\n`;

        if (CSS) { Rslt.HdStr += `<style>${CSS}</style>\n`; }

        return Then(null, Rslt);
      }

      Bd.initialize(
        Rqst,
        {},
        (Cd, Dt) => {
          if (Cd < 0) { return Then(null, `<!-- can not render '${Nm}' component. -->`); }

          const { html: HTML, css: CSS } = ssr.fragments(Nm, Cmpnt, Dt);

          Rslt.BdStr = HTML + '\n';
          Rslt.ScrptStr = `<script type='module'>\nimport ${MdlNm} from '/${Bs}';\nconst ${MdlNm}Shell = hydrate(${MdlNm});\n${MdlNm}Shell(document.querySelector('${Nm}'));\n</script>\n`;

          if (CSS) { Rslt.HdStr += `<style>${CSS}</style>\n`; }

          Then(null, Rslt);
        });
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

  if (!Bd || !Is.Array(Bd)) {
    Log(Pth + '\ncan not handle the body for this path.', 'warn');
    Rspns.status(500);

    const Pg500 = ErrPg['500'] || null;

    if (Pg500) { PageRespond(Rqst, Rspns, Pth, Pg500); }
    else { Rspns.send('Error 500.'); }

    return -1;
  }

  Rqst.RMI = new RiotMixin(Rqst); // put RiotMixin instance into request object.

  riot.install(Cmpnt => { Rqst.RMI.Bind(Cmpnt); }); // bind RiotMixin functions to each component on server side rendering.

  async.map(
    Bd,
    (Bd, Then) => {
      const Tp = typeof Bd;

      if (Tp === 'string') {
        const { ext: Ext } = path.parse(Bd); // path info.

        switch (Ext) {
          case '.tag':
            return Riot3Render(Rqst, { component: Bd }, Then);

          case '.riot':
            return Riot4Render(Rqst, { component: Bd }, Then);

          case '.html':
          default:
            return HtmlRender(Bd, Then);
        }
      }

      if (Tp === 'object' && Bd.component && Is.String(Bd.component)) {
        const { ext: Ext } = path.parse(Bd.component); // path info.

        if (Ext === '.tag') {
          return Riot3Render(Rqst, Bd, Then);
        }
        else if (Ext === '.riot') {
          return Riot4Render(Rqst, Bd, Then);
        }
      }

      Log('do not know how to deal this component.', 'error');
      Then(null, '<!-- can not render this component. -->');
    },
    (Err, Rslts) => {
      const { css: Css, js: Js } = PgCnfg;
      let BdStrs = '',
          HdStrs = HeaderGet(Rqst.RMI, PgCnfg),
          ScrptStrs = Rqst.RMI.StorePrint();

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

          const { ext: Ext } = path.parse(JsPth);

          if (Ext === '.tag') { HdStrs += `<script type='riot/tag' src='${JsPth}'></script>\n`; }
          else if (Ext === '.riot') { HdStrs += `<script type='riot' src='${JsPth}'></script>\n`; }
          else { HdStrs += `<script src='${JsPth}'></script>\n`; }
        }
      }

      let FnlRiotVrsn = 3;

      for (let i = 0; i < Rslts.length; i++) {
        const Rslt = Rslts[i];

        if (Is.String(Rslt)) {
          BdStrs += Rslt;

          continue;
        }

        const { RiotVrsn, HdStr, BdStr, ScrptStr } = Rslt;

        FnlRiotVrsn = Math.max(FnlRiotVrsn, RiotVrsn);
        HdStrs += HdStr;
        BdStrs += BdStr;
        ScrptStrs += ScrptStr;
      }

      if (FnlRiotVrsn === 3) {
        HdStrs = `<script src='${Riot3Url}'></script>\n${HdStrs}`;
      }
      else {
        HdStrs += `<script src='${Riot4Url}'></script>\n` +
                  '<script type=\'module\' src=\'/hydrate.js\'></script>\n';
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
    });
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

/* Riot 4 component Js respond. this should be the end action of a request.
  @ request object.
  @ response object.
  @ file path.
  @ expired second, default 1 hour (3600 seconds). */
function Riot4ComponentJsRespond (Rqst, Rspns, FlPth, ExprScd = 3600) {
  const Expr = ExprScd.toString(), // expire seconds string.
        { base: Bs, ext: Ext } = path.parse(FlPth),
        MmTp = MM_TP[Ext] || 'text/plain';

  if (Cch.Has(Bs)) {
    const Js = Cch.Get(Bs);
    let IfMdfSnc = Rqst.headers['if-modified-since']; // if-modified-since.

    if (!IfMdfSnc || IfMdfSnc === 'Invalid Date') {
      IfMdfSnc = (new Date()).toUTCString();
    }

    Rspns.writeHead(
      200,
      { 'Cache-Control': 'public, max-age=' + Expr,
        'Content-Length': Js.length,
        'Content-Type': MmTp,
        'Last-Modified': IfMdfSnc });
    Rspns.write(Js);
    Rspns.end();

    return;
  }

  Riot4Compile(
    FlPth,
    'esm',
    (ErrCd, Cd) => { // error code, code string.
      if (ErrCd < 0) {
        Rspns.writeHead(
          500,
          { 'Content-Type': MmTp,
            'Content-Length': 0 });
        Rspns.write('');
        Rspns.end();
        Log('can not compile Riot4 component file. ' + ErrCd, 'error');

        return;
      }

      Rspns.writeHead(
        200,
        { 'Cache-Control': 'public, max-age=' + Expr,
          // 'Content-Length': Cd.length, // Cd.length is not precise if there has non ASCII characters.
          'Content-Type': MmTp,
          'Last-Modified': (new Date()).toUTCString() });
      Rspns.write(Cd);
      Rspns.end();
    });
}

function BodyParse (Rqst, Rspns, Next) {
  if (!Rqst.is('urlencoded', 'multipart')) { return Next(); } // don't handle without multipart.

  const BsBy = new busboy({ headers: Rqst.headers, fileSize: 1024 * 1024 * 10, files: 100 }); // file size: 10mb.

  let Flds = {}, // body fields.
      Fls = []; // files.

  BsBy.on(
    'file',
    (Ky, FlStrm, FlNm, Encd, Mmtp) => { // key, file stream, file name, encoding, mine type.
      const DstFlPth = UpldFlPth + '/' + FlNm; // destination file path.

      FlStrm.pipe(fs.createWriteStream(DstFlPth));
      FlStrm.on('end', () => Fls.push(DstFlPth));
    });

  BsBy.on(
    'field',
    (Ky, Vl, FldnmTrnct, VlTrnct, VlTruncated, Encd, Mmtp) => { // key, value, fieldnameTruncated, fieldnameTruncated, encoding, mimetype.
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

function Initialize (Cfg) {
  App.use(helmet({ contentSecurityPolicy: false })); // header handle for security.

  // === set up all config variables. ===

  ErrPg = Cfg.errorPage;
  Pg = Cfg.page;
  Rt = [
    // append necessary files.
    { path: /hydrate\.js$/, type: 'resource', location: './node_modules/rzjs/node_modules/@riotjs/hydrate' },
    { path: /riot\.min\.js$/, type: 'resource', location: './node_modules/rzjs/node_modules/riot' },
    { path: /RiotMixin.js$/, type: 'resource', location: './node_modules/rzjs' },
    ...Cfg.route ];
  SvcCs = Cfg.service.case || {};
  SvcPthPtrm = Cfg.service.pathPatterm || null;
  UpldFlPth = Cfg.uploadFilePath;

  Cfg.port && (Pt = Cfg.port);
  Cfg.riot3 && (Riot3Url = Cfg.riot3);
  Cfg.riot4 && (Riot4Url = Cfg.riot4);

  // ==== resource route. ====

  for (let i = 0; i < Rt.length; i++) {
    const {
      location: Lctn = '',
      nameOnly: NmOnly = false,
      path: Pth,
      type: Tp } = Rt[i];

    if (!Pth || !Tp) {
      Log('the route case misses path or type.', 'error');

      continue;
    }

    App.get(Pth, (Rqst, Rspns, Next) => {
      const { url: Url } = Rqst;
      let FlPth;

      switch (Tp) {
        case 'resource':
        case 'riot4js':
        case 'static': // static file response.
          if (!Lctn) {
            Log('the resource type route case ' + Url + ' misses the location or mime type.', 'warn');

            return;
          }

          FlPth = decodeURI(Url.charAt(0) === '/' ? Url.substr(1) : Url);
          FlPth = path.resolve(process.env.PWD, Lctn, NmOnly ? path.basename(FlPth) : FlPth);

          return Tp === 'riot4js' ? Riot4ComponentJsRespond(Rqst, Rspns, FlPth) : FileRespond(Rqst, Rspns, FlPth);

        default:
          Next();
      }
    });
  }

  // ====

  App.use(SvcPthPtrm, BodyParse); // parse body for all services.

  // ==== service route. ====

  const SvcCsEntrs = Object.entries(SvcCs); // service case entries.

  for (let i = 0; i < SvcCsEntrs.length; i++) {
    const [ Pth, Mthds ] = SvcCsEntrs[i],
          MthdsEntrs = Object.entries(Mthds);

    for (let j = 0; j < MthdsEntrs.length; j++) {
      const [ Mthd, Service ] = MthdsEntrs[j];

      App[Mthd] && App[Mthd](Pth, (Rqst, Rspns) => ServiceRespond(Rqst, Rspns, Service));
    }
  }

  // ==== page route. ====

  const Pgs = Object.entries(Pg);

  for (let i = 0; i < Pgs.length; i++) {
    const [ Pth, PgCnfg ] = Pgs[i];

    App.get(Pth, (Rqst, Rspns) => PageRespond(Rqst, Rspns, Pth, PgCnfg));
  }

  // ==== 404 route. ====

  App.use((Rqst, Rspns) => {
    const Pg404 = ErrPg['404'] || null;

    Rspns.status(404);

    if (Pg404) { PageRespond(Rqst, Rspns, Rqst.url, Pg404); }
    else { Rspns.send('Error 404.'); }
  });

  return this;
}

function Run () {
  App.listen(Pt, () => { Log('server has started - 127.0.0.1:' + Pt.toString()); });
  Cch.RecycleRoll(10); // 10 minutes a round.

  return this;
}

export const RiotHttp = {
  Initialize,
  Run
};

export default RiotHttp;
