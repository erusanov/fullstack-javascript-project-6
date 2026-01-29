import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mode = process.env.NODE_ENV || 'development';

export default {
  mode,
  target: 'node',
  entry: './index.js',
  output: {
    filename: 'main.cjs',
    path: path.resolve(__dirname, 'dist'),
  },
  externalsPresets: { node: true },
  externals: {
    'better-sqlite3': 'commonjs better-sqlite3',
    mysql: 'commonjs mysql',
    mysql2: 'commonjs mysql2',
    oracledb: 'commonjs oracledb',
    'pg-native': 'commonjs pg-native',
    'pg-query-stream': 'commonjs pg-query-stream',
    tedious: 'commonjs tedious',
    sqlite3: 'commonjs sqlite3',
    'sodium-native': 'commonjs sodium-native',
    bcrypt: 'commonjs bcrypt',
  },
};
