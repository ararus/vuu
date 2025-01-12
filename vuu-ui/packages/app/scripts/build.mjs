import { formatBytes } from './utils.mjs';
import { build } from 'esbuild';

const entryPoints = ['index.jsx', 'features/simple-component.js'];
// const entryPoints = ['index.jsx'];
const outdir = 'public';

const stripOutdir = (file) => file.replace(RegExp(`^${outdir}/`), '');

(async function () {
  try {
    console.log('[BUILD]');
    const { metafile } = await build({
      bundle: true,
      entryPoints,
      format: 'esm',
      metafile: true,
      outdir,
      sourcemap: true,
      splitting: true
    }).catch(() => process.exit(1));

    entryPoints.forEach((fileName) => {
      const outJS = `${outdir}/${fileName.replace(/x$/, '')}`;
      const outCSS = outJS.replace(/js$/, 'css');
      const {
        outputs: { [outJS]: jsOutput, [outCSS]: cssOutput }
      } = metafile;
      console.log(`\t${stripOutdir(outJS)}:  ${formatBytes(jsOutput.bytes)}`);
      if (cssOutput) {
        console.log(`\t${stripOutdir(outCSS)}: ${formatBytes(cssOutput.bytes)}`);
      }
    });
  } catch (error) {
    console.error(error);
    process.exit((error && error.code) || 1); // properly exit with error code (useful for CI or chaining)
  }
})();
