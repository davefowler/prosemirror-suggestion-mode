import { build } from 'esbuild';
import glob from 'glob';

const entryPoints = glob.sync('examples/**/!(*.d).ts');

build({
  entryPoints,
  bundle: true,
  outdir: 'examples',
  format: 'esm',
  platform: 'browser',
  tsconfig: 'tsconfig.examples.json',
  resolveExtensions: ['.ts', '.js'],
  packages: 'external'
}).catch(() => process.exit(1)); 