import async from 'async';
import sass from 'node-sass';
import path from 'path';
import { compile, registerPreprocessor } from '@riotjs/compiler';

import Cch from './Cache.js';
import Log from '../Log.js';

registerPreprocessor(
  'css',
  'scss',
  (Cd, { Optns }) => {
    // const { file } = options;

    const Css = sass.renderSync({ data: Cd }).css.toString()
      .replace(/\n +/g, ' ')
      .replace(/\n\n/g, '\n')
      .replace(/\}/g, '}\n')
      .replace(/\n /g, '\n')
      .replace(/ > /g, '>');

    return { code: Css, map: null };
  });

function SourceCodeSplit (SrcCd) {
  if (!SrcCd) { return []; }

  let Cds = [];

  while (SrcCd.length > 0) {
    let TgInfo = SrcCd.match(/<([^/<>]+)>\n/); // tag info.

    if (!TgInfo || !TgInfo[1]) { break; }

    let [ TgNm, ...Optns ] = TgInfo[1].split(' '); // tag name, options.

    // ==== handle partial code ====

    const StTg = `<${TgNm}>`, // start tag.
          EndTg = `</${TgNm}>`, // end tag.
          EndIdx = SrcCd.indexOf(EndTg) + EndTg.length, // end index.
          Cd = SrcCd.substring(SrcCd.indexOf(StTg), EndIdx);

    // name in Js code will be from tag name with camel case.
    let Nm = TgNm.replace(/-\w/g, Str => Str.substr(1).toUpperCase());

    Cds.push({ Nm, Cd });

    SrcCd = SrcCd.substr(EndIdx);
  }

  return Cds;
}

function Riot4ModulesCompile (FlPth, Then) {
  Cch.FileLoad(
    FlPth,
    (ErrCd, SrcCd, Dt) => { // error code, source code, cached date.
      if (ErrCd < 0) {
        Log('cache file load failed: ' + ErrCd + ' ' + FlPth, 'error');

        return Then(-1, []);
      }

      SrcCd = SrcCd
        .replace(/<!--[\s\S]+?-->/g, '') // trim all HTML comments.
        .replace(/\/\/ ?import .+ from .+/g, ''); // trim comment import.

      // ==== get all 'import ... from ...;' and remove them from source code. ====

      let Mdls = SrcCd.match(/import .+ from .+;\n/g) || [], // modules.
          Tsks = [];

      SrcCd = SrcCd.replace(/import .+ from .+;\n/g, '');

      // ====

      // prepare import components compiling tasks.
      Tsks = Mdls
        .filter((Itm, Idx) => Mdls.indexOf(Itm) === Idx) // filter duplicate modules.
        .map(Mdl => {
          const [ , Nm, Pth ] = Mdl.match(/import (.+) from '(.+)';/);

          // non riot import handling.
          if (Pth.substr(-5) !== '.riot') {
            return Done => Done(null, { [Nm]: { Nm, Pth }});
          }

          return Done => {
            Riot4ModulesCompile(
              path.dirname(FlPth) + '/' + Pth, // handle module path.
              (ErrCd, RsltMdls) => {
                if (ErrCd < 0) {
                  Log('can not do Riot4ModulesCompile. error code: ' + ErrCd, 'error');

                  return Done(ErrCd);
                }

                Done(null, RsltMdls);
              });
          };
        });

      async.parallel(
        Tsks,
        (Err, Mdls) => {
          if (Err) {
            Log(Err, 'error');

            return Then(-2, []);
          }

          let RsltMdls = {}; // packed Js module codes.

          Mdls.map(Mdl => { Object.assign(RsltMdls, Mdl); });

          // ==== compile separated component, and combine them after parse. ====

          SourceCodeSplit(SrcCd).map(({ Nm, Cd }) => {
            if (RsltMdls[Nm]) { return ; }

            // console.log('---- 001 ----');
            // console.log(Nm);
            // console.log(Cd);

            RsltMdls[Nm] = compile(Cd).code.replace('export default', Nm + ' ='); // trim 'export default'.
          }); // adjust compiled code to be ready for becoming a single Js module.

          Then(0, RsltMdls);
        });
    });
}

/* compile riot 4 component file with some more feature support.
  @ file path.
  @ type, can be 'node' or 'esm', default 'esm'.
  @ callback function (error code, code string). */
function Riot4Compile (FlPth, Tp = 'esm', Then) {
  const CchKy = `${FlPth}-${Tp}`;

  if (Cch.Has(CchKy)) { return Then(1, Cch.Get(CchKy)); }

  Riot4ModulesCompile(
    FlPth,
    (ErrCd, Mdls) => {
      const KyVPrs = Object.entries(Mdls);

      let RiotMdlCd = '', // Riot module code.
          RiotMdlKys = [], // Riot module keys.
          JsMdlCd = ''; // Js module code.

      for (let i = 0; i < KyVPrs.length; i++) {
        const [ Ky, V ] = KyVPrs[i];

        if (typeof V === 'object') {
          const { Nm, Pth } = V;

          JsMdlCd += (Tp === 'node') ?
            `const ${Nm} = require('${Pth}');\n` :
            `import ${Nm} from '${Pth}';\n`;
        }
        else {
          RiotMdlCd += V + '\n\n';
          RiotMdlKys.push(Ky);
        }
      }

      let RsltCd =
        JsMdlCd + '\n' +
        'let ' + RiotMdlKys.join(', ') + ';\n\n' +
        RiotMdlCd;

      RsltCd += (Tp === 'node') ?
        ('\nmodule.exports.default = ' + RiotMdlKys.pop() + ';\n') :
        ('\nexport default ' + RiotMdlKys.pop() + ';\n');

      Then(0, RsltCd);
      Cch.Set(CchKy, RsltCd, 60 * 60 * 24);
    });
}

export default Riot4Compile;
